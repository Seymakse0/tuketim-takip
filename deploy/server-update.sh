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

echo "==> docker compose up -d app"
"${COMPOSE[@]}" up -d app

echo "Tamam. Log: docker compose -f docker-compose.production.yml logs -f --tail=50 app"
