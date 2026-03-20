#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "🔄 Restarting Synapse Arena services..."

bash "$SCRIPT_DIR/stop.sh"

echo "⏳ Waiting 3 seconds..."
sleep 3

bash "$SCRIPT_DIR/start.sh"
