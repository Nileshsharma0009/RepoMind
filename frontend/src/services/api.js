import axios from 'axios';

// Create custom axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor to inject JWT authentication token on request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to inject a beautiful glassmorphic rate limit toast
const showRateLimitToast = (retryAfter) => {
  let container = document.getElementById('rate-limit-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'rate-limit-toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '99999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.background = 'rgba(15, 15, 20, 0.9)';
  toast.style.backdropFilter = 'blur(12px)';
  toast.style.webkitBackdropFilter = 'blur(12px)';
  toast.style.border = '1px solid rgba(239, 68, 68, 0.4)';
  toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(239, 68, 68, 0.15)';
  toast.style.borderRadius = '12px';
  toast.style.padding = '16px 20px';
  toast.style.color = '#fff';
  toast.style.width = '360px';
  toast.style.fontFamily = 'Inter, system-ui, sans-serif';
  toast.style.fontSize = '12px';
  toast.style.lineHeight = '1.6';
  toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  toast.style.display = 'flex';
  toast.style.flexDirection = 'column';
  toast.style.gap = '8px';

  if (!document.getElementById('rate-limit-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'rate-limit-toast-styles';
    style.innerHTML = `
      @keyframes toastSlideIn {
        from { transform: translateY(20px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes toastFadeOut {
        to { transform: scale(0.95); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">⚠️</span>
      <strong style="color: #ef4444; font-weight: 700; font-size: 13px;">Gemini API Rate Limit Reached</strong>
    </div>
    <div style="color: #d4d4d8;">
      You have exceeded the Gemini free-tier rate limits.
      <br/>
      <span style="font-size: 11px; opacity: 0.85;">(Free-tier is limited to 5 requests per minute / 15 RPM).</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 6px;">
      <span style="font-family: monospace; color: #a1a1aa;">Retry after: <span style="color: #fca5a5; font-weight: bold;">${retryAfter}s</span></span>
      <button style="background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 11px; padding: 2px 6px; border-radius: 4px;" onclick="this.parentElement.parentElement.remove()">Dismiss</button>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 8000);
};

// Interceptor to handle global response errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Session expiration handling
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/auth/callback')) {
        window.location.href = '/login';
      }
    }

    // Rate limit popup handler
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.data?.retryAfter || 60;
      showRateLimitToast(retryAfter);
    }

    return Promise.reject(error);
  }
);

export default api;
