/*
TypeScript Type Definitions for MultiGenQA - Complete Beginner's Guide

This file contains all the TypeScript interfaces and types used throughout the application.
Understanding these types is crucial for working with TypeScript effectively.

=== What are TypeScript Types? ===

TypeScript types are like contracts that define what data should look like.
Think of them as blueprints or templates that ensure consistency across your app.

Benefits of using types:
1. **Catch errors early**: TypeScript will warn you if you use wrong data types
2. **Better autocomplete**: Your IDE can suggest available properties and methods
3. **Self-documenting code**: Types serve as inline documentation
4. **Refactoring safety**: When you change a type, TypeScript shows all affected code
5. **Team collaboration**: Everyone knows exactly what data structures to expect

=== Key TypeScript Concepts ===

1. **Interfaces**: Define the shape/structure of objects
   - Like a blueprint that says "objects of this type must have these properties"
   - Example: interface User { name: string; age: number; }

2. **Union Types**: Allow a value to be one of several types  
   - Example: 'user' | 'assistant' means the value can only be 'user' OR 'assistant'
   - Prevents typos and ensures only valid values are used

3. **Optional Properties**: Properties that might or might not exist
   - Example: error?: string means error is optional (can be undefined)
   - The ? makes it optional

4. **Array Types**: Define arrays of specific types
   - Example: string[] means "array of strings"
   - Example: Message[] means "array of Message objects"

5. **Generic Types**: Types that work with other types
   - Example: Promise<User> means "a Promise that resolves to a User object"
   - The <> syntax specifies what type goes inside

=== How These Types Are Used ===

When you see code like:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
```

This tells TypeScript:
- messages is an array of Message objects
- setMessages is a function that accepts an array of Message objects
- If you try to add a wrong type to messages, TypeScript will show an error

=== Real-World Analogies ===

Think of TypeScript interfaces like:
- **Forms**: A form defines what fields you must fill out
- **Recipes**: A recipe defines what ingredients you need
- **Contracts**: A contract defines what both parties must provide
- **Building blueprints**: Blueprints define what rooms a house must have

In our app, interfaces define what properties our data objects must have.
*/

/**
 * Message Interface
 * 
 * Defines the structure of a chat message in our application.
 * Every message object must have exactly these properties with these types.
 * 
 * This is the foundation of our chat system - every message that flows through
 * the app (from user input to AI responses) follows this structure.
 * 
 * @example
 * // Valid Message objects:
 * const userMessage: Message = {
 *   role: 'user',
 *   content: 'Hello, how are you?'
 * };
 * 
 * const aiMessage: Message = {
 *   role: 'assistant', 
 *   content: 'I am doing well, thank you for asking!'
 * };
 * 
 * @example
 * // Invalid Message objects (TypeScript will show errors):
 * const badMessage1: Message = {
 *   role: 'admin',  // ❌ Error: 'admin' is not 'user' | 'assistant'
 *   content: 'Hello'
 * };
 * 
 * const badMessage2: Message = {
 *   role: 'user',
 *   content: 123  // ❌ Error: 123 is not a string
 * };
 * 
 * @example
 * // How this is used in components:
 * const ChatComponent = () => {
 *   const [messages, setMessages] = useState<Message[]>([]);
 *   
 *   const addMessage = (newMessage: Message) => {
 *     setMessages([...messages, newMessage]);
 *   };
 *   
 *   return (
 *     <div>
 *       {messages.map((message, index) => (
 *         <div key={index}>
 *           <strong>{message.role}:</strong> {message.content}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 */
export interface Message {
  role: 'user' | 'assistant';  // Union type: Can only be 'user' or 'assistant'
  content: string;             // The actual text of the message
}

