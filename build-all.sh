#!/usr/bin/env bash
# Build every ERP Docker image one at a time to avoid OOM.
# Run from the workspace root: bash build-all.sh

set -euo pipefail

COMPOSE="docker compose -f erp-source/docker-compose.yml"

SERVICES=(
  # ── Backend ──────────────────────────────────────────
  core
  finance-svc
  apar-svc
  hr-svc
  sales-svc
  inventory-svc
  procurement-svc
  manufacturing-svc
  project-svc
  workflow-svc
  notification-svc
  files-svc
  integration-svc
  report-svc
  audit-svc
  notification-web
  # ── Frontend ─────────────────────────────────────────
  # erp-frontend
  # hr-frontend
  # finance-frontend
  # apar-frontend
  # inventory-frontend
  # procurement-frontend
  # manufacturing-frontend
  # sales-frontend
  # projects-frontend
  # reports-frontend
  # workflow-frontend
  # notifications-frontend
  # files-frontend
  # audit-frontend
  # integrations-frontend
)

TOTAL=${#SERVICES[@]}
FAILED=()

for i in "${!SERVICES[@]}"; do
  svc="${SERVICES[$i]}"
  n=$((i + 1))
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  [$n/$TOTAL] Building: $svc"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if $COMPOSE build "$svc" 2>&1; then
    echo "  ✔  $svc built successfully"
  else
    echo "  ✘  $svc FAILED"
    FAILED+=("$svc")
    # Continue building the rest; don't stop
  fi
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Build complete: $((TOTAL - ${#FAILED[@]}))/$TOTAL succeeded"
if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo "  Failed services:"
  for svc in "${FAILED[@]}"; do
    echo "    - $svc"
  done
  exit 1
fi
echo "  All images built. Run:"
echo "    docker compose -f erp-source/docker-compose.yml up -d"
echo "════════════════════════════════════════════════════════"
