'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useState } from 'react';

export default function MarkdownRenderer({ content }: { content: string }) {
  // Strip base64 image data — the chart tool handles visualization
  const cleanContent = content
    .replace(/!\[.*?\]\(data:image\/[^)]*\)/g, '')
    .replace(/!\[.*?\]\s*\n?\(data:image\/[^\s)]+[^)]*$/g, '')
    .replace(/\(data:image\/[a-z]+;base64,[A-Za-z0-9+/=\s]+\)?/g, '')
    .replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=\s]+/g, '');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded-md text-[13px] font-mono font-medium bg-bg-active/70 text-text-primary border border-border-primary/50"
                {...props}
              >
                {children}
              </code>
            );
          }
          return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3 rounded-xl border border-border-primary bg-bg-secondary/50 shadow-sm">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-bg-tertiary/80 backdrop-blur-sm">{children}</thead>;
        },
        th({ children }) {
          return (
            <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-text-muted font-semibold border-b border-border-primary">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="px-4 py-2 text-text-secondary font-mono text-[13px] border-b border-border-primary/50">
              {children}
            </td>
          );
        },
        tr({ children }) {
          return <tr className="hover:bg-bg-hover/50 transition-colors">{children}</tr>;
        },
        p({ children }) {
          return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 mb-2.5 space-y-1.5 text-text-secondary">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 mb-2.5 space-y-1.5 text-text-secondary">{children}</ol>;
        },
        li({ children }) {
          return <li className="leading-relaxed pl-1">{children}</li>;
        },
        strong({ children }) {
          return <strong className="font-semibold text-text-primary">{children}</strong>;
        },
        h1({ children }) {
          return <h1 className="text-lg font-bold text-text-primary mb-2 mt-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-base font-bold text-text-primary mb-2 mt-3">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-bold text-text-primary mb-1.5 mt-2">{children}</h3>;
        },
      }}
    >
      {cleanContent}
    </ReactMarkdown>
  );
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace(/language-/g, '').replace(/hljs\s*/g, '').trim() || '';

  const handleCopy = () => {
    const text = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-border-primary shadow-sm">
      <div className="flex items-center justify-between bg-bg-tertiary/80 px-4 py-1.5 border-b border-border-primary/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-text-muted/30" />
            <span className="w-2 h-2 rounded-full bg-text-muted/30" />
            <span className="w-2 h-2 rounded-full bg-text-muted/30" />
          </div>
          {language && (
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="text-[11px] text-text-muted hover:text-text-primary px-2 py-0.5 rounded-md hover:bg-bg-hover transition-all font-medium"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-bg-secondary p-4 overflow-x-auto">
        <code className={`${className} text-[13px] leading-relaxed font-mono`}>{children}</code>
      </pre>
    </div>
  );
}
