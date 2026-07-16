import React, { useState } from 'react';
import { User, Brain, FileCode, CornerDownRight, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Message({ message, onReferenceClick }) {
  const isUser = message.role === 'user';
  const references = message.references || [];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      {/* Icon Avatar */}
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
        isUser ? 'bg-primary/15 border-primary/20 text-primary' : 'bg-purple-950/20 border-purple-500/20 text-purple-400'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
      </div>

      <div className="space-y-1">
        <div className={`relative group px-4 py-3 rounded-2xl border text-left ${
          isUser
            ? 'bg-primary/10 border-primary/25 rounded-tr-none text-white'
            : 'bg-neutral-900/40 border-neutral-850 rounded-tl-none text-neutral-300'
        }`}>
          <button
            onClick={handleCopy}
            className="absolute right-2.5 top-2.5 p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all z-10"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>

          {isUser ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap pr-6">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-xs max-w-none text-left select-text pr-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-xl border border-neutral-900 my-3.5 !bg-neutral-950 font-mono text-[11px] leading-relaxed"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-purple-400" {...props}>
                        {children}
                      </code>
                    );
                  },
                  a({ node, href, children, ...props }) {
                    const isFileLink = href && (href.startsWith('file:///') || href.startsWith('repomind:///'));
                    if (isFileLink) {
                      const pathPart = href.replace('file:///', '').replace('repomind:///', '');
                      const [filePathPart, linePart] = pathPart.split('#L');
                      const relativePath = filePathPart.replace('c:/Users/sharm/OneDrive/Desktop/RepoMind/', '');
                      const line = linePart ? parseInt(linePart, 10) : 1;

                      return (
                        <button
                          onClick={() => onReferenceClick && onReferenceClick(relativePath, line)}
                          className="text-primary hover:underline font-semibold text-[11px] font-mono px-1 py-0.5 rounded bg-primary/5 border border-primary/10 inline-flex items-center gap-0.5"
                        >
                          {children}
                        </button>
                      );
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props}>
                        {children}
                      </a>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations panel */}
        {!isUser && references.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 px-1">
            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1">
              <CornerDownRight className="w-3 h-3 text-neutral-600" />
              Source Code References
            </span>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {references.map((ref, i) => {
                const parts = ref.filePath.split('/');
                const name = parts[parts.length - 1];
                return (
                  <button
                    key={i}
                    onClick={() => onReferenceClick && onReferenceClick(ref.filePath, ref.startLine)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-900/60 border border-neutral-800/60 hover:border-primary/30 text-[10px] text-neutral-400 hover:text-white transition-all font-mono"
                  >
                    <FileCode className="w-3 h-3 text-neutral-500" />
                    <span>{name}: L{ref.startLine}-{ref.endLine}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