/**
 * AI Model Interface
 * 
 * Defines the structure of an AI model object.
 * This represents the different AI services available (OpenAI, Gemini, Claude).
 * 
 * Each AI model in our app has these three essential properties that help
 * users understand what they're choosing and how to use it.
 * 
 * @example
 * // Example AI model objects:
 * const openaiModel: AIModel = {
 *   id: 'openai',
 *   name: 'OpenAI GPT-4o',
 *   description: 'Advanced language model by OpenAI with multimodal capabilities'
 * };
 * 
 * const geminiModel: AIModel = {
 *   id: 'gemini',
 *   name: 'Google Gemini Pro',
 *   description: 'Google\'s most capable AI model for text and reasoning'
 * };
 * 
 * const claudeModel: AIModel = {
 *   id: 'claude',
 *   name: 'Claude 3.5 Sonnet',
 *   description: 'Anthropic\'s helpful, harmless, and honest AI assistant'
 * };
 * 
 * @example
 * // How this is used in components:
 * const ModelSelector = ({ models }: { models: AIModel[] }) => {
 *   return (
 *     <div>
 *       {models.map(model => (
 *         <div key={model.id}>
 *           <h3>{model.name}</h3>
 *           <p>{model.description}</p>
 *           <button onClick={() => selectModel(model.id)}>
 *             Select {model.name}
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * @example
 * // How this is used in API calls:
 * const sendMessage = (selectedModel: AIModel, message: string) => {
 *   return ApiService.sendMessage({
 *     model: selectedModel.id,  // Use the id for API calls
 *     messages: [{ role: 'user', content: message }]
 *   });
 * };
 */
export interface AIModel {
  id: string;          // Unique identifier like 'openai', 'gemini', 'claude'
  name: string;        // Display name like 'OpenAI GPT-4o'
  description: string; // Human-readable description of the model
}

/**
 * Chat Request Interface
 * 
 * Defines what we send to the chat API when requesting an AI response.
 * This includes the model selection and the entire conversation history.
 * 
 * Why do we send the entire conversation history?
 * - AI models need context to provide relevant responses
 * - Without history, each message would be treated as a new conversation
 * - This allows for follow-up questions and contextual understanding
 * 
 * @example
 * // Example chat request:
 * const chatRequest: ChatRequest = {
 *   model: 'openai',
 *   messages: [
 *     { role: 'user', content: 'What is the capital of France?' },
 *     { role: 'assistant', content: 'The capital of France is Paris.' },
 *     { role: 'user', content: 'What is its population?' }
 *   ]
 * };
 * 
 * // The AI will see the full conversation and understand that "its population"
 * // refers to Paris, not France in general.
 * 
 * @example
 * // How this is used in practice:
 * const sendChatMessage = async (model: string, messages: Message[]) => {
 *   const request: ChatRequest = {
 *     model,
 *     messages
 *   };
 *   
 *   const response = await ApiService.sendMessage(request);
 *   return response;
 * };
 * 
 * @example
 * // Building up conversation history:
 * const [conversation, setConversation] = useState<Message[]>([]);
 * 
 * const addUserMessage = (content: string) => {
 *   const userMessage: Message = { role: 'user', content };
 *   const updatedConversation = [...conversation, userMessage];
 *   setConversation(updatedConversation);
 *   
 *   // Send entire conversation to AI
 *   const request: ChatRequest = {
 *     model: selectedModel,
 *     messages: updatedConversation
 *   };
 *   
 *   return ApiService.sendMessage(request);
 * };
 */
export interface ChatRequest {
  model: string;       // Which AI model to use ('openai', 'gemini', 'claude')
  messages: Message[]; // Array of all messages in the conversation (full history)
}

