import React, { useState, useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import DependencyGraph from '../components/Architecture/DependencyGraph.jsx';
import MermaidRenderer from '../components/Mermaid/MermaidRenderer.jsx';
import { useRepository } from '../context/RepositoryContext.jsx';
import {
  Network,
  Info,
  FolderTree,
  Shield,
  Layers,
  Sparkles,
  Database,
  ArrowRightLeft,
  Route,
} from 'lucide-react';

const diagrams = {
  folders: {
    title: 'Folder Architecture',
    desc: 'Visual directory tree showing logical split of Backend/Frontend source folders.',
    icon: FolderTree,
    chart: `graph TD
  Root[RepoMind Project] --> Backend[backend]
  Root --> Frontend[frontend]
  
  Backend --> BSrc[src]
  BSrc --> BRoutes[routes]
  BSrc --> BControllers[controllers]
  BSrc --> BModels[models]
  BSrc --> BServices[services]
  BSrc --> BMiddleware[middleware]
  BSrc --> BConfig[config]
  
  Frontend --> FSrc[src]
  FSrc --> FPages[pages]
  FSrc --> FComponents[components]
  FSrc --> FContext[context]
  FSrc --> FServices[services]
  
  classDef primary fill:#9333ea,stroke:#3b0764,stroke-width:1px,color:#fff;
  classDef secondary fill:#18181b,stroke:#27272a,stroke-width:1px,color:#d4d4d8;
  class Root,BSrc,FSrc primary;
  class Backend,Frontend,BRoutes,BControllers,BModels,BServices,BMiddleware,BConfig,FPages,FComponents,FContext,FServices secondary;`
  },
  auth: {
    title: 'Authentication Sequence',
    desc: 'Sequence of GitHub OAuth callback redirection, token exchanges, and profile hydration.',
    icon: ArrowRightLeft,
    chart: `sequenceDiagram
  autonumber
  actor User as Developer User
  participant FE as Frontend Portal (5173)
  participant BE as Express API Server (5000)
  participant GH as GitHub OAuth Server
  participant DB as MongoDB Cluster
  
  User->>FE: Click "Login with GitHub"
  FE->>BE: Request login url
  BE->>FE: Return authorization URL
  FE->>GH: Redirect user to GitHub Login
  GH->>User: Request account consent
  User->>GH: Approves application
  GH->>BE: Redirect code to /api/auth/github/callback
  BE->>GH: Exchange code for accessToken
  GH->>BE: Return accessToken
  BE->>GH: Fetch user profile (API)
  GH->>BE: User email & avatar details
  BE->>DB: Upsert User record
  BE->>FE: Redirect browser to /auth/callback?token=JWT
  FE->>FE: Store JWT in localStorage
  FE->>BE: Get profile data (/api/auth/me)
  BE->>DB: Query User
  DB->>BE: Return user document
  BE->>FE: Hydrate AuthContext profile
  FE->>User: Show Dashboard screen`
  },
  api: {
    title: 'API Router Map',
    desc: 'Structural endpoint mapping showing routes directing to controller handlers.',
    icon: Route,
    chart: `graph LR
  Client((Client request)) --> Route[Express Router]
  Route --> Auth[/api/auth]
  Route --> Git[/api/github]
  Route --> Repo[/api/repositories]
  Route --> Chat[/api/chat]
  
  Auth --> AuthC[auth.controller.js]
  Git --> GitC[github.controller.js]
  Repo --> RepoC[repository.controller.js]
  Chat --> ChatC[chat.controller.js]
  
  RepoC --> RepoServ[repository.service.js]
  ChatC --> ChatServ[chat.service.js]
  
  classDef client fill:#10b981,stroke:#047857,color:#fff;
  classDef router fill:#9333ea,stroke:#3b0764,color:#fff;
  classDef controller fill:#0ea5e9,stroke:#0369a1,color:#fff;
  classDef service fill:#f59e0b,stroke:#b45309,color:#fff;
  
  class Client client;
  class Route,Auth,Git,Repo,Chat router;
  class AuthC,GitC,RepoC,ChatC controller;
  class RepoServ,ChatServ service;`
  },
  er: {
    title: 'Database ER Diagram',
    desc: 'Entity-relationship schema for User, connected Repository, and text code segmentations.',
    icon: Database,
    chart: `erDiagram
  User {
    string _id PK
    string githubId "unique index"
    string username
    string displayName
    string email
    string avatar
    date lastLoginAt
  }
  Repository {
    string _id PK
    string userId FK
    string githubId
    string name
    string fullName
    string defaultBranch
    string status "connected | indexing | indexed | failed"
    int fileCount
    object fileTree
  }
  RepositoryIndex {
    string _id PK
    string repositoryId FK
    string filePath
    int chunkIndex
    string content
    int startLine
    int endLine
    array embedding
  }
  
  User ||--o{ Repository : "owns"
  Repository ||--o{ RepositoryIndex : "has chunks"`
  }
};

export default function Architecture() {
  const { activeRepo, activeRepoLoading } = useRepository();
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' or 'mermaid'
  const [selectedDiagram, setSelectedDiagram] = useState('folders');

  const fileStats = useMemo(() => {
    if (!activeRepo?.parsedData?.files) return null;

    const files = activeRepo.parsedData.files;
    const totals = {
      routes: 0,
      controllers: 0,
      services: 0,
      models: 0,
      components: 0,
      other: 0,
    };

    files.forEach((f) => {
      // Map singular backend type classifications to plural frontend stats keys
      let typeKey = f.type;
      if (typeKey === 'route') typeKey = 'routes';
      else if (typeKey === 'controller') typeKey = 'controllers';
      else if (typeKey === 'service') typeKey = 'services';
      else if (typeKey === 'model') typeKey = 'models';
      else if (typeKey === 'component') typeKey = 'components';

      if (totals[typeKey] !== undefined) {
        totals[typeKey]++;
      } else {
        totals.other++;
      }
    });

    return totals;
  }, [activeRepo]);

  const CurrentDiagram = diagrams[selectedDiagram];

  return (
    <MainLayout
      title="Architecture Explorer"
      subtitle={
        activeRepo
          ? `Interactive codebase maps & diagrams for ${activeRepo.fullName}`
          : 'Visualize repository structures, routes, and database models'
      }
    >
      {activeRepoLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl space-y-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Loading repository maps...</p>
        </div>
      ) : !activeRepo ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/15 border border-neutral-850 rounded-xl max-w-xl mx-auto mt-10">
          <Network className="w-10 h-10 text-neutral-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">No Active Repository</h3>
          <p className="text-xs text-neutral-400 mt-1 text-center max-w-sm">
            Please connect and set an active repository in the Repositories panel first to generate visual flowcharts.
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
        <div className="space-y-6">
          {/* Summary Row */}
          {fileStats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <StatMiniCard label="Routes" count={fileStats.routes} color="border-emerald-500/30 text-emerald-400" />
              <StatMiniCard label="Controllers" count={fileStats.controllers} color="border-sky-500/30 text-sky-400" />
              <StatMiniCard label="Services" count={fileStats.services} color="border-purple-500/30 text-purple-400" />
              <StatMiniCard label="Models" count={fileStats.models} color="border-amber-500/30 text-amber-400" />
              <StatMiniCard label="Components" count={fileStats.components} color="border-pink-500/30 text-pink-400" />
              <StatMiniCard label="Others" count={fileStats.other} color="border-neutral-500/30 text-neutral-400" />
            </div>
          )}

          {/* Explorer Selector Tabs */}
          <div className="flex border-b border-neutral-900 gap-1.5 pb-px">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'graph'
                  ? 'border-primary text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-350'
              }`}
            >
              Interactive Dependency Graph
            </button>
            <button
              onClick={() => setActiveTab('mermaid')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'mermaid'
                  ? 'border-primary text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-350'
              }`}
            >
              Automatic System Diagrams
            </button>
          </div>

          {activeTab === 'graph' ? (
            /* React Flow Dependency Map */
            <DependencyGraph />
          ) : (
            /* Mermaid Live Visualizer */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Selector Menu */}
              <div className="space-y-2 lg:col-span-1">
                {Object.entries(diagrams).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedDiagram === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDiagram(key)}
                      className={`w-full p-3 text-left rounded-xl border flex gap-3 transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30 shadow-theme-glow text-white'
                          : 'bg-neutral-950/30 border-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold font-display">{config.title}</h5>
                        <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                          {config.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Render Canvas */}
              <div className="lg:col-span-3">
                <div className="p-3 bg-neutral-950/80 border border-neutral-900 rounded-t-xl text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{CurrentDiagram.title} Canvas</span>
                </div>
                <MermaidRenderer chart={CurrentDiagram.chart} />
              </div>
            </div>
          )}

          {/* Bottom details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-panel rounded-xl p-5 border-theme-glow">
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                Structural Overview
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                This explorer provides architectural breakdowns of the repository. Use the interactive dependency graph to trace actual module import linkages, or switch to system flowcharts to understand logical sequences, routers, and database design schemas.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5 border-theme-glow">
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-400" />
                Design Diagnostics
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Reviewing visual sequences highlights circular imports, bloated controller structures, or orphan database dependencies. Automatically generated maps provide an instant birds-eye reference during sprints.
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function StatMiniCard({ label, count, color }) {
  return (
    <div className={`p-3 bg-neutral-900/30 border rounded-xl flex flex-col justify-between ${color}`}>
      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-xl font-bold font-display mt-1">{count}</span>
    </div>
  );
}
