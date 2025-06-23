# 🐳 Docker Quick Start for MultiGenQA

## What You Get
Your MultiGenQA app running in Docker containers:
- ✅ **No manual setup** - Docker handles Python, Node.js, dependencies
- ✅ **Consistent environment** - Works the same everywhere
- ✅ **Easy sharing** - Others can run your app instantly
- ✅ **Production ready** - Same setup for development and production

## 🚀 Super Quick Start (3 steps)

### 1. Install Docker Desktop
Download and install from: https://www.docker.com/products/docker-desktop/

### 2. Setup API Keys
```bash
# Copy the environment template
cp backend/env.example backend/.env

# Edit backend/.env and add your real API keys:
# OPENAI_API_KEY=sk-your-actual-key
# GOOGLE_API_KEY=your-actual-key  
# ANTHROPIC_API_KEY=your-actual-key
```

### 3. Run the App
```bash
# Option A: Use the helper script (recommended)
./docker-run.sh

# Option B: Use Docker Compose directly
docker-compose up --build
```

**That's it!** 🎉

- Frontend: http://localhost:3000
- Backend: http://localhost:5001/api/health

## 📋 What Docker Does For You

### Before Docker (Manual Setup):
1. Install Python 3.11
2. Install Node.js 18+
3. Install pip dependencies
4. Install npm dependencies  
5. Start backend server
6. Start frontend server
7. Configure networking
8. Handle environment variables

### With Docker (Automated):
1. `docker-compose up --build`
2. ✨ Everything works!

## 🛠️ Common Commands

```bash
# Start everything
docker-compose up --build

# Run in background
docker-compose up --build -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart just the backend
docker-compose restart backend
```

## 🔧 How It Works (TypeScript Concepts)

### Environment Detection
```typescript
// In your api.ts file, we automatically detect the environment:
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Docker: nginx proxies to backend
  : 'http://localhost:5001/api';  // Local: direct connection
```

**What this means:**
- **Local development**: Your React app talks directly to `localhost:5001`
- **Docker**: nginx (web server) forwards API requests to the backend container
- **Same TypeScript code** works in both environments!

### Type Safety in Docker
- Your TypeScript **interfaces** and **types** still work perfectly
- Docker builds your TypeScript into optimized JavaScript
- All type checking happens during the Docker build process
- If you have TypeScript errors, Docker build will fail (which is good!)

## 🐛 Troubleshooting

### "Port already in use"
```bash
# Kill whatever is using the ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5001 | xargs kill -9
```

### "Can't connect to backend"
```bash
# Check if containers are running
docker ps

# Check backend health
curl http://localhost:5001/api/health
```

### "API keys not working"
```bash
# Make sure .env has real values, not placeholders
cat backend/.env
```

## 🎯 Why This Is Better

### For Beginners:
- **No complex setup** - Docker handles everything
- **Learn by doing** - Focus on TypeScript, not environment setup
- **Same as professionals** - This is how real companies deploy apps

### For TypeScript Learning:
- **Pure focus** - Spend time learning TypeScript, not fixing Python/Node issues
- **Real environment** - Your code runs exactly like in production
- **Easy sharing** - Share your learning projects with others instantly

## 📚 Next Steps

1. **Run your app** with Docker
2. **Make changes** to your TypeScript code  
3. **Rebuild** with `docker-compose up --build`
4. **Learn more** Docker concepts in `DOCKER.md`

Docker makes your TypeScript development journey much smoother! 🚀 