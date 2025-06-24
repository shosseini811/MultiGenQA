/*
TypeScript Type Definitions for MultiGenQA

This file contains all the TypeScript interfaces and types used throughout the application.
TypeScript interfaces help us define the "shape" of our data - what properties objects should have.
*/

/**
 * Message Interface
 * Defines the structure of a chat message
 */
export interface Message {
  role: 'user' | 'assistant';  // Can only be 'user' or 'assistant'
  content: string;             // The actual text of the message
}

/**
 * AI Model Interface
 * Defines the structure of an AI model object
 */
export interface AIModel {
  id: string;          // Unique identifier like 'openai', 'gemini', 'claude'
  name: string;        // Display name like 'OpenAI GPT-4o'
  description: string; // Description of the model
}

/**
 * Chat Response Interface
 * Defines what we expect back from the chat API
 */
export interface ChatResponse {
  response: string;    // The AI's response text
  model: string;       // Which model was used
  status: 'success' | 'error';  // Whether the request succeeded
  error?: string;      // Optional error message if something went wrong
}

/**
 * Chat Request Interface
 * Defines what we send to the chat API
 */
export interface ChatRequest {
  model: string;       // Which AI model to use
  messages: Message[]; // Array of all messages in the conversation
}

/**
 * User Interface
 * Defines the structure of a user object
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_active: string;
  last_login: string | null;
}

/**
 * Authentication State Interface
 * Defines the authentication state in our app
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

/**
 * Login Request Interface
 * Defines what we send to the login API
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register Request Interface
 * Defines what we send to the register API
 */
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

/**
 * Authentication Response Interface
 * Defines what we get back from auth APIs
 */
export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
  errors?: Record<string, string[]>;
  error?: string;
}

/**
 * Validation Errors Interface
 * Defines the structure of validation errors
 */
export interface ValidationErrors {
  email?: string[];
  password?: string[];
  first_name?: string[];
  last_name?: string[];
} 