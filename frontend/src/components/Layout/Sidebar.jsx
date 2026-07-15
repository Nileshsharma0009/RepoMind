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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/repositories', icon: FolderGit2, label: 'Repositories' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/documentation', icon: FileText, label: 'Documentation' },
  { to: '/architecture', icon: Network, label: 'Architecture' },
  { to: '/project-manager', icon: Kanban, label: 'Project Manager' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-neutral-950 border-r border-neutral-800/60 flex flex-col shrink-0">
      <div className="p-5 border-b border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-glass-glow">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-tight">RepoMind</h1>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">AI Memory</p>
          </div>
        </div>
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
      </nav>

      {user && (
        <div className="p-4 border-t border-neutral-800/60">
          <div className="flex items-center gap-3 mb-3">
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
