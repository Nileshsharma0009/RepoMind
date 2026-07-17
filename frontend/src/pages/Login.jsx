import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Github, Brain, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

import logo from '../assets/logos/logo1.png';

export default function Login() {
  const { loginWithGitHub, oauthConfigured, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const errorMessages = {
    oauth_not_configured: 'GitHub OAuth is not configured. Add your credentials to backend/.env',
    auth_failed: 'Authentication failed. Please try again.',
    missing_code: 'GitHub did not return an authorization code.',
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="glow-spot top-1/3 left-1/3" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-350 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="glass-panel rounded-2xl p-8 shadow-glass-glow">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-neutral-950 border border-neutral-900 mb-4 shadow-glass-glow">
              <img src={logo} alt="RepoMind Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white">Welcome to RepoMind</h1>
            <p className="text-sm text-neutral-400 mt-2">
              Sign in with GitHub to access your engineering memory dashboard
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                {errorMessages[error] || decodeURIComponent(error)}
              </p>
            </div>
          )}

          {!oauthConfigured && (
            <div className="flex items-start gap-3 p-4 mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-300">
                <p className="font-medium">GitHub OAuth not configured</p>
                <p className="text-amber-400/80 mt-1 text-xs">
                  Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend/.env
                </p>
              </div>
            </div>
          )}

          <button
            onClick={loginWithGitHub}
            disabled={!oauthConfigured}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-700 hover:border-neutral-600 text-white rounded-xl font-medium transition-all"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <p className="text-center text-xs text-neutral-600 mt-6">
            By signing in, you agree to connect your GitHub account securely via OAuth.
          </p>
        </div>
      </div>
    </div>
  );
}
