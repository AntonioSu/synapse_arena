#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo ""
echo "📊 Synapse Arena Service Status"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Backend (Port 8080)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_PID=$(pgrep -f "tsx.*watch.*src/index.ts" | head -1)
if [ -n "$BACKEND_PID" ]; then
  echo "  ✅ Running (PID: $BACKEND_PID)"
  UPTIME=$(ps -p "$BACKEND_PID" -o etime= 2>/dev/null | xargs)
  echo "  ⏱  Uptime: $UPTIME"
  echo "  📝 Log: tail -f logs/backend.log"
else
  echo "  ❌ Not running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Frontend (Port 3000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRONTEND_PID=$(pgrep -f "next-server" | head -1)
if [ -n "$FRONTEND_PID" ]; then
  echo "  ✅ Running (PID: $FRONTEND_PID)"
  UPTIME=$(ps -p "$FRONTEND_PID" -o etime= 2>/dev/null | xargs)
  echo "  ⏱  Uptime: $UPTIME"
  echo "  📝 Log: tail -f logs/frontend.log"
else
  echo "  ❌ Not running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🩺 Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8080/api/topics 2>/dev/null)
if [ "$BACKEND_HTTP" = "200" ]; then
  echo "  ✅ Backend API:  200 OK"
else
  echo "  ❌ Backend API:  $BACKEND_HTTP"
fi

FRONTEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000 2>/dev/null)
if echo "$FRONTEND_HTTP" | grep -qE "200|307"; then
  echo "  ✅ Frontend:     $FRONTEND_HTTP OK"
else
  echo "  ❌ Frontend:     $FRONTEND_HTTP"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Recent Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$PROJECT_ROOT/logs/backend.log" ]; then
  echo ""
  echo "🔧 Backend (last 5 lines):"
  tail -n 5 "$PROJECT_ROOT/logs/backend.log"
fi

if [ -f "$PROJECT_ROOT/logs/frontend.log" ]; then
  echo ""
  echo "🎨 Frontend (last 5 lines):"
  tail -n 5 "$PROJECT_ROOT/logs/frontend.log"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
