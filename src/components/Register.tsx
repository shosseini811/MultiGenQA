import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Check, X } from 'lucide-react';
import { RegisterRequest, AuthResponse, ValidationErrors, PasswordStrength } from '../types';
import { ApiService } from '../services/api';

/*
Register Component - Complete Beginner's Guide

This component demonstrates advanced React and TypeScript concepts for user registration.
It's a great example of complex form handling with real-time validation and user feedback.

=== Key React Concepts Demonstrated ===

1. **Complex State Management**: Multiple related pieces of state that work together
   - Form data (email, password, names)
   - UI state (loading, errors, password visibility)
   - Validation state (password strength, field errors)

2. **Controlled Components**: React controls all input values
   - value={formData.email} sets what's displayed
   - onChange updates React state when user types
   - This ensures React state is always the "source of truth"

3. **Event Handling**: Responding to user interactions
   - Form submission (onSubmit)
   - Input changes (onChange)
   - Button clicks (onClick)

4. **Conditional Rendering**: Showing different UI based on state
   - Error messages only when there are errors
   - Loading spinner during submission
   - Password strength indicator when typing

5. **Form Validation**: Multiple layers of validation
   - Client-side validation for immediate feedback
   - Server-side validation for security
   - Real-time validation as user types

=== TypeScript Concepts Explained ===

1. **Interface Props**: Defining what props this component expects
   - onRegisterSuccess: Function called when registration succeeds
   - onSwitchToLogin: Function called when user wants to switch to login

2. **Generic State Types**: Telling TypeScript what type of data each state holds
   - useState<RegisterRequest>: Form data matching our interface
   - useState<boolean>: Simple true/false values
   - useState<ValidationErrors>: Object with possible error messages

3. **Event Types**: Properly typing event handlers
   - React.ChangeEvent<HTMLInputElement>: When user types in input
   - React.FormEvent<HTMLFormElement>: When user submits form

4. **Function Types**: Defining what functions should accept and return
   - validatePassword(password: string): string[] - takes string, returns array of strings

=== Form Validation Strategy ===

We use a multi-layered validation approach:

1. **Real-time Validation**: As user types
   - Password strength checking
   - Clear errors when user starts fixing them
   - Immediate feedback for better UX

2. **Client-side Validation**: Before sending to server
   - Check required fields
   - Validate email format
   - Check password strength
   - Prevents unnecessary server requests

3. **Server-side Validation**: Final security check
   - Check if email already exists
   - Validate against business rules
   - Return detailed error messages

=== Password Security Features ===

1. **Password Strength Meter**: Real-time feedback
   - Checks length, uppercase, lowercase, numbers, special characters
   - Visual indicator shows strength level
   - Prevents weak passwords

2. **Password Visibility Toggle**: Better UX
   - Users can see what they're typing
   - Reduces password entry errors
   - Maintains security by defaulting to hidden

3. **Validation Feedback**: Clear requirements
   - Shows exactly what's missing
   - Updates in real-time as user types
   - Helps users create secure passwords
*/

/*
Props Interface for Register Component

This interface defines what props this component expects from its parent.
Props are like function parameters - they're data passed down from parent components.

Why use interfaces for props?
- TypeScript can catch errors if wrong props are passed
- IDE provides autocomplete for prop names
- Self-documenting code - other developers know what props are expected
- Refactoring safety - if you change the interface, TypeScript shows all affected code
*/
interface RegisterProps {
  onRegisterSuccess: (message: string) => void;  // Called when registration succeeds
  onSwitchToLogin: () => void;                   // Called when user wants to switch to login
}

