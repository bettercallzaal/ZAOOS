'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useMobile } from '@/hooks/useMobile';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatRoom() {
  const { user, logout } = useAuth();
  const { messages, loading, sending, error, sendMessage, hideMessage } = useChat();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] bg-[#0a1628] text-white">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h2 className="font-semibold text-sm text-gray-300"># zao</h2>
        </header>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-900/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          isAdmin={user.isAdmin}
          onHide={hideMessage}
          loading={loading}
        />

        {/* Input */}
        <MessageInput onSend={sendMessage} sending={sending} />
      </div>
    </div>
  );
}
