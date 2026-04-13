#!/usr/bin/env bash
# node_modules/@types içinde hiç .d.ts yoksa (bozuk kurulum) klasörü kaldırır.
# Böylece TypeScript örtük "type library" yüklerken estree/react vb. için dosya bulunamadı hatası vermez;
# React için projedeki env.d.ts devreye girer.
set -euo pipefail
AT_ROOT="${1:-node_modules/@types}"
if [[ ! -d "$AT_ROOT" ]]; then
  exit 0
fi
while IFS= read -r -d '' dir; do
  if [[ ! -d "$dir" ]]; then
    continue
  fi
  if ! find "$dir" -name "*.d.ts" -print -quit 2>/dev/null | grep -q .; then
    echo "prune-broken-atypes: removing empty types package: $dir" >&2
    rm -rf "$dir"
  fi
done < <(find "$AT_ROOT" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)
