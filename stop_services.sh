#!/usr/bin/env bash
echo "Stopping Assessment Portal services..."
lsof -ti :8001 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
echo "Services on ports 8001 and 5173 have been stopped."
