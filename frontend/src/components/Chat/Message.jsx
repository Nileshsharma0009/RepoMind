import React from 'react';
import { User, Brain, FileCode, CornerDownRight } from 'lucide-react';

export default function Message({ message, onReferenceClick }) {
  const isUser = message.role === 'user';
  const references = message.references || [];

  // Extremely basic yet robust markdown parser to format bold, code blocks, inline code, and lists
  const renderFormattedText = (text = '') => {
    if (!text) return '';

    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent = [];
    let codeLanguage = '';

    return lines.map((line, idx) => {
      // 1. Code block toggling
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const currentCode = codeContent.join('\n');
          codeContent = [];
          return (
            <pre
              key={idx}
              className="my-3 p-4 bg-neutral-950 border border-neutral-900 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-400 select-text leading-relaxed"
            >
              <code>{currentCode}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().substring(3);
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // 2. Heading formatting
      if (line.trim().startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-2 first:mt-0 font-display">
            {line.trim().substring(4)}
          </h4>
        );
      }
      if (line.trim().startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2 first:mt-0 font-display">
            {line.trim().substring(3)}
          </h3>
        );
      }
      if (line.trim().startsWith('# ')) {
        return (
          <h2 key={idx} className="text-lg font-bold text-white mt-4 mb-2 first:mt-0 font-display">
            {line.trim().substring(2)}
          </h2>
        );
      }

      // 3. Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-neutral-300 my-1 leading-relaxed">
            {parseInlineMarkup(line.trim().substring(2))}
          </li>
        );
      }

      // 4. Regular line
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs text-neutral-300 my-1.5 leading-relaxed">
          {parseInlineMarkup(line)}
        </p>
      );
    });
  };

  const parseInlineMarkup = (str) => {
    const parts = [];
    let currentStr = str;
    let key = 0;

    // Matches bold: **text** and inline code: `code`
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(file:\/\/.*?\))/g;
    let match;

    const matches = [];
    while ((match = regex.exec(currentStr)) !== null) {
      matches.push({
        text: match[0],
        index: match.index,
      });
    }

    if (matches.length === 0) {
      return currentStr;
    }

    let lastIndex = 0;
    matches.forEach((m) => {
      // Push leading text
      if (m.index > lastIndex) {
        parts.push(currentStr.substring(lastIndex, m.index));
      }

      const matchText = m.text;
      // Bold
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={key++} className="font-bold text-white">
            {matchText.substring(2, matchText.length - 2)}
          </strong>
        );
      }
      // Inline code
      else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-purple-400">
            {matchText.substring(1, matchText.length - 1)}
          </code>
        );
      }
      // File link in format: [filename](file:///...)
      else if (matchText.startsWith('[') && matchText.includes('](file:///')) {
        const titleMatch = /\[(.*?)\]/.exec(matchText);
        const urlMatch = /\((.*?)\)/.exec(matchText);
        const title = titleMatch ? titleMatch[1] : 'File';
        const url = urlMatch ? urlMatch[1] : '';

        // Extract filePath and line from file:///c:/Users/.../filepath#Lline
        const pathPart = url.replace('file:///', '');
        const [filePathPart, linePart] = pathPart.split('#L');
        
        // Clean absolute path to workspace relative path to allow Monaco loading
        // We know workspace path is: c:/Users/sharm/OneDrive/Desktop/RepoMind/
        const relativePath = filePathPart.replace('c:/Users/sharm/OneDrive/Desktop/RepoMind/', '');
        const line = linePart ? parseInt(linePart, 10) : 1;

        parts.push(
          <button
            key={key++}
            onClick={() => onReferenceClick && onReferenceClick(relativePath, line)}
            className="text-primary hover:underline font-semibold text-[11px] font-mono px-1 py-0.5 rounded bg-primary/5 border border-primary/10 inline-flex items-center gap-0.5"
          >
            {title}
          </button>
        );
      }

      lastIndex = m.index + matchText.length;
    });

    // Push remaining text
    if (lastIndex < currentStr.length) {
      parts.push(currentStr.substring(lastIndex));
    }

    return parts;
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
        {/* Message bubble */}
        <div className={`px-4 py-3 rounded-2xl border text-left ${
          isUser
            ? 'bg-primary/10 border-primary/25 rounded-tr-none text-white'
            : 'bg-neutral-900/40 border-neutral-850 rounded-tl-none text-neutral-300'
        }`}>
          {isUser ? <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p> : renderFormattedText(message.content)}
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