/**
 * Chat Response Interface
 * 
 * Defines what we expect to receive back from the chat API.
 * This is the structure of the response when we send a message to an AI model.
 * 
 * The response includes both the AI's answer and metadata about the request.
 * The optional error field allows us to handle both successful and failed requests
 * with the same interface.
 * 
 * @example
 * // Successful response:
 * const successResponse: ChatResponse = {
 *   response: 'Hello! How can I help you today?',
 *   model: 'openai',
 *   status: 'success'
 *   // error is undefined (optional property not provided)
 * };
 * 
 * @example
 * // Error response:
 * const errorResponse: ChatResponse = {
 *   response: '',
 *   model: 'openai',
 *   status: 'error',
 *   error: 'API rate limit exceeded. Please try again later.'
 * };
 * 
 * @example
 * // How this is used in code:
 * const handleSendMessage = async () => {
 *   try {
 *     const response: ChatResponse = await ApiService.sendMessage(request);
 *     
 *     if (response.status === 'success') {
 *       // Handle successful response
 *       console.log('AI said:', response.response);
 *       
 *       // Add AI response to conversation
 *       const aiMessage: Message = {
 *         role: 'assistant',
 *         content: response.response
 *       };
 *       setMessages([...messages, aiMessage]);
 *     } else {
 *       // Handle error response
 *       console.error('Error:', response.error);
 *       setError(response.error || 'Unknown error occurred');
 *     }
 *   } catch (error) {
 *     // Handle network or other errors
 *     console.error('Network error:', error);
 *     setError('Failed to connect to AI service');
 *   }
 * };
 * 
 * @example
 * // Displaying the response in UI:
 * const ChatResponse = ({ response }: { response: ChatResponse }) => {
 *   if (response.status === 'error') {
 *     return (
 *       <div className="error">
 *         ❌ Error: {response.error}
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <div className="ai-message">
 *       <strong>{response.model}:</strong> {response.response}
 *     </div>
 *   );
 * };
 */
export interface ChatResponse {
  response: string;                    // The AI's response text
  model: string;                       // Which model was used ('openai', 'gemini', 'claude')
  status: 'success' | 'error';         // Whether the request succeeded or failed
  error?: string;                      // Optional error message (only present if status is 'error')
}

/**
 * User Interface
 * 
 * Defines the structure of a user object in our application.
 * This represents all the information we store about registered users.
 * 
 * This interface matches what our backend database stores and what we receive
 * from authentication APIs. It includes both required fields (like email)
 * and optional fields (like last_login for users who haven't logged in yet).
 * 
 * @example
 * // Example user object:
 * const user: User = {
 *   id: 'user_123456',
 *   email: 'john.doe@example.com',
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   full_name: 'John Doe',
 *   is_active: true,
 *   is_verified: true,
 *   created_at: '2024-01-15T10:30:00Z',
 *   last_active: '2024-01-20T14:45:00Z',
 *   last_login: '2024-01-20T14:45:00Z'
 * };
 * 
 * @example
 * // New user who hasn't logged in yet:
 * const newUser: User = {
 *   id: 'user_789012',
 *   email: 'jane.smith@example.com',
 *   first_name: 'Jane',
 *   last_name: 'Smith',
 *   full_name: 'Jane Smith',
 *   is_active: true,
 *   is_verified: false,  // Email not verified yet
 *   created_at: '2024-01-21T09:00:00Z',
 *   last_active: '2024-01-21T09:00:00Z',
 *   last_login: null     // Never logged in
 * };
 * 
 * @example
 * // How this is used in components:
 * const UserProfile = ({ user }: { user: User }) => {
 *   return (
 *     <div>
 *       <h1>Welcome, {user.full_name}!</h1>
 *       <p>Email: {user.email}</p>
 *       <p>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
 *       
 *       {!user.is_verified && (
 *         <div className="warning">
 *           ⚠️ Please verify your email address
 *         </div>
 *       )}
 *       
 *       {user.last_login && (
 *         <p>Last login: {new Date(user.last_login).toLocaleString()}</p>
 *       )}
 *     </div>
 *   );
 * };
 * 
 * @example
 * // How this is used in authentication:
 * const [currentUser, setCurrentUser] = useState<User | null>(null);
 * 
 * const handleLogin = async (credentials: LoginRequest) => {
 *   const response = await ApiService.login(credentials);
 *   if (response.user) {
 *     setCurrentUser(response.user);  // response.user matches User interface
 *   }
 * };
 */
