/* ==========================================================================
   Local Sole — home.js
   Home page composition: hero, categories, edits, flash sale, local shops.
   ========================================================================== */

LS.pages = LS.pages || {};

LS.pages.home = function initHome() {
  const data = LS.data;
  const ui = LS.ui;

  /* Hero floating product + featured shop */
  const heroProduct = data.productById("nike-pegasus-41") || data.products.find((p) => p.isBestSeller) || data.products[0];
  const heroFloat = document.getElementById("heroFloat");
  if (heroFloat && heroProduct) {
    heroFloat.innerHTML = `
      <a href="product.html?id=${encodeURIComponent(heroProduct.id)}" aria-label="View ${ui.escapeHtml(heroProduct.name)}">
        <img src="${ui.escapeHtml(heroProduct.images[0])}" alt="${ui.escapeHtml(heroProduct.name)}" width="180" height="180">
        <span class="tiny">Editor's pick</span>
        <strong style="display:block;font-size:.8rem;line-height:1.25;margin-top:2px">${ui.escapeHtml(heroProduct.name)}</strong>
        <span class="price">
          <span class="price-current" data-inr="${heroProduct.price}">${ui.money.fmt(heroProduct.price)}</span>
          ${heroProduct.oldPrice ? `<span class="price-old" data-inr="${heroProduct.oldPrice}">${ui.money.fmt(heroProduct.oldPrice)}</span>` : ""}
        </span>
      </a>`;
  }

  const heroShop = data.shopById(heroProduct?.shopId) || data.shops[0];
  const heroShopName = document.getElementById("heroShopName");
  const heroShopArea = document.getElementById("heroShopArea");
  const heroShopLogo = document.getElementById("heroShopLogo");
  const heroShopLink = document.getElementById("heroShopLink");
  if (heroShopName) heroShopName.textContent = heroShop.name;
  if (heroShopArea) heroShopArea.textContent = `${heroShop.area} · ${heroShop.rating} ★`;
  if (heroShopLogo) heroShopLogo.src = heroShop.logo;
  if (heroShopLink) heroShopLink.href = `shop.html?id=${encodeURIComponent(heroShop.id)}`;

  /* Category tiles */
  const categoryGrid = document.getElementById("categoryGrid");
  const categoryArt = {
    sneakers: "assets/images/shoes/cream-heritage.jpg",
    running: "assets/images/shoes/red-racer.jpg",
    formal: "assets/images/shoes/espresso-derby.jpg",
    boots: "assets/images/shoes/tan-desert-boot.jpg"
  };
  const categoryCopy = {
    sneakers: "Everyday icons",
    running: "Built for the long way",
    formal: "Occasion ready",
    boots: "Weather anything"
  };
  if (categoryGrid) {
    categoryGrid.innerHTML = ["sneakers", "running", "formal", "boots"].map((type) => {
      const count = data.products.filter((p) => p.type === type).length;
      return `<a class="category-card reveal" href="products.html?type=${type}">
        <img src="${categoryArt[type]}" alt="${type} shoes" width="520" height="700" loading="lazy" decoding="async">
        <span class="category-count">${count} styles</span>
        <div><h3>${type.charAt(0).toUpperCase() + type.slice(1)}</h3><p>${categoryCopy[type]}</p></div>
      </a>`;
    }).join("");
  }

  /* Product rails */
  const newGrid = document.getElementById("newGrid");
  if (newGrid) {
    const newest = [...data.products]
      .filter((p) => p.isNew)
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .slice(0, 4);
    newGrid.innerHTML = newest.map((p) => ui.productCard(p)).join("");
    newGrid.classList.add("stagger");
  }

  const bestGrid = document.getElementById("bestGrid");
  if (bestGrid) {
    const best = [...data.products]
      .filter((p) => p.isBestSeller)
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, 8);
    bestGrid.innerHTML = best.map((p) => ui.productCard(p)).join("");
    bestGrid.classList.add("stagger");
  }

  const flashGrid = document.getElementById("flashGrid");
  if (flashGrid) {
    const discounted = [...data.products]
      .filter((p) => data.discountPercent(p) >= 20)
      .sort((a, b) => data.discountPercent(b) - data.discountPercent(a))
      .slice(0, 3);
    flashGrid.innerHTML = discounted.map((p) => ui.productCard(p)).join("");
    flashGrid.classList.add("stagger");
  }

  /* Shops */
  const shopGrid = document.getElementById("shopGrid");
  if (shopGrid) {
    const picks = [...data.shops].sort((a, b) => b.rating - a.rating).slice(0, 3);
    shopGrid.innerHTML = picks.map((shop) => ui.shopCard(shop)).join("");
    shopGrid.classList.add("stagger");
  }

  /* Flash countdown — resets at local midnight. */
  const countdown = document.getElementById("flashCountdown");
  if (countdown) {
    const fields = {
      hours: countdown.querySelector("[data-cd-hours]"),
      minutes: countdown.querySelector("[data-cd-minutes]"),
      seconds: countdown.querySelector("[data-cd-seconds]")
    };
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      let diff = Math.max(0, Math.floor((end - now) / 1000));
      const hours = Math.floor(diff / 3600);
      diff %= 3600;
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      if (fields.hours) fields.hours.textContent = String(hours).padStart(2, "0");
      if (fields.minutes) fields.minutes.textContent = String(minutes).padStart(2, "0");
      if (fields.seconds) fields.seconds.textContent = String(seconds).padStart(2, "0");
      countdown.setAttribute("aria-label", `Flash sale ends in ${hours} hours, ${minutes} minutes and ${seconds} seconds`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
  }

  /* Recently viewed */
  const recentSection = document.getElementById("recentlyViewedSection");
  const recentGrid = document.getElementById("recentGrid");
  if (recentSection && recentGrid) {
    const recent = LS.recent.list().slice(0, 6);
    if (recent.length) {
      recentSection.hidden = false;
      recentGrid.innerHTML = recent.map((p) => ui.productCard(p)).join("");
    } else {
      recentSection.hidden = true;
    }
  }

  LS.animations.initReveals();
};
