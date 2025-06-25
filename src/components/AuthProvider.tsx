import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, AuthState } from '../types';
import { ApiService, tokenManager } from '../services/api';

/*
Authentication Context Provider - Complete Beginner's Guide

This component demonstrates one of the most important patterns in React applications:
the Context API for global state management. It's specifically designed for handling
user authentication state throughout the entire application.

=== What is React Context? ===

React Context is like a "global state" system that allows you to share data between
components without having to pass props down through every level of the component tree.

Think of it like this:
- Without Context: You have to pass a message through every person in a chain
- With Context: You can broadcast a message that anyone can hear directly

=== Why Use Context for Authentication? ===

Authentication state (whether user is logged in, user info, etc.) is needed by many
components throughout your app:
- Navigation bar (show user name, logout button)
- Protected routes (redirect if not logged in)
- API calls (include authentication token)
- User profile pages (display user information)

Instead of passing this data through props everywhere, Context lets any component
access authentication state directly.

=== Key React Concepts Demonstrated ===

1. **React Context API**: Global state management
   - createContext(): Creates a context
   - Context.Provider: Provides values to child components
   - useContext(): Consumes context values in components

2. **Custom Hooks**: Reusable stateful logic
   - useAuth(): Our custom hook for accessing authentication state
   - Encapsulates context usage and error checking
   - Provides a clean API for components to use

3. **State Management**: Complex state with multiple related pieces
   - Authentication status (logged in or not)
   - User information (name, email, etc.)
   - JWT token for API calls
   - Loading states during authentication checks

4. **Side Effects**: useEffect for initialization and cleanup
   - Check for existing tokens when app starts
   - Validate tokens with the server
   - Clean up when component unmounts

5. **Error Handling**: Graceful handling of authentication failures
   - Invalid or expired tokens
   - Network errors during token validation
   - Fallback to unauthenticated state

=== TypeScript Concepts Explained ===

1. **Context Typing**: Properly typing context values
   - AuthContextType interface defines what the context provides
   - Ensures type safety when using context values
   - Provides autocomplete in IDE

2. **Generic Types**: Using React's generic types
   - React.FC<AuthProviderProps>: Functional component with specific props
   - createContext<AuthContextType | undefined>: Context with specific type
   - useState<AuthState>: State with specific shape

3. **Optional Types**: Handling values that might not exist
   - User | null: User can be a User object or null
   - AuthContextType | undefined: Context might not be available

4. **Function Types**: Typing functions passed as props or context values
   - (user: User, token: string) => void: Function signature for login
   - () => void: Function signature for logout

=== Authentication Flow Explained ===

1. **App Initialization**: When app starts, AuthProvider checks for existing token
2. **Token Validation**: If token exists, verify it's still valid with server
3. **State Update**: Set authentication state based on validation result
4. **Context Provision**: Provide auth state and functions to all child components
5. **Component Usage**: Any component can use useAuth() to access auth state
6. **State Changes**: Login/logout functions update state and notify all components

=== Security Considerations ===

1. **Token Storage**: JWT tokens stored in localStorage (consider httpOnly cookies for production)
2. **Token Validation**: Always verify tokens with server on app startup
3. **Automatic Cleanup**: Remove invalid tokens automatically
4. **Error Handling**: Don't expose sensitive error information
5. **Logout Cleanup**: Always clear local state on logout

=== Performance Considerations ===

1. **Context Optimization**: Only re-render when auth state actually changes
2. **Initialization Check**: Prevent multiple simultaneous auth checks
3. **Lazy Loading**: Only load user data when needed
4. **Memory Management**: Clean up resources properly
*/

/*
Authentication Context Type Definition

This interface defines exactly what the authentication context provides to components.
It's like a contract that says "if you use this context, these are the values and
functions you can access."

Why define this interface?
- **Type Safety**: TypeScript ensures we provide all required values
- **Documentation**: Other developers can see what's available
- **IDE Support**: Autocomplete and error checking
- **Refactoring Safety**: Changes to this interface show all affected code
*/
interface AuthContextType {
  authState: AuthState;                              // Current authentication state
  login: (user: User, token: string) => void;       // Function to log user in
  logout: () => void;                                // Function to log user out
  updateUser: (user: User) => void;                  // Function to update user info
}

/*
Create Authentication Context

createContext() creates a new React context that can be used to share values
between components without passing props down manually at every level.

Key points:
- We initialize with 'undefined' as the default value
- We'll check for undefined in our custom hook to ensure proper usage
- The generic type <AuthContextType | undefined> tells TypeScript what this context contains
*/
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*
Props Interface for AuthProvider

This defines what props the AuthProvider component expects.
The only prop is 'children', which represents all the components
that will be wrapped by this provider.

ReactNode is a TypeScript type that includes:
- JSX elements (<div>, <Component />)
- Strings and numbers
- Arrays of React nodes
- null and undefined
- Basically anything that can be rendered by React
*/
interface AuthProviderProps {
  children: ReactNode; // All child components that need access to auth state
}

