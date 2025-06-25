import axios, { AxiosInstance } from 'axios';
import { 
  AIModel, 
  ChatRequest, 
  ChatResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User 
} from '../types';

/*
API Service Layer - Complete Guide for Beginners

This file contains all the functions that talk to our backend API.
Think of it as a "messenger" that sends requests to our Python server.

=== What is an API? ===

API stands for "Application Programming Interface" - it's like a waiter in a restaurant:
- You (frontend) are the customer who wants food (data)
- The kitchen (backend) prepares the food (processes requests)
- The waiter (API) takes your order to the kitchen and brings back your food
- The menu (API documentation) tells you what you can order

In our app:
- Frontend (React) wants to send a chat message
- API service takes the message to the backend
- Backend processes it with AI models
- API service brings back the AI's response

=== What is axios? ===

axios is a JavaScript library that makes HTTP requests easy:
- HTTP requests are how computers talk to each other over the internet
- It's like a more powerful version of the browser's fetch() function
- We use it to GET data (like fetching models) and POST data (like sending messages)
- It handles complex things like timeouts, headers, and error handling automatically

=== Key TypeScript Concepts in This File ===

1. **Interfaces**: Define the shape/structure of data (imported from '../types')
   - LoginRequest: What data we need to log someone in
   - ChatResponse: What we get back from AI models
   - These ensure we send/receive the right data format

2. **Generic Types**: <T> means "this function works with type T"
   - Promise<ChatResponse> means "a Promise that resolves to a ChatResponse"
   - This gives us type safety for asynchronous operations

3. **Async/await**: Handle operations that take time (like network requests)
   - async function: Can contain await statements
   - await: Pauses execution until Promise resolves
   - Much cleaner than .then() and .catch() chains

4. **Error Handling**: try/catch blocks to handle when things go wrong
   - Network failures, server errors, invalid responses
   - Graceful error handling improves user experience

5. **Static Methods**: Functions that belong to the class, not instances
   - ApiService.login() - call directly on the class
   - No need to create instances: new ApiService()
*/

/*
API Configuration

This determines where our frontend sends requests:
- In development: directly to localhost:5001 (your Python backend)
- In production (Docker): to /api (nginx proxies this to the backend)

process.env.NODE_ENV is an environment variable that tells us if we're in:
- 'development': Running locally with npm start
- 'production': Running in Docker or deployed to a server

Why different URLs?
- Development: Direct connection for faster debugging
- Production: Nginx handles SSL, load balancing, and routing
*/
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Docker: nginx proxies to backend
  : 'http://localhost:5001/api';  // Local: direct connection

