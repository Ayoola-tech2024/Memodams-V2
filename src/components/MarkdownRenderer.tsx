import React, { useState } from 'react';
import { Check, Copy, ExternalLink, CheckSquare, Square } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onCheckboxToggle?: (newContent: string) => void;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  onCheckboxToggle,
  className = '' 
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  if (!content) {
    return <p className="text-slate-500 italic text-sm">Empty note...</p>;
  }

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to toggle task list item at specific line
  const handleToggleTask = (lineIndex: number) => {
    if (!onCheckboxToggle) return;
    const lines = content.split('\n');
    const targetLine = lines[lineIndex];
    if (targetLine) {
      if (targetLine.includes('- [ ]')) {
        lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
      } else if (targetLine.includes('- [x]')) {
        lines[lineIndex] = targetLine.replace('- [x]', '- [ ]');
      }
      onCheckboxToggle(lines.join('\n'));
    }
  };

  const renderInlineFormatted = (text: string) => {
    // Replace inline code, links, bold, italics
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Pattern to match code `...`, bold **...**, italic *...*, link [...](...)
    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700/60">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Link [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            {linkMatch[1]}
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Bold **...**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++} className="font-bold text-slate-100">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic *...*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(<em key={key++} className="italic text-slate-300">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Strikethrough ~~...~~
      const strikeMatch = remaining.match(/^~~([^~]+)~~/);
      if (strikeMatch) {
        parts.push(<del key={key++} className="line-through text-slate-500">{strikeMatch[1]}</del>);
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // Plain char
      const nextSpecial = remaining.search(/[`*~\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Escaped or unmatched special
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  // Parse lines and blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = '';
  let codeBlockCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block check
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        // End of code block
        inCodeBlock = false;
        const codeText = codeBuffer.join('\n');
        const currentIndex = codeBlockCounter++;
        elements.push(
          <div key={`code-${currentIndex}`} className="my-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-900/90 shadow-md">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span>{codeLanguage || 'code'}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(codeText, currentIndex)}
                className="flex items-center gap-1 hover:text-indigo-400 transition-colors p-1"
                title="Copy code"
              >
                {copiedCodeIndex === currentIndex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs md:text-sm font-mono text-emerald-300 overflow-x-auto">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-800" />);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl md:text-2xl font-bold text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-800">
          {renderInlineFormatted(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg md:text-xl font-bold text-slate-200 mt-3 mb-1.5">
          {renderInlineFormatted(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base md:text-lg font-semibold text-slate-300 mt-2 mb-1">
          {renderInlineFormatted(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Task list / Checkbox
    if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
      const isChecked = line.trim().startsWith('- [x] ');
      const taskText = line.trim().slice(6);
      elements.push(
        <div 
          key={`task-${i}`} 
          className="flex items-start gap-2.5 my-1 text-sm group cursor-pointer select-none"
          onClick={() => handleToggleTask(i)}
        >
          <div className="mt-0.5 text-indigo-400 hover:text-indigo-300">
            {isChecked ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
            )}
          </div>
          <span className={`text-sm ${isChecked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {renderInlineFormatted(taskText)}
          </span>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-indigo-500/70 pl-3 my-2 text-slate-400 italic text-sm">
          {renderInlineFormatted(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet List
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={`li-${i}`} className="list-disc ml-5 my-0.5 text-slate-300 text-sm">
          {renderInlineFormatted(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    // Numbered List
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 ml-1 my-0.5 text-sm text-slate-300">
          <span className="font-mono text-indigo-400 text-xs mt-0.5">{numMatch[1]}.</span>
          <span>{renderInlineFormatted(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-slate-300 text-sm leading-relaxed my-1 break-words">
        {renderInlineFormatted(line)}
      </p>
    );
  }

  return <div className={`prose-invert max-w-none ${className}`}>{elements}</div>;
};
