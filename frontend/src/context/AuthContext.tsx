'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ApiClient from '@/services/api';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      ApiClient.post('/api/auth/logout', { refresh_token: refreshToken }).catch(() => {});
    }
    localStorage.clear();
    setUser(null);
    router.push('/login');
  }, [router]);

  const checkAuth = useCallback(async () => {
    // If student is opening invitation token link, skip auth enforcement
    if (pathname && pathname.startsWith('/student/assessment')) {
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    try {
      const userData = await ApiClient.get<User>('/api/auth/me');
      setUser(userData);
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      localStorage.clear();
      setUser(null);
      if (pathname !== '/login') {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (pathname && pathname.startsWith('/student/assessment')) {
        return; // Allow student assessment token page
      }

      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user) {
        if (pathname === '/login') {
          router.push(user.role === 'admin' ? '/admin/assessments' : '/login');
        } else if (pathname.startsWith('/admin') && user.role !== 'admin') {
          router.push('/login');
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await ApiClient.post<{ access_token: string; refresh_token: string }>('/api/auth/login', {
        email,
        password,
      });

      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      const userData = await ApiClient.get<User>('/api/auth/me');
      setUser(userData);

      router.push(userData.role === 'admin' ? '/admin/assessments' : '/login');
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
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

