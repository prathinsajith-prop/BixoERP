import axios from 'axios';
import { useAuthStore } from '../../store/auth';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const tenantId = sessionStorage.getItem('tenantId');
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const filesApi = {
  download: async (fileId: string) => {
    const response = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};
