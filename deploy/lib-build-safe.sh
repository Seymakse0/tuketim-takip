#!/usr/bin/env bash
# Sunucuda docker compose build sırasında diğer siteleri (aynı VPS) OOM / CPU spike’ten korumak.
# Ana etki: Dockerfile içinde NODE_OPTIONS (build bellek sınırı).
# Burada ek olarak: düşük öncelik (nice/ionice) ve isteğe bağlı systemd scope.
# shellcheck source=deploy/lib-build-safe.sh
# Kullanım: source "$REPO_ROOT/deploy/lib-build-safe.sh"

export_docker_build_env() {
  export DOCKER_BUILDKIT=1
  export COMPOSE_DOCKER_CLI_BUILD=1
}

# Build komutunu çalıştır (örn. docker compose -f ... build app)
run_host_throttled_build() {
  export_docker_build_env
  if [[ -n "${SKIP_BUILD_THROTTLE:-}" ]]; then
    "$@"
    return
  fi
  if [[ "$(uname -s)" != "Linux" ]]; then
    nice -n 15 "$@"
    return
  fi
  # İsteğe bağlı: compose istemcisi + çocukları için cgroup (bazı kurulumlarda build yükünü yumuşatır)
  if [[ "${USE_SYSTEMD_BUILD_SCOPE:-1}" == "1" ]] && command -v systemd-run >/dev/null 2>&1 \
    && systemd-run --help 2>&1 | grep -qF MemoryMax; then
    local mem="${BUILD_SCOPE_MEMORY_MAX:-8G}"
    local cpu="${BUILD_SCOPE_CPU_QUOTA:-75%}"
    if systemd-run --scope -p MemoryMax="$mem" -p CPUQuota="$cpu" --quiet -- "$@"; then
      return
    fi
  fi
  if command -v ionice >/dev/null 2>&1; then
    nice -n 15 ionice -c2 -n7 "$@"
  else
    nice -n 15 "$@"
  fi
}
