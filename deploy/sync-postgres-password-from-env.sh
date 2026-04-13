#!/usr/bin/env bash
# .env içindeki POSTGRES_PASSWORD değerini PostgreSQL'deki tuketim kullanıcısına yazar.
# docker compose kullanmaz (APP_AUTH_* eksikken compose hata vermesin diye); doğrudan db konteynerine exec eder.
#
#   chmod +x deploy/sync-postgres-password-from-env.sh
#   ./deploy/sync-postgres-password-from-env.sh
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f .env ]]; then
  echo ".env yok. Örnek: cp .env.production.example .env" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source .env
set +a

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "POSTGRES_PASSWORD boş." >&2
  exit 1
fi

# Bu proje klasör adıyla oluşan isim: tuketim-takip-db-1
PROJ=$(basename "$PWD")
DB_CONTAINER="${PROJ}-db-1"
if ! docker exec "$DB_CONTAINER" true 2>/dev/null; then
  DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E -- '-db-[0-9]+$' | head -n1 || true)
fi
if [[ -z "${DB_CONTAINER:-}" ]]; then
  echo "PostgreSQL konteyneri bulunamadı (ör. ${PROJ}-db-1). Önce: docker compose -f docker-compose.production.yml up -d db" >&2
  exit 1
fi

esc_sql() {
  printf '%s' "$1" | sed "s/'/''/g"
}
SQL_PWD="$(esc_sql "$POSTGRES_PASSWORD")"
SQL="ALTER USER tuketim WITH PASSWORD '${SQL_PWD}';"

if docker exec -i "$DB_CONTAINER" psql -U tuketim -d tuketim_kontrol -v ON_ERROR_STOP=1 -c "$SQL"; then
  echo "OK: tuketim şifresi .env ile eşitlendi ($DB_CONTAINER)."
elif docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$SQL"; then
  echo "OK: postgres süper kullanıcı ile eşitlendi ($DB_CONTAINER)."
else
  echo "Hata: psql başarısız. db ayakta mı? docker ps" >&2
  exit 1
fi

echo ""
echo "Sonraki adım: .env içinde APP_AUTH_SECRET ve APP_AUTH_USERS (veya JSON) tanımlı olsun; uygulama ortamını yenilemek için:"
echo "  docker compose -f docker-compose.production.yml up -d --force-recreate app"
echo "Kontrol: curl -s \"http://127.0.0.1:3005/health?db=1\""
