/* ==========================================================================
   Local Sole — owner.js
   Shop-owner demo dashboard: stock overview, product CRUD with an overlay in
   localStorage, search/filter, order list and a small insights panel.
   ========================================================================== */

window.LS = window.LS || {};

(() => {
  const SHOP_KEY = "ls_owner_shop_v1";
  const OVERLAY_KEY = LS.data.OWNER_KEY;
  const ORDERS_KEY = "ls_orders_v1";

  const state = {
    shopId: LS.ui.store(SHOP_KEY, "sole-theory"),
    panel: "inventory",
    search: "",
    category: "all"
  };

  const esc = (value) => LS.ui.escapeHtml(String(value ?? ""));
  const byId = (id) => document.getElementById(id);
  const money = (n) => LS.ui.money.fmt(Number(n) || 0);

  function shop() {
    return LS.data.shopById(state.shopId) || LS.data.shops[0];
  }

  function products() {
    return LS.data.products.filter((product) => product.shopId === state.shopId);
  }

  function orders() {
    return (LS.ui.store(ORDERS_KEY, []) || []).filter((order) =>
      (order.items || []).some((item) => item.shopId === state.shopId)
    );
  }

  function overlay() {
    const saved = LS.ui.store(OVERLAY_KEY, null);
    return {
      deleted: Array.isArray(saved?.deleted) ? saved.deleted : [],
      edits: saved?.edits && typeof saved.edits === "object" ? saved.edits : {},
      custom: Array.isArray(saved?.custom) ? saved.custom : []
    };
  }

  function saveOverlay(next) {
    LS.ui.save(OVERLAY_KEY, next);
  }

  function stockTotal(product) {
    return (product.sizes || []).reduce((sum, size) => sum + Number(size.stock || 0), 0);
  }

  function recalc(product) {
    product.stockTotal = stockTotal(product);
    product.inStock = product.stockTotal > 0;
    product.discount = product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;
    return product;
  }

  function slugify(value) {
    return String(value || "pair").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 38) || "pair";
  }

  function shopRevenue() {
    return orders().filter((order) => order.status !== "cancelled").reduce((sum, order) => {
      return sum + (order.items || []).filter((item) => item.shopId === state.shopId)
        .reduce((lineSum, item) => lineSum + Number(item.price || 0) * Number(item.qty || 1), 0);
    }, 0);
  }

  function statusBadge(order) {
    const map = {
      confirmed: { label: "Confirmed", className: "badge-pickup" },
      cancelled: { label: "Cancelled", className: "badge-soft" },
      delivered: { label: "Delivered", className: "badge-soft" }
    };
    const item = map[order.status] || map.confirmed;
    return `<span class="badge ${item.className}">${item.label}</span>`;
  }

  /* ---------- shell ---------- */
  function renderShopSelect() {
    const select = byId("ownerShopSelect");
    if (!select) return;
    select.innerHTML = LS.data.shops.map((item) => `<option value="${esc(item.id)}" ${item.id === state.shopId ? "selected" : ""}>${esc(item.name)} · ${esc(item.area)}</option>`).join("");
  }

  function renderSidebar() {
    const current = shop();
    const card = byId("ownerShopCard");
    if (card && current) {
      const live = products().filter((p) => p.inStock).length;
      card.innerHTML = `<img src="${esc(current.logo)}" alt="" width="36" height="36">
        <div><strong>${esc(current.name)}</strong><span>${esc(current.area)} · ${live} live styles</span></div>`;
    }
    const nav = byId("ownerNav");
    if (nav) {
      const navItem = (panel, icon, label, count) => `<button type="button" class="${state.panel === panel ? "is-active" : ""}" data-owner-panel="${panel}" ${state.panel === panel ? 'aria-current="page"' : ""}>
        ${LS.ui.icon(icon, 16)} ${label}<span class="count">${count}</span>
      </button>`;
      nav.innerHTML = `
        ${navItem("inventory", "grid", "Inventory", products().length)}
        ${navItem("orders", "bag", "Orders", orders().length)}
        ${navItem("insights", "sparkle", "Insights", "")}
        <a href="shop.html?id=${encodeURIComponent(state.shopId)}">${LS.ui.icon("store", 16)} View storefront</a>
        <button type="button" data-owner-reset>${LS.ui.icon("refresh", 16)} Reset demo</button>`;
    }
  }

  /* ---------- inventory ---------- */
  function filteredProducts() {
    const query = state.search.trim().toLowerCase();
    return products()
      .filter((product) => state.category === "all" || product.type === state.category)
      .filter((product) => {
        if (!query) return true;
        return [product.name, product.brand, product.sku, product.type].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.name.localeCompare(b.name));
  }

  function statsHtml() {
    const list = products();
    const low = list.filter((p) => p.stockTotal > 0 && p.stockTotal < 10).length;
    const units = list.reduce((sum, p) => sum + p.stockTotal, 0);
    return `<div class="owner-stats">
      <div class="owner-stat"><strong>${list.length}</strong><span>Live styles</span></div>
      <div class="owner-stat"><strong>${units}</strong><span>Pairs in stock</span></div>
      <div class="owner-stat"><strong>${low}</strong><span>Low stock alerts</span></div>
      <div class="owner-stat"><strong>${money(shopRevenue())}</strong><span>Demo revenue</span></div>
    </div>`;
  }

  function stockCell(product) {
    const total = product.stockTotal || 0;
    const ratio = Math.max(0, Math.min(100, Math.round((total / 40) * 100)));
    const className = total === 0 ? "out" : total < 10 ? "low" : "";
    return `<div class="row" style="gap:8px">
      <span class="stock-bar ${className}" aria-hidden="true"><span style="width:${ratio}%"></span></span>
      <span>${total}</span>
    </div>`;
  }

  function inventoryTable() {
    const list = filteredProducts();
    if (!list.length) {
      return `<div class="owner-empty">
        <p><strong>No products match this view.</strong></p>
        <p class="small muted">Try a different search, or add a pair to this shop.</p>
        <button class="btn btn-primary btn-sm mt-2" type="button" data-owner-add>Add a product</button>
      </div>`;
    }
    return `<div class="table-wrap"><table class="data-table">
      <caption class="sr-only">Products for ${esc(shop()?.name || "this shop")}</caption>
      <thead><tr><th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
      <tbody>
        ${list.map((product) => {
          const low = product.stockTotal > 0 && product.stockTotal < 10;
          return `<tr>
            <td><div class="table-product">
              <img src="${esc(product.images[0])}" alt="" width="40" height="40" loading="lazy">
              <div><strong>${esc(product.name)}</strong><span>${esc(product.brand)} · ${esc(product.type)}</span></div>
            </div></td>
            <td class="tiny muted">${esc(product.sku)}</td>
            <td><strong>${money(product.price)}</strong>${product.oldPrice ? `<br><s class="tiny muted">${money(product.oldPrice)}</s>` : ""}</td>
            <td>${stockCell(product)}</td>
            <td>${product.stockTotal === 0 ? '<span class="badge badge-soft">Sold out</span>' : low ? '<span class="badge badge-low">Low stock</span>' : '<span class="badge badge-pickup">Active</span>'}</td>
            <td><div class="table-actions">
              <button type="button" data-owner-edit="${esc(product.id)}" aria-label="Edit ${esc(product.name)}" title="Edit">${LS.ui.icon("edit", 14)}</button>
              <button type="button" class="danger" data-owner-delete="${esc(product.id)}" aria-label="Delete ${esc(product.name)}" title="Delete">${LS.ui.icon("trash", 14)}</button>
            </div></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table></div>`;
  }

  function inventoryPanel() {
    const categories = [...new Set(products().map((p) => p.type))].sort();
    return `<div class="account-panel-head">
      <div><span class="eyebrow">Inventory</span><h2>What's on the shelves<span class="text-accent">.</span></h2></div>
      <button class="btn btn-dark btn-sm" type="button" data-owner-add>${LS.ui.icon("plus", 15)} Add product</button>
    </div>
    ${statsHtml()}
    <div class="owner-toolbar">
      <div class="row">
        <label class="sr-only" for="ownerSearch">Search products</label>
        <input class="input" id="ownerSearch" type="search" placeholder="Search name, brand or SKU" value="${esc(state.search)}">
        <label class="sr-only" for="ownerCategory">Filter by category</label>
        <select class="select" id="ownerCategory" style="min-height:40px;font-size:.8rem;width:auto">
          <option value="all">All categories</option>
          ${categories.map((type) => `<option value="${esc(type)}" ${state.category === type ? "selected" : ""}>${esc(type[0].toUpperCase() + type.slice(1))}</option>`).join("")}
        </select>
      </div>
      <span class="small muted" id="ownerResultCount">${filteredProducts().length} product${filteredProducts().length === 1 ? "" : "s"}</span>
    </div>
    <div id="ownerTableWrap">${inventoryTable()}</div>
    <p class="tiny muted mt-3">Edits save to this browser and appear across the storefront immediately. Use <strong>Reset demo</strong> to restore the original catalogue.</p>`;
  }

  /* ---------- orders ---------- */
  function ordersPanel() {
    const list = orders();
    return `<div class="account-panel-head">
      <div><span class="eyebrow">Orders</span><h2>Coming through the door<span class="text-accent">.</span></h2></div>
      <span class="small muted">${list.length} order${list.length === 1 ? "" : "s"}</span>
    </div>
    ${list.length ? `<div class="table-wrap"><table class="data-table">
      <caption class="sr-only">Orders for ${esc(shop()?.name || "this shop")}</caption>
      <thead><tr><th scope="col">Order</th><th scope="col">Date</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col">Your total</th><th scope="col">Status</th><th scope="col"></th></tr></thead>
      <tbody>${list.map((order) => {
        const mine = (order.items || []).filter((item) => item.shopId === state.shopId);
        const total = mine.reduce((sum, item) => sum + Number(item.price) * Number(item.qty || 1), 0);
        return `<tr>
          <td><strong>${esc(order.id)}</strong></td>
          <td class="tiny muted">${esc(LS.ui.formatDate(order.createdAt))}</td>
          <td>${esc(order.contact?.firstName || "")} ${esc(order.contact?.lastName || "")}</td>
          <td>${mine.reduce((sum, item) => sum + Number(item.qty || 1), 0)}</td>
          <td><strong>${money(total)}</strong></td>
          <td>${statusBadge(order)}</td>
          <td><button class="btn btn-outline btn-sm" type="button" data-owner-order="${esc(order.id)}">View</button></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>` : `<div class="empty-state">
      <div class="confirmation-icon" style="background:var(--bg-sunken);color:var(--ink-3)">${LS.ui.icon("bag", 28)}</div>
      <h2>No orders yet</h2>
      <p>Orders placed on the storefront for this shop will appear here, including pickup details.</p>
      <a class="btn btn-primary" href="index.html">See the storefront</a>
    </div>`}`;
  }

  function orderModal(id) {
    const order = orders().find((item) => item.id === id);
    if (!order) return;
    const mine = (order.items || []).filter((item) => item.shopId === state.shopId);
    const total = mine.reduce((sum, item) => sum + Number(item.price) * Number(item.qty || 1), 0);
    const fulfilment = (order.fulfilment || []).find((f) => f.shopId === state.shopId);
    LS.ui.openModal(`<div class="modal-head">
        <span class="eyebrow">Order</span>
        <h2>${esc(order.id)}</h2>
        <p>${esc(LS.ui.formatDate(order.createdAt))} · ${esc(order.contact?.firstName || "")} ${esc(order.contact?.lastName || "")}</p>
      </div>
      <div class="modal-body">
        ${mine.map((item) => `<div class="checkout-summary-line">
          <img src="${esc(item.image)}" alt="" width="54" height="54">
          <div><strong>${esc(item.name)}</strong><span>${esc(item.color)} · UK ${esc(item.size)} · Qty ${item.qty}</span></div>
          <span class="price">${money(Number(item.price) * Number(item.qty || 1))}</span>
        </div>`).join("")}
        ${fulfilment ? `<div class="review-block mt-3" style="border-bottom:0">
          <div class="review-block-head"><strong>${fulfilment.mode === "pickup" ? "Pickup" : "Delivery"}</strong>${statusBadge(order)}</div>
          <p>${esc(fulfilment.address)}<br>${esc(fulfilment.eta)}</p>
        </div>` : ""}
        <div class="summary-total"><span>Your total</span><span>${money(total)}</span></div>
        <div class="row mt-4" style="justify-content:flex-end">
          <button class="btn btn-outline" type="button" data-close-modal>Close</button>
        </div>
      </div>`, { className: "modal-lg", label: `Order ${order.id}` });
  }

  /* ---------- insights ---------- */
  function insightsPanel() {
    const list = products();
    const byType = new Map();
    list.forEach((product) => {
      byType.set(product.type, (byType.get(product.type) || 0) + product.stockTotal);
    });
    const max = Math.max(1, ...byType.values());
    const low = list.filter((p) => p.stockTotal < 10).sort((a, b) => a.stockTotal - b.stockTotal);
    const top = list.slice().sort((a, b) => b.stockTotal - a.stockTotal).slice(0, 4);
    return `<div class="account-panel-head">
      <div><span class="eyebrow">Insights</span><h2>Where the stock sits<span class="text-accent">.</span></h2></div>
      <span class="small muted">Live from this browser</span>
    </div>
    <div class="confirmation-card" style="margin-top:0">
      <h2>Stock by category</h2>
      ${[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([type, units]) => `<div class="row" style="gap:10px;margin-bottom:8px">
        <span class="small" style="width:90px;text-transform:capitalize">${esc(type)}</span>
        <span class="stock-bar" style="flex:1;width:auto" aria-hidden="true"><span style="width:${Math.round((units / max) * 100)}%"></span></span>
        <span class="small muted" style="width:40px;text-align:right">${units}</span>
      </div>`).join("")}
    </div>
    <div class="confirmation-card">
      <h2>Low stock, in order of urgency</h2>
      ${low.length ? low.slice(0, 6).map((product) => `<div class="row-between" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="small"><strong>${esc(product.name)}</strong><br><span class="tiny muted">${esc(product.sku)}</span></span>
        <span class="badge ${product.stockTotal === 0 ? "badge-soft" : "badge-low"}">${product.stockTotal} left</span>
      </div>`).join("") : `<p class="small muted">Everything has ten pairs or more. A rare and lovely thing.</p>`}
    </div>
    <div class="confirmation-card">
      <h2>Best stocked</h2>
      <div class="row wrap">
        ${top.map((product) => `<a href="product.html?id=${encodeURIComponent(product.id)}" class="row" style="gap:8px;font-size:.78rem">
          <img src="${esc(product.images[0])}" alt="" width="40" height="40" style="border-radius:8px;object-fit:cover">
          <span><strong>${esc(product.name)}</strong><br><span class="tiny muted">${product.stockTotal} pairs</span></span>
        </a>`).join("")}
      </div>
    </div>`;
  }

  /* ---------- product form ---------- */
  function sizesToText(sizes) {
    return (sizes || []).map((size) => `${size.size}:${size.stock}`).join(", ");
  }

  function colorsToText(colors) {
    return (colors || []).map((color) => `${color.name}:${color.hex}`).join(", ");
  }

  function parseSizes(text) {
    const sizes = String(text || "").split(",").map((part) => {
      const [size, stock] = part.split(":").map((value) => value?.trim());
      if (!size) return null;
      return { size: String(size), stock: Math.max(0, Number(stock) || 0) };
    }).filter(Boolean);
    return sizes;
  }

  function parseColors(text, image) {
    return String(text || "").split(",").map((part) => {
      const [name, hex] = part.split(":").map((value) => value?.trim());
      if (!name) return null;
      return { name, hex: /^#[0-9a-f]{3,8}$/i.test(hex || "") ? hex : "#232323", image };
    }).filter(Boolean);
  }

  function productModal(productId = null) {
    const existing = productId ? LS.data.productById(productId) : null;
    const current = shop();
    const image = existing?.images?.[0] || "assets/images/shoes/triple-white.jpg";
    const categories = LS.data.categories();
    const types = LS.data.types();
    LS.ui.openModal(`<div class="modal-head">
        <span class="eyebrow">${existing ? "Edit product" : "New product"}</span>
        <h2>${existing ? esc(existing.name) : `Add a pair to ${esc(current?.name || "your shop")}`}</h2>
        <p>Listing changes appear on the storefront as soon as you save.</p>
      </div>
      <form id="ownerProductForm" novalidate>
        <div class="form-grid">
          <div class="field span-2"><label for="opName">Product name</label><input class="input" id="opName" value="${esc(existing?.name || "")}" placeholder="Air Zoom Pegasus 41" required></div>
          <div class="field"><label for="opBrand">Brand</label><input class="input" id="opBrand" value="${esc(existing?.brand || "")}" placeholder="Nike" required></div>
          <div class="field"><label for="opCategory">Audience</label><select class="select" id="opCategory">
            ${categories.map((category) => `<option value="${category}" ${existing?.category === category ? "selected" : ""}>${esc(category[0].toUpperCase() + category.slice(1))}</option>`).join("")}
          </select></div>
          <div class="field"><label for="opType">Category</label><select class="select" id="opType">
            ${types.map((type) => `<option value="${type}" ${existing?.type === type ? "selected" : ""}>${esc(type[0].toUpperCase() + type.slice(1))}</option>`).join("")}
          </select></div>
          <div class="field"><label for="opMaterial">Material</label><input class="input" id="opMaterial" value="${esc(existing?.material || "")}" placeholder="Engineered mesh"></div>
          <div class="field"><label for="opPrice">Price (INR)</label><input class="input" id="opPrice" type="number" min="1" step="1" value="${existing?.price || ""}" placeholder="8999" required></div>
          <div class="field"><label for="opOldPrice">Compare-at price (INR)</label><input class="input" id="opOldPrice" type="number" min="0" step="1" value="${existing?.oldPrice || ""}" placeholder="Optional"></div>
          <div class="field span-2"><label for="opImage">Primary image path</label><input class="input" id="opImage" value="${esc(image)}" placeholder="assets/images/shoes/…"></div>
          <div class="field span-2" style="flex-direction:row;align-items:center;gap:12px">
            <img id="opImagePreview" src="${esc(image)}" alt="Image preview" width="72" height="72" style="border-radius:10px;object-fit:cover;background:var(--bg-sunken)">
            <span class="tiny muted">Use one of the bundled images in <code>assets/images/shoes/</code>.</span>
          </div>
          <div class="field span-2"><label for="opSizes">Sizes and stock</label><input class="input" id="opSizes" value="${esc(sizesToText(existing?.sizes || [{ size: "6", stock: 4 }, { size: "7", stock: 4 }, { size: "8", stock: 4 }, { size: "9", stock: 4 }, { size: "10", stock: 4 }]))}" placeholder="6:4, 7:2, 8:0" required>
            <span class="tiny muted">Format: UK size : pairs in stock, separated by commas.</span></div>
          <div class="field span-2"><label for="opColors">Colours</label><input class="input" id="opColors" value="${esc(colorsToText(existing?.colors || [{ name: "Bone", hex: "#E7DFD1" }]))}" placeholder="Coral:#E4674C, Black:#232323" required>
            <span class="tiny muted">Format: Name : hex colour.</span></div>
          <div class="field span-2"><label for="opDescription">Description</label><textarea class="textarea" id="opDescription" placeholder="What makes this pair worth walking in for?">${esc(existing?.description || "")}</textarea></div>
        </div>
        <div class="field-error mt-3" id="opError" role="alert"></div>
        <div class="row-between mt-4" style="flex-wrap:wrap;gap:10px">
          <span class="tiny muted">Selling for ${esc(current?.name || "this shop")} · SKU ${esc(existing?.sku || "generated on save")}</span>
          <div class="row">
            <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
            <button class="btn btn-primary" type="submit">${existing ? "Save changes" : "Publish product"}</button>
          </div>
        </div>
      </form>`, {
      className: "modal-lg",
      label: existing ? `Edit ${existing.name}` : "Add product",
      onMount: (modal) => {
        const form = modal.querySelector("#ownerProductForm");
        const imageInput = modal.querySelector("#opImage");
        const preview = modal.querySelector("#opImagePreview");
        imageInput.addEventListener("input", () => {
          preview.src = imageInput.value.trim() || "assets/images/icons/placeholder.svg";
        });
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const get = (id) => modal.querySelector(`#${id}`).value.trim();
          const error = modal.querySelector("#opError");
          const name = get("opName");
          const brand = get("opBrand");
          const price = Number(get("opPrice"));
          const oldPrice = Number(get("opOldPrice")) || null;
          const sizes = parseSizes(get("opSizes"));
          const colors = parseColors(get("opColors"), imageInput.value.trim());
          const imagePath = imageInput.value.trim() || "assets/images/icons/placeholder.svg";

          if (name.length < 2) { error.textContent = "Give the product a name."; return; }
          if (!brand) { error.textContent = "Add the brand."; return; }
          if (!price || price <= 0) { error.textContent = "Enter a price greater than zero."; return; }
          if (oldPrice && oldPrice <= price) { error.textContent = "The compare-at price should be higher than the selling price."; return; }
          if (!sizes.length) { error.textContent = "Add at least one size with stock."; return; }
          if (!colors.length) { error.textContent = "Add at least one colour."; return; }
          if (!/^assets\/|^https?:\/\//.test(imagePath)) { error.textContent = "Use a local assets/ image path or an https URL."; return; }

          const description = get("opDescription") || `${name} from ${brand}, available at ${current?.name || "this shop"} in ${current?.area || "Bengaluru"}.`;
          const fields = {
            name,
            brand,
            category: get("opCategory"),
            type: get("opType"),
            price,
            oldPrice,
            material: get("opMaterial") || "Mixed materials",
            description,
            shortDescription: description.length > 120 ? `${description.slice(0, 117)}…` : description,
            images: [imagePath],
            sizes,
            colors,
            shopId: state.shopId,
            tags: [get("opType"), brand.toLowerCase(), get("opCategory")],
            currency: "INR",
            inStock: sizes.some((size) => size.stock > 0),
            stockTotal: sizes.reduce((sum, size) => sum + size.stock, 0),
            discount: oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0
          };

          if (existing) {
            updateProduct(existing, fields);
            LS.ui.toast({ title: "Product updated", message: `${name} is live on the storefront.`, type: "success" });
          } else {
            addProduct(fields);
            LS.ui.toast({ title: "Product published", message: `${name} is now on ${current?.name || "your shop"}'s shelf.`, type: "success" });
          }
          LS.ui.closeModal();
          render();
        });
      }
    });
  }

  function addProduct(fields) {
    const ov = overlay();
    let id = `${slugify(fields.name)}-${Date.now().toString(36).slice(-4)}`;
    while (LS.data.productById(id)) id = `${slugify(fields.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const product = recalc({
      id,
      name: fields.name,
      brand: fields.brand,
      category: fields.category,
      type: fields.type,
      price: fields.price,
      oldPrice: fields.oldPrice,
      discount: fields.discount,
      currency: "INR",
      colors: fields.colors,
      sizes: fields.sizes,
      rating: 4.8,
      reviewCount: 0,
      shortDescription: fields.shortDescription,
      description: fields.description,
      material: fields.material,
      tags: fields.tags,
      shopId: fields.shopId,
      images: fields.images,
      isNew: true,
      isBestSeller: false,
      releaseDate: new Date().toISOString().slice(0, 10),
      sku: `LS-OWN-${Math.floor(Math.random() * 9000 + 1000)}`,
      reviews: [],
      highlights: [fields.material, "Shop-added listing", "Local stock"],
      offers: []
    });
    ov.custom.unshift(product);
    saveOverlay(ov);
    LS.data.products.unshift(product);
  }

  function updateProduct(existing, fields) {
    const ov = overlay();
    const customIndex = ov.custom.findIndex((product) => product.id === existing.id);
    if (customIndex > -1) {
      const merged = recalc({ ...existing, ...fields, offers: existing.offers || [], reviews: existing.reviews || [] });
      ov.custom[customIndex] = merged;
      saveOverlay(ov);
      const index = LS.data.products.findIndex((product) => product.id === existing.id);
      if (index > -1) LS.data.products[index] = merged;
    } else {
      ov.edits[existing.id] = { ...(ov.edits[existing.id] || {}), ...fields };
      saveOverlay(ov);
      const index = LS.data.products.findIndex((product) => product.id === existing.id);
      if (index > -1) LS.data.products[index] = recalc({ ...existing, ...fields });
    }
  }

  function deleteProduct(id) {
    const product = LS.data.productById(id);
    if (!product) return;
    LS.ui.openModal(`<div class="modal-head">
        <h2>Remove ${esc(product.name)}?</h2>
        <p>It disappears from the storefront immediately. You can reset the demo catalogue to bring the original products back.</p>
      </div>
      <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-outline" type="button" data-close-modal>Keep product</button>
        <button class="btn btn-primary" type="button" id="confirmOwnerDelete">Remove product</button>
      </div>`, {
      className: "modal-sm",
      label: "Remove product",
      onMount: (modal) => {
        modal.querySelector("#confirmOwnerDelete").addEventListener("click", () => {
          const ov = overlay();
          const customIndex = ov.custom.findIndex((item) => item.id === id);
          if (customIndex > -1) ov.custom.splice(customIndex, 1);
          else if (!ov.deleted.includes(id)) ov.deleted.push(id);
          saveOverlay(ov);
          const index = LS.data.products.findIndex((item) => item.id === id);
          if (index > -1) LS.data.products.splice(index, 1);
          LS.compare.remove(id);
          LS.wishlist.remove(id);
          LS.ui.closeModal();
          LS.ui.toast({ title: "Product removed", message: `${product.name} is off the shelf.`, type: "info" });
          render();
        });
      }
    });
  }

  function resetDemo() {
    LS.ui.openModal(`<div class="modal-head">
        <h2>Reset the demo catalogue?</h2>
        <p>Your owner edits, custom products and removals will be cleared. Orders and addresses are not touched.</p>
      </div>
      <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-outline" type="button" data-close-modal>Keep my edits</button>
        <button class="btn btn-primary" type="button" id="confirmOwnerReset">Reset catalogue</button>
      </div>`, {
      className: "modal-sm",
      label: "Reset catalogue",
      onMount: (modal) => {
        modal.querySelector("#confirmOwnerReset").addEventListener("click", () => {
          localStorage.removeItem(OVERLAY_KEY);
          window.location.reload();
        });
      }
    });
  }

  /* ---------- render ---------- */
  function render() {
    const current = shop();
    if (!current) return;
    renderShopSelect();
    renderSidebar();
    const main = byId("ownerMain");
    if (!main) return;
    const panels = { inventory: inventoryPanel, orders: ordersPanel, insights: insightsPanel };
    main.innerHTML = `<div class="account-panel is-active">${panels[state.panel]()}</div>`;
    bindPanel();
  }

  function bindPanel() {
    const main = byId("ownerMain");
    if (!main) return;

    main.querySelectorAll("[data-owner-add]").forEach((button) => button.addEventListener("click", () => productModal()));
    main.querySelectorAll("[data-owner-edit]").forEach((button) => button.addEventListener("click", () => productModal(button.dataset.ownerEdit)));
    main.querySelectorAll("[data-owner-delete]").forEach((button) => button.addEventListener("click", () => deleteProduct(button.dataset.ownerDelete)));
    main.querySelectorAll("[data-owner-order]").forEach((button) => button.addEventListener("click", () => orderModal(button.dataset.ownerOrder)));

    const search = byId("ownerSearch");
    if (search) {
      search.addEventListener("input", () => {
        state.search = search.value;
        const wrap = byId("ownerTableWrap");
        if (wrap) wrap.innerHTML = inventoryTable();
        const count = byId("ownerResultCount");
        const found = filteredProducts().length;
        if (count) count.textContent = `${found} product${found === 1 ? "" : "s"}`;
        bindTableActions();
      });
    }

    const category = byId("ownerCategory");
    if (category) {
      category.addEventListener("change", () => {
        state.category = category.value;
        const wrap = byId("ownerTableWrap");
        if (wrap) wrap.innerHTML = inventoryTable();
        const count = byId("ownerResultCount");
        const found = filteredProducts().length;
        if (count) count.textContent = `${found} product${found === 1 ? "" : "s"}`;
        bindTableActions();
      });
    }
  }

  function bindTableActions() {
    const wrap = byId("ownerTableWrap");
    if (!wrap) return;
    wrap.querySelectorAll("[data-owner-add]").forEach((button) => button.addEventListener("click", () => productModal()));
    wrap.querySelectorAll("[data-owner-edit]").forEach((button) => button.addEventListener("click", () => productModal(button.dataset.ownerEdit)));
    wrap.querySelectorAll("[data-owner-delete]").forEach((button) => button.addEventListener("click", () => deleteProduct(button.dataset.ownerDelete)));
  }

  function switchPanel(panel) {
    if (!["inventory", "orders", "insights"].includes(panel)) return;
    state.panel = panel;
    render();
  }

  function init() {
    if (!LS.data.shops.some((item) => item.id === state.shopId)) state.shopId = LS.data.shops[0]?.id;
    state.shopId = state.shopId || LS.data.shops[0]?.id;
    render();

    byId("ownerShopSelect")?.addEventListener("change", (event) => {
      state.shopId = event.target.value;
      LS.ui.save(SHOP_KEY, state.shopId);
      state.search = "";
      state.category = "all";
      render();
    });

    document.addEventListener("click", (event) => {
      const navItem = event.target.closest("[data-owner-panel]");
      if (navItem) { switchPanel(navItem.dataset.ownerPanel); return; }
      if (event.target.closest("[data-owner-reset]")) resetDemo();
    });

    document.addEventListener("ls:currency", render);
  }

  LS.pages = LS.pages || {};
  LS.pages.owner = init;
})();
