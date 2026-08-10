#!/usr/bin/env node
/* 数据构建：读取 data-src 与 data/ 源文件，生成合并后的 data/*.js
 * 用法：node tools/build-data.mjs [domain...]   （不传参数 = 构建全部域）
 * 数据来源与口径标注见 docs/数据整理方案.md
 */
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const ctx = { window: {}, console };
vm.createContext(ctx);

function load(file) {
  vm.runInContext(readFileSync(file, "utf8"), ctx, { filename: file });
}

function dump(name, value, header) {
  return `${header}window.${name} = ${JSON.stringify(value)};\n`;
}

const DOMAINS = {
  lines: {
    out: "data/lines.js",
    header: "// 数据来源：浙江省教育考试院官方投档线（2021-2026），tools/build-data.mjs 合并生成\n",
    build() {
      const years = ["2021", "2022", "2023", "2024", "2025", "2026"];
      for (const y of years) load(`data/lines-${y}.js`);
      const obj = {};
      for (const y of years) obj[y] = ctx.window[`GK_LINES_${y}`] || [];
      return dump("GK_LINES", obj, this.header);
    },
  },
};

const targets = process.argv.slice(2);
const names = targets.length ? targets : Object.keys(DOMAINS);
for (const n of names) {
  const d = DOMAINS[n];
  if (!d) throw new Error(`unknown domain: ${n}`);
  writeFileSync(d.out, d.build());
  console.log(`built ${d.out}`);
}
