import React, { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { CheckCircle2, XCircle, Settings as SettingsIcon } from 'lucide-react';

const envItems = [
  { key: 'MONGODB_URL', label: 'MongoDB', phase: 'Phase 0' },
  { key: 'JWT_SECRET', label: 'JWT Secret', phase: 'Phase 1' },
  { key: 'GITHUB_CLIENT_ID', label: 'GitHub Client ID', phase: 'Phase 1' },
  { key: 'GITHUB_CLIENT_SECRET', label: 'GitHub Client Secret', phase: 'Phase 1' },
  { key: 'GEMINI_API_KEY', label: 'Gemini API', phase: 'Phase 3' },
  { key: 'PINECONE_API_KEY', label: 'Pinecone API', phase: 'Phase 3' },
  { key: 'PINECONE_INDEX', label: 'Pinecone Index', phase: 'Phase 3' },
];

export default function Settings() {
  const { user, oauthConfigured } = useAuth();
  const [apiHealthy, setApiHealthy] = useState(false);

  useEffect(() => {
    api.get('/health')
      .then(() => setApiHealthy(true))
      .catch(() => setApiHealthy(false));
  }, []);

  return (
    <MainLayout title="Settings" subtitle="Environment & account configuration">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
        {/* Profile */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-purple-400" />
            Profile
          </h3>
          {user && (
            <div className="flex items-center gap-4">
              <img src={user.avatar} alt="" className="w-14 h-14 rounded-full border border-neutral-700" />
              <div>
                <p className="font-medium text-white">{user.displayName}</p>
                <p className="text-sm text-neutral-400">@{user.username}</p>
                {user.email && <p className="text-xs text-neutral-500 mt-1">{user.email}</p>}
              </div>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <StatusRow label="API Server" ok={apiHealthy} />
            <StatusRow label="GitHub OAuth" ok={oauthConfigured} />
            <StatusRow label="Authenticated" ok={!!user} />
          </div>
        </div>

        {/* Env Checklist */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-2">Environment Variables</h3>
          <p className="text-xs text-neutral-500 mb-4">
            Add these to <code className="text-purple-400">backend/.env</code> one by one.
            See <code className="text-purple-400">.env.example</code> for the full list.
          </p>
          <div className="space-y-2">
            {envItems.map(({ key, label, phase }) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/40"
              >
                <div>
                  <p className="text-sm text-neutral-300 font-mono">{key}</p>
                  <p className="text-xs text-neutral-600">{label} — {phase}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 text-neutral-500 font-mono">
                  pending
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function StatusRow({ label, ok }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {ok ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Active</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-neutral-600" />
            <span className="text-xs text-neutral-600">Not configured</span>
          </>
        )}
      </div>
    </div>
  );
}
