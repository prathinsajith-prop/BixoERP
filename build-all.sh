#!/usr/bin/env bash
# Build every ERP Docker image one at a time to avoid OOM.
# Run from the workspace root: bash build-all.sh [--no-cache]

set -uo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

# ── Options ───────────────────────────────────────────────────────────────────
NO_CACHE=""
for arg in "$@"; do
  [[ "$arg" == "--no-cache" ]] && NO_CACHE="--no-cache"
done

COMPOSE="docker compose -f erp-source/docker-compose.yml"
LOG_DIR="erp-source/build-logs"
mkdir -p "$LOG_DIR"

SERVICES=(
  # ── Backend (Node.js) ────────────────────────────────
  core finance-svc apar-svc hr-svc sales-svc
  project-svc workflow-svc
  notification-svc files-svc integration-svc report-svc
  notification-web
  # ── Frontend ─────────────────────────────────────────
  erp-frontend hr-frontend finance-frontend apar-frontend
  inventory-frontend procurement-frontend manufacturing-frontend
  sales-frontend projects-frontend reports-frontend workflow-frontend
  notifications-frontend files-frontend audit-frontend integrations-frontend
  # Skipped (Go):   inventory-svc audit-svc
  # Skipped (Java): procurement-svc manufacturing-svc
)

TOTAL=${#SERVICES[@]}
FAILED=()
PASSED=()

OVERALL_START=$(date +%s)

fmt_seconds() {
  local s=$1
  if (( s < 60 )); then printf "%ds" "$s"
  else printf "%dm%02ds" $((s/60)) $((s%60)); fi
}

print_header() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}║           ERP Docker Image Builder                      ║${RESET}"
  printf "${BOLD}${CYAN}║  %-56s║${RESET}\n" "$(date '+%Y-%m-%d %H:%M:%S')  •  $TOTAL services to build"
  [[ -n "$NO_CACHE" ]] && printf "${BOLD}${CYAN}║  %-56s║${RESET}\n" "Mode: --no-cache (clean build)"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}"
  echo ""
}

print_row() {
  local status="$1" svc="$2" dur="$3" n="$4"
  local icon color
  if [[ "$status" == "OK" ]]; then icon="✔"; color="$GREEN"
  else icon="✘"; color="$RED"; fi
  printf "  ${color}${BOLD}%s${RESET}  ${BOLD}%-30s${RESET}  ${DIM}%6s${RESET}  ${DIM}[%d/%d]${RESET}\n" \
    "$icon" "$svc" "$dur" "$n" "$TOTAL"
}

print_header

# ── Build loop ────────────────────────────────────────────────────────────────
for i in "${!SERVICES[@]}"; do
  svc="${SERVICES[$i]}"
  n=$((i + 1))
  LOG_FILE="$LOG_DIR/${svc}.log"

  printf "\n  ${BOLD}[%d/%d]${RESET}  ${CYAN}%-30s${RESET}  ${DIM}building...${RESET}" "$n" "$TOTAL" "$svc"

  t0=$(date +%s)
  # Remove existing image to avoid BuildKit "already exists" error with containerd image store
  docker image rm "erp-source-${svc}:latest" >/dev/null 2>&1 || true
  # shellcheck disable=SC2086
  if $COMPOSE build $NO_CACHE "$svc" >"$LOG_FILE" 2>&1; then
    dur=$(fmt_seconds $(( $(date +%s) - t0 )))
    PASSED+=("$svc")
    printf "\r"; print_row "OK" "$svc" "$dur" "$n"
  else
    dur=$(fmt_seconds $(( $(date +%s) - t0 )))
    FAILED+=("$svc")
    printf "\r"; print_row "FAIL" "$svc" "$dur" "$n"
    echo -e "     ${DIM}↳ log: $LOG_FILE${RESET}"
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL_DUR=$(fmt_seconds $(( $(date +%s) - OVERALL_START )))
PASSED_N=${#PASSED[@]}
FAILED_N=${#FAILED[@]}

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}"
printf "${BOLD}${CYAN}║  %-56s║${RESET}\n" "Build Summary  •  Total time: $TOTAL_DUR"
echo -e "${BOLD}${CYAN}╠══════════════════════════════════════════════════════════╣${RESET}"
printf "${BOLD}${GREEN}║  ✔  %-52s║${RESET}\n" "$PASSED_N passed"
if (( FAILED_N > 0 )); then
  printf "${BOLD}${RED}║  ✘  %-52s║${RESET}\n" "$FAILED_N failed"
fi
echo -e "${BOLD}${CYAN}╠══════════════════════════════════════════════════════════╣${RESET}"

if (( FAILED_N > 0 )); then
  printf "${BOLD}${RED}║  Failed services:%-39s║${RESET}\n" ""
  for svc in "${FAILED[@]}"; do
    printf "${RED}║    • %-51s║${RESET}\n" "$svc  →  ${LOG_DIR}/${svc}.log"
  done
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "  ${YELLOW}Tip: tail a log with:${RESET}"
  echo -e "    ${DIM}tail -50 ${LOG_DIR}/${FAILED[0]}.log${RESET}"
  echo ""
  exit 1
fi

echo -e "${BOLD}${CYAN}║  All images built. To start:${RESET}                           ${BOLD}${CYAN}║${RESET}"
echo -e "${BOLD}${CYAN}║${RESET}    docker compose -f erp-source/docker-compose.yml up -d ${BOLD}${CYAN}║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
