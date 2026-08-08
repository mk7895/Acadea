#!/bin/bash

set -e

# Load nvm and use the repository's declared Node version.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use >/dev/null

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting API on http://127.0.0.1:5001..."
cd "$ROOT/artifacts/api-server"
PORT=5001 pnpm run dev &
API_PID=$!

echo "Starting frontend on http://localhost:5173..."
cd "$ROOT/artifacts/acadea-website"
PORT=5173 BASE_PATH=/ pnpm run dev &
FRONTEND_PID=$!

echo ""
echo "Local site should be available at:"
echo "http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both."

cleanup() {
  echo ""
  echo "Stopping local servers..."
  kill $API_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

wait
