import React from 'react';

export default function TypingAnimation() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900/40 border border-neutral-800/40 rounded-2xl w-fit shadow-inner">
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
    </div>
  );
}
