#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""浙志愿本地服务器：静态托管 + 在线数据代理（掌上高考）。
用法：python3 server.py [端口，默认 8765]，浏览器打开 http://127.0.0.1:8765
"""
import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import os
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, ".cache")
os.makedirs(CACHE, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"}


def load_js_var(path):
    with open(path, encoding="utf-8") as f:
        txt = f.read()
    return json.loads(txt.split("= ", 1)[1].rsplit(";", 1)[0])


try:
    SCHOOL_IDS = load_js_var(os.path.join(ROOT, "data", "school-ids.js"))
except Exception:
    SCHOOL_IDS = {}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(u.query)
        if u.path == "/api/school-intro":
            self.school_intro(qs.get("name", [""])[0])
            return
        if u.path == "/api/logo":
            sid = SCHOOL_IDS.get(qs.get("name", [""])[0])
            self.json({"url": "https://static-data.gaokao.cn/upload/logo/%s.png" % sid if sid else ""})
            return
        super().do_GET()

    def json(self, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def school_intro(self, name):
        sid = SCHOOL_IDS.get(name)
        if not sid:
            self.json({"error": "no-id"})
            return
        cache_path = os.path.join(CACHE, "%s.json" % sid)
        if os.path.exists(cache_path) and time.time() - os.path.getmtime(cache_path) < 86400 * 30:
            try:
                self.json({"data": json.load(open(cache_path, encoding="utf-8"))})
                return
            except Exception:
                pass
        try:
            req = urllib.request.Request(
                "https://static-data.gaokao.cn/www/2.0/school/%s/info.json" % sid, headers=UA)
            with urllib.request.urlopen(req, timeout=15) as r:
                raw = r.read()
            d = json.loads(raw).get("data") or {}
            trimmed = {
                "content": (d.get("content") or "").strip()[:4000],
                "motto": (d.get("motto") or "").strip(),
                "site": (d.get("school_site") or d.get("site") or "").strip(),
                "intro_img": (d.get("intro_img_url") or "").strip(),
                "num_subject": d.get("num_subject"),
                "num_master": d.get("num_master"),
                "num_doctor": d.get("num_doctor"),
                "belong": (d.get("belong") or "").strip(),
                "phone": (d.get("school_phone") or "").strip(),
                "addr": (d.get("address") or "").strip(),
                "qs": d.get("qs_rank") or "",
                "us": d.get("us_rank") or "",
                "xueke": d.get("xueke_rank") or ""
            }
            try:
                json.dump(trimmed, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
            except Exception:
                pass
            self.json({"data": trimmed})
        except Exception as e:
            self.json({"error": str(e)})


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print("浙志愿本地服务器已启动： http://127.0.0.1:%d/index.html" % port)
        httpd.serve_forever()
