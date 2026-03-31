import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId');
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const notificationsApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  batchMarkRead: (ids: string[]) => api.post('/notifications/read-batch', { ids }),
};
