'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useMobile } from '@/hooks/useMobile';
import { usePlayer } from '@/providers/audio';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { QuotedCastData } from '@/types';
import { useXMTPContext } from '@/contexts/XMTPContext';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { ComposeBar, ComposeBarHandle, ReplyContext } from './ComposeBar';
import { ThreadDrawer } from './ThreadDrawer';
import { SignerConnect } from './SignerConnect';
import { SearchDialog } from './SearchDialog';
import { SchedulePanel } from './SchedulePanel';
import { FaqPanel } from './FaqPanel';
import { RespectPanel } from './RespectPanel';
import { TutorialPanel } from './TutorialPanel';
import { ProfileDrawer } from './ProfileDrawer';
import { MessageThread } from '@/components/messages/MessageThread';
import { MessageCompose } from '@/components/messages/MessageCompose';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import { GlobalPlayer } from '@/components/music/GlobalPlayer';
import { MusicSidebar } from '@/components/music/MusicSidebar';
import { SongSubmit } from '@/components/music/SongSubmit';
import { useMusicQueue } from '@/hooks/useMusicQueue';
import { useRadio } from '@/hooks/useRadio';
import { RadioButton } from '@/components/music/RadioButton';
import { FeedFilters, filterAndSortCasts, ContentFilter, SortMode } from './FeedFilters';
import { NotificationBell } from '@/components/navigation/NotificationBell';

