'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useMobile } from '@/hooks/useMobile';
import { usePlayer } from '@/providers/audio';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { QuotedCastData } from '@/types';
import { useXMTPContext, ZaoMember } from '@/contexts/XMTPContext';
import { useWalletXMTP } from '@/hooks/useWalletXMTP';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { ComposeBar, ComposeBarHandle, ReplyContext } from './ComposeBar';
import { ThreadDrawer } from './ThreadDrawer';
import { SignerConnect } from './SignerConnect';
import { MessageThread } from '@/components/messages/MessageThread';
import { GroupInfoDrawer } from '@/components/messages/GroupInfoDrawer';
import { MessageCompose } from '@/components/messages/MessageCompose';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import { FeedFilters, filterAndSortCasts, ContentFilter, SortMode } from './FeedFilters';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { communityConfig } from '@/../community.config';

const TrendingFeed = dynamic(() => import('./TrendingFeed').then(m => ({ default: m.TrendingFeed })), { ssr: false });
const SearchDialog = dynamic(() => import('./SearchDialog').then(m => ({ default: m.SearchDialog })), { ssr: false });
const SongSubmit = dynamic(() => import('@/components/music/SongSubmit').then(m => ({ default: m.SongSubmit })), { ssr: false });
const SchedulePanel = dynamic(() => import('./SchedulePanel').then(m => ({ default: m.SchedulePanel })), { ssr: false });
const FaqPanel = dynamic(() => import('./FaqPanel').then(m => ({ default: m.FaqPanel })), { ssr: false });
const TutorialPanel = dynamic(() => import('./TutorialPanel').then(m => ({ default: m.TutorialPanel })), { ssr: false });
const RespectPanel = dynamic(() => import('./RespectPanel').then(m => ({ default: m.RespectPanel })), { ssr: false });
const ProfileDrawer = dynamic(() => import('./ProfileDrawer').then(m => ({ default: m.ProfileDrawer })), { ssr: false });

