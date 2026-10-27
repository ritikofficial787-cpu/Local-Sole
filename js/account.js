/* ==========================================================================
   Local Sole — account.js
   Hash-routed account area: overview, orders, addresses and profile. Reads
   orders written by checkout.js and keeps addresses in localStorage.
   ========================================================================== */

window.LS = window.LS || {};

(() => {
  const PROFILE_KEY = "ls_profile_v1";
  const ADDRESSES_KEY = "ls_addresses_v1";
  const ORDERS_KEY = "ls_orders_v1";

  const PANELS = ["overview", "orders", "addresses", "profile"];
  const AVATARS = [
    "assets/images/avatars/avatar-1.jpg",
    "assets/images/avatars/avatar-2.jpg",
    "assets/images/avatars/avatar-3.jpg",
    "assets/images/avatars/avatar-4.jpg"
  ];

  const state = {
    panel: "overview",
    profile: null,
    addresses: [],
    orders: []
  };

  const esc = (value) => LS.ui.escapeHtml(String(value ?? ""));
  const byId = (id) => document.getElementById(id);
  const money = (amount) => LS.ui.money.fmt(Number(amount) || 0);
  const orderById = (id) => state.orders.find((order) => order.id === id);

  function load() {
    const savedProfile = LS.ui.store(PROFILE_KEY, null);
    const latestOrder = (LS.ui.store(ORDERS_KEY, []) || [])[0];
    state.profile = {
      firstName: savedProfile?.firstName || latestOrder?.contact?.firstName || "Guest",
      lastName: savedProfile?.lastName || latestOrder?.contact?.lastName || "",
      email: savedProfile?.email || latestOrder?.contact?.email || "",
      phone: savedProfile?.phone || latestOrder?.contact?.phone || "",
      avatar: savedProfile?.avatar || AVATARS[2],
      marketing: Boolean(savedProfile?.marketing)
    };
    state.addresses = LS.ui.store(ADDRESSES_KEY, []) || [];
    state.orders = LS.ui.store(ORDERS_KEY, []) || [];
    const hash = (location.hash || "").replace("#", "");
    state.panel = PANELS.includes(hash) ? hash : "overview";
  }

  function saveProfile() {
    LS.ui.save(PROFILE_KEY, state.profile);
  }

  function saveAddresses() {
    LS.ui.save(ADDRESSES_KEY, state.addresses);
  }

  function displayName() {
    return `${state.profile.firstName} ${state.profile.lastName}`.trim() || "Guest shopper";
  }

  function initials() {
    return displayName().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
  }

  function statusBadge(status) {
    const map = {
      confirmed: { label: "Confirmed", className: "badge-pickup" },
      packed: { label: "Packed", className: "badge-pickup" },
      delivered: { label: "Delivered", className: "badge-soft" },
      collected: { label: "Collected", className: "badge-soft" },
      cancelled: { label: "Cancelled", className: "badge-soft" }
    };
    const item = map[status] || map.confirmed;
    return `<span class="badge ${item.className}">${item.label}</span>`;
  }

  /* ---------- shell ---------- */
  function renderUser() {
    const mount = byId("accountUser");
    if (!mount) return;
    mount.innerHTML = `<img src="${esc(state.profile.avatar)}" alt="" width="44" height="44">
      <div><strong>${esc(displayName())}</strong><span>${esc(state.profile.email || "Add your email")}</span></div>`;
  }

  function renderNav() {
    const mount = byId("accountNav");
    if (!mount) return;
    const item = (panel, icon, label, count) => `<button type="button" class="${state.panel === panel ? "is-active" : ""}" data-panel="${panel}" ${state.panel === panel ? 'aria-current="page"' : ""}>
      ${LS.ui.icon(icon, 16)} ${label}${count !== undefined ? `<span class="count">${count}</span>` : ""}
    </button>`;
    mount.innerHTML = `
      ${item("overview", "userCircle", "Overview")}
      ${item("orders", "bag", "Orders", state.orders.length)}
      ${item("addresses", "pin", "Addresses", state.addresses.length)}
      ${item("profile", "user", "Profile")}
      <a href="wishlist.html">${LS.ui.icon("heart", 16)} Wishlist <span class="count">${LS.wishlist.items.length}</span></a>
      <a href="compare.html">${LS.ui.icon("columns", 16)} Compare <span class="count">${LS.compare.items.length}</span></a>
      <button type="button" data-sign-out>${LS.ui.icon("arrowUpRight", 16)} Sign out</button>`;
  }

  /* ---------- overview ---------- */
  function latestOrderHtml() {
    const order = state.orders[0];
    if (!order) {
      return `<div class="empty-state" style="padding:32px 20px">
        <h2>No orders yet</h2>
        <p>Your first pair is waiting in a shop two streets away.</p>
        <a class="btn btn-primary" href="products.html">Start with the edit</a>
      </div>`;
    }
    return orderCard(order, { compact: true });
  }

  function overviewPanel() {
    const saved = LS.wishlist.items.length;
    const nextPickup = state.orders.find((order) => order.status === "confirmed" && order.fulfilment.some((f) => f.mode === "pickup"));
    return `<div class="account-panel-head">
      <div><span class="eyebrow">Overview</span><h2>Hello, ${esc(state.profile.firstName)}<span class="text-accent">.</span></h2></div>
      <a class="btn btn-outline btn-sm" href="products.html">Browse new arrivals</a>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><strong>${state.orders.length}</strong><span>Order${state.orders.length === 1 ? "" : "s"} placed</span></div>
      <div class="stat-card"><strong>${saved}</strong><span>Pair${saved === 1 ? "" : "s"} saved</span></div>
      <div class="stat-card"><strong>${state.addresses.length}</strong><span>Address${state.addresses.length === 1 ? "" : "es"}</span></div>
    </div>
    ${nextPickup ? `<div class="confirmation-card" style="margin-top:0">
      <h2>Next pickup</h2>
      <div class="review-block">
        <div class="review-block-head"><strong>${esc(nextPickup.fulfilment.find((f) => f.mode === "pickup").shopName)}</strong>${statusBadge(nextPickup.status)}</div>
        <p>${esc(nextPickup.fulfilment.find((f) => f.mode === "pickup").address)}<br>${esc(nextPickup.eta)} · Order ${esc(nextPickup.id)}</p>
      </div>
      <a class="btn btn-dark btn-sm" href="order-confirmation.html?order=${encodeURIComponent(nextPickup.id)}">Open pickup pass</a>
    </div>` : ""}
    <div class="account-panel-head" style="margin-top:26px"><h2 style="font-size:1.4rem">Latest order</h2><a class="link-underline small" href="#orders" data-panel-link="orders">All orders</a></div>
    ${latestOrderHtml()}`;
  }

  /* ---------- orders ---------- */
  function orderCard(order, { compact = false } = {}) {
    const items = order.items || [];
    const itemCount = items.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    const shops = [...new Set(items.map((item) => item.shopName).filter(Boolean))];
    const mode = (order.fulfilment || []).some((f) => f.mode === "pickup") ? "Pickup" : "Delivery";
    return `<article class="order-card">
      <div class="order-card-head">
        <div><strong>${esc(order.id)}</strong> · ${esc(LS.ui.formatDate(order.createdAt))}</div>
        <div class="row" style="gap:8px">${statusBadge(order.status)}<span>${esc(mode)}</span></div>
      </div>
      <div class="order-card-body">
        <div class="order-thumbs">${items.slice(0, 4).map((item) => `<img src="${esc(item.image)}" alt="" width="48" height="48" loading="lazy">`).join("")}</div>
        <p>${itemCount} item${itemCount === 1 ? "" : "s"} from ${esc(shops.join(" · ") || "Local Sole")}<br><span class="tiny muted">${esc(order.eta || "")}</span></p>
        <strong>${money(order.totals?.total)}</strong>
      </div>
      <div class="order-card-foot">
        <span class="small muted">${esc(order.payment?.label || "")}${order.payment?.detail && order.payment.detail !== "Pay in person" ? ` · ${esc(order.payment.detail)}` : ""}</span>
        <div class="row wrap">
          <button class="btn btn-outline btn-sm" type="button" data-view-order="${esc(order.id)}">View details</button>
          ${order.status === "confirmed" ? `<button class="btn btn-outline btn-sm" type="button" data-cancel-order="${esc(order.id)}">Cancel</button>` : ""}
          <a class="btn btn-dark btn-sm" href="order-confirmation.html?order=${encodeURIComponent(order.id)}">Track</a>
        </div>
      </div>
    </article>`;
  }

  function ordersPanel() {
    return `<div class="account-panel-head">
      <div><span class="eyebrow">Orders</span><h2>Every pair, accounted for<span class="text-accent">.</span></h2></div>
      <span class="small muted">${state.orders.length} order${state.orders.length === 1 ? "" : "s"}</span>
    </div>
    ${state.orders.length
      ? state.orders.map((order) => orderCard(order)).join("")
      : `<div class="empty-state">
          <div class="confirmation-icon" style="background:var(--bg-sunken);color:var(--ink-3)">${LS.ui.icon("bag", 28)}</div>
          <h2>No orders yet</h2>
          <p>When you reserve a pair, its pickup pass and receipt will live here.</p>
          <a class="btn btn-primary" href="products.html">Find your first pair</a>
        </div>`}`;
  }

  function viewOrder(id) {
    const order = orderById(id);
    if (!order) return;
    const allPickup = (order.fulfilment || []).every((f) => f.mode === "pickup");
    LS.ui.openModal(`<div class="modal-head">
        <span class="eyebrow">Order</span>
        <h2>${esc(order.id)}</h2>
        <p>${esc(LS.ui.formatDate(order.createdAt))} · ${esc(order.payment?.label || "")}</p>
      </div>
      <div class="modal-body">
        ${(order.items || []).map((item) => `<div class="checkout-summary-line">
          <img src="${esc(item.image)}" alt="" width="54" height="54">
          <div><strong>${esc(item.name)}</strong><span>${esc(item.color)} · UK ${esc(item.size)} · Qty ${item.qty}</span><span>${esc(item.shopName)}</span></div>
          <span class="price">${money(item.price * item.qty)}</span>
        </div>`).join("")}
        <div class="review-block mt-3">
          <div class="review-block-head"><strong>${allPickup ? "Pickup" : "Delivery"}</strong></div>
          ${(order.fulfilment || []).map((f) => `<p>${esc(f.shopName)} · ${esc(f.address)}<br><span class="tiny muted">${esc(f.eta)}</span></p>`).join("")}
        </div>
        <div class="summary-total"><span>Total paid</span><span>${money(order.totals?.total)}</span></div>
        <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-outline" type="button" data-close-modal>Close</button>
          <a class="btn btn-primary" href="order-confirmation.html?order=${encodeURIComponent(order.id)}">Open tracking</a>
        </div>
      </div>`, { className: "modal-lg", label: `Order ${order.id}` });
  }

  function cancelOrder(id) {
    const order = orderById(id);
    if (!order) return;
    LS.ui.openModal(`<div class="modal-head">
        <h2>Cancel ${esc(order.id)}?</h2>
        <p>The shop will release your stock. You can always order again — sizes may move.</p>
      </div>
      <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-outline" type="button" data-close-modal>Keep order</button>
        <button class="btn btn-primary" type="button" id="confirmCancelOrder">Cancel order</button>
      </div>`, {
      className: "modal-sm",
      label: "Cancel order",
      onMount: (modal) => {
        modal.querySelector("#confirmCancelOrder").addEventListener("click", () => {
          order.status = "cancelled";
          LS.ui.save(ORDERS_KEY, state.orders);
          LS.ui.closeModal();
          LS.ui.toast({ title: "Order cancelled", message: `${order.id} has been cancelled. No payment was taken in this demo.`, type: "info" });
          render();
        });
      }
    });
  }

  /* ---------- addresses ---------- */
  function addressCard(address, index) {
    return `<article class="address-card ${address.isDefault ? "is-default" : ""}">
      <h3>${esc(address.label || "Home")} ${address.isDefault ? '<span class="badge badge-pickup">Default</span>' : ""}</h3>
      <p>${esc(address.line1)}${address.line2 ? `<br>${esc(address.line2)}` : ""}<br>${esc(address.city)} ${esc(address.pincode)}<br>${esc(address.state)}</p>
      <div class="address-actions">
        <button type="button" data-edit-address="${index}">Edit</button>
        ${address.isDefault ? "" : `<button type="button" data-default-address="${index}">Make default</button>`}
        <button type="button" data-delete-address="${index}">Delete</button>
      </div>
    </article>`;
  }

  function addressesPanel() {
    return `<div class="account-panel-head">
      <div><span class="eyebrow">Addresses</span><h2>Where shoes should land<span class="text-accent">.</span></h2></div>
      <button class="btn btn-dark btn-sm" type="button" data-add-address>${LS.ui.icon("plus", 15)} Add address</button>
    </div>
    <div class="address-grid">
      ${state.addresses.map(addressCard).join("")}
      <button class="address-add" type="button" data-add-address>${LS.ui.icon("plus", 22)} Add a new address</button>
    </div>
    <p class="tiny muted mt-3">Addresses are stored on this device only. Shops receive the address attached to your order.</p>`;
  }

  function addressModal(index = null) {
    const editing = index !== null ? state.addresses[index] : null;
    const address = editing || { label: "Home", line1: "", line2: "", city: "Bengaluru", state: "Karnataka", pincode: "", isDefault: state.addresses.length === 0 };
    LS.ui.openModal(`<div class="modal-head">
        <h2>${editing ? "Edit address" : "Add an address"}</h2>
        <p>We'll use this for delivery orders and show it on your receipts.</p>
      </div>
      <form id="addressForm" novalidate>
        <div class="form-grid">
          <div class="field span-2"><label for="addrLabel">Label</label><input class="input" id="addrLabel" value="${esc(address.label)}" placeholder="Home, work, mum's place" required></div>
          <div class="field span-2"><label for="addrLine1">Address line 1</label><input class="input" id="addrLine1" value="${esc(address.line1)}" placeholder="Flat / house, street" required></div>
          <div class="field span-2"><label for="addrLine2">Address line 2</label><input class="input" id="addrLine2" value="${esc(address.line2)}" placeholder="Area, landmark (optional)"></div>
          <div class="field"><label for="addrCity">City</label><input class="input" id="addrCity" value="${esc(address.city)}" required></div>
          <div class="field"><label for="addrState">State</label><input class="input" id="addrState" value="${esc(address.state)}" required></div>
          <div class="field"><label for="addrPincode">Pincode</label><input class="input" id="addrPincode" inputmode="numeric" maxlength="6" value="${esc(address.pincode)}" placeholder="560038" required></div>
          <div class="field" style="justify-content:flex-end"><label class="checkbox"><input type="checkbox" id="addrDefault" ${address.isDefault ? "checked" : ""}> Make this my default</label></div>
        </div>
        <div class="field-error mt-3" id="addressError" role="alert"></div>
        <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
          <button class="btn btn-primary" type="submit">${editing ? "Save changes" : "Save address"}</button>
        </div>
      </form>`, {
      className: "modal-lg",
      label: editing ? "Edit address" : "Add address",
      onMount: (modal) => {
        const form = modal.querySelector("#addressForm");
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const get = (id) => modal.querySelector(`#${id}`).value.trim();
          const error = modal.querySelector("#addressError");
          if (!get("addrLine1") || !get("addrCity") || !get("addrState") || !/^\d{6}$/.test(get("addrPincode"))) {
            error.textContent = "Add a street address, city, state and a valid 6-digit pincode.";
            return;
          }
          const next = {
            id: editing?.id || `addr_${Date.now().toString(36)}`,
            label: get("addrLabel") || "Home",
            line1: get("addrLine1"),
            line2: get("addrLine2"),
            city: get("addrCity"),
            state: get("addrState"),
            pincode: get("addrPincode")
          };
          if (editing) {
            state.addresses[index] = { ...state.addresses[index], ...next };
          } else {
            state.addresses.push({ ...next, isDefault: false });
            index = state.addresses.length - 1;
          }
          if (modal.querySelector("#addrDefault").checked || state.addresses.length === 1) {
            state.addresses.forEach((a, i) => { a.isDefault = i === index; });
          }
          saveAddresses();
          LS.ui.closeModal();
          LS.ui.toast({ title: editing ? "Address updated" : "Address saved", message: "Ready for your next delivery.", type: "success" });
          render();
        });
      }
    });
  }

  function deleteAddress(index) {
    const address = state.addresses[index];
    if (!address) return;
    LS.ui.openModal(`<div class="modal-head">
        <h2>Delete this address?</h2>
        <p>${esc(address.line1)}, ${esc(address.city)} ${esc(address.pincode)}</p>
      </div>
      <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-outline" type="button" data-close-modal>Keep it</button>
        <button class="btn btn-primary" type="button" id="confirmDeleteAddress">Delete address</button>
      </div>`, {
      className: "modal-sm",
      label: "Delete address",
      onMount: (modal) => {
        modal.querySelector("#confirmDeleteAddress").addEventListener("click", () => {
          state.addresses.splice(index, 1);
          if (state.addresses.length && !state.addresses.some((a) => a.isDefault)) state.addresses[0].isDefault = true;
          saveAddresses();
          LS.ui.closeModal();
          LS.ui.toast({ title: "Address deleted", type: "info" });
          render();
        });
      }
    });
  }

  /* ---------- profile ---------- */
  function profilePanel() {
    const p = state.profile;
    return `<div class="account-panel-head">
      <div><span class="eyebrow">Profile</span><h2>Your details<span class="text-accent">.</span></h2></div>
      <span class="small muted">Guest demo · stored locally</span>
    </div>
    <form id="profileForm" novalidate>
      <div class="contact-form-card" style="padding:22px">
        <h2 style="font-size:1.15rem;margin-bottom:14px">Choose an avatar</h2>
        <div class="avatar-picker" role="radiogroup" aria-label="Avatar">
          ${AVATARS.map((src, index) => `<label class="avatar-option">
            <input type="radio" name="avatar" value="${src}" ${p.avatar === src ? "checked" : ""} aria-label="Avatar ${index + 1}">
            <img src="${src}" alt="Avatar option ${index + 1}" width="56" height="56">
          </label>`).join("")}
        </div>
        <div class="form-grid mt-4">
          <div class="field"><label for="profileFirst">First name</label><input class="input" id="profileFirst" value="${esc(p.firstName === "Guest" ? "" : p.firstName)}" autocomplete="given-name" required></div>
          <div class="field"><label for="profileLast">Last name</label><input class="input" id="profileLast" value="${esc(p.lastName)}" autocomplete="family-name"></div>
          <div class="field"><label for="profileEmail">Email</label><input class="input" id="profileEmail" type="email" value="${esc(p.email)}" autocomplete="email" placeholder="you@example.com"></div>
          <div class="field"><label for="profilePhone">Mobile</label><input class="input" id="profilePhone" type="tel" value="${esc(p.phone)}" autocomplete="tel" placeholder="98765 43210"></div>
        </div>
        <label class="checkbox mt-4"><input type="checkbox" id="profileMarketing" ${p.marketing ? "checked" : ""}> Send me the occasional drop note from local shops. No more than twice a month.</label>
        <div class="field-error mt-3" id="profileError" role="alert"></div>
        <div class="row mt-4">
          <button class="btn btn-primary" type="submit">Save profile</button>
          <span class="tiny muted">Your data never leaves this browser.</span>
        </div>
      </div>
    </form>
    <div class="confirmation-card">
      <h2>Demo notes</h2>
      <p class="small muted">This is a front-end demo. There is no password, server account or real payment. Orders, addresses and this profile are stored in localStorage so the experience survives a refresh.</p>
      <div class="row wrap mt-3">
        <a class="btn btn-outline btn-sm" href="owner.html">Open shop-owner dashboard</a>
        <button class="btn btn-ghost btn-sm" type="button" data-sign-out>Sign out of demo</button>
      </div>
    </div>`;
  }

  /* ---------- render ---------- */
  function currentPanelHtml() {
    if (state.panel === "orders") return ordersPanel();
    if (state.panel === "addresses") return addressesPanel();
    if (state.panel === "profile") return profilePanel();
    return overviewPanel();
  }

  function render() {
    renderUser();
    renderNav();
    const main = byId("accountMain");
    if (!main) return;
    main.innerHTML = `<div class="account-panel is-active" id="panel-${state.panel}">${currentPanelHtml()}</div>`;
    bindPanels();
  }

  function bindPanels() {
    const main = byId("accountMain");
    if (!main) return;

    main.querySelectorAll("[data-view-order]").forEach((button) => button.addEventListener("click", () => viewOrder(button.dataset.viewOrder)));
    main.querySelectorAll("[data-cancel-order]").forEach((button) => button.addEventListener("click", () => cancelOrder(button.dataset.cancelOrder)));
    main.querySelectorAll("[data-add-address]").forEach((button) => button.addEventListener("click", () => addressModal()));
    main.querySelectorAll("[data-edit-address]").forEach((button) => button.addEventListener("click", () => addressModal(Number(button.dataset.editAddress))));
    main.querySelectorAll("[data-delete-address]").forEach((button) => button.addEventListener("click", () => deleteAddress(Number(button.dataset.deleteAddress))));
    main.querySelectorAll("[data-default-address]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.defaultAddress);
      state.addresses.forEach((address, i) => { address.isDefault = i === index; });
      saveAddresses();
      LS.ui.toast({ title: "Default address updated", type: "success" });
      render();
    }));

    main.querySelectorAll("[data-panel-link]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      setPanel(link.dataset.panelLink);
    }));

    const profileForm = main.querySelector("#profileForm");
    if (profileForm) {
      profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const get = (id) => main.querySelector(`#${id}`)?.value.trim() || "";
        const error = main.querySelector("#profileError");
        const email = get("profileEmail");
        const phone = get("profilePhone").replace(/[\s-]/g, "");
        if (!get("profileFirst")) { error.textContent = "Add a first name so shops know who's collecting."; return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { error.textContent = "That email doesn't look right."; return; }
        if (phone && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(phone)) { error.textContent = "Enter a valid 10-digit Indian mobile number."; return; }
        error.textContent = "";
        state.profile = {
          ...state.profile,
          firstName: get("profileFirst"),
          lastName: get("profileLast"),
          email,
          phone: get("profilePhone"),
          avatar: profileForm.querySelector('input[name="avatar"]:checked')?.value || state.profile.avatar,
          marketing: main.querySelector("#profileMarketing").checked
        };
        saveProfile();
        LS.ui.toast({ title: "Profile saved", message: "Your details are up to date.", type: "success" });
        render();
      });
    }
  }

  function setPanel(panel, { scroll = false } = {}) {
    if (!PANELS.includes(panel)) panel = "overview";
    state.panel = panel;
    if (history.replaceState) history.replaceState(null, "", `#${panel}`);
    render();
    if (scroll) byId("accountMain")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function signOut() {
    LS.ui.openModal(`<div class="modal-head">
        <h2>Sign out of the demo?</h2>
        <p>Your orders stay on this device so tracking still works. Your profile and saved addresses will be cleared.</p>
      </div>
      <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-outline" type="button" data-close-modal>Stay signed in</button>
        <button class="btn btn-primary" type="button" id="confirmSignOut">Sign out</button>
      </div>`, {
      className: "modal-sm",
      label: "Sign out",
      onMount: (modal) => {
        modal.querySelector("#confirmSignOut").addEventListener("click", () => {
          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem(ADDRESSES_KEY);
          LS.ui.closeModal();
          load();
          render();
          LS.ui.toast({ title: "Signed out", message: "Orders remain on this device. See you soon.", type: "info" });
        });
      }
    });
  }

  function init() {
    load();
    render();

    document.addEventListener("click", (event) => {
      const navItem = event.target.closest("[data-panel]");
      if (navItem) {
        setPanel(navItem.dataset.panel);
        return;
      }
      if (event.target.closest("[data-sign-out]")) signOut();
    });

    window.addEventListener("hashchange", () => {
      const hash = location.hash.replace("#", "");
      if (PANELS.includes(hash) && hash !== state.panel) {
        state.panel = hash;
        render();
      }
    });

    document.addEventListener("ls:currency", render);
  }

  LS.accountPage = { render, setPanel };

  LS.pages = LS.pages || {};
  LS.pages.account = init;
})();
