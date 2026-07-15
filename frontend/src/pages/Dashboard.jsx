import React from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import Stats from '../components/Dashboard/Stats.jsx';
import Activity from '../components/Dashboard/Activity.jsx';
import ProjectHealth from '../components/Dashboard/ProjectHealth.jsx';
import QuickActions from '../components/Dashboard/QuickActions.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { MessageSquare } from 'lucide-react';

const recentChats = [
  { query: 'Where is JWT token verified?', time: 'After repo connect' },
  { query: 'Show authentication middleware flow', time: 'After repo connect' },
  { query: 'List all API endpoints', time: 'After repo connect' },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <MainLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.displayName || 'Developer'}`}
    >
      <Stats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2">
          <Activity />
        </div>
        <ProjectHealth />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <QuickActions />

        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Recent Chats
          </h3>
          <div className="space-y-3">
            {recentChats.map((chat) => (
              <div
                key={chat.query}
                className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/40"
              >
                <p className="text-xs text-neutral-300">{chat.query}</p>
                <p className="text-[10px] text-neutral-600 mt-1 font-mono">{chat.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
