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
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This allows cookies/sessions to work
});

/*
Authentication Token Management

These functions handle storing and retrieving the JWT token from localStorage.
localStorage is like a persistent storage that survives browser refreshes.
*/
const TOKEN_KEY = 'multigenqa_token';

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
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
      // Token is invalid or expired
      tokenManager.removeToken();
      // You might want to redirect to login page here
      window.location.href = '/login';
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
   * @returns boolean - True if user has a valid token
   */
  static isAuthenticated(): boolean {
    const token = tokenManager.getToken();
    return !!token;
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