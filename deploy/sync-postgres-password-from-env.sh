#!/usr/bin/env bash
# .env içindeki POSTGRES_PASSWORD değerini PostgreSQL'deki tuketim kullanıcısına yazar.
# Şifre uyuşmazlığında (health?db=1 → database_unreachable) sunucuda bir kez çalıştırın:
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

COMPOSE=(docker compose -f docker-compose.production.yml)

esc_sql() {
  printf '%s' "$1" | sed "s/'/''/g"
}
SQL_PWD="$(esc_sql "$POSTGRES_PASSWORD")"
SQL="ALTER USER tuketim WITH PASSWORD '${SQL_PWD}';"

if "${COMPOSE[@]}" exec -T db psql -U tuketim -d tuketim_kontrol -v ON_ERROR_STOP=1 -c "$SQL"; then
  echo "OK: tuketim şifresi .env ile eşitlendi."
elif "${COMPOSE[@]}" exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$SQL"; then
  echo "OK: postgres süper kullanıcı ile eşitlendi."
else
  echo "Hata: Konteyner içi psql başarısız. db ayakta mı? docker compose -f docker-compose.production.yml ps" >&2
  exit 1
fi

"${COMPOSE[@]}" up -d app
echo "Uygulama yenilendi. Kontrol: curl -s \"http://127.0.0.1:3005/health?db=1\""
