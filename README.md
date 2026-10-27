# Local Sole

A premium storefront for eight independent shoe shops in Bengaluru — built with **plain HTML, CSS and vanilla JavaScript**. No frameworks, no package manager, no build step, no third-party runtime requests. Every image and font is stored locally.

> **The idea:** big-marketplace choice, neighbourhood-shop service. Browse 66 pairs from eight shops, compare prices for the same model, reserve a size, choose home delivery or same-day pickup, and pay a token amount online.

---

## Quick start

### Option 1 — just open it

Double-click **`index.html`**. The site is fully functional from `file://`:

- Data falls back to the bundled `data/seed.js` when `fetch()` is blocked.
- All links and assets use relative paths.
- The service worker and geolocation are disabled automatically — browsers require `http://` or `https://` for those.

### Option 2 — serve it locally (recommended)

From the project root:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000>. Any static server works — PHP (`php -S 127.0.0.1:8000`), VS Code Live Server, or `npx serve`. Serving over HTTP enables the JSON catalogue, installable PWA and offline cache.

No install, compile or watch step is required.

---

## What's in the box

### Pages

| File | What it does |
| --- | --- |
| `index.html` | Editorial home page: hero carousel, shop-by-style, flash sale with live countdown, new arrivals, local shops, craft story, newsletter. |
| `products.html` | Catalogue of all 66 shoes with fuzzy search, URL-synced filters, sorting, grid/list view, mobile filter drawer and load-more skeletons. |
| `product.html?id=…` | Product detail: gallery with zoom and swipe, colour/size selection with live stock, size guide, pickup slots, delivery estimate, price comparison, reviews, related pairs, sticky buy bar. |
| `shops.html` | Directory of eight shops with neighbourhood/area filters, live open/closed state, ratings and distance sorting. |
| `shop.html?id=…` | Shop profile: story, photo, address, hours, pickup policy, amenities and that shop's full stock. |
| `cart.html` | Full bag: quantity controls, coupon codes, free-delivery meter, pincode estimate, save-for-later, recommended pairs. |
| `checkout.html` | Four-step checkout: contact, per-shop delivery or pickup, payment, review. Creates an order and clears the bag. |
| `order-confirmation.html?order=…` | Order number, itemised receipt, tracking timeline, pickup instructions and payment summary. |
| `wishlist.html` | Saved pairs with sorting, remove-with-undo, suggestions and empty state. |
| `account.html` | Hash-routed dashboard: overview, order history and cancellation, saved addresses, profile/avatar. |
| `compare.html` | Side-by-side comparison of up to three pairs, including other shops' offers. |
| `contact.html` | Contact cards, FAQs, validated message form, success state. |
| `owner.html` | Shopkeeper demo: inventory table, search/filter, add/edit products, orders and insights. |
| `404.html` | Friendly not-found page with search and popular links. |

### Headline features

- **Local-first shopping** — every product belongs to a real-feeling neighbourhood shop; pickup slots are generated from that shop's opening hours.
- **Fuzzy search** — typo-tolerant matching (`pesasus` finds Pegasus), tag/brand matching, highlighted results, keyboard-navigable suggestion panel, recent searches.
- **Shareable filters** — category, type, size, colour, brand, price, rating, stock, discounts and sort order all live in the URL (`products.html?type=running&size=9&max=8000&sort=price-asc`).
- **Price comparison** — selected models carry offers from other shops; the product page and compare page show the cheapest local price.
- **Per-shop fulfilment** — if the bag contains items from two shops, each group chooses delivery or pickup independently; pickup discounts apply per shop.
- **Nearby shops** — optional browser geolocation plus Haversine distance; opening hours are calculated in IST.
- **Owner CRUD** — add, edit and delete products in-session. Changes persist in `localStorage` without touching the JSON files.
- **Theme + currency** — light/dark/system theme and INR/USD/EUR display, both persisted.
- **PWA** — manifest, shortcuts, installable on HTTP, offline shell via service worker.

---

## Project structure

