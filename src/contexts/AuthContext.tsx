import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../utils/api';

interface User {
  id: number;
  email: string;
  username: string;
  provider: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth(): Promise<void> {
    try {
      // Check if user has existing token
      const token = await apiClient.getToken();
      if (token) {
        // Verify token is still valid by fetching user
        const response = await apiClient.getMe();
        if (response.data) {
          setUser(response.data);
        } else {
          // Token invalid, clear it
          await apiClient.setToken(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(email: string, password: string): Promise<void> {
    try {
      setLoading(true);
      
      const response = await apiClient.login(email, password);
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to sign in');
      }

      // Save token and user
      await apiClient.setToken(response.data.token);
      setUser(response.data.user);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail(email: string, username: string, password: string): Promise<void> {
    try {
      setLoading(true);
      
      const response = await apiClient.register(email, username, password);
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to create account');
      }

      // Save token and user
      await apiClient.setToken(response.data.token);
      setUser(response.data.user);
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    try {
      setLoading(true);
      
      // Clear token and user
      await apiClient.setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
