/* ==========================================================================
   Local Sole — shops.js
   Shop directory (search, open-now, area fallback, geolocation, distance)
   and individual shop profiles (hours, map, stock, contact, nearby shops).
   ========================================================================== */

LS.pages = LS.pages || {};

(function shopModules() {
  const data = LS.data;
  const ui = LS.ui;
  const LOCATION_KEY = "ls_location_v1";
  const AREA_KEY = "ls_area_v1";

  function formatDistance(km) {
    if (km === null || km === undefined) return "";
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }

  function directionsUrl(shop) {
    return `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;
  }

  function readLocation() {
    const saved = ui.store(LOCATION_KEY, null);
    if (!saved || typeof saved.lat !== "number" || typeof saved.lng !== "number") return null;
    return saved;
  }

  function saveLocation(location) {
    ui.save(LOCATION_KEY, location);
  }

  function areaCoords(area) {
    const shops = data.shops.filter((s) => s.area === area);
    const list = shops.length ? shops : data.shops;
    return {
      lat: list.reduce((sum, s) => sum + s.lat, 0) / list.length,
      lng: list.reduce((sum, s) => sum + s.lng, 0) / list.length,
      label: area,
      manual: true
    };
  }

  /* ======================================================================
     Directory
     ====================================================================== */
  LS.pages.shops = function initShopsDirectory() {
    const params = new URLSearchParams(location.search);
    const state = {
      q: params.get("q") || "",
      area: params.get("area") || "",
      open: params.get("open") === "1",
      sort: params.get("sort") || "recommended",
      location: readLocation()
    };

    const areas = data.areas();
    const areaSelect = document.getElementById("areaSelect");
    const searchInput = document.getElementById("shopSearch");
    const openInput = document.getElementById("openNowFilter");
    const sortSelect = document.getElementById("shopSort");
    const list = document.getElementById("shopsList");
    const count = document.getElementById("shopCount");

    if (areaSelect) {
      areaSelect.innerHTML = `<option value="">All neighbourhoods</option>${areas.map((area) =>
        `<option value="${ui.escapeHtml(area)}" ${area === state.area ? "selected" : ""}>${ui.escapeHtml(area)}</option>`).join("")}`;
    }
    if (searchInput) searchInput.value = state.q;
    if (openInput) openInput.checked = state.open;
    if (sortSelect) sortSelect.value = state.sort;

    function writeUrl() {
      const next = new URLSearchParams();
      if (state.q) next.set("q", state.q);
      if (state.area) next.set("area", state.area);
      if (state.open) next.set("open", "1");
      if (state.sort !== "recommended") next.set("sort", state.sort);
      history.replaceState(null, "", `${location.pathname}${next.toString() ? `?${next}` : ""}`);
    }

    function withDistance(shop) {
      if (!state.location) return null;
      return data.shopDistance(shop, state.location);
    }

    function filteredShops() {
      let shops = [...data.shops];
      if (state.area) shops = shops.filter((shop) => shop.area === state.area);
      if (state.open) shops = shops.filter((shop) => data.openState(shop).open);
      if (state.q) {
        const needle = state.q.toLowerCase();
        shops = shops.filter((shop) => {
          const haystack = [shop.name, shop.area, shop.tagline, shop.description, ...(shop.specialties || [])].join(" ").toLowerCase();
          return haystack.includes(needle);
        });
      }
      const scored = shops.map((shop) => ({ shop, distance: withDistance(shop) }));
      switch (state.sort) {
        case "nearby":
          scored.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
          break;
        case "rating":
          scored.sort((a, b) => b.shop.rating - a.shop.rating || b.shop.reviewCount - a.shop.reviewCount);
          break;
        case "since":
          scored.sort((a, b) => a.shop.since - b.shop.since);
          break;
        default:
          scored.sort((a, b) => {
            const aOpen = data.openState(a.shop).open ? 1 : 0;
            const bOpen = data.openState(b.shop).open ? 1 : 0;
            return bOpen - aOpen || b.shop.rating - a.shop.rating;
          });
      }
      return scored;
    }

    function cardHtml(shop, distance) {
      const status = data.openState(shop);
      const products = data.productsByShop(shop.id);
      const productCount = products.length;
      const priceFrom = products.length ? Math.min(...products.map((p) => p.price)) : 0;
      return `<article class="shop-wide">
        <div class="shop-wide-media">
          <a href="shop.html?id=${encodeURIComponent(shop.id)}" aria-label="Visit ${ui.escapeHtml(shop.name)}">
            <img src="${ui.escapeHtml(shop.banner)}" alt="${ui.escapeHtml(shop.name)} storefront in ${ui.escapeHtml(shop.area)}" width="520" height="420" loading="lazy" decoding="async">
          </a>
          ${status.open ? '<span class="badge badge-pickup" style="position:absolute;top:10px;left:10px"><span class="status-dot"></span> Open now</span>' : '<span class="badge badge-soft" style="position:absolute;top:10px;left:10px">Closed</span>'}
          ${distance !== null ? `<span class="shop-card-distance">${formatDistance(distance)}</span>` : ""}
        </div>
        <div class="shop-wide-body">
          <div class="shop-wide-head">
            <img src="${ui.escapeHtml(shop.logo)}" alt="" width="36" height="36">
            <div>
              <h3><a href="shop.html?id=${encodeURIComponent(shop.id)}">${ui.escapeHtml(shop.name)}</a></h3>
              <span class="shop-card-area">${ui.icon("pin", 10)} ${ui.escapeHtml(shop.area)}, ${ui.escapeHtml(shop.city)}</span>
            </div>
          </div>
          <div class="shop-card-meta">
            ${ui.stars(shop.rating, shop.reviewCount, { small: true })}
            <span aria-hidden="true">·</span>
            <span>${productCount} styles</span>
          </div>
          <p>${ui.escapeHtml(shop.tagline)}. ${ui.escapeHtml(shop.description)}</p>
          <div class="shop-tags">${(shop.specialties || []).map((tag) => `<span>${ui.escapeHtml(tag)}</span>`).join("")}</div>
          <div class="shop-wide-foot">
            <span>${ui.icon("store", 12)} ${shop.pickup.available ? `Pickup in ${shop.pickup.readyIn} min` : "Delivery only"} · from ${ui.money.fmt(priceFrom)}</span>
            <a class="link-underline" href="shop.html?id=${encodeURIComponent(shop.id)}">Visit shop ${ui.icon("arrowRight", 12)}</a>
          </div>
        </div>
      </article>`;
    }

    function render() {
      if (!list) return;
      const shops = filteredShops();
      const openCount = data.shops.filter((shop) => data.openState(shop).open).length;
      list.setAttribute("aria-busy", "false");
      if (count) {
        count.innerHTML = shops.length
          ? `<strong>${shops.length}</strong> shop${shops.length === 1 ? "" : "s"} · ${openCount} open right now${state.location ? ` · sorted ${state.sort === "nearby" ? "by distance" : "for you"}` : ""}`
          : "No shops match that search";
      }
      if (!shops.length) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
          <span class="eyebrow no-rule">No door with that name</span>
          <h2>No shops match those filters.</h2>
          <p>Try another neighbourhood, clear the open-now filter, or search for a specialty like “running” or “leather”.</p>
          <button class="btn btn-primary" type="button" data-clear-shops>Show all eight shops</button>
        </div>`;
        return;
      }
      list.innerHTML = shops.map(({ shop, distance }) => cardHtml(shop, distance)).join("");
      list.querySelectorAll(".shop-wide").forEach((card, index) => {
        card.style.animationDelay = `${Math.min(index * 40, 240)}ms`;
        card.classList.add("fade-up");
      });
      document.dispatchEvent(new CustomEvent("ls:content"));
    }

    function updateLocationUi() {
      const confirm = document.getElementById("locationConfirm");
      const title = document.getElementById("nearbyTitle");
      const text = document.getElementById("nearbyText");
      if (!state.location) return;
      if (confirm) {
        confirm.hidden = false;
        confirm.innerHTML = `${ui.icon("check", 12)} ${state.location.manual ? `Distances estimated from ${ui.escapeHtml(state.location.label || "your area")}` : "Using your current location"} · ${state.location.lat.toFixed(3)}, ${state.location.lng.toFixed(3)}`;
      }
      if (title) title.textContent = state.location.manual ? `Near ${state.location.label}` : "Shops near you";
      if (text) {
        text.textContent = state.location.manual
          ? `Showing walking-ish distances from the centre of ${state.location.label}. Choose another area above for a different view.`
          : "Sorted by straight-line distance from where you're standing. Opening hours are in IST.";
      }
      if (sortSelect) sortSelect.value = state.sort;
    }

    function locate() {
      const btn = document.getElementById("locateBtn");
      if (!navigator.geolocation) {
        fallbackToArea("Location isn't available in this browser. Pick your neighbourhood instead.");
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "Finding you…"; }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: "Current location",
            manual: false
          };
          saveLocation(state.location);
          state.sort = "nearby";
          if (sortSelect) sortSelect.value = "nearby";
          if (btn) { btn.disabled = false; btn.innerHTML = `${ui.icon("check", 14)} Location found`; }
          updateLocationUi();
          render();
          writeUrl();
          ui.toast({ title: "Location found", message: "Shops are now sorted by distance from you.", type: "success" });
        },
        (error) => {
          if (btn) { btn.disabled = false; btn.innerHTML = `${ui.icon("pin", 14)} Use my location`; }
          const message = error.code === error.PERMISSION_DENIED
            ? "Location permission was declined. Pick your neighbourhood instead."
            : "We couldn't get a location fix. Choose your neighbourhood instead.";
          fallbackToArea(message);
        },
        { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
      );
    }

    function fallbackToArea(message) {
      ui.toast({ title: "Choose an area", message, type: "info", duration: 6000 });
      if (areaSelect) {
        areaSelect.focus();
        areaSelect.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    function manualArea(area) {
      state.area = area;
      if (area) {
        state.location = areaCoords(area);
        saveLocation(state.location);
        ui.save(AREA_KEY, area);
        state.sort = "nearby";
        if (sortSelect) sortSelect.value = "nearby";
      } else {
        state.location = null;
        state.sort = "recommended";
        if (sortSelect) sortSelect.value = "recommended";
      }
      updateLocationUi();
      render();
      writeUrl();
    }

    function clearAll() {
      state.q = "";
      state.area = "";
      state.open = false;
      state.sort = "recommended";
      if (searchInput) searchInput.value = "";
      if (areaSelect) areaSelect.value = "";
      if (openInput) openInput.checked = false;
      if (sortSelect) sortSelect.value = "recommended";
      render();
      writeUrl();
    }

    searchInput?.addEventListener("input", ui.debounce(() => {
      state.q = searchInput.value.trim();
      render();
      writeUrl();
    }, 180));

    areaSelect?.addEventListener("change", () => manualArea(areaSelect.value));
    openInput?.addEventListener("change", () => {
      state.open = openInput.checked;
      render();
      writeUrl();
    });
    sortSelect?.addEventListener("change", () => {
      if (sortSelect.value === "nearby" && !state.location) {
        ui.toast({ title: "Location needed", message: "Use your location or choose a neighbourhood to sort by distance.", type: "info" });
        sortSelect.value = state.sort;
        return;
      }
      state.sort = sortSelect.value;
      render();
      writeUrl();
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-locate]")) {
        locate();
        return;
      }
      if (event.target.closest("[data-clear-shops]")) {
        clearAll();
      }
    });

    if (state.location) {
      updateLocationUi();
      if (state.sort === "recommended") {
        state.sort = "nearby";
        if (sortSelect) sortSelect.value = "nearby";
      }
    }
    render();
  };

  /* ======================================================================
     Shop profile
     ====================================================================== */
  let shopPageState = null;

  LS.pages.shop = function initShopProfile() {
    const id = new URLSearchParams(location.search).get("id");
    const shop = data.shopById(id) || data.shops[0];
    if (!shop) {
      renderMissing();
      return;
    }
    const products = data.productsByShop(shop.id);
    const status = data.openState(shop);
    let productFilter = "all";

    shopPageState = { shop, products };

    document.title = `${shop.name} — ${shop.area}, Bengaluru | Local Sole`;
    const description = `${shop.name}, ${shop.area}: ${shop.tagline}. ${products.length} styles, pickup in ${shop.pickup.readyIn} minutes.`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${shop.name} — Local Sole`);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", new URL(shop.banner, location.origin).href);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://localsole.in/shop.html?id=${encodeURIComponent(shop.id)}`);

    const crumbs = document.querySelector(".breadcrumbs");
    if (crumbs) {
      crumbs.innerHTML = `<a href="index.html">Home</a> ${ui.icon("chevronRight", 12)} <a href="shops.html">Local shops</a> ${ui.icon("chevronRight", 12)} <span aria-current="page">${ui.escapeHtml(shop.name)}</span>`;
    }

    const banner = document.getElementById("shopBanner");
    if (banner) {
      banner.innerHTML = `<img src="${ui.escapeHtml(shop.banner)}" alt="${ui.escapeHtml(shop.name)} storefront in ${ui.escapeHtml(shop.area)}" width="1400" height="560" fetchpriority="high">
        <span class="shop-banner-label">${ui.icon("pin", 15)} ${ui.escapeHtml(shop.area)}, ${ui.escapeHtml(shop.city)} <span class="badge ${status.open ? "badge-pickup" : "badge-soft"}">${status.open ? "Open now" : "Closed"}</span></span>`;
    }

    renderProfile();
    renderInfo();
    renderProducts();
    renderNearby();
    writeJsonLd();
    document.dispatchEvent(new CustomEvent("ls:content"));

    function renderProfile() {
      const mount = document.getElementById("shopProfile");
      if (!mount) return;
      const open = data.openState(shop);
      mount.innerHTML = `
        <div class="shop-profile-main">
          <div class="shop-profile-head">
            <img src="${ui.escapeHtml(shop.logo)}" alt="${ui.escapeHtml(shop.name)} logo" width="64" height="64">
            <div>
              <span class="eyebrow no-rule">Independent since ${shop.since}</span>
              <h1>${ui.escapeHtml(shop.name)}</h1>
              <span class="shop-card-area">${ui.icon("pin", 11)} ${ui.escapeHtml(shop.address)}, ${ui.escapeHtml(shop.city)} ${ui.escapeHtml(shop.pincode)}</span>
            </div>
          </div>
          <div class="shop-profile-meta">
            ${ui.stars(shop.rating, shop.reviewCount)}
            <span aria-hidden="true">·</span>
            <span>${products.length} styles in stock</span>
            <span aria-hidden="true">·</span>
            <span class="open-status ${open.open ? "" : "closed"}"><span class="status-dot ${open.open ? "" : "closed"}"></span>${ui.escapeHtml(open.label)}</span>
            ${shop.accessibility ? `<span class="badge badge-soft">Step-free entry</span>` : ""}
          </div>
          <p class="shop-profile-desc">${ui.escapeHtml(shop.description)}</p>
          <div class="shop-tags" style="margin-top:14px">${(shop.specialties || []).map((tag) => `<span>${ui.escapeHtml(tag)}</span>`).join("")}</div>
          <div class="shop-profile-actions">
            <a class="btn btn-dark" href="${directionsUrl(shop)}" target="_blank" rel="noopener">${ui.icon("pin", 15)} Get directions</a>
            <a class="btn btn-outline" href="tel:${shop.phone.replace(/\s/g, "")}">${ui.icon("phone", 15)} Call the shop</a>
            <a class="btn btn-ghost" href="contact.html?shop=${encodeURIComponent(shop.id)}">${ui.icon("mail", 15)} Message</a>
          </div>
          <div class="pdp-confidence" style="margin-top:14px">
            <span>${ui.icon("store", 13)} Real stock on the shelf</span>
            <span>${ui.icon("ruler", 13)} Free fit checks</span>
            <span>${ui.icon("refresh", 13)} 30-day exchanges</span>
            <span>${ui.icon("shield", 13)} Genuine pairs only</span>
          </div>
        </div>`;
    }

    function renderInfo() {
      const mount = document.getElementById("shopInfo");
      if (!mount) return;
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const today = data.DAY_KEYS[data.istNow().getDay()];
      const todayHours = shop.hours[today];
      mount.innerHTML = `
        <div class="shop-info-card">
          <h2>Opening hours <span class="badge ${status.open ? "badge-pickup" : "badge-soft"}">${status.open ? "Open" : "Closed"}</span></h2>
          <div class="hours-list">
            ${days.map((day) => {
              const hours = shop.hours[day];
              return `<div class="hours-row ${day === today ? "is-today" : ""}">
                <span>${data.DAY_LABELS[day]}</span>
                <span class="${hours ? "" : "closed"}">${hours ? `${data.to12Hour(hours[0])} – ${data.to12Hour(hours[1])}` : "Closed"}</span>
              </div>`;
            }).join("")}
          </div>
          <div class="map-card" role="img" aria-label="Map placeholder showing ${ui.escapeHtml(shop.name)} in ${ui.escapeHtml(shop.area)}">
            <span class="map-pin">${ui.icon("pin", 42)}</span>
            <span class="map-label">${ui.escapeHtml(shop.area)} · ${ui.escapeHtml(shop.pincode)}</span>
          </div>
          <div class="shop-info-list">
            <div>${ui.icon("pin", 15)}<span>${ui.escapeHtml(shop.address)}, ${ui.escapeHtml(shop.city)} ${ui.escapeHtml(shop.pincode)}<br><a href="${directionsUrl(shop)}" target="_blank" rel="noopener">Open in Maps →</a></span></div>
            <div>${ui.icon("phone", 15)}<a href="tel:${shop.phone.replace(/\s/g, "")}">${ui.escapeHtml(shop.phone)}</a></div>
            <div>${ui.icon("mail", 15)}<a href="mailto:${shop.email}">${ui.escapeHtml(shop.email)}</a></div>
            <div>${ui.icon("store", 15)}<span>Pickup ${shop.pickup.available ? `available · ready in ${shop.pickup.readyIn} min` : "not available"}${shop.pickup.discount ? ` · ${shop.pickup.discount}% pickup saving` : ""}</span></div>
            <div>${ui.icon("truck", 15)}<span>${shop.delivery.eta} delivery · ${ui.money.fmt(shop.delivery.fee)} · free over ${ui.money.fmt(shop.delivery.freeOver)}</span></div>
            <div>${ui.icon("creditCard", 15)}<span>${shop.paymentMethods.join(" · ")}</span></div>
            <div>${ui.icon("info", 15)}<span>${ui.escapeHtml(shop.parking)}${shop.accessibility ? " · step-free entry" : ""}</span></div>
          </div>
          <div class="row mt-4" style="flex-wrap:wrap">
            <a class="btn btn-primary btn-sm" href="#shopStock">Shop ${products.length} styles</a>
            <a class="btn btn-outline btn-sm" href="contact.html?shop=${encodeURIComponent(shop.id)}">Ask a question</a>
          </div>
        </div>`;
    }

    function renderProducts() {
      const mount = document.getElementById("shopProducts");
      if (!mount) return;
      const types = [...new Set(products.map((p) => p.type))];
      const shown = productFilter === "all" ? products : products.filter((p) => p.type === productFilter);
      mount.innerHTML = `
        <div class="shop-products-head" id="shopStock">
          <div>
            <span class="eyebrow">On the shelf</span>
            <h2>${productFilter === "all" ? "The full rack" : capitalise(productFilter)}<span class="text-accent">.</span></h2>
          </div>
          <a class="link-underline small" href="products.html?shop=${encodeURIComponent(shop.id)}">See in catalogue ${ui.icon("arrowRight", 13)}</a>
        </div>
        <div class="chip-row" style="margin-bottom:18px" role="group" aria-label="Filter shop stock">
          <button class="chip ${productFilter === "all" ? "is-active" : ""}" type="button" data-shop-type="all" aria-pressed="${productFilter === "all"}">All ${products.length}</button>
          ${types.map((type) => `<button class="chip ${productFilter === type ? "is-active" : ""}" type="button" data-shop-type="${type}" aria-pressed="${productFilter === type}">${capitalise(type)} ${products.filter((p) => p.type === type).length}</button>`).join("")}
        </div>
        ${shown.length
          ? `<div class="product-grid" id="shopProductGrid">${shown.map((product) => ui.productCard(product)).join("")}</div>`
          : `<div class="empty-state"><h3>Nothing in this category right now.</h3><p>The shop may have just sold out. Try another category or call them.</p></div>`}`;
      mount.querySelectorAll("[data-shop-type]").forEach((btn) => {
        btn.addEventListener("click", () => {
          productFilter = btn.dataset.shopType;
          renderProducts();
        });
      });
    }

    function renderNearby() {
      const mount = document.getElementById("nearbyShops");
      if (!mount) return;
      const location = readLocation();
      let nearby;
      if (location) {
        nearby = data.nearbyShops(location, 4).filter((item) => item.shop.id !== shop.id).slice(0, 3);
      } else {
        nearby = data.shops
          .filter((s) => s.id !== shop.id && s.area === shop.area)
          .slice(0, 3)
          .map((s) => ({ shop: s, distance: null }));
        if (nearby.length < 3) {
          data.shops.filter((s) => s.id !== shop.id && s.area !== shop.area)
            .sort((a, b) => data.haversineKm(shop.lat, shop.lng, a.lat, a.lng) - data.haversineKm(shop.lat, shop.lng, b.lat, b.lng))
            .slice(0, 3 - nearby.length)
            .forEach((s) => nearby.push({ shop: s, distance: data.haversineKm(shop.lat, shop.lng, s.lat, s.lng) }));
        }
      }
      mount.innerHTML = `
        <div class="container">
          <div class="shop-products-head">
            <div>
              <span class="eyebrow">Keep walking</span>
              <h2>Nearby doors<span class="text-accent">.</span></h2>
            </div>
            <a class="link-underline small" href="shops.html">All eight shops ${ui.icon("arrowRight", 13)}</a>
          </div>
          <div class="neighbour-grid">
            ${nearby.map(({ shop: neighbour, distance }) => ui.shopCard(neighbour, { distance })).join("")}
          </div>
        </div>`;
      document.dispatchEvent(new CustomEvent("ls:content"));
    }

    function writeJsonLd() {
      let script = document.getElementById("shopJsonLd");
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "shopJsonLd";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ShoeStore",
        name: shop.name,
        description: shop.description,
        image: new URL(shop.banner, location.origin).href,
        logo: new URL(shop.logo, location.origin).href,
        telephone: shop.phone,
        email: shop.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: shop.address,
          addressLocality: shop.city,
          addressRegion: "Karnataka",
          postalCode: shop.pincode,
          addressCountry: "IN"
        },
        geo: { "@type": "GeoCoordinates", latitude: shop.lat, longitude: shop.lng },
        aggregateRating: { "@type": "AggregateRating", ratingValue: shop.rating, reviewCount: shop.reviewCount },
        openingHoursSpecification: Object.entries(shop.hours).map(([day, hours]) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: data.DAY_LABELS[day],
          opens: hours[0],
          closes: hours[1]
        })),
        priceRange: "₹₹"
      });
    }

    function capitalise(value) {
      return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
    }

    function renderMissing() {
      const main = document.querySelector("main");
      if (main) {
        main.innerHTML = `<div class="container section"><div class="empty-state">
          <h1 class="display">That shop has closed its shutters.</h1>
          <p>We couldn't find this shop. Browse all eight neighbourhood shops instead.</p>
          <a class="btn btn-primary" href="shops.html">See all shops</a>
        </div></div>`;
      }
    }

    LS.shopPage = {
      shop,
      render() {
        renderProfile();
        renderInfo();
        renderProducts();
        renderNearby();
      }
    };
  };
})();
