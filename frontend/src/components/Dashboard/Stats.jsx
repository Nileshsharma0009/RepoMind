import React from 'react';
import { useRepository } from '../../context/RepositoryContext.jsx';
import { FolderGit2, FileCode, GitBranch, ShieldCheck, TrendingUp } from 'lucide-react';

export default function Stats() {
  const { connectedRepos, activeRepo } = useRepository();

  const stats = [
    {
      label: 'Connected Repos',
      value: connectedRepos.length.toString(),
      change: `${connectedRepos.filter(r => r.status === 'indexed').length} fully indexed`,
      icon: FolderGit2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Indexed Files',
      value: activeRepo ? activeRepo.fileCount.toString() : '0',
      change: activeRepo ? 'Ready for AI parsing' : 'Select an active repo',
      icon: FileCode,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Default Branch',
      value: activeRepo ? activeRepo.defaultBranch : 'N/A',
      change: activeRepo ? `Owner: ${activeRepo.owner}` : 'No repo selected',
      icon: GitBranch,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Indexing Status',
      value: activeRepo ? activeRepo.status.toUpperCase() : 'NONE',
      change: activeRepo?.errorMessage ? 'Failed to parse completely' : 'System healthy',
      icon: ShieldCheck,
      color: activeRepo?.status === 'indexed' ? 'text-emerald-400' : activeRepo?.status === 'failed' ? 'text-red-400' : 'text-amber-400',
      bg: activeRepo?.status === 'indexed' ? 'bg-emerald-500/10' : activeRepo?.status === 'failed' ? 'bg-red-500/10' : 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
        <div key={label} className="glass-panel rounded-xl p-5 border-theme-glow">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-lg ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <TrendingUp className="w-4 h-4 text-neutral-600" />
          </div>
          <p className="text-2xl font-display font-bold text-white truncate">{value}</p>
          <p className="text-sm text-neutral-400 mt-1">{label}</p>
          <p className="text-xs text-neutral-500 mt-2 font-mono truncate">{change}</p>
        </div>
      ))}
    </div>
  );
}
