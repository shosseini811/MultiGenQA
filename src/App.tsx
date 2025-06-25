import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Login from './components/Login';
import Register from './components/Register';
import ModelSelector from './components/ModelSelector';
import ChatMessage from './components/ChatMessage';
import { ApiService } from './services/api';
import { AIModel, Message } from './types';

import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';

import { Sparkles, AlertCircle, Send, Trash2, Loader } from 'lucide-react';

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
- shadcn/ui components: Modern, accessible UI components with TypeScript support
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
    // Set dark theme on mount
    document.documentElement.classList.add('dark');
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header with User Info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                    MultiGenQA
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Chat with multiple AI models - OpenAI, Gemini, and Claude
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Welcome back,</p>
                  <p className="font-medium">{authState.user?.first_name}!</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  Logout
                </Button>
              </div>
            </div>
            
            {!isHealthy && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Backend server not responding. Please start the Python backend.</span>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Model Selector */}
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
        />

        {/* Chat Area */}
        <div className="grid grid-cols-1 gap-6 min-h-[600px]">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Chat</CardTitle>
                {selectedModel && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedModel.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 min-h-[400px] max-h-[500px] p-4 bg-muted/30 rounded-lg">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Sparkles className="h-12 w-12 text-primary/50" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Welcome to MultiGenQA!</h3>
                      <p className="text-muted-foreground">Select an AI model above and start chatting.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={index}
                        message={message}
                        model={selectedModel?.name}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              {/* Input Area */}
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        autoResizeTextarea();
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder={selectedModel ? `Ask ${selectedModel.name} anything...` : "Select a model to start chatting"}
                      disabled={!selectedModel || isLoading}
                      className="min-h-[60px] max-h-[200px] resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {inputMessage.length}/2000 characters
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Press Enter to send, Shift+Enter for new line
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || !selectedModel || isLoading}
                      className="h-[60px] px-6"
                    >
                      {isLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearChat}
                      disabled={messages.length === 0}
                      className="h-[60px] px-6"
                      title="Clear chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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