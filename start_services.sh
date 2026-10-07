#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure Node.js is on PATH
if [ -d "$HOME/.nodejs/bin" ]; then
    export PATH="$HOME/.nodejs/bin:$PATH"
fi

echo "========================================================"
echo " Starting MockRun Services — Powered by OpenLectern"
echo " Built for Nehru Arts and Science College (Autonomous)"
echo "========================================================"

# Verify Python venv
if [ ! -f "$DIR/backend/.venv/bin/python3" ]; then
    echo "Creating virtual environment in backend/.venv..."
    python3 -m venv "$DIR/backend/.venv"
    "$DIR/backend/.venv/bin/pip" install --prefer-binary -r "$DIR/backend/requirements.txt" httpx websockets bcrypt google-genai
fi

# Stop existing processes on ports if running
lsof -ti :8001 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# Start backend
echo "Starting Backend on http://localhost:8001..."
(cd "$DIR/backend" && "$DIR/backend/.venv/bin/python3" run.py) > "$DIR/backend/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID)"

# Start frontend
echo "Starting Frontend on http://localhost:5173..."
(cd "$DIR/frontend" && npm run dev) > "$DIR/frontend/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend running (PID: $FRONTEND_PID)"

echo ""
echo "========================================================"
echo " MockRun Services are running successfully in the background!"
echo "   Brand Provider:    OpenLectern"
echo "   Institution:       Nehru Arts and Science College"
echo "   Frontend Web App:  http://localhost:5173"
echo "   Backend REST API:  http://localhost:8001"
echo "   API Swagger Docs:  http://localhost:8001/docs"
echo "========================================================"
