#!/usr/bin/env bash
# Canlı sunucuda: .env içindeki POSTGRES_PASSWORD ile PostgreSQL içindeki uygulama kullanıcı
# şifresini eşitler (volume ilk kurulduğundaki şifre ile .env sonradan değiştiyse bağlantı kopar).
# Kullanım (proje kökünden): chmod +x deploy/sync-postgres-password-production.sh && ./deploy/sync-postgres-password-production.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=deploy/lib-env.sh
source "$REPO_ROOT/deploy/lib-env.sh"

ENV_FILE="$REPO_ROOT/.env"
COMPOSE=(docker compose -f docker-compose.production.yml)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Hata: $ENV_FILE yok. Örn: cp .env.production.example .env" >&2
  exit 1
fi

POSTGRES_PASSWORD="$(_env_get "$ENV_FILE" POSTGRES_PASSWORD "")"
POSTGRES_USER="$(_env_get "$ENV_FILE" POSTGRES_USER tuketim)"

if [[ -z "${POSTGRES_PASSWORD}" ]]; then
  echo "Hata: .env içinde POSTGRES_PASSWORD tanımlı değil veya boş." >&2
  exit 1
fi

escape_sql() {
  local s="$1"
  s="${s//\'/\'\'}"
  printf '%s' "$s"
}

ESCAPED="$(escape_sql "${POSTGRES_PASSWORD}")"

echo "==> Veritabanı konteyneri ayakta mı kontrol ediliyor..."
"${COMPOSE[@]}" up -d db

echo "==> Kullanıcı \"${POSTGRES_USER}\" şifresi .env ile eşitleniyor..."
"${COMPOSE[@]}" exec -T db psql -U "${POSTGRES_USER}" -d postgres -v ON_ERROR_STOP=1 \
  -c "ALTER USER \"${POSTGRES_USER}\" WITH PASSWORD '${ESCAPED}';"

echo "==> Uygulama yeniden başlatılıyor (DATABASE_URL aynı şifreyi kullanır)..."
"${COMPOSE[@]}" up -d app

echo "Tamam. Test: curl -sI http://127.0.0.1:3005"
echo "Log: ${COMPOSE[*]} logs -f --tail=30 app"
