import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import api from '../services/api.js';
import {
  Sparkles,
  FileCode,
  ShieldAlert,
  Bug,
  TestTube,
  Code2,
  Eye,
  Loader2,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Play,
  FileText,
} from 'lucide-react';

const agentsList = [
  { key: 'reviewer', label: 'AI Code Reviewer', desc: 'Detailed code sanity, patterns, and style guide audit.', icon: Eye, color: 'text-purple-400 bg-purple-950/20' },
  { key: 'bug', label: 'AI Bug Investigator', desc: 'Trace runtime exceptions, unhandled logic, and memory leaks.', icon: Bug, color: 'text-rose-400 bg-rose-950/20' },
  { key: 'security', label: 'AI Security Auditor', desc: 'Scan code for credential exposure and validation vulnerabilities.', icon: ShieldAlert, color: 'text-amber-400 bg-amber-950/20' },
  { key: 'tester', label: 'AI Test Generator', desc: 'Generate unit tests for edge cases and regular code blocks.', icon: TestTube, color: 'text-sky-400 bg-sky-950/20' },
  { key: 'refactor', label: 'AI Refactoring Agent', desc: 'Optimize module performance, readability, and DRY principles.', icon: Code2, color: 'text-emerald-400 bg-emerald-950/20' },
];

// Recursive Folder Tree node for selection
function FileSelectorNode({ node, selectedFile, onSelect, expandedFolders, toggleFolder }) {
  const isDir = node.type === 'dir';
  const isExpanded = !!expandedFolders[node.path];
  const isSelected = selectedFile === node.path;

  if (isDir) {
    return (
      <div className="pl-1">
        <button
          onClick={() => toggleFolder(node.path)}
          className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-neutral-900/30 text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 text-xs truncate"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3 text-neutral-600" /> : <ChevronRight className="w-3 h-3 text-neutral-600" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div className="pl-2 border-l border-neutral-900 ml-2 mt-0.5 space-y-0.5">
            {node.children.map((child) => (
              <FileSelectorNode
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                onSelect={onSelect}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pl-4">
      <button
        onClick={() => onSelect(node.path)}
        className={`w-full text-left py-1.5 px-2 rounded-lg flex items-center gap-1.5 text-xs truncate transition-all ${
          isSelected
            ? 'bg-primary/10 text-white font-semibold border-l-2 border-primary'
            : 'text-neutral-500 hover:text-neutral-350 hover:bg-neutral-900/30'
        }`}
      >
        <FileCode className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    </div>
  );
}

export default function Playground() {
  const { activeRepo, activeRepoLoading } = useRepository();

  const [selectedFile, setSelectedFile] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('reviewer');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Assemble directory tree
  const fileTree = useMemo(() => {
    if (!activeRepo?.parsedData?.files) return [];
    const files = activeRepo.parsedData.files;
    const root = {};

    files.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;
      parts.forEach((part, i) => {
        const isLast = i === parts.length - 1;
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            type: isLast ? 'file' : 'dir',
            children: isLast ? null : {},
          };
        }
        current = current[part].children;
      });
    });

    const convertToArray = (node) => {
      if (!node) return [];
      return Object.values(node).map((item) => {
        if (item.type === 'dir') {
          return {
            ...item,
            children: convertToArray(item.children).sort((a, b) => {
              if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
              return a.name.localeCompare(b.name);
            }),
          };
        }
        return item;
      });
    };

    return convertToArray(root).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeRepo]);

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const runAnalysis = async () => {
    if (!activeRepo || !selectedFile || loading) return;

    setLoading(true);
    setError('');
    setResult('');

    try {
      const { data } = await api.post('/pm/agent/run', {
        repositoryId: activeRepo._id,
        filePath: selectedFile,
        agentType: selectedAgent,
      });

      setResult(data.result || 'No output generated.');
    } catch (err) {
      console.error('Agent execution failure:', err);
      setError(err.response?.data?.message || 'Agent analysis execution encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  // Basic HTML formatter for AI markdown responses
  const renderResponseMarkdown = (text = '') => {
    if (!text) return null;
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent = [];

    return lines.map((line, idx) => {
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const code = codeContent.join('\n');
          codeContent = [];
          return (
            <pre key={idx} className="my-4 p-4 bg-neutral-950 border border-neutral-900 rounded-lg overflow-x-auto text-xs font-mono text-emerald-400 select-text leading-relaxed">
              <code>{code}</code>
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

      if (line.trim().startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-bold text-white mt-6 mb-3 border-b border-neutral-900 pb-2 first:mt-0 font-display">{line.substring(2)}</h2>;
      }
      if (line.trim().startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-white mt-5 mb-3 font-display">{line.substring(3)}</h3>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={idx} className="ml-4 list-disc text-xs text-neutral-350 my-1 leading-relaxed">{parseInline(line.substring(2))}</li>;
      }
      if (line.trim() === '') return <div key={idx} className="h-2" />;

      return <p key={idx} className="text-xs text-neutral-350 my-2 leading-relaxed">{parseInline(line)}</p>;
    });
  };

  const parseInline = (str) => {
    const parts = [];
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;
    let lastIdx = 0;
    let key = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        parts.push(str.substring(lastIdx, match.index));
      }
      if (match[0].startsWith('**')) {
        parts.push(<strong key={key++} className="text-white font-bold">{match[0].slice(2, -2)}</strong>);
      } else {
        parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-neutral-900 text-[10px] font-mono text-purple-400">{match[0].slice(1, -1)}</code>);
      }
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }
    return parts.length > 0 ? parts : str;
  };

  const currentAgent = agentsList.find(a => a.key === selectedAgent);

  return (
    <MainLayout
      title="AI Agents Playground"
      subtitle={
        activeRepo
          ? `Deploy background automated agents to audit and refactor ${activeRepo.fullName}`
          : 'Index codebases and configure automated PR reviewers, security scanners, or debugger pipelines'
      }
    >
      {activeRepoLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl space-y-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Deploying playground container...</p>
        </div>
      ) : !activeRepo ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <Sparkles className="w-10 h-10 text-neutral-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">No Active Repository</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Please connect and set an active repository in the Repositories panel first to run automated agent reviews.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-11rem)]">
          {/* File selector sidebar tree */}
          <div className="lg:col-span-1 glass-panel rounded-xl border border-neutral-850 bg-neutral-950/20 p-3 flex flex-col h-full overflow-hidden select-none">
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
              Target Code File
            </h4>
            <div className="flex-1 overflow-y-auto space-y-1">
              {fileTree.map((node) => (
                <FileSelectorNode
                  key={node.path}
                  node={node}
                  selectedFile={selectedFile}
                  onSelect={setSelectedFile}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                />
              ))}
            </div>
          </div>

          {/* Main workspace */}
          <div className="lg:col-span-3 flex flex-col gap-5 h-full overflow-hidden text-left">
            {/* Top row: Agents grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
              {agentsList.map((agent) => {
                const Icon = agent.icon;
                const isSelected = selectedAgent === agent.key;
                return (
                  <button
                    key={agent.key}
                    onClick={() => setSelectedAgent(agent.key)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 shadow-theme-glow text-white'
                        : 'bg-neutral-950/20 border-neutral-900 text-neutral-400 hover:text-neutral-250 hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${agent.color}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide leading-tight">
                      {agent.label.split(' ')[1] || agent.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Middle row: execution trigger bar */}
            <div className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Executing:</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">
                    {currentAgent?.label}
                  </span>
                </h5>
                <p className="text-[10px] text-neutral-500 mt-1 truncate max-w-lg">
                  Target File: {selectedFile ? <code className="text-neutral-400 font-mono text-[9px] bg-neutral-950 px-1 py-0.5 rounded">{selectedFile}</code> : 'None selected. Choose a file from explorer tree.'}
                </p>
              </div>

              <button
                onClick={runAnalysis}
                disabled={loading || !selectedFile}
                className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-lg disabled:opacity-40 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                <span>Execute Agent Job</span>
              </button>
            </div>

            {/* Bottom row: agent reports container */}
            <div className="flex-1 glass-panel border border-neutral-850 rounded-xl flex flex-col overflow-hidden">
              <div className="p-3 bg-neutral-950/80 border-b border-neutral-900 flex items-center gap-2 shrink-0">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Diagnostics Terminal Output
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-neutral-950/20 select-text relative">
                {loading && (
                  <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center gap-2 z-10">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    <span className="text-xs text-neutral-500 font-mono">Deploying analysis threads...</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-950/15 border border-red-950/30 rounded-xl text-xs text-red-400">
                    {error}
                  </div>
                )}

                {!result && !loading && !error && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <Sparkles className="w-8 h-8 text-neutral-700 mb-2" />
                    <p className="text-xs font-semibold text-neutral-500">Playground Idle</p>
                    <p className="text-[10px] text-neutral-600 mt-1 max-w-xs leading-normal">
                      Select a file from the explorer sidebar, choose an agent type, and click execute to spawn threads.
                    </p>
                  </div>
                )}

                {result && renderResponseMarkdown(result)}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
