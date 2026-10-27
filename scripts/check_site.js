/* Static sanity checks for the Local Sole demo. Run: node scripts/check_site.js */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const problems = [];
const warnings = [];

const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith(".html"));
const exists = (rel) => fs.existsSync(path.join(root, rel.split("?")[0].split("#")[0]));

// 1. Local asset and link references in HTML.
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const refs = [...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(ref) || ref.startsWith("//")) continue;
    if (!exists(ref)) problems.push(`${file}: missing local reference ${ref}`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) problems.push(`${file}: duplicate id(s) ${[...new Set(dupes)].join(", ")}`);

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of imgs) {
    if (!/\balt=/.test(tag)) warnings.push(`${file}: <img> without alt — ${tag.slice(0, 90)}`);
  }
}

// 2. Service worker + manifest assets.
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
for (const ref of [...sw.matchAll(/"\.\/([^"]+)"/g)].map((m) => m[1])) {
  if (ref && !exists(ref)) problems.push(`sw.js: missing cached asset ${ref}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
for (const icon of manifest.icons) {
  if (!exists(icon.src)) problems.push(`manifest: missing icon ${icon.src}`);
}
for (const shortcut of manifest.shortcuts || []) {
  for (const icon of shortcut.icons || []) {
    if (!exists(icon.src)) problems.push(`manifest shortcut: missing icon ${icon.src}`);
  }
}

// 3. Catalogue integrity.
const products = JSON.parse(fs.readFileSync(path.join(root, "data", "products.json"), "utf8")).products;
const shops = JSON.parse(fs.readFileSync(path.join(root, "data", "shops.json"), "utf8")).shops;
const shopIds = new Set(shops.map((s) => s.id));
const productIds = new Set();
const required = ["id", "name", "brand", "category", "type", "price", "shopId", "images", "sizes", "colors", "rating", "reviews"];
for (const p of products) {
  if (productIds.has(p.id)) problems.push(`products: duplicate id ${p.id}`);
  productIds.add(p.id);
  for (const key of required) {
    if (p[key] === undefined || p[key] === null) problems.push(`product ${p.id}: missing ${key}`);
  }
  if (!shopIds.has(p.shopId)) problems.push(`product ${p.id}: unknown shopId ${p.shopId}`);
  if (!p.images?.length) problems.push(`product ${p.id}: no images`);
  for (const image of p.images || []) if (!exists(image)) problems.push(`product ${p.id}: missing image ${image}`);
  for (const color of p.colors || []) if (color.image && !exists(color.image)) problems.push(`product ${p.id}: missing colour image ${color.image}`);
  const stock = (p.sizes || []).reduce((sum, s) => sum + Number(s.stock || 0), 0);
  if (Number(p.stockTotal) !== stock) warnings.push(`product ${p.id}: stockTotal ${p.stockTotal} != size stock ${stock}`);
  for (const offer of p.offers || []) {
    if (!shopIds.has(offer.shopId)) problems.push(`product ${p.id}: offer for unknown shop ${offer.shopId}`);
  }
}
for (const shop of shops) {
  if (shop.banner && !exists(shop.banner)) problems.push(`shop ${shop.id}: missing banner ${shop.banner}`);
  for (const image of shop.gallery || []) if (!exists(image)) problems.push(`shop ${shop.id}: missing gallery image ${image}`);
  if (shop.logo && !exists(shop.logo)) problems.push(`shop ${shop.id}: missing logo ${shop.logo}`);
}

// 4. File:// fallback matches JSON catalogues.
const seed = fs.readFileSync(path.join(root, "data", "seed.js"), "utf8");
const seedPayload = JSON.parse(seed.slice(seed.indexOf("{"), seed.lastIndexOf(";")));
if (seedPayload.products.length !== products.length) problems.push("seed.js: product count differs from products.json");
if (seedPayload.shops.length !== shops.length) problems.push("seed.js: shop count differs from shops.json");

// 5. Sitemap and robots.
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
for (const shop of shops) {
  if (!locs.includes(`https://localsole.in/shop.html?id=${shop.id}`)) problems.push(`sitemap: missing shop ${shop.id}`);
}
for (const product of products) {
  if (!locs.includes(`https://localsole.in/product.html?id=${product.id}`)) problems.push(`sitemap: missing product ${product.id}`);
}
if (!fs.readFileSync(path.join(root, "robots.txt"), "utf8").includes("Sitemap: https://localsole.in/sitemap.xml")) {
  problems.push("robots.txt: missing sitemap directive");
}

console.log(`Checked ${htmlFiles.length} pages, ${products.length} products, ${shops.length} shops.`);
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((w) => console.log("  ! " + w));
}
if (problems.length) {
  console.log(`\nProblems (${problems.length}):`);
  problems.forEach((p) => console.log("  x " + p));
  process.exitCode = 1;
} else {
  console.log("\nNo broken local references or catalogue problems.");
}
