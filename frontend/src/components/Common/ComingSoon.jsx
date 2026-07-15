import React from 'react';
import MainLayout from '../Layout/MainLayout.jsx';
import { Construction } from 'lucide-react';

export default function ComingSoon({ title, subtitle, phase }) {
  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
          <Construction className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Coming Soon</h3>
        <p className="text-neutral-400 text-sm text-center max-w-md">
          This feature will be available in {phase}. Your authentication is set up and ready.
        </p>
      </div>
    </MainLayout>
  );
}
