import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const topicsAPI = {
  getAll: () => api.get('/topics'),
  getById: (id: string) => api.get(`/topics/${id}`),
  getComments: (id: string, limit = 100, offset = 0) => 
    api.get(`/topics/${id}/comments`, { params: { limit, offset } }),
};

export const commentsAPI = {
  create: (data: any) => api.post('/comments', data),
  aiAssist: (data: any) => api.post('/comments/ai-assist', data),
};

export const authAPI = {
  callback: (code: string) => api.post('/auth/secondme/callback', { code }),
  getMe: () => api.get('/auth/me'),
};
