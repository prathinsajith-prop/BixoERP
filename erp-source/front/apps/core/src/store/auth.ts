import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => void;
  login: (credentials: { email: string; password: string }) => Promise<{ twoFactorRequired: boolean; twoFactorToken?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  socialLogin: (provider: string, body: Record<string, unknown>) => Promise<{ twoFactorRequired: boolean; twoFactorToken?: string }>;
  completeTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  tenantId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  hydrate: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const tenantId = localStorage.getItem('tenantId');
    if (accessToken && refreshToken) {
      set({ accessToken, refreshToken, tenantId, isAuthenticated: true });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(credentials);
      const result = data.data;

      if (result.twoFactorRequired) {
        set({ isLoading: false });
        return { twoFactorRequired: true, twoFactorToken: result.twoFactorToken };
      }

      const { accessToken, refreshToken, tenantId } = result;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('fullAccessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (tenantId) localStorage.setItem('tenantId', tenantId);
      set({ accessToken, refreshToken, tenantId, isAuthenticated: true, isLoading: false });
      return { twoFactorRequired: false };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);
      set({ isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      set({ accessToken: null, refreshToken: null, tenantId: null, isAuthenticated: false });
    }
  },

  socialLogin: async (provider, body) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.socialLogin(provider, body);
      const result = data.data;

      if (result.twoFactorRequired) {
        set({ isLoading: false });
        return { twoFactorRequired: true, twoFactorToken: result.twoFactorToken };
      }

      const { accessToken, refreshToken, tenantId } = result;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('fullAccessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (tenantId) localStorage.setItem('tenantId', tenantId);
      set({ accessToken, refreshToken, tenantId, isAuthenticated: true, isLoading: false });
      return { twoFactorRequired: false };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Social login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  completeTwoFactor: async (twoFactorToken, code) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.twoFactorValidate({ twoFactorToken, code });
      const { accessToken, refreshToken, tenantId } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('fullAccessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (tenantId) localStorage.setItem('tenantId', tenantId);
      set({ accessToken, refreshToken, tenantId, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Invalid verification code';
      set({ error: message, isLoading: false });
      throw err;
    }
  },
}));
