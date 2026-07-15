import React from 'react';
import { Sparkles, GitBranch, FileText, MessageSquare } from 'lucide-react';
import { useRepository } from '../../context/RepositoryContext.jsx';

export default function QuickActions() {
  const { connectedRepos, activeRepo } = useRepository();

  const getSuggestions = () => {
    if (connectedRepos.length === 0) {
      return [
        {
          icon: GitBranch,
          text: 'Connect your first GitHub repository in the Repositories tab to begin indexing.',
          tag: 'Recommendation',
          color: 'text-primary',
        },
        {
          icon: MessageSquare,
          text: 'OAuth login details are active. RepoMind is successfully authenticated with your GitHub profile.',
          tag: 'System Status',
          color: 'text-emerald-400',
        }
      ];
    }

    if (activeRepo && activeRepo.status !== 'indexed') {
      return [
        {
          icon: GitBranch,
          text: `Crawl and parse is running for ${activeRepo.name}. Wait for it to complete.`,
          tag: 'Running',
          color: 'text-amber-400',
        },
        {
          icon: FileText,
          text: 'Theme settings are persistent. Explore the sidebar customization tool while parsing.',
          tag: 'Tip',
          color: 'text-blue-400',
        }
      ];
    }

    return [
      {
        icon: MessageSquare,
        text: `Codebase mapping completed! Go to the Architecture tab to view the dependency graph of ${activeRepo?.name || 'your codebase'}.`,
        tag: 'Phase 3 Visualizer',
        color: 'text-emerald-400',
      },
      {
        icon: FileText,
        text: 'The file hierarchy is parsed. AI engine is ready to receive questions.',
        tag: 'Ready',
        color: 'text-primary',
      },
    ];
  };

  const suggestions = getSuggestions();

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        AI Suggestions
      </h3>
      <div className="space-y-3">
        {suggestions.map(({ icon: Icon, text, tag, color }) => (
          <div
            key={text}
            className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/40"
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
            <div className="flex-1">
              <p className="text-xs text-neutral-300 leading-normal">{text}</p>
              <span className="text-[9px] text-neutral-600 font-mono mt-1.5 inline-block uppercase tracking-wider">{tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
