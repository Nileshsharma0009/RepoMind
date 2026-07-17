import React, { useState, useEffect } from 'react';
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
  Terminal,
  Braces,
  FolderTree,
  Network,
  History,
  Settings,
  Cpu,
  Database,
  Check,
  Zap,
  Users,
  GraduationCap,
  Rocket,
  Compass,
  Bug,
  Eye,
  Play,
  FileCode,
  Loader2,
  Kanban,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logos/logo1.png';

// Import ReactFlow for interactive animation graph
import ReactFlow, { Handle, Position, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

// Import Framer Motion for premium animations
import { motion } from 'framer-motion';

// ReactFlow Custom Node Component
const MindmapCustomNode = ({ data }) => {
  const isCenter = data.id === 'center';

  if (isCenter) {
    return (
      <div className="relative flex items-center justify-center w-24 h-24 md:w-28 md:h-28 bg-neutral-950 border-2 border-purple-500 rounded-full shadow-glass-glow animate-pulse">
        <img src={logo} alt="RepoMind" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
        <Handle type="target" id="left" position={Position.Left} style={{ opacity: 0 }} />
        <Handle type="source" id="right" position={Position.Right} style={{ opacity: 0 }} />
      </div>
    );
  }

  const dotColor = data.side === 'left' ? 'bg-purple-500' : 'bg-emerald-500';

  return (
    <div className="px-4 py-2.5 bg-neutral-950/90 border border-neutral-900 hover:border-primary/45 rounded-xl text-[10px] md:text-[11px] font-mono text-neutral-300 font-semibold flex items-center gap-2.5 transition-all shadow-md select-none min-w-[140px] md:min-w-[160px] cursor-grab active:cursor-grabbing">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{data.label}</span>
      {data.side === 'left' ? (
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      ) : (
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      )}
    </div>
  );
};

const nodeTypes = {
  mindmap: MindmapCustomNode,
};

const initialNodes = [
  {
    id: 'center',
    type: 'mindmap',
    position: { x: 340, y: 150 },
    data: { id: 'center' },
  },
  // Left side
  { id: 'folders', type: 'mindmap', position: { x: 40, y: 15 }, data: { label: 'Folders', side: 'left' } },
  { id: 'files', type: 'mindmap', position: { x: 40, y: 80 }, data: { label: 'Files', side: 'left' } },
  { id: 'functions', type: 'mindmap', position: { x: 40, y: 145 }, data: { label: 'Functions', side: 'left' } },
  { id: 'classes', type: 'mindmap', position: { x: 40, y: 210 }, data: { label: 'Classes', side: 'left' } },
  { id: 'auth', type: 'mindmap', position: { x: 40, y: 275 }, data: { label: 'Authentication', side: 'left' } },
  { id: 'deps', type: 'mindmap', position: { x: 40, y: 340 }, data: { label: 'Dependencies', side: 'left' } },
  // Right side
  { id: 'db', type: 'mindmap', position: { x: 610, y: 15 }, data: { label: 'Database', side: 'right' } },
  { id: 'apis', type: 'mindmap', position: { x: 610, y: 80 }, data: { label: 'APIs', side: 'right' } },
  { id: 'commits', type: 'mindmap', position: { x: 610, y: 145 }, data: { label: 'Commits', side: 'right' } },
  { id: 'issues', type: 'mindmap', position: { x: 610, y: 210 }, data: { label: 'Issues', side: 'right' } },
  { id: 'docs', type: 'mindmap', position: { x: 610, y: 275 }, data: { label: 'Documentation', side: 'right' } },
  { id: 'envs', type: 'mindmap', position: { x: 610, y: 340 }, data: { label: 'Environment Variables', side: 'right' } },
];

const initialEdges = [
  // Left to Center
  { id: 'e-folders', source: 'folders', target: 'center', targetHandle: 'left', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.8 } },
  { id: 'e-files', source: 'files', target: 'center', targetHandle: 'left', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.8 } },
  { id: 'e-functions', source: 'functions', target: 'center', targetHandle: 'left', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.8 } },
  { id: 'e-classes', source: 'classes', target: 'center', targetHandle: 'left', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.8 } },
  { id: 'e-auth', source: 'auth', target: 'center', targetHandle: 'left', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.8 } },
  { id: 'e-deps', source: 'deps', target: 'center', targetHandle: 'left', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.8 } },
  // Center to Right
  { id: 'e-db', source: 'center', sourceHandle: 'right', target: 'db', animated: true, style: { stroke: '#10b981', strokeWidth: 1.8 } },
  { id: 'e-apis', source: 'center', sourceHandle: 'right', target: 'apis', animated: true, style: { stroke: '#10b981', strokeWidth: 1.8 } },
  { id: 'e-commits', source: 'center', sourceHandle: 'right', target: 'commits', animated: true, style: { stroke: '#10b981', strokeWidth: 1.8 } },
  { id: 'e-issues', source: 'center', sourceHandle: 'right', target: 'issues', animated: true, style: { stroke: '#10b981', strokeWidth: 1.8 } },
  { id: 'e-docs', source: 'center', sourceHandle: 'right', target: 'docs', animated: true, style: { stroke: '#10b981', strokeWidth: 1.8 } },
  { id: 'e-envs', source: 'center', sourceHandle: 'right', target: 'envs', animated: true, style: { stroke: '#10b981', strokeWidth: 1.8 } },
];

