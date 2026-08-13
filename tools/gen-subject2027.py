#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 2027 选科要求变化数据（对比 2026 浙江招生，淘淘升学整理）
用法：python3 tools/gen-subject2027.py
输入：~/Downloads/2027年选考科目要求变化（对比2026年浙江招生） - 淘淘升学.xlsx
输出：data/2027-subject-change.js
"""
import json, os, re
import pandas as pd

SRC = os.path.expanduser("~/Downloads/2027年选考科目要求变化（对比2026年浙江招生） - 淘淘升学.xlsx")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

d = pd.read_excel(SRC)
rows = []
for _, r in d.iterrows():
    s = str(r["学校名称"]).strip()
    m = str(r["专业名称"]).strip()
    rows.append({
        "c": str(r["院校代号"]).strip().zfill(4),
        "s": s, "m": m,
        "o": str(r["26选考要求"]).strip(),
        "n": str(r["27选考要求"]).strip(),
    })
out = os.path.join(ROOT, "data", "2027-subject-change.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("// 2027 选科要求变化（对比 2026 浙江招生）· 淘淘升学整理 · 仅供参考，以 2027 官方文件为准\n"
            "window.GK_SUBJECT_CHANGE_2027 = %s;\n" % json.dumps(rows, ensure_ascii=False))
print("built", out, len(rows), "rows")
