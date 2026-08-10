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
  assess: {
    out: "data/assess.js",
    header: "// 学科评估：第四轮官方 / 第五轮网络整理版（含官宣与元信息），tools/build-data.mjs 合并生成\n",
    build() {
      load("data/assess-4th.js");
      load("data/assess-5th.js");
      return dump(
        "GK_ASSESS",
        {
          "4th": ctx.window.GK_ASSESS_4TH || {},
          "5th": ctx.window.GK_ASSESS_5TH || {},
          "5thOfficial": ctx.window.GK_ASSESS_5TH_OFFICIAL || {},
          "5thMeta": ctx.window.GK_ASSESS_5TH_META || {},
        },
        this.header
      );
    },
  },
  ranks: {
    out: "data/ranks.js",
    header: "// 排名数据：软科2026/ARWU2025/QS2026/最好学科2025/专业A+，tools/build-data.mjs 合并生成\n",
    build() {
      for (const f of [
        "rank-bcur2026.js",
        "rank-arwu2025.js",
        "rank-qs2026.js",
        "rank-bcsr2025.js",
        "ruanke-major.js",
      ])
        load(`data/${f}`);
      return dump(
        "GK_RANKS",
        {
          bcur: ctx.window.GK_RANK_BCUR || [],
          arwu: ctx.window.GK_RANK_ARWU || [],
          qs: ctx.window.GK_RANK_QS2026 || [],
          bcsr: ctx.window.GK_RANK_BCSR || {},
          ruanke: ctx.window.GK_RUANKE_MAJOR || [],
        },
        this.header
      );
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
