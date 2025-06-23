# Docker Setup Guide for MultiGenQA

## 🐳 What is Docker?

**Docker** is like a "shipping container" for your application. Just like how shipping containers allow you to transport goods anywhere in the world, Docker containers allow you to run your application anywhere - on your computer, on a server, or in the cloud.

**Key Benefits:**
- **Consistency**: Your app runs the same way everywhere
- **Easy Setup**: No need to install Python, Node.js, or other dependencies manually
- **Isolation**: Your app runs in its own environment
- **Portability**: Share your app with others easily

## 📁 Docker Files Explained

### 1. `Dockerfile.backend` - Python Backend Container
```dockerfile
FROM python:3.11-slim    # Start with a Python base image
WORKDIR /app            # Set the working directory inside container
COPY backend/requirements.txt .  # Copy dependency list
RUN pip install -r requirements.txt  # Install Python packages
COPY backend/ .         # Copy all backend code
EXPOSE 5001            # Tell Docker this app uses port 5001
CMD ["python", "app.py"]  # Command to start the app
```

### 2. `Dockerfile.frontend` - React/TypeScript Frontend Container
This uses a **multi-stage build**:
- **Stage 1**: Build the TypeScript/React app into static files
- **Stage 2**: Serve those files with nginx web server

### 3. `docker-compose.yml` - Orchestration File
This file tells Docker how to run multiple containers together:
- **Backend container**: Runs your Python Flask API
- **Frontend container**: Runs your React app with nginx
- **Networking**: Containers can talk to each other
- **Environment**: Passes your API keys to the backend

## 🚀 Quick Start

### Prerequisites
- Install **Docker Desktop** from https://www.docker.com/products/docker-desktop/
- Make sure Docker is running (you'll see a whale icon in your system tray)

### Step 1: Setup Environment Variables
```bash
# Make sure you have your API keys in backend/.env
cp backend/env.example backend/.env
# Edit backend/.env and add your real API keys
```

### Step 2: Build and Run with Docker Compose
```bash
# Build and start all containers
docker-compose up --build

# Or run in background (detached mode)
docker-compose up --build -d
```

### Step 3: Access Your Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api/health

## 🛠️ Docker Commands Explained

### Basic Commands
```bash
# Build and start containers
docker-compose up --build

# Start containers in background
docker-compose up -d

# Stop all containers
docker-compose down

# View running containers
docker ps

# View logs from all services
docker-compose logs

# View logs from specific service
docker-compose logs backend
docker-compose logs frontend

# Restart a specific service
docker-compose restart backend

# Remove all containers and volumes
docker-compose down -v
```

## 🔧 How It All Works Together

### Network Communication
1. **User** visits `http://localhost:3000`
2. **Nginx** serves the React app
3. When React makes API calls to `/api/*`, **nginx proxies** them to `backend:5001`
4. **Backend container** processes the request and returns response
5. **Frontend** displays the AI response to the user

### TypeScript Concepts in Docker Context

#### Environment Variables
```typescript
// In api.ts, we use environment variables to determine the API URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Docker production build
  : 'http://localhost:5001/api';  // Local development
```

**Explanation**: 
- `process.env.NODE_ENV` is a **TypeScript/JavaScript** way to check if we're in development or production
- In Docker, `NODE_ENV` is automatically set to `'production'` when we build the app
- This allows the same code to work both locally and in Docker

## 🐛 Troubleshooting

### Common Issues

#### 1. "Port already in use"
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5001

# Kill the process or change ports in docker-compose.yml
```

#### 2. "API keys not working"
```bash
# Check if .env file exists and has real values
cat backend/.env

# Make sure no placeholder values like "your_api_key"
```

#### 3. "Frontend can't connect to backend"
```bash
# Check if both containers are running
docker ps

# Check backend health
curl http://localhost:5001/api/health

# Check container logs
docker-compose logs backend
```

This setup gives you a professional, production-ready way to deploy your MultiGenQA application! 🚀 