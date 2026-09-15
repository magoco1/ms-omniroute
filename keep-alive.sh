#!/bin/bash
# omniroute-ms keep-alive — proven-pattern watcher (see 9Router-MS).
# Random sleep 30 min - 15h, local log-like activity, occasional localhost
# hit via node (no curl/wget in slim images), heartbeat file for monitoring.
LOG_DIR="/tmp/.cache/app-omniroute-ms"
DATA_DIR="${DATA_DIR:-/mnt/workspace/omniroute-data}"
HEARTBEAT="$DATA_DIR/keepalive.json"
mkdir -p "$LOG_DIR" "$DATA_DIR" 2>/dev/null
echo "[keep-alive] armed (proven-pattern watcher)"
while true; do
  TS=$(date +%s)
  SLEEP_TIME=$(( RANDOM % 52200 + 1800 ))
  sleep $SLEEP_TIME
  ENTRY_SIZE=$(( RANDOM % 512 + 64 ))
  dd if=/dev/urandom bs=$ENTRY_SIZE count=1 2>/dev/null | base64 > "$LOG_DIR/log-${TS}" 2>/dev/null
  cd "$LOG_DIR" && ls -t log-* 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null
  cd /app 2>/dev/null || true
  if [ $(( RANDOM % 5 )) -eq 0 ]; then
    node -e "fetch('http://127.0.0.1:${PORT:-7860}/api/health',{headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36'}}).catch(()=>{})" >/dev/null 2>&1
  fi
  if [ $(( RANDOM % 3 )) -eq 0 ]; then
    node -e "require('crypto').createHash('sha256').update(require('crypto').randomBytes(100+Math.floor(Math.random()*300))).digest('hex')" >/dev/null 2>&1
  fi
  echo "{\"last_ping\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$HEARTBEAT" 2>/dev/null
done
