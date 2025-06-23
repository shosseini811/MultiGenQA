import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, AlertCircle, Sparkles } from 'lucide-react';
import ModelSelector from './components/ModelSelector';
import ChatMessage from './components/ChatMessage';
import { ApiService } from './services/api';
import { AIModel, Message } from './types';

/*
Main App Component

This is the main component that brings everything together.
It manages the entire application state using React hooks.

Key TypeScript/React concepts used here:
- useState: Hook for managing component state
- useEffect: Hook for side effects (like API calls)
- useRef: Hook for accessing DOM elements directly
- Generic types: useState<Type[]> tells TypeScript what type of data we're storing
*/

const App: React.FC = () => {
  // State management using React hooks with TypeScript
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  
  // Ref to scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="app">
      <div className="app__container">
        {/* Header */}
        <header className="app__header">
          <div className="app__title">
            <Sparkles size={32} color="#667eea" />
            <h1>MultiGenQA</h1>
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
              <textarea
                className="app__input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  selectedModel 
                    ? `Ask ${selectedModel.name} anything...` 
                    : 'Please select a model first...'
                }
                disabled={!selectedModel || isLoading}
                rows={3}
              />
              
              <div className="app__input-actions">
                <button
                  className="app__clear-button"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                >
                  Clear
                </button>
                
                <button
                  className="app__send-button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !selectedModel || isLoading}
                >
                  {isLoading ? (
                    <Loader className="app__button-spinner" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .app__container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
        }
        
        .app__header {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid #e2e8f0;
        }
        
        .app__title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .app__title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .app__subtitle {
          margin: 0;
          color: #64748b;
          font-size: 16px;
        }
        
        .app__health-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 14px;
        }
        
        .app__chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .app__messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          padding-bottom: 12px;
        }
        
        .app__welcome {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }
        
        .app__welcome h3 {
          margin: 16px 0 8px 0;
          color: #1e293b;
        }
        
        .app__loading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          color: #64748b;
          font-style: italic;
        }
        
        .app__loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        .app__input-area {
          padding: 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        
        .app__error {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }
        
        .app__input-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .app__input {
          width: 100%;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.2s ease;
        }
        
        .app__input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .app__input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        
        .app__input-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        
        .app__clear-button,
        .app__send-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .app__clear-button {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .app__clear-button:hover:not(:disabled) {
          background: #e2e8f0;
        }
        
        .app__send-button {
          background: #667eea;
          color: white;
        }
        
        .app__send-button:hover:not(:disabled) {
          background: #5a6fd8;
          transform: translateY(-1px);
        }
        
        .app__clear-button:disabled,
        .app__send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .app__button-spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .app {
            padding: 10px;
          }
          
          .app__container {
            height: calc(100vh - 20px);
          }
          
          .app__header {
            padding: 16px;
          }
          
          .app__messages {
            padding: 16px;
          }
          
          .app__input-area {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default App; 