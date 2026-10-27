/* ==========================================================================
   Local Sole — search.js
   Live header search with fuzzy matching, keyboard navigation, recent
   searches, highlighted matches and helpful empty states.
   ========================================================================== */

window.LS = window.LS || {};

LS.search = (() => {
  const RECENT_KEY = "ls_recent_searches_v1";
  const MAX_RECENT = 6;
  const GENERIC = new Set(["shoe", "shoes", "footwear", "pair", "pairs", "buy", "online", "store", "shop", "the", "a", "for"]);

  const SYNONYMS = {
    kicks: ["sneakers"],
    trainers: ["sneakers"],
    sneaker: ["sneakers"],
    runners: ["running"],
    jogging: ["running"],
    joggers: ["running"],
    chappals: ["sandals"],
    chappal: ["sandals"],
    sliders: ["sandals"],
    slippers: ["sandals"],
    heels: ["formal", "women"],
    heel: ["formal", "women"],
    wedges: ["formal", "women"],
    wedding: ["formal"],
    office: ["formal"],
    school: ["kids"],
    children: ["kids"],
    child: ["kids"],
    boys: ["kids", "men"],
    girls: ["kids", "women"],
    gym: ["sports", "running"],
    training: ["sports"],
    walking: ["casual"],
    cheap: ["sale"],
    discount: ["sale"],
    sale: ["discount"],
    waterproof: ["boots"],
    hiking: ["boots", "trail"],
    trekking: ["boots"],
    black: ["black"],
    white: ["white"],
    brown: ["tan", "cognac"],
    leather: ["leather"],
    comfortable: ["casual"],
    comfort: ["casual"]
  };

  const POPULAR = ["Sneakers", "Running shoes", "White sneakers", "Formal", "Kids", "Boots", "Under ₹3,000"];
  let recent = LS.ui.store(RECENT_KEY, []).filter((item) => typeof item === "string").slice(0, MAX_RECENT);
  let results = [];
  let activeIndex = -1;
  let input, panel, form, clearBtn;

  function normalise(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      }
      previous = current;
    }
    return previous[b.length];
  }

  function expandToken(token) {
    const expansions = [token];
    if (SYNONYMS[token]) expansions.push(...SYNONYMS[token]);
    return expansions;
  }

  function tokenMatch(token, target) {
    if (!target) return 0;
    if (target === token) return 1;
    if (target.includes(token)) return token.length >= 3 ? 0.92 : 0.7;
    if (token.length >= 3 && target.startsWith(token.slice(0, Math.max(3, token.length - 1)))) return 0.78;
    const distance = levenshtein(token, target);
    const tolerance = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0;
    if (distance <= tolerance) return 0.68 - distance * 0.08;
    return 0;
  }

  function fieldScore(queryTokens, text, weight) {
    const target = normalise(text);
    if (!target) return 0;
    const targetTokens = target.split(" ");
    let total = 0;
    queryTokens.forEach((original) => {
      const variants = expandToken(original);
      let best = 0;
      variants.forEach((variant) => {
        if (target === variant) best = Math.max(best, 1);
        if (target.includes(variant)) best = Math.max(best, 0.95);
        targetTokens.forEach((candidate) => {
          best = Math.max(best, tokenMatch(variant, candidate));
        });
      });
      total += best;
    });
    return total * weight;
  }

  function productScore(product, tokens, phrase) {
    const shop = LS.data.shopById(product.shopId);
    let score = 0;
    score += fieldScore(tokens, product.name, 8);
    score += fieldScore(tokens, product.brand, 6);
    score += fieldScore(tokens, product.type, 4);
    score += fieldScore(tokens, product.category, 2.5);
    score += fieldScore(tokens, (product.tags || []).join(" "), 3);
    score += fieldScore(tokens, (product.colors || []).map((c) => c.name).join(" "), 2.5);
    score += fieldScore(tokens, product.material, 1.4);
    score += fieldScore(tokens, shop ? `${shop.name} ${shop.area}` : "", 2);
    score += fieldScore(tokens, product.description, 0.7);
    if (phrase) {
      if (normalise(product.name).includes(phrase)) score += 22;
      if (normalise(`${product.brand} ${product.name}`).includes(phrase)) score += 12;
    }
    // Top-rated items float up when scores are otherwise close.
    score += Number(product.rating) * 0.6;
    if (product.isBestSeller) score += 1.2;
    return score;
  }

  function shopScore(shop, tokens, phrase) {
    let score = 0;
    score += fieldScore(tokens, shop.name, 8);
    score += fieldScore(tokens, `${shop.area} ${shop.city}`, 5);
    score += fieldScore(tokens, (shop.specialties || []).join(" "), 3);
    score += fieldScore(tokens, shop.description, 0.8);
    if (phrase && normalise(shop.name).includes(phrase)) score += 20;
    return score;
  }

  function tokenise(query) {
    return normalise(query).split(" ").filter((token) => token && !GENERIC.has(token));
  }

  function searchAll(query, limit = 12) {
    const tokens = tokenise(query);
    const phrase = normalise(query);
    if (!tokens.length) return { products: [], shops: [], brands: [], tokens, emptyQuery: true };
    const products = LS.data.products
      .map((product) => ({ product, score: productScore(product, tokens, phrase) }))
      .filter((item) => item.score > 4)
      .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
      .slice(0, limit)
      .map((item) => item.product);
    const shops = LS.data.shops
      .map((shop) => ({ shop, score: shopScore(shop, tokens, phrase) }))
      .filter((item) => item.score > 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.shop);
    const brands = LS.data.brands()
      .map((brand) => {
        const score = fieldScore(tokens, brand, 4);
        return { brand, score };
      })
      .filter((item) => item.score > 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.brand);
    return { products, shops, brands, tokens, emptyQuery: false };
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(text, tokens) {
    const safe = LS.ui.escapeHtml(text);
    if (!tokens || !tokens.length) return safe;
    const variants = new Set();
    tokens.forEach((token) => {
      expandToken(token).forEach((variant) => {
        if (variant.length >= 2) variants.add(variant);
      });
    });
    const sorted = [...variants].sort((a, b) => b.length - a.length);
    if (!sorted.length) return safe;
    const pattern = sorted.map(escapeRegExp).join("|");
    try {
      return safe.replace(new RegExp(`(${pattern})`, "gi"), "<mark>$1</mark>");
    } catch {
      return safe;
    }
  }

  function saveRecent(query) {
    const clean = query.trim();
    if (!clean) return;
    recent = [clean, ...recent.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENT);
    LS.ui.save(RECENT_KEY, recent);
  }

  function updateClearButton() {
    if (clearBtn) clearBtn.hidden = !input.value;
  }

  function setExpanded(expanded) {
    input.setAttribute("aria-expanded", String(expanded));
    panel.hidden = !expanded;
    if (!expanded) {
      activeIndex = -1;
      input.removeAttribute("aria-activedescendant");
    }
  }

  function renderPanel() {
    const query = input.value.trim();
    updateClearButton();
    if (!query) {
      results = [];
      panel.innerHTML = `
        ${recent.length ? `<div class="search-section">
          <div class="search-section-label"><span>Recent searches</span><button type="button" class="search-clear-recent" style="font-size:.62rem;text-decoration:underline">Clear</button></div>
          <div class="search-chips">${recent.map((item) => `<button type="button" class="search-chip" data-recent="${LS.ui.escapeHtml(item)}">${LS.ui.icon("clock", 11)} ${LS.ui.escapeHtml(item)}</button>`).join("")}</div>
        </div>` : ""}
        <div class="search-section">
          <div class="search-section-label"><span>Popular right now</span><span>${LS.ui.icon("sparkle", 11)}</span></div>
          <div class="search-chips">
            ${POPULAR.map((item, index) => `<button type="button" class="search-chip" data-popular="${index}">${LS.ui.escapeHtml(item)}</button>`).join("")}
          </div>
        </div>
        <div class="search-section">
          <div class="search-section-label"><span>Shop by neighbourhood</span><a href="shops.html" style="text-decoration:underline">All shops</a></div>
          <div class="search-chips">
            ${LS.data.shops.slice(0, 4).map((shop) => `<a class="search-chip" href="shop.html?id=${encodeURIComponent(shop.id)}">${LS.ui.icon("pin", 11)} ${LS.ui.escapeHtml(shop.area)}</a>`).join("")}
          </div>
        </div>`;
      setExpanded(true);
      bindPanelControls();
      return;
    }

    const { products, shops, brands, tokens } = searchAll(query, 6);
    results = [];
    let html = "";

    if (products.length) {
      html += `<div class="search-section">
        <div class="search-section-label"><span>Products</span><span>${products.length} shown</span></div>
        ${products.map((product) => {
          const index = results.push({ type: "product", href: `product.html?id=${encodeURIComponent(product.id)}` }) - 1;
          const shop = LS.data.shopById(product.shopId);
          return `<a class="search-result" role="option" aria-selected="false" id="search-option-${index}" data-search-index="${index}" href="${results[index].href}">
            <img class="search-result-img" src="${LS.ui.escapeHtml(product.images[0])}" alt="" width="46" height="46" loading="lazy">
            <span class="search-result-main">
              <span class="search-result-title">${highlight(product.name, tokens)}</span>
              <span class="search-result-meta">${highlight(product.brand, tokens)} · ${product.type} · ${LS.ui.escapeHtml(shop?.shortName || "")}</span>
            </span>
            <span class="search-result-price">${LS.ui.money.fmt(product.price)}</span>
          </a>`;
        }).join("")}
      </div>`;
    }

    if (brands.length) {
      html += `<div class="search-section">
        <div class="search-section-label"><span>Brands</span></div>
        ${brands.map((brand) => {
          const index = results.push({ type: "brand", href: `products.html?brand=${encodeURIComponent(brand)}` }) - 1;
          return `<a class="search-result" role="option" aria-selected="false" id="search-option-${index}" data-search-index="${index}" href="${results[index].href}">
            <span class="search-result-icon">${LS.ui.icon("tag", 18)}</span>
            <span class="search-result-main"><span class="search-result-title">${highlight(brand, tokens)}</span><span class="search-result-meta">All ${LS.ui.escapeHtml(brand)} styles</span></span>
            <span class="search-result-price" aria-hidden="true">${LS.ui.icon("arrowRight", 14)}</span>
          </a>`;
        }).join("")}
      </div>`;
    }

    if (shops.length) {
      html += `<div class="search-section">
        <div class="search-section-label"><span>Local shops</span></div>
        ${shops.map((shop) => {
          const index = results.push({ type: "shop", href: `shop.html?id=${encodeURIComponent(shop.id)}` }) - 1;
          return `<a class="search-result" role="option" aria-selected="false" id="search-option-${index}" data-search-index="${index}" href="${results[index].href}">
            <img class="search-result-img" src="${LS.ui.escapeHtml(shop.logo)}" alt="" width="46" height="46">
            <span class="search-result-main">
              <span class="search-result-title">${highlight(shop.name, tokens)}</span>
              <span class="search-result-meta">${highlight(shop.area, tokens)} · ${LS.ui.escapeHtml(shop.tagline)}</span>
            </span>
            <span class="search-result-price" aria-hidden="true">${LS.ui.icon("arrowUpRight", 14)}</span>
          </a>`;
        }).join("")}
      </div>`;
    }

    if (!products.length && !brands.length && !shops.length) {
      const alt = LS.data.products
        .filter((p) => ["sneakers", "running", "formal"].includes(p.type))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2);
      html = `<div class="search-empty">
        ${LS.ui.icon("search", 30)}
        <p><strong>No matches for “${LS.ui.escapeHtml(query)}”.</strong><br>Try a broader word, or one of these.</p>
        <div class="search-chips" style="justify-content:center;margin-top:10px">
          ${["sneakers", "running", "formal", "kids"].map((term) => `<button class="search-chip" type="button" data-suggestion="${term}">${term}</button>`).join("")}
        </div>
        <div style="margin-top:16px;text-align:left">
          <div class="search-section-label">Popular alternatives</div>
          ${alt.map((p, i) => {
            const index = results.push({ type: "product", href: `product.html?id=${encodeURIComponent(p.id)}` }) - 1;
            return `<a class="search-result" role="option" aria-selected="false" id="search-option-${index}" data-search-index="${index}" href="${results[index].href}">
              <img class="search-result-img" src="${LS.ui.escapeHtml(p.images[0])}" alt="" width="46" height="46" loading="lazy">
              <span class="search-result-main"><span class="search-result-title">${LS.ui.escapeHtml(p.name)}</span><span class="search-result-meta">${p.brand} · ${p.type}</span></span>
              <span class="search-result-price">${LS.ui.money.fmt(p.price)}</span>
            </a>`;
          }).join("")}
        </div>
      </div>`;
    } else {
      html += `<a class="search-footer-link" href="products.html?q=${encodeURIComponent(query)}">See all results for “${LS.ui.escapeHtml(query)}” ${LS.ui.icon("arrowRight", 13)}</a>`;
    }

    panel.innerHTML = html;
    setExpanded(true);
    bindPanelControls();
  }

  function bindPanelControls() {
    panel.querySelectorAll("[data-recent]").forEach((btn) => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.recent;
        renderPanel();
        input.focus();
      });
    });
    panel.querySelectorAll("[data-popular]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const term = POPULAR[Number(btn.dataset.popular)];
        input.value = term;
        renderPanel();
        input.focus();
      });
    });
    panel.querySelectorAll("[data-suggestion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.suggestion;
        renderPanel();
        input.focus();
      });
    });
    const clearRecent = panel.querySelector(".search-clear-recent");
    if (clearRecent) {
      clearRecent.addEventListener("click", () => {
        recent = [];
        LS.ui.save(RECENT_KEY, recent);
        renderPanel();
        input.focus();
      });
    }
    panel.querySelectorAll(".search-result").forEach((link) => {
      link.addEventListener("click", () => {
        saveRecent(input.value.trim());
      });
    });
  }

  function moveActive(direction) {
    const links = [...panel.querySelectorAll(".search-result")];
    if (!links.length) return;
    activeIndex = (activeIndex + direction + links.length) % links.length;
    links.forEach((link, i) => {
      link.classList.toggle("is-active", i === activeIndex);
      link.setAttribute("aria-selected", String(i === activeIndex));
    });
    const active = links[activeIndex];
    input.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
  }

  function handleKeydown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (panel.hidden) renderPanel();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Enter") {
      if (!panel.hidden && activeIndex > -1) {
        const links = [...panel.querySelectorAll(".search-result")];
        const active = links[activeIndex];
        if (active) {
          event.preventDefault();
          saveRecent(input.value.trim());
          window.location.href = active.href;
          return;
        }
      }
      if (input.value.trim()) saveRecent(input.value.trim());
      setExpanded(false);
    } else if (event.key === "Escape") {
      setExpanded(false);
      closeMobileSearch();
    }
  }

  function openMobileSearch() {
    const wrapper = document.getElementById("headerSearch");
    const btn = document.querySelector("[data-search-open]");
    if (!wrapper) return;
    wrapper.classList.add("is-open");
    btn?.setAttribute("aria-expanded", "true");
    setTimeout(() => input.focus(), 80);
    renderPanel();
  }

  function closeMobileSearch() {
    const wrapper = document.getElementById("headerSearch");
    const btn = document.querySelector("[data-search-open]");
    if (!wrapper || window.innerWidth > 1024) return;
    wrapper.classList.remove("is-open");
    btn?.setAttribute("aria-expanded", "false");
    setExpanded(false);
  }

  function init() {
    input = document.getElementById("siteSearchInput");
    panel = document.getElementById("searchPanel");
    form = input?.closest("form");
    if (!input || !panel || !form) return;
    clearBtn = form.querySelector(".search-clear");

    const urlQuery = new URLSearchParams(location.search).get("q");
    if (urlQuery && !input.value) input.value = urlQuery;
    updateClearButton();

    input.addEventListener("focus", () => {
      if (input.value.trim()) renderPanel();
      else renderPanel();
    });

    input.addEventListener("input", LS.ui.debounce(() => {
      activeIndex = -1;
      renderPanel();
    }, 160));

    input.addEventListener("keydown", handleKeydown);

    form.addEventListener("submit", () => {
      saveRecent(input.value.trim());
      setExpanded(false);
    });

    clearBtn?.addEventListener("click", () => {
      input.value = "";
      updateClearButton();
      renderPanel();
      input.focus();
      LS.ui.announce("Search cleared");
    });

    document.addEventListener("click", (event) => {
      if (!form.contains(event.target) && !panel.contains(event.target)) {
        setExpanded(false);
        closeMobileSearch();
      }
    });

    document.querySelector("[data-search-open]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      const wrapper = document.getElementById("headerSearch");
      if (wrapper?.classList.contains("is-open")) {
        closeMobileSearch();
        setExpanded(false);
      } else {
        openMobileSearch();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && !/(INPUT|TEXTAREA|SELECT)/.test(document.activeElement?.tagName)) {
        event.preventDefault();
        if (window.innerWidth <= 1024) openMobileSearch();
        input.focus();
      }
    });

    // Close the mobile search panel when resizing to desktop.
    window.addEventListener("resize", LS.ui.debounce(() => {
      if (window.innerWidth > 1024) {
        const wrapper = document.getElementById("headerSearch");
        wrapper?.classList.remove("is-open");
        document.querySelector("[data-search-open]")?.setAttribute("aria-expanded", "false");
      }
    }, 180));
  }

  return {
    init,
    searchAll,
    productScore,
    tokenise,
    normalise,
    levenshtein,
    highlight,
    get recent() { return recent; }
  };
})();
