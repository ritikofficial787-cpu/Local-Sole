/* ==========================================================================
   Local Sole — ui.js
   Design-system helpers: icons, money, theme, header/footer chrome, search
   shell, drawers, modals, toasts, product cards and shared interactions.
   ========================================================================== */

window.LS = window.LS || {};

LS.ui = (() => {
  const THEME_KEY = "ls_theme_v1";
  const CURRENCY_KEY = "ls_currency_v1";
  const COOKIE_KEY = "ls_cookie_consent_v1";
  const ANNOUNCE_KEY = "ls_announcement_dismissed";

  const RATES = {
    INR: { rate: 1, locale: "en-IN", decimals: 0, label: "INR" },
    USD: { rate: 0.012, locale: "en-US", decimals: 2, label: "USD" },
    EUR: { rate: 0.011, locale: "de-DE", decimals: 2, label: "EUR" }
  };

  let currentCurrency = "INR";
  let currentTheme = "light";
  let lastFocused = null;
  let openOverlayId = null;

  /* ---------- mini SVG icon set ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bag: '<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    heart: '<path d="M12 20s-7.5-4.4-7.5-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3.5C19.5 15.6 12 20 12 20Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    arrowRight: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17L17 7M8 7h9v9"/>',
    arrowUp: '<path d="M12 20V4M6 10l6-6 6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>',
    store: '<path d="M3 9l2-5h14l2 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
    pin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M6 3h3l1.5 5L8 10c1 2.5 3 4.5 5.5 5.5l2-2.5 5 1.5v3c0 1.5-1.5 2.5-3 2.5C9.5 20 4 14.5 4 6c0-1.5 1-3 2-3Z"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
    ruler: '<path d="M4 16L16 4l4 4L8 20zM7 13l2 2M10 10l2 2M13 7l2 2"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.5M8.2 13.2l7.6 4.5"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M15 3h-3a4 4 0 0 0-4 4v3H5v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/>',
    whatsapp: '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c0 3 2.5 5.5 5.5 5.5.5 0 1.2-.4 1.2-1l-.7-1.4-1.4.6a4 4 0 0 1-2.3-2.3l.6-1.4L10.5 8c-.6 0-1.5.1-1.5.5Z"/>',
    creditCard: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    tag: '<path d="M3 12V4h8l10 10-7 7L3 12Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    columns: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
    quote: '<path d="M9 6C6 7 4 9.5 4 13v5h6v-6H7c0-2 1-3.5 3-4.5L9 6ZM20 6c-3 1-5 3.5-5 7v5h6v-6h-3c0-2 1-3.5 3-4.5L20 6Z"/>',
    camera: '<path d="M3 8h4l2-3h6l2 3h4v12H3V8Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    cookie: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="15" r="1" fill="currentColor" stroke="none"/>',
    userCircle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19c.8-2.6 2.9-4 5.5-4s4.7 1.4 5.5 4"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M9 20v-6h6v6"/>',
    play: '<path d="M8 5l11 7-11 7V5Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 3l9 17H3L12 3Z"/><path d="M12 9v4M12 16h.01"/>',
    upi: '<path d="M6 4l9 16M18 4L8 20"/><path d="M9 8h6M9 16h6"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    id: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M4.5 16c.7-1.8 2-2.6 3.5-2.6s2.8.8 3.5 2.6M14 10h4M14 14h3"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/><path d="M13.5 4.5l4 4"/>'
  };

  function icon(name, size = 20, extra = "") {
    const path = ICONS[name] || ICONS.info;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${path}</svg>`;
  }

  /* ---------- helpers ---------- */
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(fn, wait = 180) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return [...scope.querySelectorAll(selector)];
  }

  function store(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function getParam(name, fallback = "") {
    return new URLSearchParams(location.search).get(name) || fallback;
  }

  function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", options);
  }

  function stars(rating, count, { small = false } = {}) {
    const rounded = Math.round(Number(rating) || 0);
    const filled = "★".repeat(Math.max(0, Math.min(5, rounded)));
    const empty = "☆".repeat(Math.max(0, 5 - rounded));
    return `<span class="rating">
      <span class="rating-stars" aria-hidden="true">${filled}<span class="star-empty">${empty}</span></span>
      <span class="sr-only">Rated ${rating} out of 5${count ? ` from ${count} reviews` : ""}</span>
      <strong>${Number(rating).toFixed(1)}</strong>
      ${count !== undefined && !small ? `<span class="rating-text">(${Number(count).toLocaleString("en-IN")})</span>` : ""}
    </span>`;
  }

  /* ---------- money ---------- */
  function getCurrency() {
    return currentCurrency;
  }

  function setCurrency(currency, { silent = false } = {}) {
    if (!RATES[currency]) currency = "INR";
    currentCurrency = currency;
    save(CURRENCY_KEY, currency);
    refreshCurrencyLabels();
    qsa("#currencySelect").forEach((select) => { select.value = currency; });
    document.dispatchEvent(new CustomEvent("ls:currency", { detail: { currency } }));
    if (!silent) toast({ title: `Prices in ${currency}`, message: "Currency updated for display. Checkout is charged in INR.", type: "info" });
  }

  function convert(amountInr) {
    return Number(amountInr) * RATES[currentCurrency].rate;
  }

  function fmt(amountInr, { compact = false } = {}) {
    const config = RATES[currentCurrency];
    const value = convert(amountInr);
    let text;
    try {
      text = new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: currentCurrency,
        minimumFractionDigits: currentCurrency === "INR" ? 0 : 2,
        maximumFractionDigits: currentCurrency === "INR" ? 0 : 2,
        notation: compact && currentCurrency !== "INR" ? "compact" : "standard"
      }).format(value);
    } catch {
      text = `${currentCurrency} ${value.toFixed(currentCurrency === "INR" ? 0 : 2)}`;
    }
    return text;
  }

  function amountHtml(amountInr, className = "") {
    return `<span class="${className}" data-inr="${amountInr}">${fmt(amountInr)}</span>`;
  }

  function refreshCurrencyLabels() {
    qsa("[data-inr]").forEach((el) => {
      el.textContent = fmt(Number(el.dataset.inr));
    });
    qsa("[data-currency-label]").forEach((el) => {
      el.textContent = currentCurrency;
    });
    qsa("[data-price-min-label]").forEach((el) => {
      el.textContent = fmt(Number(el.dataset.priceMinLabel));
    });
    qsa("[data-price-max-label]").forEach((el) => {
      el.textContent = fmt(Number(el.dataset.priceMaxLabel));
    });
  }

  const money = {
    fmt,
    amountHtml,
    convert,
    get currency() { return currentCurrency; },
    setCurrency,
    refresh: refreshCurrencyLabels,
    rates: RATES
  };

  /* ---------- theme ---------- */
  function applyTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    currentTheme = next;
    document.documentElement.dataset.theme = next;
    save(THEME_KEY, next);
    qsa("[data-theme-toggle]").forEach((btn) => {
      btn.innerHTML = next === "dark" ? icon("sun", 19) : icon("moon", 19);
      btn.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
      btn.setAttribute("aria-pressed", String(next === "dark"));
    });
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", next === "dark" ? "#12100e" : "#f6f3ec");
  }

  function toggleTheme() {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  }

  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch { /* storage may be blocked */ }
    if (!stored) stored = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    currentTheme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = currentTheme;
    qsa("[data-theme-toggle]").forEach((btn) => {
      btn.innerHTML = currentTheme === "dark" ? icon("sun", 19) : icon("moon", 19);
      btn.setAttribute("aria-pressed", String(currentTheme === "dark"));
    });
  }

  /* ---------- toasts ---------- */
  function toast({ title = "", message = "", type = "success", action = null, duration = 4200 }) {
    let stack = document.getElementById("toastStack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toastStack";
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      stack.setAttribute("aria-atomic", "false");
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    const iconName = type === "error" ? "alert" : type === "info" ? "info" : "check";
    el.innerHTML = `
      <span class="toast-icon">${icon(iconName, 15)}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ""}
        ${message ? `<div class="toast-msg">${message}</div>` : ""}
        ${action ? `<div class="mt-2"><a href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a></div>` : ""}
      </div>
      <button class="toast-close" type="button" aria-label="Dismiss notification">${icon("close", 14)}</button>`;
    stack.appendChild(el);
    const remove = () => {
      if (el.classList.contains("is-leaving")) return;
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 260);
    };
    el.querySelector(".toast-close").addEventListener("click", remove);
    if (duration) setTimeout(remove, duration);
    return el;
  }

  /* ---------- scroll lock + overlays ---------- */
  function lockScroll() {
    if (document.body.classList.contains("no-scroll")) return;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    document.body.classList.add("no-scroll");
    const header = document.querySelector(".site-header");
    if (header) header.style.paddingRight = `${scrollbar}px`;
  }

  function unlockScroll() {
    document.body.classList.remove("no-scroll");
    document.body.style.paddingRight = "";
    const header = document.querySelector(".site-header");
    if (header) header.style.paddingRight = "";
  }

  function trapFocus(container) {
    const focusable = qsa(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    container.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function openDrawer(id, trigger) {
    const drawer = document.getElementById(id);
    if (!drawer) return;
    lastFocused = trigger || document.activeElement;
    qsa(".drawer.is-open").forEach((d) => { if (d !== drawer) closeDrawer(d.id, false); });
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    const overlay = document.getElementById("siteOverlay");
    if (overlay) {
      overlay.classList.add("is-open");
      overlay.hidden = false;
    }
    openOverlayId = id;
    lockScroll();
    trapFocus(drawer);
    setTimeout(() => {
      const focusTarget = drawer.querySelector("[data-drawer-focus]") || drawer.querySelector("button, a, input");
      focusTarget?.focus({ preventScroll: true });
    }, 120);
  }

  function closeDrawer(id, restore = true) {
    const drawer = document.getElementById(id);
    if (drawer) {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
    }
    const overlay = document.getElementById("siteOverlay");
    if (overlay) {
      overlay.classList.remove("is-open");
      setTimeout(() => { if (!qsa(".drawer.is-open").length && !qsa(".filter-drawer.is-open").length) overlay.hidden = true; }, 300);
    }
    openOverlayId = null;
    if (!qsa(".drawer.is-open").length) unlockScroll();
    if (restore && lastFocused) lastFocused.focus({ preventScroll: true });
  }

  function closeAllPanels() {
    qsa(".drawer.is-open").forEach((d) => closeDrawer(d.id, false));
    const overlay = document.getElementById("siteOverlay");
    if (overlay) { overlay.classList.remove("is-open"); overlay.hidden = true; }
    unlockScroll();
  }

  /* ---------- modal ---------- */
  function openModal(content, { className = "", label = "Dialog", onMount = null } = {}) {
    const layer = document.getElementById("modalLayer");
    if (!layer) return;
    lastFocused = document.activeElement;
    layer.hidden = false;
    layer.querySelector(".modal").className = `modal ${className}`.trim();
    layer.querySelector(".modal").setAttribute("aria-label", label);
    layer.querySelector("#modalContent").innerHTML = content;
    lockScroll();
    const modal = layer.querySelector(".modal");
    trapFocus(modal);
    setTimeout(() => {
      const target = modal.querySelector("[autofocus], button, a, input, select");
      target?.focus({ preventScroll: true });
    }, 80);
    if (onMount) onMount(modal);
  }

  function closeModal() {
    const layer = document.getElementById("modalLayer");
    if (!layer || layer.hidden) return;
    layer.hidden = true;
    layer.querySelector("#modalContent").innerHTML = "";
    if (!qsa(".drawer.is-open").length && !qsa(".filter-drawer.is-open").length) unlockScroll();
    lastFocused?.focus({ preventScroll: true });
  }

  /* ---------- product cards ---------- */
  function productBadge(product) {
    const badges = [];
    if (LS.data.discountPercent(product) >= 15) badges.push('<span class="badge badge-sale">Sale</span>');
    if (product.isNew) badges.push('<span class="badge badge-new">New</span>');
    if (product.isBestSeller && badges.length < 2) badges.push('<span class="badge badge-best">Best seller</span>');
    if (product.stockTotal > 0 && product.stockTotal <= 4 && badges.length < 2) {
      badges.push(`<span class="badge badge-low">Only ${product.stockTotal} left</span>`);
    }
    return badges.join("");
  }

  function productCard(product, { reveal = false } = {}) {
    if (!product) return "";
    const shop = LS.data.shopById(product.shopId);
    const wished = LS.wishlist ? LS.wishlist.has(product.id) : false;
    const comparing = LS.compare ? LS.compare.has(product.id) : false;
    const discount = LS.data.discountPercent(product);
    const alt = `${product.name} in ${product.colors[0]?.name || "signature colour"} — ${product.type} shoe from ${shop?.name || "a local shop"}`;
    return `<article class="product-card ${reveal ? "reveal" : ""}" data-product-card="${product.id}">
      <div class="card-media">
        <a href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${escapeHtml(product.name)}">
          <img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(alt)}" width="600" height="600" loading="lazy" decoding="async">
        </a>
        <div class="card-badges">${productBadge(product)}</div>
        <button class="card-fav ${wished ? "is-active" : ""}" type="button" data-wish-toggle="${product.id}" aria-label="${wished ? "Remove" : "Add"} ${escapeHtml(product.name)} ${wished ? "from" : "to"} wishlist" aria-pressed="${wished}">
          ${icon("heart", 18)}
        </button>
        <div class="card-actions">
          <button class="quick-add" type="button" data-quick-add="${product.id}" aria-label="Quick add ${escapeHtml(product.name)} to bag">
            ${icon("plus", 15)} <span>Quick add</span>
          </button>
          <button class="compare-add ${comparing ? "is-active" : ""}" type="button" data-compare-toggle="${product.id}" aria-label="${comparing ? "Remove from" : "Add to"} compare" aria-pressed="${comparing}" title="Compare">
            ${icon("columns", 16)}
          </button>
        </div>
      </div>
      <div class="card-body">
        ${shop ? `<a class="card-shop" href="shop.html?id=${encodeURIComponent(shop.id)}">${icon("pin", 10)} ${escapeHtml(shop.shortName)}</a>` : ""}
        <h3 class="card-title"><a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        <p class="card-sub">${escapeHtml(product.colors[0]?.name || "")} · ${product.sizes.filter((s) => s.stock > 0).length} sizes</p>
        <div class="card-bottom">
          <div class="price">
            ${amountHtml(product.price, "price-current")}
            ${product.oldPrice ? amountHtml(product.oldPrice, "price-old") : ""}
            ${discount ? `<span class="price-off">${discount}% off</span>` : ""}
          </div>
          ${stars(product.rating, product.reviewCount, { small: true })}
        </div>
      </div>
    </article>`;
  }

  function shopCard(shop, { distance = null, compact = false } = {}) {
    const status = LS.data.openState(shop);
    const count = LS.data.productsByShop(shop.id).length;
    return `<article class="shop-card ${compact ? "shop-card-compact" : ""}">
      <div class="shop-card-img">
        <a href="shop.html?id=${encodeURIComponent(shop.id)}" aria-label="Visit ${escapeHtml(shop.name)}">
          <img src="${escapeHtml(shop.banner)}" alt="${escapeHtml(shop.name)} storefront in ${escapeHtml(shop.area)}" width="640" height="360" loading="lazy" decoding="async">
        </a>
        ${status.open ? '<span class="badge badge-pickup"><span class="status-dot"></span> Open now</span>' : '<span class="badge badge-soft">Closed</span>'}
        ${distance !== null ? `<span class="shop-card-distance">${distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>` : ""}
      </div>
      <div class="shop-card-body">
        <div class="shop-card-head">
          <img class="shop-logo" src="${escapeHtml(shop.logo)}" alt="${escapeHtml(shop.name)} logo" width="42" height="42">
          <div>
            <h3 class="shop-card-name"><a href="shop.html?id=${encodeURIComponent(shop.id)}">${escapeHtml(shop.name)}</a></h3>
            <span class="shop-card-area">${icon("pin", 10)} ${escapeHtml(shop.area)}, ${escapeHtml(shop.city)}</span>
          </div>
        </div>
        <div class="shop-card-meta">
          ${stars(shop.rating, shop.reviewCount, { small: true })}
          <span>·</span>
          <span>${count} styles</span>
        </div>
        <div class="shop-card-foot">
          <span>${shop.pickup.available ? `${icon("store", 12)} Pickup available` : "Delivery only"}</span>
          <span class="open-status ${status.open ? "" : "closed"}"><span class="status-dot ${status.open ? "" : "closed"}"></span>${status.open ? "Open" : "Closed"}</span>
        </div>
      </div>
    </article>`;
  }

  /* ---------- quick add + size guide ---------- */
  function openQuickAdd(productId) {
    const product = LS.data.productById(productId);
    if (!product) return;
    let selectedSize = null;
    const firstAvailable = product.sizes.find((s) => s.stock > 0);
    if (!firstAvailable) {
      toast({ title: "Out of stock", message: "This pair is currently unavailable at the shop.", type: "error" });
      return;
    }
    const shop = LS.data.shopById(product.shopId);
    const sizeButtons = product.sizes.map((s) => `
      <button class="size-btn" type="button" data-size="${s.size}" ${s.stock <= 0 ? "disabled" : ""} aria-label="Size ${s.size}${s.stock <= 0 ? ", out of stock" : s.stock <= 2 ? `, only ${s.stock} left` : ""}">
        ${s.size}${s.stock > 0 && s.stock <= 2 ? `<span class="stock-note">${s.stock} left</span>` : ""}
      </button>`).join("");
    openModal(`
      <div class="modal-head">
        <span class="eyebrow">Quick add</span>
        <h2>${escapeHtml(product.name)}</h2>
        <p>Choose a size to add this pair from ${escapeHtml(shop?.name || "the shop")}.</p>
      </div>
      <div class="quick-add-product">
        <img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" width="120" height="120">
        <div>
          <div class="price price-lg mb-4">
            ${amountHtml(product.price, "price-current")}
            ${product.oldPrice ? amountHtml(product.oldPrice, "price-old") : ""}
          </div>
          <p class="tiny muted mb-4">${escapeHtml(product.colors[0]?.name || "")} · ${escapeHtml(product.material)}</p>
          <div class="row-between mb-4">
            <span class="label">Select size (UK)</span>
            <button class="link-underline" style="font-size:.68rem" type="button" data-open-size-guide="${product.id}">Size guide</button>
          </div>
          <div class="size-list" role="group" aria-label="Choose size">${sizeButtons}</div>
          <div class="field-error mt-4" id="quickAddError" role="alert"></div>
          <div class="row mt-4">
            <button class="btn btn-primary w-100" type="button" id="quickAddBtn" disabled>
              ${icon("bag", 17)} Add to bag
            </button>
          </div>
          <a class="link-quiet small" href="product.html?id=${encodeURIComponent(product.id)}" style="display:inline-block;margin-top:12px">View full details →</a>
        </div>
      </div>`, {
      label: `Quick add ${product.name}`,
      className: "modal-quick-add",
      onMount: (modal) => {
        const addBtn = modal.querySelector("#quickAddBtn");
        const error = modal.querySelector("#quickAddError");
        modal.querySelectorAll("[data-size]").forEach((btn) => {
          btn.addEventListener("click", () => {
            modal.querySelectorAll("[data-size]").forEach((b) => b.classList.remove("is-selected"));
            btn.classList.add("is-selected");
            selectedSize = btn.dataset.size;
            addBtn.disabled = false;
            error.textContent = "";
          });
        });
        addBtn.addEventListener("click", () => {
          if (!selectedSize) {
            error.textContent = "Please choose a size first.";
            return;
          }
          const sizeObj = product.sizes.find((s) => s.size === selectedSize);
          if (!sizeObj || sizeObj.stock <= 0) {
            error.textContent = "That size just sold out. Try another.";
            return;
          }
          LS.cart.add(product.id, selectedSize, product.colors[0]?.name || "Default", 1, addBtn);
          closeModal();
        });
        modal.querySelectorAll("[data-open-size-guide]").forEach((btn) => {
          btn.addEventListener("click", () => openSizeGuide(product));
        });
      }
    });
  }

  const SIZE_CHARTS = {
    men: [
      { uk: 6, us: 7, eu: 39, cm: 24.5 }, { uk: 7, us: 8, eu: 40.5, cm: 25.4 },
      { uk: 8, us: 9, eu: 42, cm: 26.0 }, { uk: 9, us: 10, eu: 43, cm: 26.7 },
      { uk: 10, us: 11, eu: 44.5, cm: 27.3 }, { uk: 11, us: 12, eu: 46, cm: 28.0 }, { uk: 12, us: 13, eu: 47, cm: 28.7 }
    ],
    women: [
      { uk: 3, us: 5.5, eu: 36, cm: 22.5 }, { uk: 4, us: 6.5, eu: 37, cm: 23.0 },
      { uk: 5, us: 7.5, eu: 38, cm: 23.8 }, { uk: 6, us: 8.5, eu: 39, cm: 24.5 },
      { uk: 7, us: 9.5, eu: 40.5, cm: 25.2 }, { uk: 8, us: 10.5, eu: 42, cm: 26.0 }, { uk: 9, us: 11.5, eu: 43, cm: 26.7 }
    ],
    kids: [
      { uk: 10, us: 11, eu: 28, cm: 17.0 }, { uk: 11, us: 12, eu: 29, cm: 17.8 },
      { uk: 12, us: 13, eu: 30, cm: 18.5 }, { uk: 13, us: 1, eu: 31, cm: 19.3 },
      { uk: 1, us: 2, eu: 33, cm: 20.0 }, { uk: 2, us: 3, eu: 34, cm: 20.8 },
      { uk: 3, us: 4, eu: 35, cm: 21.5 }, { uk: 4, us: 5, eu: 36, cm: 22.3 }, { uk: 5, us: 6, eu: 37, cm: 23.0 }
    ]
  };

  function openSizeGuide(product) {
    const category = product.category === "kids" ? "kids" : product.category === "women" ? "women" : "men";
    const chart = SIZE_CHARTS[category];
    const currentSize = product.sizes[0]?.size;
    const rows = chart.map((row) => `
      <tr class="${String(row.uk) === String(currentSize) ? "is-current" : ""}">
        <td>UK ${row.uk}</td><td>US ${row.us}</td><td>EU ${row.eu}</td><td>${row.cm} cm</td>
      </tr>`).join("");
    openModal(`
      <div class="modal-head">
        <span class="eyebrow">Fit help</span>
        <h2>Size guide</h2>
        <p>Measure your foot heel-to-toe while standing. If you're between sizes, go up for running and go down for unstructured leather.</p>
      </div>
      <table class="size-guide-table">
        <thead><tr><th scope="col">UK</th><th scope="col">US</th><th scope="col">EU</th><th scope="col">Foot length</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="size-quiz">
        <h4>${icon("ruler", 15)} Size finder</h4>
        <p>Enter your foot length in centimetres and we'll suggest a UK size.</p>
        <div class="size-quiz-row">
          <input class="input" type="number" min="12" max="34" step="0.1" inputmode="decimal" placeholder="e.g. 25.4" aria-label="Foot length in centimetres" id="footLength">
          <button class="btn btn-dark" type="button" id="sizeQuizBtn">Find my size</button>
        </div>
        <div class="size-result" id="sizeQuizResult" role="status" aria-live="polite"></div>
      </div>`, {
      label: "Size guide and size finder",
      className: "modal-size-guide",
      onMount: (modal) => {
        const input = modal.querySelector("#footLength");
        const result = modal.querySelector("#sizeQuizResult");
        modal.querySelector("#sizeQuizBtn").addEventListener("click", () => {
          const cm = parseFloat(input.value);
          if (!cm || cm < 12 || cm > 34) {
            result.textContent = "Please enter a foot length between 12 and 34 cm.";
            result.style.color = "var(--danger)";
            return;
          }
          const closest = [...chart].sort((a, b) => Math.abs(a.cm - cm) - Math.abs(b.cm - cm))[0];
          result.style.color = "";
          result.textContent = `We recommend UK ${closest.uk} (EU ${closest.eu}, US ${closest.us}) for a ${cm} cm foot.`;
        });
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") { event.preventDefault(); modal.querySelector("#sizeQuizBtn").click(); }
        });
      }
    });
  }

  /* ---------- chrome markup ---------- */
  function headerHtml() {
    const types = LS.data.types();
    const categoryImages = {
      sneakers: "assets/images/shoes/cream-heritage.jpg",
      running: "assets/images/shoes/red-racer.jpg",
      formal: "assets/images/shoes/espresso-derby.jpg",
      boots: "assets/images/shoes/tan-desert-boot.jpg",
      sandals: "assets/images/shoes/sand-slide.jpg",
      sports: "assets/images/shoes/white-azure.jpg",
      casual: "assets/images/shoes/teal-classic.jpg"
    };
    const megaLinks = types.slice(0, 7).map((type) => `
      <a class="mega-link" href="products.html?type=${type}">
        <img src="${categoryImages[type] || "assets/images/shoes/mono-court.jpg"}" alt="" width="58" height="58" loading="lazy">
        <div><strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><span>${LS.data.countByType(type)} styles</span></div>
      </a>`).join("");
    const current = location.pathname.split("/").pop() || "index.html";
    const navLink = (href, label, extra = "") => `<a class="nav-link ${extra}" href="${href}">${label}</a>`;
    const currentNav = (name) => current === name ? 'aria-current="page"' : "";
    return `<div class="announcement" id="announcement">
      <div class="container announcement-inner">
        <p><span class="dot" aria-hidden="true"></span> Free local delivery over ${money.fmt(1999)} <span aria-hidden="true">·</span> Reserve today, pick up from 8 neighbourhood shops</p>
        <a href="products.html?discount=1">Shop the sale</a>
        <button class="announcement-close" type="button" aria-label="Dismiss announcement">${icon("close", 14)}</button>
      </div>
    </div>
    <header class="site-header" id="siteHeader">
      <div class="container header-inner">
        <a class="brand" href="index.html" aria-label="Local Sole — home">
          <span class="brand-mark" aria-hidden="true"><svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M3 15c3.2-5 5.6-1.6 8.4-5.6C13.5 6.5 15.7 9 17.5 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="19" cy="17.5" r="1.8" fill="currentColor"/></svg></span>
          <span class="brand-word">local<em>sole</em><span class="dot">.</span></span>
        </a>
        <nav class="main-nav" aria-label="Primary navigation">
          <button class="nav-link" type="button" data-mega-trigger aria-expanded="false" aria-controls="megaMenu">Shop ${icon("chevronDown", 13)}</button>
          ${navLink("shops.html", "Local shops", currentNav("shops.html") || currentNav("shop.html"))}
          ${navLink("products.html?new=1", "New in")}
          ${navLink("products.html?discount=1", "Sale", "nav-sale")}
        </nav>
        <div class="header-actions">
          <button class="icon-btn search-mobile-btn" type="button" data-search-open aria-label="Open search" aria-expanded="false" aria-controls="headerSearch">${icon("search", 19)}</button>
          <div class="header-search" id="headerSearch">
            <form class="search-form" role="search" action="products.html" method="get">
              <label class="sr-only" for="siteSearchInput">Search products, brands and shops</label>
              ${icon("search", 16)}
              <input id="siteSearchInput" name="q" type="search" placeholder="Search shoes, brands, shops" autocomplete="off" aria-autocomplete="list" aria-controls="searchPanel" aria-expanded="false">
              <kbd class="search-kbd" aria-hidden="true">/</kbd>
              <button class="search-clear" type="button" hidden aria-label="Clear search">${icon("close", 13)}</button>
            </form>
            <div class="search-panel" id="searchPanel" role="listbox" aria-label="Search suggestions" hidden></div>
          </div>
          <div class="currency-switch">
            <label class="sr-only" for="currencySelect">Display currency</label>
            <select id="currencySelect">
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
          <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Switch theme" aria-pressed="false">${icon("moon", 19)}</button>
          <a class="icon-btn wishlist-header" href="wishlist.html" aria-label="Wishlist">${icon("heart", 19)}<span class="icon-count js-wishlist-count" aria-hidden="true">0</span></a>
          <button class="icon-btn" type="button" data-cart-open aria-label="Open shopping bag">${icon("bag", 19)}<span class="icon-count js-cart-count" aria-hidden="true">0</span></button>
          <button class="icon-btn menu-toggle" type="button" data-menu-open aria-label="Open menu" aria-expanded="false" aria-controls="menuDrawer">${icon("menu", 21)}</button>
        </div>
      </div>
      <div class="mega-menu" id="megaMenu" aria-label="Shop categories">
        <div class="mega-grid">${megaLinks}</div>
        <a class="mega-feature" href="products.html?discount=1">
          <img src="assets/images/banners/hero-1.jpg" alt="" width="400" height="230" loading="lazy">
          <div><h3>Mid-season<br>markdowns</h3><p>Up to 40% off last-pair stock, across the neighbourhood.</p><span class="link-underline">Shop the sale ${icon("arrowRight", 13)}</span></div>
        </a>
        <div class="mega-foot">
          <span>Shop by fit:</span>
          <a href="products.html?stock=1">In stock</a>
          <a href="products.html?new=1">New arrivals</a>
          <a href="products.html?rating=4.5">Top rated</a>
          <a href="shops.html?open=1">Open now</a>
          <a href="products.html?sort=discount">Biggest discounts</a>
        </div>
      </div>
    </header>`;
  }

  function mobileNavHtml() {
    const page = document.body.dataset.page;
    const active = (name) => page === name ? "is-active" : "";
    return `<nav class="mobile-nav" aria-label="Mobile navigation">
      <div class="mobile-nav-inner">
        <a href="index.html" class="${active("home")}">${icon("home", 21)}<span>Home</span></a>
        <a href="shops.html" class="${active("shops") || active("shop") ? "is-active" : ""}">${icon("store", 21)}<span>Shops</span></a>
        <a href="products.html" class="${active("products") ? "is-active" : ""}">${icon("search", 21)}<span>Browse</span></a>
        <a href="wishlist.html" class="${active("wishlist") ? "is-active" : ""}">${icon("heart", 21)}<span>Saved</span><span class="icon-count js-wishlist-count" aria-hidden="true">0</span></a>
        <a href="account.html" class="${active("account") ? "is-active" : ""}">${icon("user", 21)}<span>Account</span></a>
      </div>
    </nav>`;
  }

  function footerHtml() {
    const year = new Date().getFullYear();
    return `<footer class="site-footer">
      <div class="container">
        <div class="footer-main">
          <div class="footer-brand">
            <a class="brand" href="index.html" aria-label="Local Sole — home">
              <span class="brand-mark" aria-hidden="true"><svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M3 15c3.2-5 5.6-1.6 8.4-5.6C13.5 6.5 15.7 9 17.5 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="19" cy="17.5" r="1.8" fill="currentColor"/></svg></span>
              <span class="brand-word">local<em>sole</em><span class="dot">.</span></span>
            </a>
            <p>Eight independent shoe shops. One neighbourhood marketplace. Try local, buy local, keep the high street on its feet.</p>
            <div class="footer-newsletter">
              <span class="eyebrow no-rule">New pairs, first</span>
              <form class="newsletter-form" data-newsletter novalidate>
                <label class="sr-only" for="footerNewsletterEmail">Email address</label>
                <input class="input" id="footerNewsletterEmail" type="email" name="email" placeholder="Email address" autocomplete="email" required>
                <button class="btn btn-primary btn-sm" type="submit">Join</button>
              </form>
              <div class="newsletter-message" role="status" aria-live="polite"></div>
              <p class="newsletter-note">No spam. Unsubscribe any time.</p>
            </div>
            <div class="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Local Sole on Instagram">${icon("instagram", 16)}</a>
              <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Local Sole on Facebook">${icon("facebook", 16)}</a>
              <a href="https://wa.me/918041238890" target="_blank" rel="noopener" aria-label="Local Sole on WhatsApp">${icon("whatsapp", 16)}</a>
            </div>
          </div>
          <div class="footer-col">
            <h3>Shop</h3>
            <ul>
              <li><a href="products.html?type=sneakers">Sneakers</a></li>
              <li><a href="products.html?type=running">Running</a></li>
              <li><a href="products.html?type=formal">Formal</a></li>
              <li><a href="products.html?type=boots">Boots</a></li>
              <li><a href="products.html?type=sandals">Sandals</a></li>
              <li><a href="products.html?type=kids">Kids</a></li>
              <li><a href="products.html?new=1">New arrivals</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h3>Neighbourhoods</h3>
            <ul>
              <li><a href="shops.html?area=Indiranagar">Indiranagar</a></li>
              <li><a href="shops.html?area=Koramangala">Koramangala</a></li>
              <li><a href="shops.html?area=HSR Layout">HSR Layout</a></li>
              <li><a href="shops.html?area=Jayanagar">Jayanagar</a></li>
              <li><a href="shops.html?area=Whitefield">Whitefield</a></li>
              <li><a href="shops.html">All shops →</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h3>Help</h3>
            <ul>
              <li><a href="contact.html">Contact us</a></li>
              <li><a href="account.html#orders">Track an order</a></li>
              <li><a href="cart.html">Delivery & returns</a></li>
              <li><a href="contact.html#faq">Fit & size help</a></li>
              <li><a href="owner.html">Shop owner login</a></li>
              <li><a href="wishlist.html">Saved items</a></li>
              <li><a href="compare.html">Compare shoes</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${year} Local Sole, Bengaluru. A demo marketplace — no real payments are taken.</span>
          <div class="row">
            <div class="footer-pay" aria-label="Accepted payment methods">
              <span>UPI</span><span>VISA</span><span>MC</span><span>RUPAY</span><span>COD</span>
            </div>
            <span>Made for the neighbourhood.</span>
          </div>
        </div>
      </div>
    </footer>`;
  }

  function chromeMarkup() {
    return {
      overlays: `
        <div class="overlay" id="siteOverlay" hidden data-close-drawers></div>
        <aside class="drawer cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-labelledby="cartDrawerTitle" aria-hidden="true">
          <div class="drawer-head">
            <div><span class="eyebrow no-rule">Your bag</span><h2 id="cartDrawerTitle">Bag <span class="js-cart-count" aria-hidden="true">0</span></h2></div>
            <button class="drawer-close" type="button" data-close-cart aria-label="Close bag">${icon("close", 18)}</button>
          </div>
          <div class="drawer-body" id="cartDrawerBody"></div>
          <div class="drawer-foot" id="cartDrawerFoot"></div>
        </aside>
        <aside class="drawer drawer-left menu-panel" id="menuDrawer" role="dialog" aria-modal="true" aria-labelledby="menuDrawerTitle" aria-hidden="true">
          <div class="drawer-head">
            <div><span class="eyebrow no-rule">Local Sole</span><h2 id="menuDrawerTitle">Menu</h2></div>
            <button class="drawer-close" type="button" data-close-menu aria-label="Close menu">${icon("close", 18)}</button>
          </div>
          <div class="drawer-body">
            <div class="menu-links">
              <a href="shops.html">Local shops ${icon("arrowUpRight", 20)}</a>
              <a href="products.html?new=1">New arrivals ${icon("arrowUpRight", 20)}</a>
              <a href="products.html?discount=1">Sale ${icon("arrowUpRight", 20)}</a>
              <a href="wishlist.html">Wishlist ${icon("arrowUpRight", 20)}</a>
              <a href="account.html">Account ${icon("arrowUpRight", 20)}</a>
              <a href="owner.html">Shop owner demo ${icon("arrowUpRight", 20)}</a>
            </div>
            <div class="menu-block">
              <h3>Shop by type</h3>
              <div class="menu-cats">
                ${LS.data.types().map((t) => `<a href="products.html?type=${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</a>`).join("")}
              </div>
            </div>
            <div class="menu-block">
              <h3>Preferences</h3>
              <div class="row-between mt-2">
                <span class="small muted">Display currency</span>
                <div class="currency-switch" style="display:flex">
                  <label class="sr-only" for="currencySelectMenu">Display currency</label>
                  <select id="currencySelectMenu">
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
              </div>
              <div class="row-between mt-4">
                <span class="small muted">Appearance</span>
                <button class="btn btn-outline btn-sm" type="button" data-theme-toggle aria-label="Switch theme">Appearance</button>
              </div>
            </div>
            <div class="menu-block" style="border-bottom:0">
              <h3>Need a hand?</h3>
              <a class="link-quiet small" href="contact.html">Contact the team →</a><br>
              <a class="link-quiet small" href="tel:+918041238890">+91 80 4123 8890</a>
            </div>
          </div>
        </aside>
        <div class="modal-layer" id="modalLayer" hidden>
          <div class="modal-backdrop" data-modal-close></div>
          <div class="modal" role="dialog" aria-modal="true" aria-label="Dialog">
            <button class="modal-close" type="button" data-modal-close aria-label="Close dialog">${icon("close", 18)}</button>
            <div id="modalContent"></div>
          </div>
        </div>
        <div id="compareTrayMount"></div>
        <div class="toast-stack" id="toastStack" aria-live="polite" aria-atomic="false"></div>
        <button class="back-to-top" id="backToTop" type="button" aria-label="Back to top">${icon("arrowUp", 18)}</button>
        <div class="cookie-banner" id="cookieBanner" hidden role="dialog" aria-labelledby="cookieTitle" aria-modal="false">
          <h3 id="cookieTitle">${icon("cookie", 15)} A few crumbs</h3>
          <p>We use local storage to remember your bag, theme and recently viewed pairs. No third-party tracking. <a href="contact.html">Privacy note</a>.</p>
          <div class="cookie-actions">
            <button class="btn btn-primary btn-sm" type="button" data-cookie-accept>That's fine</button>
            <button class="btn btn-outline btn-sm" type="button" data-cookie-decline>Essential only</button>
          </div>
        </div>`
    };
  }

  /* ---------- chrome rendering + wiring ---------- */
  let chromeBound = false;

  function renderChrome() {
    const headerMount = document.getElementById("site-header");
    if (headerMount) headerMount.innerHTML = headerHtml();
    const footerMount = document.getElementById("site-footer");
    if (footerMount) footerMount.innerHTML = footerHtml();
    if (!document.getElementById("mobileNavMount")) {
      const mount = document.createElement("div");
      mount.id = "mobileNavMount";
      document.body.appendChild(mount);
    }
    const mobileMount = document.getElementById("mobileNavMount");
    if (mobileMount) mobileMount.innerHTML = mobileNavHtml();

    if (!document.getElementById("siteOverlay")) {
      const div = document.createElement("div");
      div.innerHTML = chromeMarkup().overlays;
      document.body.appendChild(div);
    }

    const currencySelect = document.getElementById("currencySelect");
    if (currencySelect) currencySelect.value = currentCurrency;
    const menuCurrency = document.getElementById("currencySelectMenu");
    if (menuCurrency) menuCurrency.value = currentCurrency;

    bindChrome();
    applyTheme(currentTheme);
    refreshCurrencyLabels();
    if (LS.cart) {
      LS.cart.updateCounts();
      LS.cart.renderDrawer();
      if (LS.compare) LS.compare.renderTray();
    }
  }

  function bindChrome() {
    if (chromeBound) return;
    chromeBound = true;

    // Announcement
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(ANNOUNCE_KEY) === "1"; } catch { /* noop */ }
    if (dismissed) document.getElementById("announcement")?.classList.add("is-dismissed");
    qsa(".announcement-close").forEach((btn) => btn.addEventListener("click", () => {
      document.getElementById("announcement")?.classList.add("is-dismissed");
      try { sessionStorage.setItem(ANNOUNCE_KEY, "1"); } catch { /* noop */ }
    }));

    // Theme + currency
    qsa("[data-theme-toggle]").forEach((btn) => btn.addEventListener("click", () => {
      toggleTheme();
    }));
    qsa("#currencySelect, #currencySelectMenu").forEach((select) => {
      select.addEventListener("change", (event) => setCurrency(event.target.value));
    });

    // Mega menu
    const megaTrigger = document.querySelector("[data-mega-trigger]");
    const megaMenu = document.getElementById("megaMenu");
    let megaTimer;
    const openMega = () => {
      if (!megaMenu) return;
      clearTimeout(megaTimer);
      megaMenu.classList.add("is-open");
      megaTrigger?.setAttribute("aria-expanded", "true");
    };
    const closeMega = () => {
      if (!megaMenu) return;
      megaMenu.classList.remove("is-open");
      megaTrigger?.setAttribute("aria-expanded", "false");
    };
    if (megaTrigger && megaMenu) {
      const nav = megaTrigger.closest(".main-nav");
      nav.addEventListener("mouseenter", openMega);
      nav.addEventListener("mouseleave", () => { megaTimer = setTimeout(closeMega, 160); });
      megaMenu.addEventListener("mouseenter", openMega);
      megaMenu.addEventListener("mouseleave", () => { megaTimer = setTimeout(closeMega, 160); });
      megaTrigger.addEventListener("click", () => {
        megaMenu.classList.contains("is-open") ? closeMega() : openMega();
      });
      megaTrigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          openMega();
          megaMenu.querySelector("a")?.focus();
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMega();
      });
      document.addEventListener("click", (event) => {
        if (!megaMenu.contains(event.target) && !megaTrigger.contains(event.target)) closeMega();
      });
      megaMenu.addEventListener("focusout", (event) => {
        if (!megaMenu.contains(event.relatedTarget) && !megaTrigger.contains(event.relatedTarget)) closeMega();
      });
    }

    // Sticky header state
    const header = document.getElementById("siteHeader");
    const onScroll = () => {
      header?.classList.toggle("is-stuck", window.scrollY > 6);
      const backTop = document.getElementById("backToTop");
      if (backTop) backTop.classList.toggle("is-visible", window.scrollY > 700);
      document.querySelectorAll(".sticky-buy").forEach((bar) => {
        bar.classList.toggle("is-visible", window.scrollY > 580);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Drawers
    qsa("[data-cart-open]").forEach((btn) => btn.addEventListener("click", (event) => {
      event.preventDefault();
      LS.cart?.renderDrawer();
      openDrawer("cartDrawer", btn);
    }));
    qsa("[data-close-cart]").forEach((btn) => btn.addEventListener("click", () => closeDrawer("cartDrawer")));
    qsa("[data-menu-open]").forEach((btn) => btn.addEventListener("click", () => {
      openDrawer("menuDrawer", btn);
      btn.setAttribute("aria-expanded", "true");
    }));
    qsa("[data-close-menu]").forEach((btn) => btn.addEventListener("click", () => {
      closeDrawer("menuDrawer");
      document.querySelector("[data-menu-open]")?.setAttribute("aria-expanded", "false");
    }));
    document.getElementById("siteOverlay")?.addEventListener("click", () => {
      qsa(".drawer.is-open").forEach((d) => closeDrawer(d.id, false));
      qsa(".filter-drawer.is-open").forEach((d) => d.classList.remove("is-open"));
      closeAllPanels();
      document.querySelector("[data-menu-open]")?.setAttribute("aria-expanded", "false");
    });
    qsa("[data-close-drawers]").forEach((el) => el.addEventListener("click", () => closeAllPanels()));

    // Modal
    qsa("[data-modal-close]").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!document.getElementById("modalLayer")?.hidden) closeModal();
      if (qsa(".drawer.is-open").length) closeAllPanels();
      const headerSearch = document.getElementById("headerSearch");
      if (headerSearch?.classList.contains("is-open")) {
        headerSearch.classList.remove("is-open");
        document.querySelector("[data-search-open]")?.setAttribute("aria-expanded", "false");
      }
    });

    // Back to top
    document.getElementById("backToTop")?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Cookie consent (UI only)
    let consent = null;
    try { consent = localStorage.getItem(COOKIE_KEY); } catch { /* noop */ }
    const cookieBanner = document.getElementById("cookieBanner");
    if (!consent && cookieBanner) {
      setTimeout(() => { if (!sessionStorage.getItem("ls_cookie_hidden")) cookieBanner.hidden = false; }, 1400);
      qsa("[data-cookie-accept], [data-cookie-decline]").forEach((btn) => btn.addEventListener("click", () => {
        const value = btn.hasAttribute("data-cookie-accept") ? "all" : "essential";
        save(COOKIE_KEY, value);
        cookieBanner.hidden = true;
      }));
    }

    // Newsletter forms (footer + dedicated bands)
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("form[data-newsletter]");
      if (!form) return;
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const message = form.parentElement.querySelector(".newsletter-message") || form.querySelector(".newsletter-message");
      const email = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (!valid) {
        if (message) { message.textContent = "Please enter a valid email address."; message.style.color = "var(--danger)"; }
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      const list = store("ls_newsletter_v1", []);
      if (!list.includes(email)) list.push(email);
      save("ls_newsletter_v1", list);
      if (message) { message.textContent = "You're on the list. Welcome to the neighbourhood."; message.style.color = "var(--success)"; }
      form.reset();
      toast({ title: "Subscribed", message: "First dibs on new pairs and local markdowns.", type: "success" });
    });

    // Wishlist / compare / quick add — delegated so grids can re-render freely.
    document.addEventListener("click", (event) => {
      const wish = event.target.closest("[data-wish-toggle]");
      if (wish) {
        event.preventDefault();
        const id = wish.dataset.wishToggle;
        LS.wishlist?.toggle(id);
        wish.classList.add("pop");
        setTimeout(() => wish.classList.remove("pop"), 500);
        return;
      }
      const cmp = event.target.closest("[data-compare-toggle]");
      if (cmp) {
        event.preventDefault();
        LS.compare?.toggle(cmp.dataset.compareToggle);
        return;
      }
      const quick = event.target.closest("[data-quick-add]");
      if (quick) {
        event.preventDefault();
        openQuickAdd(quick.dataset.quickAdd);
        return;
      }
      const sizeGuide = event.target.closest("[data-open-size-guide-modal]");
      if (sizeGuide) {
        event.preventDefault();
        const product = LS.data.productById(sizeGuide.dataset.openSizeGuideModal);
        if (product) openSizeGuide(product);
      }
    });

    // Image fade-in
    document.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      img.classList.add("img-fade");
      img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    });
  }

  function updateCounts() {
    const wishCount = LS.wishlist ? LS.wishlist.items.length : 0;
    qsa(".js-wishlist-count").forEach((el) => {
      el.textContent = wishCount;
      el.dataset.count = String(wishCount);
    });
  }

  function announce(message) {
    const live = document.getElementById("liveRegion") || (() => {
      const region = document.createElement("div");
      region.id = "liveRegion";
      region.className = "sr-only";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      document.body.appendChild(region);
      return region;
    })();
    live.textContent = "";
    setTimeout(() => { live.textContent = message; }, 60);
  }

  function init() {
    try { currentCurrency = localStorage.getItem(CURRENCY_KEY) || "INR"; } catch { currentCurrency = "INR"; }
    if (!RATES[currentCurrency]) currentCurrency = "INR";
    initTheme();
  }

  return {
    init,
    icon,
    escapeHtml,
    debounce,
    qs,
    qsa,
    store,
    save,
    getParam,
    formatDate,
    stars,
    money,
    get currency() { return currentCurrency; },
    setCurrency,
    applyTheme,
    toggleTheme,
    get theme() { return currentTheme; },
    toast,
    announce,
    renderChrome,
    openDrawer,
    closeDrawer,
    closeAllPanels,
    lockScroll,
    unlockScroll,
    openModal,
    closeModal,
    openQuickAdd,
    openSizeGuide,
    productCard,
    shopCard,
    productBadge,
    updateCounts,
    SIZE_CHARTS,
    refreshCurrency: refreshCurrencyLabels
  };
})();

// Apply the theme + currency as early as possible when ui.js loads.
LS.ui.init();
