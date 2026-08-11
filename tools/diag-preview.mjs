import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");

const url = process.argv[2] || "https://zgaokao-planner.rth1.xyz/";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});
const page = await browser.newPage();
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 500)); });
page.on("pageerror", (e) => errs.push("PAGEERROR: " + String(e).slice(0, 500)));
page.on("requestfailed", (r) => errs.push("REQFAIL: " + r.url().slice(0, 200) + " " + (r.failure()?.errorText || "")));
await page.goto(url, { waitUntil: "load", timeout: 60000 }).catch((e) => errs.push("GOTO: " + e.message));
await page.waitForTimeout(8000);
const state = await page.evaluate(() => ({
  title: document.title,
  ready: document.readyState,
  bodyLen: (document.body && document.body.innerText || "").length,
  hasGK: !!window.GK,
  gkKeys: window.GK ? Object.keys(window.GK).slice(0, 20) : [],
  lines: window.GK_LINES ? Object.keys(window.GK_LINES).join(",") : "undefined",
  lib: window.GK_LIBRARY_2026 ? window.GK_LIBRARY_2026.length : "undefined",
  scripts: [...document.scripts].map((s) => s.src).filter(Boolean),
}));
console.log(JSON.stringify(state, null, 1));
console.log("ERRORS(" + errs.length + "):\n" + errs.slice(0, 30).join("\n"));
await page.screenshot({ path: "/private/tmp/zgk.png", fullPage: false });
await browser.close();
