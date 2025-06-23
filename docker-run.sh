#!/bin/bash

# MultiGenQA Docker Runner Script
# This script helps you run the MultiGenQA application with Docker

echo "🐳 MultiGenQA Docker Setup"
echo "=========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Download from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Environment file not found!"
    echo "📝 Please create backend/.env with your API keys:"
    echo "   cp backend/env.example backend/.env"
    echo "   Then edit backend/.env and add your real API keys"
    exit 1
fi

# Check if .env has real values (not placeholders)
if grep -q "your_api_key" backend/.env; then
    echo "❌ Please update backend/.env with your real API keys"
    echo "   The file still contains placeholder values"
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Build and start the application"
echo "2) Start the application (if already built)"
echo "3) Stop the application"
echo "4) View logs"
echo "5) Clean up (remove containers and images)"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🔨 Building and starting MultiGenQA..."
        docker-compose up --build -d
        echo ""
        echo "🎉 Application is starting!"
        echo "📱 Frontend: http://localhost:3000"
        echo "🔧 Backend API: http://localhost:5001/api/health"
        echo ""
        echo "📊 View logs with: docker-compose logs -f"
        ;;
    2)
        echo "🚀 Starting MultiGenQA..."
        docker-compose up -d
        echo "✅ Application started!"
        ;;
    3)
        echo "🛑 Stopping MultiGenQA..."
        docker-compose down
        echo "✅ Application stopped!"
        ;;
    4)
        echo "📊 Showing logs (press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    5)
        echo "🧹 Cleaning up..."
        docker-compose down
        docker system prune -f
        echo "✅ Cleanup complete!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac 