import React, { useRef, useEffect } from 'react';
import { Send, ArrowUp } from 'lucide-react';

export default function ChatInput({ value, onChange, onSubmit, disabled, placeholder }) {
  const textareaRef = useRef(null);

  // Auto-resize input height based on content length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2.5 p-2 bg-neutral-900 border border-neutral-800 rounded-xl focus-within:border-primary/45 transition-colors relative shadow-glass-inner">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Ask a question about the repository...'}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-neutral-200 placeholder-neutral-600 outline-none resize-none py-1.5 px-2 max-h-40 min-h-[36px] overflow-y-auto leading-relaxed"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="p-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}