// Features / Living Knowledge Base
const knowledgeBaseItems = [
  { icon: Code2, title: 'Source Code', desc: 'Indexes files, exports and functions.', color: 'text-purple-400 border-purple-500/10' },
  { icon: Braces, title: 'APIs', desc: 'Maps endpoint routes and handlers.', color: 'text-emerald-400 border-emerald-500/10' },
  { icon: FileCode, title: 'Documentation', desc: 'Assembles markdown manuals.', color: 'text-sky-400 border-sky-500/10' },
  { icon: FolderTree, title: 'Folder Structure', desc: 'Segmented codebase directories.', color: 'text-amber-400 border-amber-500/10' },
  { icon: Network, title: 'Dependencies', desc: 'Tracks module dependency graph.', color: 'text-pink-400 border-pink-500/10' },
  { icon: Shield, title: 'Authentication', desc: 'Audits access middleware tokens.', color: 'text-indigo-400 border-indigo-500/10' },
  { icon: History, title: 'Git History', desc: 'Inspects commits, issues and PRs.', color: 'text-red-400 border-red-500/10' },
  { icon: Settings, title: 'Configuration', desc: 'Resolves setup environment keys.', color: 'text-cyan-400 border-cyan-500/10' },
];

// How RepoMind Works
const howItWorks = [
  { step: '1', title: 'Connect GitHub', desc: 'Secure OAuth connection in seconds', icon: Github },
  { step: '2', title: 'Analyze Repository', desc: 'Deep scan of your code, docs and configurations', icon: Compass },
  { step: '3', title: 'Build Repository Memory', desc: 'AI creates a knowledge graph and vector database', icon: Brain },
  { step: '4', title: 'AI Agents Collaborate', desc: 'Specialized agents work together to understand', icon: Users },
  { step: '5', title: 'Ask Anything', desc: 'Get accurate, contextual answers instantly', icon: MessageSquare },
];

// Meet Your AI Engineering Team
const aiTeam = [
  { icon: Eye, title: 'Repository Intelligence', desc: 'Understands files, folders and code organization.' },
  { icon: Network, title: 'Architecture Expert', desc: 'Analyzes system design, flows and dependencies.' },
  { icon: Bug, title: 'Debugger', desc: 'Detects issues, code smells and provides solutions.' },
  { icon: FileCode, title: 'Documentation Writer', desc: 'Generates and maintains accurate docs.' },
  { icon: Kanban, title: 'Project Manager', desc: 'Tracks commits, PRs and project progress.' },
  { icon: MessageSquare, title: 'Search Assistant', desc: 'Finds answers in seconds across your codebase.' },
];

