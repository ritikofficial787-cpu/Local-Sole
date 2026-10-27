/* Rebuilds data/seed.js from the canonical JSON catalogues.
   Run this after editing data/products.json or data/shops.json so that
   opening the site directly from disk (file://) shows the same catalogue. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(root, "data", "products.json"), "utf8"));
const shops = JSON.parse(fs.readFileSync(path.join(root, "data", "shops.json"), "utf8"));

const payload = { meta: products.meta, products: products.products, shops: shops.shops };
const output =
  "/* Auto-generated fallback for file:// usage. Keep in sync with products.json + shops.json. */\n" +
  "window.LOCAL_SHOE_DATA = " +
  JSON.stringify(payload) +
  ";\n";

fs.writeFileSync(path.join(root, "data", "seed.js"), output, "utf8");
console.log(`data/seed.js rebuilt — ${products.products.length} products, ${shops.shops.length} shops.`);