export interface User {
  id: string;                    // Unique user identifier
  email: string;                 // User's email address (used for login)
  first_name: string;            // User's first name
  last_name: string;             // User's last name  
  full_name: string;             // Full name (usually first_name + ' ' + last_name)
  is_active: boolean;            // Whether the account is active (can login)
  is_verified: boolean;          // Whether the email address has been verified
  created_at: string;            // When the account was created (ISO date string)
  last_active: string;           // When the user was last active (ISO date string)
  last_login: string | null;     // When the user last logged in (null if never logged in)
}

/**
 * Authentication State Interface
 * 
 * Defines the authentication state that's managed globally in our app.
 * This is used by the AuthProvider context to track login status across all components.
 * 
 * This interface represents the "global authentication state" - information that
 * many components throughout the app need to access. Instead of passing this
 * data through props to every component, we use React Context to make it
 * available anywhere in the component tree.
 * 
 * @example
 * // When user is not logged in:
 * const loggedOutState: AuthState = {
 *   isAuthenticated: false,
 *   user: null,
 *   token: null,
 *   isLoading: false
 * };
 * 
 * @example
 * // When user is logged in:
 * const loggedInState: AuthState = {
 *   isAuthenticated: true,
 *   user: {
 *     id: 'user_123',
 *     email: 'john@example.com',
 *     first_name: 'John',
 *     // ... other user properties
 *   },
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   isLoading: false
 * };
 * 
 * @example
 * // When app is starting up and checking authentication:
 * const loadingState: AuthState = {
 *   isAuthenticated: false,
 *   user: null,
 *   token: null,
 *   isLoading: true  // Show loading spinner while checking
 * };
 * 
 * @example
 * // How this is used in components:
 * const MyComponent = () => {
 *   const { authState } = useAuth();
 *   
 *   if (authState.isLoading) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   if (!authState.isAuthenticated) {
 *     return <LoginForm />;
 *   }
 *   
 *   return <div>Welcome, {authState.user?.first_name}!</div>;
 * };
 * 
 * @example
 * // How this is used in the AuthProvider:
 * const AuthProvider = ({ children }) => {
 *   const [authState, setAuthState] = useState<AuthState>({
 *     isAuthenticated: false,
 *     user: null,
 *     token: null,
 *     isLoading: true
 *   });
 *   
 *   const login = (user: User, token: string) => {
 *     setAuthState({
 *       isAuthenticated: true,
 *       user,
 *       token,
 *       isLoading: false
 *     });
 *   };
 *   
 *   // ... rest of provider logic
 * };
 */
export interface AuthState {
  isAuthenticated: boolean;      // Whether the user is currently logged in
  user: User | null;             // User object if logged in, null if not logged in
  token: string | null;          // JWT authentication token if logged in, null if not
  isLoading: boolean;            // Whether we're currently checking authentication status
}

/**
 * Login Request Interface
 * 
 * Defines what data we need to send when a user tries to log in.
 * This is the structure of the data we collect from the login form
 * and send to our authentication API.
 * 
 * Simple and straightforward - just email and password.
 * The backend will validate these credentials and return either
 * a success response (with user data and token) or an error.
 * 
 * @example
 * // Example login request:
 * const loginRequest: LoginRequest = {
 *   email: 'john.doe@example.com',
 *   password: 'mySecurePassword123'
 * };
 * 
 * @example
 * // How this is used in a login form:
 * const LoginForm = () => {
 *   const [formData, setFormData] = useState<LoginRequest>({
 *     email: '',
 *     password: ''
 *   });
 *   
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     
 *     try {
 *       const response = await ApiService.login(formData);
 *       if (response.token && response.user) {
 *         // Login successful
 *         onLoginSuccess(response.user, response.token);
 *       } else {
 *         // Login failed
 *         setError(response.error || 'Login failed');
 *       }
 *     } catch (error) {
 *       setError('Network error');
 *     }
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         type="email"
 *         value={formData.email}
 *         onChange={(e) => setFormData({...formData, email: e.target.value})}
 *         placeholder="Email"
 *         required
 *       />
 *       <input
 *         type="password"
 *         value={formData.password}
 *         onChange={(e) => setFormData({...formData, password: e.target.value})}
 *         placeholder="Password"
 *         required
 *       />
 *       <button type="submit">Log In</button>
 *     </form>
 *   );
 * };
 * 
 * @example
 * // Validation before sending:
 * const validateLoginRequest = (data: LoginRequest): string[] => {
 *   const errors: string[] = [];
 *   
 *   if (!data.email.trim()) {
 *     errors.push('Email is required');
 *   } else if (!data.email.includes('@')) {
 *     errors.push('Please enter a valid email address');
 *   }
 *   
 *   if (!data.password) {
 *     errors.push('Password is required');
 *   } else if (data.password.length < 6) {
 *     errors.push('Password must be at least 6 characters');
 *   }
 *   
 *   return errors;
 * };
 */
