#!/bin/bash
# Travel Planner - Start Script

cd "$(dirname "$0")"

# Build client if not already built
if [ ! -d "client/dist" ]; then
  echo "Building frontend..."
  cd client && npm install && npm run build && cd ..
fi

# Install server deps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing server dependencies..."
  npm install
fi

# Get local IP for network access info
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "your-ip")

echo ""
echo "========================================"
echo "   ✈️  My Travel Planner"
echo "========================================"
echo "   Local:   http://localhost:3000"
echo "   Network: http://${LOCAL_IP}:3000"
echo "========================================"
echo ""

node server/index.js
