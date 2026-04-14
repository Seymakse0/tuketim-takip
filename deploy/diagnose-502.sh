#!/usr/bin/env bash
# Sunucuda (SSH): 502 Bad Gateway — genelde Nginx 3005 bekler, Docker başka porta map edilmiştir.
# Kullanım: chmod +x deploy/diagnose-502.sh && ./deploy/diagnose-502.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
COMPOSE=(docker compose -f docker-compose.production.yml)
NGINX_EXPECT_PORT="3005"

echo "=== 0) Doğru compose dosyası ==="
echo "Sunucuda üretim: ${COMPOSE[*]} (127.0.0.1:${NGINX_EXPECT_PORT} → app:3000)"
echo "Yalnızca 'docker compose up' kullanırsanız docker-compose.yml (3000:3000) devre girer; port çakışması ve 502 yaşanabilir."
echo ""

echo "=== 1) Gerçek host portu (app konteyneri 3000 → sunucu) ==="
MAPPING=""
MAPPING=$("${COMPOSE[@]}" port app 3000 2>/dev/null) || true
if [[ -z "${MAPPING}" ]]; then
  echo "compose port app 3000 bilgisi yok (konteyner yok mu?). Elle: docker compose ps"
  HOST_PORT=""
else
  HOST_PORT="${MAPPING##*:}"
  echo "Harita: ${MAPPING}  → 127.0.0.1:${HOST_PORT}/health deneniyor"
  if curl -sS -o /dev/null -w "HTTP %{http_code}\n" --connect-timeout 3 "http://127.0.0.1:${HOST_PORT}/health"; then
    :
  else
    echo "❌ Bu porta curl başarısız."
  fi
  if [[ "${HOST_PORT}" != "${NGINX_EXPECT_PORT}" ]]; then
    echo ""
    echo "⚠️  UYUMSUZLUK: Nginx örneği (deploy/nginx-kitchen...) → 127.0.0.1:${NGINX_EXPECT_PORT}"
    echo "    Sizde uygulama → :${HOST_PORT}. Bu yüzden tarayıcıda 502 görürsünüz."
    echo ""
    echo "    Çözüm A (önerilen): repodaki gibi sadece localhost 3005 kullanın:"
    echo "      rm -f docker-compose.override.yml   # varsa ve portu değiştiriyorsa"
    echo "      grep -n ports docker-compose.production.yml   # 127.0.0.1:3005:3000 olmalı"
    echo "      ${COMPOSE[*]} up -d app --force-recreate"
    echo ""
    echo "    Çözüm B: Nginx'te proxy_pass http://127.0.0.1:${HOST_PORT}; yapın, nginx -t && reload."
  fi
fi

echo ""
echo "=== 2) Nginx'in beklediği port (${NGINX_EXPECT_PORT}) ==="
if [[ "${HOST_PORT:-}" == "${NGINX_EXPECT_PORT}" ]] || [[ -z "${HOST_PORT}" ]]; then
  curl -sS -o /dev/null -w "HTTP %{http_code}\n" --connect-timeout 3 "http://127.0.0.1:${NGINX_EXPECT_PORT}/health" || echo "❌ ${NGINX_EXPECT_PORT} kapalı."
else
  echo "(Atlandı — uygulama şu an :${HOST_PORT} üzerinde; yukarıdaki uyumsuzluğu giderin.)"
fi

echo ""
echo "=== 3) Docker compose ps ==="
"${COMPOSE[@]}" ps -a 2>&1 || echo "(docker compose çalışmadı)"

echo ""
echo "=== 4) app son loglar (40 satır) ==="
"${COMPOSE[@]}" logs --tail=40 app 2>&1 || true

echo ""
echo "=== 5) Otomatik onarım ==="
echo "  chmod +x deploy/fix-502.sh && ./deploy/fix-502.sh"
