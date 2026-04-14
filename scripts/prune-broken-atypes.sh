#!/usr/bin/env sh
# node_modules/@types içinde hiç .d.ts yoksa (bozuk kurulum) klasörü kaldırır.
# sh + POSIX find (Alpine BusyBox; bash gerekmez).
set -eu
AT_ROOT="${1:-node_modules/@types}"
if [ ! -d "$AT_ROOT" ]; then
  exit 0
fi
find "$AT_ROOT" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while IFS= read -r dir; do
  [ -d "$dir" ] || continue
  if ! find "$dir" -name "*.d.ts" 2>/dev/null | head -n 1 | grep -q .; then
    echo "prune-broken-atypes: removing empty types package: $dir" >&2
    rm -rf "$dir"
  fi
done
