import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  FileText,
  Network,
  Kanban,
  Search,
  Settings,
  LogOut,
  Brain,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRepository } from '../../context/RepositoryContext.jsx';
import ThemeSelector from '../Common/ThemeSelector.jsx';

import logo from '../../assets/logos/logo1.png';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/repositories', icon: FolderGit2, label: 'Repositories' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/documentation', icon: FileText, label: 'Documentation' },
  { to: '/architecture', icon: Network, label: 'Architecture' },
  { to: '/project-manager', icon: Kanban, label: 'Project Manager' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/playground', icon: Sparkles, label: 'AI Playground' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();
  const { connectedRepos, activeRepo, selectRepo } = useRepository();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`min-h-screen bg-neutral-950 border-r border-neutral-800/60 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
      collapsed ? 'w-0 opacity-0 overflow-hidden border-r-0' : 'w-64 opacity-100'
    }`}>
      <div className="p-5 border-b border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden bg-neutral-950 border border-neutral-800 shadow-glass-glow">
            <img src={logo} alt="RepoMind Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-tight">RepoMind</h1>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">AI Memory</p>
          </div>
        </div>
      </div>

      {/* Repository Switcher */}
      <div className="px-4 py-3 border-b border-neutral-800/60 bg-neutral-900/10">
        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
          Active Repository
        </label>
        {connectedRepos.length === 0 ? (
          <button
            onClick={() => navigate('/repositories')}
            className="w-full text-left px-2.5 py-1.5 bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/40 rounded-lg text-xs text-neutral-400 flex items-center justify-between transition-colors"
          >
            <span className="truncate">No connected repos</span>
            <span className="text-[10px] text-primary font-semibold font-sans shrink-0 ml-1">+ Add</span>
          </button>
        ) : (
          <select
            value={activeRepo?._id || ''}
            onChange={(e) => selectRepo(e.target.value)}
            className="w-full px-2 py-1.5 bg-neutral-900/40 border border-neutral-800/40 rounded-lg text-xs text-neutral-200 outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="" className="bg-neutral-950 text-neutral-400">
              Select repository...
            </option>
            {connectedRepos.map((repo) => (
              <option key={repo._id} value={repo._id} className="bg-neutral-950 text-white">
                {repo.fullName}
              </option>
            ))}
          </select>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5 shrink-0" />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border border-transparent ${
                isActive
                  ? 'bg-amber-600/15 text-amber-300 border-amber-500/20'
                  : 'text-amber-500/80 hover:text-amber-300 hover:bg-neutral-900/60'
              }`
            }
          >
            <Shield className="w-4.5 h-4.5 shrink-0 text-amber-500" />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-neutral-800/60 space-y-4">
          <ThemeSelector />
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-9 h-9 rounded-full border border-neutral-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/5 border border-neutral-800 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