```text
shoes/
├─ index.html … 404.html          # 14 static pages
├─ manifest.webmanifest           # installable app metadata + shortcuts
├─ sw.js                          # service worker (network-first pages, cache-first assets)
├─ sitemap.xml                    # 78 URLs: pages + 66 products + 8 shops
├─ robots.txt
├─ README.md
├─ CREDITS.md                     # photo, font and asset licences
├─ assets/
│  ├─ fonts/                      # Instrument Serif + Manrope (WOFF2, self-hosted)
│  └─ images/
│     ├─ shoes/                   # 46 product photos
│     ├─ shops/                   # 6 shop photos
│     ├─ banners/                 # 3 heroes, promo, craft, OG image
│     ├─ avatars/                 # 4 demo avatars
│     └─ icons/                   # favicon, PWA icons, shop logos, placeholder
├─ css/
│  ├─ base.css                    # reset, tokens, typography, utilities
│  ├─ components.css              # buttons, cards, header, drawers, modals, forms, toasts
│  ├─ pages.css                   # page-specific layouts
│  ├─ animations.css              # motion, reveals, reduced-motion rules
│  └─ fonts.css                   # @font-face declarations
├─ js/
│  ├─ data.js                     # catalogue load, normalisation, shop hours, distance, offers
│  ├─ ui.js                       # shared chrome, icons, modals, toasts, money, theme, currency
│  ├─ cart.js                     # cart/wishlist/compare/recent state, drawer, cart page, coupons
│  ├─ search.js                   # fuzzy search, suggestions, recent searches, ⌘K
│  ├─ filters.js                  # products page filtering + URL sync
│  ├─ product.js                  # product detail page
│  ├─ shops.js                    # shops directory + shop profile
│  ├─ home.js                     # homepage modules
│  ├─ wishlist.js                 # wishlist page
│  ├─ checkout.js                 # checkout flow + confirmation page
│  ├─ account.js                  # account dashboard
│  ├─ contact.js                  # contact form
│  ├─ owner.js                    # shopkeeper dashboard
│  ├─ compare.js                  # compare page
│  ├─ animations.js               # scroll reveals, countdown, marquee, tilt
│  └─ app.js                      # boot sequence + page registry
├─ data/
│  ├─ products.json               # canonical catalogue (66 products)
│  ├─ shops.json                  # canonical shops (8)
│  └─ seed.js                     # generated fallback for file://
└─ scripts/                       # one-off asset/data generators (not needed at runtime)
```

---

## How it works

### No modules, no bundler

Scripts are classic ES6 IIFEs that attach to a single global, `window.LS`. This is deliberate: ES modules are blocked by CORS on `file://`, and the brief requires double-click-to-run.

**Required load order** (already set in every page):

```html
<script src="data/seed.js"></script>
<script src="js/data.js"></script>
<script src="js/ui.js"></script>
<script src="js/cart.js"></script>
<script src="js/search.js"></script>
<script src="js/animations.js"></script>
<!-- page module, e.g. js/product.js -->
<script src="js/app.js"></script>
```

Each page module registers itself in `LS.pages`, and `app.js` calls the handler for `document.body.dataset.page`.

### Catalogue loading

1. `js/data.js` checks for `window.LOCAL_SHOE_DATA` (provided by `data/seed.js`).
2. On HTTP it prefers a real `fetch()` of `data/products.json` + `data/shops.json`.
3. If fetch fails, it keeps the seed data and logs a single warning.
4. Products are normalised (numbers, size stock, image fallback).
5. Owner overlay edits are merged on top.
6. `app.js` waits for `LS.data.ready`, renders shared chrome, then starts the page module.

### Shared UI

`js/ui.js` injects the announcement bar, sticky header with mega-menu, search overlay, cart drawer, mobile bottom nav, footer, cookie notice, toasts and modal root into every page. Pages only contain their unique content.

### Accessibility

- Semantic landmarks, a skip link, visible focus rings, keyboard-operable menus/drawers/modals and `Escape` to close.
- ARIA labels, roles, live regions for toasts and cart counts, `aria-current` for navigation.
- All images have alt text; decorative images are marked appropriately.
- Motion respects `prefers-reduced-motion`; colour contrast targets WCAG AA.

---

## Adding or editing products

### Option A — use the shopkeeper dashboard (no code)

1. Open `owner.html`.
2. Pick a shop.
3. Use **Add product** for a new pair, or **Edit** on a row.
4. Changes appear immediately across the site and survive a refresh.

The dashboard writes an overlay to `localStorage` under `ls_owner_catalog_v1`; `data/products.json` is never modified. Use **Reset demo data** in the owner page to clear the overlay and return to the canonical catalogue.

### Option B — edit the canonical JSON

Add an object to the `products` array in `data/products.json`:

