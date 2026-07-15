import React from 'react';
import { FolderGit2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Activity() {
  const { user } = useAuth();

  const recentItems = user
    ? [
        {
          name: `@${user.username}`,
          lang: 'GitHub',
          updated: 'Just connected',
          desc: user.bio || 'GitHub account linked successfully',
        },
      ]
    : [];

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <FolderGit2 className="w-4 h-4 text-purple-400" />
        Recent Repositories
      </h3>

      {recentItems.length === 0 ? (
        <div className="text-center py-8">
          <FolderGit2 className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No repositories connected yet</p>
          <p className="text-xs text-neutral-600 mt-1">Phase 2 — Connect your GitHub repos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentItems.map((repo) => (
            <div
              key={repo.name}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50 hover:border-purple-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{repo.name}</p>
                  <p className="text-xs text-neutral-500">{repo.desc}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                  {repo.lang}
                </span>
                <p className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1 justify-end">
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
