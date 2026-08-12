import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
await page.goto("file:///Users/texas/Documents/Codex的窝/高考志愿填报志愿排序系统/index.html", { waitUntil: "load" });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  var ob = document.getElementById("onboarding");
  if (ob) ob.hidden = true;
  var app = document.getElementById("app");
  if (app) app.hidden = false;
});
console.log("globals:", JSON.stringify(await page.evaluate(() => ({
  arts: typeof window.GK_WHITEPAPER_ARTS,
  cs: typeof window.GK_WHITEPAPER_CS,
  artsLen: (window.GK_WHITEPAPER_ARTS || {}).book ? window.GK_WHITEPAPER_ARTS.book.length : 0,
}))));
const r = await page.evaluate(() => {
  var out = {};
  ["cognition", "arts", "cs"].forEach((k) => {
    try { window.GK.whitepaper.setBook(k); out[k] = "ok:" + ((document.querySelector(".book-title") || {}).textContent || ""); }
    catch (e) { out[k] = "ERR: " + String(e).slice(0, 200); }
  });
  return out;
});
console.log(JSON.stringify({ r, errs: errs.slice(0, 6) }));
await browser.close();
