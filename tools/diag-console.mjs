import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/texas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto("https://host.retiehe.com/", { waitUntil: "networkidle", timeout: 60000 }).catch((e) => console.log("GOTO:", e.message));
await page.waitForTimeout(3000);
const info = await page.evaluate(() => ({
  text: (document.body.innerText || "").slice(0, 3000),
  inputs: [...document.querySelectorAll("input")].map((i) => ({ type: i.type, ph: i.placeholder })),
  buttons: [...document.querySelectorAll("button")].slice(0, 20).map((b) => b.innerText.trim()),
  links: [...document.querySelectorAll("a")].slice(0, 20).map((a) => a.innerText.trim() + " -> " + a.href),
}));
console.log(JSON.stringify(info, null, 1));
await browser.close();