export interface LoginRequest {
  email: string;     // User's email address
  password: string;  // User's password
}

/**
 * Register Request Interface
 * 
 * Defines what data we need to send when a user tries to create a new account.
 * This is the structure of the data we collect from the registration form
 * and send to our user registration API.
 * 
 * More fields than login because we're creating a new user record.
 * All fields are required - the backend will validate them and either
 * create the account or return validation errors.
 * 
 * @example
 * // Example registration request:
 * const registerRequest: RegisterRequest = {
 *   email: 'jane.smith@example.com',
 *   password: 'myVerySecurePassword123!',
 *   first_name: 'Jane',
 *   last_name: 'Smith'
 * };
 * 
 * @example
 * // How this is used in a registration form:
 * const RegisterForm = () => {
 *   const [formData, setFormData] = useState<RegisterRequest>({
 *     email: '',
 *     password: '',
 *     first_name: '',
 *     last_name: ''
 *   });
 *   
 *   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const { name, value } = e.target;
 *     setFormData({
 *       ...formData,
 *       [name]: value
 *     });
 *   };
 *   
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     
 *     try {
 *       const response = await ApiService.register(formData);
 *       if (response.user) {
 *         // Registration successful
 *         setSuccessMessage('Account created successfully!');
 *       } else if (response.errors) {
 *         // Validation errors
 *         setFieldErrors(response.errors);
 *       }
 *     } catch (error) {
 *       setError('Registration failed');
 *     }
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         name="first_name"
 *         value={formData.first_name}
 *         onChange={handleInputChange}
 *         placeholder="First Name"
 *         required
 *       />
 *       <input
 *         name="last_name"
 *         value={formData.last_name}
 *         onChange={handleInputChange}
 *         placeholder="Last Name"
 *         required
 *       />
 *       <input
 *         name="email"
 *         type="email"
 *         value={formData.email}
 *         onChange={handleInputChange}
 *         placeholder="Email"
 *         required
 *       />
 *       <input
 *         name="password"
 *         type="password"
 *         value={formData.password}
 *         onChange={handleInputChange}
 *         placeholder="Password"
 *         required
 *       />
 *       <button type="submit">Create Account</button>
 *     </form>
 *   );
 * };
 * 
 * @example
 * // Client-side validation:
 * const validateRegistrationData = (data: RegisterRequest): ValidationErrors => {
 *   const errors: ValidationErrors = {};
 *   
 *   if (!data.first_name.trim()) {
 *     errors.first_name = ['First name is required'];
 *   }
 *   
 *   if (!data.last_name.trim()) {
 *     errors.last_name = ['Last name is required'];
 *   }
 *   
 *   if (!data.email.trim()) {
 *     errors.email = ['Email is required'];
 *   } else if (!isValidEmail(data.email)) {
 *     errors.email = ['Please enter a valid email address'];
 *   }
 *   
 *   if (!data.password) {
 *     errors.password = ['Password is required'];
 *   } else if (data.password.length < 8) {
 *     errors.password = ['Password must be at least 8 characters long'];
 *   }
 *   
 *   return errors;
 * };
 */
export interface RegisterRequest {
  email: string;      // User's email address (must be unique)
  password: string;   // User's chosen password (will be hashed on server)
  first_name: string; // User's first name
  last_name: string;  // User's last name
}

