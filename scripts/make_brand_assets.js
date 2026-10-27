const fs = require('fs');
const logos = {
  'sole-theory': {bg:'#E8452C', mark:'<path d="M12 38c8-12 14-6 20-14s14 2 20-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="46" cy="45" r="4" fill="#fff"/>'},
  'sneaker-house': {bg:'#161616', mark:'<path d="M14 30l18-14 18 14v20a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z" fill="none" stroke="#fff" stroke-width="4"/><path d="M22 49h20M24 39h16" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'},
  'leather-and-lace': {bg:'#7A4B3A', mark:'<path d="M20 20v26h22" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M40 18c-8 0-12 5-12 12s4 12 12 12" fill="none" stroke="#F6E7D8" stroke-width="4" stroke-linecap="round"/>'},
  stride: {bg:'#0E7C66', mark:'<path d="M16 20l14 12-14 12M32 20l14 12-14 12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'},
  'footwork': {bg:'#3355D8', mark:'<rect x="15" y="15" width="14" height="14" rx="5" fill="#fff"/><rect x="35" y="15" width="14" height="14" rx="7" fill="#fff" opacity=".65"/><rect x="15" y="35" width="14" height="14" rx="7" fill="#fff" opacity=".65"/><rect x="35" y="35" width="14" height="14" rx="5" fill="#fff"/>'},
  'little-feet': {bg:'#E0A21A', mark:'<ellipse cx="25" cy="38" rx="9" ry="13" transform="rotate(-18 25 38)" fill="#fff"/><circle cx="22" cy="21" r="3" fill="#fff"/><circle cx="30" cy="19" r="3" fill="#fff"/><circle cx="37" cy="21" r="2.6" fill="#fff"/><ellipse cx="48" cy="48" rx="4" ry="6" fill="#fff" opacity=".6"/>'},
  'urban-trekker': {bg:'#56633B', mark:'<path d="M11 48l15-24 8 12 6-8 13 20z" fill="#fff"/><circle cx="46" cy="21" r="5" fill="#F3E3BD"/>'},
  'miller-and-sons': {bg:'#1D3B33', mark:'<path d="M15 47V18l17 16 17-16v29" fill="none" stroke="#F1E7CF" stroke-width="4.5" stroke-linejoin="round"/><path d="M23 47V36h18v11" fill="none" stroke="#F1E7CF" stroke-width="3" opacity=".55"/>'}
};
for (const [name, {bg, mark}] of Object.entries(logos)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${name.replace(/-/g,' ')} logo"><rect width="64" height="64" rx="18" fill="${bg}"/>${mark}</svg>\n`;
  fs.writeFileSync(`assets/images/icons/logo-${name}.svg`, svg);
}
fs.writeFileSync('assets/images/icons/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#E8452C"/><path d="M14 40c7-13 14-4 22-15 5-7 11-1 14-6" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="48" cy="45" r="4" fill="#fff"/></svg>\n`);
fs.writeFileSync('assets/images/icons/placeholder.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" fill="#F1EDE5"/><path d="M170 520c70-40 90-150 175-150 55 0 65 60 120 60 40 0 60-40 145-30" fill="none" stroke="#C9BFB1" stroke-width="12" stroke-linecap="round"/><circle cx="600" cy="220" r="55" fill="#E3D9C8"/><text x="400" y="640" text-anchor="middle" font-family="Georgia,serif" font-size="44" fill="#8C8172">Image coming soon</text></svg>\n`);
fs.copyFileSync('assets/images/banners/hero-1.jpg', 'assets/images/banners/og-default.jpg');
console.log('logos + icons written');
