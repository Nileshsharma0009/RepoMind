import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CommitModal from '../components/Documentation/CommitModal.jsx';
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
  Maximize2,
  Minimize2,
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

const defaultPaths = {
  readme: 'README.md',
  api: 'API_REFERENCE.md',
  folder: 'FOLDER_STRUCTURE.md',
  setup: 'SETUP_GUIDE.md',
  deployment: 'DEPLOYMENT_GUIDE.md',
  architecture: 'ARCHITECTURE_GUIDE.md',
  release: 'RELEASE_NOTES.md',
  changelog: 'CHANGELOG.md',
};

export default function Documentation() {
  const { activeRepo, activeRepoLoading } = useRepository();
  const [selectedCategory, setSelectedCategory] = useState('readme');
  const [content, setContent] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);


  // Commit Modal States
  const [showCommitModal, setShowCommitModal] = useState(false);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Failed to trigger native browser fullscreen:', err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const fetchDocument = async () => {
    if (!activeRepo) return;
    
    const cacheKey = `repomind_doc_${activeRepo._id}_${selectedCategory}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      setContent(cached);
      setDraftContent(cached);
    } else {
      setLoading(true);
      setContent('');
      setDraftContent('');
    }
    
    setError('');
    setIsEditing(false);

    try {
      const { data } = await api.get(`/repositories/${activeRepo._id}/docs/${selectedCategory}`);
      const freshContent = data.content || '';
      setContent(freshContent);
      setDraftContent(freshContent);
      localStorage.setItem(cacheKey, freshContent);
    } catch (err) {
      console.error('Failed to load documentation:', err);
      if (!cached) {
        setError(err.response?.data?.message || 'Failed to assemble guide from indexing database.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [activeRepo, selectedCategory]);

  const handleStartEditing = () => {
    setDraftContent(content);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraftContent(content);
    setIsEditing(false);
  };



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

  // ReactMarkdown syntax-highlighted formatter
  const renderMarkdown = (mdText = '') => {
    if (!mdText) return null;

    return (
      <div className="prose prose-invert prose-xs max-w-none text-left select-text">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-xl border border-neutral-900 my-4 !bg-neutral-950 font-mono text-[11px] leading-relaxed"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-purple-400" {...props}>
                  {children}
                </code>
              );
            },
            a({ node, href, children, ...props }) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold" {...props}>
                  {children}
                </a>
              );
            }
          }}
        >
          {mdText}
        </ReactMarkdown>
      </div>
    );
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
        <div className="space-y-4">


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
          <div
            ref={containerRef}
            className={`lg:col-span-3 glass-panel rounded-xl flex flex-col overflow-hidden border border-neutral-850 transition-all duration-300 ${
              isFullScreen ? 'bg-neutral-950 w-full h-full p-4 z-50' : 'h-full'
            }`}
          >
            {/* Header controls bar */}
            <div className="p-3 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-4 shrink-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <FileText className="w-4 h-4 text-primary" />
                Document Compiler {isEditing && <span className="text-[10px] text-primary/80 lowercase font-normal">(Editing Mode)</span>}
              </span>
              <div className="flex items-center gap-2">
                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreenToggle}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0"
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-500" /> : <Maximize2 className="w-3.5 h-3.5 text-primary" />}
                  <span>{isFullScreen ? 'Exit' : 'Fullscreen'}</span>
                </button>
                {content && (
                <div className="flex items-center gap-2 font-display">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEditing}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowCommitModal(true)}
                        className="px-3 py-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg text-xs transition-colors shadow-theme-glow"
                      >
                        Commit to GitHub
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEditing}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-350 hover:text-white rounded-lg text-xs transition-colors"
                      >
                        Edit Guide
                      </button>
                      <button
                        onClick={() => setShowCommitModal(true)}
                        className="px-3 py-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg text-xs transition-colors shadow-theme-glow"
                      >
                        Commit to GitHub
                      </button>
                      <button
                        onClick={handleCopy}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-855 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-855 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Document display board */}
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-950/20 text-left select-text relative flex flex-col">
              {loading && (
                <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center gap-2 z-10">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs text-neutral-500 font-mono">Parsing indexing schemas...</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-950/15 border border-red-950/30 rounded-xl text-xs text-red-400 flex items-start gap-2.5 mb-4 shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {isEditing ? (
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full flex-1 p-4 bg-neutral-900/40 border border-neutral-850 rounded-xl text-xs font-mono text-neutral-200 outline-none focus:border-primary/50 resize-none leading-relaxed"
                  placeholder="Draft markdown guide content here..."
                />
              ) : (
                content && renderMarkdown(content)
              )}
            </div>
          </div>
          <CommitModal
            isOpen={showCommitModal}
            onClose={() => setShowCommitModal(false)}
            activeRepo={activeRepo}
            selectedCategory={selectedCategory}
            draftContent={draftContent}
            onCommitSuccess={(newContent) => {
              setContent(newContent);
              setIsEditing(false);
            }}
          />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