```json
{
  "id": "atelier-court-01",
  "name": "Atelier Court 01",
  "brand": "Atelier",
  "category": "unisex",
  "type": "sneakers",
  "price": 6499,
  "oldPrice": 7999,
  "discount": 19,
  "currency": "INR",
  "shopId": "sole-theory",
  "colors": [
    { "name": "Chalk", "hex": "#EDE7DA", "image": "assets/images/shoes/triple-white.jpg" },
    { "name": "Ink", "hex": "#232323", "image": "assets/images/shoes/mono-low.jpg" }
  ],
  "sizes": [
    { "size": 6, "stock": 3 },
    { "size": 7, "stock": 4 },
    { "size": 8, "stock": 2 }
  ],
  "rating": 4.7,
  "reviewCount": 38,
  "shortDescription": "A clean leather court shoe finished by hand.",
  "description": "Full-grain leather upper, cushioned insole and a stitched rubber cupsole. Made for everyday wear.",
  "material": "Full-grain leather",
  "tags": ["sneakers", "leather", "unisex", "chalk", "new"],
  "images": [
    "assets/images/shoes/triple-white.jpg",
    "assets/images/shoes/white-azure.jpg",
    "assets/images/shoes/cream-heritage.jpg"
  ],
  "isNew": true,
  "isBestSeller": false,
  "inStock": true,
  "stockTotal": 9,
  "releaseDate": "2026-10-01",
  "sku": "LS-ATE-0067",
  "reviews": []
}
```

Notes:

- `id` must be unique; it becomes the URL: `product.html?id=atelier-court-01`.
- `shopId` must exist in `data/shops.json`.
- `category` is one of `men`, `women`, `unisex`, `kids`; `type` is one of `sneakers`, `running`, `formal`, `boots`, `sandals`, `heels`.
- `stockTotal` should equal the sum of `sizes[].stock`; zero across all sizes marks the pair sold out.
- `discount` is a display percentage. It is calculated automatically on the owner form, but set it manually in JSON.
- Images are relative to the site root. Add new files to `assets/images/shoes/`; keep them roughly 4:3 or square, under ~200 KB.
- `offers` is optional. Add other shops' prices to power comparison:
  ```json
  "offers": [
    { "shopId": "sneaker-house", "price": 6299, "sizes": [7, 8, 9], "inStock": true }
  ]
  ```

Then rebuild the `file://` fallback and the sitemap:

```bash
node scripts/sync_seed.js
node scripts/generate_sitemap.js
```

Reload the page. If your browser has an old owner overlay, reset it from `owner.html` or remove `ls_owner_catalog_v1` in DevTools.

### Adding a shop

Append to `data/shops.json` using the existing shape (`id`, `name`, `area`, `address`, `rating`, `reviewCount`, `image`, `hours`, `pickup`, `amenities`, `story`, `owner`, `established`, `phone`, `email`). Keep `hours` in IST and add a logo at `assets/images/icons/logo-<id>.svg`. Run both scripts above afterward.

---

## Bag, coupons and checkout

- Cart, wishlist and compare state live in `localStorage`; the header count and drawer update without a reload.
- Free delivery threshold: **₹1,999** per order (delivery orders).
- Pickup is free and may carry a shop-specific discount (shown on the shop and at checkout).
- Demo coupons:

| Code | Benefit | Minimum |
| --- | --- | --- |
| `WELCOME10` | 10% off, capped at ₹500 | ₹999 |
| `FREESHIP` | Free delivery | — |
| `SOLE150` | ₹150 off | ₹2,999 |
| `LOCAL5` | 5% off, capped at ₹1,000 | ₹4,999 |

- Checkout is per shop: each shop group independently chooses **delivery** or **pickup**, with its own address or pickup slot.
- Payment is simulated (UPI, card, cash on pickup). No gateway is contacted and no real money moves.
- Placing an order saves it to `ls_orders_v1` and redirects to `order-confirmation.html?order=…`.

### URL patterns

```text
product.html?id=nike-pegasus-41
shop.html?id=sole-theory
products.html?q=runner&type=running&size=9&color=Black&min=2000&max=8000&sort=price-asc
shops.html?area=Indiranagar&open=1&sort=distance
account.html#orders
order-confirmation.html?order=LS-20261021-8817
```

---

## localStorage keys

Everything is device-local and can be cleared from the browser. The app never sends it anywhere.

