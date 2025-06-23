# Quick Setup Guide for MultiGenQA

## 🚀 Quick Start (5 minutes)

### Step 1: Get Your API Keys
You need API keys from these services:

1. **OpenAI**: https://platform.openai.com/api-keys
2. **Google AI**: https://makersuite.google.com/app/apikey  
3. **Anthropic**: https://console.anthropic.com/

### Step 2: Setup Backend
```bash
# Copy environment file
cp backend/env.example backend/.env

# Edit the .env file and add your API keys
nano backend/.env
```

Your `.env` file should look like:
```
OPENAI_API_KEY=sk-your-actual-openai-key-here
GOOGLE_API_KEY=your-actual-google-key-here
ANTHROPIC_API_KEY=your-actual-anthropic-key-here
```

### Step 3: Start the Application

**Option A: Use the helper scripts**
```bash
# Terminal 1 - Start Backend
python start-backend.py

# Terminal 2 - Start Frontend  
./start-frontend.sh
```

**Option B: Manual start**
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
npm start
```

### Step 4: Open Your Browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health

## ✅ Verification

Test the backend is working:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/models
```

## 🔧 Troubleshooting

**Backend won't start?**
- Check your `.env` file has real API keys (not placeholder values)
- Make sure Python dependencies are installed: `pip install -r requirements.txt`

**Frontend won't start?**
- Make sure Node.js dependencies are installed: `npm install`
- Check that the backend is running on port 5000

**Can't connect to AI services?**
- Verify your API keys are correct and have proper permissions
- Check your internet connection
- Some APIs require billing to be set up

## 🎯 Usage

1. Select an AI model from the dropdown
2. Type your message and press Enter
3. Chat with the AI!
4. Switch models anytime during conversation
5. Use "Clear" to start fresh

## 📱 Features

- **Multi-AI Support**: OpenAI GPT-4o, Google Gemini Pro, Claude Sonnet
- **Long Conversations**: Full conversation history maintained
- **Real-time Chat**: Fast responses with loading indicators
- **Modern UI**: Beautiful, responsive design
- **Error Handling**: Clear error messages and health checks 