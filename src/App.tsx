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

import { Sparkles, AlertCircle, Send, Trash2, Loader, Bot } from 'lucide-react';

/*
MultiGenQA - Main Application Component

This is the main React component that brings everything together.
It demonstrates many important React and TypeScript concepts that are essential
for modern web development.

=== Key React Concepts Explained ===

1. **Components**: Think of components like LEGO blocks
   - Each component is a reusable piece of UI
   - Components can contain other components
   - App.tsx is the main component that contains all others

2. **Props**: Data passed from parent to child components
   - Like function parameters, but for components
   - Example: <ModelSelector models={models} onModelSelect={setSelectedModel} />
   - The ModelSelector component receives 'models' and 'onModelSelect' as props

3. **State**: Data that can change over time
   - When state changes, React automatically re-renders the component
   - Example: const [messages, setMessages] = useState<Message[]>([]);
   - 'messages' is the current value, 'setMessages' is the function to update it

4. **Hooks**: Special functions that let you "hook into" React features
   - useState: Manage component state
   - useEffect: Run code when component mounts or state changes
   - useRef: Access DOM elements directly
   - All hooks start with "use" and must be called at the top level of components

5. **Event Handlers**: Functions that respond to user actions
   - onClick: When user clicks a button
   - onChange: When user types in an input
   - onSubmit: When user submits a form

=== TypeScript Concepts Explained ===

1. **Type Annotations**: Tell TypeScript what type of data to expect
   - const [isLoading, setIsLoading] = useState<boolean>(false);
   - This tells TypeScript that isLoading will always be true or false

2. **Interfaces**: Define the shape/structure of objects
   - interface Message { role: 'user' | 'assistant', content: string }
   - This ensures all Message objects have exactly these properties

3. **Generic Types**: Types that work with multiple data types
   - useState<Message[]> means "useState that works with an array of Message objects"
   - Promise<ChatResponse> means "a Promise that resolves to a ChatResponse"

4. **Optional Types**: Properties that might or might not exist
   - selectedModel?: AIModel means selectedModel can be an AIModel or undefined

=== Authentication Flow ===

This app uses a multi-layered authentication system:
1. AuthProvider: Wraps the entire app, manages login state globally
2. AuthFlow: Handles switching between login and register forms
3. AppContent: Shows different UI based on authentication status
4. ChatInterface: The main app, only shown to logged-in users

=== State Management Strategy ===

We use React's built-in state management with hooks:
- Local state (useState): For component-specific data like input values
- Context state (AuthProvider): For global data like user authentication
- Derived state: Calculated from other state, like whether to show error messages
*/

