import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/auth',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId');
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const refreshClient = axios.create({
  baseURL: '/api/v1/auth',
  headers: { 'Content-Type': 'application/json' },
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await refreshClient.post('/refresh', { refreshToken });
        const newAccessToken = data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        refreshQueue.forEach((p) => p.resolve(newAccessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshQueue.forEach((p) => p.reject(error));
        refreshQueue = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
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
  logout: (refreshToken: string) => api.post('/logout', { refreshToken }),
  getProfile: () => api.get('/profile'),
  myOrganizations: () => api.get('/organizations/me/list'),
  switchOrganization: (body: { organizationId: string }) => api.post('/organizations/switch', body),
  scopeToken: (body: { module: string }) => api.post<{ data: { accessToken: string; module: string; permissions: string[] } }>('/scope-token', body),
};
