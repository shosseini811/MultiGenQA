import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, LogIn, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { LoginRequest, AuthResponse } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

/*
Login Component

This component provides a user interface for logging in with email and password.
It demonstrates several important TypeScript and React concepts:

1. useState with TypeScript: We specify the type of state (useState<string>)
2. Event handlers: Properly typed event handlers for forms and inputs
3. Async/await: Handling asynchronous API calls
4. Error handling: Managing and displaying errors to users
5. Conditional rendering: Showing different UI based on state
6. shadcn/ui components: Modern, accessible UI components with TypeScript support
*/

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-claude-cream via-claude-cream-light to-white p-4">
      <Card className="w-full max-w-md shadow-claude-xl border-claude-orange/20 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-claude-orange to-claude-purple rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-claude-gray-800">Welcome Back</CardTitle>
          <CardDescription className="text-claude-gray-600">
            Sign in to your MultiGenQA account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-claude-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-claude-gray-400 w-4 h-4" />
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
              {fieldErrors.email && (
                <div className="space-y-1">
                  {fieldErrors.email.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-claude-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-claude-gray-400 w-4 h-4" />
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
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-claude-gray-400 hover:text-claude-orange transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="space-y-1">
                  {fieldErrors.password.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full bg-gradient-to-r from-claude-orange to-claude-orange-dark hover:from-claude-orange-dark hover:to-claude-orange-darker text-white border-0 shadow-claude-md hover:shadow-claude-lg transition-all duration-200 py-2.5"
            >
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