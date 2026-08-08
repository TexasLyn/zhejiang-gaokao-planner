#!/bin/bash
# 浙志愿 · 在线模式启动器：本地服务器 + 在线数据代理
cd "$(dirname "$0")"

PY=""
for c in python3 /usr/bin/python3 /usr/local/bin/python3 /opt/homebrew/bin/python3; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  osascript -e 'display alert "需要 Python 3" message "macOS 自带的 python3 不可用，请先安装 Python 3。"'
  exit 1
fi

if ! curl -s -o /dev/null --max-time 2 "http://127.0.0.1:8765/index.html"; then
  nohup "$PY" server.py 8765 > /tmp/浙志愿-server.log 2>&1 &
  sleep 1
fi

open "http://127.0.0.1:8765/index.html"
