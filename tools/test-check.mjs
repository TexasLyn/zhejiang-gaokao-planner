import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
await p.goto("http://127.0.0.1:8000/index.html", { waitUntil: "load" });
await p.waitForTimeout(1500);
await p.evaluate(() => {
  var ob = document.getElementById("onboarding");
  if (ob) ob.hidden = true;
  var app = document.getElementById("app");
  if (app) app.hidden = false;
});

// 1. 认知-高校认知 卡片重点档案徽章
await p.evaluate(() => {
  window.GK.goPage("cognition");
  document.querySelectorAll(".cog-tab").forEach((t) => { if (t.getAttribute("data-cog") === "school") t.click(); });
});
await p.waitForTimeout(600);
const cog = await p.evaluate(() => ({
  cards: document.querySelectorAll(".cog-card.cog-school").length,
  elitePills: document.querySelectorAll(".cog-pill-elite").length,
  firstCard: (document.querySelector(".cog-card.cog-school") || {}).textContent ? document.querySelector(".cog-card.cog-school").textContent.slice(0, 40) : "",
}));
// 打开认知详情弹窗，查互通按钮
await p.click(".cog-card.cog-school [data-detail]").catch(() => {});
await p.waitForTimeout(400);
cog.toExploreBtn = await p.evaluate(() => !!document.getElementById("cogToExplore"));
await p.keyboard.press("Escape");

// 2. 探索详情互通按钮
await p.evaluate(() => window.GK.goPage("explore"));
await p.waitForTimeout(400);
await p.evaluate(() => {
  if (window.GK.explore && window.GK.explore.openSchool) window.GK.explore.openSchool("北京大学");
});
await p.waitForTimeout(500);
cog.sdToCog = await p.evaluate(() => !!document.querySelector("#sdToCog"));
await p.evaluate(() => { var d = document.getElementById("schoolDetail"); if (d) d.hidden = true; document.getElementById("exploreView").hidden = false; });

// 3. 个人中心 sidebar 底部
await p.evaluate(() => window.GK.goPage("profile"));
await p.waitForTimeout(400);
const side = await p.evaluate(() => {
  var sb = document.querySelector(".profile-sidebar");
  var list = document.querySelector(".ps-list");
  if (!sb || !list) return { err: "missing" };
  var sbr = sb.getBoundingClientRect(), lr = list.getBoundingClientRect();
  return {
    sidebarScroll: sb.scrollHeight, sidebarClient: sb.clientHeight,
    listBottomInSidebar: lr.bottom <= sbr.bottom + 1,
    listBottomGap: Math.round(lr.bottom - sbr.bottom),
    listRadius: getComputedStyle(list).borderRadius,
    scrollable: sb.scrollHeight > sb.clientHeight + 5,
  };
});
console.log(JSON.stringify({ cog, side, errs }));
await b.close();
