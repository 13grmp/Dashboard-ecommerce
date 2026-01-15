"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState } from '@/hooks/use-auth';

// Contexto de autenticação
const AuthContext = createContext<AuthState & {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  isAdmin: () => boolean;
} | null>(null);

// Provider de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
}

