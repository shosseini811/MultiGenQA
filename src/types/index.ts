/*
TypeScript Types - Think of these as "blueprints" or "contracts"
They tell TypeScript what shape our data should have.

For example, if we say a variable is of type "Message", 
TypeScript will make sure it has 'role' and 'content' properties.
*/

// This defines what a single chat message looks like
export interface Message {
  role: 'user' | 'assistant';  // Can only be 'user' or 'assistant'
  content: string;             // The actual text of the message
}

// This defines what an AI model looks like in our app
export interface AIModel {
  id: string;          // Unique identifier like 'openai', 'gemini', 'claude'
  name: string;        // Display name like 'OpenAI GPT-4o'
  description: string; // Description of the model
}

// This defines the structure of API responses from our backend
export interface ChatResponse {
  response: string;    // The AI's response text
  model: string;       // Which model was used
  status: 'success' | 'error';  // Whether the request succeeded
  error?: string;      // Optional error message if something went wrong
}

// This defines what we send to the backend when making a chat request
export interface ChatRequest {
  model: string;       // Which AI model to use
  messages: Message[]; // Array of all messages in the conversation
} 