import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';

export interface OrgSummary {
  orgId: string;
  orgName: string;
  orgSlug: string;
  membershipId: string;
  role: string;
  membershipType: string;
}

interface AuthState {
  accessToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Set when user belongs to multiple orgs — cleared after selectOrg */
  pendingToken: string | null;
  /** List of orgs to pick from when pendingToken is set */
  pendingOrganisations: OrgSummary[];
  hydrate: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<{
    twoFactorRequired?: boolean;
    twoFactorToken?: string;
    needsOrgSelection?: boolean;
    organisations?: OrgSummary[];
  }>;
  selectOrg: (orgId: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  socialLogin: (provider: string, body: Record<string, unknown>) => Promise<{ twoFactorRequired: boolean; twoFactorToken?: string }>;
  completeTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  switchOrg: (organizationId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  tenantId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingToken: null,
  pendingOrganisations: [],

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

      // Multi-org: server returned a pending token + org list
      if (result.pendingToken) {
        if (result.tenantId) sessionStorage.setItem('tenantId', result.tenantId);
        set({
          isLoading: false,
          pendingToken: result.pendingToken,
          pendingOrganisations: result.organisations ?? [],
          tenantId: result.tenantId ?? null,
        });
        return { needsOrgSelection: true, organisations: result.organisations };
      }

      // Single org — access token issued immediately
      const { accessToken, tenantId } = result;
      if (tenantId) sessionStorage.setItem('tenantId', tenantId);
      set({ accessToken, tenantId, isAuthenticated: true, isLoading: false, pendingToken: null, pendingOrganisations: [] });
      return { twoFactorRequired: false };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  selectOrg: async (orgId) => {
    const { pendingToken } = get();
    if (!pendingToken) throw new Error('No pending token; login first');
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.selectOrg({ pendingToken, orgId });
      const result = data.data;
      if (result.tenantId) sessionStorage.setItem('tenantId', result.tenantId);
      localStorage.setItem('organizationId', orgId);
      set({
        accessToken: result.accessToken,
        tenantId: result.tenantId,
        isAuthenticated: true,
        isLoading: false,
        pendingToken: null,
        pendingOrganisations: [],
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to select organisation';
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
      localStorage.removeItem('organizationId');
      set({ accessToken: null, tenantId: null, isAuthenticated: false, pendingToken: null, pendingOrganisations: [] });
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

  switchOrg: async (organizationId) => {
    const { data } = await authApi.switchOrganization({ organizationId });
    const result = data?.data;
    if (result?.accessToken) {
      const tenantId = result.tenantId ?? organizationId;
      if (tenantId) sessionStorage.setItem('tenantId', tenantId);
      localStorage.setItem('organizationId', organizationId);
      set({ accessToken: result.accessToken, tenantId, isAuthenticated: true });
    }
  },
}));

