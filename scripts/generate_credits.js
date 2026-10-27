/* Generates CREDITS.md from the asset manifests used during the build. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const shoeCredits = JSON.parse(fs.readFileSync(path.join(root, "scripts", "shoe-credits.json"), "utf8"));

const otherSets = {
  "shops/store-1.jpg": { id: "1441986300917-64674bd600d8", use: "Shop photo — Sole Theory" },
  "shops/store-2.jpg": { id: "1555529669-e69e7aa0ba9a", use: "Shop photo — The Sneaker House" },
  "shops/store-3.jpg": { id: "1528698827591-e19ccd7bc23d", use: "Shop photo — Leather & Lace" },
  "shops/store-4.jpg": { id: "1441984904996-e0b6ba687e04", use: "Shop photo — stride." },
  "shops/store-5.jpg": { id: "1567401893414-76b7b1e5a7a5", use: "Shop photo — Footwork Collective" },
  "shops/store-6.jpg": { id: "1472851294608-062f824d29cc", use: "Shop photo — Little Feet Co." },
  "banners/hero-1.jpg": { id: "1556906781-9a412961c28c", use: "Homepage hero" },
  "banners/hero-2.jpg": { id: "1460353581641-37baddab0fa2", use: "Homepage hero" },
  "banners/hero-3.jpg": { id: "1491553895911-0055eca6402d", use: "Homepage hero" },
  "banners/promo-1.jpg": { id: "1600185365483-26d7a4cc7519", use: "Promo band" },
  "banners/craft.jpg": { id: "1515955656352-a1fa3ffcd111", use: "Craft / editorial panel" },
  "avatars/avatar-1.jpg": { id: "1494790108377-be9c29b29330", use: "Demo customer avatar" },
  "avatars/avatar-2.jpg": { id: "1500648767791-00dcc994a43e", use: "Demo customer avatar" },
  "avatars/avatar-3.jpg": { id: "1534528741775-53994a69daeb", use: "Demo customer avatar" },
  "avatars/avatar-4.jpg": { id: "1506794778202-cad84cf45f1d", use: "Demo customer avatar" }
};

const img = (id) => `https://images.unsplash.com/photo-${id}`;
const title = (file) =>
  file
    .replace(/\.jpg$/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const shoeRows = Object.entries(shoeCredits)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, url]) => {
    const id = url.split("/").pop();
    return `| \`assets/images/shoes/${file}\` | ${title(file)} | [Photo ${id.slice(0, 13)}…](${img(id)}) |`;
  })
  .join("\n");

const otherRows = Object.entries(otherSets)
  .map(([file, { id, use }]) => `| \`assets/images/${file}\` | ${use} | [Photo ${id.slice(0, 13)}…](${img(id)}) |`)
  .join("\n");

const md = `# Credits & Licences

Local Sole is a front-end demo. All shop names, shop descriptions, product copy, review text, prices and offers are fictional and were written for this project. Real sneaker model names are referenced editorially so that search and comparison feel familiar; all trademarks remain the property of their respective owners and no affiliation or endorsement is implied.

## Photography

Every photo is stored locally under \`assets/images/\` and served from a relative path — the site never hotlinks images at runtime. Photos were downloaded from [Unsplash](https://unsplash.com) and resized/re-encoded (JPEG, quality 78–80, longest edge 900–1400 px) for this demo. They are used under the [Unsplash License](https://unsplash.com/license), which permits free commercial and non-commercial use without permission; attribution is not required but is provided below.

Source links point at the Unsplash image CDN record used for the download. The Unsplash License does not permit compiling photos to build a competing photo service; these files are used only as storefront imagery in this demo.

### Shoe photography (46 files)

| Local file | Working label | Source |
| --- | --- | --- |
${shoeRows}

### Shop, banner and avatar photography (15 files)

| Local file | Use | Source |
| --- | --- | --- |
${otherRows}

### Derived copies

These files are byte-for-byte or resized copies of images credited above and need no separate attribution:

- \`assets/images/banners/og-default.jpg\` — copy of \`banners/hero-1.jpg\`
- \`assets/images/shoes/copper-court.jpg\` — copy of \`shoes/amber-court.jpg\`
- \`assets/images/shoes/cream-heritage.jpg\` — copy of \`shoes/cream-court-ledge.jpg\`
- \`assets/images/shoes/olive-suede.jpg\` — copy of \`shoes/olive-runner.jpg\`

## Typography

Both families are self-hosted as WOFF2 files in \`assets/fonts/\` and were fetched from Google Fonts. They are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/), which permits embedding and redistribution.

| Family | Files | Designer / source | Licence |
| --- | --- | --- | --- |
| Instrument Serif | \`instrument-serif-400.woff2\`, \`instrument-serif-400-italic.woff2\` | Rodrigo Fuenzalida & Jordan Egstad, [Instrument](https://instrument.com) via Google Fonts | SIL OFL 1.1 |
| Manrope | \`manrope-200800.woff2\` (variable, 200–800) | Mikhail Sharanda via Google Fonts | SIL OFL 1.1 |

The OFL permits use, modification and redistribution of the font software. The fonts are not sold separately and the reserved font names are not modified.

## Illustration, logos and icons

The Local Sole wordmark, the eight shop logos (\`assets/images/icons/logo-*.svg\`), the favicon, the PWA icons, the placeholder illustration and all interface icons are original SVG/PNG artwork created for this project. Interface icons are inline SVG paths authored in \`js/ui.js\`; no icon-font or third-party icon library is bundled. You may reuse them as part of this demo.

## Data and code

All HTML, CSS, JavaScript, JSON and copy in this repository were written for Local Sole. No framework, CDN script, analytics tag or third-party runtime dependency is used. Product and shop data live in \`data/products.json\` and \`data/shops.json\`; the \`file://\` fallback is generated into \`data/seed.js\`.

## Demo-only notices

- Prices are shown in Indian rupees by default and converted to USD/EUR for display only; no live exchange rate or payment gateway is connected.
- Customer accounts, orders, reviews, messages, addresses and owner catalogue edits are stored in the browser's \`localStorage\` and never leave the device.
- The owner dashboard is a local demo of CRUD; it is not authenticated.
`;
fs.writeFileSync(path.join(root, "CREDITS.md"), md, "utf8");
console.log("CREDITS.md written");
