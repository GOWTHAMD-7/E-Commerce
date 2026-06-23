// src/context/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, email?: string) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

function getRoleFromEmailAndPayload(email: string, payloadRole?: string): 'CUSTOMER' | 'SELLER' | 'ADMIN' {
  if (payloadRole === 'ADMIN' || payloadRole === 'SELLER' || payloadRole === 'CUSTOMER') {
    return payloadRole;
  }
  if (email === 'admin@gmail.com') {
    return 'ADMIN';
  }
  if (email === 'seller@gmail.com') {
    return 'SELLER';
  }
  return 'CUSTOMER';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Read saved session on boot
  useEffect(() => {
    setTimeout(() => {
      const savedToken = localStorage.getItem('jwt_token');
      const savedEmail = localStorage.getItem('user_email');
      if (savedToken && savedEmail) {
        setToken(savedToken);
        const payload = decodeJwt(savedToken);
        const resolvedRole = getRoleFromEmailAndPayload(savedEmail, payload?.role);
        const userId = payload?.userId;
        setUser({
          id: userId ? Number(userId) : undefined,
          email: savedEmail,
          role: resolvedRole
        });
      }
      setLoading(false);
    }, 1000);
  }, []);

  const login = (newToken: string, providedEmail?: string) => {
    setToken(newToken);
    const payload = decodeJwt(newToken);
    const emailToUse = providedEmail || payload?.sub;
    const resolvedRole = getRoleFromEmailAndPayload(emailToUse, payload?.role);
    const userId = payload?.userId;
    setUser({
      id: userId ? Number(userId) : undefined,
      email: emailToUse,
      role: resolvedRole
    });
    localStorage.setItem('jwt_token', newToken);
    if (emailToUse) {
      localStorage.setItem('user_email', emailToUse);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