/*
Axios Instance Creation

What is an instance?
- An instance is like a customized version of axios with our specific settings
- Instead of configuring axios every time we use it, we create one configured instance
- All our API calls will use this instance with these default settings

Think of it like setting up your phone with your preferred settings once,
then every call you make uses those settings automatically.
*/
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  
  /*
  Timeout Configuration:
  
  What is a timeout?
  - timeout: 30000 means 30,000 milliseconds = 30 seconds
  - This is the maximum time we'll wait for ANY API request to complete
  - If the server doesn't respond within 30 seconds, the request will automatically fail
  
  Why do we need timeouts?
  - AI models can take time to generate responses (5-15 seconds is normal)
  - But we don't want users waiting forever if something goes wrong
  - Without timeout: app could freeze indefinitely if server crashes or network fails
  - With timeout: app shows error message after 30 seconds, user knows what happened
  
  Real-world example:
  - User asks GPT-4 a complex question
  - GPT-4 takes 12 seconds to respond → ✅ Works fine (under 30 second limit)
  - Server crashes while processing → ❌ After 30 seconds, we show error message
  */
  timeout: 30000, // 30 second timeout - prevents requests from hanging forever
  
  /*
  HTTP Headers Configuration:
  
  What are headers?
  - Headers are like "labels" or "instructions" attached to every HTTP request
  - Think of them like writing on an envelope when sending mail:
    * The address tells where to send it (URL does this for HTTP)
    * Special instructions tell how to handle it (headers do this for HTTP)
  - Headers tell the server important information about the request
  
  'Content-Type': 'application/json'
  - This tells the server: "The data I'm sending is in JSON format"
  - JSON is a way to structure data, like: {"name": "John", "age": 25}
  - Without this header, the server might not know how to read our data
  - It's like telling someone "I'm speaking English" before you start talking
  
  Why is this important?
  - When we send login data: {"email": "user@example.com", "password": "123"}
  - When we send chat messages: {"model": "gpt-4", "message": "Hello"}
  - The server needs to know this data is JSON so it can parse it correctly
  - Without proper Content-Type, server might reject our requests with 400 Bad Request
  
  Real-world example:
  - Browser sends: Content-Type: application/json + {"email": "john@example.com"}
  - Server reads header, knows it's JSON, parses it correctly
  - Server can now access the email field and process the login
  */
  headers: {
    'Content-Type': 'application/json', // Tell server we're sending JSON data
  },
  
  /*
  withCredentials: true
  
  What does this do?
  - This allows cookies and authentication info to be sent with requests
  - Think of it like showing your ID card when entering a building
  - When you login, the server might give you a "session cookie"
  - This setting ensures that cookie gets sent with future requests
  - Without it, you'd have to login again for every single action
  
  How it works:
  1. You login → Server gives you a session cookie: "session=abc123"
  2. Browser stores this cookie automatically
  3. Next request → Browser automatically includes: Cookie: session=abc123
  4. Server sees cookie, recognizes you're logged in, processes request
  5. Without withCredentials: cookie wouldn't be sent, server thinks you're not logged in
  
  Real-world example:
  - You login to Gmail → Google gives you a session cookie
  - You click "Compose" → Browser sends cookie with request
  - Google sees cookie, knows you're logged in, shows compose window
  - Without cookie: Google would redirect you to login page
  */
  withCredentials: true, // Allow cookies/sessions - keeps you logged in across requests
});

/*
Authentication Token Management

What is a JWT token?
- JWT stands for "JSON Web Token"
- It's like a digital passport that proves who you are
- When you login, the server gives you a token
- You include this token with every request to prove you're logged in
- It's more secure than cookies and works well with modern web apps

localStorage vs sessionStorage vs cookies:
- localStorage: Survives browser restarts, persists until manually cleared
- sessionStorage: Only lasts for current browser tab session
- cookies: Automatically sent with requests, but less flexible
- We use localStorage so users stay logged in even if they close the browser

These functions handle storing and retrieving the JWT token from localStorage.
*/
const TOKEN_KEY = 'multigenqa_token';

export const tokenManager = {
  /*
  Get Token Function
  
  This function retrieves the stored authentication token from localStorage.
  It includes helpful logging to debug authentication issues.
  */
  getToken: (): string | null => {
    // Only log once per session to avoid spam in console
    const shouldLog = !sessionStorage.getItem('token_check_logged');
    if (shouldLog) {
      console.log('🔍 tokenManager.getToken() - checking for stored token...');
      sessionStorage.setItem('token_check_logged', 'true');
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token && shouldLog) {
      console.log('✅ Token found - user is logged in');
      
      /*
      JWT Token Decoding for Debugging
      
      JWT tokens have 3 parts separated by dots: header.payload.signature
      - header: Contains token type and signing algorithm
      - payload: Contains user data and expiration time
      - signature: Proves the token hasn't been tampered with
      
      We decode the payload (middle part) to check expiration time.
      atob() converts base64 to string, JSON.parse() converts string to object.
      */
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
        
        console.log(`⏰ Token expires in ${hoursUntilExpiry} hours`);
      } catch (error) {
        console.log('⚠️ Could not decode token expiration (token might be invalid)');
      }
    } else if (!token && shouldLog) {
      console.log('❌ No token found - user is not logged in');
    }
    
    return token;
  },

  /*
  Set Token Function
  
  Stores the authentication token in localStorage.
  Called when user successfully logs in.
  */
  setToken: (token: string): void => {
    console.log('💾 Storing authentication token...');
    localStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Token stored successfully');
  },

  /*
  Remove Token Function
  
  Removes the authentication token from localStorage.
  Called when user logs out or token becomes invalid.
  */
  removeToken: (): void => {
    console.log('🗑️ Removing authentication token...');
    localStorage.removeItem(TOKEN_KEY);
    console.log('✅ Token removed successfully');
  },

  /*
  Token Expiration Check
  
  Checks if the stored JWT token has expired.
  Returns true if expired or invalid, false if still valid.
  */
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000; // Convert to seconds
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't parse it
    }
  }
};

