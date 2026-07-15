import React from 'react';

const segments = [
  { label: 'Healthy', value: 87, color: 'bg-emerald-500' },
  { label: 'Warning', value: 8, color: 'bg-amber-500' },
  { label: 'Issues', value: 5, color: 'bg-red-500' },
];

export default function ProjectHealth() {
  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Repository Health</h3>

      <div className="flex items-center justify-center mb-5">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#262626" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
              strokeDasharray="87 100"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-white">87%</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {segments.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-neutral-400">{label}</span>
            </div>
            <span className="text-neutral-300 font-mono">{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
