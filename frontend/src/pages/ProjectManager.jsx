import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import api from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Loader2,
  FileCode,
} from 'lucide-react';

export default function ProjectManager() {
  const { activeRepo, activeRepoLoading } = useRepository();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'commits' | 'issues'
  const [todos, setTodos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [platformCommits, setPlatformCommits] = useState([]);
  const [commitSource, setCommitSource] = useState('all'); // 'all' | 'platform'
  const [issues, setIssues] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch commits and issues info
  const fetchGitData = async () => {
    if (!activeRepo) return;
    try {
      const { data } = await api.get(`/pm/${activeRepo._id}/git`);
      setCommits(data.commits || []);
      setIssues(data.issues || []);
    } catch (err) {
      console.warn('Failed to load git stats:', err);
    }
    try {
      const { data } = await api.get(`/repositories/${activeRepo._id}/commits/platform`);
      setPlatformCommits(data.commits || []);
    } catch (err) {
      console.warn('Failed to load platform commits:', err);
    }
  };

  // Fetch harvested codebase TODOs
  const fetchTodos = async () => {
    if (!activeRepo) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/pm/${activeRepo._id}/todos`);
      setTodos(data.todos || []);
    } catch (err) {
      console.error('Failed to load codebase tasks:', err);
      setError('Failed to crawl project files for TODO indicators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRepo) {
      fetchTodos();
      fetchGitData();
    }
  }, [activeRepo]);

  const handleOpenCode = (filePath, line) => {
    // Navigate to Chat page with search parameters to auto-open Monaco editor file and highlight line
    navigate(`/chat?open=${encodeURIComponent(filePath)}&line=${line}`);
  };

  // Split issues into standard issues and pull requests
  const githubIssues = issues.filter((i) => !i.isPullRequest);
  const pullRequests = issues.filter((i) => i.isPullRequest);

  // Statistics
  const fixmeCount = todos.filter((t) => t.type === 'FIXME').length;
  const todoCount = todos.filter((t) => t.type === 'TODO').length;

  return (
    <MainLayout
      title="Project Manager Agent"
      subtitle={
        activeRepo
          ? `Sprint analysis & task allocations for ${activeRepo.fullName}`
          : 'Index repositories to parse backlog tasks and analyze development velocity'
      }
    >
      {activeRepoLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl space-y-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Assembling sprint backlog...</p>
        </div>
      ) : !activeRepo ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <ListTodo className="w-10 h-10 text-neutral-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">No Active Repository</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Please connect and set an active repository in the Repositories panel first to begin sprint tracking sessions.
          </p>
        </div>
      ) : activeRepo.status !== 'indexed' ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 animate-pulse mb-3">
            <ListTodo className="w-4.5 h-4.5 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Backlog Crawl in Progress</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Wait for indexation to resolve to complete. Current status: **{activeRepo.status}**.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Actionable FIXME tasks"
              value={fixmeCount}
              desc="High priority alerts"
              color="border-red-500/20 text-red-400"
            />
            <MetricCard
              label="Backlog TODO items"
              value={todoCount}
              desc="Code comment tags"
              color="border-purple-500/20 text-purple-400"
            />
            <MetricCard
              label="GitHub Issue Backlog"
              value={githubIssues.filter((i) => i.state === 'open').length}
              desc="Open public reports"
              color="border-emerald-500/20 text-emerald-400"
            />
            <MetricCard
              label="Recent Branch Pull Requests"
              value={pullRequests.length}
              desc="Merged or open pull requests"
              color="border-sky-500/20 text-sky-400"
            />
          </div>

          {/* Toggle Panel Tabs */}
          <div className="flex border-b border-neutral-900 gap-1.5 pb-px">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'todos'
                  ? 'border-primary text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-350'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Sprint Tasks / TODOs ({todos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('commits')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'commits'
                  ? 'border-primary text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-350'
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>Commits History ({commits.length + platformCommits.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'issues'
                  ? 'border-primary text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-350'
              }`}
            >
              <GitPullRequest className="w-4 h-4" />
              <span>Issues & PRs ({issues.length})</span>
            </button>
          </div>

          {/* Board Views */}
          <div className="min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-xs text-neutral-600 font-mono mt-2">Crawling file lines for TODO comments...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-xs text-red-400 rounded-xl">
                {error}
              </div>
            ) : activeTab === 'todos' ? (
              /* TODO tasks board */
              todos.length === 0 ? (
                <div className="text-center py-10 bg-neutral-900/5 border border-neutral-900 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-400">Codebase is clean</p>
                  <p className="text-[10px] text-neutral-600 mt-1">No TODO/FIXME lines detected in text source blocks.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todos.map((todo, i) => {
                    const isHigh = todo.priority === 'High';
                    return (
                      <div
                        key={i}
                        className={`p-4 bg-neutral-950/30 border rounded-xl flex flex-col justify-between hover:border-neutral-800 transition-colors ${
                          isHigh ? 'border-red-950/40' : 'border-neutral-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              isHigh ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-purple-950 text-purple-400 border border-purple-900/30'
                            }`}>
                              {todo.type}
                            </span>
                            <span className="text-[9px] text-neutral-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-600" />
                              Estimated: {isHigh ? '2h' : '4h'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 font-medium leading-relaxed mb-3">
                            {todo.text}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-neutral-900/50 flex items-center justify-between gap-4">
                          <span className="text-[10px] text-neutral-500 font-mono truncate flex items-center gap-1.5 max-w-[70%]">
                            <FileCode className="w-3.5 h-3.5 text-neutral-650 shrink-0" />
                            <span className="truncate" title={todo.filePath}>{todo.fileName} : L{todo.line}</span>
                          </span>
                          <button
                            onClick={() => handleOpenCode(todo.filePath, todo.line)}
                            className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <span>Open Code</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeTab === 'commits' ? (
              /* Commits Timeline */
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-neutral-950/40 border border-neutral-850 rounded-xl max-w-sm">
                  <button
                    onClick={() => setCommitSource('all')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold transition-all ${
                      commitSource === 'all'
                        ? 'bg-neutral-900 text-white shadow-theme-glow'
                        : 'text-neutral-500 hover:text-neutral-350'
                    }`}
                  >
                    Repository Branch ({commits.length})
                  </button>
                  <button
                    onClick={() => setCommitSource('platform')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${
                      commitSource === 'platform'
                        ? 'bg-neutral-900 text-white shadow-theme-glow'
                        : 'text-neutral-500 hover:text-neutral-350'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>RepoMind Commits ({platformCommits.length})</span>
                  </button>
                </div>

                {commitSource === 'all' ? (
                  commits.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-900/5 border border-neutral-900 rounded-xl">
                      <GitCommit className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-neutral-400">No Commit History Available</p>
                      <p className="text-[10px] text-neutral-600 mt-1">Unable to crawl branch logs from GitHub API.</p>
                    </div>
                  ) : (
                    <div className="glass-panel rounded-xl border border-neutral-850 p-4 space-y-4">
                      {commits.map((commit, i) => (
                        <div key={commit.sha} className="flex gap-4 items-start last:border-b-0 pb-4 border-b border-neutral-900 last:pb-0">
                          {/* Avatar */}
                          <img
                            src={commit.avatar || 'https://github.com/identicons/dummy.png'}
                            alt={commit.author}
                            className="w-8 h-8 rounded-full border border-neutral-800 shrink-0 mt-0.5"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate max-w-[200px]">
                                {commit.author}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {new Date(commit.date).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-350 mt-1 leading-relaxed">
                              {commit.message}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-mono text-purple-400">
                                {commit.sha}
                              </span>
                              <a
                                href={commit.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-neutral-500 hover:text-primary hover:underline font-semibold"
                              >
                                Inspect commit on GitHub
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  platformCommits.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-900/5 border border-neutral-900 rounded-xl">
                      <GitCommit className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-neutral-400">No Platform Commits Found</p>
                      <p className="text-[10px] text-neutral-600 mt-1">Documentation commits submitted from the platform will show here.</p>
                    </div>
                  ) : (
                    <div className="glass-panel rounded-xl border border-neutral-850 p-4 space-y-4">
                      {platformCommits.map((commit) => (
                        <div key={commit._id} className="flex gap-4 items-start last:border-b-0 pb-4 border-b border-neutral-900 last:pb-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate max-w-[200px]">
                                {commit.userId?.username || 'RepoMind User'}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {new Date(commit.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-350 mt-1 leading-relaxed">
                              {commit.commitMessage}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-mono text-purple-400">
                                {commit.commitSha?.slice(0, 7) || 'unknown'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-900 text-[9px] font-mono text-neutral-450">
                                branch: {commit.branch}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-900 text-[9px] font-mono text-emerald-500/80">
                                file: {commit.filePath}
                              </span>
                              {commit.commitSha && commit.commitSha !== 'unknown' && (
                                <a
                                  href={`https://github.com/${activeRepo.owner}/${activeRepo.name}/commit/${commit.commitSha}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] text-neutral-500 hover:text-primary hover:underline font-semibold ml-auto"
                                >
                                  Inspect commit on GitHub
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            ) : (
              /* Issues & PRs boards split */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                {/* Issues list */}
                <div className="glass-panel rounded-xl border border-neutral-850 p-4 flex flex-col h-full">
                  <div className="pb-3 border-b border-neutral-900 mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <AlertCircle className="w-4 h-4 text-emerald-400" />
                      GitHub Issues ({githubIssues.length})
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-1.5">
                    {githubIssues.length === 0 ? (
                      <p className="text-[10px] text-neutral-600 text-center py-6">No reported issues</p>
                    ) : (
                      githubIssues.map((issue) => {
                        const isP0 = issue.priority === 'P0';
                        const isP1 = issue.priority === 'P1';
                        const isP2 = issue.priority === 'P2';
                        let badgeColor = 'bg-neutral-900 text-neutral-400 border-neutral-800';
                        if (isP0) badgeColor = 'bg-red-950/60 text-red-400 border-red-900/30';
                        else if (isP1) badgeColor = 'bg-orange-950/60 text-orange-400 border-orange-900/30';
                        else if (isP2) badgeColor = 'bg-amber-950/60 text-amber-400 border-amber-900/30';

                        return (
                          <div key={issue.number} className="p-3.5 bg-neutral-900/30 border border-neutral-900 rounded-xl hover:border-neutral-850 transition-colors flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <h5 className="text-xs font-semibold text-white leading-relaxed truncate max-w-[70%]">
                                  #{issue.number} {issue.title}
                                </h5>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${badgeColor}`}>
                                    {issue.priority || 'P2'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                    issue.state === 'open'
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-900/30'
                                      : 'bg-neutral-900 text-neutral-500 border-neutral-850'
                                  }`}>
                                    {issue.state}
                                  </span>
                                </div>
                              </div>
                              {issue.rationale && (
                                <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed bg-neutral-950/50 border border-neutral-900/40 rounded-lg p-2 font-mono">
                                  <span className="text-purple-400 font-semibold font-sans">AI Rank: </span>
                                  {issue.rationale}
                                </p>
                              )}
                            </div>
                            <div className="mt-3.5 pt-2 border-t border-neutral-900/50 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                              <span>Opened by: @{issue.user}</span>
                              <a
                                href={issue.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline font-semibold"
                              >
                                GitHub link
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* PRs list */}
                <div className="glass-panel rounded-xl border border-neutral-850 p-4 flex flex-col h-full">
                  <div className="pb-3 border-b border-neutral-900 mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <GitPullRequest className="w-4 h-4 text-sky-400" />
                      Pull Requests ({pullRequests.length})
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-1.5">
                    {pullRequests.length === 0 ? (
                      <p className="text-[10px] text-neutral-655 text-center py-6">No branch Pull Requests</p>
                    ) : (
                      pullRequests.map((pr) => {
                        const isP0 = pr.priority === 'P0';
                        const isP1 = pr.priority === 'P1';
                        const isP2 = pr.priority === 'P2';
                        let badgeColor = 'bg-neutral-900 text-neutral-400 border-neutral-800';
                        if (isP0) badgeColor = 'bg-red-950/60 text-red-400 border-red-900/30';
                        else if (isP1) badgeColor = 'bg-orange-950/60 text-orange-400 border-orange-900/30';
                        else if (isP2) badgeColor = 'bg-amber-950/60 text-amber-400 border-amber-900/30';

                        return (
                          <div key={pr.number} className="p-3.5 bg-neutral-900/30 border border-neutral-900 rounded-xl hover:border-neutral-850 transition-colors flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <h5 className="text-xs font-semibold text-white leading-relaxed truncate max-w-[70%]">
                                  #{pr.number} {pr.title}
                                </h5>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${badgeColor}`}>
                                    {pr.priority || 'P2'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                    pr.state === 'open'
                                      ? 'bg-sky-950 text-sky-400 border-sky-900/30'
                                      : 'bg-purple-950 text-purple-400 border-purple-900/30'
                                  }`}>
                                    {pr.state}
                                  </span>
                                </div>
                              </div>
                              {pr.rationale && (
                                <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed bg-neutral-950/50 border border-neutral-900/40 rounded-lg p-2 font-mono">
                                  <span className="text-purple-400 font-semibold font-sans">AI Rank: </span>
                                  {pr.rationale}
                                </p>
                              )}
                            </div>
                            <div className="mt-3.5 pt-2 border-t border-neutral-900/50 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                              <span>By: @{pr.user}</span>
                              <a
                                href={pr.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline font-semibold"
                              >
                                GitHub link
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Project Diagnostic Panel */}
          <div className="glass-panel rounded-xl p-5 border-theme-glow flex flex-col md:flex-row gap-5 items-center justify-between">
            <div className="flex items-start gap-4 text-left">
              <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Sprint Diagnostics</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed max-w-xl">
                  The codebase crawler has compiled tasks from comments and Git issues. Current backlog has a healthy density. We recommend completing high-priority FIXME comments first to ensure repository stability.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-neutral-900/40 border border-neutral-850 px-4 py-2.5 rounded-xl shrink-0">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <div className="text-left font-mono">
                <div className="text-[10px] text-neutral-500 uppercase">Health Score</div>
                <div className="text-sm font-bold text-white">94% (Stable)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function MetricCard({ label, value, desc, color }) {
  return (
    <div className={`p-4 bg-neutral-900/10 border rounded-xl flex flex-col justify-between text-left ${color}`}>
      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-2xl font-bold font-display mt-2">{value}</span>
      <span className="text-[10px] text-neutral-600 mt-1">{desc}</span>
    </div>
  );
}
