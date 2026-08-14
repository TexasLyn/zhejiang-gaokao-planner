import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage();
await p.goto("http://127.0.0.1:8000/index.html", { waitUntil: "load" });
await p.waitForTimeout(1200);
await p.evaluate(() => { var ob = document.getElementById("onboarding"); if (ob) ob.hidden = true; var a = document.getElementById("app"); if (a) a.hidden = false; window.GK.goPage("cognition"); document.querySelectorAll(".cog-tab").forEach((t) => { if (t.getAttribute("data-cog") === "book") t.click(); }); });
await p.waitForTimeout(500);
const r = await p.evaluate(() => ({
  shelfCards: document.querySelectorAll(".book-shelf-card").length,
  names: [...document.querySelectorAll(".bs-name")].map((e) => e.textContent),
  hasProvince: !!window.GK_WHITEPAPER_PROVINCE,
  err: window.GK_WHITEPAPER_PROVINCE ? window.GK_WHITEPAPER_PROVINCE.meta.title : "",
}));
console.log(JSON.stringify(r));
await b.close();
