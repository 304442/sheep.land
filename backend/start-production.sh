#!/bin/bash

# Sheep Land Production Deployment Script
# Optimized for production use

echo "🚀 Starting Sheep Land in Production Mode..."

# Change to backend directory
cd "$(dirname "$0")"

# Check for required files
if [[ ! -f "./pocketbase" ]]; then
    echo "❌ Error: PocketBase executable not found!"
    echo "Please download PocketBase from https://pocketbase.io/docs/"
    exit 1
fi

if [[ ! -d "../frontend" ]]; then
    echo "❌ Error: Frontend directory not found!"
    exit 1
fi

# Apply any pending migrations
echo "📊 Applying database migrations..."
./pocketbase migrate up

# Start PocketBase in production mode
echo "🐑 Starting Sheep Land Production Server..."
./pocketbase serve --publicDir="../frontend"

echo "✅ Production server started!"
echo "🌐 Application: http://localhost:8090/"
echo "🔧 Admin Dashboard: http://localhost:8090/_/"
echo "📡 API Endpoints: http://localhost:8090/api/"