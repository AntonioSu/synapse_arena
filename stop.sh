#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

safe_kill() {
  local pattern="$1"
  local label="$2"
  local pids
  pids=$(pgrep -f "$pattern" 2>/dev/null)

  if [ -z "$pids" ]; then
    echo "  ℹ️  No $label process found"
    return
  fi

  echo "  Found $label PIDs: $pids"
  kill $pids 2>/dev/null
  sleep 2

  local remaining
  remaining=$(pgrep -f "$pattern" 2>/dev/null)
  if [ -n "$remaining" ]; then
    echo "  ⚠️  Force killing remaining: $remaining"
    kill -9 $remaining 2>/dev/null
    sleep 1
  fi
  echo "  ✅ $label stopped"
}

echo ""
echo "🛑 Stopping Synapse Arena services..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Stopping Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
safe_kill "tsx.*watch.*src/index.ts" "backend (tsx watch)"
safe_kill "node.*packages/backend" "backend (node)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Stopping Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
safe_kill "next-server" "frontend (next-server)"
safe_kill "next.*dev" "frontend (next dev)"

rm -f "$PROJECT_ROOT/logs/backend.pid" "$PROJECT_ROOT/logs/frontend.pid"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All services stopped"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
