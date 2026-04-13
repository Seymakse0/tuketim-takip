#!/usr/bin/env bash
# Sunucuda (Debian/Ubuntu tarzı Nginx): kitchen.voyagestars.com → 127.0.0.1:3005
#
# Kullanım (proje kökünden):
#   chmod +x deploy/install-kitchen-nginx.sh
#   ./deploy/install-kitchen-nginx.sh
#
# Önkoşullar:
#   - Docker uygulama ayakta: curl -sI http://127.0.0.1:3005
#   - TLS: Örnek conf Let's Encrypt yollarını kullanır. Dosya yoksa önce:
#       sudo certbot certonly --nginx -d kitchen.voyagestars.com
#     (veya ssl_certificate satırlarını düzenleyip bu betiği tekrar çalıştırın)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$REPO_ROOT/deploy/nginx-kitchen.voyagestars.com.example.conf"
SITE_NAME="kitchen.voyagestars.com"
SITES_AVAILABLE="/etc/nginx/sites-available/$SITE_NAME"
SITES_ENABLED="/etc/nginx/sites-enabled/$SITE_NAME"
CERT_LE="/etc/letsencrypt/live/$SITE_NAME/fullchain.pem"

if [[ ! -f "$SOURCE" ]]; then
  echo "Hata: $SOURCE bulunamadı." >&2
  exit 1
fi

if [[ ! -d /etc/nginx/sites-available || ! -d /etc/nginx/sites-enabled ]]; then
  echo "Hata: /etc/nginx/sites-available veya sites-enabled yok." >&2
  echo "Bu betik Debian/Ubuntu tarzı Nginx kurulumunu bekler." >&2
  exit 1
fi

SUDO=()
if [[ "$(id -u)" -ne 0 ]]; then
  SUDO=(sudo)
fi

if [[ ! -f "$CERT_LE" ]]; then
  echo "Uyarı: $CERT_LE yok — örnek yapılandırma bu yolu kullanır."
  if [[ ${#SUDO[@]} -gt 0 ]]; then
    echo "  sudo certbot certonly --nginx -d $SITE_NAME"
  else
    echo "  certbot certonly --nginx -d $SITE_NAME"
  fi
  echo "Sertifikayı oluşturduktan sonra bu betiği yeniden çalıştırın (nginx -t başarılı olmalı)."
  echo ""
fi

echo "==> $SITES_AVAILABLE güncelleniyor..."
"${SUDO[@]}" install -m 644 "$SOURCE" "$SITES_AVAILABLE"

echo "==> $SITES_ENABLED etkinleştiriliyor..."
"${SUDO[@]}" ln -sf "$SITES_AVAILABLE" "$SITES_ENABLED"

echo "==> nginx -t"
"${SUDO[@]}" nginx -t

echo "==> nginx reload"
"${SUDO[@]}" systemctl reload nginx

echo "Tamam: https://$SITE_NAME → proxy 127.0.0.1:3005"
echo "Cloudflare'de $SITE_NAME için gate'e yönlendiren kural olmamalı; DNS A kaydı bu sunucuya işaret etmeli."
