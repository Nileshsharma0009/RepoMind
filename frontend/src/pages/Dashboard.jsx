import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import Stats from '../components/Dashboard/Stats.jsx';
import Activity from '../components/Dashboard/Activity.jsx';
import ProjectHealth from '../components/Dashboard/ProjectHealth.jsx';
import QuickActions from '../components/Dashboard/QuickActions.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import { MessageSquare, Sparkles, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeRepo } = useRepository();
  const navigate = useNavigate();

  const [chatHistory, setChatHistory] = useState([]);

  // Load chat query logs from localStorage to make the Recent Chats widget dynamic
  useEffect(() => {
    try {
      const stored = localStorage.getItem('repomind_chat_queries');
      if (stored) {
        setChatHistory(JSON.parse(stored).slice(0, 3));
      } else {
        // Fallback placeholder defaults if history is empty
        setChatHistory([
          { query: 'Where is JWT token verified?', time: 'Suggested question' },
          { query: 'Show authentication middleware flow', time: 'Suggested question' },
          { query: 'List all API endpoints', time: 'Suggested question' },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    }
  }, []);

  const handleQueryClick = (queryText) => {
    navigate(`/chat?query=${encodeURIComponent(queryText)}`);
  };

  // Compile context-aware AI Suggestions dynamically based on file type distributions
  const aiSuggestions = useMemo(() => {
    if (!activeRepo?.parsedData?.files) {
      return [
        { title: 'Connect a codebase', text: 'Select a GitHub repository to harvest files and generate optimization suggestions.' },
        { title: 'Explore diagrams', text: 'Go to the Architecture tab to audit your Express routing flows.' },
      ];
    }

    const files = activeRepo.parsedData.files;
    const suggestions = [];

    const hasModels = files.some(f => f.type === 'model');
    const hasRoutes = files.some(f => f.type === 'route');
    const hasComponents = files.some(f => f.type === 'component');

    if (hasModels) {
      suggestions.push({
        title: 'DB Schema Sanitation',
        text: 'Set "select: false" on password fields in your schemas to avoid leaks in query responses.',
      });
      suggestions.push({
        title: 'Index Optimization',
        text: 'Add compound indexes on MongoDB schemas for properties queried in query loops.',
      });
    }

    if (hasRoutes) {
      suggestions.push({
        title: 'DDoS Rate-Limiting',
        text: 'Integrate express-rate-limit middleware on auth endpoints to prevent brute force logins.',
      });
      suggestions.push({
        title: 'Input Validations',
        text: 'Implement schema validater hooks (like Joi or Zod) inside controllers before dispatching.',
      });
    }

    if (hasComponents) {
      suggestions.push({
        title: 'Render Optimization',
        text: 'Audit React contexts and introduce selectors to avoid unnecessary component updates.',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Modularize code structure',
        text: 'Group files into routers, controllers, services, and models folders to support scaling.',
      });
    }

    return suggestions.slice(0, 3);
  }, [activeRepo]);

  // Compile a dynamic project summary
  const projectSummary = useMemo(() => {
    if (!activeRepo) return 'Select a repository to compile codebase details.';

    const folders = activeRepo.parsedData?.folders?.length || 0;
    const files = activeRepo.parsedData?.files?.length || 0;
    const extensions = Object.keys(activeRepo.parsedData?.summary?.extensions || {}).join(', ');

    return `The "${activeRepo.name}" repository is structured across ${folders} folders containing ${files} indexed files. Core code extensions detected include: ${extensions || 'N/A'}. RepoMind has generated a system router map and indexed all code snippets for AI consultation.`;
  }, [activeRepo]);

  return (
    <MainLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.displayName || 'Developer'}`}
    >
      {/* Top Cards Stats */}
      <Stats />

      {/* Main Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2">
          <Activity />
        </div>
        <ProjectHealth />
      </div>

      {/* Dynamic Backlog Summary & Suggestions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 text-left">
        {/* Project Summary */}
        <div className="glass-panel rounded-xl p-5 border border-neutral-900/60 bg-neutral-950/20 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Codebase Summary
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              {projectSummary}
            </p>
          </div>
          {activeRepo && (
            <div className="pt-3 border-t border-neutral-900 mt-4 flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Diagnostic parsing complete</span>
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="glass-panel rounded-xl p-5 border border-neutral-900/60">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            AI Diagnostics
          </h3>
          <div className="space-y-3">
            {aiSuggestions.map((sug, i) => (
              <div
                key={i}
                className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-lg"
              >
                <h5 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                  {sug.title}
                </h5>
                <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                  {sug.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="glass-panel rounded-xl p-5 border border-neutral-900/60">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            Recent Queries
          </h3>
          <div className="space-y-3">
            {chatHistory.map((chat, i) => (
              <button
                key={i}
                onClick={() => handleQueryClick(chat.query)}
                className="w-full text-left p-3 rounded-lg bg-neutral-900/40 border border-neutral-850 hover:border-primary/30 flex items-center justify-between group transition-all"
              >
                <div className="truncate pr-4">
                  <p className="text-xs text-neutral-300 truncate font-sans">{chat.query}</p>
                  <p className="text-[9px] text-neutral-600 mt-1 font-mono">{chat.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="mt-5">
        <QuickActions />
      </div>
    </MainLayout>
  );
}
