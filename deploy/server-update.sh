#!/usr/bin/env bash
# Yayına kod çekip uygulama imajını yenileme (gate.voyagestars.com benzeri günlük akış).
# Kullanım: ./deploy/server-update.sh
# Önbelleksiz build: NO_CACHE=1 ./deploy/server-update.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE=(docker compose -f docker-compose.production.yml)

if [[ ! -f .env ]]; then
  echo "Hata: $REPO_ROOT/.env yok." >&2
  exit 1
fi

echo "==> git pull"
git pull

if [[ "${NO_CACHE:-}" == "1" ]]; then
  echo "==> docker compose build --no-cache app"
  "${COMPOSE[@]}" build --no-cache app
else
  echo "==> docker compose build app"
  "${COMPOSE[@]}" build app
fi

echo "==> docker compose up -d --force-recreate app"
"${COMPOSE[@]}" up -d --force-recreate app

echo "==> /health (127.0.0.1:3005) bekleniyor…"
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if curl -sf --connect-timeout 3 --max-time 10 "http://127.0.0.1:3005/health" >/dev/null; then
    echo "OK: uygulama ayakta."
    echo "Tamam. Log: docker compose -f docker-compose.production.yml logs -f --tail=50 app"
    exit 0
  fi
  echo "   deneme $i/12 (ilk açılış 1–2 dk sürebilir)…"
  sleep 10
done
echo "❌ /health yanıt vermedi — 502 devam edebilir. Sunucuda:" >&2
echo "   NONINTERACTIVE=1 AUTO_BACKUP_OVERRIDE=1 ./deploy/fix-502.sh" >&2
"${COMPOSE[@]}" logs --tail=60 app 2>&1 || true
exit 1
