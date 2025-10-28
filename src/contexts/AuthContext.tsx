import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/services/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'both' | 'admin';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'both' | 'admin') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated via token
    const token = localStorage.getItem('authToken');
    if (token) {
      // In a real implementation, you would verify the token with the backend
      // For now, we'll just clear it and require re-authentication
      localStorage.removeItem('authToken');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'both' | 'admin') => {
    try {
      const response = await apiClient.register({
        email,
        password,
        name,
        role,
      });
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isAuthenticated: !!user,
      loading 
    }}>
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
