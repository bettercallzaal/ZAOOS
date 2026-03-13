'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useMobile } from '@/hooks/useMobile';
import { usePlayer } from '@/providers/audio';
import { QuotedCastData } from '@/types';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { ComposeBar } from './ComposeBar';
import { ThreadDrawer } from './ThreadDrawer';
import { SignerConnect } from './SignerConnect';
import { GlobalPlayer } from '@/components/music/GlobalPlayer';

export function ChatRoom() {
  const { user, logout, refetch } = useAuth();
  const [activeChannel, setActiveChannel] = useState('zao');
  const player = usePlayer();
  const { messages, loading, sending, error, sendMessage, hideMessage } = useChat(activeChannel);
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadHash, setSelectedThreadHash] = useState<string | null>(null);
  const [quotedCast, setQuotedCast] = useState<QuotedCastData | null>(null);

  // Stop music when switching channels
  useEffect(() => {
    player.stop();
  }, [activeChannel]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const hasSigner = !!user.signerUuid;

  return (
    <div className="flex h-[100dvh] bg-[#0a1628] text-white">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        activeChannel={activeChannel}
        onChannelSelect={(ch) => {
          setActiveChannel(ch);
          setSelectedThreadHash(null);
          setSidebarOpen(false);
        }}
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
          <h2 className="font-semibold text-sm text-gray-300"># {activeChannel}</h2>
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
          currentFid={user.fid}
          hasSigner={hasSigner}
          onHide={hideMessage}
          onOpenThread={(hash) => setSelectedThreadHash(hash)}
          onQuote={(cast) => { setQuotedCast(cast); setSelectedThreadHash(null); }}
          loading={loading}
          channelId={activeChannel}
        />

        {/* Global music player */}
        <GlobalPlayer />

        {/* Signer connect or Compose */}
        {!hasSigner ? (
          <div>
            <SignerConnect onSuccess={refetch} />
            <ComposeBar hasSigner={false} onSend={sendMessage} channel={activeChannel} />
          </div>
        ) : (
          <ComposeBar
            hasSigner={true}
            onSend={sendMessage}
            sending={sending}
            channel={activeChannel}
            quotedCast={quotedCast}
            onClearQuote={() => setQuotedCast(null)}
          />
        )}
      </div>

      {/* Thread Drawer */}
      {selectedThreadHash && (
        <ThreadDrawer
          threadHash={selectedThreadHash}
          isAdmin={user.isAdmin}
          hasSigner={hasSigner}
          currentFid={user.fid}
          onHide={hideMessage}
          onSend={sendMessage}
          onClose={() => setSelectedThreadHash(null)}
        />
      )}
    </div>
  );
}
