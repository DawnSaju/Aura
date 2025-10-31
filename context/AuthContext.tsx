"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { account } from '@/lib/appwrite';
import { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    await checkUser();
  };

  const loginWithGoogle = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    account.createOAuth2Session(
      'google' as any,
      `${origin}/dashboard`,
      `${origin}/auth/signin?error=oauth_failed`
    );
  };

  const logout = async () => {
    await account.deleteSession('current');
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    const { ID } = await import('appwrite');
    await account.create(ID.unique(), email, password, name);
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, register }}>
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
