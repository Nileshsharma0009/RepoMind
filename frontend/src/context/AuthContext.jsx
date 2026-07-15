import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(false);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authService.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    authService.getAuthStatus()
      .then((res) => setOauthConfigured(res.data.githubOAuthConfigured))
      .catch(() => setOauthConfigured(false));

    fetchUser();
  }, [fetchUser]);

  const loginWithGitHub = () => {
    authService.getGitHubLoginUrl();
  };

  const handleAuthCallback = (token) => {
    localStorage.setItem('token', token);
    return fetchUser();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Token may already be invalid
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        oauthConfigured,
        isAuthenticated: !!user,
        loginWithGitHub,
        handleAuthCallback,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
