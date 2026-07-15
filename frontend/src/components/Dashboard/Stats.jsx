import React from 'react';
import { FolderGit2, FileCode, MessageSquare, AlertCircle, TrendingUp } from 'lucide-react';

const stats = [
  {
    label: 'Repositories',
    value: '0',
    change: 'Connect in Phase 2',
    icon: FolderGit2,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    label: 'Indexed Files',
    value: '0',
    change: 'Awaiting repos',
    icon: FileCode,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'AI Chats',
    value: '0',
    change: 'Start chatting',
    icon: MessageSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    label: 'Issues Tracked',
    value: '0',
    change: 'Coming soon',
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

export default function Stats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
        <div key={label} className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-lg ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <TrendingUp className="w-4 h-4 text-neutral-600" />
          </div>
          <p className="text-2xl font-display font-bold text-white">{value}</p>
          <p className="text-sm text-neutral-400 mt-1">{label}</p>
          <p className="text-xs text-neutral-600 mt-2 font-mono">{change}</p>
        </div>
      ))}
    </div>
  );
}
