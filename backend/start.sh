#!/bin/bash

# Sheep Land Backend Start Script
# Starts PocketBase with proper configuration for the frontend

echo "🐑 Starting Sheep Land Backend..."

# Change to backend directory
cd "$(dirname "$0")"

# Start PocketBase with frontend directory configured
./pocketbase serve --dev --publicDir="../frontend"

echo "🚀 Backend started!"
echo "📱 Frontend: http://127.0.0.1:8090/"
echo "🔧 Admin: http://127.0.0.1:8090/_/"
echo "📡 API: http://127.0.0.1:8090/api/"