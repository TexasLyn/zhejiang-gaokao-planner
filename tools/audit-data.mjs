#!/usr/bin/env node
/* 数据审计：检查 data/ 每个文件的全局是否被页面加载、被 js 引用，输出死数据与缺失引用。
 * 用法：node tools/audit-data.mjs
 */
import { readFileSync, statSync, readdirSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const loaded = [...html.matchAll(/data\/([A-Za-z0-9_-]+\.js)/g)].map((m) => m[1]);
const jsCode = readdirSync("js")
  .filter((f) => f.endsWith(".js"))
  .map((f) => readFileSync(`js/${f}`, "utf8"))
  .join("\n");

const rows = [];
for (const f of loaded) {
  const src = readFileSync(`data/${f}`, "utf8");
  const globals = [...new Set([...src.matchAll(/window\.(GK_[A-Z0-9_]+)\s*=/g)].map((m) => m[1]))];
  const kb = Math.round(statSync(`data/${f}`).size / 1024);
  const refs = globals.map((g) => (jsCode.includes(g) ? 1 : 0));
  rows.push({ f, kb, globals, dead: refs.every((r) => r === 0) });
}

for (const r of rows) {
  console.log(
    `${r.dead ? "DEAD " : "ok   "} ${r.f.padEnd(22)} ${String(r.kb).padStart(6)}K  ${r.globals.join(",")}`
  );
}

const usedGlobals = [...new Set([...jsCode.matchAll(/window\.(GK_[A-Z0-9_]+)\b/g)].map((m) => m[1]))];
const defined = new Set(rows.flatMap((r) => r.globals));
const missing = usedGlobals.filter((g) => !defined.has(g));
if (missing.length) console.log("\nMISSING(js 引用但无数据文件定义):", missing.join(", "));
else console.log("\n引用完整性 OK");