| Key | Contents |
| --- | --- |
| `ls_cart_v1` | Bag lines `{ productId, size, color, qty }` |
| `ls_saved_v1` | Saved-for-later lines |
| `ls_wishlist_v1` | Wishlist product IDs |
| `ls_compare_v1` | Up to three compare IDs |
| `ls_recent_v1` | Recently viewed product IDs |
| `ls_recent_searches_v1` | Last search queries |
| `ls_coupon_v1` | Applied coupon code |
| `ls_theme_v1` | `light`, `dark` or `system` |
| `ls_currency_v1` | `INR`, `USD` or `EUR` |
| `ls_pincode_v1` | Last delivery pincode |
| `ls_location_v1`, `ls_area_v1` | Geolocation coords and chosen area |
| `ls_orders_v1`, `ls_last_order_v1` | Orders and most recent order ID |
| `ls_profile_v1`, `ls_addresses_v1` | Account profile and saved addresses |
| `ls_owner_catalog_v1` | Owner-demo product overlay (edits, deletions, custom products) |
| `ls_owner_shop_v1` | Last shop selected in the owner dashboard |
| `ls_messages_v1` | Contact form submissions |
| `ls_newsletter_v1` | Newsletter signup state |
| `ls_reviews_<productId>` | Customer reviews written in this browser |
| `ls_announcement_dismissed` | Announcement bar dismissed |
| `ls_cookie_consent_v1` | Cookie notice choice |

To start completely fresh, run `localStorage.clear()` in DevTools and reload.

---

## Theme, currency and search

- **Theme:** light, dark or follow system. Set from the header; applied before paint to avoid a flash.
- **Currency:** converts INR prices at fixed demo rates (1 INR = 0.012 USD = 0.011 EUR). Checkout always states that the charge is in INR.
- **Search:** open with the header search button, `Ctrl/Cmd + K`, or `/`. Fuzzy matching handles transpositions and one-character typos; results are grouped by product, brand, shop and category.
- **Filters:** every control writes to the URL with `history.replaceState`, so filtered views can be bookmarked and shared.

---

## PWA and offline

- `manifest.webmanifest` provides the name, theme, icons (192/512/maskable) and shortcuts to shoes, shops and bag.
- `sw.js` uses **network-first** for pages and catalogue data, **cache-first** for CSS/JS/fonts/images.
- Install from the browser's address bar when served over HTTP. The service worker is skipped on `file://`.
- After changing the cached shell or key images, bump `CACHE_VERSION` in `sw.js` so clients refresh.
- The site is readable offline once installed; cart and account data remain local.

---

## SEO and metadata

- Unique title/description, canonical, Open Graph and Twitter tags on every page.
- Product pages update title, description, OG tags, canonical and `Product` JSON-LD at runtime.
- The home page includes `WebSite` + `SearchAction`; contact includes `ContactPage`; shop pages include `Store` data.
- `sitemap.xml` lists static pages plus all 66 products and 8 shops (regenerate after catalogue changes).
- `robots.txt` allows everything and points to the sitemap.
- Images carry descriptive alt text and explicit dimensions where layout stability matters.

---

## Quality checks performed

- All 14 pages loaded over HTTP and from `file://` with no console errors.
- Full purchase path: product → size/colour → bag → coupon → checkout → order confirmation.
- Wishlist, compare, account, contact and owner CRUD exercised end to end.
- Mobile (360–430 px), tablet and desktop layouts checked; bottom nav and drawers keyboard-operable.
- Broken-image fallback replaces any missing asset with the local placeholder.
- Reduced-motion mode disables transforms, parallax and marquees.

### Quick manual smoke test

1. Open `index.html`; search for `pesasus`.
2. Filter to running shoes size 9 under ₹8,000; copy the URL and open it in a new tab.
3. Add two pairs from different shops; open the bag, apply `WELCOME10`.
4. Check out with one shop as pickup and one as delivery; place the order.
5. Open `account.html#orders`, then `owner.html` and add a product.
6. Toggle dark mode and USD; reload to confirm persistence.

---

## Browser support

Chrome, Edge, Firefox and Safari (current and previous major versions). Uses widely supported ES2020 features, CSS custom properties, `IntersectionObserver`, `dialog` fallbacks and `localStorage`. No polyfills are bundled. JavaScript is required for the catalogue.

---

## Credits

Photography, fonts, licences and trademark notes are documented in **`CREDITS.md`**. All shop names, copy, prices and reviews are fictional demo content.

## Known limitations

- Payments, email, inventory sync and authentication are simulated; all state is in `localStorage`.
- Currency conversion uses fixed demo rates, not live FX.
- The owner dashboard is unauthenticated and edits only the current browser.
- `file://` mode cannot use geolocation, the service worker or (in some browsers) the JSON catalogue; the bundled seed keeps browsing working.
- Opening a deep link such as `product.html?id=…` from `file://` works, but relative links must be followed from a page in the same folder.
