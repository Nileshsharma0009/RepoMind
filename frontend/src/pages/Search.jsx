import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import api from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  FileCode,
  ArrowRight,
  Loader2,
  AlertCircle,
  FolderSearch,
} from 'lucide-react';

export default function Search() {
  const { activeRepo, activeRepoLoading } = useRepository();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || !activeRepo) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const { data } = await api.get(`/repositories/${activeRepo._id}/search`, {
        params: { query: query.trim() },
      });
      setResults(data.matches || []);
    } catch (err) {
      console.error('Search request failed:', err);
      setError(err.response?.data?.message || 'Search execution encountered an error.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCode = (filePath, line) => {
    navigate(`/chat?open=${encodeURIComponent(filePath)}&line=${line}`);
  };

  return (
    <MainLayout
      title="Search Agent"
      subtitle={
        activeRepo
          ? `Instant full-text code search across ${activeRepo.fullName}`
          : 'Index repositories to look up tokens, modules, and key variables'
      }
    >
      {activeRepoLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl space-y-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Connecting search indexing indices...</p>
        </div>
      ) : !activeRepo ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <FolderSearch className="w-10 h-10 text-neutral-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">No Active Repository</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Please connect and set an active repository in the Repositories panel first to run keyword searches.
          </p>
        </div>
      ) : activeRepo.status !== 'indexed' ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 animate-pulse mb-3">
            <SearchIcon className="w-4.5 h-4.5 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Search Index Incomplete</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Wait for indexation to resolve to complete. Current status: **{activeRepo.status}**.
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Search bar layout */}
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus-within:border-primary/45 transition-colors relative shadow-glass-inner">
              <SearchIcon className="w-4.5 h-4.5 text-neutral-500 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search variables, functions, dead codes, or dependencies (e.g. JWT, bcrypt, axios)..."
                className="bg-transparent text-sm text-neutral-200 placeholder-neutral-600 outline-none w-full py-0.5"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
            >
              Search
            </button>
          </form>

          {/* Results display */}
          <div className="space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <span className="text-xs text-neutral-600 font-mono mt-2">Crawling codebase chunks...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-xs text-red-400 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {searched && !loading && !error && results.length === 0 && (
              <div className="text-center py-10 bg-neutral-900/5 border border-neutral-900 rounded-xl">
                <p className="text-xs font-semibold text-neutral-400">No search results found</p>
                <p className="text-[10px] text-neutral-600 mt-1">Try other search terms or make sure spelling is correct.</p>
              </div>
            )}

            {results.map((result, i) => (
              <div key={i} className="glass-panel rounded-xl border border-neutral-850 overflow-hidden flex flex-col text-left">
                {/* Header info */}
                <div className="px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5 truncate">
                    <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate" title={result.filePath}>{result.filePath}</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                    Lines {result.startLine}-{result.endLine}
                  </span>
                </div>

                {/* Match lines container */}
                <div className="p-4 bg-neutral-950/20 space-y-3">
                  <div className="space-y-1.5 font-mono text-[11px] leading-relaxed text-neutral-400">
                    {result.matches.map((match, j) => (
                      <div key={j} className="flex gap-4 hover:bg-neutral-900/30 p-1 rounded transition-all">
                        <span className="text-neutral-600 w-8 select-none border-r border-neutral-900 shrink-0 text-right pr-2">
                          L{match.lineNumber}
                        </span>
                        <span className="break-all whitespace-pre-wrap select-text">
                          {/* Basic highlight on query term */}
                          {highlightMatch(match.content, query)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-neutral-900/60 flex justify-end">
                    <button
                      onClick={() => handleOpenCode(result.filePath, result.matches[0]?.lineNumber || result.startLine)}
                      className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>Inspect match in Editor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// Simple highlighter helper function
function highlightMatch(content = '', term = '') {
  if (!term) return content;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = content.split(regex);
  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={index} className="bg-primary/25 text-white font-semibold rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
