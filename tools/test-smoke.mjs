import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(6000);
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
await page.goto("file:///Users/texas/Documents/Codex的窝/高考志愿填报志愿排序系统/index.html", { waitUntil: "load" });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  var ob = document.getElementById("onboarding");
  if (ob) ob.hidden = true;
  var app = document.getElementById("app");
  if (app) app.hidden = false;
});
await page.waitForTimeout(200);
console.log("step1 skip done");

await page.evaluate(() => {
  window.GK.goPage("cognition");
  document.querySelectorAll(".cog-tab").forEach((t) => { if (t.getAttribute("data-cog") === "book") t.click(); });
});
await page.waitForTimeout(400);
console.log("step2 shelf");
const shelfCards = await page.$$eval(".book-shelf-card", (els) => els.length);
console.log("step3 cards", shelfCards);
await page.click('.book-shelf-card[data-shelf="arts"]');
await page.waitForTimeout(500);
console.log("errs now:", JSON.stringify(errs));
console.log("after click:", await page.evaluate(() => ({
  hasShelfBtn: !!document.getElementById("bookShelf"),
  title: (document.querySelector(".book-title") || {}).textContent || "",
  bodyHtml: (document.getElementById("cogBody") || {}).innerHTML ? document.getElementById("cogBody").innerHTML.slice(0, 80) : "NO BODY",
})));
const arts = await page.evaluate(() => ({
  title: (document.querySelector(".book-title") || {}).textContent || "",
  chs: document.querySelectorAll(".book-chapter").length,
}));
await page.click("#bookShelf");
await page.waitForTimeout(300);
console.log("step4 back");

await page.evaluate(() => {
  document.querySelectorAll(".cog-tab").forEach((t) => { if (t.getAttribute("data-cog") === "city") t.click(); });
});
await page.waitForTimeout(300);
console.log("step5 city list");
await page.click(".cog-city-card");
await page.waitForTimeout(600);
const city = await page.evaluate(() => ({
  cards: document.querySelectorAll(".cog-city-school").length,
  hasRank: !!(document.querySelector(".ccs-meta span") || {}).textContent && document.querySelector(".ccs-meta span").textContent.includes("软科"),
  hasBtn: document.querySelectorAll(".cog-school-explore").length,
}));
console.log(JSON.stringify({ shelfCards, arts, city, errs }));
await browser.close();
