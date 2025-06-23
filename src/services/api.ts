import axios from 'axios';
import { AIModel, ChatRequest, ChatResponse } from '../types';

/*
This file contains all the functions that talk to our backend API.
Think of it as a "messenger" that sends requests to our Python server.

axios is a library that makes it easy to send HTTP requests.
It's like a more powerful version of the browser's fetch() function.
*/

// The base URL of our backend API
// In Docker, the frontend will proxy requests through nginx to the backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production (Docker), use relative path (nginx will proxy)
  : 'http://localhost:5001/api';  // In development, use direct backend URL

// Create an axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/*
API Service Class
This class groups all our API functions together.
It's like having a toolbox with different tools for different jobs.
*/
export class ApiService {
  
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