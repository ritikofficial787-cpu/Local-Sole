/* Headless Chrome mobile QA: captures screenshots and layout metrics at 390px.
   Usage: node scripts/qa_mobile.js [baseUrl]
   Requires a local Chrome install. Output goes to the OS temp folder. */
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223;
const BASE = process.argv[2] || "http://127.0.0.1:8000/";
const OUT = path.join(os.tmpdir(), "local-sole-mobile");
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ["home", "index.html"],
  ["products", "products.html"],
  ["product", "product.html?id=nike-pegasus-41"],
  ["shops", "shops.html"],
  ["shop", "shop.html?id=sole-theory"],
  ["cart", "cart.html"],
  ["checkout", "checkout.html"],
  ["account", "account.html"],
  ["owner", "owner.html"]
];

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), "local-sole-cdp-profile")}`,
  "about:blank"
], { stdio: "ignore" });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {
      /* chrome still starting */
    }
    await wait(200);
  }
  throw new Error("Chrome did not expose a debugging target");
}

(async () => {
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true });

  const results = [];
  for (const [name, rel] of pages) {
    events.length = 0;
    await send("Page.navigate", { url: BASE + rel });
    await wait(1800);
    const { result } = await send("Runtime.evaluate", {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async()=>{
        await new Promise(r=>setTimeout(r,900));
        const vw = document.documentElement.clientWidth;
        const offenders=[];
        document.querySelectorAll('body *').forEach(el=>{
          if (el.closest('.sr-only,.marquee')) return;
          const cs=getComputedStyle(el);
          const r=el.getBoundingClientRect();
          if (r.width>0 && (r.right>vw+1 || r.left<-1)) offenders.push({tag:el.tagName, cls:(el.className&&el.className.toString()).slice(0,60), pos:cs.position, left:Math.round(r.left), right:Math.round(r.right), w:Math.round(r.width)});
        });
        return {
          title: document.title,
          innerWidth, vw,
          outerWidth, visualWidth: visualViewport?.width,
          htmlW: Math.round(document.documentElement.getBoundingClientRect().width),
          bodyW: Math.round(document.body.getBoundingClientRect().width),
          scrollWidth: document.documentElement.scrollWidth,
          viewportMeta: document.querySelector('meta[name="viewport"]')?.content || '',
          hasHeader: !!document.querySelector('.site-header'),
          bottomNav: (()=>{
            const el=document.querySelector('.mobile-nav'); if(!el) return null;
            const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
            const ancestors=[]; let n=el.parentElement;
            while(n){ const s=getComputedStyle(n); if(s.transform!=='none'||s.filter!=='none'||s.perspective!=='none'||s.contain!=='none'||s.willChange!=='auto') ancestors.push({tag:n.tagName, cls:(n.className&&n.className.toString()).slice(0,40), transform:s.transform, filter:s.filter, contain:s.contain, willChange:s.willChange}); n=n.parentElement; }
            return {display:cs.display, position:cs.position, top:Math.round(r.top), bottom:Math.round(r.bottom), h:Math.round(r.height), offsetParent:el.offsetParent?.tagName, ancestors:ancestors.slice(0,5)};
          })(),
          h1: document.querySelector('h1')?.innerText || '',
          offenders: offenders.slice(0,10)
        };
      })()`
    });
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, `${name}-390.png`), Buffer.from(shot.data, "base64"));
    results.push({ name, ...result.value });
  }

  console.log(JSON.stringify({ out: OUT, results }, null, 2));
  ws.close();
  chrome.kill();
})().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
