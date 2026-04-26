#!/bin/sh
# ============================================================
# Container Health Check Script
# Checks Next.js standalone server availability
# ============================================================

# Configuration
HOST="${HOSTNAME:-localhost}"
PORT="${PORT:-3000}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/api/health}"
TIMEOUT="${HEALTH_TIMEOUT:-5}"

# Build the health check URL
URL="http://${HOST}:${PORT}${HEALTH_ENDPOINT}"

# Perform the health check request
# Using wget (available in Alpine) with a short timeout
if wget --quiet --tries=1 --timeout="${TIMEOUT}" --spider "${URL}" 2>/dev/null; then
    echo "Health check passed: ${URL}"
    exit 0
else
    # Fallback: try curl if wget fails or isn't available
    if command -v curl >/dev/null 2>&1; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT}" "${URL}" 2>/dev/null)
        if [ "${HTTP_CODE}" = "200" ]; then
            echo "Health check passed (curl): ${URL}"
            exit 0
        fi
    fi
    echo "Health check failed: ${URL}"
    exit 1
fi
