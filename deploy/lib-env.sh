#!/usr/bin/env bash
# Proje kökündeki .env dosyasından KEY= değerini okur (= içeren değerler desteklenir).
# Kullanım: source deploy/lib-env.sh && _env_get "$REPO_ROOT/.env" POSTGRES_USER tuketim

_env_get() {
  local file="$1"
  local key="$2"
  local default="${3:-}"
  local line val
  [[ -f "$file" ]] || { printf '%s' "$default"; return 0; }
  line="$(grep -m1 "^${key}=" "$file" 2>/dev/null)" || true
  [[ -z "$line" ]] && { printf '%s' "$default"; return 0; }
  val="${line#*=}"
  val="$(printf '%s' "$val" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//')"
  [[ -z "$val" ]] && printf '%s' "$default" || printf '%s' "$val"
}
