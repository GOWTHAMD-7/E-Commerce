#!/usr/bin/env bash
# deploy/start.sh
# ApplicationStart lifecycle hook — starts the sellora systemd service
# after the new JAR has been built and placed in the working directory.

set -euo pipefail

SERVICE="sellora"

echo "[start] Starting $SERVICE service..."
sudo systemctl start "$SERVICE"

# Give Spring Boot a moment to begin its startup sequence before
# the ValidateService hook probes the health endpoint.
echo "[start] Waiting 20s for Spring Boot startup..."
sleep 20

echo "[start] $SERVICE start command issued successfully."
