#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

mkdir -p "$PROJECT_ROOT/logs"

echo ""
echo "🚀 Starting Synapse Arena services..."

# 1. 启动后端
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Starting Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if pgrep -f "tsx.*watch.*src/index.ts" > /dev/null 2>&1; then
  echo "  ⚠️  Backend already running, skipping"
else
  cd "$PROJECT_ROOT/packages/backend"
  nohup npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
  echo "$!" > "$PROJECT_ROOT/logs/backend.pid"
  echo "  ✅ Backend started (PID: $!)"
  echo "  📝 Log: logs/backend.log"
fi

echo "  ⏳ Waiting for backend..."
sleep 5

# 2. 启动前端
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Starting Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if pgrep -f "next-server" > /dev/null 2>&1; then
  echo "  ⚠️  Frontend already running, skipping"
else
  cd "$PROJECT_ROOT/packages/frontend"
  PORT=3000 nohup npx next dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
  echo "$!" > "$PROJECT_ROOT/logs/frontend.pid"
  echo "  ✅ Frontend started (PID: $!)"
  echo "  📝 Log: logs/frontend.log"
fi

echo "  ⏳ Waiting for frontend..."
sleep 5

# 3. 健康检查
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🩺 Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/topics | grep -q "200"; then
  echo "  ✅ Backend:  http://localhost:8080  OK"
else
  echo "  ❌ Backend:  http://localhost:8080  FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -qE "200|307"; then
  echo "  ✅ Frontend: http://localhost:3000  OK"
else
  echo "  ⏳ Frontend: http://localhost:3000  still compiling..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Done!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Logs:"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/frontend.log"
echo ""
echo "🛑 Stop: ./stop.sh"
echo ""
