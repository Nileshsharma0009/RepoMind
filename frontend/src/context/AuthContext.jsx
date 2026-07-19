import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('repomind_theme') || 'purple');

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
    const root = document.documentElement;
    root.classList.remove('theme-purple', 'theme-emerald', 'theme-cyberpunk', 'theme-ocean', 'theme-crimson');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('repomind_theme', newTheme);
  };

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
    // Clean up local storage items
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('repomind_chat_') ||
        key.startsWith('repomind_doc_') ||
        key === 'repomind_active_repo' ||
        key === 'repomind_active_repo_details' ||
        key === 'repomind_github_repos'
      ) {
        localStorage.removeItem(key);
      }
    });
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
        theme,
        changeTheme,
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
