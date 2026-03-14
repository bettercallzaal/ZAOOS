'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { FeedFilters, filterAndSortCasts, ContentFilter, SortMode } from './FeedFilters';

export function ChatRoom() {
  const { user, logout, refetch } = useAuth();
  const [activeChannel, setActiveChannel] = useState('zao');
  const player = usePlayer();
  const { messages, loading, sending, error, sendMessage, hideMessage } = useChat(activeChannel);
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
  const musicQueue = useMusicQueue(messages);

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

  // Reset filters on channel switch
  useEffect(() => {
    setContentFilter('all');
    setSortMode('newest');
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
    <div className="flex h-[100dvh] bg-[#0a1628] text-white overflow-hidden">
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
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => xmtp.selectConversation(null)}
                  className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                  title="Back to channel"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h2 className="font-semibold text-sm text-gray-300 truncate">
                  {activeXmtpConversation?.type === 'group' && <span className="text-gray-500 mr-1">#</span>}
                  {activeXmtpConversation?.peerDisplayName || activeXmtpConversation?.name || 'Message'}
                </h2>
                <span title="End-to-end encrypted" className="flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
              </div>
            ) : (
              <h2 className="font-semibold text-sm text-gray-300 flex-1"># {activeChannel}</h2>
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
              {error && (
                <div className="px-4 py-2 bg-red-900/30 text-red-400 text-sm flex-shrink-0">
                  {error}
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
              <GlobalPlayer />

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
      <ProfileDrawer fid={profileFid} onClose={() => setProfileFid(null)} />

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
