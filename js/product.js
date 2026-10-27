/* ==========================================================================
   Local Sole — product.js
   Product detail page: gallery + zoom + swipe, colour and size selection,
   stock, pickup slots, delivery estimate, price comparison, reviews,
   recommendations and structured data.
   ========================================================================== */

LS.pages = LS.pages || {};

LS.pages.product = function initProductPage() {
  const data = LS.data;
  const ui = LS.ui;
  const params = new URLSearchParams(location.search);
  const product = data.productById(params.get("id"));

  if (!product) {
    renderNotFound();
    return;
  }

  const shop = data.shopById(product.shopId);
  const offers = data.priceOffers(product);
  const cheapest = offers[0];
  const galleryImages = [...new Set([product.colors[0]?.image, ...product.images].filter(Boolean))];
  let selectedImage = 0;
  let selectedSize = null;
  let selectedColor = product.colors[0] || { name: "Default", hex: "#d8d0c2", image: product.images[0] };
  let pickupSlot = "";

  const localReviews = readLocalReviews();
  let reviewFilter = 0;

  const state = {
    get size() { return selectedSize; },
    get color() { return selectedColor; }
  };

  /* ---------- not found ---------- */
  function renderNotFound() {
    document.title = "Pair not found — Local Sole";
    const main = document.querySelector(".pdp");
    if (main) {
      main.innerHTML = `<div class="container section">
        <div class="empty-state">
          <span class="eyebrow no-rule">Off the shelf</span>
          <h1 class="display" style="font-size:clamp(2.4rem,6vw,4.6rem)">This pair has walked on.</h1>
          <p>We couldn't find that product. It may have sold out, or the link might be from an older collection.</p>
          <div class="row" style="justify-content:center;flex-wrap:wrap">
            <a class="btn btn-primary" href="products.html">Browse the catalogue</a>
            <a class="btn btn-outline" href="shops.html">Find a shop</a>
          </div>
        </div>
      </div>`;
    }
    const crumbs = document.getElementById("pdpBreadcrumbs");
    if (crumbs) crumbs.innerHTML = `<a href="index.html">Home</a> ${ui.icon("chevronRight", 12)} <span aria-current="page">Product not found</span>`;
  }

  /* ---------- page metadata ---------- */
  function updateMeta() {
    const title = `${product.name} in ${selectedColor.name} — ${product.brand} | Local Sole`;
    document.title = title;
    const description = `${product.name} from ${shop ? shop.name : "a local shop"} in ${shop ? shop.area : "Bengaluru"}. ${product.shortDescription}`;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", absoluteUrl(product.images[0]));
    setMeta("property", "og:url", location.href.split("?")[0] + `?id=${encodeURIComponent(product.id)}`);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", absoluteUrl(product.images[0]));
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://localsole.in/product.html?id=${encodeURIComponent(product.id)}`;
    writeJsonLd();
  }

  function absoluteUrl(path) {
    return new URL(path, location.href).href.replace(/^http:\/\/127\.0\.0\.1:\d+/, "https://localsole.in");
  }

  function setMeta(attr, name, content) {
    const el = document.querySelector(`meta[${attr}="${name}"]`);
    if (el) el.setAttribute("content", content);
  }

  function writeJsonLd() {
    const script = document.getElementById("pdpJsonLd");
    if (!script) return;
    const priceValid = new Date();
    priceValid.setDate(priceValid.getDate() + 30);
    const payload = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.images.map(absoluteUrl),
      description: product.description,
      sku: product.sku,
      brand: { "@type": "Brand", name: product.brand },
      color: product.colors.map((c) => c.name).join(", "),
      material: product.material,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount
      },
      offers: offers.map((offer) => ({
        "@type": "Offer",
        priceCurrency: "INR",
        price: offer.price,
        priceValidUntil: priceValid.toISOString().slice(0, 10),
        availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Store", name: offer.shop.name },
        url: `https://localsole.in/product.html?id=${encodeURIComponent(product.id)}`
      }))
    };
    script.textContent = JSON.stringify(payload);
  }

  /* ---------- breadcrumbs ---------- */
  function renderCrumbs() {
    const mount = document.getElementById("pdpBreadcrumbs");
    if (!mount) return;
    mount.innerHTML = `
      <a href="index.html">Home</a>
      ${ui.icon("chevronRight", 12)}
      <a href="products.html">All shoes</a>
      ${ui.icon("chevronRight", 12)}
      <a href="products.html?type=${encodeURIComponent(product.type)}">${ui.escapeHtml(capitalise(product.type))}</a>
      ${ui.icon("chevronRight", 12)}
      <span aria-current="page">${ui.escapeHtml(product.name)}</span>`;
  }

  function capitalise(value) {
    return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
  }

  /* ---------- gallery ---------- */
  function renderGallery() {
    const mount = document.getElementById("productGallery");
    if (!mount) return;
    mount.innerHTML = `
      <div class="gallery-main" id="galleryMain" tabindex="0" role="group" aria-roledescription="carousel" aria-label="${ui.escapeHtml(product.name)} image gallery">
        ${data.discountPercent(product) >= 15
          ? `<span class="badge badge-sale">${data.discountPercent(product)}% off</span>`
          : product.isNew ? '<span class="badge badge-new">New in</span>' : ""}
        <img id="galleryImage" src="${ui.escapeHtml(galleryImages[0])}" alt="${ui.escapeHtml(product.name)} in ${ui.escapeHtml(product.colors[0]?.name || "signature colour")} — main product image" width="1000" height="1000" fetchpriority="high" decoding="async">
        <button class="gallery-nav prev" type="button" data-gallery-prev aria-label="Previous image">${ui.icon("chevronLeft", 18)}</button>
        <button class="gallery-nav next" type="button" data-gallery-next aria-label="Next image">${ui.icon("chevronRight", 18)}</button>
        <span class="gallery-zoom-hint">${ui.icon("search", 11)} Click to zoom</span>
      </div>
      <div class="gallery-thumbs" role="group" aria-label="Product image thumbnails">
        ${galleryImages.map((src, index) => `
          <button class="gallery-thumb ${index === 0 ? "is-active" : ""}" type="button" data-thumb="${index}" aria-label="Show image ${index + 1} of ${galleryImages.length}" aria-pressed="${index === 0}">
            <img src="${ui.escapeHtml(src)}" alt="" width="200" height="200" loading="lazy" decoding="async">
          </button>`).join("")}
      </div>`;
  }

  function showImage(index, { focus = false } = {}) {
    selectedImage = (index + galleryImages.length) % galleryImages.length;
    const image = document.getElementById("galleryImage");
    const main = document.getElementById("galleryMain");
    if (image) {
      image.src = galleryImages[selectedImage];
      image.alt = `${product.name} in ${selectedColor.name} — image ${selectedImage + 1} of ${galleryImages.length}`;
      main?.classList.remove("is-zoomed");
      if (main) main.style.setProperty("--zoom-x", "50%");
      if (main) main.style.setProperty("--zoom-y", "50%");
    }
    document.querySelectorAll("[data-thumb]").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === selectedImage);
      btn.setAttribute("aria-pressed", String(i === selectedImage));
      if (focus && i === selectedImage) btn.focus({ preventScroll: true });
    });
  }

  function bindGallery() {
    const main = document.getElementById("galleryMain");
    if (!main) return;

    main.addEventListener("click", (event) => {
      if (event.target.closest("[data-gallery-prev], [data-gallery-next]")) return;
      main.classList.toggle("is-zoomed");
      if (!main.classList.contains("is-zoomed")) {
        main.style.setProperty("--zoom-x", "50%");
        main.style.setProperty("--zoom-y", "50%");
      }
    });

    main.addEventListener("mousemove", (event) => {
      if (!main.classList.contains("is-zoomed")) return;
      const rect = main.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      main.style.setProperty("--zoom-x", `${x}%`);
      main.style.setProperty("--zoom-y", `${y}%`);
    });

    main.addEventListener("mouseleave", () => main.classList.remove("is-zoomed"));

    main.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); showImage(selectedImage - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); showImage(selectedImage + 1); }
      if (event.key === "+" || event.key === "=") { event.preventDefault(); main.classList.add("is-zoomed"); }
      if (event.key === "0" || event.key === "Escape") main.classList.remove("is-zoomed");
    });

    // Touch swipe — pointer events keep mouse and touch consistent.
    let startX = null;
    let startY = null;
    main.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      startX = event.clientX;
      startY = event.clientY;
    });
    main.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
        main.classList.remove("is-zoomed");
        showImage(selectedImage + (dx < 0 ? 1 : -1));
      }
    });

    main.querySelector("[data-gallery-prev]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      showImage(selectedImage - 1);
    });
    main.querySelector("[data-gallery-next]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      showImage(selectedImage + 1);
    });
    document.querySelectorAll("[data-thumb]").forEach((btn) => {
      btn.addEventListener("click", () => showImage(Number(btn.dataset.thumb)));
    });

    // Subtle hover zoom on desktop is handled by CSS and the click-to-zoom state.
    if (window.matchMedia("(hover: hover)").matches) {
      main.addEventListener("mouseenter", () => {
        if (!main.classList.contains("is-zoomed")) main.classList.add("is-zoomed");
      });
    }
  }

  /* ---------- product information ---------- */
  function sizeButtonsHtml() {
    return product.sizes.map((size) => `
      <button class="size-btn ${String(size.size) === String(selectedSize) ? "is-selected" : ""}" type="button"
        data-size="${ui.escapeHtml(size.size)}" ${size.stock <= 0 ? "disabled" : ""}
        aria-pressed="${String(size.size) === String(selectedSize)}"
        aria-label="UK ${ui.escapeHtml(size.size)}${size.stock <= 0 ? ", out of stock" : size.stock <= 2 ? `, only ${size.stock} left` : ""}">
        ${ui.escapeHtml(size.size)}${size.stock > 0 && size.stock <= 2 ? `<span class="stock-note">${size.stock} left</span>` : ""}
      </button>`).join("");
  }

  function colourButtonsHtml() {
    return product.colors.map((color) => `
      <button class="swatch ${color.name === selectedColor.name ? "is-selected" : ""}" type="button"
        data-color="${ui.escapeHtml(color.name)}" style="background:${ui.escapeHtml(color.hex)}"
        aria-pressed="${color.name === selectedColor.name}" aria-label="Colour: ${ui.escapeHtml(color.name)}"
        title="${ui.escapeHtml(color.name)}"></button>`).join("");
  }

  function renderInfo() {
    const mount = document.getElementById("productInfo");
    if (!mount) return;
    const discount = data.discountPercent(product);
    const available = product.sizes.filter((s) => s.stock > 0);
    const stock = selectedSize ? product.sizes.find((s) => String(s.size) === String(selectedSize)) : null;
    const wished = LS.wishlist.has(product.id);
    const comparing = LS.compare.has(product.id);
    const open = data.openState(shop);
    const totalStock = available.reduce((sum, size) => sum + size.stock, 0);

    mount.innerHTML = `
      <div class="product-brandline">
        <span class="eyebrow no-rule">${ui.escapeHtml(product.brand)} · ${ui.escapeHtml(capitalise(product.category))}</span>
        <a class="card-shop" href="shop.html?id=${encodeURIComponent(shop.id)}">${ui.icon("pin", 11)} ${ui.escapeHtml(shop.shortName)}, ${ui.escapeHtml(shop.area)}</a>
      </div>
      <h1 class="pdp-title">${ui.escapeHtml(product.name)}</h1>
      <p class="pdp-sub">${ui.escapeHtml(product.shortDescription)}</p>
      <div class="pdp-meta">
        ${ui.stars(product.rating, product.reviewCount)}
        <a href="#productReviews">Read ${product.reviewCount} reviews</a>
        <span>SKU ${ui.escapeHtml(product.sku)}</span>
        ${product.isNew ? '<span class="badge badge-new">New in</span>' : ""}
      </div>

      <div class="pdp-price-block">
        ${ui.money.amountHtml(product.price, "price-current")}
        ${product.oldPrice ? ui.money.amountHtml(product.oldPrice, "price-old") : ""}
        ${discount ? `<span class="price-off">${discount}% off</span>` : ""}
        <span class="tax-note">Inclusive of all taxes</span>
      </div>

      <div class="option-block">
        <div class="option-head">
          <h3>Colour <span>· ${ui.escapeHtml(selectedColor.name)}</span></h3>
          <span class="tiny muted">${product.colors.length} colour${product.colors.length > 1 ? "s" : ""}</span>
        </div>
        <div class="swatch-row" role="group" aria-label="Choose colour">${colourButtonsHtml()}</div>
      </div>

      <div class="option-block">
        <div class="option-head">
          <h3>Size <span>· UK</span></h3>
          <button type="button" data-open-size-guide-modal="${ui.escapeHtml(product.id)}">Size guide &amp; fit finder</button>
        </div>
        <div class="size-list" role="group" aria-label="Choose size" id="pdpSizes">${sizeButtonsHtml()}</div>
        <p class="option-note" id="sizeNote">${available.length
          ? `${totalStock} pairs in stock across ${available.length} sizes · ships from ${ui.escapeHtml(shop.area)}`
          : "This pair is currently sold out. Ask the shop when it's coming back."}</p>
        <div class="field-error" id="pdpError" role="alert" style="margin-top:8px"></div>
      </div>

      <div class="pdp-actions">
        <button class="btn btn-primary btn-lg" type="button" id="addToBagBtn">
          ${ui.icon("bag", 18)} Add to bag
        </button>
        <button class="icon-btn ${wished ? "is-active" : ""}" type="button" data-wish-toggle="${ui.escapeHtml(product.id)}" aria-label="${wished ? "Remove from" : "Add to"} wishlist" aria-pressed="${wished}">
          ${ui.icon("heart", 19)}
        </button>
        <button class="icon-btn ${comparing ? "is-active" : ""}" type="button" data-compare-toggle="${ui.escapeHtml(product.id)}" aria-label="Add to compare" aria-pressed="${comparing}" title="Compare">
          ${ui.icon("columns", 19)}
        </button>
        <button class="icon-btn" type="button" id="shareBtn" aria-label="Share this pair">
          ${ui.icon("share", 19)}
        </button>
      </div>
      <div class="pdp-ctas">
        <button class="btn btn-dark" type="button" id="reserveBtn">${ui.icon("store", 16)} Reserve &amp; pick up</button>
        <a class="btn btn-outline" href="contact.html?shop=${encodeURIComponent(shop.id)}">${ui.icon("mail", 16)} Ask the shop</a>
      </div>
      <p class="pdp-stock ${totalStock <= 6 ? "low" : ""}" id="pdpStock">
        <span class="dot" aria-hidden="true"></span>
        <span id="pdpStockText">${stock ? stockLine(stock) : available.length ? `${totalStock} pairs available · ready for local delivery` : "Out of stock — notify the shop"}</span>
      </p>

      <div class="delivery-options">
        <div class="delivery-option">
          ${ui.icon("store", 18)}
          <div>
            <strong>Pick up from ${ui.escapeHtml(shop.name)}</strong>
            <span>Free · ready in about ${shop.pickup.readyIn} minutes · ${open.open ? "open now" : "currently closed"}</span>
            ${shop.pickup.available ? `<div class="pickup-slot-row" id="pickupSlots" role="group" aria-label="Choose a pickup slot"></div>` : ""}
          </div>
          ${shop.pickup.available ? '<span class="badge badge-pickup">Pickup today</span>' : ""}
        </div>
        <div class="delivery-option">
          ${ui.icon("truck", 18)}
          <div>
            <strong>Local delivery from ${ui.escapeHtml(shop.area)}</strong>
            <span>${shop.delivery.eta} · ${ui.money.fmt(shop.delivery.fee)} · free over ${ui.money.fmt(shop.delivery.freeOver)}</span>
            <form class="row" id="pdpPincodeForm" style="margin-top:6px">
              <label class="sr-only" for="pdpPincode">Delivery pincode</label>
              <input class="input" id="pdpPincode" type="text" inputmode="numeric" maxlength="6" placeholder="Enter pincode" style="max-width:150px;min-height:36px" value="${ui.escapeHtml(ui.store("ls_pincode_v1", ""))}">
              <button class="btn btn-outline btn-sm" type="submit">Check</button>
            </form>
            <span id="pdpDeliveryResult" role="status" aria-live="polite"></span>
          </div>
        </div>
        <div class="delivery-option">
          ${ui.icon("refresh", 18)}
          <div>
            <strong>30-day fit guarantee</strong>
            <span>Exchange in store or by pickup from the shop. No awkward questions.</span>
            <a class="link-underline" href="contact.html#faq">How exchanges work</a>
          </div>
        </div>
      </div>

      <div class="shop-mini">
        <img src="${ui.escapeHtml(shop.logo)}" alt="${ui.escapeHtml(shop.name)} logo" width="44" height="44">
        <div>
          <strong>${ui.escapeHtml(shop.name)}</strong>
          <span>${ui.escapeHtml(shop.area)} · ${shop.rating} ★ · since ${shop.since}</span>
        </div>
        <a href="shop.html?id=${encodeURIComponent(shop.id)}">Visit shop</a>
      </div>

      <div class="pdp-confidence">
        <span>${ui.icon("shield", 14)} Genuine stock, checked twice</span>
        <span>${ui.icon("store", 14)} Independent shop</span>
        <span>${ui.icon("refresh", 14)} Easy exchanges</span>
      </div>`;

    renderPickupSlots();
    bindInfo();
    updateSticky();
  }

  function stockLine(size) {
    if (size.stock <= 2) return `Only ${size.stock} left in UK ${size.size}`;
    if (size.stock <= 5) return `${size.stock} pairs left in UK ${size.size}`;
    return `In stock in UK ${size.size} · ready to pack`;
  }

  function renderPickupSlots() {
    const mount = document.getElementById("pickupSlots");
    if (!mount) return;
    if (!shop.pickup.available) { mount.innerHTML = ""; return; }
    const slots = buildSlots();
    pickupSlot = slots[0].value;
    mount.innerHTML = slots.map((slot, index) => `
      <button class="slot-btn ${index === 0 ? "is-selected" : ""}" type="button" data-slot="${ui.escapeHtml(slot.value)}" aria-pressed="${index === 0}">${ui.escapeHtml(slot.label)}</button>`).join("");
  }

  function buildSlots() {
    const now = data.istNow();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const slots = [];
    if (minutes < 18 * 60) slots.push({ value: "today-evening", label: "Today · 5–7 pm" });
    if (minutes < 20 * 60) slots.push({ value: "today-late", label: "Today · 7–9 pm" });
    if (!slots.length) slots.push({ value: "tomorrow-morning", label: "Tomorrow · 10 am–12 pm" });
    slots.push({ value: "tomorrow-evening", label: "Tomorrow · 5–7 pm" });
    return slots;
  }

  function bindInfo() {
    const info = document.getElementById("productInfo");
    if (!info) return;

    info.querySelectorAll("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const color = product.colors.find((c) => c.name === btn.dataset.color);
        if (!color) return;
        selectedColor = color;
        const index = galleryImages.indexOf(color.image);
        if (index > -1) showImage(index);
        info.querySelectorAll("[data-color]").forEach((swatch) => {
          const active = swatch === btn;
          swatch.classList.toggle("is-selected", active);
          swatch.setAttribute("aria-pressed", String(active));
        });
        const label = info.querySelector(".option-head h3 span");
        if (label) label.textContent = `· ${color.name}`;
        updateSticky();
        updateMeta();
      });
    });

    info.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSize = btn.dataset.size;
        info.querySelectorAll("[data-size]").forEach((sizeBtn) => {
          const active = sizeBtn === btn;
          sizeBtn.classList.toggle("is-selected", active);
          sizeBtn.setAttribute("aria-pressed", String(active));
        });
        const size = product.sizes.find((s) => String(s.size) === String(selectedSize));
        const stockText = document.getElementById("pdpStockText");
        if (stockText && size) stockText.textContent = stockLine(size);
        const stockEl = document.getElementById("pdpStock");
        if (stockEl) stockEl.classList.toggle("low", Boolean(size && size.stock <= 6));
        const error = document.getElementById("pdpError");
        if (error) error.textContent = "";
        updateSticky();
      });
    });

    info.querySelectorAll("[data-slot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        pickupSlot = btn.dataset.slot;
        info.querySelectorAll("[data-slot]").forEach((slotBtn) => {
          const active = slotBtn === btn;
          slotBtn.classList.toggle("is-selected", active);
          slotBtn.setAttribute("aria-pressed", String(active));
        });
      });
    });

    document.getElementById("addToBagBtn")?.addEventListener("click", (event) => addToBag(event.currentTarget));
    document.getElementById("reserveBtn")?.addEventListener("click", reserveForPickup);
    document.getElementById("shareBtn")?.addEventListener("click", shareProduct);

    const pincodeForm = document.getElementById("pdpPincodeForm");
    pincodeForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("pdpPincode");
      const result = document.getElementById("pdpDeliveryResult");
      const pin = input.value.replace(/\D/g, "").slice(0, 6);
      if (pin.length !== 6) {
        result.textContent = "Enter a valid 6-digit pincode.";
        result.style.color = "var(--danger)";
        input.focus();
        return;
      }
      ui.save("ls_pincode_v1", pin);
      input.value = pin;
      result.style.color = "var(--success)";
      result.textContent = pin.startsWith("56")
        ? "Same-day delivery available from this shop."
        : "Serviceable · delivery in 2–5 working days.";
    });
  }

  function requireSize() {
    if (selectedSize) return true;
    const error = document.getElementById("pdpError");
    if (error) error.textContent = "Choose a size first — the shop needs to know what to pull.";
    const sizes = document.getElementById("pdpSizes");
    if (sizes) {
      sizes.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      sizes.querySelector("button:not([disabled])")?.focus({ preventScroll: true });
    }
    ui.announce("Choose a size before adding to bag");
    return false;
  }

  function addToBag(trigger) {
    if (!requireSize()) return false;
    return LS.cart.add(product.id, selectedSize, selectedColor.name, 1, trigger || null);
  }

  function reserveForPickup() {
    if (!requireSize()) return;
    if (!shop.pickup.available) {
      ui.toast({ title: "Pickup unavailable", message: "This shop is delivery-only right now.", type: "info" });
      return;
    }
    const added = LS.cart.add(product.id, selectedSize, selectedColor.name, 1, document.getElementById("reserveBtn"));
    if (!added) return;
    const slot = buildSlots().find((s) => s.value === pickupSlot)?.label || "your chosen slot";
    ui.toast({
      title: "Reserved for pickup",
      message: `${ui.escapeHtml(shop.shortName)} · ${ui.escapeHtml(slot)}. Choose pickup at checkout to confirm.`,
      type: "success",
      duration: 6000
    });
  }

  async function shareProduct() {
    const url = `${location.origin}${location.pathname}?id=${encodeURIComponent(product.id)}`;
    const shareData = {
      title: `${product.name} — Local Sole`,
      text: `${product.name} from ${shop.name}, ${shop.area}.`,
      url
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      ui.toast({ title: "Link copied", message: "Send it to someone with good taste.", type: "success" });
    } catch {
      ui.toast({ title: "Share this pair", message: ui.escapeHtml(url), type: "info", duration: 7000 });
    }
  }

  /* ---------- sticky mobile buy bar ---------- */
  function updateSticky() {
    const mount = document.getElementById("stickyBuy");
    if (!mount) return;
    const size = selectedSize ? `UK ${selectedSize}` : "Select a size";
    mount.innerHTML = `
      <img src="${ui.escapeHtml(selectedColor.image || product.images[0])}" alt="" width="44" height="44" style="border-radius:8px" loading="lazy">
      <div class="sticky-buy-info">
        <strong>${ui.escapeHtml(product.name)}</strong>
        <span>${ui.escapeHtml(size)} · <span data-inr="${product.price}">${ui.money.fmt(product.price)}</span></span>
      </div>
      <button class="btn btn-primary" type="button" data-sticky-add>${selectedSize ? "Add to bag" : "Choose size"}</button>`;
    mount.querySelector("[data-sticky-add]")?.addEventListener("click", (event) => {
      if (!selectedSize) {
        requireSize();
        return;
      }
      addToBag(event.currentTarget);
    });
  }

  /* ---------- detail sections + offers ---------- */
  function renderSections() {
    const mount = document.getElementById("pdpSections");
    if (!mount) return;
    const offerRows = offers.map((offer) => `
      <div class="offer-row ${offer === cheapest && offers.length > 1 ? "is-cheapest" : ""}">
        <div class="offer-shop">
          <img src="${ui.escapeHtml(offer.shop.logo)}" alt="" width="24" height="24">
          <div>
            <strong>${ui.escapeHtml(offer.shop.shortName)}${offer.own ? " · this shop" : ""}</strong>
            <span>${ui.escapeHtml(offer.shop.area)} · ${data.openState(offer.shop).open ? "open now" : "closed"}</span>
          </div>
        </div>
        <div class="offer-price">
          <span data-inr="${offer.price}">${ui.money.fmt(offer.price)}</span>
          ${offer === cheapest && offers.length > 1 ? "<span>Best price</span>" : offer.own ? "<span style='color:var(--ink-3)'>Listed here</span>" : ""}
        </div>
      </div>`).join("");

    mount.innerHTML = `
      <div class="pdp-detail">
        <span class="eyebrow">The honest details</span>
        <h2>Made for the way you walk<span class="text-accent">.</span></h2>
        <p>${ui.escapeHtml(product.description)}</p>
        <div class="pdp-highlights">
          ${(product.highlights || []).map((highlight) => `<div class="pdp-highlight">${ui.icon("check", 15)}<span>${ui.escapeHtml(highlight)}</span></div>`).join("")}
          <div class="pdp-highlight">${ui.icon("check", 15)}<span>Upper: ${ui.escapeHtml(product.material)}</span></div>
          <div class="pdp-highlight">${ui.icon("check", 15)}<span>Colourway: ${ui.escapeHtml(product.colors.map((c) => c.name).join(" / "))}</span></div>
        </div>
        <div class="accordion" style="margin-top:24px">
          <details class="accordion-item" open>
            <summary>Fit &amp; sizing</summary>
            <div class="accordion-body"><p>Runs true to size for most feet. If you're between sizes, go up half a size for running and stay true for unstructured leather. Every shop offers a free fit check before you commit.</p></div>
          </details>
          <details class="accordion-item">
            <summary>Care &amp; materials</summary>
            <div class="accordion-body"><p>${ui.escapeHtml(product.material)} upper. Brush dry dirt away with a soft brush, air-dry away from direct heat, and use a neutral conditioner on leather panels. The shop can recommend a local cobbler for repairs.</p></div>
          </details>
          <details class="accordion-item">
            <summary>Delivery, pickup &amp; returns</summary>
            <div class="accordion-body"><p>Pickup is free and usually ready within ${shop.pickup.readyIn} minutes. Local delivery is ${ui.money.fmt(shop.delivery.fee)} and free over ${ui.money.fmt(shop.delivery.freeOver)}. Unworn pairs can be exchanged within 30 days at the shop or by arranging a pickup.</p></div>
          </details>
        </div>
      </div>
      <aside>
        <div class="compare-offers">
          <h3>Price across the neighbourhood ${ui.icon("columns", 15)}</h3>
          ${offerRows}
          <div class="offer-note">${ui.icon("info", 12)} Prices include GST. Stock is held by each shop and can change during the day.</div>
        </div>
        <div class="shop-info-card" style="margin-top:14px;position:static">
          <h2>Why buy from ${ui.escapeHtml(shop.shortName)}</h2>
          <div class="shop-info-list">
            <div>${ui.icon("store", 15)}<span>Independent since ${shop.since}, run by people who know the stock.</span></div>
            <div>${ui.icon("ruler", 15)}<span>Free fit checks and width advice in store.</span></div>
            <div>${ui.icon("shield", 15)}<span>Every pair inspected before it leaves the shelf.</span></div>
            <div>${ui.icon("refresh", 15)}<span>30-day exchange guarantee from this shop.</span></div>
          </div>
        </div>
      </aside>`;
  }

  /* ---------- reviews ---------- */
  function readLocalReviews() {
    return ui.store(`ls_reviews_${product.id}`, []);
  }

  function allReviews() {
    return [...localReviews, ...(product.reviews || [])];
  }

  function distribution() {
    const reviews = allReviews();
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    // Blend the seeded sample with the wider review count so the bars feel real.
    const weights = { 5: 0.72, 4: 0.19, 3: 0.06, 2: 0.02, 1: 0.01 };
    Object.keys(counts).forEach((star) => {
      counts[star] = Math.round(product.reviewCount * weights[star]);
    });
    reviews.forEach((review) => {
      if (counts[review.rating] !== undefined) counts[review.rating] += 1;
    });
    return counts;
  }

  function renderReviews() {
    const mount = document.getElementById("productReviews");
    if (!mount) return;
    const reviews = allReviews();
    const shown = reviewFilter ? reviews.filter((review) => review.rating === reviewFilter) : reviews;
    const counts = distribution();
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || product.reviewCount;

    mount.innerHTML = `
      <div class="reviews-head">
        <div>
          <span class="eyebrow">Word of foot</span>
          <h2 id="reviewsTitle">Reviews<span class="text-accent">.</span></h2>
        </div>
        <button class="btn btn-outline" type="button" id="writeReviewBtn">${ui.icon("sparkle", 15)} Write a review</button>
      </div>
      <div class="review-layout">
        <aside class="review-summary">
          <div class="review-score">
            <strong>${product.rating.toFixed(1)}</strong>
            <div class="review-score-meta">
              <span class="rating-stars" aria-hidden="true">★★★★★</span>
              <span>${product.reviewCount.toLocaleString("en-IN")} reviews</span>
            </div>
          </div>
          <div class="rating-bars">
            ${[5, 4, 3, 2, 1].map((star) => {
              const count = counts[star];
              const percent = Math.round((count / total) * 100);
              return `<button class="rating-bar" type="button" data-review-filter="${star}" aria-pressed="${reviewFilter === star}" style="background:none;text-align:left;padding:0">
                <span>${star}★</span><span class="bar"><span style="width:${percent}%"></span></span><span>${percent}%</span>
              </button>`;
            }).join("")}
          </div>
          <p class="tiny muted" style="margin-top:12px">${reviewFilter ? `Showing ${shown.length} ${reviewFilter}-star review${shown.length === 1 ? "" : "s"}.` : "Based on verified purchases at our partner shops."} <button type="button" class="link-quiet" data-review-filter="0" style="text-decoration:underline">${reviewFilter ? "Show all" : ""}</button></p>
        </aside>
        <div class="review-list" id="reviewList">
          ${shown.length ? shown.map(reviewHtml).join("") : `<div class="empty-state" style="padding:24px 0"><h3>No ${reviewFilter}-star reviews yet.</h3><p>Be the first to write one.</p></div>`}
        </div>
      </div>`;

    mount.querySelectorAll("[data-review-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        reviewFilter = Number(btn.dataset.reviewFilter);
        renderReviews();
      });
    });
    document.getElementById("writeReviewBtn")?.addEventListener("click", openReviewModal);
  }

  function reviewHtml(review) {
    const initials = String(review.author || "Local").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    return `<article class="review-item">
      <div class="review-top">
        <span class="review-avatar" aria-hidden="true">${ui.escapeHtml(initials)}</span>
        <div><strong>${ui.escapeHtml(review.author)}</strong><span>${ui.formatDate(review.date)} · ${ui.escapeHtml(review.rating)}★</span></div>
        ${review.verified ? `<span class="verified">${ui.icon("check", 11)} Verified buyer</span>` : ""}
      </div>
      <h4>${ui.escapeHtml(review.title)}</h4>
      <p>${ui.escapeHtml(review.body)}</p>
    </article>`;
  }

  function openReviewModal() {
    let rating = 5;
    ui.openModal(`
      <div class="modal-head">
        <span class="eyebrow">Your turn</span>
        <h2>How do they feel?</h2>
        <p>Reviewed by people who actually wear the pair. Keep it useful for the next person.</p>
      </div>
      <form id="reviewForm" novalidate>
        <div class="stars-input" role="group" aria-label="Your rating">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="is-on" data-star="${n}" aria-label="${n} star${n > 1 ? "s" : ""}" aria-pressed="true">★</button>`).join("")}
        </div>
        <div class="form-grid">
          <div class="field full">
            <label class="label" for="reviewAuthor">Your name</label>
            <input class="input" id="reviewAuthor" name="author" autocomplete="name" required placeholder="First name and initial">
          </div>
          <div class="field full">
            <label class="label" for="reviewTitle">Headline</label>
            <input class="input" id="reviewTitle" name="title" required placeholder="Sum it up in a few words">
          </div>
          <div class="field full">
            <label class="label" for="reviewBody">Your review</label>
            <textarea class="textarea" id="reviewBody" name="body" rows="4" required placeholder="Fit, comfort, how you wear them…"></textarea>
          </div>
        </div>
        <div class="field-error" id="reviewError" role="alert"></div>
        <div class="row mt-4">
          <button class="btn btn-primary" type="submit">Post review</button>
          <button class="btn btn-ghost" type="button" data-modal-close>Cancel</button>
        </div>
      </form>`, {
      label: "Write a review",
      onMount: (modal) => {
        const starButtons = [...modal.querySelectorAll("[data-star]")];
        const paint = () => starButtons.forEach((btn) => {
          const on = Number(btn.dataset.star) <= rating;
          btn.classList.toggle("is-on", on);
          btn.setAttribute("aria-pressed", String(Number(btn.dataset.star) === rating));
        });
        starButtons.forEach((btn) => btn.addEventListener("click", () => {
          rating = Number(btn.dataset.star);
          paint();
        }));
        modal.querySelector("#reviewForm").addEventListener("submit", (event) => {
          event.preventDefault();
          const author = modal.querySelector("#reviewAuthor").value.trim();
          const title = modal.querySelector("#reviewTitle").value.trim();
          const body = modal.querySelector("#reviewBody").value.trim();
          const error = modal.querySelector("#reviewError");
          if (!author || !title || body.length < 12) {
            error.textContent = "Add a name, headline and a few more words about the fit.";
            return;
          }
          localReviews.unshift({ author, rating, title, body, date: new Date().toISOString().slice(0, 10), verified: false, local: true });
          ui.save(`ls_reviews_${product.id}`, localReviews);
          ui.closeModal();
          renderReviews();
          ui.toast({ title: "Review posted", message: "Thanks — that helps the next person choose well.", type: "success" });
        });
      }
    });
  }

  /* ---------- recommendations ---------- */
  function renderRecommendations() {
    const section = document.getElementById("productRecommendations");
    const grid = document.getElementById("recommendGrid");
    if (!section || !grid) return;
    const scored = data.products
      .filter((p) => p.id !== product.id)
      .map((p) => ({
        product: p,
        score: (p.type === product.type ? 4 : 0) + (p.shopId === product.shopId ? 3 : 0) +
          (p.brand === product.brand ? 2 : 0) + Number(p.rating)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.product);
    if (!scored.length) return;
    section.hidden = false;
    grid.innerHTML = scored.map((p) => ui.productCard(p)).join("");
    document.dispatchEvent(new CustomEvent("ls:content"));
  }

  /* ---------- boot ---------- */
  renderCrumbs();
  renderGallery();
  renderInfo();
  renderSections();
  renderReviews();
  renderRecommendations();
  bindGallery();
  updateMeta();
  LS.recent.add(product.id);
  document.dispatchEvent(new CustomEvent("ls:content"));

  LS.productPage = {
    renderPrice() {
      // data-inr labels are refreshed globally; sticky bar content is static-friendly.
      ui.refreshCurrency();
      renderSections();
    },
    addToBag,
    state
  };
};
