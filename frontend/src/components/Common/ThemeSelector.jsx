import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Sparkles } from 'lucide-react';

const themes = [
  { name: 'purple', label: 'Dreamy Purple', class: 'bg-purple-600 border-purple-400' },
  { name: 'emerald', label: 'Emerald Mint', class: 'bg-emerald-600 border-emerald-400' },
  { name: 'cyberpunk', label: 'Cyberpunk Amber', class: 'bg-amber-500 border-amber-300' },
  { name: 'ocean', label: 'Deep Ocean', class: 'bg-sky-500 border-sky-300' },
  { name: 'crimson', label: 'Ruby Sunset', class: 'bg-rose-600 border-rose-400' },
];

export default function ThemeSelector() {
  const { theme, changeTheme } = useAuth();

  return (
    <div className="p-3 bg-neutral-900/40 border border-neutral-800/40 rounded-xl">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
          Theme Customization
        </span>
      </div>
      <div className="flex items-center gap-2">
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() => changeTheme(t.name)}
            title={t.label}
            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 relative ${t.class} ${
              theme === t.name
                ? 'scale-110 shadow-lg border-white ring-2 ring-primary/45'
                : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
            }`}
          >
            {theme === t.name && (
              <span className="absolute inset-0.5 rounded-full border border-white/40" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
