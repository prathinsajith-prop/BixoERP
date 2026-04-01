#!/bin/bash
set -e

COMPOSE_FILE="$(dirname "$0")/docker-compose.yml"

ALL_SERVICES=(
  erp-frontend
  hr-frontend
  finance-frontend
  apar-frontend
  inventory-frontend
  procurement-frontend
  manufacturing-frontend
  sales-frontend
  projects-frontend
  reports-frontend
  workflow-frontend
  notifications-frontend
  files-frontend
  audit-frontend
  integrations-frontend
)

# Usage: ./rebuild-front.sh [service-name]
# Examples:
#   ./rebuild-front.sh              → rebuilds ALL frontend services
#   ./rebuild-front.sh hr           → rebuilds hr-frontend only
#   ./rebuild-front.sh hr finance   → rebuilds hr-frontend and finance-frontend

if [ $# -eq 0 ]; then
  TARGETS=("${ALL_SERVICES[@]}")
else
  TARGETS=()
  for arg in "$@"; do
    # Accept "hr" or "hr-frontend" — normalize to "<name>-frontend"
    name="${arg%-frontend}-frontend"
    # erp-frontend is special (core app is just "erp")
    if [ "$arg" = "core" ]; then name="erp-frontend"; fi
    TARGETS+=("$name")
  done
fi

echo ">>> Building: ${TARGETS[*]}"
DOCKER_BUILDKIT=1 docker compose -f "$COMPOSE_FILE" build --parallel "${TARGETS[@]}"

echo ">>> Restarting: ${TARGETS[*]}"
docker compose -f "$COMPOSE_FILE" up -d --no-deps "${TARGETS[@]}"

echo ">>> Done."
