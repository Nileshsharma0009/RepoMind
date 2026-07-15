import React, { useMemo } from 'react';
import { useRepository } from '../../context/RepositoryContext.jsx';
import { Layers } from 'lucide-react';

const typeColors = {
  route: 'bg-emerald-500',
  controller: 'bg-sky-500',
  service: 'bg-purple-500',
  model: 'bg-amber-500',
  component: 'bg-pink-500',
  middleware: 'bg-indigo-500',
  other: 'bg-neutral-500',
};

export default function ProjectHealth() {
  const { activeRepo } = useRepository();

  const typeDistribution = useMemo(() => {
    if (!activeRepo?.parsedData?.files || activeRepo.parsedData.files.length === 0) {
      return [];
    }

    const files = activeRepo.parsedData.files;
    const counts = {};
    let total = 0;

    files.forEach((f) => {
      const type = f.type || 'other';
      // Group config, style, markdown into 'other' to keep visualization clean
      const key = ['route', 'controller', 'service', 'model', 'component', 'middleware'].includes(type)
        ? type
        : 'other';

      counts[key] = (counts[key] || 0) + 1;
      total++;
    });

    const segments = Object.entries(counts).map(([label, count]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
      value: Math.round((count / total) * 100),
      color: typeColors[label] || 'bg-neutral-500',
    }));

    // Sort by percentage descending
    return segments.sort((a, b) => b.value - a.value);
  }, [activeRepo]);

  if (!activeRepo) {
    return (
      <div className="glass-panel rounded-xl p-5 flex flex-col items-center justify-center min-h-[250px]">
        <Layers className="w-8 h-8 text-neutral-600 mb-2" />
        <p className="text-xs text-neutral-400">No active repository selected.</p>
      </div>
    );
  }

  if (activeRepo.status !== 'indexed') {
    return (
      <div className="glass-panel rounded-xl p-5 flex flex-col items-center justify-center min-h-[250px] animate-pulse">
        <Layers className="w-8 h-8 text-primary/45 mb-2 animate-bounce" />
        <p className="text-xs text-neutral-400">Codebase parsing in progress...</p>
      </div>
    );
  }

  // Calculate SVGs stroke dash arrays if we want to draw the donut chart
  // For simplicity and premium looks, let's render a stack of horizontal progress indicator bars
  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-primary" />
          Codebase Structure
        </h3>

        {/* Visual progress track */}
        <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden flex mb-5">
          {typeDistribution.map((seg) => (
            <div
              key={seg.label}
              className={`${seg.color} h-full`}
              style={{ width: `${seg.value}%` }}
              title={`${seg.label}: ${seg.value}%`}
            />
          ))}
        </div>

        <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
          {typeDistribution.map(({ label, value, count, color }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                <span className="text-neutral-400 truncate">{label}</span>
                <span className="text-[10px] text-neutral-600">({count} files)</span>
              </div>
              <span className="text-neutral-300 font-mono font-semibold ml-2">{value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-neutral-600 font-mono mt-4 pt-3 border-t border-neutral-900">
        Total parsed modules: {activeRepo.fileCount}
      </div>
    </div>
  );
}
