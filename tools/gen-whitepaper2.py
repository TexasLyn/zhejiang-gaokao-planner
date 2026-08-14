#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""潮汐志愿 · 白皮书馆数据生成器（文科 + 计算机+）
用法：python3 tools/gen-whitepaper2.py
输入：docs/浙江文科白皮书-2021-2026.md、docs/计算机+白皮书-2021-2026.md
输出：data/whitepaper-arts.js、data/whitepaper-cs.js（结构同 GK_WHITEPAPER）
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def build(md_path, title, subtitle, var_name):
    src = open(md_path, encoding="utf-8").read()
    # 去掉「## 目录」章节（渲染器按 ## 分章，目录作为正文冗余）
    src = re.sub(r"##\s*目录\n(?:[^#\n][^\n]*\n)*", "", src)
    lines = src.splitlines()
    # 章节数与 majorMap（### 数字.数字 标题 → 专业名候选）
    chapters = sum(1 for ln in lines if re.match(r"^##\s", ln))
    major_map = {}
    skip_kw = ("光谱", "通道", "地图", "体系", "方法论", "识别器", "底稿", "展望", "综述",
               "信号", "锚点", "真相", "框架", "路径", "认知卡", "速查", "附录", "总图", "总表",
               "卷首", "目录", "前言", "读前", "说明", "决策", "规划", "时间线")
    for ln in lines:
        m = re.match(r"^###\s*(\d+\.\d+)[\s　]+(.+)$", ln)
        if not m:
            continue
        num, raw = m.group(1), m.group(2)
        name = re.split(r"[（(]", raw)[0].strip()
        if any(k in name for k in skip_kw) or len(name) < 3:
            continue
        majors = [x.strip() for x in re.split(r"[/、,，]", name) if x.strip()]
        major_map[num] = {"t": name, "majors": majors}
    obj = {
        "meta": {
            "title": title,
            "subtitle": subtitle,
            "updated": "2026-08-12",
            "lines": len(lines),
            "chapters": chapters,
        },
        "book": src,
        "majorMap": major_map,
    }
    out = os.path.join(ROOT, "data", var_name)
    with open(out, "w", encoding="utf-8") as f:
        gname = var_name.replace(".js", "").split("-")[-1].upper()
        f.write("// %s · 由 tools/gen-whitepaper2.py 生成，请勿手改\nwindow.GK_WHITEPAPER_%s = %s;\n" % (
            title, gname, json.dumps(obj, ensure_ascii=False)))
    print("built", out, "chapters:", chapters, "majorMap:", len(major_map))

build(os.path.join(ROOT, "docs/浙江文科白皮书-2021-2026.md"),
      "浙江文科白皮书（2021—2026）", "文科专属 · 专业 × 出路 × 院校 × 决策", "whitepaper-arts.js")
build(os.path.join(ROOT, "docs/计算机+白皮书-2021-2026.md"),
      "计算机+ 白皮书（2021—2026）", "泛计算机 · 光谱 × 就业 × 深造 × 决策", "whitepaper-cs.js")
build(os.path.join(ROOT, "docs/省里or省外-2021-2026.md"),
      "省里or省外：浙江考生的省内外抉择（2021—2026）", "出省不出省 × 浙大情结 × 同分段横评", "whitepaper-province.js")