/*
Axios Request Interceptor

What is an interceptor?
- An interceptor is a function that runs automatically before every request
- Think of it like a security guard that checks everyone before they enter a building
- It can modify the request, add headers, or even cancel it

This interceptor adds the JWT token to every request that needs authentication.
Instead of manually adding the token to each API call, this does it automatically.

How it works:
1. You make an API call: ApiService.getCurrentUser()
2. Interceptor runs before the request is sent
3. Interceptor gets the JWT token from localStorage
4. Interceptor adds "Authorization: Bearer <token>" header
5. Request is sent to server with authentication
6. Server validates token and processes request

Real-world example:
- Without interceptor: You'd have to manually add token to every authenticated request
- With interceptor: Token is automatically added to all requests that need it
*/
api.interceptors.request.use(
  (config) => {
    /*
    Add Authentication Token to Headers
    
    For requests that need authentication, we add the JWT token to the
    Authorization header. The server will read this header to identify
    who is making the request.
    
    The format is: "Bearer <token>"
    - "Bearer" is a standard prefix for JWT tokens
    - It tells the server "this is a bearer token for authentication"
    */
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Added authentication token to request');
    }
    
    /*
    Add Request ID for Debugging
    
    We add a unique ID to each request to help with debugging.
    If something goes wrong, we can trace the exact request that failed.
    */
    const requestId = Math.random().toString(36).substring(2, 15);
    config.headers['X-Request-ID'] = requestId;
    
    return config;
  },
  (error) => {
    /*
    Handle Request Setup Errors
    
    If something goes wrong while setting up the request
    (before it's even sent), we handle it here.
    */
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/*
Axios Response Interceptor

This interceptor runs after every API response and handles authentication errors automatically.
If the server says "401 Unauthorized", we automatically log out the user.

Why is this useful?
- If your token expires while using the app, this catches it automatically
- Instead of showing cryptic error messages, we handle it gracefully
- User gets logged out and redirected to login page
- Prevents the app from getting stuck in a broken state

How it works:
1. API call is made with expired token
2. Server responds with 401 Unauthorized
3. This interceptor catches the 401 response
4. Automatically removes invalid token from localStorage
5. Redirects user to login page
6. User sees clean login screen instead of error messages
*/
api.interceptors.response.use(
  (response) => response, // If response is successful, just return it
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚪 Authentication failed - logging out user');
      console.log('❌ Error details:', error.response?.data?.error || 'Token invalid or expired');
      
      // Token is invalid or expired - clear it and redirect
      tokenManager.removeToken();
      
      // Show user-friendly message
      console.log('🔄 Redirecting to login page due to authentication failure');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/*
API Service Class

What is a class in TypeScript?
- A class is like a blueprint or template for creating objects
- It groups related functions (methods) together
- Static methods belong to the class itself, not to instances of the class
- Think of it like a toolbox with different tools for different jobs

Why use a class here?
- Organizes all our API functions in one place
- Easy to import and use: ApiService.login(), ApiService.getModels()
- Groups related functionality together (auth methods, chat methods, etc.)
- Makes the code more maintainable and easier to understand

Example usage:
- ApiService.login({email: "user@example.com", password: "123"})
- ApiService.getModels()
- ApiService.sendMessage({model: "gpt-4", messages: [...]})
*/
export class ApiService {
  
  // ========== Authentication Methods ==========
  
  /**
   * Register a new user account
   * 
   * What this function does:
   * 1. Takes user registration data (email, password, name)
   * 2. Sends POST request to /api/auth/register
   * 3. Returns the server's response (success or error)
   * 
   * @param userData - User registration data (email, password, first_name, last_name)
   * @returns Promise<AuthResponse> - Registration response from server
   * 
   * Example usage:
   * const result = await ApiService.register({
   *   email: "john@example.com",
   *   password: "securePassword123",
   *   first_name: "John",
   *   last_name: "Doe"
   * });
   * 
   * if (result.token) {
   *   // Registration successful
   * } else if (result.errors) {
   *   // Show validation errors
   * }
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      /*
      HTTP POST Request Explanation:
      - POST is used for creating new resources (new user account)
      - First parameter: '/auth/register' is the endpoint URL
      - Second parameter: userData is the JSON data to send
      - <AuthResponse> tells TypeScript what type of response to expect
      */
      const response = await api.post<AuthResponse>('/auth/register', userData);
      return response.data; // axios wraps response in a 'data' property
    } catch (error) {
      console.error('Registration error:', error);
      
      /*
      Error Handling:
      - axios.isAxiosError() checks if this is a network/HTTP error
      - error.response exists if server sent back an error response
      - If server sent structured error data, we return it
      - Otherwise, we throw a generic error
      */
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      throw new Error('Registration failed');
    }
  }

  /**
   * Login with email and password
   * 
   * What this function does:
   * 1. Sends login credentials to the server
   * 2. If successful, stores the JWT token automatically
   * 3. Returns the response with user data and token
   * 
   * @param credentials - Login credentials (email and password)
   * @returns Promise<AuthResponse> - Login response with token and user data
   * 
   * Example usage:
   * const result = await ApiService.login({
   *   email: "john@example.com",
   *   password: "securePassword123"
   * });
   * 
   * if (result.token && result.user) {
   *   // Login successful - token is automatically stored
   *   console.log("Welcome", result.user.first_name);
   * } else {
   *   // Show error message
   *   console.error(result.error);
   * }
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      
      // If login successful, store the token automatically
      if (response.data.token) {
        tokenManager.setToken(response.data.token);
        console.log('🔐 Login successful - token stored');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      throw new Error('Login failed');
    }
  }

  /**
   * Logout the current user
   * 
   * What this function does:
   * 1. Removes the JWT token from localStorage
   * 2. Optionally notifies the server about logout (for session cleanup)
   * 3. User will need to login again to access protected features
   * 
   * @returns Promise<void> - Completes when logout is finished
   * 
   * Example usage:
   * await ApiService.logout();
   * // User is now logged out, redirect to login page
   */
  static async logout(): Promise<void> {
    try {
      /*
      Optional Server Notification:
      
      Some apps notify the server when user logs out so the server can:
      - Invalidate the token on server side
      - Clean up user sessions
      - Update "last active" timestamps
      - Log security events
      
      This is optional - JWT tokens are stateless and will expire naturally.
      */
      // await api.post('/auth/logout'); // Uncomment if server needs logout notification
      
      // Always remove token from localStorage
      tokenManager.removeToken();
      console.log('👋 User logged out successfully');
    } catch (error) {
      // Even if server request fails, we still want to remove local token
      console.error('Logout error (still removing local token):', error);
      tokenManager.removeToken();
    }
  }

  /**
   * Get current user information
   * 
   * What this function does:
   * 1. Sends authenticated request to get current user's profile
   * 2. Uses the stored JWT token automatically (via request interceptor)
   * 3. Returns user data if token is valid
   * 4. Throws error if token is invalid or expired
   * 
   * @returns Promise<User> - Current user's profile data
   * 
   * Example usage:
   * try {
   *   const user = await ApiService.getCurrentUser();
   *   console.log("Current user:", user.first_name, user.email);
   * } catch (error) {
   *   // Token is invalid - user needs to login again
   *   console.log("Please login again");
   * }
   */
  static async getCurrentUser(): Promise<User> {
    try {
      /*
      GET Request with Authentication:
      - GET is used for retrieving data (not creating or modifying)
      - No second parameter needed (no data to send)
      - Request interceptor automatically adds Authorization header
      - Server validates token and returns user data
      */
      const response = await api.get<{ user: User }>('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw new Error('Failed to get user information');
    }
  }

  /**
   * Verify email with token
   * 
   * What this function does:
   * 1. Sends email verification token to server
   * 2. Server validates the token and marks email as verified
   * 3. Returns success or error response
   * 
   * @param token - Email verification token (from email link)
   * @returns Promise<AuthResponse> - Verification response
   * 
   * Example usage:
   * const result = await ApiService.verifyEmail("abc123token");
   * if (result.message === "Email verified successfully") {
   *   // Show success message
   * }
   */
  static async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      throw new Error('Email verification failed');
    }
  }

  /**
   * Check if user is authenticated
   * 
   * What this function does:
   * 1. Checks if a JWT token exists in localStorage
   * 2. Validates that the token is not expired
   * 3. Returns true if user is properly authenticated
   * 4. Automatically cleans up expired tokens
   * 
   * @returns boolean - True if user has a valid, non-expired token
   * 
   * Example usage:
   * if (ApiService.isAuthenticated()) {
   *   // Show main app interface
   * } else {
   *   // Show login form
   * }
   */
  static isAuthenticated(): boolean {
    const token = tokenManager.getToken();
    if (!token) return false;
    
    // Check if token is expired
    if (tokenManager.isTokenExpired()) {
      console.log('🚫 Token is expired, removing it');
      tokenManager.removeToken();
      return false;
    }
    
    return true;
  }

  // ========== AI Model Methods ==========

  /**
   * Get available AI models
   * 
   * What this function does:
   * 1. Fetches list of available AI models from backend
   * 2. Backend checks which AI services are configured and working
   * 3. Returns array of model objects with id, name, and description
   * 
   * @returns Promise<AIModel[]> - Array of available AI models
   * 
   * Example usage:
   * const models = await ApiService.getModels();
   * console.log("Available models:", models.map(m => m.name));
   * // Output: ["OpenAI GPT-4o", "Google Gemini Pro", "Claude 3.5 Sonnet"]
   */
  static async getModels(): Promise<AIModel[]> {
    try {
      /*
      GET Request for Models:
      - GET is perfect for retrieving data that doesn't change often
      - No authentication required - model list is public information
      - Backend might cache this response for better performance
      */
      const response = await api.get<{ models: AIModel[] }>('/models');
      console.log(`📋 Loaded ${response.data.models.length} AI models`);
      return response.data.models;
    } catch (error) {
      console.error('Failed to load models:', error);
      
      /*
      Fallback Models:
      
      If the backend is down or unreachable, we provide a fallback list
      so the app doesn't completely break. Users will see the models
      but get errors when trying to use them.
      */
      console.log('🔄 Using fallback model list');
      return [
        {
          id: 'openai',
          name: 'OpenAI GPT-4o (Offline)',
          description: 'Backend unavailable - please try again later'
        },
        {
          id: 'gemini',
          name: 'Google Gemini (Offline)',
          description: 'Backend unavailable - please try again later'
        },
        {
          id: 'claude',
          name: 'Claude 3.5 Sonnet (Offline)',
          description: 'Backend unavailable - please try again later'
        }
      ];
    }
  }

  // ========== Chat Methods ==========

  /**
   * Send message to AI model
   * 
   * What this function does:
   * 1. Sends chat request with model selection and message history
   * 2. Backend forwards request to chosen AI service (OpenAI, Gemini, Claude)
   * 3. AI service processes the conversation and generates response
   * 4. Backend returns the AI's response to our frontend
   * 
   * Why do we send the full conversation history?
   * - AI models need context to provide relevant responses
   * - Without history, each message would be treated as a new conversation
   * - This enables follow-up questions and contextual understanding
   * 
   * @param request - Chat request with model and message history
   * @returns Promise<ChatResponse> - AI's response with metadata
   * 
   * Example usage:
   * const response = await ApiService.sendMessage({
   *   model: 'openai',
   *   messages: [
   *     { role: 'user', content: 'What is the capital of France?' },
   *     { role: 'assistant', content: 'The capital of France is Paris.' },
   *     { role: 'user', content: 'What is its population?' }
   *   ]
   * });
   * 
   * console.log("AI said:", response.response);
   */
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      console.log(`💬 Sending message to ${request.model} with ${request.messages.length} messages`);
      
      /*
      POST Request for Chat:
      - POST is used because we're creating new content (AI response)
      - Requires authentication (user must be logged in to use AI services)
      - May take 5-30 seconds depending on AI model and complexity
      - Request interceptor automatically adds authentication token
      */
      const response = await api.post<ChatResponse>('/chat', request);
      
      console.log(`✅ Received response from ${response.data.model}`);
      return response.data;
    } catch (error) {
      console.error('Chat request failed:', error);
      
      /*
      Chat-Specific Error Handling:
      
      Chat requests can fail for many reasons:
      - AI service is down or overloaded
      - User exceeded rate limits
      - Invalid API keys on backend
      - Network connectivity issues
      - Message content violates AI service policies
      
      We provide specific error messages for better user experience.
      */
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          // Rate limit exceeded
          return {
            response: '',
            model: request.model,
            status: 'error',
            error: 'Too many requests. Please wait a moment and try again.'
          };
        } else if (error.response?.status === 503) {
          // Service unavailable
          return {
            response: '',
            model: request.model,
            status: 'error',
            error: `${request.model} service is temporarily unavailable. Please try a different model.`
          };
        } else if (error.response?.data?.error) {
          // Server provided specific error message
          return {
            response: '',
            model: request.model,
            status: 'error',
            error: error.response.data.error
          };
        }
      }
      
      // Generic error fallback
      return {
        response: '',
        model: request.model,
        status: 'error',
        error: 'Failed to get response from AI model. Please try again.'
      };
    }
  }

  // ========== Health Check Methods ==========

  /**
   * Check backend health
   * 
   * What this function does:
   * 1. Sends a simple request to the backend health endpoint
   * 2. Backend responds with system status and service availability
   * 3. Returns true if backend is healthy, false if not
   * 
   * This is useful for:
   * - Showing connection status in the UI
   * - Automatically retrying when backend comes back online
   * - Debugging connectivity issues
   * - Monitoring system health
   * 
   * @returns Promise<boolean> - True if backend is healthy and responsive
   * 
   * Example usage:
   * const isHealthy = await ApiService.checkHealth();
   * if (isHealthy) {
   *   console.log("✅ Backend is running normally");
   * } else {
   *   console.log("❌ Backend is down or having issues");
   * }
   */
  static async checkHealth(): Promise<boolean> {
    try {
      /*
      Health Check Request:
      - GET request to /health endpoint
      - Should be fast (< 1 second response time)
      - No authentication required
      - Returns basic system status
      */
      const response = await api.get('/health');
      
      /*
      Health Response Validation:
      
      We check both the HTTP status code and the response content.
      A healthy backend should return:
      - HTTP 200 status code
      - JSON response with status: 'healthy'
      - Service status information
      */
      const isHealthy = response.status === 200 && 
                       response.data?.status === 'healthy';
      
      if (isHealthy) {
        console.log('💚 Backend health check passed');
        
        // Log service status for debugging
        if (response.data.services) {
          console.log('🔧 Service status:', response.data.services);
        }
      } else {
        console.log('💔 Backend health check failed - status:', response.data?.status);
      }
      
      return isHealthy;
    } catch (error) {
      /*
      Health Check Error Handling:
      
      If health check fails, it usually means:
      - Backend server is not running
      - Network connectivity issues
      - Backend is overloaded and not responding
      - Firewall or proxy issues
      */
      console.error('💔 Backend health check failed:', error);
      
      // Provide helpful error context
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.log('🚫 Backend server is not running or not reachable');
        } else if (error.code === 'ETIMEDOUT') {
          console.log('⏰ Backend server is not responding (timeout)');
        } else {
          console.log(`🔥 Backend error: ${error.message}`);
        }
      }
      
      return false;
    }
  }
} 