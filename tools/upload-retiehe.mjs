#!/usr/bin/env node
/* 直连热铁盒官方 API 上传整个目录（等价于官方 CLI 的 deploy）。
 * 用法：RTH_API_KEY=xxx node tools/upload-retiehe.mjs <目录> <站点子域名>
 * 参考：https://docs.retiehe.com/host/auto-deploy.html
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

const key = process.env.RTH_API_KEY;
if (!key) { console.error("缺少 RTH_API_KEY"); process.exit(1); }
const dir = process.argv[2];
const site = process.argv[3];
if (!dir || !site) { console.error("用法: node tools/upload-retiehe.mjs <目录> <子域名>"); process.exit(1); }

const API = "https://api-overseas.retiehe.com/backend";

async function call(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { Authorization: "Bearer " + key, ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${path} -> HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function walk(d, base) {
  const out = [];
  for (const name of readdirSync(d)) {
    if (name.startsWith(".")) continue;
    const p = join(d, name);
    const rel = posix.join(base, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, rel));
    else out.push(rel);
  }
  return out;
}

const files = walk(dir, "");
console.log(`共 ${files.length} 个文件`);
let ok = 0;
for (const rel of files) {
  const fd = new FormData();
  fd.append("content", new Blob([readFileSync(join(dir, rel))]));
  fd.append("domain", site);
  fd.append("key", rel);
  fd.append("type", "object");
  await call("/host-v3/site/content", { method: "POST", body: fd });
  ok++;
  if (ok % 20 === 0 || ok === files.length) console.log(`${ok}/${files.length}`);
}
console.log(`上传完成 ${ok}/${files.length}`);
