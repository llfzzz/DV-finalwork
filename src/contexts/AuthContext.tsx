'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  authMode: 'login' | 'register';
  setShowAuthModal: (show: boolean, mode?: 'login' | 'register') => void;
  login: (email: string, otp: string, username?: string) => Promise<boolean>;
  passwordLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  requireAuth: () => boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 检查用户登录状态
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = async (email: string, otp: string, username?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          step: 'verify-otp',
          otp,
          username
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        setShowAuthModal(false);
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // 密码登录
  const passwordLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          step: 'password-login'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        setShowAuthModal(false);
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Password login failed:', error);
      return false;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  // 要求认证，如果未登录则显示登录框
  const requireAuth = (): boolean => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setAuthMode('login');
      return false;
    }
    return true;
  };

  const handleSetShowAuthModal = (show: boolean, mode: 'login' | 'register' = 'login') => {
    setShowAuthModal(show);
    if (show) {
      setAuthMode(mode);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      showAuthModal,
      authMode,
      setShowAuthModal: handleSetShowAuthModal,
      login,
      passwordLogin,
      logout,
      requireAuth,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
