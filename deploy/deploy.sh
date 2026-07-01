#!/bin/bash
# Deploy frontend static files to remote server
set -euo pipefail

TARGET="${1:-jp1}"
REMOTE_PATH="/opt/frontend"

echo "=== Building frontend ==="
pnpm build

echo "=== Deploying to $TARGET:$REMOTE_PATH ==="
ssh "$TARGET" "sudo mkdir -p $REMOTE_PATH && sudo chown \$USER $REMOTE_PATH"
scp -r dist/* "$TARGET:$REMOTE_PATH/"

echo "=== Reloading nginx ==="
ssh "$TARGET" sudo systemctl reload nginx

echo "=== Done ==="
echo "URL: https://dashboard.zonecnh.internal"
