"use client";

import { create } from 'zustand';
import { authApi } from '../lib/api/auth';

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return {}; }
}

interface AuthState {
  // Access token lives in JS memory only — never written to localStorage.
  // If the tab closes it's gone; the HttpOnly refresh cookie silently restores it.
  accessToken: string | null;
  // Scoped (module) token also stays in memory only.
  fullAccessToken: string | null;
  // tenantId is not a secret but we keep it in sessionStorage so it survives
  // a same-tab refresh without the security risk of a long-lived cookie/localStorage token.
  tenantId: string | null;
  activeModule: string | null;
  isAuthenticated: boolean;
  /** Called once on app boot. Attempts a silent token refresh via the HttpOnly cookie. */
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  fullAccessToken: null,
  tenantId: null,
  activeModule: null,
  isAuthenticated: false,

  hydrate: async () => {
    // Restore non-sensitive UI state from sessionStorage
    const tenantId = sessionStorage.getItem('tenantId');
    const activeModule = sessionStorage.getItem('activeModule');
    if (tenantId) set({ tenantId, activeModule });

    // Attempt a silent token refresh. The browser automatically sends the
    // HttpOnly __erp_rt cookie so we don't need to read any token from storage.
    try {
      const { data } = await authApi.silentRefresh();
      const accessToken = data?.data?.accessToken ?? null;
      if (accessToken) {
        // Decode JWT to restore tenantId without needing sessionStorage
        // This fixes the new-tab problem where sessionStorage is empty
        const payload = decodeJwt(accessToken);
        const restoredTenantId = (payload?.orgId ?? payload?.tenantId ?? null) as string | null;
        if (restoredTenantId && !sessionStorage.getItem('tenantId')) {
          sessionStorage.setItem('tenantId', restoredTenantId);
        }
        set({
          accessToken,
          fullAccessToken: accessToken,
          tenantId: restoredTenantId ?? tenantId,
          isAuthenticated: true,
        });
      }
    } catch {
      // Cookie absent or expired — user must log in
      set({ isAuthenticated: false });
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    finally {
      sessionStorage.removeItem('tenantId');
      sessionStorage.removeItem('activeModule');
      set({
        accessToken: null,
        fullAccessToken: null,
        tenantId: null,
        activeModule: null,
        isAuthenticated: false,
      });
    }
  },
}));
