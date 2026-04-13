#!/usr/bin/env bash
# Sunucuda (SSH): 502 Bad Gateway teşhisi — Nginx ayakta ama arkası (Docker app) boş.
# Kullanım: chmod +x deploy/diagnose-502.sh && ./deploy/diagnose-502.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
COMPOSE=(docker compose -f docker-compose.production.yml)

echo "=== 1) 127.0.0.1:3005 (Docker app) ==="
if curl -sS -o /dev/null -w "HTTP %{http_code}\n" --connect-timeout 3 http://127.0.0.1:3005/health; then
  :
else
  echo "❌ 3005 yanıt yok veya bağlantı reddedildi → uygulama konteyneri çalışmıyor olabilir."
fi

echo ""
echo "=== 2) Docker compose ps ==="
"${COMPOSE[@]}" ps -a 2>&1 || echo "(docker compose çalışmadı — kurulu mu?)"

echo ""
echo "=== 3) app konteyneri son loglar (50 satır) ==="
"${COMPOSE[@]}" logs --tail=50 app 2>&1 || true

echo ""
echo "=== 4) Önerilen komutlar (çalışmıyorsa) ==="
echo "  cd $REPO_ROOT && git pull"
echo "  test -f .env || (echo 'Hata: .env yok'; cp .env.production.example .env; exit 1)"
echo "  ${COMPOSE[*]} up -d db"
echo "  ${COMPOSE[*]} build app && ${COMPOSE[*]} up -d app"
echo "  curl -sI http://127.0.0.1:3005/health"
