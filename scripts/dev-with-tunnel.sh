#!/usr/bin/env bash
# dev-with-tunnel
#
# Starts the dev server and a Cloudflare quick tunnel, then prints the
# public webhook URL to configure in the Dodo sandbox dashboard:
#   Webhooks -> Create endpoint -> URL: <printed URL>/api/billing/webhook
#   Events: subscription.* + payment.*
#   Secret: the DODO_WEBHOOK_SECRET value from .env.local
#
# Usage: scripts/dev-with-tunnel.sh

set -euo pipefail

PORT="${PORT:-3000}"
TUNNEL_LOG="$(mktemp -t cloudflared.XXXXXX.log)"

cleanup() {
  [[ -n "${DEV_PID:-}" ]] && kill "$DEV_PID" 2>/dev/null || true
  [[ -n "${TUNNEL_PID:-}" ]] && kill "$TUNNEL_PID" 2>/dev/null || true
  rm -f "$TUNNEL_LOG"
}
trap cleanup EXIT INT TERM

echo "Starting dev server on http://localhost:$PORT ..."
pnpm dev >/dev/null 2>&1 &
DEV_PID=$!

echo "Starting Cloudflare tunnel ..."
cloudflared tunnel --url "http://localhost:$PORT" >"$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

TUNNEL_URL=""
for _ in $(seq 1 30); do
  TUNNEL_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)"
  [[ -n "$TUNNEL_URL" ]] && break
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "Tunnel exited early. Log:" >&2
    cat "$TUNNEL_LOG" >&2
    exit 1
  fi
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Timed out waiting for tunnel URL. Log:" >&2
  cat "$TUNNEL_LOG" >&2
  exit 1
fi

echo "Pointing Dodo webhook endpoint at tunnel ..."
set -a
source .env.local 2>/dev/null
set +a
pnpm exec tsx scripts/update-dodo-webhook.ts "$TUNNEL_URL"

cat <<EOF

Dev server:  http://localhost:$PORT
Tunnel:      $TUNNEL_URL
Webhook URL: $TUNNEL_URL/api/billing/webhook

Webhook endpoint auto-updated. Test checkout, then Ctrl+C stops everything.
EOF

wait "$DEV_PID"
