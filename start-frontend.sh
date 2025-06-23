#!/bin/bash

# MultiGenQA Frontend Startup Script

echo "🎨 Starting MultiGenQA Frontend..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "🔗 Make sure the backend is running at: http://localhost:5000"
echo ""
echo "="*50

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Installing dependencies..."
    npm install
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the right directory?"
    exit 1
fi

echo "✅ Starting React development server..."
npm start 