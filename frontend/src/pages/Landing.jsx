import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Github,
  ArrowRight,
  Sparkles,
  Code2,
  GitBranch,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  { icon: Code2, title: 'Code Intelligence', desc: 'Understand your entire codebase instantly' },
  { icon: GitBranch, title: 'Repo Memory', desc: 'Never forget why a feature was built' },
  { icon: MessageSquare, title: 'AI Chat', desc: 'Ask questions about any file or flow' },
  { icon: Shield, title: 'Secure OAuth', desc: 'GitHub login with JWT protection' },
];

const trusted = ['GitHub', 'MongoDB', 'Gemini', 'Pinecone', 'React'];

import logo from '../assets/logos/logo1.png';

export default function Landing() {
  const { loginWithGitHub, oauthConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      <div className="glow-spot top-0 left-1/4" />
      <div className="glow-spot bottom-0 right-1/4" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-neutral-950 border border-neutral-900 shadow-glass-glow">
            <img src={logo} alt="RepoMind Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-extrabold text-xl text-white">RepoMind</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#trusted" className="hover:text-white transition-colors">Integrations</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-neutral-300 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <button
            onClick={loginWithGitHub}
            disabled={!oauthConfigured}
            className="text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Engineering Memory
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-black text-white leading-tight max-w-4xl mx-auto mb-6">
          Permanent Memory for{' '}
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Your Entire Codebase
          </span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect your GitHub repositories and let AI understand your project structure,
          authentication flows, documentation, and engineering decisions — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={loginWithGitHub}
            disabled={!oauthConfigured}
            className="flex items-center gap-3 px-8 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-all hover:shadow-glass-glow"
          >
            <Github className="w-5 h-5" />
            Connect GitHub
          </button>
          <Link
            to="/login"
            className="flex items-center gap-2 px-8 py-3.5 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white rounded-xl font-medium transition-colors"
          >
            View Demo
          </Link>
        </div>

        {/* Hero visual */}
        <div className="relative max-w-3xl mx-auto">
          <div className="glass-panel rounded-2xl p-1 shadow-glass-glow">
            <div className="bg-neutral-900 rounded-xl p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-neutral-500 font-mono">repomind — dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['Repositories', 'Indexed Files', 'AI Chats'].map((label) => (
                  <div key={label} className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
                    <p className="text-[10px] text-neutral-500 uppercase">{label}</p>
                    <p className="text-lg font-bold text-white mt-1">—</p>
                  </div>
                ))}
              </div>
              <div className="bg-neutral-800/30 rounded-lg p-3 border border-neutral-700/30">
                <p className="text-xs text-purple-400 font-mono">{'>'} Where is JWT verified?</p>
                <p className="text-xs text-neutral-400 mt-2 font-mono">→ middleware/auth.js:42</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-display font-bold text-white text-center mb-12">
          Everything your engineering team needs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel rounded-xl p-5 hover:border-purple-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-neutral-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted */}
      <section id="trusted" className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-neutral-800/40">
        <p className="text-center text-xs text-neutral-500 uppercase tracking-widest mb-8">
          Built with
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {trusted.map((name) => (
            <span key={name} className="text-neutral-500 font-mono text-sm hover:text-purple-400 transition-colors">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800/40 py-8 text-center text-xs text-neutral-600 font-mono">
        &copy; 2026 RepoMind — AI Engineering Memory Platform
      </footer>
    </div>
  );
}
