import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import Message from '../components/Chat/Message.jsx';
import ChatInput from '../components/Chat/ChatInput.jsx';
import TypingAnimation from '../components/Chat/TypingAnimation.jsx';
import CodeExplorer from '../components/Monaco/CodeExplorer.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import api from '../services/api.js';
import { MessageSquare, Bot, AlertCircle, LayoutGrid, Terminal } from 'lucide-react';

export default function Chat() {
  const { activeRepo, activeRepoLoading } = useRepository();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Monaco tabs state
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [highlightedLine, setHighlightedLine] = useState(null);

  const messagesEndRef = useRef(null);

  // Initialize welcome message when repo selection changes
  useEffect(() => {
    if (activeRepo) {
      setMessages([
        {
          role: 'model',
          content: `### Welcome to **${activeRepo.name}** AI Assistant!
I have indexed **${activeRepo.fileCount} files** in this codebase.

Here are a few questions you can ask me:
- **"Explain the folder structure of this project"**
- **"Where is the database connection handled?"**
- **"Show me the authentication middleware flow"**
- **"Explain how JWT tokens are generated and verified"**

Ask me anything, and click on citations to inspect the source code instantly!`,
          references: [],
        },
      ]);
      setOpenTabs([]);
      setActiveTab('');
      setHighlightedLine(null);
    } else {
      setMessages([]);
    }
  }, [activeRepo]);

  // Scroll to bottom of chat history on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeRepo || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError('');

    try {
      // Map history to RAG format (role & content)
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await api.post('/chat', {
        repositoryId: activeRepo._id,
        message: userMessage,
        chatHistory,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: data.answer,
          references: data.references || [],
        },
      ]);
    } catch (err) {
      console.error('Chat request failed:', err);
      setError(err.response?.data?.message || 'Failed to generate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Tabs navigation callback
  const handleTabChange = (filePath) => {
    setActiveTab(filePath);
    setHighlightedLine(null);
  };

  // Tabs close callback
  const handleTabClose = (filePath) => {
    const updatedTabs = openTabs.filter((t) => t !== filePath);
    setOpenTabs(updatedTabs);
    if (activeTab === filePath) {
      setActiveTab(updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1] : '');
    }
    setHighlightedLine(null);
  };

  // References click handler: opens file and highlights line
  const handleReferenceClick = (filePath, line) => {
    if (!openTabs.includes(filePath)) {
      setOpenTabs((prev) => [...prev, filePath]);
    }
    setActiveTab(filePath);
    setHighlightedLine(line);
  };

  const handleFileSelect = (filePath) => {
    if (!openTabs.includes(filePath)) {
      setOpenTabs((prev) => [...prev, filePath]);
    }
    setActiveTab(filePath);
    setHighlightedLine(null);
  };

  // Intercept query parameters (e.g. from Project Manager task board or Dashboard recent queries)
  useEffect(() => {
    if (activeRepo) {
      const query = new URLSearchParams(window.location.search);
      const openPath = query.get('open');
      const lineVal = query.get('line');
      const queryVal = query.get('query');

      if (openPath) {
        const line = lineVal ? parseInt(lineVal, 10) : 1;
        // Delay slightly to allow Monaco workspace component mounting
        setTimeout(() => {
          handleReferenceClick(openPath, line);
        }, 300);
      }

      if (queryVal) {
        setInput(queryVal);
      }

      if (openPath || queryVal) {
        // Clear search parameters to clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [activeRepo]);

  return (
    <MainLayout
      title="Code Coordinator Chat"
      subtitle={
        activeRepo
          ? `Interactive coding sessions on ${activeRepo.fullName}`
          : 'Consult RepoMind intelligence regarding repository operations'
      }
    >
      {activeRepoLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl space-y-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Loading active repository context...</p>
        </div>
      ) : !activeRepo ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <MessageSquare className="w-10 h-10 text-neutral-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">No Active Repository</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Please connect and set an active repository in the Repositories panel first to begin RAG code discussion sessions.
          </p>
        </div>
      ) : activeRepo.status !== 'indexed' ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 animate-pulse mb-3">
            <Bot className="w-4.5 h-4.5 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Codebase indexing is incomplete</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Wait for indexation to resolve to complete. Current status: **{activeRepo.status}**.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-11rem)] gap-5">
          {/* Left panel: ChatGPT UI */}
          <div className="glass-panel rounded-xl flex flex-col h-full border border-neutral-800/40 shadow-xl overflow-hidden bg-neutral-950/10">
            {/* Header */}
            <div className="p-4 bg-neutral-950/80 border-b border-neutral-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-white">Discussion logs</span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <Message key={i} message={msg} onReferenceClick={handleReferenceClick} />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full border border-purple-500/20 bg-purple-950/20 flex items-center justify-center text-purple-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <TypingAnimation />
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 bg-neutral-950/80 border-t border-neutral-900">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSendMessage}
                disabled={loading}
                placeholder="Ask about authentication flow, database connection, imports..."
              />
            </div>
          </div>

          {/* Right panel: Monaco code visualizer */}
          <div className="h-full">
            <CodeExplorer
              openTabs={openTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              onFileSelect={handleFileSelect}
              highlightedLine={highlightedLine}
              setHighlightedLine={setHighlightedLine}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
