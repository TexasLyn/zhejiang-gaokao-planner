import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 530, height: 700 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 120)));
await p.goto("http://127.0.0.1:8000/index.html", { waitUntil: "load" });
await p.waitForTimeout(1200);
await p.evaluate(() => {
  var ob = document.getElementById("onboarding"); if (ob) ob.hidden = true;
  var a = document.getElementById("app"); if (a) a.hidden = false;
  window.GK.goPage("profile");
  document.documentElement.setAttribute("data-mode", "dark");
});
await p.waitForTimeout(500);
const r = await p.evaluate(() => {
  var list = document.querySelector(".ps-list");
  if (!list) return { err: "no list" };
  var lr = list.getBoundingClientRect();
  var sb = document.querySelector(".profile-sidebar");
  var sbr = sb.getBoundingClientRect();
  var st = getComputedStyle(list);
  return {
    listVisible: lr.bottom <= window.innerHeight + 1,
    listBottom: Math.round(lr.bottom), winH: window.innerHeight,
    sidebarOverflow: getComputedStyle(sb).overflowY,
    pageOverflow: getComputedStyle(document.getElementById("page-profile")).overflowY,
    radius: st.borderRadius,
    scrollable: sb.scrollHeight > sb.clientHeight,
  };
});
console.log(JSON.stringify({ r, errs }));
await b.close();
