import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import ComingSoon from './components/Common/ComingSoon.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repositories"
            element={
              <ProtectedRoute>
                <ComingSoon title="Repositories" subtitle="Manage and explore your GitHub repositories" phase="Phase 2" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ComingSoon title="AI Chat" subtitle="Ask questions about your codebase" phase="Phase 3" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documentation"
            element={
              <ProtectedRoute>
                <ComingSoon title="Documentation" subtitle="Auto-generated project documentation" phase="Phase 4" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/architecture"
            element={
              <ProtectedRoute>
                <ComingSoon title="Architecture" subtitle="Visual diagrams and flow charts" phase="Phase 5" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-manager"
            element={
              <ProtectedRoute>
                <ComingSoon title="Project Manager" subtitle="Issues, PRs, and sprint planning" phase="Phase 6" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <ComingSoon title="Search" subtitle="Semantic code search across repos" phase="Phase 3" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
