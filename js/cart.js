/* ==========================================================================
   Local Sole — cart.js
   Bag, wishlist, compare and recently-viewed state (localStorage), mini-cart,
   full cart page, coupons, shipping estimates and fly-to-bag motion.
   ========================================================================== */

window.LS = window.LS || {};

LS.cart = (() => {
  const CART_KEY = "ls_cart_v1";
  const SAVED_KEY = "ls_saved_v1";
  const COUPON_KEY = "ls_coupon_v1";
  const PINCODE_KEY = "ls_pincode_v1";
  const FREE_SHIPPING = 1999;

  const COUPONS = {
    WELCOME10: { type: "percent", value: 10, max: 500, min: 999, label: "10% off your first order" },
    FREESHIP: { type: "shipping", value: 0, min: 0, label: "Free delivery" },
    SOLE150: { type: "flat", value: 150, min: 2999, label: "₹150 off orders over ₹2,999" },
    LOCAL5: { type: "percent", value: 5, max: 1000, min: 4999, label: "5% off orders over ₹4,999" }
  };

  const items = LS.ui.store(CART_KEY, []);
  const savedItems = LS.ui.store(SAVED_KEY, []);
  let coupon = LS.ui.store(COUPON_KEY, null);

  const keyFor = (id, size, color) => `${id}::${size}::${color}`;

  function uid() {
    return `LS${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
  }

  function lines() {
    if (!LS.data.products.length) return [];
    return items
      .map((item) => {
        const product = LS.data.productById(item.id);
        if (!product) return null;
        const sizeObj = product.sizes.find((s) => String(s.size) === String(item.size));
        return {
          ...item,
          key: keyFor(item.id, item.size, item.color),
          product,
          sizeObj,
          lineTotal: product.price * item.qty
        };
      })
      .filter(Boolean);
  }

  function count() {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }

  function saveCart() {
    LS.ui.save(CART_KEY, items);
    updateCounts();
    renderDrawer();
    if (document.body.dataset.page === "cart") renderCartPage();
    document.dispatchEvent(new CustomEvent("ls:cart"));
  }

  function add(id, size, color = "Default", qty = 1, trigger = null) {
    const product = LS.data.productById(id);
    if (!product) return false;
    const sizeObj = product.sizes.find((s) => String(s.size) === String(size));
    if (!sizeObj || sizeObj.stock <= 0) {
      LS.ui.toast({ title: "That size is out of stock", message: "Choose another size to continue.", type: "error" });
      return false;
    }
    const existing = items.find((i) => i.id === id && String(i.size) === String(size) && i.color === color);
    if (existing) {
      existing.qty = Math.min(sizeObj.stock, existing.qty + qty);
    } else {
      items.push({ id, size: String(size), color, qty: Math.min(sizeObj.stock, qty) });
    }
    LS.ui.save(CART_KEY, items);
    flyToCart(product, trigger);
    updateCounts();
    renderDrawer();
    if (document.body.dataset.page === "cart") renderCartPage();
    document.dispatchEvent(new CustomEvent("ls:cart"));
    bounceBadge();
    LS.ui.toast({
      title: "Added to bag",
      message: `${LS.ui.escapeHtml(product.name)} · UK ${size}`,
      type: "success",
      action: { label: "View bag →", href: "cart.html" }
    });
    if (!trigger || !trigger.closest("#cartDrawer")) {
      setTimeout(() => LS.ui.openDrawer("cartDrawer"), 420);
    }
    return true;
  }

  function setQty(key, qty) {
    const item = items.find((i) => keyFor(i.id, i.size, i.color) === key);
    if (!item) return;
    if (qty <= 0) return remove(key);
    const product = LS.data.productById(item.id);
    const sizeObj = product?.sizes.find((s) => String(s.size) === String(item.size));
    const max = sizeObj ? sizeObj.stock : qty;
    item.qty = Math.min(qty, Math.max(1, max));
    saveCart();
    if (document.body.dataset.page === "cart") renderCartPage();
  }

  function remove(key) {
    const index = items.findIndex((i) => keyFor(i.id, i.size, i.color) === key);
    if (index === -1) return;
    const [removed] = items.splice(index, 1);
    LS.ui.save(CART_KEY, items);
    updateCounts();
    renderDrawer();
    document.dispatchEvent(new CustomEvent("ls:cart"));
    if (document.body.dataset.page === "cart") renderCartPage();
    const product = LS.data.productById(removed.id);
    LS.ui.toast({
      title: "Removed from bag",
      message: product ? LS.ui.escapeHtml(product.name) : "Item removed",
      type: "info",
      action: { label: "Undo", href: "#undo-remove" }
    });
    // Simple one-click undo within the toast lifetime.
    setTimeout(() => {
      const link = document.querySelector('.toast a[href="#undo-remove"]');
      if (link) link.addEventListener("click", (event) => {
        event.preventDefault();
        items.push(removed);
        saveCart();
        if (document.body.dataset.page === "cart") renderCartPage();
      }, { once: true });
    }, 30);
  }

  function saveForLater(key) {
    const index = items.findIndex((i) => keyFor(i.id, i.size, i.color) === key);
    if (index === -1) return;
    const [item] = items.splice(index, 1);
    if (!savedItems.some((i) => keyFor(i.id, i.size, i.color) === key)) savedItems.push(item);
    LS.ui.save(CART_KEY, items);
    LS.ui.save(SAVED_KEY, savedItems);
    updateCounts();
    renderDrawer();
    if (document.body.dataset.page === "cart") renderCartPage();
    document.dispatchEvent(new CustomEvent("ls:cart"));
    LS.ui.toast({ title: "Saved for later", message: "We'll keep it here while you decide.", type: "info" });
  }

  function moveToCart(key) {
    const index = savedItems.findIndex((i) => keyFor(i.id, i.size, i.color) === key);
    if (index === -1) return;
    const item = savedItems[index];
    if (items.some((i) => keyFor(i.id, i.size, i.color) === key)) {
      savedItems.splice(index, 1);
    } else {
      savedItems.splice(index, 1);
      items.push(item);
    }
    LS.ui.save(CART_KEY, items);
    LS.ui.save(SAVED_KEY, savedItems);
    updateCounts();
    renderDrawer();
    if (document.body.dataset.page === "cart") renderCartPage();
    LS.ui.toast({ title: "Moved to bag", message: "Ready when you are.", type: "success" });
  }

  function clear() {
    items.length = 0;
    coupon = null;
    LS.ui.save(CART_KEY, items);
    LS.ui.save(COUPON_KEY, null);
    updateCounts();
    renderDrawer();
    document.dispatchEvent(new CustomEvent("ls:cart"));
  }

  function shopGroups() {
    const groups = new Map();
    lines().forEach((line) => {
      if (!groups.has(line.product.shopId)) groups.set(line.product.shopId, { shop: LS.data.shopById(line.product.shopId), lines: [] });
      groups.get(line.product.shopId).lines.push(line);
    });
    return [...groups.values()];
  }

  function validCoupon(code) {
    const normalized = String(code || "").trim().toUpperCase();
    return COUPONS[normalized] ? { code: normalized, ...COUPONS[normalized] } : null;
  }

  function applyCoupon(code) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return { ok: false, message: "Enter a coupon code." };
    const found = validCoupon(normalized);
    if (!found) return { ok: false, message: "That code doesn't look right. Try WELCOME10." };
    const subtotal = totals().subtotal;
    if (subtotal < (found.min || 0)) {
      return { ok: false, message: `This code unlocks at ${LS.ui.money.fmt(found.min)}. Add a little more.` };
    }
    coupon = normalized;
    LS.ui.save(COUPON_KEY, coupon);
    document.dispatchEvent(new CustomEvent("ls:cart"));
    if (document.body.dataset.page === "cart") renderCartPage();
    return { ok: true, message: `${normalized} applied — ${found.label}.` };
  }

  function clearCoupon() {
    coupon = null;
    LS.ui.save(COUPON_KEY, null);
    document.dispatchEvent(new CustomEvent("ls:cart"));
    if (document.body.dataset.page === "cart") renderCartPage();
  }

  function totals() {
    const all = lines();
    const subtotal = all.reduce((sum, line) => sum + line.lineTotal, 0);
    const listTotal = all.reduce((sum, line) => sum + (line.product.oldPrice || line.product.price) * line.qty, 0);
    const productSavings = Math.max(0, listTotal - subtotal);
    const active = validCoupon(coupon);
    let discount = 0;
    let freeShipping = false;

    if (active) {
      if (active.type === "percent") discount = Math.min(active.max || Infinity, Math.round(subtotal * (active.value / 100)));
      if (active.type === "flat") discount = Math.min(subtotal, active.value);
      if (active.type === "shipping") freeShipping = true;
    }

    let shipping = 0;
    shopGroups().forEach(({ shop, lines: shopLines }) => {
      const shopSubtotal = shopLines.reduce((sum, l) => sum + l.lineTotal, 0);
      if (shopSubtotal < (shop.delivery.freeOver || 0)) shipping += shop.delivery.fee || 0;
    });
    if (freeShipping) shipping = 0;
    if (subtotal === 0) shipping = 0;

    return {
      subtotal,
      productSavings,
      couponDiscount: discount,
      shipping,
      total: Math.max(0, subtotal - discount) + shipping,
      itemCount: count(),
      coupon: active ? { ...active, code: coupon } : null,
      freeShipping,
      freeShippingRemaining: Math.max(0, FREE_SHIPPING - subtotal),
      shopGroups: shopGroups(),
      pincode: LS.ui.store(PINCODE_KEY, "")
    };
  }

  /* ---------- UI ---------- */
  function fmt(amount) {
    return `<span data-inr="${amount}">${LS.ui.money.fmt(amount)}</span>`;
  }

  function cartLineHtml(line) {
    const { product, key } = line;
    return `<div class="cart-line" data-cart-line="${LS.ui.escapeHtml(key)}">
      <a href="product.html?id=${encodeURIComponent(product.id)}" tabindex="-1" aria-hidden="true">
        <img class="cart-line-img" src="${LS.ui.escapeHtml(product.images[0])}" alt="" width="78" height="78" loading="lazy">
      </a>
      <div class="cart-line-main">
        <div class="cart-line-top">
          <a class="cart-line-title" href="product.html?id=${encodeURIComponent(product.id)}">${LS.ui.escapeHtml(product.name)}</a>
          <span class="cart-line-price">${fmt(line.lineTotal)}</span>
        </div>
        <span class="cart-line-variant">${LS.ui.escapeHtml(line.color)} · UK ${LS.ui.escapeHtml(line.size)}</span>
        <div class="cart-line-actions">
          <div class="qty">
            <button type="button" data-cart-minus="${LS.ui.escapeHtml(key)}" aria-label="Decrease quantity of ${LS.ui.escapeHtml(product.name)}">−</button>
            <span aria-label="Quantity ${line.qty}">${line.qty}</span>
            <button type="button" data-cart-plus="${LS.ui.escapeHtml(key)}" aria-label="Increase quantity of ${LS.ui.escapeHtml(product.name)}" ${line.qty >= (line.sizeObj?.stock || 1) ? "disabled" : ""}>+</button>
          </div>
          <button class="cart-remove" type="button" data-cart-remove="${LS.ui.escapeHtml(key)}">Remove</button>
        </div>
      </div>
    </div>`;
  }

  function drawerEmpty() {
    return `<div class="drawer-empty">
      <div class="drawer-empty-icon">${LS.ui.icon("bag", 28)}</div>
      <strong>Your bag is empty</strong>
      <p class="small muted" style="max-width:26ch">Start with the pairs our neighbourhood shops can't keep on the shelf.</p>
      <a class="btn btn-primary btn-sm mt-2" href="products.html">Browse the edit</a>
    </div>`;
  }

  function renderDrawer() {
    const body = document.getElementById("cartDrawerBody");
    const foot = document.getElementById("cartDrawerFoot");
    if (!body || !foot) return;
    const all = lines();
    if (!all.length) {
      body.innerHTML = drawerEmpty();
      foot.innerHTML = "";
      return;
    }
    const t = totals();
    const progress = Math.min(100, Math.round((t.subtotal / FREE_SHIPPING) * 100));
    const groupHtml = t.shopGroups.map(({ shop, lines: shopLines }) => `
      <div class="cart-group">
        <div class="cart-group-head">
          <span>${LS.ui.escapeHtml(shop.shortName)} · ${shop.pickup.available ? "Pickup" : "Delivery"}</span>
          <span>${shopLines.length} item${shopLines.length > 1 ? "s" : ""}</span>
        </div>
        ${shopLines.map(cartLineHtml).join("")}
      </div>`).join("");

    body.innerHTML = `
      <div class="shipping-meter">
        <p>${t.freeShippingRemaining > 0
          ? `You're <strong>${LS.ui.money.fmt(t.freeShippingRemaining)}</strong> away from free delivery.`
          : `${LS.ui.icon("check", 12)} Free delivery unlocked. Nice.`}</p>
        <div class="meter-track"><div class="meter-fill" style="width:${t.freeShippingRemaining > 0 ? progress : 100}%"></div></div>
      </div>
      ${groupHtml}
      ${(() => {
        const suggestion = LS.data.products
          .filter((p) => !all.some((l) => l.id === p.id) && p.price < t.subtotal / Math.max(1, all.length) && p.isBestSeller)
          .sort((a, b) => b.rating - a.rating)[0];
        if (!suggestion) return "";
        return `<a class="cart-upsell" href="product.html?id=${encodeURIComponent(suggestion.id)}">
          <img src="${LS.ui.escapeHtml(suggestion.images[0])}" alt="${LS.ui.escapeHtml(suggestion.name)}" width="50" height="50" loading="lazy">
          <div><strong>${LS.ui.escapeHtml(suggestion.name)}</strong><span>Pairs well · ${LS.ui.money.fmt(suggestion.price)}</span></div>
          <span style="margin-left:auto">${LS.ui.icon("arrowRight", 16)}</span>
        </a>`;
      })()}`;

    foot.innerHTML = `
      <div class="cart-totals">
        <div><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
        ${t.productSavings ? `<div class="text-success"><span>You save</span><span>− ${fmt(t.productSavings)}</span></div>` : ""}
        <div class="muted"><span>Delivery</span><span>${t.shipping ? fmt(t.shipping) : "Free"}</span></div>
        <div class="total"><span>Total</span><span>${fmt(t.total)}</span></div>
      </div>
      <div class="stack gap-2 mt-4">
        <a class="btn btn-primary btn-block" href="checkout.html">Checkout ${LS.ui.icon("arrowRight", 16)}</a>
        <a class="btn btn-ghost btn-block" href="cart.html">View bag · ${t.itemCount} item${t.itemCount > 1 ? "s" : ""}</a>
      </div>
      <p class="secure-note">${LS.ui.icon("lock", 11)} Secure demo checkout · no real payment taken</p>`;
  }

  function updateCounts() {
    const totalQty = count();
    document.querySelectorAll(".js-cart-count").forEach((el) => {
      el.textContent = totalQty;
      el.dataset.count = String(totalQty);
    });
    if (LS.ui.updateCounts) LS.ui.updateCounts();
    const checkoutBadge = document.querySelector("[data-checkout-count]");
    if (checkoutBadge) checkoutBadge.textContent = totalQty;
  }

  function bounceBadge() {
    document.querySelectorAll('[data-cart-open] .icon-count').forEach((el) => {
      el.classList.remove("cart-bounce");
      void el.offsetWidth;
      el.classList.add("cart-bounce");
      setTimeout(() => el.classList.remove("cart-bounce"), 600);
    });
  }

  function flyToCart(product, trigger) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = document.querySelector("[data-cart-open]");
    if (!target) return;
    let source = null;
    const card = trigger?.closest(".product-card");
    source = card?.querySelector(".card-media img") || trigger?.querySelector?.("img") || null;
    if (!source) {
      // Product page gallery or fallback.
      source = document.querySelector(".gallery-main img");
      if (!source) return;
    }
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!sourceRect.width) return;
    const clone = document.createElement("img");
    clone.src = source.currentSrc || source.src;
    clone.alt = "";
    clone.className = "fly-clone";
    const size = Math.min(sourceRect.width, 120);
    Object.assign(clone.style, {
      left: `${sourceRect.left + sourceRect.width / 2 - size / 2}px`,
      top: `${sourceRect.top + sourceRect.height / 2 - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`
    });
    clone.style.setProperty("--fly-x", `${targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2}px`);
    clone.style.setProperty("--fly-y", `${targetRect.top + targetRect.height / 2 - sourceRect.top - sourceRect.height / 2}px`);
    document.body.appendChild(clone);
    setTimeout(() => clone.remove(), 760);
  }

  /* ---------- full cart page ---------- */
  function cartPageEmpty() {
    return `<div class="empty-state">
      <div class="drawer-empty-icon" style="width:84px;height:84px;margin:0 auto 16px;color:var(--ink-3)">${LS.ui.icon("bag", 36)}</div>
      <span class="eyebrow no-rule">Nothing here yet</span>
      <h2>Your bag is taking the day off.</h2>
      <p>Save a pair from one of our eight neighbourhood shops. We'll keep it here for you.</p>
      <div class="row" style="justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary" href="products.html">Browse all shoes</a>
        <a class="btn btn-outline" href="wishlist.html">View wishlist</a>
      </div>
    </div>`;
  }

  function renderCartPage() {
    const main = document.getElementById("cartPage");
    const summary = document.getElementById("cartSummary");
    if (!main || !summary) return;
    const t = totals();
    const all = lines();

    if (!all.length) {
      main.innerHTML = cartPageEmpty();
      summary.innerHTML = "";
      const saved = document.getElementById("savedLater");
      if (saved) saved.innerHTML = savedLaterHtml();
      return;
    }

    main.innerHTML = `
      <div class="row-between mb-4">
        <h1 class="display" style="font-size:clamp(2rem,4vw,3rem)">Your bag<span class="text-accent">.</span></h1>
        <span class="small muted">${t.itemCount} item${t.itemCount > 1 ? "s" : ""} · ${t.shopGroups.length} shop${t.shopGroups.length > 1 ? "s" : ""}</span>
      </div>
      ${t.shopGroups.map(({ shop, lines: shopLines }) => {
        const shopSubtotal = shopLines.reduce((sum, l) => sum + l.lineTotal, 0);
        const free = shopSubtotal >= (shop.delivery.freeOver || 0);
        return `<section class="cart-shop-group" aria-label="Items from ${LS.ui.escapeHtml(shop.name)}">
          <div class="cart-shop-head">
            <div class="row">
              <img src="${LS.ui.escapeHtml(shop.logo)}" alt="" width="28" height="28">
              <div>
                <a href="shop.html?id=${encodeURIComponent(shop.id)}"><strong>${LS.ui.escapeHtml(shop.name)}</strong></a>
                <span>${LS.ui.escapeHtml(shop.area)} · ${free ? "Free delivery" : `Delivery ${LS.ui.money.fmt(shop.delivery.fee)}`} · ${shop.pickup.available ? `Pickup in ${shop.pickup.readyIn} min` : "Delivery only"}</span>
              </div>
            </div>
            <a class="link-quiet tiny" href="shop.html?id=${encodeURIComponent(shop.id)}">Visit shop →</a>
          </div>
          ${shopLines.map((line) => `
            <div class="cart-page-line">
              <a href="product.html?id=${encodeURIComponent(line.product.id)}" tabindex="-1" aria-hidden="true">
                <img src="${LS.ui.escapeHtml(line.product.images[0])}" alt="" width="100" height="100" loading="lazy">
              </a>
              <div class="cart-line-info">
                <a class="cart-line-name" href="product.html?id=${encodeURIComponent(line.product.id)}">${LS.ui.escapeHtml(line.product.name)}</a>
                <span class="cart-line-meta">${LS.ui.escapeHtml(line.color)} · UK ${LS.ui.escapeHtml(line.size)} · ${LS.ui.escapeHtml(line.product.brand)}</span>
                <span class="cart-line-stock">${line.sizeObj && line.sizeObj.stock <= 3 ? `Only ${line.sizeObj.stock} left in this size` : "In stock · ready to pack"}</span>
                <div class="cart-line-buttons">
                  <div class="qty">
                    <button type="button" data-cart-minus="${LS.ui.escapeHtml(line.key)}" aria-label="Decrease quantity of ${LS.ui.escapeHtml(line.product.name)}">−</button>
                    <span aria-label="Quantity ${line.qty}">${line.qty}</span>
                    <button type="button" data-cart-plus="${LS.ui.escapeHtml(line.key)}" aria-label="Increase quantity of ${LS.ui.escapeHtml(line.product.name)}" ${line.qty >= (line.sizeObj?.stock || 1) ? "disabled" : ""}>+</button>
                  </div>
                  <button type="button" data-cart-save="${LS.ui.escapeHtml(line.key)}">Save for later</button>
                  <button type="button" data-cart-remove="${LS.ui.escapeHtml(line.key)}">Remove</button>
                </div>
              </div>
              <div class="cart-line-total">
                ${fmt(line.lineTotal)}
                ${line.product.oldPrice ? `<s>${fmt(line.product.oldPrice * line.qty)}</s>` : ""}
              </div>
            </div>`).join("")}
        </section>`;
      }).join("")}
      <div class="row-between mt-4">
        <a class="link-underline small" href="products.html">← Continue shopping</a>
        <span class="small muted">30-day returns at every shop</span>
      </div>`;

    const couponHtml = t.coupon
      ? `<div class="coupon-applied"><span>${LS.ui.icon("tag", 13)} ${t.coupon.code} · ${t.coupon.label}</span><button type="button" id="removeCoupon">Remove</button></div>`
      : `<form class="coupon-form" id="couponForm">
          <label class="sr-only" for="couponCode">Coupon code</label>
          <input class="input" id="couponCode" type="text" placeholder="Coupon code" autocomplete="off">
          <button class="btn btn-dark" type="submit">Apply</button>
        </form>
        <p class="coupon-note">Try <strong>WELCOME10</strong> or <strong>FREESHIP</strong></p>
        <div class="field-error" id="couponError" role="alert"></div>`;

    summary.innerHTML = `
      <h2>Order summary</h2>
      <div class="summary-lines">
        <div><span>Subtotal (${t.itemCount} items)</span><span>${fmt(t.subtotal)}</span></div>
        ${t.productSavings ? `<div class="green"><span>Product savings</span><span>− ${fmt(t.productSavings)}</span></div>` : ""}
        ${t.couponDiscount ? `<div class="green"><span>Coupon (${t.coupon.code})</span><span>− ${fmt(t.couponDiscount)}</span></div>` : ""}
        <div><span>Delivery</span><span>${t.shipping ? fmt(t.shipping) : "Free"}</span></div>
        <div><span>Pickup discount</span><span class="muted">Calculated at checkout</span></div>
      </div>
      <div class="summary-total"><span>Total</span><span>${fmt(t.total)}</span></div>
      <p class="tiny muted mt-2">Inclusive of all taxes. Free delivery over ${LS.ui.money.fmt(FREE_SHIPPING)} per shop.</p>
      ${couponHtml}
      <div class="shipping-estimate">
        <h3>Delivery estimate</h3>
        <form class="row" id="pincodeForm">
          <label class="sr-only" for="pincodeInput">Delivery pincode</label>
          <input class="input" id="pincodeInput" type="text" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit pincode" value="${LS.ui.escapeHtml(t.pincode || "")}" autocomplete="postal-code">
          <button class="btn btn-outline" type="submit">Check</button>
        </form>
        <div class="shipping-result" id="shippingResult" role="status" aria-live="polite"></div>
      </div>
      <a class="btn btn-primary btn-block mt-4" href="checkout.html">Proceed to checkout ${LS.ui.icon("arrowRight", 16)}</a>
      <p class="secure-note">${LS.ui.icon("lock", 12)} Secure demo checkout · UPI, card or cash</p>
      <div class="cart-perks">
        <span>${LS.ui.icon("store", 14)} Free reserve &amp; pick up at 8 shops</span>
        <span>${LS.ui.icon("refresh", 14)} 30-day returns, no questions</span>
        <span>${LS.ui.icon("shield", 14)} Fit guarantee from every local shop</span>
      </div>`;

    const savedMount = document.getElementById("savedLater");
    if (savedMount) savedMount.innerHTML = savedLaterHtml();

    bindCartPage();
    restorePincodeResult();
  }

  function savedLaterHtml() {
    if (!savedItems.length) return "";
    const cards = savedItems.map((item) => {
      const product = LS.data.productById(item.id);
      if (!product) return "";
      const key = keyFor(item.id, item.size, item.color);
      return `<article class="product-card">
        <div class="card-media">
          <a href="product.html?id=${encodeURIComponent(product.id)}"><img src="${LS.ui.escapeHtml(product.images[0])}" alt="${LS.ui.escapeHtml(product.name)}" width="600" height="600" loading="lazy"></a>
        </div>
        <div class="card-body">
          <h3 class="card-title"><a href="product.html?id=${encodeURIComponent(product.id)}">${LS.ui.escapeHtml(product.name)}</a></h3>
          <p class="card-sub">${LS.ui.escapeHtml(item.color)} · UK ${LS.ui.escapeHtml(item.size)}</p>
          <div class="price"><span class="price-current" data-inr="${product.price}">${LS.ui.money.fmt(product.price)}</span></div>
        </div>
        <div class="wishlist-actions">
          <button class="btn btn-dark btn-sm" type="button" data-cart-move="${LS.ui.escapeHtml(key)}">Move to bag</button>
          <button class="btn btn-outline btn-sm" type="button" data-saved-remove="${LS.ui.escapeHtml(key)}">Remove</button>
        </div>
      </article>`;
    }).join("");
    return `<div class="saved-later"><h2>Saved for later</h2><div class="product-grid">${cards}</div></div>`;
  }

  function bindCartPage() {
    if (bindCartPage.bound) return;
    bindCartPage.bound = true;

    document.addEventListener("click", (event) => {
      const minus = event.target.closest("[data-cart-minus]");
      if (minus) {
        const key = minus.dataset.cartMinus;
        const line = lines().find((l) => l.key === key);
        if (line) setQty(key, line.qty - 1);
        return;
      }
      const plus = event.target.closest("[data-cart-plus]");
      if (plus) {
        const key = plus.dataset.cartPlus;
        const line = lines().find((l) => l.key === key);
        if (line) setQty(key, line.qty + 1);
        return;
      }
      const removeBtn = event.target.closest("[data-cart-remove]");
      if (removeBtn) { remove(removeBtn.dataset.cartRemove); return; }
      const saveBtn = event.target.closest("[data-cart-save]");
      if (saveBtn) { saveForLater(saveBtn.dataset.cartSave); return; }
      const moveBtn = event.target.closest("[data-cart-move]");
      if (moveBtn) { moveToCart(moveBtn.dataset.cartMove); return; }
      const savedRemove = event.target.closest("[data-saved-remove]");
      if (savedRemove) {
        const key = savedRemove.dataset.savedRemove;
        const index = savedItems.findIndex((i) => keyFor(i.id, i.size, i.color) === key);
        if (index > -1) savedItems.splice(index, 1);
        LS.ui.save(SAVED_KEY, savedItems);
        renderCartPage();
        return;
      }
    });

    document.addEventListener("submit", (event) => {
      if (event.target.id === "couponForm") {
        event.preventDefault();
        const input = doc("couponCode");
        const result = applyCoupon(input.value);
        const error = doc("couponError");
        if (!result.ok) {
          if (error) { error.textContent = result.message; error.style.color = "var(--danger)"; }
        } else {
          LS.ui.toast({ title: "Coupon applied", message: result.message, type: "success" });
        }
        return;
      }
      if (event.target.id === "pincodeForm") {
        event.preventDefault();
        const input = doc("pincodeInput");
        const pin = input.value.replace(/\D/g, "").slice(0, 6);
        const result = doc("shippingResult");
        if (pin.length !== 6) {
          result.textContent = "Please enter a valid 6-digit pincode.";
          result.style.color = "var(--danger)";
          return;
        }
        LS.ui.save(PINCODE_KEY, pin);
        result.style.color = "var(--success)";
        result.textContent = pin.startsWith("56")
          ? "Bengaluru pincode recognised — same-day local delivery available from 3 shops."
          : "We deliver here in 2–5 working days via courier.";
        LS.ui.toast({ title: "Delivery checked", message: `Pincode ${pin} is serviceable.`, type: "success" });
      }
    });

    document.addEventListener("click", (event) => {
      if (event.target.id === "removeCoupon") {
        clearCoupon();
        LS.ui.toast({ title: "Coupon removed", type: "info" });
      }
    });
  }

  function restorePincodeResult() {
    const pin = LS.ui.store(PINCODE_KEY, "");
    const result = doc("shippingResult");
    if (pin && result) {
      result.style.color = "var(--success)";
      result.textContent = pin.startsWith("56")
        ? "Bengaluru pincode recognised — same-day local delivery available from 3 shops."
        : "We deliver here in 2–5 working days via courier.";
    }
  }

  function doc(id) {
    return document.getElementById(id);
  }

  function init() {
    updateCounts();
    renderDrawer();
    if (document.body.dataset.page === "cart") {
      renderCartPage();
      const saved = document.getElementById("savedLater");
      if (saved) saved.innerHTML = savedLaterHtml();
    }
    document.addEventListener("ls:currency", () => {
      renderDrawer();
      if (document.body.dataset.page === "cart") renderCartPage();
    });
  }

  return {
    init,
    add,
    remove,
    setQty,
    saveForLater,
    moveToCart,
    clear,
    lines,
    count,
    totals,
    applyCoupon,
    clearCoupon,
    validCoupon,
    updateCounts,
    renderDrawer,
    renderCartPage,
    savedItems,
    FREE_SHIPPING,
    COUPONS,
    uid
  };
})();

LS.wishlist = (() => {
  const KEY = "ls_wishlist_v1";
  let items = LS.ui.store(KEY, []).filter((id) => typeof id === "string");

  function has(id) {
    return items.includes(id);
  }

  function toggle(id) {
    const product = LS.data.productById(id);
    if (!product) return;
    const index = items.indexOf(id);
    if (index > -1) {
      items.splice(index, 1);
      LS.ui.toast({ title: "Removed from wishlist", message: LS.ui.escapeHtml(product.name), type: "info" });
    } else {
      items.unshift(id);
      LS.ui.toast({
        title: "Saved to wishlist",
        message: `${LS.ui.escapeHtml(product.name)} is waiting for you.`,
        type: "success",
        action: { label: "View wishlist →", href: "wishlist.html" }
      });
    }
    LS.ui.save(KEY, items);
    syncButtons(id);
    LS.ui.updateCounts();
    document.dispatchEvent(new CustomEvent("ls:wishlist", { detail: { id } }));
  }

  function syncButtons(id) {
    document.querySelectorAll(`[data-wish-toggle="${id}"]`).forEach((btn) => {
      const active = has(id);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
      const product = LS.data.productById(id);
      if (product) {
        btn.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${product.name} ${active ? "from" : "to"} wishlist`);
      }
    });
  }

  function syncAll() {
    document.querySelectorAll("[data-wish-toggle]").forEach((btn) => {
      const active = has(btn.dataset.wishToggle);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    LS.ui.updateCounts();
  }

  function remove(id) {
    items = items.filter((item) => item !== id);
    LS.ui.save(KEY, items);
    syncButtons(id);
    LS.ui.updateCounts();
    document.dispatchEvent(new CustomEvent("ls:wishlist", { detail: { id } }));
  }

  function clear() {
    items = [];
    LS.ui.save(KEY, items);
    LS.ui.updateCounts();
    document.dispatchEvent(new CustomEvent("ls:wishlist"));
  }

  function list() {
    return items.map((id) => LS.data.productById(id)).filter(Boolean);
  }

  return {
    get items() { return items; },
    has, toggle, remove, clear, list, syncAll
  };
})();