export function ChatRoom() {
  const { user, logout, refetch } = useAuth();
  const [activeChannel, setActiveChannel] = useState('zao');
  const player = usePlayer();
  const { messages, loading, sending, error, sendError, clearSendError, sendMessage, hideMessage } = useChat(activeChannel);
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadHash, setSelectedThreadHash] = useState<string | null>(null);
  const [quotedCast, setQuotedCast] = useState<QuotedCastData | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyContext | null>(null);
  const [musicSidebarOpen, setMusicSidebarOpen] = useState(false);
  const [songSubmitOpen, setSongSubmitOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [respectOpen, setRespectOpen] = useState(false);
  const [profileFid, setProfileFid] = useState<number | null>(null);
  const [dmDialogType, setDmDialogType] = useState<'dm' | 'group' | null>(null);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const composeRef = useRef<ComposeBarHandle>(null);
  const [songSubmissions, setSongSubmissions] = useState<import('@/hooks/useMusicQueue').SubmissionEntry[]>([]);
  const musicQueue = useMusicQueue(messages, songSubmissions);
  const radio = useRadio();

  // Music queue navigation (prev/next)
  const currentQueueIndex = musicQueue.findIndex((q) => q.castHash === player.metadata?.feedId);
  const hasPrevTrack = currentQueueIndex > 0;
  const hasNextTrack = currentQueueIndex >= 0 && currentQueueIndex < musicQueue.length - 1;

  const playQueueTrack = useCallback(async (index: number) => {
    const entry = musicQueue[index];
    if (!entry) return;
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(entry.url)}`);
      if (!res.ok) return;
      const data = await res.json();
      player.play({ ...data, feedId: entry.castHash });
    } catch { /* silent */ }
  }, [musicQueue, player]);

  const handlePrevTrack = useCallback(() => {
    if (hasPrevTrack) playQueueTrack(currentQueueIndex - 1);
  }, [hasPrevTrack, currentQueueIndex, playQueueTrack]);

  const handleNextTrack = useCallback(() => {
    if (hasNextTrack) playQueueTrack(currentQueueIndex + 1);
  }, [hasNextTrack, currentQueueIndex, playQueueTrack]);

  // Auto-play next track when current ends (respects shuffle/repeat + radio mode)
  useEffect(() => {
    player.setOnEnded(() => {
      // Radio mode: always play next radio track
      if (radio.isRadioMode) {
        radio.nextRadioTrack();
        return;
      }

      const idx = musicQueue.findIndex((q) => q.castHash === player.metadata?.feedId);
      if (idx < 0 || musicQueue.length === 0) { player.stop(); return; }

      let nextEntry;

      if (player.repeat === 'one') {
        nextEntry = musicQueue[idx];
      } else if (player.shuffle) {
        const others = musicQueue.filter((_, i) => i !== idx);
        nextEntry = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null;
      } else if (idx < musicQueue.length - 1) {
        nextEntry = musicQueue[idx + 1];
      } else if (player.repeat === 'all') {
        nextEntry = musicQueue[0];
      }

      if (nextEntry) {
        fetch(`/api/music/metadata?url=${encodeURIComponent(nextEntry.url)}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data) player.play({ ...data, feedId: nextEntry!.castHash }); })
          .catch(() => {});
      } else {
        player.stop();
      }
    });
    return () => player.setOnEnded(null);
  }); // Re-register on every render so closure captures latest queue/shuffle/repeat/radio

  // XMTP context
  const xmtp = useXMTPContext();
  const viewMode = xmtp.activeConversationId ? 'xmtp' : 'channel';
  const activeXmtpConversation = xmtp.conversations.find((c) => c.id === xmtp.activeConversationId) ?? null;

  const handleXmtpConnect = useCallback(async () => {
    if (!user) return;
    await xmtp.autoConnect(user.fid);
  }, [user, xmtp]);

  const handleConversationSelect = useCallback((id: string) => {
    xmtp.selectConversation(id);
    setSidebarOpen(false);
  }, [xmtp]);

  const handleChannelSelect = useCallback((ch: string) => {
    setActiveChannel(ch);
    xmtp.selectConversation(null);
    setSelectedThreadHash(null);
    setSidebarOpen(false);
  }, [xmtp]);

  const handleCreateDm = useCallback(async (address: `0x${string}`, peerProfile?: import('@/lib/xmtp/client').XMTPPeerProfile) => {
    const convId = await xmtp.createDm(address, peerProfile);
    if (convId) xmtp.selectConversation(convId);
  }, [xmtp]);

  const handleCreateGroup = useCallback(async (name: string, members: { address: `0x${string}`; profile?: import('@/lib/xmtp/client').XMTPPeerProfile }[]) => {
    const convId = await xmtp.createGroup(name, members);
    if (convId) xmtp.selectConversation(convId);
  }, [xmtp]);

  // Filtered + sorted messages
  const filteredMessages = useMemo(
    () => filterAndSortCasts(messages, contentFilter, sortMode),
    [messages, contentFilter, sortMode],
  );

  // Auto-reconnect XMTP if previously connected
  useEffect(() => {
    if (!user || xmtp.isConnected || xmtp.isConnecting) return;
    const wallets = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('zaoos-xmtp-wallets') || '[]')
      : [];
    if (wallets.length > 0) {
      xmtp.autoConnect(user.fid);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset filters on channel switch + fetch submissions for queue
  useEffect(() => {
    setContentFilter('all');
    setSortMode('newest');
    fetch(`/api/music/submissions?channel=${activeChannel}`)
      .then((r) => r.ok ? r.json() : { submissions: [] })
      .then((data) => setSongSubmissions(data.submissions || []))
      .catch(() => setSongSubmissions([]));
  }, [activeChannel]);

  // Keyboard shortcuts
  const shortcutHandlers = useMemo(() => ({
    onSearch: () => setSearchOpen(true),
    onFocusCompose: () => composeRef.current?.focus(),
    onClosePanels: () => {
      if (profileFid) { setProfileFid(null); return; }
      if (respectOpen) { setRespectOpen(false); return; }
      if (faqOpen) { setFaqOpen(false); return; }
      if (tutorialOpen) { setTutorialOpen(false); return; }
      if (searchOpen) { setSearchOpen(false); return; }
      if (selectedThreadHash) { setSelectedThreadHash(null); return; }
      if (musicSidebarOpen) { setMusicSidebarOpen(false); return; }
      if (songSubmitOpen) { setSongSubmitOpen(false); return; }
      if (scheduleOpen) { setScheduleOpen(false); return; }
      if (sidebarOpen) { setSidebarOpen(false); return; }
    },
    onToggleSidebar: () => setSidebarOpen((o) => !o),
    onToggleMusic: () => setMusicSidebarOpen((o) => !o),
  }), [profileFid, respectOpen, faqOpen, tutorialOpen, searchOpen, selectedThreadHash, musicSidebarOpen, songSubmitOpen, scheduleOpen, sidebarOpen]);

  useKeyboardShortcuts(shortcutHandlers);

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
    <div className="flex h-[100dvh] pb-14 md:pb-0 md:h-[calc(100dvh-2.5rem)] bg-[#0a1628] text-white overflow-hidden">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        activeChannel={activeChannel}
        onChannelSelect={handleChannelSelect}
        onOpenFaq={() => { setFaqOpen(true); setSidebarOpen(false); }}
        onOpenTutorial={() => { setTutorialOpen(true); setSidebarOpen(false); }}
        onOpenRespect={() => { setRespectOpen(true); setSidebarOpen(false); }}
        xmtpConnected={xmtp.isConnected}
        xmtpConnecting={xmtp.isConnecting}
        xmtpError={xmtp.error}
        xmtpConversations={xmtp.conversations}
        activeConversationId={xmtp.activeConversationId}
        onXmtpConnect={handleXmtpConnect}
        onConversationSelect={handleConversationSelect}
        onNewDm={() => setDmDialogType('dm')}
        onNewGroup={() => setDmDialogType('group')}
        zaoMembers={xmtp.zaoMembers}
        loadingMembers={xmtp.loadingMembers}
        onStartDmWithMember={xmtp.startDmWithMember}
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

            {viewMode === 'xmtp' ? (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => xmtp.selectConversation(null)}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0 -ml-1 p-1 rounded-lg hover:bg-white/5"
                  title="Back to channel"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                {activeXmtpConversation?.peerPfpUrl ? (
                  <div className="w-8 h-8 relative flex-shrink-0">
                    <Image
                      src={activeXmtpConversation.peerPfpUrl}
                      alt=""
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : activeXmtpConversation?.type === 'group' ? (
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center flex-shrink-0 border border-[#f5a623]/10">
                    <span className="text-xs text-[#f5a623]/80 font-semibold">
                      {(activeXmtpConversation?.peerDisplayName || activeXmtpConversation?.name || '?')[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm text-white truncate">
                    {activeXmtpConversation?.peerDisplayName || activeXmtpConversation?.name || 'Message'}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] text-gray-500">
                        {activeXmtpConversation?.type === 'group' ? 'Encrypted group' : 'Encrypted'}
                      </span>
                    </div>
                    {xmtp.connectedWallets.length > 0 && (
                      <span className="text-[10px] text-gray-600">
                        · {xmtp.connectedWallets.length} wallet{xmtp.connectedWallets.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm text-white"># {activeChannel}</h2>
                <p className="text-[10px] text-gray-600 -mt-0.5">Posting to Farcaster</p>
              </div>
            )}

            {viewMode === 'channel' && (
              <>
                {/* Search */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Search messages"
                  title="Search (Cmd+K)"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </button>

                {/* Scheduled posts */}
                <button
                  onClick={() => setScheduleOpen(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Scheduled posts"
                  title="Scheduled posts"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

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

                {/* ZAO Radio */}
                <RadioButton
                  isRadioMode={radio.isRadioMode}
                  radioLoading={radio.radioLoading}
                  onStart={radio.startRadio}
                  onStop={radio.stopRadio}
                  variant="compact"
                />

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
                  {musicQueue.length > 0 && !musicSidebarOpen && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f5a623]" />
                  )}
                </button>

                <NotificationBell />
              </>
            )}
          </header>

          {viewMode === 'xmtp' ? (
            <>
              {/* XMTP Message Thread */}
              <MessageThread
                conversation={activeXmtpConversation}
                messages={xmtp.messages}
                loading={xmtp.loadingMessages}
                xmtpState={xmtp.isConnecting ? 'connecting' : xmtp.error ? 'error' : xmtp.isConnected ? 'connected' : 'idle'}
                xmtpError={xmtp.error}
                onNewDm={() => setDmDialogType('dm')}
                onNewGroup={() => setDmDialogType('group')}
                onRetryConnect={handleXmtpConnect}
              />
              {activeXmtpConversation && (
                <MessageCompose
                  onSend={xmtp.sendMessage}
                  placeholder={
                    activeXmtpConversation.type === 'dm'
                      ? `Message ${activeXmtpConversation.peerDisplayName || activeXmtpConversation.name}...`
                      : `Message #${activeXmtpConversation.name}...`
                  }
                />
              )}
            </>
          ) : (
            <>
              {/* Feed filters */}
              <FeedFilters
                contentFilter={contentFilter}
                sortMode={sortMode}
                onContentFilterChange={setContentFilter}
                onSortChange={setSortMode}
                resultCount={filteredMessages.length}
                totalCount={messages.length}
              />

              {/* Error banner */}
              {error && !sendError && (
                <div className="px-4 py-2 bg-red-900/30 text-red-400 text-sm flex-shrink-0">
                  {error}
                </div>
              )}

              {/* Send error banner — dismissable */}
              {sendError && (
                <div className="px-4 py-2 bg-red-900/30 text-red-400 text-sm flex-shrink-0 flex items-center justify-between">
                  <span>Message failed: {sendError}</span>
                  <button onClick={clearSendError} className="text-red-300 hover:text-white text-xs ml-3 flex-shrink-0">Dismiss</button>
                </div>
              )}

              {/* Farcaster Messages */}
              <MessageList
                messages={filteredMessages}
                isAdmin={user.isAdmin}
                currentFid={user.fid}
                hasSigner={hasSigner}
                onHide={hideMessage}
                onOpenThread={(hash) => setSelectedThreadHash(hash)}
                onQuote={(cast) => {
                  setQuotedCast(cast);
                  setSelectedThreadHash(null);
                }}
                onOpenProfile={(fid) => setProfileFid(fid)}
                onReply={(hash, authorName, text) => {
                  setReplyTo({ hash, authorName, text });
                  setQuotedCast(null);
                  composeRef.current?.focus();
                }}
                loading={loading}
                channelId={activeChannel}
                sortMode={sortMode}
              />

              {/* Global music player */}
              <GlobalPlayer
                onPrev={radio.isRadioMode ? radio.prevRadioTrack : handlePrevTrack}
                onNext={radio.isRadioMode ? radio.nextRadioTrack : handleNextTrack}
                hasPrev={radio.isRadioMode || hasPrevTrack}
                hasNext={radio.isRadioMode || hasNextTrack}
                queueLength={musicQueue.length}
                onToggleQueue={() => setMusicSidebarOpen((o) => !o)}
                queueOpen={musicSidebarOpen}
                isRadioMode={radio.isRadioMode}
              />

              {/* Signer connect or Compose */}
              {!hasSigner ? (
                <div>
                  <SignerConnect onSuccess={refetch} />
                  <ComposeBar ref={composeRef} hasSigner={false} onSend={sendMessage} channel={activeChannel} />
                </div>
              ) : (
                <ComposeBar
                  ref={composeRef}
                  hasSigner={true}
                  onSend={sendMessage}
                  sending={sending}
                  channel={activeChannel}
                  quotedCast={quotedCast}
                  onClearQuote={() => setQuotedCast(null)}
                  onSchedule={() => setScheduleOpen(true)}
                  replyTo={replyTo}
                  onClearReply={() => setReplyTo(null)}
                />
              )}
            </>
          )}
        </div>

        {/* Music sidebar — static in flex on desktop, bottom sheet on mobile */}
        <MusicSidebar
          messages={messages}
          activeChannel={activeChannel}
          isOpen={musicSidebarOpen}
          isMobile={isMobile}
          onClose={() => setMusicSidebarOpen(false)}
          isRadioMode={radio.isRadioMode}
          radioLoading={radio.radioLoading}
          onRadioStart={radio.startRadio}
          onRadioStop={radio.stopRadio}
          radioPlaylistName={radio.radioPlaylist?.name}
        />
      </div>

      {/* Song Submit Panel */}
      <SongSubmit
        channel={activeChannel}
        isOpen={songSubmitOpen}
        onClose={() => setSongSubmitOpen(false)}
      />

      {/* Search Dialog */}
      <SearchDialog
        channel={activeChannel}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenThread={(hash) => {
          setSelectedThreadHash(hash);
          setSearchOpen(false);
        }}
      />

      {/* Scheduled Posts Panel */}
      <SchedulePanel
        channel={activeChannel}
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
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

      {/* FAQ Panel */}
      <FaqPanel isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
      <RespectPanel isOpen={respectOpen} onClose={() => setRespectOpen(false)} />

      {/* Tutorial Panel */}
      <TutorialPanel isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      {/* Profile Drawer */}
      <ProfileDrawer
        fid={profileFid}
        onClose={() => setProfileFid(null)}
        onStartDm={(targetFid, username, displayName, pfpUrl, address) => {
          setProfileFid(null);
          const peerProfile = { fid: targetFid, username, displayName, pfpUrl };
          xmtp.createDm(address as `0x${string}`, peerProfile).then((convId) => {
            if (convId) xmtp.selectConversation(convId);
          });
        }}
      />

      {/* New DM/Group Dialog */}
      <NewConversationDialog
        type={dmDialogType || 'dm'}
        isOpen={!!dmDialogType}
        onClose={() => setDmDialogType(null)}
        onCreateDm={handleCreateDm}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}
