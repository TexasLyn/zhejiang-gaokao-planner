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
  hasIntro: !!(document.querySelector(".ccs-intro") || {}).textContent,
}));

await page.evaluate(() => {
  document.querySelectorAll(".cog-tab").forEach((t) => { if (t.getAttribute("data-cog") === "life") t.click(); });
});
await page.waitForTimeout(300);
const dormQuick = await page.$(".cog-dorm-chip");
if (dormQuick) { await dormQuick.click(); await page.waitForTimeout(400); }
const dorm = await page.evaluate(() => ({
  chips: document.querySelectorAll(".cog-dorm-chip").length,
  cards: document.querySelectorAll(".cog-dorm-card").length,
  keys: document.querySelectorAll(".cog-dorm-k").length,
}));

await page.evaluate(() => window.GK.goPage("plan"));
await page.waitForTimeout(300);
const plan = await page.evaluate(() => ({
  empty: !!document.getElementById("planTableScroll") && document.getElementById("planTableScroll").classList.contains("is-empty"),
  cell: !!document.querySelector(".plan-empty-cell"),
  importBtn: (document.getElementById("btnImportPlan") || {}).className || "",
}));

const misc = await page.evaluate(() => ({
  nickBtn: !!document.getElementById("btnSaveNickname"),
}));

await page.evaluate(() => window.GK.goPage("profile"));
await page.waitForTimeout(400);
const vlog = await page.evaluate(() => {
  const body = document.getElementById("versionLogBody");
  if (!body) return { err: "no body" };
  const simple = body.querySelectorAll(".vl-simple").length;
  const detailBtn = document.querySelector('#versionLog .vl-switch-btn[data-vl="detail"]');
  if (detailBtn) detailBtn.click();
  const detail = body.querySelectorAll(".vl-detail").length;
  const fixes = body.querySelectorAll(".vl-fix").length;
  const hasBugId = !!body.querySelector(".vl-fix-id");
  return { simple, detail, fixes, hasBugId };
});

/* v2.1-s1 新功能检查 */
await page.evaluate(() => {
  window.GK.goPage("cognition");
  document.querySelectorAll(".cog-tab").forEach((t) => { if (t.getAttribute("data-cog") === "life") t.click(); });
});
await page.waitForTimeout(400);
const life = await page.evaluate(() => ({
  cats: document.querySelectorAll(".cog-life-cat").length,
  details: document.querySelectorAll(".cog-details").length,
  dormResult: (document.getElementById("cogDormResult") || {}).textContent ? document.getElementById("cogDormResult").textContent.slice(0, 20) : "",
  dormOrderOk: (function () {
    var t = document.getElementById("cogBody");
    if (!t) return false;
    var i1 = t.innerHTML.indexOf("宿舍速览"), i2 = t.innerHTML.indexOf("大学第一课");
    return i1 > 0 && i2 > 0 && i1 < i2;
  })(),
  navToggle: document.querySelectorAll(".nav-toggle").length,
}));
await page.evaluate(() => {
  var btn = document.querySelector(".cog-life-cat[data-cat='grad']");
  if (btn) btn.click();
});
await page.waitForTimeout(250);
const lifeSwitch = await page.evaluate(() => ({
  active: (document.querySelector(".cog-life-cat.is-active") || {}).textContent || "",
  details: document.querySelectorAll(".cog-details").length,
}));
await page.evaluate(() => window.GK.goPage("profile"));
await page.waitForTimeout(300);
const profileNew = await page.evaluate(() => ({
  modeBtns: document.querySelectorAll("#profileModeSeg .btn").length,
  layoutNew: document.getElementById("profileLayout").classList.contains("profile-new"),
  sidebarItems: document.querySelectorAll(".profile-sidebar .ps-item").length,
  heroCard: !!document.querySelector(".ps-hero"),
  quickCard: !!document.querySelector(".ps-quick"),
  icons: document.querySelectorAll(".profile-sidebar .ps-ic svg").length,
  heroName: (document.getElementById("poName") || {}).textContent || "",
  activePane: (document.querySelector(".pp-sec.is-active") || {}).getAttribute ? document.querySelector(".pp-sec.is-active").getAttribute("data-pane") : "",
  welcomeVisible: !!(document.querySelector('.pp-sec[data-pane="welcome"]') || {}).classList && document.querySelector('.pp-sec[data-pane="welcome"]').classList.contains("is-active"),
}));
await page.click('.profile-sidebar .ps-item[data-pane="archive"]');
await page.waitForTimeout(250);
profileNew.switched = await page.evaluate(() => ({
  active: (document.querySelector(".pp-sec.is-active") || {}).getAttribute ? document.querySelector(".pp-sec.is-active").getAttribute("data-pane") : "",
  archiveVisible: !!document.querySelector('.pp-sec[data-pane="archive"]').classList.contains("is-active"),
}));
const fixes2 = await page.evaluate(() => ({
  heroGlow: !!document.querySelector(".hero-glow"),
  bookToolbar: (function () {
    window.GK.goPage("cognition");
    document.querySelectorAll(".cog-tab").forEach((t) => { if (t.getAttribute("data-cog") === "book") t.click(); });
    return true;
  })(),
}));
await page.waitForTimeout(400);
await page.click('.book-shelf-card[data-shelf="cognition"]');
await page.waitForTimeout(500);
fixes2.bookToolbar = await page.evaluate(() => ({
  backBtn: !!document.getElementById("bookShelf"),
  crumb: (document.querySelector(".book-crumb") || {}).textContent || "",
}));
console.log(JSON.stringify({ life, lifeSwitch, profileNew, fixes2, vlog, errs }));
await browser.close();
