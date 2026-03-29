'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import MessageBubble from './MessageBubble';
import ThemeSwitch from './ThemeSwitch';
import { apiFetch, getAuthHeaders } from '@/lib/api';
import type { ChartConfig } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  queryResult?: Record<string, unknown>[] | null;
  chartConfig?: ChartConfig | null;
  confirmationStatus?: 'pending' | 'confirmed' | 'cancelled' | null;
  confirmationSql?: string;
  isDestructive?: boolean;
  isStreaming?: boolean;
}

interface ChatWindowProps {
  conversationId: string | null;
  database: string;
  accessMode: string;
  onDatabaseChange: (db: string) => void;
  onAccessModeChange: (mode: string) => void;
  onConversationCreated: (id: string) => void;
  onNewConversation: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function InputBox({
  input, onInputChange, onKeyDown, onSubmit, onStop,
  database, accessMode, onDatabaseChange, onAccessModeChange,
  databases, isLoading,
}: {
  input: string;
  onInputChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onStop: () => void;
  database: string;
  accessMode: string;
  onDatabaseChange: (v: string) => void;
  onAccessModeChange: (v: string) => void;
  databases: string[];
  isLoading: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const dbSelected = database !== '';

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative bg-bg-input border border-border-primary rounded-2xl shadow-sm focus-within:border-border-secondary transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={dbSelected ? 'Ask me anything...' : 'Select a database first...'}
          rows={1}
          disabled={!dbSelected}
          className="w-full px-4 pt-3.5 pb-12 pr-14 bg-transparent text-text-primary placeholder-text-placeholder focus:outline-none resize-none text-sm leading-relaxed max-h-[200px] disabled:opacity-50"
        />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary border border-border-primary rounded-lg hover:border-border-secondary transition-all cursor-pointer">
              <svg className="w-3 h-3 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
              </svg>
              <select value={database} onChange={(e) => onDatabaseChange(e.target.value)}
                className="bg-transparent text-xs text-text-tertiary focus:outline-none appearance-none cursor-pointer pr-1">
                <option value="">Select Database</option>
                {databases.map((db) => (<option key={db} value={db}>{db}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary border border-border-primary rounded-lg hover:border-border-secondary transition-all cursor-pointer">
              <svg className="w-3 h-3 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <select value={accessMode} onChange={(e) => onAccessModeChange(e.target.value)}
                className="bg-transparent text-xs text-text-tertiary focus:outline-none appearance-none cursor-pointer pr-1">
                <option value="read_only">Read Only</option>
                <option value="crud">CRUD</option>
                <option value="full_access">Full Access</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <button onClick={onStop} className="w-8 h-8 flex items-center justify-center bg-bg-active hover:bg-bg-badge rounded-xl transition-all" title="Stop">
              <svg className="w-3.5 h-3.5 text-text-primary" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
          ) : (
            <button onClick={onSubmit} disabled={!input.trim() || !dbSelected}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                input.trim() && dbSelected ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-bg-active text-text-muted cursor-not-allowed'
              }`} title="Send">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-text-muted text-center mt-2">AI can make mistakes. Verify important queries before executing.</p>
    </div>
  );
}

export default function ChatWindow({
  conversationId, database, accessMode,
  onDatabaseChange, onAccessModeChange, onConversationCreated,
  onNewConversation, sidebarOpen, onToggleSidebar,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const [databases, setDatabases] = useState<string[]>([]);
  const [missingSettings, setMissingSettings] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  useEffect(() => { apiFetch('/api/databases/').then((r) => r.json()).then((d) => setDatabases(d.databases || [])); }, []);

  useEffect(() => {
    apiFetch('/api/settings/validate').then((r) => r.json()).then((d) => {
      if (d.missing) setMissingSettings(d.missing);
    });
  }, []);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    // Skip fetching from DB if we're actively streaming — our local state is authoritative
    if (isStreamingRef.current) return;
    apiFetch(`/api/conversations/${conversationId}/messages`).then((r) => r.json()).then((data) => {
      // Double-check we're still not streaming when the fetch resolves
      if (isStreamingRef.current) return;
      const msgs = Array.isArray(data) ? data : [];
      setMessages(msgs.map((m: Record<string, unknown>) => ({
        id: m.id as string, role: m.role as 'user' | 'assistant', content: m.content as string,
        queryResult: m.query_result as Record<string, unknown>[] | null,
        chartConfig: m.chart_config as ChartConfig | null,
        confirmationStatus: m.confirmation_status as 'pending' | 'confirmed' | 'cancelled' | null,
      })));
    });
  }, [conversationId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, agentStatus]);

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const res = await apiFetch('/api/conversations', { method: 'POST', body: JSON.stringify({ target_database: database, access_mode: accessMode }) });
    const data = await res.json(); onConversationCreated(data.id); return data.id;
  }

  function handleStop() {
    abortControllerRef.current?.abort(); abortControllerRef.current = null;
    setIsLoading(false); setAgentStatus('');
    setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, isStreaming: false, content: m.content + '\n\n*Stopped by user.*' } : m));
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isLoading || !database) return;
    const userMessage = input.trim(); setInput(''); setIsLoading(true); setAgentStatus('Thinking...');
    isStreamingRef.current = true;
    const convId = await ensureConversation();
    const userMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: userMessage }]);
    const assistantMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);
    abortControllerRef.current = new AbortController();
    try {
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ message: userMessage, conversation_id: convId, database, access_mode: accessMode }),
        signal: abortControllerRef.current.signal,
      });
      if (!response.ok || !response.body) throw new Error('Failed');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let hasToken = false;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.type === 'status' && event.content) {
                setAgentStatus(event.content);
              }
              if (event.type === 'token' && event.content) {
                if (!hasToken) { hasToken = true; }
                setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + event.content } : m));
              }
              if (event.type === 'result' && event.data) {
                setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, queryResult: Array.isArray(event.data) ? event.data : [event.data] } : m)); }
              if (event.type === 'chart' && event.data) { setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, chartConfig: event.data as ChartConfig } : m)); }
              if (event.type === 'confirm') {
                setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, confirmationStatus: 'pending' as const, confirmationSql: event.content, isDestructive: event.is_destructive } : m)); }
              if (event.type === 'error') { setAgentStatus('');
                setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + `\n\n**Error:** ${event.content}` } : m)); }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError')
        setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, content: 'Failed to get response.' } : m));
    } finally {
      setMessages((p) => p.map((m) => m.id === assistantMsgId ? { ...m, isStreaming: false } : m));
      setIsLoading(false); setAgentStatus(''); abortControllerRef.current = null;
      isStreamingRef.current = false;
    }
  }

  async function handleConfirm(msgId: string, sql: string) {
    const res = await apiFetch('/api/chat/confirm', { method: 'POST', body: JSON.stringify({ sql, database, action: 'confirm' }) });
    const result = await res.json();
    setMessages((p) => p.map((m) => m.id === msgId ? { ...m, confirmationStatus: 'confirmed' as const, content: m.content + `\n\n**Executed:** ${result.result || result.message}` } : m));
  }
  function handleCancel(msgId: string) {
    setMessages((p) => p.map((m) => m.id === msgId ? { ...m, confirmationStatus: 'cancelled' as const, content: m.content + '\n\n*Cancelled.*' } : m));
  }
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary">
      {/* Top bar */}
      <div className="flex items-center justify-between p-2 border-b border-border-primary">
        <div className="flex items-center gap-1">
          {!sidebarOpen && (
            <>
              <button onClick={onToggleSidebar} className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-all" title="Open sidebar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
              </button>
              <button onClick={onNewConversation} className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-all" title="New chat">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              </button>
            </>
          )}
        </div>
        <ThemeSwitch />
      </div>

      {/* Missing settings banner */}
      {missingSettings.length > 0 && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Configuration required</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              Missing: {missingSettings.join(', ')}. Go to <strong>Settings</strong> to configure.
            </p>
          </div>
        </div>
      )}

      {/* Empty state — input centered with suggestions */}
      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-border-primary flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">What can I help you with?</h2>
            <p className="text-sm text-text-muted">Select a database, then ask anything in natural language</p>
          </div>

          {/* Suggested questions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 w-full max-w-3xl">
            {[
              'Show me all tables in this database',
              'How many rows are in each table?',
              'Describe the schema and relationships',
              'Show the latest 10 records from the largest table',
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="text-left px-4 py-3 bg-bg-secondary border border-border-primary rounded-xl text-sm text-text-secondary hover:bg-bg-hover hover:border-border-secondary transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="w-full px-4">
            <InputBox
              input={input} onInputChange={setInput} onKeyDown={handleKeyDown}
              onSubmit={() => handleSubmit()} onStop={handleStop}
              database={database} accessMode={accessMode}
              onDatabaseChange={onDatabaseChange} onAccessModeChange={onAccessModeChange}
              databases={databases} isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content}
                  queryResult={msg.queryResult} chartConfig={msg.chartConfig}
                  confirmationStatus={msg.confirmationStatus} confirmationSql={msg.confirmationSql}
                  isDestructive={msg.isDestructive}
                  onConfirm={() => handleConfirm(msg.id, msg.confirmationSql || '')}
                  onCancel={() => handleCancel(msg.id)} isStreaming={msg.isStreaming} />
              ))}
              {isLoading && agentStatus && (
                <div className="flex items-center gap-2 text-sm text-text-tertiary py-2 pl-1">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{agentStatus}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input at bottom */}
          <div className="bg-bg-primary px-4 pb-4">
            <InputBox
              input={input} onInputChange={setInput} onKeyDown={handleKeyDown}
              onSubmit={() => handleSubmit()} onStop={handleStop}
              database={database} accessMode={accessMode}
              onDatabaseChange={onDatabaseChange} onAccessModeChange={onAccessModeChange}
              databases={databases} isLoading={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
}
