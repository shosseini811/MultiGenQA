import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, LogIn, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { LoginRequest, AuthResponse } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

/*
Login Component - Complete Beginner's Guide

This component provides a user interface for user authentication (logging in).
It demonstrates essential React and TypeScript concepts for handling user authentication,
which is a fundamental feature in most web applications.

=== What is Authentication? ===

Authentication is the process of verifying who a user is. Think of it like showing your ID
at the airport - you prove you are who you say you are. In web applications:

1. **User provides credentials**: Usually email and password
2. **Server verifies credentials**: Checks if they match what's stored in database
3. **Server issues a token**: Like a temporary ID card that proves you're logged in
4. **Client stores token**: Keeps the "ID card" to prove identity for future requests

=== Key React Concepts Demonstrated ===

1. **State Management**: Managing form data and UI state
   - Form inputs (email, password)
   - UI state (loading, errors, password visibility)
   - Each piece of state has a specific purpose

2. **Controlled Components**: React manages all input values
   - value={formData.email} tells React what to display
   - onChange tells React when the user types
   - This makes React the "single source of truth"

3. **Event Handling**: Responding to user actions
   - Form submission when user clicks "Sign In"
   - Input changes when user types
   - Button clicks for password visibility toggle

4. **Conditional Rendering**: Showing different UI based on state
   - Error messages only appear when there are errors
   - Loading spinner appears during authentication
   - Different button text based on loading state

5. **Component Props**: Data passed from parent components
   - onLoginSuccess: Function called when login succeeds
   - onSwitchToRegister: Function called when user wants to register

=== TypeScript Concepts Explained ===

1. **Interface Props**: Defining the shape of props this component expects
   - Ensures type safety when using the component
   - Provides autocomplete in IDE
   - Catches errors at compile time

2. **Generic State Types**: Specifying what type of data each state holds
   - useState<LoginRequest>: Form data matching our interface
   - useState<boolean>: Simple true/false values
   - useState<string>: Text values like error messages

3. **Event Types**: Properly typing event handlers
   - React.ChangeEvent<HTMLInputElement>: When user types in input field
   - React.FormEvent<HTMLFormElement>: When user submits form
   - This helps TypeScript catch errors and provide better autocomplete

4. **API Response Types**: Typing the response from our authentication API
   - AuthResponse interface defines what we expect back from the server
   - Helps catch errors if API response format changes

=== Authentication Flow Explained ===

1. **User enters credentials**: Email and password in form fields
2. **Client-side validation**: Check that fields aren't empty (basic validation)
3. **API call**: Send credentials to server for verification
4. **Server response**: Server returns either success (with token) or error
5. **Handle response**: 
   - Success: Store token and notify parent component
   - Error: Display error message to user
6. **State management**: Update authentication state throughout the app

=== Security Considerations ===

1. **Password visibility toggle**: Helps users see what they're typing
2. **HTTPS only**: Credentials should only be sent over secure connections
3. **Token storage**: JWT tokens stored securely for session management
4. **Error handling**: Don't reveal too much information in error messages
5. **Loading states**: Prevent multiple submissions during authentication

=== UI/UX Best Practices ===

1. **Clear visual feedback**: Loading states, error messages, success indicators
2. **Accessibility**: Proper labels, keyboard navigation, screen reader support
3. **Mobile responsive**: Works well on all device sizes
4. **Modern design**: Clean, professional appearance with good contrast
5. **Form validation**: Immediate feedback when user makes mistakes
*/

/*
Props Interface for Login Component

This interface defines what props (properties) this component expects to receive
from its parent component. Props are like function parameters - they're data
passed down from parent components to child components.

Think of props like this:
- Parent component: "Hey Login component, here are some functions you can call"
- Login component: "Thanks! I'll call onLoginSuccess when the user logs in successfully"

Why use interfaces for props?
- **Type Safety**: TypeScript will warn if wrong types are passed
- **Documentation**: Other developers can see exactly what props are expected
- **IDE Support**: Autocomplete and error checking in your code editor
- **Refactoring Safety**: If you change the interface, TypeScript shows all affected code
*/
interface LoginProps {
  // Function called when login is successful - parent component handles what happens next
  onLoginSuccess: (user: any, token: string) => void;
  
  // Function called when user wants to switch to registration form
  onSwitchToRegister: () => void;
}

