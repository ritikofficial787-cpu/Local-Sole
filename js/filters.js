/* ==========================================================================
   Local Sole — filters.js
   Catalogue filtering, URL-synced state, fuzzy search, sorting, view modes,
   active filter chips, mobile filter drawer and progressive loading.
   ========================================================================== */

LS.pages = LS.pages || {};

LS.pages.products = function initProductsPage() {
  const data = LS.data;
  const ui = LS.ui;
  const PAGE_SIZE = 12;
  const bounds = data.priceBounds();
  const formEls = () => [...document.querySelectorAll("[data-filter-form]")];

  const allTypes = data.types();
  const allCategories = data.categories().filter((c) => data.products.some((p) => p.category === c));
  const allBrands = data.brands();
  const allColours = data.colours();
  const allSizes = [...new Set(data.products.flatMap((p) => p.sizes.map((s) => String(s.size))))]
    .sort((a, b) => Number(a) - Number(b));
  const allShops = data.shops;

  const state = readParams();
  let filtered = [];
  let visible = [];
  let rankMap = new Map();
  let loadingMore = false;

  /* ---------- URL state ---------- */
  function multi(params, key) {
    const value = params.get(key);
    if (!value) return [];
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }

  function readParams() {
    const params = new URLSearchParams(location.search);
    const min = Number(params.get("min"));
    const max = Number(params.get("max"));
    return {
      q: params.get("q") || "",
      types: multi(params, "type"),
      categories: multi(params, "category"),
      brands: multi(params, "brand"),
      colours: multi(params, "color"),
      sizes: multi(params, "size"),
      shops: multi(params, "shop"),
      min: Number.isFinite(min) && min > 0 ? min : bounds.min,
      max: Number.isFinite(max) && max > 0 ? max : bounds.max,
      stock: params.get("stock") === "1",
      isNew: params.get("new") === "1",
      discount: params.get("discount") === "1",
      rating: Number(params.get("rating")) || 0,
      sort: params.get("sort") || "featured",
      view: params.get("view") === "list" ? "list" : "grid",
      limit: PAGE_SIZE
    };
  }

  function hasPriceFilter() {
    return state.min > bounds.min || state.max < bounds.max;
  }

  function hasAnyFilter() {
    return Boolean(
      state.q || state.types.length || state.categories.length || state.brands.length ||
      state.colours.length || state.sizes.length || state.shops.length || state.stock ||
      state.isNew || state.discount || state.rating || hasPriceFilter()
    );
  }

  function writeUrl() {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.types.length) params.set("type", state.types.join(","));
    if (state.categories.length) params.set("category", state.categories.join(","));
    if (state.brands.length) params.set("brand", state.brands.join(","));
    if (state.colours.length) params.set("color", state.colours.join(","));
    if (state.sizes.length) params.set("size", state.sizes.join(","));
    if (state.shops.length) params.set("shop", state.shops.join(","));
    if (hasPriceFilter()) {
      params.set("min", String(state.min));
      params.set("max", String(state.max));
    }
    if (state.stock) params.set("stock", "1");
    if (state.isNew) params.set("new", "1");
    if (state.discount) params.set("discount", "1");
    if (state.rating) params.set("rating", String(state.rating));
    if (state.sort !== "featured") params.set("sort", state.sort);
    if (state.view === "list") params.set("view", "list");
    const next = `${location.pathname}${params.toString() ? `?${params}` : ""}`;
    history.replaceState(null, "", next);
  }

  /* ---------- matching + sorting ---------- */
  function computeRanking() {
    rankMap = new Map();
    if (!state.q) return null;
    const found = LS.search.searchAll(state.q, 200).products;
    found.forEach((product, index) => rankMap.set(product.id, index));
    return new Set(found.map((p) => p.id));
  }

  function passes(product, rankedIds) {
    if (state.q && (!rankedIds || !rankedIds.has(product.id))) return false;
    if (state.types.length && !state.types.includes(product.type)) return false;
    if (state.categories.length && !state.categories.includes(product.category)) return false;
    if (state.brands.length && !state.brands.includes(product.brand)) return false;
    if (state.shops.length && !state.shops.includes(product.shopId)) return false;
    if (state.colours.length) {
      const names = product.colors.map((c) => c.name.toLowerCase());
      if (!state.colours.some((c) => names.includes(c.toLowerCase()))) return false;
    }
    if (state.sizes.length) {
      const available = product.sizes.filter((s) => s.stock > 0).map((s) => String(s.size));
      if (!state.sizes.some((s) => available.includes(String(s)))) return false;
    }
    if (product.price < state.min || product.price > state.max) return false;
    if (state.stock && !product.inStock) return false;
    if (state.isNew && !product.isNew) return false;
    if (state.discount && data.discountPercent(product) < 1) return false;
    if (state.rating && product.rating < state.rating) return false;
    return true;
  }

  function sortProducts(list) {
    const sorted = [...list];
    switch (state.sort) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      case "newest":
        return sorted.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
      case "discount":
        return sorted.sort((a, b) => data.discountPercent(b) - data.discountPercent(a));
      case "popular":
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      default:
        if (state.q) return sorted.sort((a, b) => (rankMap.get(a.id) ?? 999) - (rankMap.get(b.id) ?? 999));
        return sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.rating - a.rating);
    }
  }

  function apply() {
    const rankedIds = computeRanking();
    filtered = sortProducts(data.products.filter((product) => passes(product, rankedIds)));
    visible = filtered.slice(0, state.limit);
    render();
    writeUrl();
    syncForms();
  }

  /* ---------- filter markup ---------- */
  function optionHtml(group, value, label, count, checked) {
    return `<label class="filter-option">
      <input type="checkbox" data-filter="${group}" value="${ui.escapeHtml(value)}" ${checked ? "checked" : ""}>
      <span>${ui.escapeHtml(label)}</span>
      <span class="count">${count}</span>
    </label>`;
  }

  function countForType(type) {
    return data.products.filter((p) => p.type === type).length;
  }

  function filterMarkup() {
    const typeOptions = allTypes.map((type) => optionHtml(
      "type", type, type.charAt(0).toUpperCase() + type.slice(1), countForType(type), state.types.includes(type)
    )).join("");

    const categoryOptions = allCategories.map((category) => optionHtml(
      "category", category, category.charAt(0).toUpperCase() + category.slice(1),
      data.products.filter((p) => p.category === category).length,
      state.categories.includes(category)
    )).join("");

    const brandOptions = allBrands.map((brand) => optionHtml(
      "brand", brand, brand, data.products.filter((p) => p.brand === brand).length,
      state.brands.includes(brand)
    )).join("");

    const shopOptions = allShops.map((shop) => optionHtml(
      "shop", shop.id, `${shop.shortName} · ${shop.area}`,
      data.productsByShop(shop.id).length, state.shops.includes(shop.id)
    )).join("");

    const colourSwatches = allColours.map((colour) => `
      <button class="color-filter ${state.colours.includes(colour.name) ? "is-active" : ""}" type="button"
        data-filter-colour="${ui.escapeHtml(colour.name)}" style="background:${ui.escapeHtml(colour.hex)}"
        aria-label="${ui.escapeHtml(colour.name)}" aria-pressed="${state.colours.includes(colour.name)}"
        title="${ui.escapeHtml(colour.name)}"></button>`).join("");

    const sizeButtons = allSizes.map((size) => `
      <button class="size-filter ${state.sizes.includes(size) ? "is-active" : ""}" type="button"
        data-filter-size="${ui.escapeHtml(size)}" aria-pressed="${state.sizes.includes(size)}"
        aria-label="UK ${ui.escapeHtml(size)}">${ui.escapeHtml(size)}</button>`).join("");

    const ratingOptions = [4.5, 4, 3.5].map((rating) => `
      <label class="filter-option">
        <input type="radio" name="rating-filter" data-filter="rating" value="${rating}" ${state.rating === rating ? "checked" : ""}>
        <span class="rating-stars" aria-hidden="true">★★★★★</span>
        <span>${rating} &amp; up</span>
        <span class="count">${data.products.filter((p) => p.rating >= rating).length}</span>
      </label>`).join("");

    const lower = Math.min(state.min, state.max - 100);
    const upper = Math.max(state.max, state.min + 100);

    return `
      <form data-filter-form novalidate>
        <div class="sidebar-head">
          <h2>Filters</h2>
          <button class="clear-filters" type="button" data-clear-all ${hasAnyFilter() ? "" : "disabled"}>Clear all</button>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Search</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body">
            <div class="catalog-search">
              ${ui.icon("search", 15)}
              <input class="input" type="search" data-filter-q value="${ui.escapeHtml(state.q)}" placeholder="Try “white sneakers”" autocomplete="off" aria-label="Search the catalogue">
            </div>
          </div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Category</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body">${typeOptions}</div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Who it's for</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body">${categoryOptions}</div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Size (UK)</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body">
            <div class="size-filter-grid">${sizeButtons}</div>
            <p class="option-note">${ui.icon("ruler", 12)} Between sizes? Ask the shop.</p>
          </div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Colour</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body"><div class="color-filter-list">${colourSwatches}</div></div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Price</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body">
            <div class="price-range">
              <div class="price-sliders">
                <input type="range" min="${bounds.min}" max="${bounds.max}" step="100" value="${lower}" data-price-min aria-label="Minimum price">
                <input type="range" min="${bounds.min}" max="${bounds.max}" step="100" value="${upper}" data-price-max aria-label="Maximum price">
              </div>
              <div class="price-inputs">
                <label class="sr-only">Minimum price
                  <input class="input" type="number" inputmode="numeric" min="${bounds.min}" max="${bounds.max}" step="100" value="${state.min}" data-price-min-num>
                </label>
                <span>to</span>
                <label class="sr-only">Maximum price
                  <input class="input" type="number" inputmode="numeric" min="${bounds.min}" max="${bounds.max}" step="100" value="${state.max}" data-price-max-num>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Brand</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body"><div class="filter-options-scroll">${brandOptions}</div></div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Neighbourhood</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body"><div class="filter-options-scroll">${shopOptions}</div></div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>Rating</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body">${ratingOptions}</div>
        </div>

        <div class="filter-group">
          <button class="filter-group-head" type="button" aria-expanded="true" data-collapse>
            <span>More</span>${ui.icon("chevronDown", 14)}
          </button>
          <div class="filter-group-body">
            <label class="filter-option">
              <input type="checkbox" data-filter="stock" ${state.stock ? "checked" : ""}>
              <span>In stock only</span>
              <span class="count">${data.products.filter((p) => p.inStock).length}</span>
            </label>
            <label class="filter-option">
              <input type="checkbox" data-filter="new" ${state.isNew ? "checked" : ""}>
              <span>New this season</span>
              <span class="count">${data.products.filter((p) => p.isNew).length}</span>
            </label>
            <label class="filter-option">
              <input type="checkbox" data-filter="discount" ${state.discount ? "checked" : ""}>
              <span>On sale</span>
              <span class="count">${data.products.filter((p) => data.discountPercent(p) > 0).length}</span>
            </label>
          </div>
        </div>
      </form>`;
  }

  /* ---------- form sync + reading ---------- */
  function syncForms() {
    formEls().forEach((form) => {
      form.querySelectorAll('input[type="checkbox"][data-filter]').forEach((input) => {
        const group = groupKey(input.dataset.filter);
        const values = state[group] || [];
        input.checked = values.includes(input.value);
      });
      form.querySelectorAll('input[type="radio"][data-filter="rating"]').forEach((input) => {
        input.checked = Number(input.value) === Number(state.rating);
      });
      form.querySelectorAll("[data-filter-colour]").forEach((btn) => {
        const active = state.colours.includes(btn.dataset.filterColour);
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      form.querySelectorAll("[data-filter-size]").forEach((btn) => {
        const active = state.sizes.includes(btn.dataset.filterSize);
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      form.querySelectorAll("[data-price-min]").forEach((input) => { input.value = state.min; });
      form.querySelectorAll("[data-price-max]").forEach((input) => { input.value = state.max; });
      form.querySelectorAll("[data-price-min-num]").forEach((input) => {
        if (document.activeElement !== input) input.value = state.min;
      });
      form.querySelectorAll("[data-price-max-num]").forEach((input) => {
        if (document.activeElement !== input) input.value = state.max;
      });
      form.querySelectorAll("[data-filter-q]").forEach((input) => {
        if (document.activeElement !== input) input.value = state.q;
      });
    });
    const count = activeCount();
    const badge = document.getElementById("mobileFilterCount");
    if (badge) {
      badge.textContent = count;
      badge.hidden = count === 0;
    }
  }

  function groupKey(filter) {
    return { type: "types", category: "categories", brand: "brands", shop: "shops" }[filter] || filter;
  }

  function activeCount() {
    return state.types.length + state.categories.length + state.brands.length + state.colours.length +
      state.sizes.length + state.shops.length + Number(state.stock) + Number(state.isNew) +
      Number(state.discount) + Number(Boolean(state.rating)) + Number(hasPriceFilter()) + Number(Boolean(state.q));
  }

  function readForm(form) {
    const checked = (group) => [...form.querySelectorAll(`input[data-filter="${group}"]:checked`)].map((i) => i.value);
    state.types = checked("type");
    state.categories = checked("category");
    state.brands = checked("brand");
    state.shops = checked("shop");
    state.stock = Boolean(form.querySelector('input[data-filter="stock"]:checked'));
    state.isNew = Boolean(form.querySelector('input[data-filter="new"]:checked'));
    state.discount = Boolean(form.querySelector('input[data-filter="discount"]:checked'));
    const rating = form.querySelector('input[data-filter="rating"]:checked');
    state.rating = rating ? Number(rating.value) : 0;
    const q = form.querySelector("[data-filter-q]");
    if (q) state.q = q.value.trim();
    const minRange = form.querySelector("[data-price-min]");
    const maxRange = form.querySelector("[data-price-max]");
    if (minRange && maxRange) {
      let min = Number(minRange.value);
      let max = Number(maxRange.value);
      if (min > max - 100) min = Math.max(bounds.min, max - 100);
      state.min = Math.min(min, max);
      state.max = Math.max(max, state.min + 100);
    }
    state.limit = PAGE_SIZE;
  }

  function setNum(field, value) {
    if (field === "min") state.min = Math.min(Math.max(bounds.min, value), state.max - 100);
    if (field === "max") state.max = Math.max(Math.min(bounds.max, value), state.min + 100);
  }

  /* ---------- render ---------- */
  function resultLabel() {
    if (state.q && filtered.length) return `Results for “${ui.escapeHtml(state.q)}”`;
    if (state.types.length === 1) {
      const label = state.types[0];
      return `${label.charAt(0).toUpperCase() + label.slice(1)}`;
    }
    if (state.isNew) return "New arrivals";
    if (state.discount) return "The sale edit";
    if (state.rating) return "Top-rated pairs";
    return "Every pair";
  }

  function render() {
    renderGrid();
    renderChips();
    const countEl = document.getElementById("resultCount");
    if (countEl) {
      countEl.innerHTML = filtered.length
        ? `<strong>${filtered.length}</strong> pair${filtered.length === 1 ? "" : "s"} from ${new Set(visible.map((p) => p.shopId)).size || new Set(filtered.map((p) => p.shopId)).size} shop${new Set(filtered.map((p) => p.shopId)).size === 1 ? "" : "s"}`
        : "No pairs match yet";
    }
    const drawerCount = document.getElementById("drawerResultCount");
    if (drawerCount) drawerCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
    const title = document.getElementById("catalogTitle");
    if (title) {
      title.innerHTML = state.q
        ? `Results for <em class="serif-italic">“${ui.escapeHtml(state.q)}”</em>`
        : `${resultLabel()}${state.isNew || state.discount || state.rating ? "" : ", <em class=\"serif-italic\">all shops</em>"}<span class="text-accent">.</span>`;
    }
    const lede = document.getElementById("catalogLede");
    if (lede) {
      lede.textContent = state.q
        ? `Fuzzy search across 66 styles, eight shops, brands, colours and neighbourhoods. Close counts as a match.`
        : "Sneakers, runners, leather and everything in between — pulled from eight shop floors across Bengaluru. Filter by what fits, what you need, and how far you'll walk to try it on.";
    }
  }

  function renderGrid() {
    const grid = document.getElementById("catalogGrid");
    const status = document.getElementById("catalogStatus");
    const loadWrap = document.getElementById("loadMoreWrap");
    if (!grid) return;
    grid.classList.toggle("is-list", state.view === "list");
    grid.setAttribute("aria-busy", "false");

    if (!filtered.length) {
      grid.innerHTML = "";
      if (status) {
        status.hidden = false;
        status.innerHTML = `<div class="empty-state">
          <span class="eyebrow no-rule">Nothing in that size</span>
          <h2>No pairs match those filters.</h2>
          <p>Try removing a filter, opening the price range, or searching a nearby word — “trainers” works as well as “sneakers”.</p>
          <div class="row" style="justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" type="button" data-clear-all>Clear all filters</button>
            <a class="btn btn-outline" href="products.html">Reset the catalogue</a>
          </div>
        </div>`;
      }
      if (loadWrap) loadWrap.hidden = true;
      return;
    }

    if (status) { status.hidden = true; status.innerHTML = ""; }
    grid.innerHTML = visible.map((product) => ui.productCard(product)).join("");
    if (loadWrap) {
      const remaining = filtered.length - visible.length;
      loadWrap.hidden = remaining <= 0;
      loadWrap.innerHTML = remaining > 0
        ? `<button class="btn btn-outline" type="button" id="loadMoreBtn">Load ${Math.min(PAGE_SIZE, remaining)} more <span data-icon="chevronDown" data-size="15"></span></button>
           <span class="load-more-meta">Showing ${visible.length} of ${filtered.length} pairs</span>`
        : `<span class="load-more-meta">That's all ${filtered.length} pair${filtered.length === 1 ? "" : "s"} for this search.</span>`;
      const btn = document.getElementById("loadMoreBtn");
      if (btn) btn.addEventListener("click", loadMore);
    }
  }

  function loadMore() {
    if (loadingMore) return;
    loadingMore = true;
    const grid = document.getElementById("catalogGrid");
    const remaining = filtered.length - visible.length;
    const amount = Math.min(PAGE_SIZE, remaining);
    const skeletons = Array.from({ length: amount }).map(() => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-media"></div>
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>`).join("");
    grid.insertAdjacentHTML("beforeend", skeletons);
    const btn = document.getElementById("loadMoreBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Bringing them out…"; }
    window.setTimeout(() => {
      state.limit += amount;
      visible = filtered.slice(0, state.limit);
      loadingMore = false;
      renderGrid();
      const firstNew = grid.children[visible.length - amount];
      if (firstNew) {
        const link = firstNew.querySelector("a");
        if (link) link.focus({ preventScroll: true });
      }
    }, 320);
  }

  function renderChips() {
    const bar = document.getElementById("activeFilters");
    if (!bar) return;
    const chips = [];
    const chip = (label, key, value) => `<span class="filter-chip">${ui.escapeHtml(label)}
      <button type="button" data-remove-filter="${key}" data-remove-value="${ui.escapeHtml(value)}" aria-label="Remove ${ui.escapeHtml(label)} filter">${ui.icon("close", 10)}</button></span>`;

    if (state.q) chips.push(chip(`Search: ${state.q}`, "q", ""));
    state.types.forEach((v) => chips.push(chip(v, "types", v)));
    state.categories.forEach((v) => chips.push(chip(v, "categories", v)));
    state.brands.forEach((v) => chips.push(chip(v, "brands", v)));
    state.colours.forEach((v) => chips.push(chip(v, "colours", v)));
    state.sizes.forEach((v) => chips.push(chip(`UK ${v}`, "sizes", v)));
    state.shops.forEach((v) => {
      const shop = data.shopById(v);
      chips.push(chip(shop ? shop.shortName : v, "shops", v));
    });
    if (hasPriceFilter()) chips.push(chip(`${ui.money.fmt(state.min)} – ${ui.money.fmt(state.max)}`, "price", ""));
    if (state.stock) chips.push(chip("In stock", "stock", ""));
    if (state.isNew) chips.push(chip("New in", "isNew", ""));
    if (state.discount) chips.push(chip("On sale", "discount", ""));
    if (state.rating) chips.push(chip(`${state.rating}★ & up`, "rating", ""));

    bar.innerHTML = chips.join("") + (chips.length ? `<button class="clear-filters" type="button" data-clear-all>Clear all</button>` : "");
  }

  function removeFilter(key, value) {
    if (key === "q") state.q = "";
    else if (key === "price") { state.min = bounds.min; state.max = bounds.max; }
    else if (key === "stock") state.stock = false;
    else if (key === "isNew") state.isNew = false;
    else if (key === "discount") state.discount = false;
    else if (key === "rating") state.rating = 0;
    else if (Array.isArray(state[key])) state[key] = state[key].filter((v) => v !== value);
    state.limit = PAGE_SIZE;
    apply();
  }

  function clearAll() {
    state.q = "";
    state.types = [];
    state.categories = [];
    state.brands = [];
    state.colours = [];
    state.sizes = [];
    state.shops = [];
    state.min = bounds.min;
    state.max = bounds.max;
    state.stock = false;
    state.isNew = false;
    state.discount = false;
    state.rating = 0;
    state.sort = "featured";
    state.limit = PAGE_SIZE;
    const sort = document.getElementById("sortSelect");
    if (sort) sort.value = "featured";
    apply();
    ui.announce("All filters cleared");
  }

  /* ---------- events ---------- */
  const debouncedApply = ui.debounce(apply, 260);

  function bind() {
    document.addEventListener("change", (event) => {
      const input = event.target.closest("[data-filter]");
      if (!input) return;
      const form = input.closest("[data-filter-form]");
      if (!form) return;
      readForm(form);
      apply();
    });

    document.addEventListener("input", (event) => {
      const target = event.target;
      if (target.matches("[data-filter-q]")) {
        state.q = target.value.trim();
        state.limit = PAGE_SIZE;
        debouncedApply();
        return;
      }
      if (target.matches("[data-price-min], [data-price-max]")) {
        const form = target.closest("[data-filter-form]");
        readForm(form);
        apply();
        return;
      }
      if (target.matches("[data-price-min-num], [data-price-max-num]")) {
        const value = Number(target.value);
        if (!Number.isFinite(value) || value <= 0) return;
        const form = target.closest("[data-filter-form]");
        readForm(form);
        setNum(target.matches("[data-price-min-num]") ? "min" : "max", value);
        apply();
      }
    });

    document.addEventListener("submit", (event) => {
      if (!event.target.matches("[data-filter-form]")) return;
      event.preventDefault();
      readForm(event.target);
      apply();
    });

    document.addEventListener("click", (event) => {
      const colour = event.target.closest("[data-filter-colour]");
      if (colour) {
        const value = colour.dataset.filterColour;
        state.colours = state.colours.includes(value)
          ? state.colours.filter((c) => c !== value)
          : [...state.colours, value];
        state.limit = PAGE_SIZE;
        apply();
        return;
      }
      const size = event.target.closest("[data-filter-size]");
      if (size) {
        const value = size.dataset.filterSize;
        state.sizes = state.sizes.includes(value)
          ? state.sizes.filter((s) => s !== value)
          : [...state.sizes, value];
        state.limit = PAGE_SIZE;
        apply();
        return;
      }
      const remove = event.target.closest("[data-remove-filter]");
      if (remove) {
        removeFilter(remove.dataset.removeFilter, remove.dataset.removeValue);
        return;
      }
      if (event.target.closest("[data-clear-all]")) {
        clearAll();
        return;
      }
      if (event.target.closest("[data-open-filters]")) {
        const drawer = document.getElementById("filterDrawer");
        if (drawer) {
          const mount = document.getElementById("filterDrawerBody");
          if (mount) mount.innerHTML = filterMarkup();
          ui.openDrawer("filterDrawer", document.querySelector("[data-open-filters]"));
        }
        return;
      }
      if (event.target.closest("[data-close-filters]")) {
        ui.closeDrawer("filterDrawer");
        return;
      }
      const collapse = event.target.closest("[data-collapse]");
      if (collapse) {
        const group = collapse.closest(".filter-group");
        const collapsed = group.classList.toggle("is-collapsed");
        collapse.setAttribute("aria-expanded", String(!collapsed));
        return;
      }
      const viewBtn = event.target.closest("[data-view]");
      if (viewBtn) {
        state.view = viewBtn.dataset.view;
        document.querySelectorAll("[data-view]").forEach((btn) => {
          const active = btn === viewBtn;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-pressed", String(active));
        });
        renderGrid();
        writeUrl();
      }
    });

    document.getElementById("sortSelect")?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.limit = PAGE_SIZE;
      apply();
    });

    // Restore layout preference from the URL.
    document.querySelectorAll("[data-view]").forEach((btn) => {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  /* ---------- boot ---------- */
  function paintShell() {
    const sidebar = document.getElementById("filterSidebarBody");
    if (sidebar) sidebar.innerHTML = filterMarkup();
    // Hydrate icons in the freshly inserted filter markup.
    document.querySelectorAll("#filterSidebarBody [data-icon]:not(.ico)").forEach((el) => {
      el.innerHTML = ui.icon(el.dataset.icon, Number(el.dataset.size || 16));
      el.classList.add("ico");
    });
  }

  // Skeleton state before the first paint.
  const grid = document.getElementById("catalogGrid");
  if (grid) {
    grid.innerHTML = Array.from({ length: 8 }).map(() => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-media"></div>
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>`).join("");
  }

  const sort = document.getElementById("sortSelect");
  if (sort) sort.value = state.sort;
  paintShell();
  bind();
  apply();

  document.addEventListener("ls:currency", () => {
    renderGrid();
    renderChips();
  });
};
