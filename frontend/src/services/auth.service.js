import api from './api.js';

export const getAuthStatus = () => api.get('/auth/status');

export const getMe = () => api.get('/auth/me');

export const logout = () => api.post('/auth/logout');

export const getGitHubLoginUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  window.location.href = `${baseUrl}/auth/github`;
};
