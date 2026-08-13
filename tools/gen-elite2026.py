#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成重点院校详细档案（260805161159.xls，83 列）
用法：python3 tools/gen-elite2026.py
输出：data/elite-2026.js（window.GK_ELITE_2026，按 校代码|专业代码 数组）
"""
import json, os
import pandas as pd

SRC = os.path.expanduser("~/Downloads/260805161159.xls")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = pd.read_excel(SRC)
d = d.fillna("")

rows = []
for _, r in d.iterrows():
    hist = {}
    for y in [26, 25, 24, 23, 22, 21, 20, 19, 18, 17]:
        p = r.get("%d人" % y)
        s = r.get("%d分" % y)
        lr = r.get("%d位" % y)
        if p != "" or s != "" or lr != "":
            hist[str(y)] = [p if p != "" else None, s if s != "" else None, lr if lr != "" else None]
    row = {
        "c": str(r["院校代码"]).strip().zfill(4),
        "n": str(r["院校名称"]).strip(),
        "mc": str(r["专业代码"]).strip().zfill(3),
        "m": str(r["专业名称"]).strip(),
        "note": str(r["专业简注"]),
        "subj": [str(r["26选科"]), str(r["25选科"]), str(r["24选科"])],
        "dur": r["学制"], "prov": str(r["省份"]), "city": str(r["城市"]),
        "tuition": r["学费"],
        "hist": hist,
        "tui": [r.get("26推免"), r.get("25推免"), r.get("24推免")],
        "prank": [r.get("专业排名"), r.get("专业排名比例"), r.get("专业总数")],
        "plevel": str(r.get("专业水平")),
        "school": {"rk": r.get("院校排名"), "rkSoft": str(r.get("软科校排")), "assess": str(r.get("评估")),
                   "masters": r.get("校硕点"), "doctors": r.get("校博点"),
                   "mp": str(r.get("硕士专业")), "dp": str(r.get("博士专业"))},
        "courses": str(r.get("主要课程")), "career": str(r.get("就业方向")),
        "links": {"zs": str(r.get("招生章程")), "zhaosheng": str(r.get("学校招生信息")),
                  "vr": str(r.get("校园VR")), "bk": str(r.get("院校百科")), "jy": str(r.get("就业质量"))},
    }
    rows.append(row)

out = os.path.join(ROOT, "data", "elite-2026.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("// 重点院校详细档案（2026，用户提供 83 列明细）· 历年数据以官方为准\n"
            "window.GK_ELITE_2026 = %s;\n" % json.dumps(rows, ensure_ascii=False))
print("built", out, len(rows), "rows")
