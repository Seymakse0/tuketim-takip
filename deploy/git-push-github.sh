#!/usr/bin/env bash
# Cursor / terminal kimlik penceresi açılmadan HTTPS push için.
# Kullanım (proje kökünden):
#   export GITHUB_USER=Seymakse0
#   export GITHUB_TOKEN=ghp_buraya_token
#   ./deploy/git-push-github.sh
#
# Token'ı asla commit etmeyin; iş bitince: unset GITHUB_TOKEN
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BRANCH="${1:-main}"
OWNER_REPO="${GITHUB_REPO:-Seymakse0/tuketim-takip}"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Hata: export GITHUB_TOKEN=ghp_..." >&2
  echo "      export GITHUB_USER=GitHubKullaniciAdiniz" >&2
  exit 1
fi
if [[ -z "${GITHUB_USER:-}" ]]; then
  echo "Hata: export GITHUB_USER=GitHubKullaniciAdiniz" >&2
  exit 1
fi

GIT_TERMINAL_PROMPT=0 git -c http.version=HTTP/1.1 \
  push "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${OWNER_REPO}.git" "$BRANCH"

echo "Tamam. Güvenlik için: unset GITHUB_TOKEN GITHUB_USER"
echo "GitHub'da sızan token varsa Personal access tokens → Revoke."
