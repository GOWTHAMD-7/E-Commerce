// src/context/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Read saved session on boot
  useEffect(() => {
    setTimeout(() =>{
      const savedToken = localStorage.getItem('jwt_token');
      const savedEmail = localStorage.getItem('user_email');
      if (savedToken && savedEmail) {
        setToken(savedToken);
        setUser({ email: savedEmail });
      }
      setLoading(false);

    },1000);
  }, []);

  const login = (newToken: string, email: string) => {
    setToken(newToken);
    setUser({ email });
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_email', email);
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
