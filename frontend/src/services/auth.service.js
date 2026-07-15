import api from './api.js';

export const getAuthStatus = () => api.get('/auth/status');

export const getMe = () => api.get('/auth/me');

export const logout = () => api.post('/auth/logout');

export const getGitHubLoginUrl = () => {
  window.location.href = '/api/auth/github';
};
