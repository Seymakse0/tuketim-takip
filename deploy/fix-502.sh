#!/usr/bin/env bash
# Sunucuda 502 Bad Gateway için: db + app konteynerlerini doğru portla yeniden ayağa kaldırır.
# Kullanım (proje kökünde): chmod +x deploy/fix-502.sh && ./deploy/fix-502.sh
# Acil (override yedekle + yeniden kur): ./deploy/emergency-502.sh
#    veya: NONINTERACTIVE=1 AUTO_BACKUP_OVERRIDE=1 ./deploy/fix-502.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
COMPOSE=(docker compose -f docker-compose.production.yml)
EXPECTED_MAP="127.0.0.1:3005:3000"

echo "==> 502 onarımı — kitchen → Nginx → ${EXPECTED_MAP%%:*} (app konteyneri 3000)"
echo ""

if [[ ! -f .env ]]; then
  echo "Hata: .env bulunamadı: $REPO_ROOT/.env" >&2
  exit 1
fi

if [[ -f docker-compose.override.yml ]]; then
  echo "⚠️  docker-compose.override.yml var — portları değiştiriyorsa 502 nedeni olabilir."
  echo "    İçerik:"
  sed 's/^/    /' docker-compose.override.yml || true
  echo ""
  if [[ "${AUTO_BACKUP_OVERRIDE:-}" == "1" ]]; then
    mv -f docker-compose.override.yml docker-compose.override.yml.bak."$(date +%Y%m%d%H%M)"
    echo "→ Yedeklendi (AUTO_BACKUP_OVERRIDE=1)."
  elif [[ "${SKIP_OVERRIDE_PROMPT:-}" == "1" ]]; then
    :
  elif [[ -t 0 ]] && [[ "${NONINTERACTIVE:-}" != "1" ]]; then
    read -r -p "Geçici olarak devre dışı bırakılsın mı? (y/N) " ans
    if [[ "${ans:-}" =~ ^[yY]$ ]]; then
      mv -f docker-compose.override.yml docker-compose.override.yml.bak."$(date +%Y%m%d%H%M)"
      echo "→ Yedeklendi, tekrar deneyebilirsiniz."
    fi
  else
    echo "→ Override dokunulmadı. Acil durum: AUTO_BACKUP_OVERRIDE=1 ./deploy/fix-502.sh"
  fi
  echo ""
fi

if ! grep -q "127.0.0.1:3005:3000" docker-compose.production.yml 2>/dev/null; then
  echo "Uyarı: docker-compose.production.yml içinde 127.0.0.1:3005:3000 bekleniyordu; kontrol edin." >&2
fi

echo "==> docker compose up -d --build --force-recreate app"
echo "   (db bağımlılığı hazır olana kadar Compose bekler; ilk açılışta 1–2 dk sürebilir)"
"${COMPOSE[@]}" up -d --build --force-recreate app

echo "==> 5 sn bekleniyor…"
sleep 5

echo ""
echo "==> /health testi (127.0.0.1:3005)"
if curl -sS -f -o /tmp/tuketim-health.json --connect-timeout 5 --max-time 15 "http://127.0.0.1:3005/health"; then
  echo "OK:"
  head -c 200 /tmp/tuketim-health.json
  echo ""
else
  echo "❌ /health başarısız — log:"
  "${COMPOSE[@]}" logs --tail=80 app 2>&1 || true
  echo ""
  echo "İnceleme: ./deploy/diagnose-502.sh"
  rm -f /tmp/tuketim-health.json
  exit 1
fi
rm -f /tmp/tuketim-health.json

echo ""
echo "Tamam. Nginx tarafında:"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo "İstemci hâlâ 502 ise: Cloudflare Origin / DNS / başka siteye düşen server_name kontrol edin (README)."
echo "Canlı log: ${COMPOSE[*]} logs -f --tail=80 app"