/**
 * Authentication Response Interface
 * 
 * Defines what we get back from authentication APIs (login, register, verify email).
 * This interface handles both successful responses and error responses.
 * 
 * Why do we have optional properties?
 * - Different endpoints return different combinations of data
 * - Login returns token + user, register might only return a message
 * - Error responses include error/errors fields, success responses don't
 * 
 * This is a "union" interface - it can represent multiple different response types
 * depending on what happened on the server.
 * 
 * @example
 * // Successful login response:
 * const loginSuccess: AuthResponse = {
 *   message: 'Login successful',
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   user: {
 *     id: 'user_123',
 *     email: 'john@example.com',
 *     first_name: 'John',
 *     // ... other user properties
 *   }
 *   // errors and error are undefined
 * };
 * 
 * @example
 * // Registration validation error response:
 * const registrationError: AuthResponse = {
 *   message: 'Validation failed',
 *   errors: {
 *     email: ['Email is already registered'],
 *     password: ['Password must be at least 8 characters long']
 *   }
 *   // token and user are undefined
 * };
 * 
 * @example
 * // General error response:
 * const generalError: AuthResponse = {
 *   message: 'Authentication failed',
 *   error: 'Invalid email or password'
 *   // token, user, and errors are undefined
 * };
 * 
 * @example
 * // Successful registration response:
 * const registerSuccess: AuthResponse = {
 *   message: 'Account created successfully. Please check your email to verify your account.',
 *   user: {
 *     id: 'user_456',
 *     email: 'newuser@example.com',
 *     // ... other user properties
 *   }
 *   // token might be undefined if email verification is required
 * };
 * 
 * @example
 * // How this is used in code:
 * const handleLogin = async (credentials: LoginRequest) => {
 *   const response: AuthResponse = await ApiService.login(credentials);
 *   
 *   if (response.token && response.user) {
 *     // Successful login - we have both token and user
 *     setUser(response.user);
 *     setToken(response.token);
 *     setIsAuthenticated(true);
 *     console.log('Welcome back!', response.message);
 *   } else if (response.errors) {
 *     // Field-specific validation errors
 *     setFieldErrors(response.errors);
 *     console.log('Please fix the following errors:', response.errors);
 *   } else if (response.error) {
 *     // General error message
 *     setGeneralError(response.error);
 *     console.log('Login failed:', response.error);
 *   } else {
 *     // Unexpected response format
 *     setGeneralError('Unexpected response from server');
 *   }
 * };
 * 
 * @example
 * // Handling different response types:
 * const processAuthResponse = (response: AuthResponse) => {
 *   // Always show the message to user
 *   console.log('Server message:', response.message);
 *   
 *   // Check what type of response this is
 *   if (response.token) {
 *     console.log('✅ Authentication successful');
 *     return 'success';
 *   } else if (response.errors) {
 *     console.log('❌ Validation errors occurred');
 *     return 'validation_error';
 *   } else if (response.error) {
 *     console.log('❌ General error occurred');
 *     return 'general_error';
 *   } else {
 *     console.log('ℹ️ Information response');
 *     return 'info';
 *   }
 * };
 */
export interface AuthResponse {
  message: string;                          // Human-readable message about the operation
  token?: string;                           // JWT token (only present on successful login)
  user?: User;                              // User object (only present on successful login)
  errors?: Record<string, string[]>;        // Field-specific validation errors
  error?: string;                           // General error message
}

