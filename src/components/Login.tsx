import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { ApiService } from '../services/api';
import { LoginRequest, AuthResponse } from '../types';

/*
Login Component

This component provides a user interface for logging in with email and password.
It demonstrates several important TypeScript and React concepts:

1. useState with TypeScript: We specify the type of state (useState<string>)
2. Event handlers: Properly typed event handlers for forms and inputs
3. Async/await: Handling asynchronous API calls
4. Error handling: Managing and displaying errors to users
5. Conditional rendering: Showing different UI based on state
*/

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  // State management with TypeScript
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  /*
  Event Handlers
  
  These functions handle user interactions like typing and clicking buttons.
  The types (React.ChangeEvent<HTMLInputElement>) tell TypeScript exactly
  what kind of event to expect, which helps catch errors at compile time.
  */
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: []
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const response: AuthResponse = await ApiService.login(formData);
      
      if (response.token && response.user) {
        // Login successful
        onLoginSuccess(response.user, response.token);
      } else if (response.errors) {
        // Validation errors from backend
        setFieldErrors(response.errors);
      } else if (response.error) {
        // General error
        setError(response.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your MultiGenQA account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* General Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className={fieldErrors.email ? 'error' : ''}
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && (
              <div className="field-errors">
                {fieldErrors.email.map((error, index) => (
                  <span key={index} className="field-error">{error}</span>
                ))}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                className={fieldErrors.password ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="field-errors">
                {fieldErrors.password.map((error, index) => (
                  <span key={index} className="field-error">{error}</span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? (
              <>
                <Loader className="loading-spinner" size={16} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 