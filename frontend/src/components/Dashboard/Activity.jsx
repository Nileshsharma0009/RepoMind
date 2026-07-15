import React from 'react';
import { FolderGit2, Clock, GitBranch } from 'lucide-react';
import { useRepository } from '../../context/RepositoryContext.jsx';

export default function Activity() {
  const { connectedRepos } = useRepository();

  const recentItems = connectedRepos.slice(0, 5).map((repo) => ({
    id: repo._id,
    name: repo.name,
    fullName: repo.fullName,
    branch: repo.defaultBranch,
    status: repo.status.toUpperCase(),
    updated: new Date(repo.updatedAt).toLocaleDateString(),
    desc: repo.description || 'No description provided.',
  }));

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <FolderGit2 className="w-4 h-4 text-primary" />
        Recently Connected Codebases
      </h3>

      {recentItems.length === 0 ? (
        <div className="text-center py-8">
          <FolderGit2 className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No repositories connected yet</p>
          <p className="text-xs text-neutral-600 mt-1">Visit the Repositories tab to connect your first repo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentItems.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50 hover:border-primary/25 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{repo.fullName}</p>
                  <p className="text-xs text-neutral-500 truncate">{repo.desc}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                  repo.status === 'INDEXED'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : repo.status === 'FAILED'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {repo.status}
                </span>
                <p className="text-[10px] text-neutral-600 mt-1.5 flex items-center gap-1 justify-end font-mono">
                  <Clock className="w-3 h-3" />
                  {repo.updated}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
