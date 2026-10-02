#!/usr/bin/env bash
# deploy/stop.sh
# BeforeInstall lifecycle hook — gracefully stops the running sellora service.
# Runs BEFORE the new revision is copied, so it safely brings down
# the current version without interrupting an ongoing replacement.
# Tolerates the service already being stopped (exit 0).

set -euo pipefail

SERVICE="sellora"

echo "[stop] Stopping $SERVICE service..."

if sudo systemctl is-active --quiet "$SERVICE"; then
    sudo systemctl stop "$SERVICE"
    echo "[stop] $SERVICE stopped."
else
    echo "[stop] $SERVICE was not running — nothing to stop."
fi