/**
 * Validation Errors Interface
 * 
 * Defines the structure for field-specific validation errors.
 * This is used when forms have multiple fields that can each have multiple errors.
 * 
 * The Record<string, string[]> type means:
 * - Keys are field names (strings)
 * - Values are arrays of error messages for that field
 * 
 * Why arrays of strings for each field?
 * - A single field can have multiple validation rules
 * - Each rule can produce its own error message
 * - We want to show all errors, not just the first one
 * 
 * @example
 * // Example validation errors:
 * const validationErrors: ValidationErrors = {
 *   email: ['Email is required', 'Email format is invalid'],
 *   password: [
 *     'Password must be at least 8 characters long',
 *     'Password must contain at least one uppercase letter',
 *     'Password must contain at least one number'
 *   ],
 *   first_name: ['First name is required']
 *   // last_name has no errors, so it's not included
 * };
 * 
 * @example
 * // How this is used in form validation:
 * const validateForm = (data: RegisterRequest): ValidationErrors => {
 *   const errors: ValidationErrors = {};
 *   
 *   // Email validation
 *   if (!data.email.trim()) {
 *     errors.email = ['Email is required'];
 *   } else {
 *     const emailErrors: string[] = [];
 *     if (!data.email.includes('@')) {
 *       emailErrors.push('Email must contain @ symbol');
 *     }
 *     if (data.email.length < 5) {
 *       emailErrors.push('Email is too short');
 *     }
 *     if (emailErrors.length > 0) {
 *       errors.email = emailErrors;
 *     }
 *   }
 *   
 *   // Password validation
 *   if (!data.password) {
 *     errors.password = ['Password is required'];
 *   } else {
 *     const passwordErrors: string[] = [];
 *     if (data.password.length < 8) {
 *       passwordErrors.push('Password must be at least 8 characters long');
 *     }
 *     if (!/[A-Z]/.test(data.password)) {
 *       passwordErrors.push('Password must contain at least one uppercase letter');
 *     }
 *     if (!/[0-9]/.test(data.password)) {
 *       passwordErrors.push('Password must contain at least one number');
 *     }
 *     if (passwordErrors.length > 0) {
 *       errors.password = passwordErrors;
 *     }
 *   }
 *   
 *   return errors;
 * };
 * 
 * @example
 * // How this is displayed in UI:
 * const FormErrors = ({ errors }: { errors: ValidationErrors }) => {
 *   return (
 *     <div>
 *       {Object.entries(errors).map(([fieldName, fieldErrors]) => (
 *         <div key={fieldName} className="field-errors">
 *           <strong>{fieldName}:</strong>
 *           <ul>
 *             {fieldErrors.map((error, index) => (
 *               <li key={index}>{error}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * 
 * @example
 * // Checking if form has any errors:
 * const hasErrors = (errors: ValidationErrors): boolean => {
 *   return Object.keys(errors).length > 0;
 * };
 * 
 * const handleSubmit = () => {
 *   const errors = validateForm(formData);
 *   if (hasErrors(errors)) {
 *     setFieldErrors(errors);
 *     return; // Don't submit if there are errors
 *   }
 *   
 *   // Form is valid, proceed with submission
 *   submitForm(formData);
 * };
 */
export interface ValidationErrors {
  email?: string[];      // Array of email validation errors (optional)
  password?: string[];   // Array of password validation errors (optional)
  first_name?: string[]; // Array of first name validation errors (optional)
  last_name?: string[];  // Array of last name validation errors (optional)
}