/*
Register Component Definition

React.FC<RegisterProps> means:
- React.FC: This is a React Functional Component
- <RegisterProps>: It expects props matching the RegisterProps interface
- This gives us full TypeScript support for props

The component receives props through destructuring:
{ onRegisterSuccess, onSwitchToLogin } extracts these specific props from the props object
*/
const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  
  /*
  Form State Management
  
  We use multiple useState hooks to manage different aspects of the form.
  Each piece of state has a specific purpose and type.
  
  Why separate state instead of one big object?
  - Easier to update individual pieces
  - Better performance (React only re-renders when specific state changes)
  - Clearer code organization
  - Type safety for each piece of state
  */
  
  // Form data that matches our RegisterRequest interface
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  
  // UI state for better user experience
  const [showPassword, setShowPassword] = useState<boolean>(false);      // Whether to show password text
  const [isLoading, setIsLoading] = useState<boolean>(false);            // Whether form is submitting
  const [errors, setErrors] = useState<ValidationErrors>({});            // Field-specific error messages
  const [generalError, setGeneralError] = useState<string>('');          // General error message
  const [successMessage, setSuccessMessage] = useState<string>('');      // Success message
  
  // Password strength tracking for real-time feedback
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,      // Strength score from 0-5
    feedback: [],  // Array of missing requirements
    isValid: false // Whether password meets all requirements
  });
  
  /*
  Handle Input Changes
  
  This function is called every time a user types in any input field.
  It demonstrates several important React patterns:
  
  1. **Event Handling**: Properly typed event parameter
  2. **State Updates**: Using functional updates for safety
  3. **Derived State**: Updating related state when one piece changes
  4. **User Experience**: Clearing errors when user starts typing
  */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract name and value from the input that changed
    const { name, value } = e.target;
    
    /*
    Functional State Update
    
    We use a function instead of directly setting state because:
    - It's safer with React's batching
    - We get the most current state value
    - Prevents race conditions
    - Works correctly with React's optimization
    
    The spread operator (...prev) creates a new object with all existing properties,
    then [name]: value updates just the field that changed.
    */
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    /*
    Clear Field-Specific Errors
    
    When user starts typing in a field, we clear any errors for that field.
    This provides immediate feedback that they're fixing the issue.
    
    The 'as keyof ValidationErrors' tells TypeScript that name is a valid key
    for the ValidationErrors interface.
    */
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined  // Clear errors for this field
      }));
    }
    
    // Clear general error when user makes any change
    if (generalError) {
      setGeneralError('');
    }
    
    /*
    Special Handling for Password Field
    
    When user types in the password field, we immediately check its strength
    and provide real-time feedback. This helps users create secure passwords.
    */
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };
  
  /*
  Client-side Form Validation
  
  This function validates the entire form before submission.
  It returns an object with any validation errors found.
  
  Why validate on the client side?
  - Immediate feedback for users
  - Reduces server load
  - Better user experience
  - Prevents obviously invalid requests
  
  Note: We still need server-side validation for security!
  */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    /*
    Email Validation
    
    We check both that email is provided and that it's in a valid format.
    Multiple validation rules can result in multiple error messages.
    */
    if (!formData.email) {
      newErrors.email = ['Email is required'];
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = ['Please enter a valid email address'];
    }
    
    /*
    Password Validation
    
    We check that password is provided and meets security requirements.
    The validatePassword helper function returns an array of specific issues.
    */
    if (!formData.password) {
      newErrors.password = ['Password is required'];
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors;
      }
    }
    
    /*
    Name Field Validation
    
    We check that names are provided and meet minimum length requirements.
    This prevents obviously invalid names like single characters.
    */
    if (!formData.first_name) {
      newErrors.first_name = ['First name is required'];
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = ['First name must be at least 2 characters long'];
    }
    
    if (!formData.last_name) {
      newErrors.last_name = ['Last name is required'];
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = ['Last name must be at least 2 characters long'];
    }
    
    return newErrors;
  };
  
  /*
  Password Validation Helper Function
  
  This function checks a password against security requirements and returns
  an array of error messages for any requirements that aren't met.
  
  Security Requirements:
  - At least 8 characters long
  - Contains uppercase letter (A-Z)
  - Contains lowercase letter (a-z)
  - Contains number (0-9)
  - Contains special character (!@#$%^&*(),.?":{}|<>)
  
  Why these requirements?
  - Length: Longer passwords are exponentially harder to crack
  - Character variety: Makes brute force attacks much more difficult
  - Industry standard: Follows NIST and OWASP guidelines
  */
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    // Check minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    // Check for uppercase letter using regular expression
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };
  
  /*
  Email Validation Helper Function
  
  This function uses a regular expression to check if an email address
  is in a valid format.
  
  Regular Expression Breakdown:
  - ^[^\s@]+: Start with one or more characters that aren't space or @
  - @: Must have exactly one @ symbol
  - [^\s@]+: One or more characters that aren't space or @
  - \.: Must have a dot
  - [^\s@]+$: End with one or more characters that aren't space or @
  
  This catches most invalid email formats but isn't perfect.
  Server-side validation should also verify the email exists.
  */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /*
  Handle Form Submission
  
  This is the main function that runs when the user submits the form.
  It demonstrates several important patterns:
  
  1. **Preventing Default Behavior**: e.preventDefault() stops the browser
     from doing its default form submission (which would reload the page)
  
  2. **Validation Before Submission**: Check form is valid before making API call
  
  3. **Loading State Management**: Show loading indicator during API call
  
  4. **Error Handling**: Handle both validation errors and network errors
  
  5. **Async/Await**: Handle asynchronous API calls cleanly
  */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();  // Prevent browser default form submission
    
    /*
    Client-side Validation Check
    
    Before making an expensive API call, we validate the form on the client.
    If there are validation errors, we show them and don't submit.
    */
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;  // Exit early if validation fails
    }
    
    /*
    Prepare for API Call
    
    Set loading state and clear any previous errors.
    This gives users immediate feedback that something is happening.
    */
    setIsLoading(true);
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');
    
    try {
      /*
      API Call with Proper Error Handling
      
      We use try/catch to handle both successful responses and errors.
      The ApiService.register call returns an AuthResponse that could contain:
      - Success: message indicating success
      - Validation errors: specific field errors from server
      - General error: overall error message
      */
      const response: AuthResponse = await ApiService.register(formData);
      
      if (response.message && !response.error && !response.errors) {
        /*
        Registration Successful
        
        When registration succeeds, we:
        1. Show success message to user
        2. Call the onRegisterSuccess callback to notify parent component
        3. Parent component typically switches to login form
        */
        setSuccessMessage('Registration successful! Please check your email for verification.');
        onRegisterSuccess(response.message);
      } else if (response.errors) {
        /*
        Server Validation Errors
        
        If the server returns field-specific validation errors,
        we display them next to the relevant form fields.
        This provides precise feedback about what needs to be fixed.
        */
        setErrors(response.errors);
      } else if (response.error) {
        /*
        General Error
        
        For general errors (like "email already exists"),
        we show a general error message at the top of the form.
        */
        setGeneralError(response.error);
      }
    } catch (err) {
      /*
      Network or Unexpected Errors
      
      If something goes wrong with the network request or an unexpected
      error occurs, we show a generic error message and log the details
      for debugging.
      */
      setGeneralError('Registration failed. Please try again.');
      console.error('Registration error:', err);
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
  
  /*
  Password Strength Checker
  
  This function analyzes password strength in real-time as the user types.
  It provides immediate feedback to help users create secure passwords.
  
  Scoring System:
  - 0: Very weak (doesn't meet basic requirements)
  - 1: Weak (meets some requirements)
  - 2: Fair (meets most requirements)
  - 3: Good (meets all requirements)
  - 4: Strong (exceeds requirements)
  - 5: Very strong (excellent password)
  
  The function returns a PasswordStrength object with:
  - score: Numeric strength score
  - feedback: Array of missing requirements
  - isValid: Whether password meets minimum requirements
  */
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    /*
    Length Check
    
    Password length is the most important factor in security.
    Each additional character exponentially increases the time
    needed to crack the password.
    */
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('At least 8 characters');
    }

    /*
    Character Type Checks
    
    Having different types of characters (uppercase, lowercase, numbers,
    special characters) makes passwords much harder to crack because
    it increases the "character space" that attackers must search.
    */
    
    // Uppercase letter check
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('One uppercase letter');
    }

    // Lowercase letter check
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('One lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('One number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score++;
    } else {
      feedback.push('One special character (!@#$%^&*)');
    }

    /*
    Return Password Strength Object
    
    isValid is true only when all requirements are met (score >= 5).
    This ensures users create passwords that meet our security standards.
    */
    return {
      score,
      feedback,
      isValid: score >= 5 // All criteria must be met
    };
  };
  
  /*
  Password Visibility Toggle
  
  This simple function toggles between showing and hiding the password.
  It improves user experience by letting users see what they're typing
  while still maintaining security by defaulting to hidden.
  */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /*
  Password Strength Indicator Component
  
  This nested component shows the password strength visually.
  It's defined inside the Register component so it has access to
  the passwordStrength state.
  
  Why a nested component?
  - Keeps related UI logic together
  - Has access to parent component's state
  - Cleaner JSX in the main return statement
  - Easier to maintain and modify
  */
  const PasswordStrengthIndicator = () => {
    /*
    Strength Level Mapping
    
    We map the numeric score to user-friendly labels and colors.
    This makes the strength indicator more intuitive for users.
    */
    const getStrengthLabel = (score: number): string => {
      switch (score) {
        case 0: return 'Very Weak';
        case 1: return 'Weak';
        case 2: return 'Fair';
        case 3: return 'Good';
        case 4: return 'Strong';
        case 5: return 'Very Strong';
        default: return 'Unknown';
      }
    };

    const getStrengthColor = (score: number): string => {
      switch (score) {
        case 0: return '#dc2626'; // Red
        case 1: return '#ea580c'; // Orange-red
        case 2: return '#d97706'; // Orange
        case 3: return '#ca8a04'; // Yellow
        case 4: return '#65a30d'; // Light green
        case 5: return '#16a34a'; // Green
        default: return '#6b7280'; // Gray
      }
    };

    return (
      <div className="password-strength">
        <div className="strength-bar">
          <div 
            className="strength-fill" 
            style={{
              width: `${(passwordStrength.score / 5) * 100}%`,
              backgroundColor: getStrengthColor(passwordStrength.score)
            }}
          />
        </div>
        <span 
          className="strength-label"
          style={{ color: getStrengthColor(passwordStrength.score) }}
        >
          {getStrengthLabel(passwordStrength.score)}
        </span>
      </div>
    );
  };

  /*
  JSX Return Statement
  
  This is where we define what the component should render.
  The JSX demonstrates many important React patterns:
  
  1. **Conditional Rendering**: Show different content based on state
  2. **Event Handling**: onClick, onChange, onSubmit handlers
  3. **Dynamic Styling**: CSS classes based on state
  4. **Form Handling**: Controlled inputs with validation
  5. **Component Composition**: Using other components and icons
  
  Key JSX Concepts:
  - className instead of class (class is reserved in JavaScript)
  - Event handlers use camelCase (onClick, onChange)
  - JavaScript expressions go in curly braces {}
  - Self-closing tags need the slash: <input />
  - Components start with capital letters
  */
  return (
    <div className="register-container">
      <div className="register-card">
        
        {/* Header Section */}
        <div className="register-header">
          <UserPlus size={32} color="#667eea" />
          <h2>Create Account</h2>
          <p>Join MultiGenQA to start chatting with AI models</p>
        </div>
        
        {/* 
        Registration Form
        
        The form uses onSubmit to handle submission, which is better than
        onClick on the button because it also handles Enter key presses.
        */}
        <form onSubmit={handleSubmit} className="register-form">
          
          {/* Name Fields Row */}
          <div className="name-group">
            
            {/* First Name Field */}
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="First name"
                  disabled={isLoading}
                  autoComplete="given-name"
                  required
                  className={errors.first_name ? 'error' : ''}
                />
              </div>
              
              {/* Field-specific Error Messages */}
              {errors.first_name && (
                <div className="field-error">
                  {errors.first_name.map((error: string, index: number) => (
                    <span key={index}>{error}</span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Last Name Field */}
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  disabled={isLoading}
                  autoComplete="family-name"
                  required
                  className={errors.last_name ? 'error' : ''}
                />
              </div>
              {errors.last_name && (
                <div className="field-error">
                  {errors.last_name.map((error: string, index: number) => (
                    <span key={index}>{error}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={isLoading}
                autoComplete="email"
                required
                className={errors.email ? 'error' : ''}
              />
            </div>
            {errors.email && (
              <div className="field-error">
                {errors.email.map((error: string, index: number) => (
                  <span key={index}>{error}</span>
                ))}
              </div>
            )}
          </div>
          
          {/* Password Field with Strength Indicator */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                disabled={isLoading}
                autoComplete="new-password"
                required
                className={errors.password ? 'error' : ''}
              />
              
              {/* Password Visibility Toggle Button */}
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* 
            Password Strength Indicator
            
            Only show when user has started typing a password.
            This provides real-time feedback without cluttering the initial UI.
            */}
            {formData.password && <PasswordStrengthIndicator />}
            
            {/* Password Validation Errors */}
            {errors.password && (
              <div className="field-error">
                {errors.password.map((error: string, index: number) => (
                  <span key={index}>{error}</span>
                ))}
              </div>
            )}
          </div>
          
          {/* Success Message */}
          {successMessage && (
            <div className="success-message">
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* General Error Message */}
          {generalError && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{generalError}</span>
            </div>
          )}
          
          {/* 
          Submit Button
          
          The button is disabled when:
          - Form is currently submitting (isLoading)
          - Required fields are empty
          - Password doesn't meet strength requirements
          
          This prevents invalid submissions and provides clear feedback
          about what needs to be completed.
          */}
          <button
            type="submit"
            className="register-button"
            disabled={
              isLoading || 
              !formData.email || 
              !formData.password || 
              !formData.first_name || 
              !formData.last_name ||
              !passwordStrength.isValid
            }
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>
        
        {/* 
        Switch to Login Link
        
        Conditional rendering: only show if onSwitchToLogin prop is provided.
        This makes the component flexible - it can be used with or without
        the ability to switch to login.
        */}
        {onSwitchToLogin && (
          <div className="switch-auth">
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="switch-button"
                onClick={onSwitchToLogin}
                disabled={isLoading}
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
      
      {/* 
      Embedded CSS Styles
      
      These styles are embedded in the component for simplicity.
      In a larger application, you might use:
      - CSS modules
      - Styled-components
      - Tailwind CSS
      - Separate CSS files
      
      The styles include:
      - Responsive design (mobile-friendly)
      - Accessibility features (focus states, color contrast)
      - Loading states and animations
      - Error and success state styling
      - Modern design with gradients and shadows
      */}
      <style>{`
        .register-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .register-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          padding: 40px;
          width: 100%;
          max-width: 500px;
        }
        
        .register-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .register-header h2 {
          margin: 16px 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .register-header p {
          margin: 0;
          color: #64748b;
          font-size: 16px;
        }
        
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .name-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          z-index: 1;
        }
        
        .input-wrapper input {
          width: 100%;
          padding: 16px 16px 16px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }
        
        .input-wrapper input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .input-wrapper input:disabled {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        .input-wrapper input.error {
          border-color: #dc2626;
        }
        
        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s ease;
        }
        
        .password-toggle:hover:not(:disabled) {
          color: #667eea;
        }
        
        .password-strength {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }
        
        .strength-bar {
          flex: 1;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .strength-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .strength-label {
          font-size: 12px;
          font-weight: 600;
          min-width: 50px;
        }
        
        .field-error {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: #dc2626;
          font-size: 12px;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }
        
        .success-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          color: #166534;
          font-size: 14px;
        }
        
        .register-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .register-button:hover:not(:disabled) {
          background: #5a6fd8;
          transform: translateY(-1px);
        }
        
        .register-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .switch-auth {
          margin-top: 24px;
          text-align: center;
        }
        
        .switch-auth p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }
        
        .switch-button {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          font-size: 14px;
        }
        
        .switch-button:hover:not(:disabled) {
          color: #5a6fd8;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* 
        Responsive Design
        
        These media queries make the form mobile-friendly:
        - Smaller padding on mobile devices
        - Single column layout for name fields
        - Smaller font sizes for better mobile experience
        */
        @media (max-width: 600px) {
          .register-card {
            padding: 24px;
          }
          
          .name-group {
            grid-template-columns: 1fr;
          }
          
          .register-header h2 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Register; 