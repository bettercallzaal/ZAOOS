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
import { MusicSidebar } from '@/components/music/MusicSidebar';
import { SongSubmit } from '@/components/music/SongSubmit';
import { useMusicQueue } from '@/hooks/useMusicQueue';

export function ChatRoom() {
  const { user, logout, refetch } = useAuth();
  const [activeChannel, setActiveChannel] = useState('zao');
  const player = usePlayer();
  const { messages, loading, sending, error, sendMessage, hideMessage } = useChat(activeChannel);
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadHash, setSelectedThreadHash] = useState<string | null>(null);
  const [quotedCast, setQuotedCast] = useState<QuotedCastData | null>(null);
  const [musicSidebarOpen, setMusicSidebarOpen] = useState(false);
  const [songSubmitOpen, setSongSubmitOpen] = useState(false);
  const musicQueue = useMusicQueue(messages);

  // Stop music when switching channels
  useEffect(() => {
    player.stop();
  }, [activeChannel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open music sidebar on desktop when a track starts playing
  useEffect(() => {
    if (player.status === 'playing' && !isMobile) {
      setMusicSidebarOpen(true);
    }
  }, [player.status, isMobile]);

  if (!user) return null;

  const hasSigner = !!user.signerUuid;

  return (
    <div className="flex h-[100dvh] bg-[#0a1628] text-white overflow-hidden">
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

      {/* Main chat + music sidebar in a shared flex row */}
      <div className="flex flex-1 min-w-0">
        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
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

            <h2 className="font-semibold text-sm text-gray-300 flex-1"># {activeChannel}</h2>

            {/* Song submit */}
            <button
              onClick={() => setSongSubmitOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Submit a song"
              title="Submit a song"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            {/* Music queue toggle */}
            <button
              onClick={() => setMusicSidebarOpen((o) => !o)}
              className={`relative flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                musicSidebarOpen
                  ? 'bg-[#f5a623]/20 text-[#f5a623]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Toggle music queue"
              title="Music queue"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              {/* Dot badge when queue has tracks */}
              {musicQueue.length > 0 && !musicSidebarOpen && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f5a623]" />
              )}
            </button>
          </header>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-2 bg-red-900/30 text-red-400 text-sm flex-shrink-0">
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
            onQuote={(cast) => {
              setQuotedCast(cast);
              setSelectedThreadHash(null);
            }}
            loading={loading}
            channelId={activeChannel}
          />

          {/* Global music player (mobile + desktop when sidebar closed) */}
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

        {/* Music sidebar — static in flex on desktop, bottom sheet on mobile */}
        <MusicSidebar
          messages={messages}
          activeChannel={activeChannel}
          isOpen={musicSidebarOpen}
          isMobile={isMobile}
          onClose={() => setMusicSidebarOpen(false)}
        />
      </div>

      {/* Song Submit Panel */}
      <SongSubmit
        channel={activeChannel}
        isOpen={songSubmitOpen}
        onClose={() => setSongSubmitOpen(false)}
      />

      {/* Thread Drawer — fixed overlay, z-50 */}
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