export function ChatRoom() {
  const { user, logout, refetch } = useAuth();
  const [activeChannel, setActiveChannel] = useState('zao');
  const [isTrending, setIsTrending] = useState(false);
  const player = usePlayer();
  const { messages, loading, sending, error, sendError, clearSendError, sendMessage, hideMessage, loadMore, hasMore, loadingMore } = useChat(activeChannel);
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedThreadHash, setSelectedThreadHash] = useState<string | null>(null);
  const [quotedCast, setQuotedCast] = useState<QuotedCastData | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyContext | null>(null);
  const [songSubmitOpen, setSongSubmitOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [respectOpen, setRespectOpen] = useState(false);
  const [profileFid, setProfileFid] = useState<number | null>(null);
  const [dmDialogType, setDmDialogType] = useState<'dm' | 'group' | null>(null);
  const [groupInfoId, setGroupInfoId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<{ inboxId: string; displayName: string; pfpUrl: string; username?: string }[]>([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const composeRef = useRef<ComposeBarHandle>(null);

  // XMTP context
  const xmtp = useXMTPContext();
  const walletXmtp = useWalletXMTP();
  const viewMode = xmtp.activeConversationId ? 'xmtp' : isTrending ? 'trending' : 'channel';
  const activeXmtpConversation = xmtp.conversations.find((c) => c.id === xmtp.activeConversationId) ?? null;

  const handleXmtpConnect = useCallback(async () => {
    if (walletXmtp.canConnect) {
      await walletXmtp.connectWalletToXMTP();
    }
    // Fallback: if no wallet connected, the sidebar will show RainbowKit connect
  }, [walletXmtp]);

  const handleConversationSelect = useCallback((id: string) => {
    xmtp.selectConversation(id);
    setSidebarOpen(false);
  }, [xmtp]);

  const handleStartDmWithMember = useCallback(async (member: ZaoMember) => {
    await xmtp.startDmWithMember(member);
    setSidebarOpen(false);
  }, [xmtp]);

  const handleChannelSelect = useCallback((ch: string) => {
    setActiveChannel(ch);
    setIsTrending(false);
    xmtp.selectConversation(null);
    setSelectedThreadHash(null);
    setSidebarOpen(false);
  }, [xmtp]);

  const handleTrendingSelect = useCallback(() => {
    setIsTrending(true);
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

  const handleOpenGroupInfo = useCallback(async (convId: string) => {
    setGroupInfoId(convId);
    setLoadingGroupMembers(true);
    const members = await xmtp.getGroupMembers(convId);
    setGroupMembers(members);
    setLoadingGroupMembers(false);
  }, [xmtp]);

  // Filtered + sorted messages
  const filteredMessages = useMemo(
    () => filterAndSortCasts(messages, contentFilter, sortMode),
    [messages, contentFilter, sortMode],
  );

  // Auto-connect XMTP when wallet is available (skip if previous attempt errored)
  useEffect(() => {
    if (!user || xmtp.isConnected || xmtp.isConnecting || xmtp.error) return;
    if (walletXmtp.canConnect) {
      walletXmtp.connectWalletToXMTP();
    }
  }, [user, walletXmtp.canConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset filters on channel switch + fetch submissions for queue
  /* eslint-disable react-hooks/set-state-in-effect -- resetting filters on channel switch is intentional */
  useEffect(() => {
    setContentFilter('all');
    setSortMode('newest');
  }, [activeChannel]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
      if (songSubmitOpen) { setSongSubmitOpen(false); return; }
      if (scheduleOpen) { setScheduleOpen(false); return; }
      if (sidebarOpen) { setSidebarOpen(false); return; }
    },
    onToggleSidebar: () => setSidebarOpen((o) => !o),
  }), [profileFid, respectOpen, faqOpen, tutorialOpen, searchOpen, selectedThreadHash, songSubmitOpen, scheduleOpen, sidebarOpen]);

  useKeyboardShortcuts(shortcutHandlers);

  // Stop music when switching channels (but not on initial mount)
  const channelMountedRef = useRef(false);
  useEffect(() => {
    if (!channelMountedRef.current) {
      channelMountedRef.current = true;
      return;
    }
    player.stop();
  }, [activeChannel]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const hasSigner = !!user.signerUuid;

  return (
    <div className="flex h-[calc(100dvh-9rem)] md:h-[calc(100dvh-6.5rem)] bg-[#0a1628] text-white overflow-hidden">
      {/* Action error toast (DM/group creation) */}
      {xmtp.actionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] max-w-sm w-full mx-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 shadow-lg backdrop-blur-sm">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <span className="text-sm text-red-300 flex-1">{xmtp.actionError}</span>
            <button onClick={xmtp.clearActionError} className="text-red-400/60 hover:text-red-400" aria-label="Dismiss">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        activeChannel={activeChannel}
        onChannelSelect={handleChannelSelect}
        isTrending={isTrending}
        onTrendingSelect={() => { handleTrendingSelect(); setSidebarOpen(false); }}
        onOpenFaq={() => { setFaqOpen(true); setSidebarOpen(false); }}
        onOpenTutorial={() => { setTutorialOpen(true); setSidebarOpen(false); }}
        onOpenRespect={() => { setRespectOpen(true); setSidebarOpen(false); }}
        xmtpConnected={xmtp.isConnected}
        xmtpConnecting={xmtp.isConnecting}
        xmtpError={xmtp.error}
        xmtpConversations={xmtp.conversations}
        activeConversationId={xmtp.activeConversationId}
        onXmtpConnect={handleXmtpConnect}
        walletConnected={walletXmtp.isWalletConnected}
        onConversationSelect={handleConversationSelect}
        onNewDm={() => setDmDialogType('dm')}
        onNewGroup={() => setDmDialogType('group')}
        zaoMembers={xmtp.zaoMembers}
        loadingMembers={xmtp.loadingMembers}
        onStartDmWithMember={handleStartDmWithMember}
        onGroupInfo={handleOpenGroupInfo}
        onRemoveConversation={xmtp.removeConversation}
        onRefreshMembers={xmtp.refreshMembers}
        onResetXmtp={xmtp.disconnectAll}
      />

      {/* Group Info Drawer */}
      {groupInfoId && (() => {
        const conv = xmtp.conversations.find((c) => c.id === groupInfoId);
        if (!conv) return null;
        return (
          <GroupInfoDrawer
            conversation={conv}
            members={groupMembers}
            loading={loadingGroupMembers}
            onClose={() => setGroupInfoId(null)}
            onRemove={() => xmtp.removeConversation(groupInfoId)}
            onLeave={() => xmtp.leaveGroup(groupInfoId)}
          />
        );
      })()}

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
                aria-label="Open sidebar"
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
                  aria-label="Back to channel"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                {activeXmtpConversation?.peerPfpUrl ? (
                  <div className="w-8 h-8 relative flex-shrink-0">
                    <Image
                      src={activeXmtpConversation.peerPfpUrl}
                      alt={`${activeXmtpConversation.peerDisplayName || activeXmtpConversation.name || 'Conversation'} avatar`}
                      fill
                      className="rounded-full object-cover"
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
            ) : isTrending ? (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm text-white flex items-center gap-1.5">
                  <span className="text-amber-400">🔥</span> Trending
                </h2>
                <p className="text-[10px] text-gray-600 -mt-0.5">Curated by Sopha</p>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm text-white"># {activeChannel}</h2>
                <p className="text-[10px] text-gray-600 -mt-0.5">Posting to Farcaster</p>
              </div>
            )}

            {(viewMode === 'channel' || viewMode === 'trending') && (
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
              {/* Channel / Trending tab bar */}
              <div className="flex items-center gap-0.5 px-3 py-1.5 bg-[#0d1b2a] border-b border-gray-800 overflow-x-auto no-scrollbar flex-shrink-0">
                {communityConfig.farcaster.channels.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => handleChannelSelect(ch)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !isTrending && activeChannel === ch
                        ? 'bg-[#f5a623]/10 text-[#f5a623]'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    #{ch}
                  </button>
                ))}
                <button
                  onClick={handleTrendingSelect}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    isTrending
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/5'
                  }`}
                >
                  Trending <span className="text-[10px]">🔥</span>
                </button>
              </div>

              {isTrending ? (
                <TrendingFeed
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
                />
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
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
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
            </>
          )}
        </div>

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
        zaoMembers={xmtp.zaoMembers}
        onStartDmWithMember={handleStartDmWithMember}
      />
    </div>
  );
}
