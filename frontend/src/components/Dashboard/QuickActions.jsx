import React from 'react';
import { Sparkles, GitBranch, FileText, MessageSquare } from 'lucide-react';

const suggestions = [
  {
    icon: GitBranch,
    text: 'Connect your first repository to start indexing',
    tag: 'Phase 2',
    color: 'text-purple-400',
  },
  {
    icon: FileText,
    text: 'Auto-generate documentation from your codebase',
    tag: 'Phase 4',
    color: 'text-blue-400',
  },
  {
    icon: MessageSquare,
    text: 'Ask AI where authentication is handled',
    tag: 'Phase 3',
    color: 'text-emerald-400',
  },
];

export default function QuickActions() {
  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
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
              <p className="text-xs text-neutral-300">{text}</p>
              <span className="text-[10px] text-neutral-600 font-mono mt-1 inline-block">{tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
