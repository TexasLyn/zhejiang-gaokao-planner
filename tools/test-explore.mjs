import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 150)));
p.on("console", (m) => { if (m.type() === "error") errs.push("C:" + m.text().slice(0, 150)); });
await p.goto("http://127.0.0.1:8000/index.html", { waitUntil: "load" });
await p.waitForTimeout(1200);
await p.evaluate(() => { var ob = document.getElementById("onboarding"); if (ob) ob.hidden = true; var a = document.getElementById("app"); if (a) a.hidden = false; });
await p.evaluate(() => window.GK.goPage("explore"));
await p.waitForTimeout(300);
await p.evaluate(() => window.GK.explore.openSchool("浙江大学"));
await p.waitForTimeout(1800);
const r = await p.evaluate(() => {
  const d = document.getElementById("schoolDetail");
  const btn = d.querySelector("#sdToCog");
  return {
    sdToCog: !!btn,
    sdToCogVisible: btn ? btn.offsetParent !== null : false,
    transferText: (d.textContent.match(/转专业[^。]{0,30}/g) || []).slice(0, 3),
    transferLoaded: !!window.GK_TRANSFER_RULES,
    transferKeys: window.GK_TRANSFER_RULES ? Object.keys(window.GK_TRANSFER_RULES).length : 0,
    eliteBlock: !!(d.querySelector("#sdOverview .elite-grid")),
    eliteText: d.querySelector("#sdOverview .elite-grid") ? d.querySelector("#sdOverview .elite-grid").textContent.slice(0, 40) : "",
  };
});
console.log(JSON.stringify({ r, errs }));
await b.close();
