import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/database';
import { userService } from '../database';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string, role: 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const decoded = userService.verifyToken(storedToken);
          const userData = await userService.getUserById(decoded.userId);
          
          if (userData) {
            setUser(userData);
            setToken(storedToken);
          } else {
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Authenticate user against database
    const authenticatedUser = await userService.authenticateUser(email, password);
    
    // Generate JWT token
    const userToken = userService.generateToken(authenticatedUser);
    
    // Store token in localStorage (in production, use httpOnly cookies)
    localStorage.setItem('authToken', userToken);
    
    // Update context state
    setUser(authenticatedUser);
    setToken(userToken);
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string, role: 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN') => {
    // Create user in database
    const newUser = await userService.createUser(email, password, firstName, lastName, role);
    
    if (newUser) {
      // Token is already set by userService
      const userToken = userService.generateToken(newUser);
      
      // Update context state
      setUser(newUser);
      setToken(userToken);
    } else {
      throw new Error('Failed to create user');
    }
  };

  const logout = () => {
    // Clear context state
    setUser(null);
    setToken(null);
    
    // Clear stored token
    localStorage.removeItem('authToken');
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'ADMIN'
  };

  if (isLoading) {
    // Return loading indicator while checking authentication
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Additional hook for protected routes
export const useRequireAuth = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    // Redirect or handle unauthorized access
    throw new Error('Authentication required');
  }
  
  return user;
};
