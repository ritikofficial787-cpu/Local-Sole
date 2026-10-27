/* ==========================================================================
   Local Sole — wishlist.js
   Saved pairs grid with sorting, quick add and a recently-viewed rail.
   ========================================================================== */

window.LS = window.LS || {};

(() => {
  let sort = "recent";

  const esc = (value) => LS.ui.escapeHtml(String(value ?? ""));
  const grid = () => document.getElementById("wishlistGrid");
  const empty = () => document.getElementById("wishlistEmpty");
  const countEl = () => document.getElementById("wishlistCount");

  function sorted(items) {
    const list = items.slice();
    switch (sort) {
      case "price-asc": return list.sort((a, b) => a.price - b.price);
      case "price-desc": return list.sort((a, b) => b.price - a.price);
      case "rating": return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      default: return list.sort((a, b) => LS.wishlist.items.indexOf(a.id) - LS.wishlist.items.indexOf(b.id));
    }
  }

  function actions(product) {
    const soldOut = !product.sizes.some((size) => size.stock > 0);
    return `<div class="wishlist-actions">
      <button class="btn btn-dark btn-sm" type="button" data-wish-add="${esc(product.id)}" ${soldOut ? "disabled" : ""}>
        ${LS.ui.icon("bag", 15)} ${soldOut ? "Sold out" : "Add to bag"}
      </button>
      <button class="btn btn-outline btn-sm" type="button" data-wish-remove="${esc(product.id)}">Remove</button>
    </div>`;
  }

  function emptyState() {
    return `<div class="empty-state">
      <div class="confirmation-icon" style="background:var(--bg-sunken);color:var(--ink-3)">${LS.ui.icon("heart", 30)}</div>
      <h2>Nothing saved yet.</h2>
      <p>Tap the heart on any pair and it will wait here — across all eight shops, on this device.</p>
      <div class="row" style="justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary" href="products.html">Browse the edit</a>
        <a class="btn btn-outline" href="shops.html">Meet the shops</a>
      </div>
    </div>`;
  }

  function renderSuggestions() {
    const mount = document.getElementById("wishlistRecent");
    if (!mount) return;
    let picks = LS.recent.list().filter((p) => !LS.wishlist.has(p.id)).slice(0, 4);
    if (picks.length < 4) {
      LS.data.products
        .filter((p) => (p.isBestSeller || p.isNew) && !picks.some((x) => x.id === p.id))
        .slice(0, 4 - picks.length)
        .forEach((p) => picks.push(p));
    }
    mount.innerHTML = picks.map((product) => LS.ui.productCard(product)).join("");
  }

  function render() {
    const mount = grid();
    const emptyMount = empty();
    if (!mount || !emptyMount) return;

    const items = sorted(LS.wishlist.list());
    const shops = new Set(items.map((p) => p.shopId));
    const clear = document.getElementById("clearWishlist");
    const sortWrap = document.getElementById("wishlistSort");

    if (countEl()) {
      countEl().textContent = items.length
        ? `${items.length} pair${items.length === 1 ? "" : "s"} saved · ${shops.size} shop${shops.size === 1 ? "" : "s"}`
        : "No pairs saved yet";
    }
    if (clear) clear.hidden = !items.length;
    if (sortWrap) sortWrap.disabled = !items.length;

    if (!items.length) {
      mount.innerHTML = "";
      emptyMount.innerHTML = emptyState();
      renderSuggestions();
      return;
    }

    emptyMount.innerHTML = "";
    mount.innerHTML = items.map((product) => {
      return LS.ui.productCard(product).replace("</article>", `${actions(product)}</article>`);
    }).join("");
    renderSuggestions();
    LS.animations?.observeReveals?.();
  }

  function confirmClear() {
    LS.ui.openModal(`<div class="modal-head">
        <h2>Clear your wishlist?</h2>
        <p>This removes all ${LS.wishlist.items.length} saved pair${LS.wishlist.items.length === 1 ? "" : "s"} from this device. You can always save them again.</p>
      </div>
      <div class="row mt-4" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-outline" type="button" data-close-modal>Keep them</button>
        <button class="btn btn-primary" type="button" id="confirmClearWishlist">Clear wishlist</button>
      </div>`, {
      className: "modal-sm",
      label: "Clear wishlist",
      onMount: (modal) => {
        modal.querySelector("#confirmClearWishlist").addEventListener("click", () => {
          LS.wishlist.clear();
          LS.ui.closeModal();
          LS.ui.toast({ title: "Wishlist cleared", message: "A fresh start. Browse whenever you're ready.", type: "info" });
        });
      }
    });
  }

  function init() {
    render();

    document.getElementById("wishlistSort")?.addEventListener("change", (event) => {
      sort = event.target.value;
      render();
    });

    document.getElementById("clearWishlist")?.addEventListener("click", confirmClear);

    document.addEventListener("click", (event) => {
      const add = event.target.closest("[data-wish-add]");
      if (add) {
        LS.ui.openQuickAdd(add.dataset.wishAdd);
        return;
      }
      const remove = event.target.closest("[data-wish-remove]");
      if (remove) {
        const product = LS.data.productById(remove.dataset.wishRemove);
        LS.wishlist.remove(remove.dataset.wishRemove);
        LS.ui.toast({
          title: "Removed from wishlist",
          message: product ? esc(product.name) : "Pair removed",
          type: "info",
          action: { label: "Undo", href: "#undo-wishlist" }
        });
        setTimeout(() => {
          const link = document.querySelector('.toast a[href="#undo-wishlist"]');
          if (link) link.addEventListener("click", (clickEvent) => {
            clickEvent.preventDefault();
            LS.wishlist.toggle(remove.dataset.wishRemove);
          }, { once: true });
        }, 30);
      }
    });

    document.addEventListener("ls:wishlist", render);
    document.addEventListener("ls:currency", render);
  }

  LS.wishlistPage = { render };

  LS.pages = LS.pages || {};
  LS.pages.wishlist = init;
})();
