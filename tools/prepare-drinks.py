#!/usr/bin/env python3
"""赞助饮品素材整理：拷贝、裁剪（美式右裁）、统一 640x640 透明画布居中。
源文件：用户提供的 clipboard PNG；输出：assets/sponsor/drink-N.png"""
import os
from PIL import Image

SRC = "/var/folders/d4/358g50tx1sb1mmgyb8v2kpc00000gn/T"
OUT = "assets/sponsor"
os.makedirs(OUT, exist_ok=True)

DRINKS = [
    ("codex-clipboard-339fd849-6b67-481c-a295-47a4776d55f6.png", "drink-1.png", False),  # 9.9 生椰拿铁
    ("codex-clipboard-8b861cfc-dbdf-48f2-97b9-5e4cce430df7.png", "drink-2.png", True),   # 7.9 美式（右裁）
    ("codex-clipboard-1d785d27-7838-4e08-b15e-a7bee86beb3a.png", "drink-3.png", False),  # 3.9 雪王柠檬水
    ("codex-clipboard-d3a5729f-7a24-4ed0-8f72-8fadea9d3aa6.png", "drink-4.png", False),  # 5.9 雪王大圣代
    ("codex-clipboard-679f7d53-9d31-4ffa-85ec-09135fc04a46.png", "drink-5.png", False),  # 29.9 星爸爸太妃榛果拿铁
    ("codex-clipboard-c55f36ea-f566-4450-900f-71fa2b23daf7.png", "drink-6.png", False),  # 15.9 茶颜幽兰拿铁
]

CANVAS = 640
for src_name, out_name, crop_right in DRINKS:
    p = os.path.join(SRC, src_name)
    img = Image.open(p).convert("RGBA")
    if crop_right:
        w, h = img.size
        img = img.crop((0, 0, int(w * 0.8), h))  # 右裁 20%，去掉露出的半杯
    img.thumbnail((560, 560), Image.LANCZOS)  # 等比缩至画布内
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(img, ((CANVAS - img.width) // 2, (CANVAS - img.height) // 2), img)
    canvas.save(os.path.join(OUT, out_name))
    print(out_name, img.size)
