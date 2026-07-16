import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import api from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  GitBranch,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FolderGit2,
  Lock,
  Globe,
  Star,
} from 'lucide-react';

export default function Repositories() {
  const {
    connectedRepos,
    loading: connectedLoading,
    connectRepo,
    disconnectRepo,
    syncRepo,
    selectRepo,
    activeRepoId,
  } = useRepository();

  const [githubRepos, setGithubRepos] = useState([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState(null);
  const [disconnectingRepo, setDisconnectingRepo] = useState(null);

  // Fetch repos from GitHub via our backend endpoint
  const fetchGithubRepos = async () => {
    setGithubLoading(true);
    setGithubError('');
    try {
      const { data } = await api.get('/github/repos');
      setGithubRepos(data.repos || []);
    } catch (err) {
      console.error('Error fetching github repos:', err);
      setGithubError(err.response?.data?.message || 'Failed to fetch repositories from GitHub.');
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    fetchGithubRepos();
  }, []);

  const handleConnect = async (repo) => {
    setConnectingId(repo.githubId);
    try {
      await connectRepo(repo);
    } catch (err) {
      alert('Failed to connect repository: ' + (err.response?.data?.message || err.message));
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = (id, name) => {
    setDisconnectingRepo({ id, name });
  };

  const handleSync = async (id) => {
    try {
      await syncRepo(id);
    } catch (err) {
      alert('Failed to sync repository: ' + err.message);
    }
  };

  // Filter available GitHub repos: exclude ones already connected
  const connectedGithubIds = new Set(connectedRepos.map((r) => r.githubId));
  const availableRepos = githubRepos
    .filter((repo) => !connectedGithubIds.has(repo.githubId))
    .filter(
      (repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <MainLayout
      title="Repositories"
      subtitle="Connect and index your GitHub codebases into AI memory"
    >
      <div className="space-y-8 max-w-6xl">
        {/* Connected Repositories Section */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-primary" />
            Connected Repositories ({connectedRepos.length})
          </h3>

          {connectedLoading ? (
            <div className="flex items-center justify-center p-8 bg-neutral-900/30 border border-neutral-800/40 rounded-xl">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : connectedRepos.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/30 border border-neutral-800/40 rounded-xl">
              <p className="text-sm text-neutral-400">No repositories connected yet.</p>
              <p className="text-xs text-neutral-600 mt-1">Connect one from the list below to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {connectedRepos.map((repo) => {
                const isActive = activeRepoId === repo._id;
                return (
                  <div
                    key={repo._id}
                    className={`glass-panel rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${
                      isActive ? 'border-primary/40 ring-1 ring-primary/20 shadow-theme-glow bg-primary/5' : 'hover:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm truncate block">
                            {repo.fullName}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-primary/20 text-primary border border-primary/25 font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 min-h-[2rem]">
                          {repo.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => handleSync(repo._id)}
                          disabled={repo.status === 'indexing'}
                          title="Sync Repository"
                          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${repo.status === 'indexing' ? 'animate-spin text-primary' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDisconnect(repo._id, repo.fullName)}
                          title="Disconnect Repository"
                          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-500/5 hover:border-red-950 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-800/40 flex items-center justify-between text-xs text-neutral-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3.5 h-3.5" />
                          {repo.defaultBranch}
                        </span>
                        {repo.status === 'indexed' && (
                          <span>{repo.fileCount} files indexed</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusIndicator status={repo.status} err={repo.errorMessage} />
                      </div>
                    </div>

                    {/* Quick Selection Hotspot */}
                    {!isActive && repo.status === 'indexed' && (
                      <button
                        onClick={() => selectRepo(repo._id)}
                        className="absolute inset-x-0 bottom-0 py-1.5 bg-neutral-900/60 hover:bg-primary/10 text-[10px] text-center text-neutral-400 hover:text-primary transition-all border-t border-neutral-800/20 uppercase tracking-wider font-semibold"
                      >
                        Set Active Repository
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Connect New Repositories Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-neutral-400" />
              Available GitHub Repositories
            </h3>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-neutral-300 placeholder-neutral-600 outline-none w-48"
                />
              </div>

              <button
                onClick={fetchGithubRepos}
                disabled={githubLoading}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-colors text-neutral-400 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${githubLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {githubLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/30 border border-neutral-800/40 rounded-xl space-y-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs text-neutral-500 font-mono">Fetching repos from GitHub API...</p>
            </div>
          ) : githubError ? (
            <div className="p-8 text-center bg-red-950/5 border border-red-950 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-neutral-300 font-semibold">Error Loading Repositories</p>
              <p className="text-xs text-neutral-500 mt-1">{githubError}</p>
              <button
                onClick={fetchGithubRepos}
                className="mt-3 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 border border-neutral-850 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : availableRepos.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/30 border border-neutral-800/40 rounded-xl">
              <p className="text-sm text-neutral-400">No available repositories found.</p>
              <p className="text-xs text-neutral-600 mt-1">Make sure you have public repos or check search query filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableRepos.map((repo) => (
                <div
                  key={repo.githubId}
                  className="p-4 bg-neutral-900/40 border border-neutral-800/40 hover:border-neutral-800 rounded-xl flex items-start justify-between gap-4 transition-all duration-300"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {repo.isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      )}
                      <span className="font-medium text-neutral-200 text-sm truncate">
                        {repo.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-0.5 block font-mono">
                      {repo.owner}
                    </span>
                    <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                      {repo.description || 'No description.'}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-neutral-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stars}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <GitBranch className="w-3 h-3" />
                        {repo.defaultBranch}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => handleConnect(repo)}
                      disabled={connectingId !== null}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-850 hover:bg-primary hover:text-white border border-neutral-800 hover:border-primary/20 text-neutral-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {connectingId === repo.githubId ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Connecting
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {disconnectingRepo && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border border-neutral-850 rounded-2xl w-full max-w-md overflow-hidden shadow-theme-glow text-left flex flex-col relative"
            >
              {/* Top alert line */}
              <div className="h-1.5 w-full bg-red-500" />
              
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-955/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">Disconnect Repository?</h3>
                    <p className="text-[10px] text-neutral-450 mt-1 leading-normal">
                      This action will wipe all parsed indexing schemas from our memory database.
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-900/60 p-3.5 rounded-xl text-xs leading-relaxed text-neutral-350 font-sans">
                  Are you sure you want to disconnect <span className="font-semibold text-white">{disconnectingRepo.name}</span>? This will remove all parsed data and indexing memory.
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setDisconnectingRepo(null)}
                    className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-neutral-400 hover:text-white rounded-lg text-xs transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const { id } = disconnectingRepo;
                      setDisconnectingRepo(null);
                      try {
                        await disconnectRepo(id);
                      } catch (err) {
                        alert('Failed to disconnect repository: ' + err.message);
                      }
                    }}
                    className="px-4 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded-lg text-xs transition-all font-semibold shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

function StatusIndicator({ status, err }) {
  switch (status) {
    case 'connected':
      return (
        <span className="flex items-center gap-1 text-sky-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Queueing
        </span>
      );
    case 'indexing':
      return (
        <span className="flex items-center gap-1 text-primary">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Indexing...
        </span>
      );
    case 'indexed':
      return (
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Indexed
        </span>
      );
    case 'failed':
      return (
        <span
          className="flex items-center gap-1 text-red-400 cursor-pointer font-medium"
          title={err || 'Unknown indexing error occurred.'}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          Failed
        </span>
      );
    default:
      return <span>Unknown</span>;
  }
}
