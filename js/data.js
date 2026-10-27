/* ==========================================================================
   Local Sole — data.js
   Single source of truth for shops + products. Loads JSON over HTTP, falls
   back to data/seed.js when opened directly from the file system.
   Also merges catalogue edits made in the owner demo (localStorage).
   ========================================================================== */

window.LS = window.LS || {};

LS.data = (() => {
  const state = { products: [], shops: [], meta: {} };
  const OWNER_KEY = "ls_owner_catalog_v1";

  const ready = (async () => {
    let payload = window.LOCAL_SHOE_DATA || null;

    // A real JSON fetch on a server; seed fallback keeps file:// fully working.
    if (!payload && /^https?:$/.test(location.protocol)) {
      try {
        const [productsRes, shopsRes] = await Promise.all([
          fetch("data/products.json", { cache: "no-cache" }),
          fetch("data/shops.json", { cache: "no-cache" })
        ]);
        if (!productsRes.ok || !shopsRes.ok) throw new Error("Catalogue request failed");
        const [productsJson, shopsJson] = await Promise.all([productsRes.json(), shopsRes.json()]);
        payload = { products: productsJson.products, shops: shopsJson.shops, meta: productsJson.meta };
      } catch (error) {
        console.warn("Using bundled catalogue fallback:", error.message);
      }
    }

    if (!payload || !Array.isArray(payload.products)) {
      console.error("Local Sole: catalogue could not be loaded.");
      return state;
    }

    state.products = payload.products.map(normaliseProduct);
    state.shops = payload.shops.slice();
    state.meta = payload.meta || {};
    applyOwnerOverrides();
    return state;
  })();

  function normaliseProduct(product) {
    return {
      ...product,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      rating: Number(product.rating),
      reviewCount: Number(product.reviewCount || 0),
      sizes: (product.sizes || []).map((s) => ({ size: String(s.size), stock: Number(s.stock) })),
      colors: product.colors || [],
      images: product.images || ["assets/images/icons/placeholder.svg"],
      offers: product.offers || [],
      isNew: Boolean(product.isNew),
      isBestSeller: Boolean(product.isBestSeller)
    };
  }

  function cumulativeStock(product) {
    return (product.sizes || []).reduce((total, s) => total + Number(s.stock || 0), 0);
  }

  function applyOwnerOverrides() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(OWNER_KEY) || "null");
    } catch {
      saved = null;
    }
    if (!saved) return;

    const deleted = new Set(saved.deleted || []);
    const edits = saved.edits || {};
    const custom = (saved.custom || []).map(normaliseProduct);

    state.products = state.products
      .filter((p) => !deleted.has(p.id))
      .map((p) => {
        if (!edits[p.id]) return p;
        const merged = normaliseProduct({ ...p, ...edits[p.id] });
        merged.inStock = cumulativeStock(merged) > 0;
        merged.stockTotal = cumulativeStock(merged);
        merged.discount = merged.oldPrice
          ? Math.round(((merged.oldPrice - merged.price) / merged.oldPrice) * 100)
          : 0;
        return merged;
      });

    custom.forEach((p) => {
      p.inStock = cumulativeStock(p) > 0;
      p.stockTotal = cumulativeStock(p);
    });
    state.products = [...custom, ...state.products];
  }

  const productById = (id) => state.products.find((p) => p.id === id);
  const shopById = (id) => state.shops.find((s) => s.id === id);
  const productsByShop = (shopId) => state.products.filter((p) => p.shopId === shopId);
  const productsByIds = (ids) => ids.map(productById).filter(Boolean);

  function brands() {
    return [...new Set(state.products.map((p) => p.brand))].sort();
  }

  function types() {
    const order = ["sneakers", "running", "formal", "boots", "sandals", "sports", "casual"];
    return order.filter((type) => state.products.some((p) => p.type === type));
  }

  function categories() {
    return ["men", "women", "kids", "unisex"];
  }

  function areas() {
    return [...new Set(state.shops.map((s) => s.area))].sort();
  }

  function colours() {
    const map = new Map();
    state.products.forEach((p) => {
      (p.colors || []).forEach((c) => {
        if (!map.has(c.name)) map.set(c.name, c.hex);
      });
    });
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }

  function priceBounds() {
    if (!state.products.length) return { min: 0, max: 25000 };
    const prices = state.products.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices) / 100) * 100,
      max: Math.ceil(Math.max(...prices) / 100) * 100
    };
  }

  function discountPercent(product) {
    if (product.discount) return product.discount;
    if (!product.oldPrice || product.oldPrice <= product.price) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }

  function countByType(type) {
    return state.products.filter((p) => p.type === type).length;
  }

  /** Price comparison: the product's own shop plus other shops that stock it. */
  function priceOffers(product) {
    if (!product) return [];
    const seen = new Set();
    const offers = [];
    const ownShop = shopById(product.shopId);
    if (ownShop) {
      offers.push({ shop: ownShop, price: product.price, own: true });
      seen.add(ownShop.id);
    }
    (product.offers || []).forEach((offer) => {
      const shop = shopById(offer.shopId);
      if (!shop || seen.has(shop.id)) return;
      seen.add(shop.id);
      offers.push({ shop, price: Number(offer.price), own: false });
    });
    return offers.sort((a, b) => a.price - b.price);
  }

  function lowestOffer(product) {
    return priceOffers(product)[0] || null;
  }

  /* ---------- opening hours (shop local time, IST) ---------- */
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const DAY_LABELS = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

  function to12Hour(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "pm" : "am";
    const hour = h % 12 || 12;
    return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
  }

  function istNow() {
    const now = new Date();
    // Represent Indian Standard Time regardless of the visitor's timezone.
    return new Date(now.getTime() + (now.getTimezoneOffset() + 330) * 60000);
  }

  function openState(shop, reference) {
    if (!shop || !shop.hours) return { open: false, label: "Hours unavailable" };
    const now = reference || istNow();
    const todayKey = DAY_KEYS[now.getDay()];
    const today = shop.hours[todayKey];
    const minutes = now.getHours() * 60 + now.getMinutes();

    if (today) {
      const [openH, openM] = today[0].split(":").map(Number);
      const [closeH, closeM] = today[1].split(":").map(Number);
      const opens = openH * 60 + openM;
      const closes = closeH * 60 + closeM;
      if (minutes >= opens && minutes < closes) {
        return {
          open: true,
          label: `Open now · until ${to12Hour(today[1])}`,
          today,
          closesAt: today[1]
        };
      }
      if (minutes < opens) {
        return {
          open: false,
          label: `Closed · opens ${to12Hour(today[0])} today`,
          today
        };
      }
    }

    // Find the next open day.
    for (let offset = 1; offset <= 7; offset += 1) {
      const key = DAY_KEYS[(now.getDay() + offset) % 7];
      const hours = shop.hours[key];
      if (hours) {
        const prefix = offset === 1 ? "tomorrow" : DAY_LABELS[key];
        return {
          open: false,
          label: `Closed · opens ${prefix} at ${to12Hour(hours[0])}`,
          today,
          nextDay: key
        };
      }
    }
    return { open: false, label: "Closed", today };
  }

  function todayHours(shop) {
    const today = DAY_KEYS[istNow().getDay()];
    return shop.hours ? shop.hours[today] : null;
  }

  /* ---------- geolocation ---------- */
  function haversineKm(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some((n) => typeof n !== "number" || Number.isNaN(n))) return null;
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function shopDistance(shop, coords) {
    if (!coords) return null;
    return haversineKm(coords.lat, coords.lng, shop.lat, shop.lng);
  }

  function nearbyShops(coords, limit = 4) {
    return state.shops
      .map((shop) => ({ shop, distance: shopDistance(shop, coords) }))
      .filter((item) => item.distance !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  return {
    ready,
    get products() { return state.products; },
    get shops() { return state.shops; },
    get meta() { return state.meta; },
    productById,
    shopById,
    productsByShop,
    productsByIds,
    brands,
    types,
    categories,
    areas,
    colours,
    priceBounds,
    discountPercent,
    countByType,
    priceOffers,
    lowestOffer,
    openState,
    todayHours,
    to12Hour,
    istNow,
    haversineKm,
    shopDistance,
    nearbyShops,
    DAY_KEYS,
    DAY_LABELS,
    OWNER_KEY,
    cumulativeStock
  };
})();
