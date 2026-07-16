import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api.js';

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

export default function CommitModal({
  isOpen,
  onClose,
  activeRepo,
  selectedCategory,
  draftContent,
  onCommitSuccess,
}) {
  const [filePath, setFilePath] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState('');
  const [commitStatus, setCommitStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'

  useEffect(() => {
    if (isOpen) {
      setCommitError('');
      setCommitStatus('idle');
      const defaultPath = defaultPaths[selectedCategory] || 'README.md';
      setFilePath(defaultPath);
      setCommitMessage(`docs: update ${defaultPath} via RepoMind`);
    }
  }, [isOpen, selectedCategory]);

  const handleCommitToGitHub = async () => {
    setCommitting(true);
    setCommitError('');
    setCommitStatus('processing');
    try {
      await api.post(`/repositories/${activeRepo._id}/commit`, {
        filePath,
        content: draftContent,
        commitMessage,
      });
      setCommitStatus('success');
      if (onCommitSuccess) {
        onCommitSuccess(draftContent);
      }
    } catch (err) {
      console.error('Failed to commit to GitHub:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit commit. Verify repository branch rules or push permissions.';
      setCommitError(errMsg);
      setCommitStatus('error');
    } finally {
      setCommitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-950 border border-neutral-850 rounded-2xl w-full max-w-md overflow-hidden shadow-theme-glow text-left flex flex-col relative"
          >
            {/* Top status glow line */}
            <div className={`h-1.5 w-full transition-colors duration-300 ${
              commitStatus === 'success' ? 'bg-emerald-500' :
              commitStatus === 'error' ? 'bg-red-500' :
              commitStatus === 'processing' ? 'bg-purple-500 animate-pulse' : 'bg-primary'
            }`} />

            <div className="p-6 space-y-4">
              {commitStatus === 'idle' && (
                <>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">Commit Changes to GitHub</h3>
                    <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
                      Review the destination file and commit message before saving your documentation. RepoMind will create a Git commit and push it directly to the selected branch of your connected repository.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-500 mb-1.5">
                        Repository File Path
                      </label>
                      <input
                        type="text"
                        value={filePath}
                        onChange={(e) => setFilePath(e.target.value)}
                        placeholder="e.g. README.md"
                        className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-primary/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-500 mb-1.5">
                        Git Commit Message
                      </label>
                      <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="e.g. docs: update README.md via RepoMind"
                        rows={2}
                        className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-primary/50 resize-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleClose}
                      className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCommitToGitHub}
                      disabled={!filePath || !draftContent}
                      className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg text-xs transition-colors shadow-theme-glow disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>Commit Changes</span>
                    </button>
                  </div>
                </>
              )}

              {commitStatus === 'processing' && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-neutral-900" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-purple-500 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Creating Commit...</h4>
                    <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed max-w-[280px] mx-auto">
                      Creating commit and pushing changes to GitHub...
                    </p>
                  </div>
                </div>
              )}

              {commitStatus === 'success' && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Changes Committed Successfully</h4>
                    <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed max-w-[320px] mx-auto bg-neutral-900/40 border border-neutral-900/60 p-2.5 rounded-lg font-mono">
                      Your documentation has been committed successfully. The latest version is now available in your repository.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-6 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-theme-glow"
                  >
                    Continue
                  </button>
                </div>
              )}

              {commitStatus === 'error' && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-red-955/40 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display text-red-400">Commit Failed</h4>
                    <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed max-w-[320px] mx-auto">
                      RepoMind couldn't complete the commit. Check the details below, make any necessary changes, and try again.
                    </p>
                    <p className="text-[10px] text-red-400/90 mt-2 leading-relaxed max-w-[320px] mx-auto bg-red-955/10 border border-red-955/20 p-3 rounded-lg font-mono text-left max-h-[120px] overflow-y-auto">
                      {commitError}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClose}
                      className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleCommitToGitHub}
                      className="px-4 py-1.5 bg-red-650 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
