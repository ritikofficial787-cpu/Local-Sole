/* ==========================================================================
   Local Sole — compare.js
   Side-by-side comparison for up to three pairs: price at every shop,
   stock, colours, materials and pickup. Uses LS.data.priceOffers.
   ========================================================================== */

window.LS = window.LS || {};

(() => {
  const esc = (value) => LS.ui.escapeHtml(String(value ?? ""));
  const money = (amount) => LS.ui.money.fmt(Number(amount) || 0);
  const mount = () => document.getElementById("compareMount");

  function products() {
    return LS.compare.items.map((id) => LS.data.productById(id)).filter(Boolean);
  }

  function offersHtml(product) {
    const offers = LS.data.priceOffers(product);
    if (!offers.length) return `<span class="tiny muted">No live offers</span>`;
    return `<div class="compare-offers">
      <h3>${LS.ui.icon("tag", 12)} Price at each shop</h3>
      <ul>
        ${offers.map((offer) => `<li class="${offer.own ? "is-own" : ""}">
          <span>${esc(offer.shop.shortName || offer.shop.name)}${offer.own ? " · this pair" : ""}</span>
          <strong>${money(offer.price)}</strong>
        </li>`).join("")}
      </ul>
      ${offers.length > 1 ? `<p class="tiny muted">Save up to ${money(offers[offers.length - 1].price - offers[0].price)} by choosing the lowest offer.</p>` : `<p class="tiny muted">Only one shop stocks this pair right now.</p>`}
    </div>`;
  }

  function priceCell(product) {
    const offers = LS.data.priceOffers(product);
    const lowest = offers[0];
    return `<div class="price">
      <span class="price-current">${money(product.price)}</span>
      ${product.oldPrice ? `<span class="price-old">${money(product.oldPrice)}</span>` : ""}
      ${lowest && lowest.price < product.price ? `<span class="compare-best">Lowest ${money(lowest.price)} at ${esc(lowest.shop.shortName)}</span>` : `<span class="compare-best">Best price here</span>`}
    </div>`;
  }

  function sizesCell(product) {
    return `<div class="row wrap" style="gap:5px">
      ${product.sizes.map((size) => `<span class="badge ${size.stock > 0 ? "badge-soft" : ""}" style="${size.stock > 0 ? "" : "opacity:.42;text-decoration:line-through"}" title="${size.stock > 0 ? `${size.stock} in stock` : "Out of stock"}">UK ${esc(size.size)}</span>`).join("")}
    </div>`;
  }

  function coloursCell(product) {
    return `<div class="row wrap" style="gap:8px">
      ${(product.colors || []).map((color) => `<span class="row" style="gap:5px;font-size:.72rem"><span style="width:14px;height:14px;border-radius:50%;background:${esc(color.hex)};border:1px solid var(--line-strong);display:inline-block"></span>${esc(color.name)}</span>`).join("")}
    </div>`;
  }

  function pickupCell(product) {
    const shop = LS.data.shopById(product.shopId);
    if (!shop) return `<span class="muted">—</span>`;
    return `<div class="stack" style="display:flex;flex-direction:column;gap:4px">
      <span>${shop.pickup.available ? `${LS.ui.icon("store", 12)} Pickup in ${Number(shop.pickup.readyIn || 45)} min` : "Delivery only"}</span>
      <span class="tiny muted">${LS.ui.icon("truck", 12)} ${esc(shop.delivery.eta)} · ${shop.delivery.fee ? money(shop.delivery.fee) : "Free"}</span>
    </div>`;
  }

  function tableHtml(items) {
    const emptySlots = Math.max(0, 3 - items.length);
    return `<div class="compare-scroll">
      <table class="compare-table">
        <caption class="sr-only">Comparison of ${items.length} shoe${items.length === 1 ? "" : "s"}</caption>
        <thead>
          <tr>
            <th scope="col">Compare</th>
            ${items.map((product) => `<th scope="col">
              <div class="compare-product-head">
                <a href="product.html?id=${encodeURIComponent(product.id)}"><img src="${esc(product.images[0])}" alt="${esc(product.name)}" width="240" height="240" loading="lazy"></a>
                <strong><a href="product.html?id=${encodeURIComponent(product.id)}">${esc(product.name)}</a></strong>
                <span class="tiny muted">${esc(product.brand)} · ${esc(product.type)}</span>
                <button type="button" data-compare-remove="${esc(product.id)}">Remove</button>
              </div>
            </th>`).join("")}
            ${Array.from({ length: emptySlots }).map(() => `<th scope="col"><span class="sr-only">Empty comparison slot</span></th>`).join("")}
          </tr>
        </thead>
        <tbody>
          <tr><th scope="row">Price</th>${items.map((p) => `<td>${priceCell(p)}</td>`).join("")}${emptySlots ? `<td><a class="compare-add-slot" href="products.html">${LS.ui.icon("plus", 20)}<span>Add another pair</span></a></td>` : ""}</tr>
          <tr><th scope="row">Where to buy</th>${items.map((p) => `<td>${offersHtml(p)}</td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Rating</th>${items.map((p) => `<td>${LS.ui.stars(p.rating, p.reviewCount, { small: true })}</td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Sizes in stock</th>${items.map((p) => `<td>${sizesCell(p)}</td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Colours</th>${items.map((p) => `<td>${coloursCell(p)}</td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Best for</th>${items.map((p) => `<td>${esc(p.category)} · ${esc(p.type)}</td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Material</th>${items.map((p) => `<td>${esc(p.material)}</td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Shop</th>${items.map((p) => {
            const shop = LS.data.shopById(p.shopId);
            return `<td>${shop ? `<a class="link-underline" href="shop.html?id=${encodeURIComponent(shop.id)}">${esc(shop.name)}</a><br><span class="tiny muted">${esc(shop.area)}</span>` : "—"}</td>`;
          }).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Pickup &amp; delivery</th>${items.map((p) => `<td>${pickupCell(p)}</td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
          <tr><th scope="row">Decide</th>${items.map((p) => `<td>
            <div class="row wrap">
              <button class="btn btn-dark btn-sm" type="button" data-compare-add="${esc(p.id)}">${LS.ui.icon("bag", 14)} Add to bag</button>
              <a class="btn btn-outline btn-sm" href="product.html?id=${encodeURIComponent(p.id)}">Details</a>
            </div>
          </td>`).join("")}${emptySlots ? "<td></td>" : ""}</tr>
        </tbody>
      </table>
    </div>`;
  }

  function emptyState() {
    return `<div class="empty-state">
      <div class="confirmation-icon" style="background:var(--bg-sunken);color:var(--ink-3)">${LS.ui.icon("columns", 30)}</div>
      <h2>Nothing to compare yet.</h2>
      <p>Add up to three pairs from the catalogue using the compare icon on any product card. We'll show price, fit and pickup side by side.</p>
      <div class="row" style="justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary" href="products.html">Browse shoes</a>
        <a class="btn btn-outline" href="shops.html">Meet the shops</a>
      </div>
    </div>`;
  }

  function suggestions() {
    const current = new Set(LS.compare.items);
    const picks = LS.data.products
      .filter((p) => !current.has(p.id))
      .sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.rating - a.rating)
      .slice(0, 4);
    const target = document.getElementById("compareSuggestions");
    if (target) target.innerHTML = picks.map((p) => LS.ui.productCard(p)).join("");
  }

  function render() {
    const target = mount();
    if (!target) return;
    const items = products();
    const count = document.getElementById("compareCount");
    const clear = document.getElementById("clearCompare");
    if (count) count.textContent = items.length ? `${items.length} of 3 pairs selected` : "No pairs selected";
    if (clear) clear.hidden = !items.length;
    target.innerHTML = items.length ? tableHtml(items) : emptyState();
    suggestions();
  }

  function bind() {
    document.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-compare-remove]");
      if (remove) {
        LS.compare.remove(remove.dataset.compareRemove);
        return;
      }
      const add = event.target.closest("[data-compare-add]");
      if (add) {
        LS.ui.openQuickAdd(add.dataset.compareAdd);
      }
    });

    document.getElementById("clearCompare")?.addEventListener("click", () => {
      const count = LS.compare.items.length;
      LS.compare.clear();
      render();
      LS.ui.toast({ title: "Comparison cleared", message: `${count} pair${count === 1 ? "" : "s"} removed.`, type: "info" });
    });

    document.addEventListener("ls:compare", render);
    document.addEventListener("ls:currency", render);
  }

  function init() {
    render();
    bind();
  }

  LS.comparePage = { render };

  LS.pages = LS.pages || {};
  LS.pages.compare = init;
})();
