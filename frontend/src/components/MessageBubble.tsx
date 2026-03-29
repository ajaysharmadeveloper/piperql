'use client';

import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import SqlResult from './SqlResult';
import ChartRenderer from './ChartRenderer';
import ConfirmationPrompt from './ConfirmationPrompt';
import type { ChartConfig } from '@/lib/types';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  queryResult?: Record<string, unknown>[] | null;
  chartConfig?: ChartConfig | null;
  confirmationStatus?: 'pending' | 'confirmed' | 'cancelled' | null;
  confirmationSql?: string;
  isDestructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  isStreaming?: boolean;
}

export default function MessageBubble({
  role, content, queryResult, chartConfig,
  confirmationStatus, confirmationSql, isDestructive,
  onConfirm, onCancel, isStreaming,
}: MessageBubbleProps) {
  const [dataExpanded, setDataExpanded] = useState(false);

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[85%] sm:max-w-[75%] bg-bg-card text-text-primary rounded-2xl rounded-br-md px-3 sm:px-4 py-3 border border-border-primary">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  const hasChart = !!chartConfig;
  const markdownHasTable = content.includes('|') && content.includes('---');
  const hasData = queryResult && queryResult.length > 0;

  // When chart is present: hide inline tables, show data as collapsible
  // When no chart: show SqlResult if markdown doesn't already have a table
  const showSqlResultDirect = hasData && !hasChart && !markdownHasTable;
  const showCollapsibleData = hasData && (hasChart || markdownHasTable);

  // Strip markdown tables when chart is present (chart replaces the table)
  const displayContent = hasChart
    ? content.replace(/\|.*\|/g, '').replace(/\n{3,}/g, '\n\n').trim()
    : content;

  return (
    <div className="mb-5">
      <div className="text-sm leading-relaxed text-text-primary">
        <MarkdownRenderer content={displayContent} />
        {isStreaming && content && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5 rounded-sm" />}
      </div>

      {hasChart && <div className="mt-3"><ChartRenderer config={chartConfig} /></div>}

      {showSqlResultDirect && <div className="mt-3"><SqlResult data={queryResult} /></div>}

      {showCollapsibleData && (
        <div className="mt-3">
          <button
            onClick={() => setDataExpanded(!dataExpanded)}
            className="flex items-center gap-2 text-[12px] text-text-muted hover:text-text-primary transition-all font-medium px-1 py-1"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${dataExpanded ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            View raw data ({queryResult.length} row{queryResult.length !== 1 ? 's' : ''})
          </button>
          {dataExpanded && (
            <div className="mt-1.5 animate-in slide-in-from-top-2">
              <SqlResult data={queryResult} />
            </div>
          )}
        </div>
      )}

      {confirmationStatus === 'pending' && confirmationSql && (
        <div className="mt-3"><ConfirmationPrompt sql={confirmationSql} isDestructive={isDestructive || false} onConfirm={onConfirm || (() => {})} onCancel={onCancel || (() => {})} /></div>
      )}
    </div>
  );
}
