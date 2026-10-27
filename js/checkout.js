/* ==========================================================================
   Local Sole — checkout.js
   Four-step checkout (fulfilment, details, payment, review), live totals,
   mock payment validation, localStorage orders and order confirmation.
   ========================================================================== */

window.LS = window.LS || {};

LS.checkout = (() => {
  const ORDERS_KEY = "ls_orders_v1";
  const PROFILE_KEY = "ls_profile_v1";
  const ADDRESSES_KEY = "ls_addresses_v1";
  const LAST_ORDER_KEY = "ls_last_order_v1";

  const state = {
    step: 1,
    fulfilment: {},
    contact: { firstName: "", lastName: "", email: "", phone: "" },
    address: { line1: "", line2: "", city: "Bengaluru", state: "Karnataka", pincode: "" },
    payment: { method: "upi", upi: "", cardName: "", cardNumber: "", expiry: "", cvv: "", cashNote: "" },
    saveAddress: true,
    accepted: false,
    placing: false
  };

  let errors = {};

  const esc = (value) => LS.ui.escapeHtml(String(value ?? ""));
  const byId = (id) => document.getElementById(id);
  const shopGroups = () => LS.cart.totals().shopGroups;
  const pickupAvailable = (shop) => Boolean(shop.pickup && shop.pickup.available);

  /* ---------- data / state helpers ---------- */
  function loadProfile() {
    const profile = LS.ui.store(PROFILE_KEY, null);
    if (profile) {
      state.contact = {
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || ""
      };
    }
    const saved = LS.ui.store(ADDRESSES_KEY, []);
    const chosen = (saved || []).find((a) => a.isDefault) || (saved || [])[0];
    if (chosen) {
      state.address = {
        line1: chosen.line1 || "",
        line2: chosen.line2 || "",
        city: chosen.city || "Bengaluru",
        state: chosen.state || "Karnataka",
        pincode: chosen.pincode || ""
      };
      state.saveAddress = false;
    } else {
      state.address.pincode = LS.ui.store("ls_pincode_v1", "") || "";
    }
  }

  function ensureFulfilment() {
    shopGroups().forEach(({ shop }) => {
      if (!state.fulfilment[shop.id]) {
        state.fulfilment[shop.id] = pickupAvailable(shop) ? "delivery" : "delivery";
        if (!shop.delivery.available && pickupAvailable(shop)) state.fulfilment[shop.id] = "pickup";
      }
    });
    Object.keys(state.fulfilment).forEach((id) => {
      if (!shopGroups().some((g) => g.shop.id === id)) delete state.fulfilment[id];
    });
  }

  function hasDelivery() {
    return shopGroups().some(({ shop }) => state.fulfilment[shop.id] !== "pickup");
  }

  function paymentLabel(method = state.payment.method) {
    if (method === "upi") return "UPI";
    if (method === "card") return "Credit / debit card";
    return hasDelivery() ? "Cash on delivery" : "Pay at pickup";
  }

  function shopShipping(shop, shopSubtotal) {
    if (shopSubtotal >= (shop.delivery.freeOver || 0)) return 0;
    return Number(shop.delivery.fee || 0);
  }

  function calculate() {
    const cart = LS.cart.totals();
    let shipping = 0;
    let pickupSavings = 0;
    let pickupCount = 0;
    let deliveryCount = 0;

    cart.shopGroups.forEach(({ shop, lines }) => {
      const shopSubtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
      if (state.fulfilment[shop.id] === "pickup") {
        pickupCount += 1;
        pickupSavings += Math.round(shopSubtotal * (Number(shop.pickup.discount || 0) / 100));
      } else {
        deliveryCount += 1;
        shipping += shopShipping(shop, shopSubtotal);
      }
    });

    if (cart.freeShipping) shipping = 0;
    const discount = cart.couponDiscount;
    const total = Math.max(0, cart.subtotal - discount - pickupSavings) + shipping;

    return {
      ...cart,
      shipping,
      pickupSavings,
      pickupCount,
      deliveryCount,
      total,
      allPickup: pickupCount > 0 && deliveryCount === 0
    };
  }

  function etaText() {
    const groups = shopGroups();
    const modes = groups.map(({ shop }) => state.fulfilment[shop.id]);
    if (modes.every((m) => m === "pickup")) {
      const maxReady = Math.max(...groups.map(({ shop }) => Number(shop.pickup.readyIn || 60)));
      return `Ready for pickup in about ${maxReady} minutes`;
    }
    if (modes.every((m) => m !== "pickup")) {
      const etas = [...new Set(groups.map(({ shop }) => shop.delivery.eta).filter(Boolean))];
      return etas.length === 1 ? etas[0] : "1–3 days";
    }
    return "Mixed pickup and delivery";
  }

  /* ---------- markup ---------- */
  function stepsHtml() {
    const labels = ["Fulfilment", "Details", "Payment", "Review"];
    return `<ol class="checkout-steps" aria-label="Checkout progress">
      ${labels.map((label, index) => {
        const number = index + 1;
        const active = state.step === number;
        const done = state.step > number;
        return `<li class="checkout-step ${active ? "is-active" : ""} ${done ? "is-done" : ""}" ${active ? 'aria-current="step"' : ""}>
          <span class="num" aria-hidden="true">${done ? "✓" : number}</span>
          <span class="step-label">${label}</span>
          ${number < 4 ? `<span class="checkout-step-line ${done ? "is-done" : ""}" aria-hidden="true"></span>` : ""}
        </li>`;
      }).join("")}
    </ol>`;
  }

  function summaryHtml() {
    const t = calculate();
    if (!LS.cart.lines().length) {
      return `<h2>Order summary</h2><p class="small muted">Your bag is empty.</p><a class="btn btn-primary btn-block mt-3" href="products.html">Browse shoes</a>`;
    }
    const lines = LS.cart.lines();
    return `<h2>Order summary</h2>
      <div class="summary-products">
        ${lines.map((line) => `<div class="checkout-summary-line">
          <img src="${esc(line.product.images[0])}" alt="" width="54" height="54" loading="lazy">
          <div>
            <strong>${esc(line.product.name)}</strong>
            <span>${esc(line.color)} · UK ${esc(line.size)} · Qty ${line.qty}</span>
            <span>${esc(LS.data.shopById(line.product.shopId)?.name || "")}</span>
          </div>
          <span class="price">${LS.ui.money.fmt(line.lineTotal)}</span>
        </div>`).join("")}
      </div>
      <div class="summary-lines mt-3">
        <div><span>Subtotal (${t.itemCount} item${t.itemCount === 1 ? "" : "s"})</span><span>${LS.ui.money.fmt(t.subtotal)}</span></div>
        ${t.productSavings ? `<div class="green"><span>Product savings</span><span>− ${LS.ui.money.fmt(t.productSavings)}</span></div>` : ""}
        ${t.couponDiscount ? `<div class="green"><span>Coupon (${esc(t.coupon.code)})</span><span>− ${LS.ui.money.fmt(t.couponDiscount)}</span></div>` : ""}
        ${t.pickupSavings ? `<div class="green"><span>Pickup discount</span><span>− ${LS.ui.money.fmt(t.pickupSavings)}</span></div>` : ""}
        <div><span>${t.allPickup ? "Pickup" : "Delivery"}</span><span>${t.shipping ? LS.ui.money.fmt(t.shipping) : "Free"}</span></div>
      </div>
      <div class="summary-total"><span>Total</span><span>${LS.ui.money.fmt(t.total)}</span></div>
      <p class="tiny muted mt-2">Inclusive of all taxes. ${t.allPickup ? "Pay in store when you collect." : "Delivery fees are set by each shop."}</p>
      <div class="cart-perks">
        <span>${LS.ui.icon("store", 14)} ${t.pickupCount ? `${t.pickupCount} shop pickup${t.pickupCount === 1 ? "" : "s"}` : "8 shops available for pickup"}</span>
        <span>${LS.ui.icon("refresh", 14)} 30-day exchange at the shop</span>
        <span>${LS.ui.icon("lock", 14)} Secure demo checkout</span>
      </div>
      <a class="link-underline small mt-3" href="cart.html">Edit bag or coupon</a>`;
  }

  function fulfilmentPanel() {
    const groups = shopGroups();
    return `<section class="step-panel" aria-labelledby="checkoutStepTitle">
      <h2 id="checkoutStepTitle">How would you like your pairs<span class="text-accent">?</span></h2>
      <p>Choose delivery or collect from the shop. Pickup saves the delivery fee and often gets you the shoes sooner.</p>
      ${groups.map(({ shop, lines }) => {
        const shopSubtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
        const mode = state.fulfilment[shop.id];
        const fee = shopShipping(shop, shopSubtotal);
        const discount = Math.round(shopSubtotal * (Number(shop.pickup.discount || 0) / 100));
        return `<div class="cart-shop-group" style="margin-bottom:14px">
          <div class="cart-shop-head">
            <div class="row">
              <img src="${esc(shop.logo)}" alt="" width="28" height="28">
              <div><strong>${esc(shop.name)}</strong><span>${esc(shop.area)} · ${lines.length} item${lines.length === 1 ? "" : "s"} · ${LS.ui.money.fmt(shopSubtotal)}</span></div>
            </div>
            <span class="badge ${shop.pickup.available ? "badge-pickup" : "badge-soft"}">${shop.pickup.available ? "Pickup available" : "Delivery only"}</span>
          </div>
          <div class="fulfil-options" style="padding:14px">
            <label class="fulfil-option ${mode === "delivery" ? "is-selected" : ""}">
              <input type="radio" name="fulfil-${esc(shop.id)}" value="delivery" data-fulfil-shop="${esc(shop.id)}" ${mode === "delivery" ? "checked" : ""} ${shop.delivery.available ? "" : "disabled"}>
              <span>${LS.ui.icon("truck", 18)}</span>
              <div>
                <strong>Deliver to my door</strong>
                <span>${esc(shop.delivery.eta)} · ${fee ? LS.ui.money.fmt(fee) : "Free delivery"}</span>
              </div>
              <span class="badge badge-soft">${fee ? "Fee applies" : "Free"}</span>
            </label>
            <label class="fulfil-option ${mode === "pickup" ? "is-selected" : ""}">
              <input type="radio" name="fulfil-${esc(shop.id)}" value="pickup" data-fulfil-shop="${esc(shop.id)}" ${mode === "pickup" ? "checked" : ""} ${shop.pickup.available ? "" : "disabled"}>
              <span>${LS.ui.icon("store", 18)}</span>
              <div>
                <strong>Collect from ${esc(shop.shortName || shop.name)}</strong>
                <span>${esc(shop.address)} · ready in ${Number(shop.pickup.readyIn || 45)} min</span>
              </div>
              <span class="badge badge-pickup">${discount ? `Save ${LS.ui.money.fmt(discount)}` : "Same day"}</span>
            </label>
          </div>
        </div>`;
      }).join("")}
      <div class="step-actions">
        <a class="link-quiet small" href="cart.html">← Back to bag</a>
        <button class="btn btn-primary" type="button" data-next-step>Continue to details ${LS.ui.icon("arrowRight", 16)}</button>
      </div>
    </section>`;
  }

  function fieldHtml({ id, label, bind, type = "text", autocomplete, placeholder = "", span = false, inputmode, maxlength, hint }) {
    const value = bind.split(".").reduce((obj, key) => obj?.[key], state) ?? "";
    const error = errors[id] || "";
    return `<div class="field ${span ? "span-2" : ""} ${error ? "has-error" : ""}" data-field="${id}">
      <label for="${id}">${label}</label>
      <input class="input" id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"
        data-bind="${bind}" autocomplete="${autocomplete || "off"}"
        ${inputmode ? `inputmode="${inputmode}"` : ""} ${maxlength ? `maxlength="${maxlength}"` : ""}
        aria-describedby="${id}-error" ${error ? 'aria-invalid="true"' : ""}>
      <span class="field-error" id="${id}-error" role="alert">${esc(error)}</span>
      ${hint ? `<span class="tiny muted">${hint}</span>` : ""}
    </div>`;
  }

  function detailsPanel() {
    const delivery = hasDelivery();
    return `<section class="step-panel" aria-labelledby="checkoutStepTitle">
      <h2 id="checkoutStepTitle">${delivery ? "Where should we send them" : "Who's collecting"}<span class="text-accent">?</span></h2>
      <p>${delivery ? "We share these details only with the shop fulfilling your order." : "Bring a photo ID and your order number when you collect."}</p>
      <form id="detailsForm" novalidate>
        <h3 class="small" style="font-weight:800;margin-bottom:10px">Contact</h3>
        <div class="form-grid">
          ${fieldHtml({ id: "coFirstName", label: "First name", bind: "contact.firstName", autocomplete: "given-name", placeholder: "Ananya" })}
          ${fieldHtml({ id: "coLastName", label: "Last name", bind: "contact.lastName", autocomplete: "family-name", placeholder: "Rao" })}
          ${fieldHtml({ id: "coEmail", label: "Email", bind: "contact.email", type: "email", autocomplete: "email", placeholder: "you@example.com", inputmode: "email" })}
          ${fieldHtml({ id: "coPhone", label: "Mobile number", bind: "contact.phone", type: "tel", autocomplete: "tel", placeholder: "98765 43210", inputmode: "tel", maxlength: "14" })}
        </div>
        ${delivery ? `<h3 class="small" style="font-weight:800;margin:22px 0 10px">Delivery address</h3>
          <div class="form-grid">
            ${fieldHtml({ id: "coLine1", label: "Address line 1", bind: "address.line1", autocomplete: "address-line1", placeholder: "Flat / house, street", span: true })}
            ${fieldHtml({ id: "coLine2", label: "Address line 2", bind: "address.line2", autocomplete: "address-line2", placeholder: "Area, landmark (optional)", span: true })}
            ${fieldHtml({ id: "coCity", label: "City", bind: "address.city", autocomplete: "address-level2" })}
            ${fieldHtml({ id: "coState", label: "State", bind: "address.state", autocomplete: "address-level1" })}
            ${fieldHtml({ id: "coPincode", label: "Pincode", bind: "address.pincode", autocomplete: "postal-code", inputmode: "numeric", maxlength: "6", placeholder: "560038" })}
            <div class="field" style="justify-content:flex-end">
              <label class="checkbox"><input type="checkbox" id="coSaveAddress" ${state.saveAddress ? "checked" : ""} data-bind-check="saveAddress"> Save this address for next time</label>
            </div>
          </div>` : `<div class="mock-note">${LS.ui.icon("id", 14)} Bring the card used, or the order number, when you collect. Someone else can pick up with your order number.</div>`}
      </form>
      <div class="step-actions">
        <button class="btn btn-outline" type="button" data-prev-step>Back</button>
        <button class="btn btn-primary" type="button" data-next-step>Continue to payment ${LS.ui.icon("arrowRight", 16)}</button>
      </div>
    </section>`;
  }

  function paymentPanel() {
    const cashLabel = hasDelivery() ? "Cash on delivery" : "Pay at pickup";
    const methods = [
      { id: "upi", icon: "upi", title: "UPI", note: "GPay, PhonePe, Paytm and any UPI app" },
      { id: "card", icon: "card", title: "Credit / debit card", note: "Visa, Mastercard, RuPay" },
      { id: "cash", icon: "cash", title: cashLabel, note: hasDelivery() ? "Pay the delivery partner in cash" : "Pay at the shop counter" }
    ];
    return `<section class="step-panel" aria-labelledby="checkoutStepTitle">
      <h2 id="checkoutStepTitle">How would you like to pay<span class="text-accent">?</span></h2>
      <p>This is a demo checkout — no money moves. Card details are never stored.</p>
      <div class="pay-options" role="radiogroup" aria-label="Payment method">
        ${methods.map((method) => {
          const selected = state.payment.method === method.id;
          return `<div class="pay-option ${selected ? "is-selected" : ""}">
            <label class="pay-option-head" for="pay-${method.id}">
              <input type="radio" id="pay-${method.id}" name="paymentMethod" value="${method.id}" data-pay-method ${selected ? "checked" : ""}>
              <span>${LS.ui.icon(method.icon, 18)}</span>
              <span>${method.title}</span>
              <span class="badge badge-soft">${method.id === "cash" ? "In person" : "Secure"}</span>
            </label>
            <div class="pay-fields">
              ${method.id === "upi" ? `
                <div class="field ${errors.upi ? "has-error" : ""}" data-field="upi">
                  <label for="coUpi">UPI ID</label>
                  <input class="input" id="coUpi" type="text" inputmode="email" placeholder="ananya@okhdfcbank" value="${esc(state.payment.upi)}" data-bind="payment.upi" aria-describedby="upi-error">
                  <span class="field-error" id="upi-error" role="alert">${esc(errors.upi || "")}</span>
                </div>
                <div class="mock-note">${LS.ui.icon("info", 14)} You'll get a collect request from Local Sole on your UPI app after you place the order.</div>` : ""}
              ${method.id === "card" ? `
                <div class="field ${errors.cardName ? "has-error" : ""}" data-field="cardName">
                  <label for="coCardName">Name on card</label>
                  <input class="input" id="coCardName" type="text" autocomplete="cc-name" placeholder="ANANYA RAO" value="${esc(state.payment.cardName)}" data-bind="payment.cardName" aria-describedby="cardName-error">
                  <span class="field-error" id="cardName-error" role="alert">${esc(errors.cardName || "")}</span>
                </div>
                <div class="field ${errors.cardNumber ? "has-error" : ""}" data-field="cardNumber">
                  <label for="coCardNumber">Card number</label>
                  <input class="input" id="coCardNumber" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="23" value="${esc(state.payment.cardNumber)}" data-bind="payment.cardNumber" aria-describedby="cardNumber-error">
                  <span class="field-error" id="cardNumber-error" role="alert">${esc(errors.cardNumber || "")}</span>
                </div>
                <div class="form-grid">
                  <div class="field ${errors.expiry ? "has-error" : ""}" data-field="expiry">
                    <label for="coExpiry">Expiry</label>
                    <input class="input" id="coExpiry" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" maxlength="7" value="${esc(state.payment.expiry)}" data-bind="payment.expiry" aria-describedby="expiry-error">
                    <span class="field-error" id="expiry-error" role="alert">${esc(errors.expiry || "")}</span>
                  </div>
                  <div class="field ${errors.cvv ? "has-error" : ""}" data-field="cvv">
                    <label for="coCvv">CVV</label>
                    <input class="input" id="coCvv" type="password" inputmode="numeric" autocomplete="cc-csc" placeholder="•••" maxlength="4" value="${esc(state.payment.cvv)}" data-bind="payment.cvv" aria-describedby="cvv-error">
                    <span class="field-error" id="cvv-error" role="alert">${esc(errors.cvv || "")}</span>
                  </div>
                </div>
                <div class="mock-note">${LS.ui.icon("lock", 14)} Demo only — use 4242 4242 4242 4242. We never store card numbers.</div>` : ""}
              ${method.id === "cash" ? `
                <div class="mock-note">${LS.ui.icon("info", 14)} ${hasDelivery() ? "Keep the exact amount ready. The shop will confirm your slot by phone." : "Pay at the counter when you collect. UPI and card are also accepted in store."}</div>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
      <div class="step-actions">
        <button class="btn btn-outline" type="button" data-prev-step>Back</button>
        <button class="btn btn-primary" type="button" data-next-step>Review order ${LS.ui.icon("arrowRight", 16)}</button>
      </div>
    </section>`;
  }

  function reviewPanel() {
    const t = calculate();
    const groups = shopGroups();
    const fullName = `${state.contact.firstName} ${state.contact.lastName}`.trim();
    return `<section class="step-panel" aria-labelledby="checkoutStepTitle">
      <h2 id="checkoutStepTitle">Almost on your feet<span class="text-accent">.</span></h2>
      <p>Check the details, then place your order. Each shop packs its own pairs.</p>

      <div class="review-block">
        <div class="review-block-head"><strong>Contact</strong><button type="button" data-edit-step="2">Edit</button></div>
        <p>${esc(fullName)}<br>${esc(state.contact.email)} · ${esc(state.contact.phone)}</p>
      </div>

      ${groups.map(({ shop }) => {
        const pickup = state.fulfilment[shop.id] === "pickup";
        return `<div class="review-block">
          <div class="review-block-head"><strong>${esc(shop.name)}</strong><button type="button" data-edit-step="1">Edit</button></div>
          <p>${pickup
            ? `<strong>Pickup</strong> · ${esc(shop.address)}<br>Ready in about ${Number(shop.pickup.readyIn || 45)} minutes · ${esc(shop.phone)}`
            : `<strong>Delivery</strong> · ${esc(state.address.line1)}${state.address.line2 ? `, ${esc(state.address.line2)}` : ""}<br>${esc(state.address.city)} ${esc(state.address.pincode)} · ${esc(shop.delivery.eta)}`}</p>
        </div>`;
      }).join("")}

      <div class="review-block">
        <div class="review-block-head"><strong>Payment</strong><button type="button" data-edit-step="3">Edit</button></div>
        <p>${paymentLabel()}${state.payment.method === "upi" && state.payment.upi ? ` · ${esc(state.payment.upi)}` : ""}${state.payment.method === "card" ? ` · ending ${esc(state.payment.cardNumber.replace(/\D/g, "").slice(-4) || "••••")}` : ""}</p>
      </div>

      <label class="checkbox mt-3">
        <input type="checkbox" id="coTerms" ${state.accepted ? "checked" : ""} data-accept-terms>
        <span>I agree that this is a demo order, that prices are shown in ${LS.ui.currency === "INR" ? "INR" : `${LS.ui.currency} (charged in INR)`} and to the <a href="#" data-open-policy>shop's exchange policy</a>.</span>
      </label>
      ${errors.terms ? `<span class="field-error" role="alert">${esc(errors.terms)}</span>` : ""}

      <div class="step-actions">
        <button class="btn btn-outline" type="button" data-prev-step>Back</button>
        <button class="btn btn-primary" type="button" data-place-order ${state.placing ? "disabled" : ""}>${state.placing ? "Placing order…" : `Place order · ${LS.ui.money.fmt(t.total)}`}</button>
      </div>
      <p class="tiny muted mt-3">${LS.ui.icon("lock", 12)} By placing this order you reserve stock at ${groups.length} shop${groups.length === 1 ? "" : "s"}. No payment will be taken in this demo.</p>
    </section>`;
  }

  function render() {
    const app = byId("checkoutApp");
    if (!app) return;
    ensureFulfilment();
    const summary = byId("checkoutSummary");
    if (summary) summary.innerHTML = summaryHtml();

    if (!LS.cart.lines().length) {
      app.innerHTML = `<div class="empty-state">
        <div class="confirmation-icon" style="background:var(--bg-sunken);color:var(--ink-3)">${LS.ui.icon("bag", 30)}</div>
        <h2>Your bag is empty</h2>
        <p>Checkout starts with a pair. Browse the edit or pick up where you left off.</p>
        <div class="row" style="justify-content:center;flex-wrap:wrap">
          <a class="btn btn-primary" href="products.html">Browse all shoes</a>
          <a class="btn btn-outline" href="shops.html">Find a shop</a>
        </div>
      </div>`;
      return;
    }

    const panels = { 1: fulfilmentPanel, 2: detailsPanel, 3: paymentPanel, 4: reviewPanel };
    app.innerHTML = `${stepsHtml()}${panels[state.step]()}`;
    bind();
    if (state.step === 4) {
      const place = app.querySelector("[data-place-order]");
      if (place) place.disabled = !state.accepted || state.placing;
    }
  }

  /* ---------- binding ---------- */
  function bind() {
    const app = byId("checkoutApp");
    if (!app) return;

    app.querySelectorAll("[data-bind]").forEach((input) => {
      input.addEventListener("input", () => {
        const path = input.dataset.bind.split(".");
        state[path[0]][path[1]] = input.value;
        const field = input.closest(".field");
        if (field) {
          field.classList.remove("has-error");
          const err = field.querySelector(".field-error");
          if (err) err.textContent = "";
          input.removeAttribute("aria-invalid");
        }
      });
      if (input.id === "coPhone" || input.id === "coPincode" || input.id === "coCardNumber") {
        input.addEventListener("blur", () => {
          if (input.id === "coCardNumber") {
            const digits = input.value.replace(/\D/g, "").slice(0, 19);
            input.value = digits.replace(/(.{4})/g, "$1 ").trim();
            state.payment.cardNumber = input.value;
          }
        });
      }
    });

    const saveAddress = byId("coSaveAddress");
    if (saveAddress) saveAddress.addEventListener("change", () => { state.saveAddress = saveAddress.checked; });

    const detailsForm = byId("detailsForm");
    if (detailsForm) detailsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      next();
    });

    const terms = byId("coTerms");
    if (terms) {
      terms.addEventListener("change", () => {
        state.accepted = terms.checked;
        const place = app.querySelector("[data-place-order]");
        if (place) place.disabled = !state.accepted || state.placing;
        if (state.accepted && errors.terms) {
          errors.terms = "";
          const err = app.querySelector(".field-error[role=alert]");
          if (err) err.textContent = "";
        }
      });
    }

    app.querySelectorAll("[data-fulfil-shop]").forEach((radio) => {
      radio.addEventListener("change", () => {
        const shopId = radio.dataset.fulfilShop;
        state.fulfilment[shopId] = radio.value;
        app.querySelectorAll(`[data-fulfil-shop="${shopId}"]`).forEach((r) => {
          r.closest(".fulfil-option")?.classList.toggle("is-selected", r.checked);
        });
        const summary = byId("checkoutSummary");
        if (summary) summary.innerHTML = summaryHtml();
      });
    });

    app.querySelectorAll("[data-pay-method]").forEach((radio) => {
      radio.addEventListener("change", () => {
        state.payment.method = radio.value;
        errors = {};
        render();
      });
    });

    app.querySelectorAll("[data-next-step]").forEach((button) => button.addEventListener("click", next));
    app.querySelectorAll("[data-prev-step]").forEach((button) => button.addEventListener("click", prev));
    app.querySelectorAll("[data-edit-step]").forEach((button) => button.addEventListener("click", () => {
      state.step = Number(button.dataset.editStep);
      render();
      scrollTop();
    }));
    const place = app.querySelector("[data-place-order]");
    if (place) place.addEventListener("click", placeOrder);
    const policy = app.querySelector("[data-open-policy]");
    if (policy) policy.addEventListener("click", (event) => {
      event.preventDefault();
      LS.ui.openModal(`<div class="modal-head"><h2>Exchange policy</h2><button class="modal-close" type="button" data-close-modal aria-label="Close">${LS.ui.icon("close", 18)}</button></div>
        <div class="modal-body"><p>Every shop offers a 30-day exchange on unworn pairs, in the original box, with the Local Sole receipt. Pickup orders can be exchanged in store. Delivery orders can be returned to the shop or collected by courier for a small fee.</p>
        <p>Sale items are exchange-only. Fit advice from the shop is free, and we'd always rather you ask before you buy.</p></div>`, { className: "modal-sm", label: "Exchange policy" });
    });
  }

  function scrollTop() {
    const app = byId("checkoutApp");
    if (!app) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    app.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function next() {
    errors = {};
    if (state.step === 1 && !validateFulfilment()) return;
    if (state.step === 2 && !validateDetails()) return;
    if (state.step === 3 && !validatePayment()) return;
    state.step = Math.min(4, state.step + 1);
    render();
    scrollTop();
  }

  function prev() {
    errors = {};
    state.step = Math.max(1, state.step - 1);
    render();
    scrollTop();
  }

  /* ---------- validation ---------- */
  function fail(id, message) {
    errors[id] = message;
    return false;
  }

  function validateFulfilment() {
    const ok = shopGroups().every(({ shop }) => ["delivery", "pickup"].includes(state.fulfilment[shop.id]));
    if (!ok) LS.ui.toast({ title: "Choose a fulfilment method", message: "Every shop needs delivery or pickup.", type: "error" });
    return ok;
  }

  function validateDetails() {
    const c = state.contact;
    let ok = true;
    if (!c.firstName.trim() || c.firstName.trim().length < 2) ok = fail("coFirstName", "Enter your first name.");
    if (!c.lastName.trim()) ok = fail("coLastName", "Enter your last name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) ok = fail("coEmail", "Enter a valid email address.");
    if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(c.phone.replace(/[\s-]/g, ""))) ok = fail("coPhone", "Enter a valid 10-digit Indian mobile number.");
    if (hasDelivery()) {
      if (!state.address.line1.trim()) ok = fail("coLine1", "Enter your street address.");
      if (!state.address.city.trim()) ok = fail("coCity", "Enter your city.");
      if (!state.address.state.trim()) ok = fail("coState", "Enter your state.");
      if (!/^\d{6}$/.test(state.address.pincode.trim())) ok = fail("coPincode", "Enter a valid 6-digit pincode.");
    }
    if (!ok) {
      render();
      const first = document.querySelector("#checkoutApp .field.has-error .input");
      first?.focus();
      LS.ui.announce?.("Please check the highlighted fields.");
    }
    return ok;
  }

  function validatePayment() {
    const p = state.payment;
    let ok = true;
    if (p.method === "upi") {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(p.upi.trim())) ok = fail("upi", "Enter a UPI ID like name@bank.");
    }
    if (p.method === "card") {
      const digits = p.cardNumber.replace(/\D/g, "");
      if (!p.cardName.trim()) ok = fail("cardName", "Enter the name on the card.");
      if (digits.length < 13 || digits.length > 19) ok = fail("cardNumber", "Enter a valid card number.");
      const expiry = p.expiry.replace(/\s/g, "");
      const match = expiry.match(/^(\d{2})\/?(\d{2})$/);
      if (!match) {
        ok = fail("expiry", "Use MM/YY.");
      } else {
        const month = Number(match[1]);
        const year = 2000 + Number(match[2]);
        const now = new Date();
        if (month < 1 || month > 12 || new Date(year, month, 1) <= new Date(now.getFullYear(), now.getMonth(), 1)) {
          ok = fail("expiry", "This card has expired.");
        }
      }
      if (!/^\d{3,4}$/.test(p.cvv)) ok = fail("cvv", "Enter the 3-digit CVV.");
    }
    if (!ok) {
      render();
      const first = document.querySelector("#checkoutApp .field.has-error .input");
      first?.focus();
    }
    return ok;
  }

  /* ---------- order ---------- */
  function orderItems() {
    return LS.cart.lines().map((line) => ({
      id: line.product.id,
      name: line.product.name,
      brand: line.product.brand,
      image: line.product.images[0],
      size: line.size,
      color: line.color,
      qty: line.qty,
      price: line.product.price,
      shopId: line.product.shopId,
      shopName: LS.data.shopById(line.product.shopId)?.name || ""
    }));
  }

  function placeOrder() {
    if (state.placing) return;
    errors = {};
    if (!validateDetails()) { state.step = 2; render(); return; }
    if (!validatePayment()) { state.step = 3; render(); return; }
    if (!state.accepted) {
      errors.terms = "Please accept the exchange policy to continue.";
      render();
      return;
    }

    state.placing = true;
    const button = document.querySelector("[data-place-order]");
    if (button) { button.disabled = true; button.textContent = "Placing order…"; }

    const t = calculate();
    const now = new Date();
    const orderId = `LS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const groups = shopGroups().map(({ shop }) => ({
      shopId: shop.id,
      shopName: shop.name,
      logo: shop.logo,
      mode: state.fulfilment[shop.id] === "pickup" ? "pickup" : "delivery",
      address: state.fulfilment[shop.id] === "pickup" ? shop.address : `${state.address.line1}${state.address.line2 ? `, ${state.address.line2}` : ""}, ${state.address.city} ${state.address.pincode}`,
      phone: shop.phone,
      readyIn: shop.pickup.readyIn,
      eta: state.fulfilment[shop.id] === "pickup" ? `Ready in about ${shop.pickup.readyIn} minutes` : shop.delivery.eta
    }));

    const order = {
      id: orderId,
      createdAt: now.toISOString(),
      status: "confirmed",
      items: orderItems(),
      fulfilment: groups,
      contact: { ...state.contact },
      address: { ...state.address },
      payment: {
        method: state.payment.method,
        label: paymentLabel(),
        detail: state.payment.method === "upi" ? state.payment.upi : state.payment.method === "card" ? `Card ending ${state.payment.cardNumber.replace(/\D/g, "").slice(-4)}` : "Pay in person"
      },
      totals: {
        subtotal: t.subtotal,
        savings: t.productSavings,
        coupon: t.coupon ? { code: t.coupon.code, amount: t.couponDiscount } : null,
        pickupSavings: t.pickupSavings,
        shipping: t.shipping,
        total: t.total
      },
      eta: etaText(),
      canCancel: true
    };

    const orders = LS.ui.store(ORDERS_KEY, []);
    orders.unshift(order);
    LS.ui.save(ORDERS_KEY, orders.slice(0, 50));
    LS.ui.save(LAST_ORDER_KEY, order.id);

    if (state.saveAddress && hasDelivery()) {
      const addresses = LS.ui.store(ADDRESSES_KEY, []);
      const exists = addresses.some((a) => a.pincode === order.address.pincode && a.line1 === order.address.line1);
      if (!exists) {
        addresses.unshift({
          id: `addr_${Date.now().toString(36)}`,
          label: "Home",
          ...order.address,
          isDefault: addresses.length === 0
        });
        LS.ui.save(ADDRESSES_KEY, addresses);
      }
    }
    LS.ui.save(PROFILE_KEY, {
      firstName: state.contact.firstName,
      lastName: state.contact.lastName,
      email: state.contact.email,
      phone: state.contact.phone
    });

    LS.cart.clear();
    state.placing = false;
    window.location.href = `order-confirmation.html?order=${encodeURIComponent(orderId)}`;
  }

  /* ---------- confirmation ---------- */
  function orderById(id) {
    return (LS.ui.store(ORDERS_KEY, []) || []).find((order) => order.id === id);
  }

  function renderConfirmation() {
    const app = byId("orderConfirmation");
    if (!app) return;
    const id = LS.ui.getParam?.("order") || LS.ui.store(LAST_ORDER_KEY, "");
    const order = orderById(id) || (LS.ui.store(ORDERS_KEY, []) || [])[0];
    if (!order) {
      app.innerHTML = `<div class="empty-state">
        <h1>No order to show</h1>
        <p>Once you place an order, its details and pickup slot will live here.</p>
        <a class="btn btn-primary" href="products.html">Start shopping</a>
      </div>`;
      return;
    }

    const allPickup = order.fulfilment.every((group) => group.mode === "pickup");
    const firstName = (order.contact.firstName || "").trim();
    const total = order.totals.total;
    const steps = allPickup
      ? ["Order confirmed", "Shop is packing", "Ready for pickup", "Collected"]
      : ["Order confirmed", "Shop is packing", "Out for delivery", "Delivered"];
    const doneCount = 2;

    app.innerHTML = `
      <section class="confirmation-hero">
        <div class="confirmation-icon">${LS.ui.icon("check", 34)}</div>
        <span class="eyebrow">Order placed</span>
        <h1>${firstName ? `${esc(firstName)}, it's yours` : "It's yours"}<span class="text-accent">.</span></h1>
        <p>${allPickup
          ? `Your pair is being pulled from the shelf. Head to ${esc(order.fulfilment[0].shopName)} in about ${Number(order.fulfilment[0].readyIn || 45)} minutes — bring your order number.`
          : `The shop has your order and will pack it shortly. We'll email tracking to ${esc(order.contact.email)}.`}</p>
        <span class="order-number">${esc(order.id)}</span>
        <div class="row mt-4" style="justify-content:center;flex-wrap:wrap">
          <a class="btn btn-primary" href="account.html#orders">Track this order</a>
          <a class="btn btn-outline" href="products.html">Keep shopping</a>
        </div>
      </section>

      <div class="container" style="max-width:980px">
        <div class="confirmation-card">
          <h2>Progress</h2>
          <div class="order-track">
            ${steps.map((label, index) => `<div class="track-step ${index < doneCount ? "is-done" : ""}">${esc(label)}</div>`).join("")}
          </div>
          <p class="small muted mt-3">${esc(order.eta)}${order.fulfilment.length > 1 ? ` across ${order.fulfilment.length} shops` : ""}.</p>
        </div>

        <div class="confirmation-card">
          <h2>Your pairs</h2>
          ${order.items.map((item) => `<div class="checkout-summary-line">
            <img src="${esc(item.image)}" alt="${esc(item.name)}" width="54" height="54" loading="lazy">
            <div><strong>${esc(item.name)}</strong><span>${esc(item.color)} · UK ${esc(item.size)} · Qty ${item.qty}</span><span>${esc(item.shopName)}</span></div>
            <span class="price">${LS.ui.money.fmt(item.price * item.qty)}</span>
          </div>`).join("")}
          <div class="summary-lines mt-2">
            ${order.totals.coupon ? `<div class="green"><span>Coupon (${esc(order.totals.coupon.code)})</span><span>− ${LS.ui.money.fmt(order.totals.coupon.amount)}</span></div>` : ""}
            ${order.totals.pickupSavings ? `<div class="green"><span>Pickup discount</span><span>− ${LS.ui.money.fmt(order.totals.pickupSavings)}</span></div>` : ""}
            <div><span>${allPickup ? "Pickup" : "Delivery"}</span><span>${order.totals.shipping ? LS.ui.money.fmt(order.totals.shipping) : "Free"}</span></div>
          </div>
          <div class="summary-total"><span>Paid</span><span>${LS.ui.money.fmt(total)}</span></div>
        </div>

        <div class="confirmation-card">
          <h2>${allPickup ? "Collect from" : "Deliver to"}</h2>
          ${order.fulfilment.map((group) => `<div class="review-block">
            <div class="review-block-head"><strong>${esc(group.shopName)}</strong><span class="badge ${group.mode === "pickup" ? "badge-pickup" : "badge-soft"}">${group.mode === "pickup" ? "Pickup" : "Delivery"}</span></div>
            <p>${esc(group.address)}<br>${esc(group.eta)} · ${esc(group.phone)}</p>
          </div>`).join("")}
          <div class="review-block" style="border-bottom:0;padding-bottom:0">
            <div class="review-block-head"><strong>Payment</strong></div>
            <p>${esc(order.payment.label)}${order.payment.detail && order.payment.detail !== "Pay in person" ? ` · ${esc(order.payment.detail)}` : ""}</p>
          </div>
        </div>

        <div class="confirmation-card">
          <h2>Need a hand?</h2>
          <p class="small muted">Call the shop directly, or reply to the confirmation email. Fit exchanges are free within 30 days.</p>
          <div class="row wrap mt-3">
            <a class="btn btn-dark btn-sm" href="contact.html">Contact support</a>
            <a class="btn btn-outline btn-sm" href="account.html#orders">View all orders</a>
          </div>
        </div>
      </div>`;
  }

  function init() {
    loadProfile();
    ensureFulfilment();
    if (document.body.dataset.page === "checkout") render();
    if (document.body.dataset.page === "confirmation") renderConfirmation();
    document.addEventListener("ls:cart", () => {
      if (document.body.dataset.page === "checkout") render();
    });
  }

  return {
    init,
    render,
    renderSummary: () => {
      const summary = byId("checkoutSummary");
      if (summary) summary.innerHTML = summaryHtml();
    },
    renderConfirmation,
    calculate,
    state
  };
})();

LS.pages = LS.pages || {};
LS.pages.checkout = () => LS.checkout.init();
LS.pages.confirmation = () => LS.checkout.renderConfirmation();
