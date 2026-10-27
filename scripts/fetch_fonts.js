const fs = require('fs');
const https = require('https');
const cssUrl = 'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Instrument+Serif:ital@0;1&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
function get(url, binary=false) {
  return new Promise((resolve,reject)=>{
    https.get(url, {headers:{'User-Agent':UA}}, res => {
      if (res.statusCode !== 200) return reject(new Error(url + ' -> ' + res.statusCode));
      const chunks=[]; res.on('data',c=>chunks.push(c)); res.on('end',()=>resolve(binary?Buffer.concat(chunks):Buffer.concat(chunks).toString('utf8')));
    }).on('error',reject);
  });
}
(async()=>{
  const css = await get(cssUrl);
  fs.writeFileSync('scripts/fonts.css', css);
  const blocks = css.split('@font-face').slice(1);
  const wanted = [];
  for (const b of blocks) {
    if (!/latin\b/.test(b) && !/unicode-range:\s*U\+0000-00FF/.test(b)) continue;
    const family = (b.match(/font-family:\s*'([^']+)'/)||[])[1];
    const weight = (b.match(/font-weight:\s*([^;]+);/)||[])[1];
    const style = (b.match(/font-style:\s*([^;]+);/)||[])[1] || 'normal';
    const src = (b.match(/url\((https:[^)]+)\)/)||[])[1];
    if (family && src && !wanted.some(w=>w.family===family && w.weight===weight && w.style===style)) wanted.push({family, weight, style, src});
  }
  console.log('faces', wanted.length, wanted.map(w=>w.family+' '+w.weight+' '+w.style));
  let out = '';
  for (const f of wanted) {
    const slug = f.family.toLowerCase().replace(/\s+/g,'-') + '-' + f.weight.replace(/\s+/g,'') + (f.style==='italic'?'-italic':'');
    const file = `assets/fonts/${slug}.woff2`;
    fs.writeFileSync(file, await get(f.src, true));
    out += `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url('../${file}') format('woff2');}\n`;
    console.log(file);
  }
  fs.writeFileSync('css/fonts.css', '/* Locally bundled open-source fonts (SIL OFL). */\n' + out);
})().catch(e=>{console.error(e);process.exit(1)});
