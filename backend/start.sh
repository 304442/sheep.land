#!/bin/bash

# Sheep Land Development Start Script
# Starts PocketBase in development mode with hot reload

echo "🛠️ Starting Sheep Land Development Server..."

# Change to backend directory
cd "$(dirname "$0")"

# Check for required files
if [[ ! -f "./pocketbase" ]]; then
    echo "❌ Error: PocketBase executable not found!"
    echo "Please download PocketBase from https://pocketbase.io/docs/"
    exit 1
fi

# Start PocketBase in development mode
./pocketbase serve --dev --publicDir="../frontend"

echo "🚀 Development server started!"
echo "📱 Frontend: http://127.0.0.1:8090/"
echo "🔧 Admin: http://127.0.0.1:8090/_/"
echo "📡 API: http://127.0.0.1:8090/api/"
echo ""
echo "💡 Development features:"
echo "   - Hot reload for hooks enabled"
echo "   - Detailed logging"
echo "   - CORS headers for localhost"