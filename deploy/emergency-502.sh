#!/usr/bin/env bash
# Tek komut: 502 için override’ı yedekleyip uygulamayı 3005’te yeniden ayağa kaldırır (SSH).
# Kullanım (proje kökünde): chmod +x deploy/emergency-502.sh && ./deploy/emergency-502.sh
set -euo pipefail
export NONINTERACTIVE=1
export AUTO_BACKUP_OVERRIDE=1
SKIP_OVERRIDE_PROMPT=1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/fix-502.sh"
