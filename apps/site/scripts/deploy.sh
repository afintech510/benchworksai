#!/usr/bin/env bash
# =============================================================================
# Larkin Tech — Blue-Green Deployment Script
# Usage:
#   ./scripts/deploy.sh              Deploy new version (pull from GHCR → blue-green switch)
#   ./scripts/deploy.sh --rollback   Roll back to previous version
# =============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker compose -f ${PROJECT_DIR}/docker-compose.yml"
UPSTREAM_CONF="${PROJECT_DIR}/docker/upstream.conf"
GHCR_IMAGE="ghcr.io/afintech510/larkin-tech/larkintech-app"
HEALTH_TIMEOUT=30
HEALTH_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1" >&2; }

# Determine which container is currently active
get_active() {
    if grep -q "larkintech-green" "${UPSTREAM_CONF}" 2>/dev/null; then
        echo "green"
    else
        echo "blue"
    fi
}

# Wait for a container's health endpoint
wait_for_health() {
    local container="$1"
    local elapsed=0

    log "Waiting for ${container} health check..."
    while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
        if docker exec "${container}" wget --no-verbose --tries=1 --spider "http://localhost:3000/api/health" 2>/dev/null; then
            log "${container} is healthy!"
            return 0
        fi
        sleep $HEALTH_INTERVAL
        elapsed=$((elapsed + HEALTH_INTERVAL))
    done

    err "${container} failed health check after ${HEALTH_TIMEOUT}s"
    return 1
}

# Switch nginx upstream to target
switch_upstream() {
    local target="$1"
    local container_name="larkintech-${target}"

    log "Switching upstream to ${container_name}..."
    cat > "${UPSTREAM_CONF}" <<EOF
# Active upstream — updated by scripts/deploy.sh during blue-green switch
upstream larkintech_backend {
    server ${container_name}:3000;
}
EOF
    docker exec larkintech-nginx nginx -s reload
    log "Nginx reloaded — traffic now routed to ${target}"
}

# Tag current image as :previous for rollback
tag_previous() {
    log "Tagging current image as :previous for rollback..."
    local current_id
    current_id=$(docker inspect --format='{{.Image}}' "larkintech-$(get_active)" 2>/dev/null || true)
    if [ -n "$current_id" ]; then
        docker tag "$current_id" "${GHCR_IMAGE}:previous"
    fi
}

# =============================================================================
# ROLLBACK
# =============================================================================
if [ "${1:-}" = "--rollback" ]; then
    active=$(get_active)
    if [ "$active" = "blue" ]; then
        target="green"
    else
        target="blue"
    fi

    warn "Rolling back: switching from ${active} to ${target}..."

    # Make sure the target is running
    if ! docker ps --format '{{.Names}}' | grep -q "larkintech-${target}"; then
        err "Target container larkintech-${target} is not running. Cannot rollback."
        exit 1
    fi

    switch_upstream "$target"

    log "Rollback complete. Active: ${target}"
    exit 0
fi

# =============================================================================
# DEPLOY (Blue-Green)
# =============================================================================
log "Starting blue-green deployment..."

# Step 1: Determine active/inactive
active=$(get_active)
if [ "$active" = "blue" ]; then
    target="green"
    target_port="3201"
else
    target="blue"
    target_port="3200"
fi

log "Active: ${active} → Deploying to: ${target}"

# Step 2: Tag current image as :previous
tag_previous

# Step 3: Pull new image from GHCR
log "Pulling latest image from GHCR..."
docker pull "${GHCR_IMAGE}:latest"

# Step 4: Start target container
log "Starting ${target} container..."
cd "${PROJECT_DIR}"
${COMPOSE} --profile ${target} up -d app-${target}

# Step 5: Wait for health check (30s timeout, 2s interval)
if ! wait_for_health "larkintech-${target}"; then
    err "DEPLOY FAILED — ${target} is unhealthy"
    err "Stopping ${target}, keeping ${active} as active"
    ${COMPOSE} stop app-${target} 2>/dev/null || true
    ${COMPOSE} rm -f app-${target} 2>/dev/null || true
    exit 1
fi

# Step 6: Switch nginx upstream
switch_upstream "$target"

# Step 7: Stop old container
log "Stopping old ${active} container..."
${COMPOSE} stop app-${active} 2>/dev/null || true

# Step 8: Cleanup
log "Cleaning up old containers..."
${COMPOSE} rm -f app-${active} 2>/dev/null || true

# Step 9: Clean up dangling images
docker image prune -f 2>/dev/null || true

log "Deploy complete! Active: ${target}"
log "To rollback: ./scripts/deploy.sh --rollback"
