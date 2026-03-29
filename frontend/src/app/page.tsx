'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import UserManagement from '@/components/UserManagement';
import Settings from '@/components/Settings';
import Profile from '@/components/Profile';
import { isAuthenticated, apiFetch } from '@/lib/api';
import type { Conversation } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [database, setDatabase] = useState('');
  const [accessMode, setAccessMode] = useState('read_only');
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'chat' | 'users' | 'settings' | 'profile'>('chat');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) { router.push('/login'); return; }
    apiFetch('/api/auth/me').then((r) => r.json()).then((d) => { if (d.role === 'admin') setIsAdmin(true); });
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, [router]);

  function handleNewConversation() {
    setActiveConversationId(null);
    setView('chat');
  }

  function closeSidebarOnMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }

  return (
    <div className="flex h-screen bg-bg-primary relative">
      {/* Mobile overlay backdrop */}
      {mounted && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-40 md:relative md:z-auto' : ''}`}>
        <Sidebar
          activeConversationId={activeConversationId}
          onSelectConversation={(conv: Conversation) => {
            setActiveConversationId(conv.id);
            if (conv.target_database) setDatabase(conv.target_database);
            if (conv.access_mode) setAccessMode(conv.access_mode);
            setView('chat');
            closeSidebarOnMobile();
          }}
          onNewConversation={() => { handleNewConversation(); closeSidebarOnMobile(); }}
          isAdmin={isAdmin}
          onProfile={() => { setView('profile'); closeSidebarOnMobile(); }}
          onManageUsers={() => { setView('users'); closeSidebarOnMobile(); }}
          onSettings={() => { setView('settings'); closeSidebarOnMobile(); }}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {view === 'chat' && (
          <ChatWindow
            conversationId={activeConversationId}
            database={database}
            accessMode={accessMode}
            onDatabaseChange={setDatabase}
            onAccessModeChange={setAccessMode}
            onConversationCreated={setActiveConversationId}
            onNewConversation={handleNewConversation}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        {view === 'users' && (
          <div className="flex-1 overflow-y-auto">
            <UserManagement onClose={() => setView('chat')} />
          </div>
        )}
        {view === 'settings' && (
          <div className="flex-1 overflow-y-auto">
            <Settings onClose={() => setView('chat')} />
          </div>
        )}
        {view === 'profile' && (
          <div className="flex-1 overflow-y-auto">
            <Profile onClose={() => setView('chat')} />
          </div>
        )}
      </div>
    </div>
  );
}
