#!/usr/bin/env bash
# İlk kurulum (sunucuda, proje kökünden veya bu dosyayı çalıştırarak).
# Önkoşul: .env (/.env.production.example kopyası, POSTGRES_PASSWORD + APP_AUTH_* dolu)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=deploy/lib-build-safe.sh
source "$REPO_ROOT/deploy/lib-build-safe.sh"

COMPOSE=(docker compose -f docker-compose.production.yml)

if [[ ! -f .env ]]; then
  echo "Hata: $REPO_ROOT/.env yok. Örn: cp .env.production.example .env && düzenleyin." >&2
  exit 1
fi

echo "==> Veritabanı konteyneri başlatılıyor..."
"${COMPOSE[@]}" up -d db

echo "==> Migrate + seed (yalnızca ilk kurulum; canlı veride tekrar çalıştırmayın)..."
"${COMPOSE[@]}" --profile setup run --rm setup

echo "==> Uygulama başlatılıyor (ilk build varsa düşük öncelikle)..."
run_host_throttled_build "${COMPOSE[@]}" up -d app

echo "Son: http://127.0.0.1:3005"
echo "Nginx (kitchen domain): ./deploy/install-kitchen-nginx.sh (veya deploy/nginx-kitchen.voyagestars.com.example.conf elle)"
