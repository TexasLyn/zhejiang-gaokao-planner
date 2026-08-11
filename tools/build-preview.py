#!/usr/bin/env python3
"""生成预览上传专用版：单文件 <=5MB（拆分大 JS、剔除大字体），输出到 /private/tmp/预览上传版"""
import json, os, re, shutil, subprocess, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "/private/tmp/预览上传版"

def split_js(src, parts):
    """读 window.GK_X = <json>，按长度切 parts 段，每段独立定义（后续段用 concat/assign 合并）"""
    text = open(src, encoding="utf-8").read()
    m = re.search(r"window\.(GK_[A-Z0-9_]+)\s*=\s*", text)
    name = m.group(1)
    val = json.loads(text[m.end():].strip().rstrip(";"))
    if isinstance(val, list):
        n = len(val)
        segs = [val[i * n // parts:(i + 1) * n // parts] for i in range(parts)]
        outs = []
        for i, seg in enumerate(segs):
            body = json.dumps(seg, ensure_ascii=False)
            if i == 0:
                code = f"window.{name} = {body};"
            else:
                code = f"window.{name} = (window.{name} || []).concat({body});"
            outs.append(code)
    else:  # 对象：按键均分
        keys = list(val.keys())
        n = len(keys)
        outs = []
        for i in range(parts):
            ks = keys[i * n // parts:(i + 1) * n // parts]
            body = json.dumps({k: val[k] for k in ks}, ensure_ascii=False)
            if i == 0:
                code = f"window.{name} = {body};"
            else:
                code = f"window.{name} = Object.assign(window.{name} || {{}}, {body});"
            outs.append(code)
    return outs

def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    # 复制运行资源（跳过 .DS_Store 与 9.3MB 楷书字体）
    for item in ["index.html", "index-beta.html", "css", "js", "data", "assets"]:
        dst = os.path.join(OUT, item)
        if os.path.isdir(os.path.join(ROOT, item)):
            shutil.copytree(os.path.join(ROOT, item), dst,
                            ignore=shutil.ignore_patterns(".DS_Store", "腾祥铁山楷书简.ttf"))
        else:
            shutil.copy2(os.path.join(ROOT, item), dst)
    # 拆分大文件
    data = os.path.join(OUT, "data")
    for src, parts, out_names in [
        (os.path.join(ROOT, "data/library-2026.js"), 3, ["library-2026-1.js", "library-2026-2.js", "library-2026-3.js"]),
        (os.path.join(ROOT, "data/lines.js"), 3, ["lines-1.js", "lines-2.js", "lines-3.js"]),
    ]:
        codes = split_js(src, parts)
        os.remove(os.path.join(data, os.path.basename(src)))
        for code, fn in zip(codes, out_names):
            open(os.path.join(data, fn), "w", encoding="utf-8").write(
                "// 预览版拆分文件（tools/build-preview.py 生成）\n" + code + "\n")
    # 修改预览版 html 引用
    for html in ["index.html", "index-beta.html"]:
        p = os.path.join(OUT, html)
        s = open(p, encoding="utf-8").read()
        s = s.replace(
            '<script src="data/lines.js"></script>',
            '<script src="data/lines-1.js"></script>\n  <script src="data/lines-2.js"></script>\n  <script src="data/lines-3.js"></script>'
        )
        s = s.replace(
            '<script src="data/library-2026.js"></script>',
            '<script src="data/library-2026-1.js"></script>\n  <script src="data/library-2026-2.js"></script>\n  <script src="data/library-2026-3.js"></script>'
        )
        open(p, "w", encoding="utf-8").write(s)
    # 校验单文件大小
    big = []
    for dp, _, fns in os.walk(OUT):
        for fn in fns:
            p = os.path.join(dp, fn)
            if os.path.getsize(p) > 5 * 1024 * 1024:
                big.append(p)
    # 打包
    zpath = "/private/tmp/预览上传版.zip"
    if os.path.exists(zpath):
        os.remove(zpath)
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for dp, _, fns in os.walk(OUT):
            for fn in fns:
                p = os.path.join(dp, fn)
                z.write(p, os.path.relpath(p, OUT))
    print("OK" if not big else f"仍超限: {big}")
    print(f"输出目录: {OUT}\nzip: {zpath}")

if __name__ == "__main__":
    main()
