#!/usr/bin/env bash
# deploy/build.sh
# AfterInstall lifecycle hook — builds the Spring Boot JAR from source.
# Runs AFTER the new revision has been copied to the EC2 instance,
# but BEFORE the application is started.

set -euo pipefail

APP_DIR="/home/ubuntu/E-Commerce/backend"

echo "[build] Starting Maven build..."
cd "$APP_DIR"

# Ensure the Maven wrapper is executable (it may have lost permissions during the archive upload)
chmod +x mvnw

./mvnw clean package -DskipTests \
    --batch-mode \
    --no-transfer-progress

echo "[build] Build complete: $(ls -lh target/e-commerce-0.0.1-SNAPSHOT.jar)"