// Why Developers Love RepoMind
const whyLove = [
  { icon: Compass, label: 'Understand Any Repository' },
  { icon: FileCode, label: 'Generate Documentation' },
  { icon: Network, label: 'Review Architecture' },
  { icon: Bug, label: 'Find Bugs & Issues' },
  { icon: Braces, label: 'Explain APIs & Code' },
  { icon: Users, label: 'Reduce Onboarding Time' },
  { icon: Zap, label: 'Navigate Faster' },
  { icon: Brain, label: 'Repository Memory That Never Forgets' },
];

// Teams
const teams = [
  { icon: LayoutGridIcon, label: 'Frontend', color: 'text-purple-400 bg-purple-950/20' },
  { icon: Database, label: 'Backend', color: 'text-emerald-400 bg-emerald-950/20' },
  { icon: Network, label: 'DevOps', color: 'text-pink-400 bg-pink-950/20' },
  { icon: Shield, label: 'QA', color: 'text-amber-400 bg-amber-950/20' },
  { icon: Code2, label: 'Open Source', color: 'text-sky-400 bg-sky-950/20' },
  { icon: GraduationCap, label: 'Students', color: 'text-indigo-400 bg-indigo-950/20' },
  { icon: Rocket, label: 'Startups', color: 'text-red-400 bg-red-950/20' },
];

// Future workflow steps
const futureSteps = [
  { label: 'Repository Intelligence', icon: FolderTree },
  { label: 'Multi-Agent Collaboration', icon: Users },
  { label: 'Architecture Planning', icon: Network },
  { label: 'Automated Documentation', icon: FileCode },
  { label: 'Engineering Decisions', icon: Brain },
  { label: 'Self-Updating Memory', icon: History },
];

function LayoutGridIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