/*
AuthProvider Component

This is the main component that provides authentication state to the entire app.
It wraps the app and makes auth state available to all child components.

Component Structure:
1. **State Management**: Manages authentication state with useState
2. **Initialization**: Checks for existing tokens when component mounts
3. **Auth Functions**: Provides login, logout, and update functions
4. **Context Provider**: Makes everything available to child components

React.FC<AuthProviderProps> means:
- This is a React Functional Component
- It expects props matching the AuthProviderProps interface
- TypeScript will ensure we handle props correctly
*/
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  
  /*
  Authentication State Management
  
  We use useState to manage the authentication state for the entire app.
  The state includes:
  - isAuthenticated: Boolean indicating if user is logged in
  - user: User object with user information (null if not logged in)
  - token: JWT token for API authentication (null if not logged in)
  - isLoading: Boolean indicating if we're checking authentication status
  
  Why start with isLoading: true?
  - We need to check if there's an existing valid token when the app starts
  - During this check, we show a loading state instead of login form
  - This prevents the "flash of unauthenticated content" problem
  */
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,  // User is not authenticated initially
    user: null,              // No user information initially
    token: null,             // No token initially
    isLoading: true          // Start loading while we check for existing auth
  });

  /*
  Reference to Prevent Multiple Auth Checks
  
  useRef creates a mutable reference that persists across re-renders.
  We use it to prevent multiple simultaneous authentication checks.
  
  Why is this important?
  - If multiple components trigger auth checks simultaneously, we could have race conditions
  - Multiple API calls for the same purpose waste resources
  - Inconsistent state updates could cause bugs
  
  useRef vs useState:
  - useRef: Value persists across renders, changing it doesn't trigger re-render
  - useState: Value persists across renders, changing it triggers re-render
  */
  const authCheckInProgress = useRef(false);

  /*
  Initialize Authentication State
  
  This useEffect runs when the component first mounts (empty dependency array []).
  It checks if there's an existing authentication token and validates it.
  
  Why do we need this?
  - Users shouldn't have to log in every time they visit the app
  - If they have a valid token, we should automatically authenticate them
  - If the token is invalid/expired, we should clean it up
  
  The flow:
  1. Check if token exists in localStorage
  2. If yes, validate it by calling the API
  3. If valid, set user as authenticated
  4. If invalid, clean up and set as unauthenticated
  5. If no token, set as unauthenticated
  */
  useEffect(() => {
    const initializeAuth = async () => {
      /*
      Prevent Multiple Simultaneous Checks
      
      If an auth check is already in progress, don't start another one.
      This prevents race conditions and duplicate API calls.
      */
      if (authCheckInProgress.current) {
        return;
      }
      
      // Mark that auth check is in progress
      authCheckInProgress.current = true;
      
      try {
        /*
        Check for Existing Token
        
        tokenManager.getToken() retrieves the JWT token from localStorage.
        If no token exists, this returns null.
        */
        const token = tokenManager.getToken();
        
        if (token) {
          try {
            /*
            Validate Token with Server
            
            Just because we have a token doesn't mean it's valid:
            - It might be expired
            - It might have been revoked
            - The server might have changed its signing key
            
            We validate by making an API call to get current user info.
            If this succeeds, the token is valid.
            */
            const user = await ApiService.getCurrentUser();
            
            /*
            Set Authenticated State
            
            If we successfully got user info, the token is valid.
            Update state to reflect that user is authenticated.
            */
            setAuthState({
              isAuthenticated: true,
              user,
              token,
              isLoading: false  // Done loading
            });
          } catch (error) {
            /*
            Handle Invalid Token
            
            If the API call fails, the token is invalid or expired.
            Clean up by removing the token and setting unauthenticated state.
            */
            console.error('Token validation failed:', error);
            tokenManager.removeToken();  // Remove invalid token
            setAuthState({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false
            });
          }
        } else {
          /*
          No Token Found
          
          If there's no token in localStorage, user is not authenticated.
          Set state accordingly.
          */
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false
          });
        }
      } finally {
        /*
        Cleanup
        
        The finally block always runs, whether try succeeded or failed.
        Reset the flag so future auth checks can proceed.
        */
        authCheckInProgress.current = false;
      }
    };

    // Call the initialization function
    initializeAuth();
  }, []); // Empty dependency array means this runs once when component mounts

  /*
  Authentication Action Functions
  
  These functions modify the authentication state and are provided to child
  components through the context. They handle the core authentication operations.
  */
  
  /*
  Login Function
  
  This function is called when a user successfully logs in.
  It receives the user object and JWT token from the login API response.
  
  What it does:
  1. Store the token in localStorage for persistence
  2. Update the authentication state
  3. All components using useAuth() will automatically re-render with new state
  
  Parameters:
  - user: User object containing user information
  - token: JWT token for authenticating future API requests
  */
  const login = (user: User, token: string) => {
    tokenManager.setToken(token);  // Store token for future API calls
    setAuthState({
      isAuthenticated: true,
      user,
      token,
      isLoading: false
    });
  };

  /*
  Logout Function
  
  This function logs the user out and cleans up all authentication state.
  
  What it does:
  1. Call the logout API endpoint to invalidate the token on the server
  2. Remove the token from localStorage
  3. Reset authentication state to unauthenticated
  4. All components using useAuth() will automatically re-render
  
  Why call the server logout endpoint?
  - Invalidates the token on the server side
  - Prevents the token from being used if somehow obtained by someone else
  - Proper security practice for JWT tokens
  
  The try/catch/finally structure ensures:
  - We always clean up local state, even if server call fails
  - Network errors don't prevent logout
  - User experience is consistent
  */
  const logout = async () => {
    try {
      // Attempt to invalidate token on server
      await ApiService.logout();
    } catch (error) {
      // Log error but don't prevent logout
      console.error('Logout error:', error);
    } finally {
      // Always clean up local state
      tokenManager.removeToken();
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      });
    }
  };

  /*
  Update User Function
  
  This function updates the user information in the authentication state.
  It's useful when user profile information changes but they remain logged in.
  
  Examples of when this is used:
  - User updates their profile (name, email, etc.)
  - User uploads a new profile picture
  - Admin updates user permissions
  
  We use functional state update to ensure we only change the user field
  while preserving other authentication state.
  */
  const updateUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,  // Keep all existing state
      user      // Update only the user field
    }));
  };

  /*
  Context Value Object
  
  This object contains all the values and functions that will be available
  to child components through the context.
  
  We create this object separately for clarity and to ensure it matches
  the AuthContextType interface exactly.
  */
  const contextValue: AuthContextType = {
    authState,   // Current authentication state
    login,       // Function to log user in
    logout,      // Function to log user out
    updateUser   // Function to update user information
  };

  /*
  Context Provider JSX
  
  The Context.Provider component makes the context value available to all
  child components. Any component in the children tree can access these
  values using the useAuth() hook.
  
  Key points:
  - value prop contains what we want to share with child components
  - children prop renders all the components wrapped by this provider
  - This is typically wrapped around the entire app in index.tsx or App.tsx
  */
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/*
Custom Hook: useAuth

This is a custom hook that provides easy access to the authentication context.
Custom hooks are functions that start with "use" and can call other hooks.

Why create a custom hook instead of using useContext directly?
1. **Convenience**: Simpler API for components to use
2. **Error Checking**: Ensures hook is used within AuthProvider
3. **Type Safety**: Returns properly typed context value
4. **Consistency**: Standardized way to access auth state throughout app

Usage in components:
```typescript
const { authState, login, logout } = useAuth();

// Check if user is logged in
if (authState.isAuthenticated) {
  // Show authenticated UI
} else {
  // Show login form
}

// Log user out
const handleLogout = () => {
  logout();
};
```

Error Handling:
If a component tries to use useAuth() outside of an AuthProvider,
we throw a clear error message. This helps developers catch mistakes early.
*/
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  /*
  Context Validation
  
  If context is undefined, it means useAuth() was called in a component
  that's not wrapped by AuthProvider. This is a common mistake that would
  cause runtime errors, so we catch it early with a clear error message.
  
  This error helps developers understand:
  - What went wrong (hook used outside provider)
  - How to fix it (wrap component tree with AuthProvider)
  */
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/*
AuthGuard Component

This component protects routes or sections that require authentication.
It's a common pattern in React apps to have components that check authentication
before rendering their children.

How it works:
1. Check if user is authenticated using useAuth()
2. If authenticated, render children normally
3. If not authenticated, render fallback content (like login prompt)
4. If still loading, could show loading spinner

This is often used to protect entire routes or sensitive UI sections.

Usage example:
```typescript
<AuthGuard fallback={<LoginForm />}>
  <ProtectedContent />
</AuthGuard>
```

Props:
- children: The content to show if user is authenticated
- fallback: What to show if user is not authenticated (optional)
*/
interface AuthGuardProps {
  children: ReactNode;                                    // Content to protect
  fallback?: ReactNode;                                   // What to show if not authenticated
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <div>Please log in to access this page.</div>  // Default fallback message
}) => {
  const { authState } = useAuth();

  /*
  Authentication Check
  
  We check the authentication state and render different content based on it:
  - If loading: Show loading state (could be spinner, skeleton, etc.)
  - If authenticated: Show the protected content (children)
  - If not authenticated: Show fallback content (login prompt, error message, etc.)
  
  This pattern is called "conditional rendering" and is very common in React.
  */
  
  // Still checking authentication status
  if (authState.isLoading) {
    return <div>Loading...</div>;
  }

  // User is authenticated, show protected content
  if (authState.isAuthenticated) {
    return <>{children}</>;
  }

  // User is not authenticated, show fallback
  return <>{fallback}</>;
}; 