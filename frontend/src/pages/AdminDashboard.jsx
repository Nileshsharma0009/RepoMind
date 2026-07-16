import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import {
  Users,
  FolderGit2,
  GitCommit,
  FileText,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    // 1. Client-side role protection
    if (user && user.role !== 'admin') {
      setError('Access Denied. You do not have administrator permissions to view this panel.');
      setLoading(false);
      return;
    }

    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setError(err.response?.data?.message || 'Failed to authenticate admin request.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAdminStats();
    }
  }, [user]);

  if (loading) {
    return (
      <MainLayout title="Admin Control Room" subtitle="Verifying authorization...">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Querying database configurations...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || (user && user.role !== 'admin')) {
    return (
      <MainLayout title="Admin Access Protected" subtitle="Privileged clearance required">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">Unauthorized Access</h3>
            <p className="text-xs text-neutral-450 mt-1.5 leading-relaxed">
              {error || 'This dashboard is restricted to administrator accounts only.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </button>
        </div>
      </MainLayout>
    );
  }

  const { summary, users, commitsLog, monthlyStats } = data || {};

  // Custom SVG Chart calculations
  const maxStat = Math.max(
    ...(monthlyStats || []).map(m => Math.max(m.repos, m.commits, m.docs, 1))
  );

  return (
    <MainLayout
      title="Admin Control Room"
      subtitle="Complete oversight of platform users, repositories, generated manuals, and GitHub transaction logs"
    >
      <div className="space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-neutral-850 flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Connected Users</p>
              <h3 className="text-2xl font-bold text-white font-display mt-0.5">{summary?.totalUsers || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-neutral-850 flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Connected Repos</p>
              <h3 className="text-2xl font-bold text-white font-display mt-0.5">{summary?.totalRepos || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-neutral-850 flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Pushed Commits</p>
              <h3 className="text-2xl font-bold text-white font-display mt-0.5">{summary?.totalCommits || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-neutral-850 flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Generated Manuals</p>
              <h3 className="text-2xl font-bold text-white font-display mt-0.5">{summary?.totalDocs || 0}</h3>
            </div>
          </div>
        </div>

        {/* Custom SVG Growth Graph Section */}
        <div className="glass-panel rounded-xl border border-neutral-850 p-5 text-left">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Monthly Growth Overview
            </h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Track sign-ups, repository connections, and documentation commits</p>
          </div>

          <div className="h-60 w-full relative flex items-end justify-between border-b border-neutral-900 pb-2">
            {/* Custom SVG Graphic */}
            <svg className="absolute inset-0 w-full h-full" overflow="visible">
              <g stroke="#1f1f1f" strokeWidth="1" strokeDasharray="4 4">
                <line x1="0" y1="25%" x2="100%" y2="25%" />
                <line x1="0" y1="50%" x2="100%" y2="50%" />
                <line x1="0" y1="75%" x2="100%" y2="75%" />
              </g>
            </svg>

            {monthlyStats?.map((m, idx) => {
              const rHeight = `${(m.repos / maxStat) * 80}%`;
              const cHeight = `${(m.commits / maxStat) * 80}%`;
              const dHeight = `${(m.docs / maxStat) * 80}%`;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative z-10">
                  <div className="h-44 w-full flex items-end justify-center gap-1.5 px-2">
                    {/* Repos bar */}
                    <div
                      className="w-2.5 rounded-t bg-blue-500/80 hover:bg-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all"
                      style={{ height: rHeight }}
                      title={`Repos Connected: ${m.repos}`}
                    />
                    {/* Commits bar */}
                    <div
                      className="w-2.5 rounded-t bg-purple-500/80 hover:bg-purple-400 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all"
                      style={{ height: cHeight }}
                      title={`Commits Pushed: ${m.commits}`}
                    />
                    {/* Docs bar */}
                    <div
                      className="w-2.5 rounded-t bg-emerald-500/80 hover:bg-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                      style={{ height: dHeight }}
                      title={`Docs Created: ${m.docs}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-[9px] font-mono tracking-wider uppercase text-neutral-450 justify-end">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500" /> Repos</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500" /> Commits</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /> Documents</span>
          </div>
        </div>

        {/* Users & Log Double Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* User List Panel */}
          <div className="xl:col-span-2 glass-panel rounded-xl border border-neutral-850 p-5 flex flex-col h-full text-left">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Registered Users ({users?.length || 0})
              </h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">Active accounts connected via GitHub OAuth credentials</p>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 text-[10px] uppercase font-mono tracking-wider">
                    <th className="py-2.5 font-normal">GitHub Identity</th>
                    <th className="py-2.5 font-normal">Privilege</th>
                    <th className="py-2.5 font-normal text-center">Repos</th>
                    <th className="py-2.5 font-normal text-center">Commits</th>
                    <th className="py-2.5 font-normal text-center">Documents</th>
                    <th className="py-2.5 font-normal text-right">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/50">
                  {users?.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-900/20 transition-colors">
                      <td className="py-3 pr-4 flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.username} className="w-7 h-7 rounded-full border border-neutral-800" />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[120px]">{u.displayName}</p>
                          <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[120px]">@{u.username}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-amber-950 text-amber-400 border border-amber-900/30' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-center text-neutral-300 font-mono font-semibold">{u.reposCount}</td>
                      <td className="py-3 text-center text-neutral-300 font-mono font-semibold">{u.commitsCount}</td>
                      <td className="py-3 text-center text-neutral-300 font-mono font-semibold">{u.docsCount}</td>
                      <td className="py-3 text-right text-neutral-500 font-mono text-[10px]">
                        {new Date(u.lastLoginAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commits Logs panel */}
          <div className="xl:col-span-1 glass-panel rounded-xl border border-neutral-850 p-5 flex flex-col h-full text-left">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                Live Commits Log ({commitsLog?.length || 0})
              </h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">Platform Git pushes transmitted through RepoMind API</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3.5 pr-1.5">
              {commitsLog?.length === 0 ? (
                <div className="text-center py-12">
                  <GitCommit className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-semibold">No commits logged</p>
                </div>
              ) : (
                commitsLog?.map((commit) => (
                  <div key={commit._id} className="p-3 bg-neutral-900/10 border border-neutral-900 rounded-lg flex flex-col gap-2 hover:border-neutral-850 transition-colors">
                    <div className="flex items-center gap-2">
                      <img src={commit.userId?.avatar} alt={commit.userId?.username} className="w-5 h-5 rounded-full border border-neutral-800" />
                      <span className="text-[10px] text-neutral-300 font-mono font-semibold">@{commit.userId?.username}</span>
                      <span className="text-[9px] text-neutral-500 ml-auto font-mono">{new Date(commit.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                      {commit.commitMessage}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 border-t border-neutral-900/60 pt-2">
                      <span className="truncate max-w-[120px] text-primary" title={commit.repositoryId?.fullName}>
                        {commit.repositoryId?.name}
                      </span>
                      <a
                        href={`https://github.com/${commit.repositoryId?.fullName}/commit/${commit.commitSha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-neutral-500 hover:text-purple-400 transition-colors"
                      >
                        <span>{commit.commitSha?.slice(0, 7)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