// Framer Motion Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Landing() {
  const { loginWithGitHub, oauthConfigured } = useAuth();

  // ReactFlow hook instances
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Animation states for the dynamic See RepoMind in Action terminals
  const [terminalStep, setTerminalStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalStep((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden font-sans select-none">
      {/* Background neon glow backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-[400px] h-[400px] bg-violet-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Styled inline scroll animations */}
      <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-dash {
          stroke-dasharray: 5;
          animation: flowDash 1.5s linear infinite;
        }
        /* Style adjustments to make ReactFlow controls look premium */
        .react-flow__handle {
          background: transparent !important;
          border: none !important;
        }
        .react-flow__edge-path {
          stroke-dasharray: 5;
          animation: flowDash 2.5s linear infinite;
        }
      `}</style>

      {/* Header Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-neutral-950 border border-neutral-900 shadow-glass-glow">
            <img src={logo} alt="RepoMind Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">RepoMind</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-neutral-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#features" className="hover:text-white transition-colors">Integrations</a>
          <a href="#documentation" className="hover:text-white transition-colors">Documentation</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-neutral-355 hover:text-white transition-colors px-4 py-2 font-medium"
          >
            Sign in
          </Link>
          <motion.button
            onClick={loginWithGitHub}
            disabled={!oauthConfigured}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-theme-glow"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-8 animate-pulse"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Engineering Memory
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl font-display font-black text-white leading-tight max-w-4xl mx-auto mb-6 tracking-tight"
        >
          Permanent Memory for{' '}
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Your Entire Codebase
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Connect your GitHub repositories and let AI understand your project structure,
          authentication flows, documentation, and engineering decisions — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <motion.button
            onClick={loginWithGitHub}
            disabled={!oauthConfigured}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-8 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base transition-all hover:shadow-glass-glow shadow-theme-glow"
          >
            <Github className="w-5 h-5" />
            Connect GitHub
          </motion.button>
          <Link
            to="/login"
            className="flex items-center gap-2 px-8 py-3.5 border border-neutral-700 hover:border-neutral-500 text-neutral-350 hover:text-white rounded-xl font-medium transition-colors"
          >
            View Demo
          </Link>
        </motion.div>
      </section>

      {/* SECTION 1: Your Repository Becomes a Living Knowledge Base */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center border-t border-neutral-900/60">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-bold text-white tracking-tight"
        >
          Your Repository Becomes a Living Knowledge Base
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-neutral-450 text-sm mt-2 max-w-xl mx-auto"
        >
          RepoMind analyzes your entire codebase and builds a deep understanding of your project.
        </motion.p>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-12 text-left"
        >
          {knowledgeBaseItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={slideUp}
                whileHover={{ y: -6, scale: 1.02, borderColor: 'rgba(147, 51, 234, 0.35)', backgroundColor: 'rgba(147, 51, 234, 0.05)' }}
                className="glass-panel p-4 rounded-xl border border-neutral-900/60 bg-neutral-950/40 transition-all flex flex-col justify-between group h-36 cursor-default"
              >
                <div className={`p-2 rounded-lg w-9 h-9 flex items-center justify-center bg-neutral-900 group-hover:bg-neutral-950 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide mt-3">{item.title}</h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-normal">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* SECTION 2: How RepoMind Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center border-t border-neutral-900/60">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-bold text-white tracking-tight"
        >
          How RepoMind Works
        </motion.h2>
        <div className="relative mt-16">
          {/* Connecting dashed arrows for desktop */}
          <div className="hidden lg:block absolute top-7 left-10 right-10 z-0 h-0.5">
            <svg className="w-full h-8 overflow-visible" fill="none">
              <path
                d="M 50 10 L 950 10"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                className="animate-flow-dash"
              />
            </svg>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10 text-left"
          >
            {howItWorks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={slideUp}
                  className="flex flex-col items-center lg:items-start text-center lg:text-left group"
                >
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="relative"
                  >
                    <div className="w-14 h-14 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-white font-mono font-bold text-base shadow-glass-glow group-hover:border-primary/50 group-hover:shadow-theme-glow transition-all">
                      <Icon className="w-6 h-6 text-primary shrink-0" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white font-mono">
                      {item.step}
                    </span>
                  </motion.div>
                  <h4 className="text-sm font-bold text-white mt-4 tracking-wide">{item.title}</h4>
                  <p className="text-[11px] text-neutral-400 mt-2 max-w-xs leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: Meet Your AI Engineering Team */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center border-t border-neutral-900/60">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-bold text-white tracking-tight"
        >
          Meet Your AI Engineering Team
        </motion.h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12 text-left"
        >
          {aiTeam.map((team, idx) => {
            const Icon = team.icon;
            return (
              <motion.div
                key={idx}
                variants={scaleIn}
                whileHover={{ y: -5, borderColor: 'rgba(147, 51, 234, 0.4)', backgroundColor: 'rgba(147, 51, 234, 0.03)' }}
                className="glass-panel p-5 rounded-xl border border-neutral-900 bg-neutral-950/20 transition-all flex flex-col justify-between group h-40 cursor-default"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 w-10 h-10 flex items-center justify-center text-primary group-hover:bg-primary/25 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{team.title}</h4>
                  <p className="text-[10px] text-neutral-500 mt-1.5 leading-normal">{team.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* SECTION 4: Everything RepoMind Understands (Interactive ReactFlow Graph) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center border-t border-neutral-900/60 select-none">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-bold text-white tracking-tight"
        >
          Everything RepoMind Understands
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-neutral-455 text-xs mt-2 max-w-xl mx-auto"
        >
          Explore and drag codebase properties linked directly to central memory indexes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mt-12 max-w-4xl mx-auto h-[450px] border border-neutral-900 bg-neutral-950/30 rounded-2xl overflow-hidden shadow-inner"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
          />
        </motion.div>
      </section>

      {/* SECTION 5: See RepoMind in Action (Terminals) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center border-t border-neutral-900/60">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-bold text-white tracking-tight"
        >
          See RepoMind in Action
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-16 text-left font-mono">
          {/* Terminal 1: Command query console */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel border border-neutral-855 rounded-xl overflow-hidden flex flex-col h-80"
          >
            <div className="p-3 bg-neutral-955/80 border-b border-neutral-900 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[10px] text-neutral-500 ml-2">repomind — RAG query console</span>
            </div>
            <div className="flex-1 p-5 space-y-3.5 bg-neutral-950/40 text-xs overflow-y-auto">
              <div className="flex gap-2">
                <span className="text-purple-400 font-semibold">{'>'}</span>
                <span className="text-white">Where is JWT verified?</span>
              </div>

              {terminalStep >= 1 && (
                <div className="text-neutral-500 animate-pulse flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                  <span>analyzing repository indexing schemas...</span>
                </div>
              )}

              {terminalStep >= 2 && (
                <div className="space-y-2 pl-4 text-neutral-350">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 font-bold">#1</span>
                    <div>
                      <span className="text-white font-semibold">middleware/auth.middleware.js:9</span>
                      <p className="text-[10px] text-neutral-550 mt-0.5">JWT token verified using jsonwebtoken.verify()</p>
                    </div>
                  </div>
                </div>
              )}

              {terminalStep >= 3 && (
                <div className="space-y-2 pl-4 text-neutral-350">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 font-bold">#2</span>
                    <div>
                      <span className="text-white font-semibold">auth.controller.js:15</span>
                      <p className="text-[10px] text-neutral-555 mt-0.5">Token signed and returned on callback redirect</p>
                    </div>
                  </div>
                </div>
              )}

              {terminalStep >= 4 && (
                <div className="space-y-2 pl-4 text-neutral-350">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 font-bold">#3</span>
                    <div>
                      <span className="text-white font-semibold">auth.routes.js:18</span>
                      <p className="text-[10px] text-neutral-555 mt-0.5">Router endpoints protected using protect middleware</p>
                    </div>
                  </div>
                </div>
              )}

              {terminalStep >= 5 && (
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>Found 3 relevant locations in 234ms</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Terminal 2: Flow diagram animation console */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel border border-neutral-855 rounded-xl overflow-hidden flex flex-col h-80"
          >
            <div className="p-3 bg-neutral-955/80 border-b border-neutral-900 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[10px] text-neutral-500 ml-2">repomind — routing layout flow</span>
            </div>
            <div className="flex-1 p-5 bg-neutral-950/40 text-xs flex flex-col justify-between overflow-hidden">
              <div className="flex gap-2">
                <span className="text-purple-400 font-semibold">{'>'}</span>
                <span className="text-white">Explain authentication flow</span>
              </div>

              {/* Simple inline visual flowchart nodes */}
              <div className="flex-1 flex flex-col justify-center items-center gap-6 mt-2 relative">
                <div className="flex items-center justify-center gap-4 w-full">
                  <div className={`px-3 py-1.5 rounded-lg border text-center transition-all ${
                    terminalStep === 0 ? 'bg-purple-950/40 border-purple-500 shadow-theme-glow text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-555'
                  }`}>
                    User
                  </div>
                  <div className="text-neutral-700">➔</div>
                  <div className={`px-3 py-1.5 rounded-lg border text-center transition-all ${
                    terminalStep === 1 || terminalStep === 2 ? 'bg-purple-950/40 border-purple-500 shadow-theme-glow text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-555'
                  }`}>
                    Login
                  </div>
                  <div className="text-neutral-700">➔</div>
                  <div className={`px-3 py-1.5 rounded-lg border text-center transition-all ${
                    terminalStep === 3 ? 'bg-purple-950/40 border-purple-500 shadow-theme-glow text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-555'
                  }`}>
                    JWT Token
                  </div>
                  <div className="text-neutral-700">➔</div>
                  <div className={`px-3 py-1.5 rounded-lg border text-center transition-all ${
                    terminalStep === 4 || terminalStep === 5 ? 'bg-purple-950/40 border-purple-500 shadow-theme-glow text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-555'
                  }`}>
                    Protected Routes
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-6 w-0.5 border-l-2 border-dashed border-neutral-800" />
                  <div className={`px-4 py-1.5 rounded-lg border text-center transition-all mt-1 ${
                    terminalStep >= 4 ? 'bg-emerald-950/40 border-emerald-500 shadow-theme-glow text-white font-bold' : 'bg-neutral-950 border-neutral-850 text-neutral-555'
                  }`}>
                    Verify Token (middleware)
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 6: Why Developers Love RepoMind */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center border-t border-neutral-900/60">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-bold text-white tracking-tight"
        >
          Why Developers Love RepoMind
        </motion.h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 text-left"
        >
          {whyLove.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={slideUp}
                whileHover={{ scale: 1.03, borderColor: 'rgba(147, 51, 234, 0.3)' }}
                className="p-4 rounded-xl border border-neutral-900/80 bg-neutral-950/40 hover:bg-neutral-900/10 transition-all flex items-center gap-3 cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-semibold text-neutral-300 leading-tight">{item.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* SECTION 7: Built for Modern Engineering Teams */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-neutral-900/60 flex flex-col md:flex-row items-center justify-between gap-12 text-left">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <h2 className="text-3xl font-display font-bold text-white tracking-tight leading-tight">
            Built for Modern Engineering Teams
          </h2>
          <p className="text-neutral-455 text-sm mt-4 leading-relaxed font-sans">
            RepoMind adapts to every workflow and every team — from startups to open source developers and large scale enterprises.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full"
        >
          {teams.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={scaleIn}
                whileHover={{ y: -4, borderColor: 'rgba(147, 51, 234, 0.4)' }}
                className="glass-panel p-4 rounded-xl border border-neutral-900/60 bg-neutral-950/20 hover:bg-neutral-900/20 transition-all flex flex-col justify-between items-center text-center gap-3 cursor-default"
              >
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">{item.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* SECTION 8: Powered By Stack */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-neutral-900/60 text-center">
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-8">
          Powered By a Powerful Stack
        </p>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {['GitHub', 'Gemini AI', 'MongoDB', 'Pinecone', 'React', 'Node.js', 'Express.js'].map((stack, idx) => (
            <motion.div
              key={idx}
              variants={scaleIn}
              whileHover={{ scale: 1.05, borderColor: 'rgba(147, 51, 234, 0.3)' }}
              className="px-4 py-2 bg-neutral-950 border border-neutral-900 rounded-lg text-xs font-mono text-neutral-400 hover:text-white transition-all cursor-default"
            >
              {stack}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SECTION 9: The Future of Engineering */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center border-t border-neutral-900/60">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-display font-bold text-white tracking-tight"
          >
            The Future of Engineering
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-neutral-400 text-sm mt-3"
          >
            Today it understands your repository. Tomorrow it understands your engineering organization.
          </motion.p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-16 text-left relative"
        >
          {futureSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                variants={slideUp}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-955 flex items-center justify-center text-primary shadow-glass-glow mb-4">
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono px-2">{step.label}</h5>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* CTA Box */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-8 md:p-12 rounded-3xl border border-neutral-800 bg-gradient-to-br from-purple-950/20 via-neutral-950 to-indigo-950/20 text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-theme-glow relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-display font-black text-white leading-tight">
              Ready to give your repository a permanent memory?
            </h2>
            <p className="text-neutral-450 text-xs mt-3 leading-relaxed">
              Connect your GitHub account and experience the power of automated codebase indexing and contextual multi-agent intelligence.
            </p>
          </div>
          <motion.button
            onClick={loginWithGitHub}
            disabled={!oauthConfigured}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all hover:shadow-glass-glow shadow-theme-glow shrink-0"
          >
            <Github className="w-5 h-5" />
            Connect GitHub
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-900/60 py-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-neutral-950 border border-neutral-900">
            <img src={logo} alt="RepoMind Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-white tracking-tight">RepoMind</span>
        </div>

        <div className="flex items-center gap-8 text-[11px]">
          <a href="#how-it-works" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Integrations</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Contact</a>
        </div>

        <div>
          &copy; 2026 RepoMind. All rights reserved. ❤️
        </div>
      </footer>
    </div>
  );
}
