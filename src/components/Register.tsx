import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Check, X } from 'lucide-react';
import { RegisterRequest, AuthResponse, ValidationErrors, PasswordStrength } from '../types';
import { ApiService } from '../services/api';

/*
Props Interface for Register Component

This component can receive optional callback functions:
- onRegisterSuccess: Called when registration is successful
- onSwitchToLogin: Called when user wants to switch to login
*/
interface RegisterProps {
  onRegisterSuccess: (message: string) => void;
  onSwitchToLogin: () => void;
}

/*
Register Component

This component handles user registration with email, password, and name fields.
It includes comprehensive form validation, error handling, and password strength indicators.

Key TypeScript concepts:
- Complex state management with multiple related pieces of state
- Form validation with detailed error messages
- Password strength checking
- Async form submission with proper error handling
*/
const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  // Form state with TypeScript types
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });
  
  /*
  Handle Input Changes
  
  This function updates the form data and clears related errors when user types.
  */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific errors when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error
    if (generalError) {
      setGeneralError('');
    }
    
    // Special handling for password field
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };
  
  /*
  Client-side Form Validation
  
  This function validates the form before submission.
  It checks all fields and returns validation errors.
  */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = ['Email is required'];
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = ['Please enter a valid email address'];
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = ['Password is required'];
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors;
      }
    }
    
    // First name validation
    if (!formData.first_name) {
      newErrors.first_name = ['First name is required'];
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = ['First name must be at least 2 characters long'];
    }
    
    // Last name validation
    if (!formData.last_name) {
      newErrors.last_name = ['Last name is required'];
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = ['Last name must be at least 2 characters long'];
    }
    
    return newErrors;
  };
  
  /*
  Password Validation Helper
  
  This function checks password strength and returns an array of error messages.
  */
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };
  
  /*
  Email Validation Helper
  */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /*
  Handle Form Submission
  */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');
    
    try {
      const response: AuthResponse = await ApiService.register(formData);
      
      if (response.message && !response.error && !response.errors) {
        // Registration successful
        setSuccessMessage('Registration successful! Please check your email for verification.');
        onRegisterSuccess(response.message);
      } else if (response.errors) {
        // Validation errors from backend
        setErrors(response.errors);
      } else if (response.error) {
        // General error
        setGeneralError(response.error);
      }
    } catch (err) {
      setGeneralError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  /*
  Password Strength Checker
  
  This function analyzes password strength in real-time.
  It checks for various criteria and provides feedback to the user.
  */
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('At least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('One uppercase letter');
    }

    // Lowercase check
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

    return {
      score,
      feedback,
      isValid: score >= 5 // All criteria must be met
    };
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  /*
  Password Strength Indicator Component
  
  This renders a visual indicator of password strength
  */
  const PasswordStrengthIndicator: React.FC = () => {
    const getStrengthColor = (score: number): string => {
      if (score <= 1) return '#ef4444'; // red
      if (score <= 2) return '#f97316'; // orange
      if (score <= 3) return '#eab308'; // yellow
      if (score <= 4) return '#22c55e'; // green
      return '#16a34a'; // dark green
    };

    const getStrengthText = (score: number): string => {
      if (score <= 1) return 'Very Weak';
      if (score <= 2) return 'Weak';
      if (score <= 3) return 'Fair';
      if (score <= 4) return 'Good';
      return 'Strong';
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
        <div className="strength-text">
          <span style={{ color: getStrengthColor(passwordStrength.score) }}>
            {getStrengthText(passwordStrength.score)}
          </span>
        </div>
        {passwordStrength.feedback.length > 0 && (
          <div className="strength-feedback">
            <p>Password must include:</p>
            <ul>
              {passwordStrength.feedback.map((item: string, index: number) => (
                <li key={index}>
                  <X size={12} className="feedback-icon error" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {passwordStrength.isValid && (
          <div className="strength-feedback">
            <div className="feedback-success">
              <Check size={12} className="feedback-icon success" />
              Password meets all requirements
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <UserPlus size={32} color="#667eea" />
          <h2>Create Account</h2>
          <p>Join MultiGenQA to start chatting with AI models</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          {/* Name Fields */}
          <div className="name-group">
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
              {errors.first_name && (
                <div className="field-error">
                  {errors.first_name.map((error: string, index: number) => (
                    <span key={index}>{error}</span>
                  ))}
                </div>
              )}
            </div>
            
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
          
          {/* Password Field */}
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
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && <PasswordStrengthIndicator />}
            
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
          
          {/* Submit Button */}
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
        
        {/* Switch to Login */}
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