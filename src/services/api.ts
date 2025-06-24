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
This file contains all the functions that talk to our backend API.
Think of it as a "messenger" that sends requests to our Python server.

axios is a library that makes it easy to send HTTP requests.
It's like a more powerful version of the browser's fetch() function.
*/

/*
API Configuration

This determines where our frontend sends requests:
- In development: directly to localhost:5001 (your Python backend)
- In production (Docker): to /api (nginx proxies this to the backend)
*/
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Docker: nginx proxies to backend
  : 'http://localhost:5001/api';  // Local: direct connection

/*
Axios Instance Creation

Axios is like a smart fetch() function that handles HTTP requests.
We create an instance with default settings that all our API calls will use.
*/
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  
  /*
  Timeout Configuration:
  - timeout: 30000 means 30,000 milliseconds = 30 seconds
  - This is the maximum time we'll wait for ANY API request to complete
  - If the server doesn't respond within 30 seconds, the request will automatically fail
  - Why 30 seconds? AI models can take time to generate responses, but we don't want
    users waiting forever if something goes wrong
  - Without timeout: app could freeze indefinitely if server crashes or network fails
  - With timeout: app shows error message after 30 seconds, user knows what happened
  */
  timeout: 30000, // 30 second timeout - prevents requests from hanging forever
  
  /*
  HTTP Headers Configuration:
  
  What are headers?
  - Headers are like "labels" or "instructions" attached to every HTTP request
  - Think of them like writing on an envelope when sending mail:
    * The address tells where to send it
    * Special instructions tell how to handle it
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
  - Without proper Content-Type, server might reject our requests
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
  
  Example:
  - You login → Server gives you a session cookie
  - You send a chat message → Cookie proves you're still logged in
  - Server processes your request because it recognizes you
  */
  withCredentials: true, // Allow cookies/sessions - keeps you logged in
});

/*
Authentication Token Management

These functions handle storing and retrieving the JWT token from localStorage.
localStorage is like a persistent storage that survives browser refreshes.
*/
const TOKEN_KEY = 'multigenqa_token';

export const tokenManager = {
  getToken: (): string | null => {
    console.log('🔍 tokenManager.getToken() called - checking for stored token...');
    console.log('📍 Looking for token with key:', TOKEN_KEY);
    
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      console.log('✅ Token found in localStorage:', token.substring(0, 20) + '...');
      console.log('🎫 User is logged in - token exists');
      
      // Try to decode the token to check expiration (for debugging)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        if (timeUntilExpiry > 0) {
          console.log('⏰ Token expires in:', Math.round(timeUntilExpiry / 1000 / 60), 'minutes');
        } else {
          console.log('⚠️ Token appears to be expired by:', Math.round(Math.abs(timeUntilExpiry) / 1000 / 60), 'minutes');
        }
      } catch (decodeError) {
        console.log('⚠️ Could not decode token for expiration check:', decodeError);
      }
    } else {
      console.log('❌ No token found in localStorage');
      console.log('🚫 User is not logged in - no token exists');
    }
    
    return token;
  },
  
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken: (): void => {
    console.log('🗑️ Removing token from localStorage');
    localStorage.removeItem(TOKEN_KEY);
  },
  
  isTokenExpired: (): boolean => {
    const token = tokenManager.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      return currentTime >= expirationTime;
    } catch (error) {
      console.log('⚠️ Error checking token expiration:', error);
      return true; // Assume expired if we can't decode
    }
  }
};

/*
Axios Request Interceptor

This automatically adds the Authorization header to all API requests
if the user is logged in. It's like having a helper that always
remembers to include your ID badge when entering a building.
*/
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
Axios Response Interceptor

This handles authentication errors automatically.
If the server says "401 Unauthorized", we automatically log out the user.
*/
api.interceptors.response.use(
  (response) => response,
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
This class groups all our API functions together.
It's like having a toolbox with different tools for different jobs.
*/
export class ApiService {
  
  // ========== Authentication Methods ==========
  
  /**
   * Register a new user account
   * 
   * @param userData - User registration data
   * @returns Promise<AuthResponse> - Registration response
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      throw new Error('Registration failed');
    }
  }

  /**
   * Login with email and password
   * 
   * @param credentials - Login credentials
   * @returns Promise<AuthResponse> - Login response with token
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      
      // If login successful, store the token
      if (response.data.token) {
        tokenManager.setToken(response.data.token);
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
   * @returns Promise<void>
   */
  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token from localStorage
      tokenManager.removeToken();
    }
  }

  /**
   * Get current user information
   * 
   * @returns Promise<User> - Current user data
   */
  static async getCurrentUser(): Promise<User> {
    try {
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
   * @param token - Email verification token
   * @returns Promise<AuthResponse> - Verification response
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
   * @returns boolean - True if user has a valid, non-expired token
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
   * Get the list of available AI models from the backend
   * Returns: Promise<AIModel[]> - A promise that resolves to an array of models
   */
  static async getModels(): Promise<AIModel[]> {
    try {
      const response = await api.get<{ models: AIModel[] }>('/models');
      return response.data.models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw new Error('Failed to fetch available models');
    }
  }

  /**
   * Send a chat message to the selected AI model
   * 
   * @param request - The chat request containing model and messages
   * @returns Promise<ChatResponse> - A promise that resolves to the AI's response
   */
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/chat', request);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with an error status
          throw new Error(error.response.data?.error || 'Server error occurred');
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('No response from server. Please check if the backend is running.');
        }
      }
      
      throw new Error('Failed to send message');
    }
  }

  /**
   * Check if the backend API is healthy and running
   * Returns: Promise<boolean> - True if the API is healthy
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
} 