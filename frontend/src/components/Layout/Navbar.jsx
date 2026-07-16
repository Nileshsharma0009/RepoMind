import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar({ title, subtitle, sidebarCollapsed, toggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3.5">
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-sm md:text-base font-display font-bold text-white leading-none">{title}</h2>
          {subtitle && <p className="text-[10px] text-neutral-500 mt-1 leading-none">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-neutral-300 placeholder-neutral-600 outline-none w-40"
          />
        </div>
        <button className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
        </button>
        {user && (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-8 h-8 rounded-full border border-neutral-700"
          />
        )}
      </div>
    </header>
  );
}
