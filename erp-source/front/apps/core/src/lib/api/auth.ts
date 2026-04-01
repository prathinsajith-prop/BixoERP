import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
  baseURL: '/api/v1/auth',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const tenantId = sessionStorage.getItem('tenantId');
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const refreshClient = axios.create({
  baseURL: '/api/v1/auth',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (original.url === '/refresh' || original._retry) return Promise.reject(error);

    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await refreshClient.post('/refresh');
        const newAccessToken = data.data.accessToken;
        useAuthStore.setState({ accessToken: newAccessToken, isAuthenticated: true });
        refreshQueue.forEach((p) => p.resolve(newAccessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshQueue.forEach((p) => p.reject(error));
        refreshQueue = [];
        useAuthStore.setState({ accessToken: null, isAuthenticated: false });
        sessionStorage.removeItem('tenantId');
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);


export const authApi = {
  login: (body: { email: string; password: string }) => api.post('/login', body),
  register: (body: { email: string; password: string; firstName: string; lastName: string }) => api.post('/register', body),
  logout: () => api.post('/logout'),
  silentRefresh: () => refreshClient.post('/refresh'),
  changePassword: (body: { currentPassword: string; newPassword: string }) => api.post('/change-password', body),
  getProfile: () => api.get('/profile'),
  updateProfile: (body: Record<string, unknown>) => api.put('/profile', body),
  getSettings: () => api.get('/settings'),
  updateSettings: (body: Record<string, unknown>) => api.put('/settings', body),
  resetSettings: () => api.post('/settings/reset'),
  twoFactorStatus: () => api.get('/2fa/status'),
  twoFactorSetup: () => api.post('/2fa/setup'),
  twoFactorVerifySetup: (body: { code: string }) => api.post('/2fa/verify-setup', body),
  twoFactorValidate: (body: { twoFactorToken: string; code: string }) => api.post('/2fa/validate', body),
  twoFactorDisable: (body: { code: string }) => api.post('/2fa/disable', body),
  twoFactorRegenerateCodes: (body: { code: string }) => api.post('/2fa/regenerate-codes', body),
  passwordResetRequest: (body: { email: string }) => api.post('/password-reset/request', body),
  passwordResetConfirm: (body: { token: string; password: string }) => api.post('/password-reset/confirm', body),
  socialLogin: (provider: string, body: Record<string, unknown>) => api.post(`/social/${provider}`, body),
  listLinkedAccounts: () => api.get('/social/accounts'),
  unlinkSocialAccount: (provider: string) => api.delete(`/social/${provider}`),
  listUsers: (params?: Record<string, unknown>) => api.get('/users', { params }),
  getUser: (userId: string) => api.get(`/users/${userId}`),
  assignRoleToUser: (userId: string, roleId: string) => api.post(`/users/${userId}/roles/${roleId}`),
  removeRoleFromUser: (userId: string, roleId: string) => api.delete(`/users/${userId}/roles/${roleId}`),
  listRoles: () => api.get('/roles'),
  createRole: (body: Record<string, unknown>) => api.post('/roles', body),
  updateRole: (roleId: string, body: Record<string, unknown>) => api.put(`/roles/${roleId}`, body),
  deleteRole: (roleId: string) => api.delete(`/roles/${roleId}`),
  listPermissions: () => api.get('/permissions'),
  createPermission: (body: Record<string, unknown>) => api.post('/permissions', body),
  deletePermission: (permissionId: string) => api.delete(`/permissions/${permissionId}`),
  createOrganization: (body: Record<string, unknown>) => api.post('/organizations', body),
  listOrganizations: (params?: Record<string, unknown>) => api.get('/organizations', { params }),
  getOrganization: (orgId: string) => api.get(`/organizations/${orgId}`),
  updateOrganization: (orgId: string, body: Record<string, unknown>) => api.put(`/organizations/${orgId}`, body),
  addMemberToOrganization: (orgId: string, body: Record<string, unknown>) => api.post(`/organizations/${orgId}/members`, body),
  listOrganizationMembers: (orgId: string) => api.get(`/organizations/${orgId}/members`),
  removeMemberFromOrganization: (orgId: string, userId: string) => api.delete(`/organizations/${orgId}/members/${userId}`),
  updateMemberRole: (orgId: string, userId: string, body: Record<string, unknown>) => api.put(`/organizations/${orgId}/members/${userId}`, body),
  deleteOrganization: (orgId: string) => api.delete(`/organizations/${orgId}`),
  transferOwnership: (orgId: string, body: Record<string, unknown>) => api.post(`/organizations/${orgId}/transfer`, body),
  getOrganizationSettings: (orgId: string) => api.get(`/organizations/${orgId}/settings`),
  updateOrganizationSettings: (orgId: string, body: Record<string, unknown>) => api.put(`/organizations/${orgId}/settings`, body),
  getOrganizationBranding: (orgId: string) => api.get(`/organizations/${orgId}/branding`),
  updateOrganizationBranding: (orgId: string, body: Record<string, unknown>) => api.put(`/organizations/${orgId}/branding`, body),
  uploadOrganizationLogo: (orgId: string, formData: FormData) => api.post(`/organizations/${orgId}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getOrgStructure: (orgId: string) => api.get(`/org-structure/${orgId}`),
  listDivisions: (orgId: string) => api.get(`/org-structure/${orgId}/divisions`),
  createDivision: (orgId: string, body: Record<string, unknown>) => api.post(`/org-structure/${orgId}/divisions`, body),
  updateDivision: (orgId: string, divId: string, body: Record<string, unknown>) => api.put(`/org-structure/${orgId}/divisions/${divId}`, body),
  getDivision: (orgId: string, divId: string) => api.get(`/org-structure/${orgId}/divisions/${divId}`),
  deleteDivision: (orgId: string, divId: string) => api.delete(`/org-structure/${orgId}/divisions/${divId}`),
  listDepartments: (orgId: string) => api.get(`/org-structure/${orgId}/departments`),
  createDepartment: (orgId: string, body: Record<string, unknown>) => api.post(`/org-structure/${orgId}/departments`, body),
  updateDepartment: (orgId: string, deptId: string, body: Record<string, unknown>) => api.put(`/org-structure/${orgId}/departments/${deptId}`, body),
  getDepartment: (orgId: string, deptId: string) => api.get(`/org-structure/${orgId}/departments/${deptId}`),
  deleteDepartment: (orgId: string, deptId: string) => api.delete(`/org-structure/${orgId}/departments/${deptId}`),
  listTeams: (orgId: string, departmentId?: string) => api.get(`/org-structure/${orgId}/teams`, { params: departmentId ? { departmentId } : {} }),
  createTeam: (orgId: string, body: Record<string, unknown>) => api.post(`/org-structure/${orgId}/teams`, body),
  updateTeam: (orgId: string, teamId: string, body: Record<string, unknown>) => api.put(`/org-structure/${orgId}/teams/${teamId}`, body),
  getTeam: (orgId: string, teamId: string) => api.get(`/org-structure/${orgId}/teams/${teamId}`),
  deleteTeam: (orgId: string, teamId: string) => api.delete(`/org-structure/${orgId}/teams/${teamId}`),
  listManagers: (orgId: string, entityType: string, entityId: string) => api.get(`/org-structure/${orgId}/${entityType}/${entityId}/managers`),
  assignManager: (orgId: string, entityType: string, entityId: string, body: Record<string, unknown>) => api.post(`/org-structure/${orgId}/${entityType}/${entityId}/managers`, body),
  unassignManager: (orgId: string, entityType: string, entityId: string, assignmentId: string) => api.delete(`/org-structure/${orgId}/${entityType}/${entityId}/managers/${assignmentId}`),
  getManagerSettings: (orgId: string, userId: string, params?: Record<string, unknown>) => api.get(`/org-structure/${orgId}/manager-settings/${userId}`, { params }),
  updateManagerSettings: (orgId: string, userId: string, body: Record<string, unknown>) => api.put(`/org-structure/${orgId}/manager-settings/${userId}`, body),
  sendInvitation: (orgId: string, body: Record<string, unknown>) => api.post(`/organizations/${orgId}/invitations`, body),
  listInvitations: (orgId: string) => api.get(`/organizations/${orgId}/invitations`),
  cancelInvitation: (orgId: string, invitationId: string) => api.delete(`/organizations/${orgId}/invitations/${invitationId}`),
  resendInvitation: (orgId: string, invitationId: string) => api.post(`/organizations/${orgId}/invitations/${invitationId}/resend`),
  getAuditLog: (orgId: string, params?: Record<string, unknown>) => api.get(`/organizations/${orgId}/audit-log`, { params }),
  myOrganizations: () => api.get('/organizations/me/list'),
  switchOrganization: (body: { organizationId: string }) => api.post('/organizations/switch', body),
  scopeToken: (body: { module: string }) => api.post('/scope-token', body),
  healthCheck: () => axios.get('/health'),
};
