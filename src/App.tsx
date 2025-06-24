import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, AlertCircle, Sparkles } from 'lucide-react';
import ModelSelector from './components/ModelSelector';
import ChatMessage from './components/ChatMessage';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ApiService } from './services/api';
import { AIModel, Message } from './types';

/*
Main App Component

This is the main component that brings everything together.
It now includes authentication functionality and manages the entire application state.

Key TypeScript/React concepts used here:
- useState: Hook for managing component state
- useEffect: Hook for side effects (like API calls)
- useRef: Hook for accessing DOM elements directly
- Generic types: useState<Type[]> tells TypeScript what type of data we're storing
- React Context: For managing authentication state across the app
- Conditional rendering: Showing different UI based on authentication state
*/

// Main Chat Interface Component (protected by authentication)
const ChatInterface: React.FC = () => {
  const { authState, logout } = useAuth();
  
  // State management using React hooks with TypeScript
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  
  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /*
  useEffect Hook
  
  This hook runs code when the component first loads (like componentDidMount in class components).
  The empty array [] means it only runs once when the component mounts.
  */
  useEffect(() => {
    loadModels();
    checkBackendHealth();
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /*
  Async Functions
  
  These functions handle API calls. They're marked as 'async' because they deal with promises.
  The 'await' keyword waits for the promise to resolve before continuing.
  */
  
  const loadModels = async () => {
    try {
      const availableModels = await ApiService.getModels();
      setModels(availableModels);
    } catch (err) {
      setError('Failed to load AI models. Please check if the backend is running.');
    }
  };

  const checkBackendHealth = async () => {
    const healthy = await ApiService.checkHealth();
    setIsHealthy(healthy);
    if (!healthy) {
      setError('Backend server is not responding. Please start the Python backend.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedModel || isLoading) {
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim()
    };

    // Add user message to chat
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Send request to backend
      const response = await ApiService.sendMessage({
        model: selectedModel.id,
        messages: updatedMessages
      });

      // Add AI response to chat
      const aiMessage: Message = {
        role: 'assistant',
        content: response.response
      };

      setMessages([...updatedMessages, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="app">
      <div className="app__container">
        {/* Header with User Info */}
        <header className="app__header">
          <div className="app__title">
            <Sparkles size={32} color="#667eea" />
            <h1>MultiGenQA</h1>
          </div>
          <div className="app__user-info">
            <span className="app__welcome">
              Welcome, {authState.user?.first_name}!
            </span>
            <button 
              className="app__logout-btn" 
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </div>
          <p className="app__subtitle">
            Chat with multiple AI models - OpenAI, Gemini, and Claude
          </p>
          
          {!isHealthy && (
            <div className="app__health-warning">
              <AlertCircle size={16} />
              Backend server not responding. Please start the Python backend.
            </div>
          )}
        </header>

        {/* Model Selector */}
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
        />

        {/* Chat Area */}
        <div className="app__chat">
          <div className="app__messages">
            {messages.length === 0 ? (
              <div className="app__welcome">
                <Sparkles size={48} color="#667eea" />
                <h3>Welcome to MultiGenQA!</h3>
                <p>Select an AI model above and start chatting.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  model={selectedModel?.name}
                />
              ))
            )}
            
            {isLoading && (
              <div className="app__loading">
                <Loader className="app__loading-spinner" size={20} />
                <span>AI is thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="app__input-area">
            {error && (
              <div className="app__error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div className="app__input-container">
              <div className="app__input-wrapper">
                <textarea
                  ref={textareaRef}
                  className="app__input"
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    autoResizeTextarea();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedModel 
                      ? `Message ${selectedModel.name}...`
                      : 'Select a model to start chatting...'
                  }
                  disabled={!selectedModel || isLoading}
                  rows={1}
                />
                <button
                  className="app__send-button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !selectedModel || isLoading}
                >
                  {isLoading ? (
                    <Loader size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
            
            {messages.length > 0 && (
              <button
                className="app__clear-button"
                onClick={clearChat}
                disabled={isLoading}
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Authentication Flow Component
const AuthFlow: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { login } = useAuth();

  const handleLoginSuccess = (user: any, token: string) => {
    login(user, token);
  };

  const handleRegisterSuccess = (message: string) => {
    setSuccessMessage(message);
    setAuthMode('login');
  };

  const switchToRegister = () => {
    setAuthMode('register');
    setSuccessMessage('');
  };

  const switchToLogin = () => {
    setAuthMode('login');
    setSuccessMessage('');
  };

  return (
    <div className="auth-flow">
      {successMessage && (
        <div className="auth-success-message">
          <AlertCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}
      
      {authMode === 'login' ? (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={switchToRegister}
        />
      ) : (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={switchToLogin}
        />
      )}
    </div>
  );
};

// Main App Component with Authentication
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// App Content Component (uses auth context)
const AppContent: React.FC = () => {
  const { authState } = useAuth();

  // Show loading while checking authentication
  if (authState.isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <Sparkles size={48} color="#667eea" />
          <h2>MultiGenQA</h2>
          <Loader className="loading-spinner" size={24} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication flow if not logged in
  if (!authState.isAuthenticated) {
    return <AuthFlow />;
  }

  // Show main chat interface if authenticated
  return <ChatInterface />;
};

export default App; 