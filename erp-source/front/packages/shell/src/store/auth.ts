"use client";

import { create } from 'zustand';
import { authApi } from '../lib/api/auth';

interface AuthState {
  accessToken: string | null;
  fullAccessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  activeModule: string | null;
  isAuthenticated: boolean;
  hydrate: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  fullAccessToken: null,
  refreshToken: null,
  tenantId: null,
  activeModule: null,
  isAuthenticated: false,

  hydrate: () => {
    const accessToken = localStorage.getItem('accessToken');
    const fullAccessToken = localStorage.getItem('fullAccessToken') || accessToken;
    const refreshToken = localStorage.getItem('refreshToken');
    const tenantId = localStorage.getItem('tenantId');
    const activeModule = localStorage.getItem('activeModule');
    if (accessToken && refreshToken) {
      set({ accessToken, fullAccessToken, refreshToken, tenantId, activeModule, isAuthenticated: true });
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try { if (refreshToken) await authApi.logout(refreshToken); }
    finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('fullAccessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('activeModule');
      set({ accessToken: null, fullAccessToken: null, refreshToken: null, tenantId: null, activeModule: null, isAuthenticated: false });
    }
  },
}));
