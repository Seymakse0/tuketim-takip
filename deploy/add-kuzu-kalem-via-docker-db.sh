#!/usr/bin/env bash
# Host'ta Prisma olmadan kuzu kalem pirzola satırını ekler.
# Önkoşul: docker compose ile db ayakta; proje kökünde .env (POSTGRES_PASSWORD).
# Kullanım: ./deploy/add-kuzu-kalem-via-docker-db.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE=(docker compose -f docker-compose.production.yml)
SQL_FILE="$SCRIPT_DIR/sql/add-kuzu-kalem-pirzola.sql"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Hata: $SQL_FILE bulunamadı." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Hata: $REPO_ROOT/.env yok." >&2
  exit 1
fi

echo "==> db konteynerinin ayakta olduğundan emin olun (docker compose up -d db)"
"${COMPOSE[@]}" up -d db

echo "==> SQL uygulanıyor: add-kuzu-kalem-pirzola.sql"
"${COMPOSE[@]}" exec -T db psql -U tuketim -d tuketim_kontrol -v ON_ERROR_STOP=1 <"$SQL_FILE"

echo "Tamam. Uygulamayı yeniden başlatmaya gerek yok; sayfayı yenileyin."
