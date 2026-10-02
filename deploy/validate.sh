#!/usr/bin/env bash
# deploy/validate.sh
# ValidateService lifecycle hook — confirms the deployment is healthy.
# Fails the CodeDeploy deployment (triggering automatic rollback if enabled)
# if either the systemd service is not active or the health endpoint is unhealthy.

set -euo pipefail

SERVICE="sellora"
HEALTH_URL="http://127.0.0.1:8080/actuator/health"
MAX_RETRIES=12        # 12 attempts × 10s = 2 minutes total wait
RETRY_INTERVAL=10     # seconds between attempts

# ── 1. Check systemd service status ─────────────────────────────────────────
echo "[validate] Checking systemd service status..."
if ! sudo systemctl is-active --quiet "$SERVICE"; then
    echo "[validate] ERROR: $SERVICE is not active."
    sudo systemctl status "$SERVICE" --no-pager || true
    exit 1
fi
echo "[validate] $SERVICE is active."

# ── 2. Probe the Spring Boot health endpoint with retries ───────────────────
echo "[validate] Probing health endpoint: $HEALTH_URL"

for attempt in $(seq 1 $MAX_RETRIES); do
    HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" \
        --max-time 5 "$HEALTH_URL" || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
        echo "[validate] Health endpoint returned 200 on attempt $attempt. Deployment validated."
        exit 0
    fi

    echo "[validate] Attempt $attempt/$MAX_RETRIES — HTTP $HTTP_STATUS. Retrying in ${RETRY_INTERVAL}s..."
    sleep "$RETRY_INTERVAL"
done

# ── 3. Final failure ─────────────────────────────────────────────────────────
echo "[validate] ERROR: Health endpoint did not return 200 after $MAX_RETRIES attempts."
echo "[validate] Last status: $HTTP_STATUS"
sudo journalctl -u "$SERVICE" -n 50 --no-pager || true
exit 1
