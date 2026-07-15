import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import api from '../services/api.js';
import {
  FileText,
  Copy,
  Check,
  Download,
  BookOpen,
  Terminal,
  Network,
  RotateCw,
  AlertTriangle,
  Info,
  Loader2,
  FolderTree,
  Globe,
  Sparkles,
} from 'lucide-react';

const categories = [
  { key: 'readme', label: 'README / Overview', icon: BookOpen },
  { key: 'api', label: 'API Reference', icon: Terminal },
  { key: 'folder', label: 'Folder Structure', icon: FolderTree },
  { key: 'setup', label: 'Setup Guide', icon: Info },
  { key: 'deployment', label: 'Deployment Guide', icon: Globe },
  { key: 'architecture', label: 'Architecture Guide', icon: Network },
  { key: 'release', label: 'Release Notes', icon: Sparkles },
  { key: 'changelog', label: 'Changelog', icon: FileText },
];

export default function Documentation() {
  const { activeRepo, activeRepoLoading } = useRepository();
  const [selectedCategory, setSelectedCategory] = useState('readme');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchDocument = async () => {
    if (!activeRepo) return;
    setLoading(true);
    setError('');
    setContent('');
    try {
      const { data } = await api.get(`/repositories/${activeRepo._id}/docs/${selectedCategory}`);
      setContent(data.content || '');
    } catch (err) {
      console.error('Failed to load documentation:', err);
      setError(err.response?.data?.message || 'Failed to assemble guide from indexing database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [activeRepo, selectedCategory]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content || !activeRepo) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeRepo.name}_${selectedCategory.toUpperCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Basic HTML markdown formatter
  const renderMarkdown = (mdText = '') => {
    if (!mdText) return null;

    const lines = mdText.split('\n');
    let inCodeBlock = false;
    let codeContent = [];

    return lines.map((line, idx) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const currentCode = codeContent.join('\n');
          codeContent = [];
          return (
            <pre
              key={idx}
              className="my-4 p-4 bg-neutral-950 border border-neutral-900 rounded-lg overflow-x-auto text-xs font-mono text-emerald-400 select-text leading-relaxed"
            >
              <code>{currentCode}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Headers
      if (line.trim().startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-bold text-white mt-6 mb-3 border-b border-neutral-900 pb-2 first:mt-0 font-display">
            {line.trim().substring(2)}
          </h1>
        );
      }
      if (line.trim().startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-bold text-white mt-5 mb-3 first:mt-0 font-display">
            {line.trim().substring(3)}
          </h2>
        );
      }
      if (line.trim().startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-white mt-4 mb-2 first:mt-0 font-display">
            {line.trim().substring(4)}
          </h3>
        );
      }

      // Bullets
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-neutral-350 my-1 leading-relaxed">
            {parseInline(line.trim().substring(2))}
          </li>
        );
      }

      // Empty spacing
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs text-neutral-350 my-2 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    });
  };

  const parseInline = (str) => {
    const parts = [];
    let key = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(str)) !== null) {
      matches.push({ text: match[0], index: match.index });
    }

    if (matches.length === 0) return str;

    let lastIndex = 0;
    matches.forEach((m) => {
      if (m.index > lastIndex) {
        parts.push(str.substring(lastIndex, m.index));
      }
      if (m.text.startsWith('**')) {
        parts.push(
          <strong key={key++} className="font-bold text-white">
            {m.text.substring(2, m.text.length - 2)}
          </strong>
        );
      } else {
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-purple-400">
            {m.text.substring(1, m.text.length - 1)}
          </code>
        );
      }
      lastIndex = m.index + m.text.length;
    });

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts;
  };

  return (
    <MainLayout
      title="Documentation Generator"
      subtitle={
        activeRepo
          ? `Auto-generated technical developer documentation for ${activeRepo.fullName}`
          : 'Index codebases and generate technical docs in one click'
      }
    >
      {activeRepoLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl space-y-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Assembling documentation workspace...</p>
        </div>
      ) : !activeRepo ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <FileText className="w-10 h-10 text-neutral-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">No Active Repository</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Please connect and set an active repository in the Repositories panel first to begin generating developer manuals.
          </p>
        </div>
      ) : activeRepo.status !== 'indexed' ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 animate-pulse mb-3">
            <Info className="w-4.5 h-4.5 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Repository Indexing in Progress</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Wait for indexation to resolve to complete. Current status: **{activeRepo.status}**.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-11rem)]">
          {/* Left panel selector list */}
          <div className="lg:col-span-1 flex flex-col gap-2 overflow-y-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary/30 shadow-theme-glow text-white font-semibold'
                      : 'bg-neutral-950/20 border-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right panel markdown render preview */}
          <div className="lg:col-span-3 glass-panel rounded-xl flex flex-col overflow-hidden h-full border border-neutral-850">
            {/* Header controls bar */}
            <div className="p-3 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-4 shrink-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <FileText className="w-4 h-4 text-primary" />
                Document Compiler
              </span>

              {content && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            {/* Document display board */}
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-950/20 text-left select-text relative">
              {loading && (
                <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs text-neutral-500 font-mono">Parsing indexing schemas...</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-950/15 border border-red-950/30 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {content && renderMarkdown(content)}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
