import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  accessToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<{ twoFactorRequired: boolean; twoFactorToken?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  socialLogin: (provider: string, body: Record<string, unknown>) => Promise<{ twoFactorRequired: boolean; twoFactorToken?: string }>;
  completeTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  tenantId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    const tenantId = sessionStorage.getItem('tenantId');
    if (tenantId) set({ tenantId });
    try {
      const { data } = await authApi.silentRefresh();
      const accessToken = data?.data?.accessToken ?? null;
      if (accessToken) set({ accessToken, isAuthenticated: true });
    } catch {
      set({ isAuthenticated: false });
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

      // Access token in memory only; refresh token is an HttpOnly cookie set by the server
      const { accessToken, tenantId } = result;
      if (tenantId) sessionStorage.setItem('tenantId', tenantId);
      set({ accessToken, tenantId, isAuthenticated: true, isLoading: false });
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
    try { await authApi.logout(); } catch { /* ignore */ }
    finally {
      sessionStorage.removeItem('tenantId');
      set({ accessToken: null, tenantId: null, isAuthenticated: false });
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

      const { accessToken, tenantId } = result;
      if (tenantId) sessionStorage.setItem('tenantId', tenantId);
      set({ accessToken, tenantId, isAuthenticated: true, isLoading: false });
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
      const { accessToken, tenantId } = data.data;
      if (tenantId) sessionStorage.setItem('tenantId', tenantId);
      set({ accessToken, tenantId, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Invalid verification code';
      set({ error: message, isLoading: false });
      throw err;
    }
  },
}));

