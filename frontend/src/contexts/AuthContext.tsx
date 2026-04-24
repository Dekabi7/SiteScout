"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phone?: string;
  planType: string;
  dailyExportCount: number;
  dailyExportLimit: number;
  trialEndsAt?: string;
  emailVerified: boolean;
  isTrialExpired: boolean;
  isOnFreePlan: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('sitescout_token');
    const storedUser = localStorage.getItem('sitescout_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('sitescout_user');
      }
    }

    setIsLoading(false);
  }, []);

  // Verify token on mount and periodically
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyToken = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('sitescout_user', JSON.stringify(data.user));
        return true;
      } else {
        // Token is invalid, clear auth state
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('sitescout_token', data.token);
        localStorage.setItem('sitescout_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('sitescout_token', data.token);
        localStorage.setItem('sitescout_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sitescout_token');
    localStorage.removeItem('sitescout_user');
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to send reset email' };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to reset password' };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('sitescout_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    verifyToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
