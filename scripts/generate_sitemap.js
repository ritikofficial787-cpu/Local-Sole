/* Generates sitemap.xml from the canonical product + shop catalogue. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(root, "data", "products.json"), "utf8")).products;
const shops = JSON.parse(fs.readFileSync(path.join(root, "data", "shops.json"), "utf8")).shops;
const base = "https://localsole.in/";
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: "", priority: "1.0", changefreq: "daily" },
  { loc: "products.html", priority: "0.9", changefreq: "daily" },
  { loc: "shops.html", priority: "0.8", changefreq: "weekly" },
  { loc: "contact.html", priority: "0.5", changefreq: "monthly" }
];

const urls = [
  ...staticPages.map((page) => ({
    loc: base + page.loc,
    priority: page.priority,
    changefreq: page.changefreq
  })),
  ...products.map((product) => ({
    loc: `${base}product.html?id=${encodeURIComponent(product.id)}`,
    priority: "0.7",
    changefreq: "weekly"
  })),
  ...shops.map((shop) => ({
    loc: `${base}shop.html?id=${encodeURIComponent(shop.id)}`,
    priority: "0.6",
    changefreq: "weekly"
  }))
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc.replace(/&/g, "&amp;")}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(root, "sitemap.xml"), xml, "utf8");
fs.writeFileSync(
  path.join(root, "robots.txt"),
  `# Local Sole - localsole.in\nUser-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`,
  "utf8"
);

console.log(`sitemap.xml + robots.txt written (${urls.length} URLs)`);