/**
 * Password Strength Interface
 * 
 * Defines the structure for password strength analysis.
 * This is used to provide real-time feedback to users as they type their password,
 * helping them create strong, secure passwords.
 * 
 * Password strength checking improves security by encouraging users to create
 * passwords that are hard to guess or crack.
 * 
 * @example
 * // Weak password analysis:
 * const weakPassword: PasswordStrength = {
 *   score: 1,
 *   feedback: [
 *     'Password is too short (minimum 8 characters)',
 *     'Add uppercase letters',
 *     'Add numbers',
 *     'Add special characters'
 *   ],
 *   isValid: false
 * };
 * 
 * @example
 * // Strong password analysis:
 * const strongPassword: PasswordStrength = {
 *   score: 5,
 *   feedback: [], // No feedback needed - password meets all requirements
 *   isValid: true
 * };
 * 
 * @example
 * // Medium strength password:
 * const mediumPassword: PasswordStrength = {
 *   score: 3,
 *   feedback: [
 *     'Add special characters for extra security',
 *     'Consider making it longer'
 *   ],
 *   isValid: true // Meets minimum requirements but could be stronger
 * };
 * 
 * @example
 * // How this is used for password validation:
 * const analyzePassword = (password: string): PasswordStrength => {
 *   let score = 0;
 *   const feedback: string[] = [];
 *   
 *   // Length check
 *   if (password.length < 8) {
 *     feedback.push('Password must be at least 8 characters long');
 *   } else {
 *     score += 1;
 *     if (password.length >= 12) score += 1; // Bonus for longer passwords
 *   }
 *   
 *   // Uppercase check
 *   if (!/[A-Z]/.test(password)) {
 *     feedback.push('Add uppercase letters (A-Z)');
 *   } else {
 *     score += 1;
 *   }
 *   
 *   // Lowercase check
 *   if (!/[a-z]/.test(password)) {
 *     feedback.push('Add lowercase letters (a-z)');
 *   } else {
 *     score += 1;
 *   }
 *   
 *   // Number check
 *   if (!/[0-9]/.test(password)) {
 *     feedback.push('Add numbers (0-9)');
 *   } else {
 *     score += 1;
 *   }
 *   
 *   // Special character check
 *   if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
 *     feedback.push('Add special characters (!@#$%^&*)');
 *   } else {
 *     score += 1;
 *   }
 *   
 *   return {
 *     score: Math.min(score, 5), // Cap at 5
 *     feedback,
 *     isValid: password.length >= 8 && score >= 3 // Minimum requirements
 *   };
 * };
 * 
 * @example
 * // How this is displayed in UI:
 * const PasswordStrengthIndicator = ({ strength }: { strength: PasswordStrength }) => {
 *   const getStrengthLabel = (score: number): string => {
 *     if (score === 0) return 'Very Weak';
 *     if (score === 1) return 'Weak';
 *     if (score === 2) return 'Fair';
 *     if (score === 3) return 'Good';
 *     if (score === 4) return 'Strong';
 *     return 'Very Strong';
 *   };
 *   
 *   const getStrengthColor = (score: number): string => {
 *     if (score <= 1) return 'red';
 *     if (score <= 2) return 'orange';
 *     if (score <= 3) return 'yellow';
 *     if (score <= 4) return 'lightgreen';
 *     return 'green';
 *   };
 *   
 *   return (
 *     <div>
 *       <div className="strength-bar">
 *         <div 
 *           className="strength-fill"
 *           style={{
 *             width: `${(strength.score / 5) * 100}%`,
 *             backgroundColor: getStrengthColor(strength.score)
 *           }}
 *         />
 *       </div>
 *       <div className="strength-label">
 *         {getStrengthLabel(strength.score)}
 *       </div>
 *       {strength.feedback.length > 0 && (
 *         <ul className="strength-feedback">
 *           {strength.feedback.map((item, index) => (
 *             <li key={index}>{item}</li>
 *           ))}
 *         </ul>
 *       )}
 *     </div>
 *   );
 * };
 * 
 * @example
 * // Using in a registration form:
 * const RegistrationForm = () => {
 *   const [password, setPassword] = useState('');
 *   const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
 *     score: 0,
 *     feedback: [],
 *     isValid: false
 *   });
 *   
 *   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const newPassword = e.target.value;
 *     setPassword(newPassword);
 *     setPasswordStrength(analyzePassword(newPassword));
 *   };
 *   
 *   const canSubmit = passwordStrength.isValid;
 *   
 *   return (
 *     <form>
 *       <input
 *         type="password"
 *         value={password}
 *         onChange={handlePasswordChange}
 *         placeholder="Enter password"
 *       />
 *       <PasswordStrengthIndicator strength={passwordStrength} />
 *       <button type="submit" disabled={!canSubmit}>
 *         Create Account
 *       </button>
 *     </form>
 *   );
 * };
 */
export interface PasswordStrength {
  score: number;        // Strength score from 0-5 (0=very weak, 5=very strong)
  feedback: string[];   // Array of feedback messages for missing requirements (empty array = no issues)
  isValid: boolean;     // Whether password meets all requirements (true/false)
} 