LS.compare = (() => {
  const KEY = "ls_compare_v1";
  let items = LS.ui.store(KEY, []).filter((id) => typeof id === "string").slice(0, 3);

  function has(id) { return items.includes(id); }

  function toggle(id) {
    const product = LS.data.productById(id);
    const index = items.indexOf(id);
    if (index > -1) {
      items.splice(index, 1);
    } else {
      if (items.length >= 3) {
        LS.ui.toast({ title: "Compare is full", message: "Remove a shoe to add another — three at a time.", type: "error" });
        return;
      }
      items.push(id);
      LS.ui.toast({
        title: "Added to compare",
        message: `${items.length} of 3 selected.`,
        type: "info",
        action: { label: "Compare now →", href: "compare.html" }
      });
    }
    LS.ui.save(KEY, items);
    syncButtons();
    renderTray();
    document.dispatchEvent(new CustomEvent("ls:compare", { detail: { id } }));
  }

  function remove(id) {
    items = items.filter((item) => item !== id);
    LS.ui.save(KEY, items);
    syncButtons();
    renderTray();
    document.dispatchEvent(new CustomEvent("ls:compare", { detail: { id } }));
  }

  function clear() {
    items = [];
    LS.ui.save(KEY, items);
    syncButtons();
    renderTray();
    document.dispatchEvent(new CustomEvent("ls:compare"));
  }

  function syncButtons() {
    document.querySelectorAll("[data-compare-toggle]").forEach((btn) => {
      const active = has(btn.dataset.compareToggle);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function renderTray() {
    const mount = document.getElementById("compareTrayMount");
    if (!mount) return;
    if (!items.length) { mount.innerHTML = ""; return; }
    const products = items.map((id) => LS.data.productById(id)).filter(Boolean);
    mount.innerHTML = `<div class="compare-tray is-visible" role="region" aria-label="Compare selection">
      <div class="compare-thumbs">
        ${products.map((p) => `<span style="position:relative">
          <img class="compare-thumb" src="${LS.ui.escapeHtml(p.images[0])}" alt="${LS.ui.escapeHtml(p.name)}" width="42" height="42">
          <button type="button" data-compare-remove="${p.id}" aria-label="Remove ${LS.ui.escapeHtml(p.name)} from compare">${LS.ui.icon("close", 9)}</button>
        </span>`).join("")}
        ${Array.from({ length: 3 - products.length }).map(() => '<span class="compare-empty-slot">+</span>').join("")}
      </div>
      <a class="btn btn-dark btn-sm" href="compare.html">Compare ${products.length}/3</a>
    </div>`;
    mount.querySelectorAll("[data-compare-remove]").forEach((btn) => {
      btn.addEventListener("click", () => remove(btn.dataset.compareRemove));
    });
  }

  return { get items() { return items; }, has, toggle, remove, clear, renderTray, syncButtons };
})();

LS.recent = (() => {
  const KEY = "ls_recent_v1";
  let items = LS.ui.store(KEY, []).filter((id) => typeof id === "string");

  function add(id) {
    items = [id, ...items.filter((item) => item !== id)].slice(0, 8);
    LS.ui.save(KEY, items);
  }

  function list(excludeId = null) {
    return items.filter((id) => id !== excludeId).map((id) => LS.data.productById(id)).filter(Boolean);
  }

  return { add, list, get items() { return items; } };
})();

LS.cart.init();
