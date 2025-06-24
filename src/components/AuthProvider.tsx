import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { ApiService, tokenManager } from '../services/api';

/*
Authentication Context Provider

This component uses React Context to provide authentication state to the entire app.
React Context is like a "global state" that any component can access without
having to pass props down through multiple levels.

Key TypeScript concepts demonstrated:
1. React.createContext with proper typing
2. Custom hooks (useAuth)
3. Context Provider pattern
4. Optional types (User | null)
5. React children typing (ReactNode)
*/

// Define the shape of our authentication context
interface AuthContextType {
  authState: AuthState;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Create the context with undefined as default
// We'll check for this in our hook to ensure proper usage
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props interface for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode; // ReactNode includes any valid React child
}

/*
AuthProvider Component

This component wraps our entire app and provides authentication state
to all child components through React Context.
*/
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Authentication state management
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true // Start with loading true while we check for existing token
  });

  /*
  Initialize Authentication State
  
  This effect runs when the component mounts and checks if there's
  an existing valid token in localStorage.
  */
  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenManager.getToken();
      
      if (token) {
        try {
          // Verify the token by getting current user info
          const user = await ApiService.getCurrentUser();
          
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false
          });
        } catch (error) {
          // Token is invalid or expired
          console.error('Token verification failed:', error);
          tokenManager.removeToken();
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false
          });
        }
      } else {
        // No token found
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false
        });
      }
    };

    initializeAuth();
  }, []);

  /*
  Authentication Actions
  
  These functions modify the authentication state and are provided
  to child components through the context.
  */
  
  const login = (user: User, token: string) => {
    tokenManager.setToken(token);
    setAuthState({
      isAuthenticated: true,
      user,
      token,
      isLoading: false
    });
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      tokenManager.removeToken();
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      });
    }
  };

  const updateUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user
    }));
  };

  // Context value that will be provided to child components
  const contextValue: AuthContextType = {
    authState,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/*
Custom Hook: useAuth

This is a custom hook that provides easy access to the authentication context.
Custom hooks are a way to reuse stateful logic between components.

Usage in components:
const { authState, login, logout } = useAuth();
*/
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  // This check ensures the hook is used within an AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/*
AuthGuard Component

This component protects routes that require authentication.
It shows a loading state while checking auth, and redirects
unauthenticated users to the login page.
*/
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode; // What to show if not authenticated
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <div>Please log in to access this page.</div> 
}) => {
  const { authState } = useAuth();

  // Show loading while checking authentication
  if (authState.isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Show fallback if not authenticated
  if (!authState.isAuthenticated) {
    return <>{fallback}</>;
  }

  // Show protected content if authenticated
  return <>{children}</>;
}; 