// Main Chat Interface Component (protected by authentication)
const ChatInterface: React.FC = () => {
  /*
  useAuth Hook
  
  This is a custom hook that gives us access to authentication state.
  It's provided by the AuthProvider component that wraps our entire app.
  
  What we get from useAuth:
  - authState: Current authentication status and user data
  - logout: Function to log out the current user
  */
  const { authState, logout } = useAuth();
  
  /*
  State Management using React Hooks with TypeScript
  
  Each useState call creates a piece of state and a function to update it.
  The <Type> syntax tells TypeScript what type of data this state will hold.
  
  Why we need state:
  - React components re-render when state changes
  - This is how the UI stays in sync with data
  - Without state, the UI would be static and never update
  */
  
  // Array of available AI models (OpenAI, Gemini, Claude)
  const [models, setModels] = useState<AIModel[]>([]);
  
  // Currently selected AI model (undefined means no model selected)
  const [selectedModel, setSelectedModel] = useState<AIModel | undefined>();
  
  // Array of all messages in the current conversation
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Current text the user is typing (controlled input)
  const [inputMessage, setInputMessage] = useState<string>('');
  
  // Whether we're currently waiting for an AI response
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Error message to display to user (empty string means no error)
  const [error, setError] = useState<string>('');
  
  // Whether the backend server is responding to health checks
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  
  /*
  Refs for DOM Elements
  
  useRef lets us access DOM elements directly, like document.getElementById
  but in a React-friendly way. We use refs when we need to:
  - Scroll to a specific element
  - Focus an input field
  - Measure element dimensions
  - Access native DOM methods
  
  The <HTMLDivElement> and <HTMLTextAreaElement> tell TypeScript
  what type of DOM element this ref will point to.
  */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /*
  useEffect Hook - Component Lifecycle
  
  useEffect lets us run code at specific times in the component's lifecycle:
  - When component first mounts (appears on screen)
  - When specific state values change
  - When component unmounts (disappears from screen)
  
  The dependency array [] means this effect only runs once when the component mounts.
  It's like the "setup" code that runs when the component first loads.
  */
  useEffect(() => {
    loadModels();        // Fetch available AI models from backend
    checkBackendHealth(); // Check if backend server is running
    // Set dark theme on mount for better user experience
    document.documentElement.classList.add('dark');
  }, []); // Empty dependency array = run once on mount

  /*
  Auto-scroll Effect
  
  This effect runs whenever the messages array changes.
  It automatically scrolls to the bottom of the chat so users
  can always see the latest message without manual scrolling.
  
  The dependency array [messages] means this effect runs every time
  the messages array changes (when new messages are added).
  */
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Run when messages array changes

  /*
  Async Functions - API Communication
  
  These functions handle communication with our backend API.
  They're marked as 'async' because they deal with promises (asynchronous operations).
  The 'await' keyword waits for the promise to resolve before continuing.
  
  Why async/await?
  - Network requests take time (100ms to several seconds)
  - We don't want to freeze the UI while waiting
  - async/await lets us write asynchronous code that looks synchronous
  - Much cleaner than using .then() and .catch() with promises
  */
  
  /**
   * Load Available AI Models
   * 
   * This function fetches the list of available AI models from our backend.
   * The backend checks which AI services are configured and available.
   */
  const loadModels = async () => {
    try {
      const availableModels = await ApiService.getModels();
      setModels(availableModels);
      console.log('📋 Loaded models:', availableModels.map(m => m.name).join(', '));
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load AI models. Please check if the backend is running.');
    }
  };

  /**
   * Check Backend Health
   * 
   * This function checks if our Python backend server is running and responding.
   * We use this to show helpful error messages if the backend is down.
   */
  const checkBackendHealth = async () => {
    const healthy = await ApiService.checkHealth();
    setIsHealthy(healthy);
    if (!healthy) {
      setError('Backend server is not responding. Please start the Python backend.');
      console.warn('🚨 Backend health check failed');
    } else {
      console.log('✅ Backend is healthy');
    }
  };

  /**
   * Scroll to Bottom of Chat
   * 
   * This function smoothly scrolls the chat container to the bottom
   * so users can always see the latest messages.
   * 
   * How it works:
   * 1. messagesEndRef.current points to a <div> at the bottom of the chat
   * 2. scrollIntoView() is a native DOM method that scrolls to an element
   * 3. { behavior: 'smooth' } makes it animate smoothly instead of jumping
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Auto-resize Textarea
   * 
   * This function automatically adjusts the height of the input textarea
   * as the user types, making it taller for longer messages.
   * 
   * How it works:
   * 1. Set height to 'auto' to reset it
   * 2. scrollHeight is the full height needed to show all content
   * 3. Math.min() limits the maximum height to 200px
   * 4. Set the height to the calculated value
   */
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  /**
   * Handle Send Message
   * 
   * This is the main function that sends a message to the AI and handles the response.
   * It demonstrates several important concepts:
   * - Input validation
   * - Optimistic UI updates
   * - Error handling
   * - State management
   */
  const handleSendMessage = async () => {
    /*
    Input Validation
    
    Before doing anything expensive (like API calls), we check if the input is valid:
    - inputMessage.trim() removes whitespace from beginning and end
    - !selectedModel checks if user has selected an AI model
    - isLoading prevents sending multiple messages simultaneously
    */
    if (!inputMessage.trim() || !selectedModel || isLoading) {
      return; // Exit early if validation fails
    }

    /*
    Create User Message Object
    
    We create a Message object that follows our TypeScript interface:
    - role: 'user' indicates this message is from the user (not AI)
    - content: the actual text the user typed
    */
    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim()
    };

    /*
    Optimistic UI Update
    
    We immediately add the user's message to the chat before sending it to the AI.
    This makes the UI feel more responsive - users see their message right away
    instead of waiting for the server response.
    
    Spread operator (...) creates a new array with all existing messages plus the new one.
    This is important because React needs a new array reference to detect changes.
    */
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Clear the input field and show loading state
    setInputMessage('');
    setIsLoading(true);
    setError(''); // Clear any previous errors

    try {
      /*
      Send Request to Backend
      
      We send the entire conversation history to the AI, not just the latest message.
      This allows the AI to understand context and provide more relevant responses.
      
      The request includes:
      - model: which AI service to use (OpenAI, Gemini, or Claude)
      - messages: the full conversation history including the new user message
      */
      const response = await ApiService.sendMessage({
        model: selectedModel.id,
        messages: updatedMessages
      });

      /*
      Add AI Response to Chat
      
      Create a new Message object for the AI's response:
      - role: 'assistant' indicates this message is from the AI
      - content: the AI's response text
      */
      const aiMessage: Message = {
        role: 'assistant',
        content: response.response
      };

      /*
      Update Messages State
      
      Add the AI's response to the conversation.
      We use the spread operator again to create a new array.
      */
      setMessages([...updatedMessages, aiMessage]);
      
      console.log('💬 AI response received:', response.response.substring(0, 100) + '...');
      
    } catch (err) {
      /*
      Error Handling
      
      If something goes wrong (network error, server error, etc.),
      we show a helpful error message to the user.
      
      instanceof Error checks if err is an Error object with a message property.
      Otherwise, we show a generic error message.
      */
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('💥 Error sending message:', err);
    } finally {
      /*
      Cleanup
      
      The finally block always runs, whether the try block succeeded or failed.
      We use it to clean up the loading state so the UI doesn't get stuck
      showing a loading spinner forever.
      */
      setIsLoading(false);
    }
  };

  /**
   * Handle Key Press Events
   * 
   * This function handles keyboard shortcuts in the textarea.
   * - Enter: Send the message
   * - Shift+Enter: Add a new line (default behavior)
   * 
   * React.KeyboardEvent<HTMLTextAreaElement> tells TypeScript this is a
   * keyboard event from a textarea element.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default Enter behavior (new line)
      handleSendMessage(); // Send the message instead
    }
  };

  /**
   * Clear Chat History
   * 
   * This function resets the conversation to start fresh.
   * It clears both the messages and any error states.
   */
  const clearChat = () => {
    setMessages([]);
    setError('');
    console.log('🧹 Chat cleared');
  };

  /**
   * Handle User Logout
   * 
   * This function logs out the current user using the logout function
   * from our authentication context.
   */
  const handleLogout = async () => {
    try {
      await logout();
      console.log('👋 User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /*
  JSX Return Statement
  
  JSX is a syntax extension that lets us write HTML-like code in JavaScript.
  It gets compiled to React.createElement() calls.
  
  Key JSX concepts:
  - className instead of class (class is a reserved word in JavaScript)
  - Event handlers use camelCase (onClick, onChange)
  - JavaScript expressions go inside curly braces {}
  - Components start with capital letters
  - Self-closing tags need the slash: <img />
  
  Conditional rendering:
  - {condition && <Component />} renders Component only if condition is true
  - {condition ? <ComponentA /> : <ComponentB />} renders A or B based on condition
  */
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        
        {/* Header with User Info and Logout Button */}
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
                  {/* 
                  Optional Chaining (?.)
                  authState.user?.first_name safely accesses first_name even if user is null
                  Without ?. we'd get an error if user is null
                  */}
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
            
            {/* 
            Conditional Rendering - Backend Health Warning
            This only shows if the backend is not healthy
            */}
            {!isHealthy && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Backend server not responding. Please start the Python backend.</span>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* 
        Model Selector Component
        
        This demonstrates props passing:
        - models: array of available AI models
        - selectedModel: currently selected model (can be undefined)
        - onModelSelect: callback function when user selects a model
        
        When user selects a model in ModelSelector, it calls onModelSelect(model),
        which is actually setSelectedModel(model), updating our state.
        */}
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
        />

        {/* Chat Interface */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedModel ? (
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <span>Chatting with {selectedModel.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedModel.id}
                    </Badge>
                  </div>
                ) : (
                  'Select a model to start chatting'
                )}
              </CardTitle>
              
              {/* Clear Chat Button - only show if there are messages */}
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Chat
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col min-h-0">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                /* 
                Empty State
                Shows when there are no messages yet
                */
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-3">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Ready to chat!</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedModel 
                          ? `Ask ${selectedModel.name} anything you'd like to know.`
                          : 'Select an AI model above to get started.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* 
                Messages List
                
                .map() creates a new array by transforming each element
                For each message, we create a ChatMessage component
                
                Key prop is required by React for efficient re-rendering
                We use the index as the key since messages don't have unique IDs
                */
                <>
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      message={message}
                      model={selectedModel?.name}
                    />
                  ))}
                  
                  {/* Loading indicator while waiting for AI response */}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {selectedModel?.name} is thinking...
                      </span>
                    </div>
                  )}
                  
                  {/* 
                  Scroll Anchor
                  This invisible div is used as a scroll target
                  messagesEndRef points to this element
                  */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Error Display - only shows if there's an error */}
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
                  {/* 
                  Controlled Input Component
                  
                  This is a "controlled" component because React controls its value:
                  - value={inputMessage} sets the display value
                  - onChange updates the state when user types
                  - This ensures React state is always in sync with what user sees
                  */}
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      autoResizeTextarea(); // Adjust height as user types
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
                
                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedModel || isLoading || !inputMessage.trim()}
                  className="self-end mb-7"
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/*
Authentication Flow Component

This component handles the login/registration flow.
It demonstrates:
- State management for UI modes
- Callback functions between components
- Conditional rendering based on state
*/
const AuthFlow: React.FC = () => {
  /*
  UI Mode State
  
  This state controls which form to show:
  - 'login': Show the login form
  - 'register': Show the registration form
  
  Union types ('login' | 'register') restrict the value to only these two options.
  */
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { login } = useAuth();

  /*
  Callback Functions
  
  These functions are passed to child components as props.
  When something happens in the child (like successful login),
  the child calls these functions to notify the parent.
  
  This is called "lifting state up" - the parent manages state
  and passes down both data and functions to modify that data.
  */
  
  const handleLoginSuccess = (user: any, token: string) => {
    login(user, token); // Update global auth state
  };

  const handleRegisterSuccess = (message: string) => {
    setSuccessMessage(message);
    setAuthMode('login'); // Switch to login form after successful registration
  };

  const switchToRegister = () => {
    setAuthMode('register');
    setSuccessMessage(''); // Clear any success messages
  };

  const switchToLogin = () => {
    setAuthMode('login');
    setSuccessMessage(''); // Clear any success messages
  };

  return (
    <div className="auth-flow">
      {/* Success message banner */}
      {successMessage && (
        <div className="auth-success-message">
          <AlertCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* 
      Conditional Rendering - Show Login or Register Form
      
      This is a ternary operator: condition ? valueIfTrue : valueIfFalse
      Based on authMode state, we show either Login or Register component.
      */}
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

/*
Main App Component with Authentication

This is the root component that wraps everything in the AuthProvider.
The AuthProvider gives all child components access to authentication state.
*/
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

/*
App Content Component

This component uses the authentication context to decide what to show:
- Loading screen while checking authentication
- Login/register flow if not authenticated
- Main chat interface if authenticated

This pattern is called "conditional rendering" and is very common in React apps.
*/
const AppContent: React.FC = () => {
  const { authState } = useAuth();

  /*
  Loading State
  
  While the app is checking if the user is already logged in
  (by validating a stored JWT token), we show a loading screen.
  */
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

  /*
  Unauthenticated State
  
  If the user is not logged in, show the authentication flow
  (login and registration forms).
  */
  if (!authState.isAuthenticated) {
    return <AuthFlow />;
  }

  /*
  Authenticated State
  
  If the user is logged in, show the main chat interface.
  */
  return <ChatInterface />;
};

export default App; 