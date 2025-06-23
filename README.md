# MultiGenQA - Multi-AI Chat Platform

A simple and elegant web platform that allows users to chat with multiple AI models including OpenAI GPT-4o, Google Gemini Pro 2.5, and Claude Sonnet 4 in long conversations.

## Features

- 🤖 **Multiple AI Models**: Choose between OpenAI GPT-4o, Google Gemini Pro 2.5, and Claude Sonnet 4
- 💬 **Long Conversations**: Maintain conversation history across multiple exchanges
- 🎨 **Modern UI**: Clean, responsive interface built with React and TypeScript
- ⚡ **Real-time Chat**: Fast and responsive chat experience
- 🔄 **Model Switching**: Switch between AI models during conversations
- 📱 **Mobile Friendly**: Responsive design that works on all devices

## Tech Stack

### Frontend
- **React 18** with **TypeScript** for type-safe development
- **Lucide React** for beautiful icons
- **Axios** for API communication
- **CSS-in-JS** for styling

### Backend
- **Python Flask** for the REST API
- **OpenAI API** for GPT-4o integration
- **Google Generative AI** for Gemini Pro integration
- **Anthropic API** for Claude integration
- **Flask-CORS** for cross-origin requests

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 16 or higher)
- **Python** (version 3.8 or higher)
- **npm** or **yarn**
- **pip** (Python package installer)

## API Keys Required

You'll need API keys from the following services:

1. **OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Note: Requires a paid OpenAI account

2. **Google AI API Key**
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Enable the Generative AI API

3. **Anthropic API Key**
   - Go to https://console.anthropic.com/
   - Create a new API key
   - Note: Requires an Anthropic account

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd MultiGenQA
```

### 2. Backend Setup (Python)

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
```bash
# Copy the example environment file
cp backend/env.example backend/.env

# Edit the .env file and add your API keys
nano backend/.env
```

Add your API keys to the `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

#### Start the Backend Server
```bash
cd backend
python app.py
```

The backend will start on `http://localhost:5000`

### 3. Frontend Setup (React/TypeScript)

#### Install Node.js Dependencies
```bash
# From the root directory
npm install
```

#### Start the Frontend Development Server
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## Usage

1. **Start both servers**: Make sure both the Python backend (port 5000) and React frontend (port 3000) are running
2. **Open your browser**: Navigate to `http://localhost:3000`
3. **Select an AI model**: Choose from OpenAI GPT-4o, Google Gemini Pro, or Claude Sonnet
4. **Start chatting**: Type your message and press Enter or click Send
5. **Switch models**: You can change AI models at any time during the conversation
6. **Clear chat**: Use the Clear button to start a new conversation

## Project Structure

```
MultiGenQA/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── env.example         # Environment variables template
│   └── .env               # Your API keys (create this)
├── src/
│   ├── components/
│   │   ├── ModelSelector.tsx    # AI model selection component
│   │   └── ChatMessage.tsx      # Individual chat message component
│   ├── services/
│   │   └── api.ts              # API service for backend communication
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── App.tsx                 # Main React application
│   └── index.tsx               # React entry point
├── public/
│   └── index.html              # HTML template
├── package.json                # Frontend dependencies
├── requirements.txt            # Backend dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/health` - Health check endpoint
- `GET /api/models` - Get list of available AI models
- `POST /api/chat` - Send chat message to selected AI model

### Chat API Request Format
```json
{
  "model": "openai|gemini|claude",
  "messages": [
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}
```

## TypeScript Concepts Explained

Since you're new to TypeScript, here are the key concepts used in this project:

### 1. **Interfaces**
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```
Interfaces define the "shape" of objects - what properties they should have and their types.

### 2. **Generic Types**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
```
Generic types (`<Message[]>`) tell TypeScript what type of data a function or variable should work with.

### 3. **Optional Properties**
```typescript
interface ChatResponse {
  response: string;
  error?: string;  // The ? means this property is optional
}
```

### 4. **Function Types**
```typescript
onModelSelect: (model: AIModel) => void;
```
This defines a function that takes an `AIModel` parameter and returns nothing (`void`).

## Troubleshooting

### Backend Issues
- **"Module not found"**: Make sure you've installed all Python dependencies with `pip install -r requirements.txt`
- **API key errors**: Check that your `.env` file has the correct API keys
- **Port 5000 in use**: Kill any existing processes on port 5000 or change the port in `app.py`

### Frontend Issues
- **"Cannot find module"**: Run `npm install` to install all dependencies
- **TypeScript errors**: Make sure all dependencies are installed and TypeScript is configured correctly
- **API connection errors**: Ensure the backend is running on port 5000

### Common Issues
- **CORS errors**: The backend includes CORS headers, but if you still have issues, check your browser's developer console
- **API rate limits**: Be aware that AI APIs have rate limits and usage costs
- **Network timeouts**: The app has a 30-second timeout for AI responses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for the GPT-4o API
- Google for the Gemini Pro API
- Anthropic for the Claude API
- The React and TypeScript communities