/*
Login Component Definition

Let's break down this component declaration:

1. **export default function**: This creates a function component and exports it
2. **Login**: The name of our component (must start with capital letter)
3. **({ onLoginSuccess, onSwitchToRegister }: LoginProps)**: 
   - Destructuring props from the LoginProps interface
   - This extracts the specific props we need from the props object
4. **LoginProps**: TypeScript interface that defines the shape of our props

This pattern is called "destructuring assignment" - instead of writing:
function Login(props: LoginProps) {
  const onLoginSuccess = props.onLoginSuccess;
  const onSwitchToRegister = props.onSwitchToRegister;
}

We can write it more concisely as shown below.
*/
export default function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
  
  /*
  State Management with useState Hook
  
  The useState hook is one of the most important React hooks. It lets us add state
  (data that can change over time) to functional components.
  
  Pattern: const [currentValue, setterFunction] = useState<Type>(initialValue);
  
  Why separate pieces of state instead of one big object?
  - **Performance**: React only re-renders when specific state changes
  - **Clarity**: Each piece of state has a clear purpose
  - **Type Safety**: Each state can have its own specific TypeScript type
  - **Easier Updates**: Simpler to update individual pieces
  */
  
  // Form data state - holds the user's input (email and password)
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',      // User's email address
    password: ''    // User's password
  });
  
  // UI state for better user experience
  const [showPassword, setShowPassword] = useState<boolean>(false);           // Whether to show password as text
  const [isLoading, setIsLoading] = useState<boolean>(false);                // Whether login request is in progress
  const [error, setError] = useState<string>('');                            // General error message
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({}); // Specific field errors

  /*
  Event Handlers - Functions that respond to user interactions
  
  Event handlers are functions that run when something happens in the UI:
  - User types in an input field
  - User clicks a button  
  - User submits a form
  
  These functions are the bridge between user actions and state changes.
  */
  
  /*
  Handle Input Changes
  
  This function runs every time the user types in either the email or password field.
  It demonstrates several important React patterns:
  
  1. **Event Parameter**: The 'e' parameter contains information about what happened
  2. **Destructuring**: We extract 'name' and 'value' from the input element
  3. **State Updates**: We update the form data with the new value
  4. **User Feedback**: We clear errors when user starts typing (better UX)
  
  Why use the 'name' attribute?
  - It lets us use one handler for multiple inputs
  - The 'name' tells us which field changed
  - We can update just that field in our state object
  */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract the name and value from the input that changed
    const { name, value } = e.target;
    
    /*
    Functional State Update
    
    We use a function to update state instead of directly setting it because:
    - **Safety**: Ensures we get the most current state value
    - **React Optimization**: Works better with React's batching system
    - **Immutability**: Creates a new object instead of modifying the existing one
    
    The spread operator (...prev) copies all existing properties,
    then [name]: value updates just the field that changed.
    
    Example: If user types in email field:
    - name = "email"
    - value = "user@example.com"
    - Result: { email: "user@example.com", password: "existing password" }
    */
    setFormData(prev => ({
      ...prev,        // Copy all existing form data
      [name]: value   // Update just the field that changed
    }));
    
    /*
    Clear Field-Specific Errors
    
    When user starts typing in a field that had an error, we clear that error.
    This provides immediate visual feedback that they're addressing the issue.
    
    Why clear errors immediately?
    - **Better UX**: User sees that they're fixing the problem
    - **Reduces Confusion**: Old error messages don't linger
    - **Encourages Completion**: Positive feedback motivates users
    */
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: []  // Clear errors for this specific field
      }));
    }
  };

  /*
  Handle Form Submission
  
  This is the main function that runs when the user submits the login form.
  It demonstrates several important patterns for handling asynchronous operations:
  
  1. **Prevent Default**: Stop the browser's default form submission
  2. **Validation**: Check that required fields are filled
  3. **Loading State**: Show user that something is happening
  4. **API Call**: Send credentials to server for verification
  5. **Error Handling**: Handle both success and failure cases
  6. **State Cleanup**: Reset loading state when done
  */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    /*
    Prevent Default Form Submission
    
    By default, HTML forms reload the page when submitted. In a React app,
    we want to handle the submission ourselves with JavaScript, so we prevent
    the default behavior.
    */
    e.preventDefault();
    
    /*
    Prevent Multiple Submissions
    
    If a login request is already in progress, don't start another one.
    This prevents issues like:
    - Multiple API calls for the same login attempt
    - Race conditions
    - Confusing user experience
    */
    if (isLoading) return;
    
    /*
    Prepare for API Call
    
    Before making the API call, we:
    1. Set loading state to show spinner and disable form
    2. Clear any previous error messages
    3. Clear any field-specific errors
    
    This gives users immediate feedback that their submission is being processed.
    */
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      /*
      API Call for Authentication
      
      This is where we actually try to log the user in:
      1. Send email and password to our authentication API
      2. Wait for the server to verify the credentials
      3. Receive either a success response (with token) or an error
      
      The 'await' keyword pauses execution until the API call completes.
      This makes asynchronous code easier to read and understand.
      */
      const response: AuthResponse = await ApiService.login(formData);
      
      /*
      Handle Successful Login
      
      If login succeeds, the server returns:
      - token: A JWT (JSON Web Token) that proves the user is authenticated
      - user: Information about the logged-in user
      
      We then call the onLoginSuccess prop function to notify the parent component
      that login was successful. The parent component will typically:
      - Store the token for future API calls
      - Update the app's global authentication state
      - Redirect to the main application interface
      */
      if (response.token && response.user) {
        // Login successful - notify parent component
        onLoginSuccess(response.user, response.token);
      } else if (response.errors) {
        /*
        Handle Field-Specific Validation Errors
        
        If the server returns specific field errors (like "invalid email format"),
        we display them next to the relevant form fields. This gives users
        precise feedback about what needs to be fixed.
        */
        setFieldErrors(response.errors);
      } else if (response.error) {
        /*
        Handle General Authentication Errors
        
        For general errors (like "invalid credentials"), we show a general
        error message. We don't want to be too specific about what went wrong
        for security reasons (don't tell attackers whether email or password was wrong).
        */
        setError(response.error);
      }
    } catch (err) {
      /*
      Handle Network or Unexpected Errors
      
      If something goes wrong with the network request or an unexpected error occurs:
      1. Show a user-friendly error message
      2. Log the detailed error for debugging (in development)
      
      We don't show the raw error to users because:
      - It might contain sensitive information
      - It's usually too technical for users to understand
      - It doesn't help users know what to do next
      */
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      /*
      Cleanup Loading State
      
      The 'finally' block always runs, whether the try block succeeded or failed.
      We use it to clean up the loading state so the UI doesn't get stuck
      showing a loading spinner forever.
      
      This ensures that:
      - The form becomes interactive again
      - The loading spinner disappears
      - Users can try again if login failed
      */
      setIsLoading(false);
    }
  };

  /*
  Password Visibility Toggle
  
  This simple function toggles between showing and hiding the password.
  It improves user experience by:
  - Letting users see what they're typing (reduces typos)
  - Maintaining security by defaulting to hidden
  - Providing visual feedback with different icons
  
  Why is this important?
  - Users often make typos in password fields
  - Hidden passwords can be frustrating, especially on mobile
  - But passwords should be hidden by default for security
  */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);  // Flip the boolean value
  };

  /*
  JSX Return Statement - The Component's UI
  
  This is where we define what the component should look like and how it behaves.
  JSX is a syntax extension that lets us write HTML-like code inside JavaScript.
  
  Key JSX Concepts:
  - **className instead of class**: 'class' is a reserved word in JavaScript
  - **Event handlers use camelCase**: onClick, onChange, onSubmit
  - **JavaScript expressions go in curly braces**: {formData.email}
  - **Self-closing tags need the slash**: <Input />
  - **Components start with capital letters**: <Button>, <Card>
  
  The UI is built using shadcn/ui components, which are:
  - Pre-built, accessible React components
  - Styled with Tailwind CSS
  - Customizable and reusable
  - Follow modern design principles
  */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-claude-cream via-claude-cream-light to-white p-4">
      
      {/* 
      Main Login Card
      
      We use the Card component from shadcn/ui, which provides:
      - Consistent styling across the app
      - Accessibility features built-in
      - Responsive design
      - Professional appearance
      */}
      <Card className="w-full max-w-md shadow-claude-xl border-claude-orange/20 bg-white/90 backdrop-blur-sm">
        
        {/* Card Header with Title and Description */}
        <CardHeader className="space-y-1 text-center pb-6">
          
          {/* User Icon - Visual indicator of login functionality */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-claude-orange to-claude-purple rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          
          {/* Main Title */}
          <CardTitle className="text-2xl font-bold text-claude-gray-800">Welcome Back</CardTitle>
          
          {/* Subtitle/Description */}
          <CardDescription className="text-claude-gray-600">
            Sign in to your MultiGenQA account
          </CardDescription>
        </CardHeader>
        
        {/* Card Content with Form */}
        <CardContent className="space-y-4">
          
          {/* 
          General Error Message
          
          Conditional rendering: only show if there's an error.
          The && operator means "if error exists, then show this div".
          */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 
          Login Form
          
          The form element handles submission and provides semantic structure.
          - onSubmit: Calls our handleSubmit function when form is submitted
          - space-y-4: Tailwind class that adds consistent spacing between children
          */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input Field */}
            <div className="space-y-2">
              
              {/* Label for accessibility and UX */}
              <label htmlFor="email" className="text-sm font-medium text-claude-gray-700">
                Email
              </label>
              
              {/* Input wrapper with icon */}
              <div className="relative">
                
                {/* Mail icon positioned absolutely inside the input */}
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-claude-gray-400 w-4 h-4" />
                
                {/* 
                Email Input Field
                
                This is a controlled component:
                - value={formData.email}: React controls what's displayed
                - onChange={handleInputChange}: React knows when user types
                - This makes React the "single source of truth" for the input value
                
                Other important attributes:
                - id="email": Links to the label for accessibility
                - type="email": Helps with mobile keyboards and validation
                - name="email": Used by handleInputChange to know which field changed
                - required: HTML5 validation (though we also validate in JavaScript)
                - disabled={isLoading}: Prevents input during API call
                */}
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="pl-10 border-claude-orange/30 focus:border-claude-orange bg-white text-claude-gray-800 placeholder-claude-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
              
              {/* 
              Field-Specific Error Messages
              
              If there are validation errors for the email field, show them here.
              We map over the array of errors to display each one.
              */}
              {fieldErrors.email && (
                <div className="space-y-1">
                  {fieldErrors.email.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Password Input Field */}
            <div className="space-y-2">
              
              <label htmlFor="password" className="text-sm font-medium text-claude-gray-700">
                Password
              </label>
              
              <div className="relative">
                
                {/* Lock icon */}
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-claude-gray-400 w-4 h-4" />
                
                {/* 
                Password Input with Dynamic Type
                
                The type attribute changes based on showPassword state:
                - type="password": Hides the password (default)
                - type="text": Shows the password when toggle is clicked
                
                This is an example of dynamic attributes in JSX.
                */}
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 border-claude-orange/30 focus:border-claude-orange bg-white text-claude-gray-800 placeholder-claude-gray-400"
                  required
                  disabled={isLoading}
                />
                
                {/* 
                Password Visibility Toggle Button
                
                This button lets users show/hide their password:
                - type="button": Prevents form submission when clicked
                - onClick: Calls our toggle function
                - Dynamic icon based on current visibility state
                - Positioned absolutely on the right side of the input
                */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-claude-gray-400 hover:text-claude-orange transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password field errors */}
              {fieldErrors.password && (
                <div className="space-y-1">
                  {fieldErrors.password.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 
            Submit Button
            
            This button submits the form and triggers the login process:
            - type="submit": Makes this button submit the form when clicked
            - disabled: Button is disabled when loading or required fields are empty
            - Dynamic content: Shows different text and icon based on loading state
            
            Why disable the button?
            - Prevents multiple submissions
            - Provides clear feedback about form state
            - Prevents submission of incomplete forms
            */}
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full bg-gradient-to-r from-claude-orange to-claude-orange-dark hover:from-claude-orange-dark hover:to-claude-orange-darker text-white border-0 shadow-claude-md hover:shadow-claude-lg transition-all duration-200 py-2.5"
            >
              {/* 
              Conditional Content Based on Loading State
              
              When loading: Show spinner and "Signing in..." text
              When not loading: Show login icon and "Sign In" text
              
              This provides clear visual feedback about what's happening.
              */}
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* 
          Switch to Registration Link
          
          This section lets users switch to the registration form if they don't have an account.
          It's separated from the main form to keep the UI clean and organized.
          */}
          <div className="text-center pt-4 border-t border-claude-orange/10">
            <p className="text-sm text-claude-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="font-medium text-claude-orange hover:text-claude-orange-dark transition-colors hover:underline"
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 