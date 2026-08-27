import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (data) => api.post('/chat', data),
  getConversations: () => api.get('/conversations'),
  getConversation: (id) => api.get(`/conversations/${id}`),
  exportConversation: (id) => api.post(`/conversations/${id}/export`, {}, { responseType: 'blob' }),
  submitFeedback: (messageId, data) => api.post(`/messages/${messageId}/feedback`, data),
  getSuggestedQuestions: () => api.get('/suggested-questions'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  // Documents
  uploadDocument: (formData) =>
    api.post('/admin/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDocuments: (params) => api.get('/admin/documents', { params }),
  retryDocument: (id) => api.post(`/admin/documents/${id}/retry`),
  deleteDocument: (id) => api.delete(`/admin/documents/${id}`),
  replaceDocument: (id, formData) =>
    api.put(`/admin/documents/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Collections
  getCollections: () => api.get('/admin/collections'),
  createCollection: (data) => api.post('/admin/collections', data),
  updateCollection: (id, data) => api.put(`/admin/collections/${id}`, data),
  deleteCollection: (id) => api.delete(`/admin/collections/${id}`),

  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),
};

export default api;
