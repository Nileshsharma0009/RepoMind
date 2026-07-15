import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../services/api.js';
import { useRepository } from '../../context/RepositoryContext.jsx';
import {
  FileCode,
  X,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Loader2,
  Columns,
} from 'lucide-react';

// Recursive tree node renderer
function FileTreeNode({ node, activeTab, onFileSelect, expandedFolders, toggleFolder }) {
  const isDir = node.type === 'dir';
  const isExpanded = !!expandedFolders[node.path];
  const isCurrent = activeTab === node.path;

  if (isDir) {
    return (
      <div className="pl-1">
        <button
          onClick={() => toggleFolder(node.path)}
          className="w-full text-left py-1 px-1.5 rounded-md hover:bg-neutral-900/40 text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 text-xs truncate"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-neutral-600 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div className="pl-2 border-l border-neutral-900 ml-2 mt-0.5 space-y-0.5">
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                activeTab={activeTab}
                onFileSelect={onFileSelect}
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
        onClick={() => onFileSelect && onFileSelect(node.path)}
        className={`w-full text-left py-1 px-1.5 rounded-md flex items-center gap-1.5 text-xs truncate transition-all ${
          isCurrent
            ? 'bg-primary/10 text-white font-medium border-l-2 border-primary'
            : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/40'
        }`}
      >
        <FileCode className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <span className="truncate" title={node.path}>
          {node.name}
        </span>
      </button>
    </div>
  );
}

export default function CodeExplorer({
  openTabs,
  activeTab,
  onTabChange,
  onTabClose,
  onFileSelect,
  highlightedLine,
  setHighlightedLine,
}) {
  const { activeRepo } = useRepository();
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [cache, setCache] = useState({}); // path -> content cache
  const [expandedFolders, setExpandedFolders] = useState({});

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  // Fetch content of active tab
  useEffect(() => {
    if (!activeTab || !activeRepo) {
      setFileContent('');
      return;
    }

    if (cache[activeTab] !== undefined) {
      setFileContent(cache[activeTab]);
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/repositories/${activeRepo._id}/files/content`, {
          params: { path: activeTab },
        });
        const content = data.content || '';
        setCache((prev) => ({ ...prev, [activeTab]: content }));
        setFileContent(content);
      } catch (err) {
        console.error('Failed to load file content:', err);
        setFileContent(`// Failed to load file: ${activeTab}\n// ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [activeTab, activeRepo, cache]);

  // Handle Monaco editor mounting and configuration
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Scroll to and highlight cited line
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeTab) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Clear previous line highlights
    if (decorationsRef.current.length > 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }

    if (highlightedLine && highlightedLine > 0) {
      setTimeout(() => {
        editor.revealLineInCenter(highlightedLine);
        editor.setPosition({ lineNumber: highlightedLine, column: 1 });
        editor.focus();

        decorationsRef.current = editor.deltaDecorations(
          [],
          [
            {
              range: new monaco.Range(highlightedLine, 1, highlightedLine, 1),
              options: {
                isWholeLine: true,
                className: 'monaco-line-highlight',
                marginClassName: 'border-l-2 border-primary',
              },
            },
          ]
        );
      }, 200);
    }
  }, [highlightedLine, activeTab, fileContent]);

  // Construct recursive tree structure from flat file paths list
  const fileTree = useMemo(() => {
    const files = activeRepo?.parsedData?.files || [];
    const root = {};

    // Group files into nested map
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

    // Helper to convert nested map into sorted array representation
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

    const tree = convertToArray(root).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return tree;
  }, [activeRepo]);

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!filterQuery) return fileTree;

    const filterNode = (node) => {
      if (node.type === 'file') {
        return node.path.toLowerCase().includes(filterQuery.toLowerCase()) ? node : null;
      }

      const matchingChildren = node.children
        .map((c) => filterNode(c))
        .filter((c) => c !== null);

      if (matchingChildren.length > 0) {
        return { ...node, children: matchingChildren };
      }

      return null;
    };

    return fileTree.map((n) => filterNode(n)).filter((n) => n !== null);
  }, [fileTree, filterQuery]);

  // Auto expand folders that contain search matches or the activeTab file
  useEffect(() => {
    if (activeTab) {
      const parts = activeTab.split('/');
      const pathsToExpand = {};
      for (let i = 0; i < parts.length - 1; i++) {
        const pathStr = parts.slice(0, i + 1).join('/');
        pathsToExpand[pathStr] = true;
      }
      setExpandedFolders((prev) => ({ ...prev, ...pathsToExpand }));
    }
  }, [activeTab]);

  useEffect(() => {
    if (filterQuery) {
      const expandAllMatching = (nodes) => {
        const paths = {};
        const traverse = (node) => {
          if (node.type === 'dir' && node.children) {
            paths[node.path] = true;
            node.children.forEach(traverse);
          }
        };
        nodes.forEach(traverse);
        return paths;
      };
      setExpandedFolders((prev) => ({ ...prev, ...expandAllMatching(filteredTree) }));
    }
  }, [filterQuery, filteredTree]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const getLanguageMode = (filePath) => {
    const ext = filePath.split('.').pop().toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'cjs':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'yml':
      case 'yaml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex h-full border border-neutral-800/40 relative shadow-2xl">
      {/* File Explorer Sidebar */}
      {sidebarOpen && activeRepo && (
        <div className="w-56 border-r border-neutral-900 bg-neutral-950/80 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-900 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
              File Tree Explorer
            </span>
          </div>

          <div className="p-2 border-b border-neutral-900/60">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 border border-neutral-850 rounded-md">
              <Search className="w-3 h-3 text-neutral-500 shrink-0" />
              <input
                type="text"
                placeholder="Search file path..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-transparent text-[10px] text-neutral-300 placeholder-neutral-600 outline-none w-full"
              />
            </div>
          </div>

          {/* Recursive Directory List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 select-none">
            {filteredTree.length === 0 ? (
              <p className="text-[10px] text-neutral-650 text-center py-4">No matching files</p>
            ) : (
              filteredTree.map((node) => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  activeTab={activeTab}
                  onFileSelect={onFileSelect}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/20">
        {/* Tabs Bar */}
        <div className="h-10 border-b border-neutral-900 bg-neutral-950/90 flex items-center justify-between px-2 overflow-x-auto shrink-0 select-none">
          <div className="flex items-center gap-1 overflow-x-auto h-full pr-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar"
              className="p-1 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/60 mr-1 shrink-0"
            >
              <Columns className="w-4 h-4" />
            </button>

            {openTabs.map((tab) => {
              const isActive = activeTab === tab;
              const name = tab.split('/').pop();
              return (
                <div
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`h-full px-3 flex items-center gap-2 border-r border-neutral-900 text-xs cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? 'bg-neutral-900/60 text-white font-semibold border-b-2 border-b-primary'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/30'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span title={tab}>{name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab);
                    }}
                    className="p-0.5 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor Screen */}
        <div className="flex-1 min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-neutral-500 font-mono">Loading file contents...</span>
            </div>
          )}

          {!activeTab ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-950/40 text-center">
              <FileCode className="w-10 h-10 text-neutral-700 mb-2" />
              <p className="text-sm text-neutral-400 font-semibold">No File Open</p>
              <p className="text-xs text-neutral-600 mt-1 max-w-xs leading-relaxed">
                Expand the File Tree Explorer sidebar on the left and select any file, or click on code reference citations in your AI chat answers.
              </p>
            </div>
          ) : (
            <Editor
              height="100%"
              theme="vs-dark"
              language={getLanguageMode(activeTab)}
              path={activeTab}
              value={fileContent}
              loading={<Loader2 className="w-6 h-6 text-primary animate-spin" />}
              onMount={handleEditorDidMount}
              options={{
                readOnly: true,
                minimap: { enabled: true },
                fontSize: 13,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
