/* ==========================================================================
   Local Sole — app.js
   Boot sequence + page registry. Every page module registers itself on
   LS.pages before this file runs; app.js renders shared chrome and starts it.
   ========================================================================== */

window.LS = window.LS || {};
LS.pages = LS.pages || {};

(() => {
  const page = document.body.dataset.page || "home";

  function showLoadError() {
    const main = document.querySelector("main");
    if (!main) return;
    main.innerHTML = `<div class="container section">
      <div class="empty-state">
        <h2>We couldn't load the shoe rack.</h2>
        <p>Check that <code>data/products.json</code> and <code>data/seed.js</code> are present, then refresh. If you opened this file directly, the bundled fallback should still work.</p>
        <a class="btn btn-primary" href="index.html">Try again</a>
      </div>
    </div>`;
  }

  function initBrokenImages() {
    document.addEventListener("error", (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement)) return;
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = "true";
      img.src = "assets/images/icons/placeholder.svg";
      img.classList.add("img-fallback");
    }, true);
  }

  function initServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        /* Offline support is optional; never break the page for it. */
      });
    });
  }

  function markCurrentLinks() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-footer a, .mobile-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href === current) {
        link.setAttribute("aria-current", "page");
        link.classList.add("is-active");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await LS.data.ready;
    } catch (error) {
      console.error(error);
    }

    if (!LS.data.products.length) {
      showLoadError();
      return;
    }

    LS.ui.renderChrome();
    LS.cart.init();
    // Hydrate icon placeholders used in static page markup.
    document.querySelectorAll("[data-icon]").forEach((el) => {
      el.innerHTML = LS.ui.icon(el.dataset.icon, Number(el.dataset.size || 20));
      el.classList.add("ico");
    });
    LS.wishlist.syncAll();
    LS.compare.syncButtons();
    LS.compare.renderTray();
    LS.search.init();
    LS.animations.init();
    initBrokenImages();
    markCurrentLinks();

    const start = LS.pages[page];
    if (typeof start === "function") {
      try {
        start();
      } catch (error) {
        console.error(`Page init failed (${page}):`, error);
      }
    }

    // Let the browser paint the shell before marking interactive.
    requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));

    // A single place to keep dynamic pages in sync with the currency switcher.
    document.addEventListener("ls:currency", () => {
      if (page === "checkout") LS.checkout?.renderSummary?.();
      if (page === "confirmation") LS.checkout?.renderConfirmation?.();
      if (page === "wishlist") LS.wishlistPage?.render?.();
      if (page === "account") LS.accountPage?.render?.();
      if (page === "compare") LS.comparePage?.render?.();
      if (page === "product") LS.productPage?.renderPrice?.();
      if (page === "shop") LS.shopPage?.render?.();
    });

    initServiceWorker();
  });
})();
