'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useMobile } from '@/hooks/useMobile';
import { useXMTPContext } from '@/contexts/XMTPContext';
import { useWalletXMTP } from '@/hooks/useWalletXMTP';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { MessageCompose } from './MessageCompose';
import { NewConversationDialog } from './NewConversationDialog';
import { ConnectXMTP } from './ConnectXMTP';
import type { XMTPPeerProfile } from '@/lib/xmtp/client';

export function MessagesRoom() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const {
    isConnecting,
    isConnected,
    error,
    actionError,
    streamConnected,
    reconnecting,
    conversations,
    activeConversationId,
    messages,
    loadingMessages,
    /* connectedWallets and autoConnect available via useXMTPContext when needed */
    selectConversation,
    sendMessage,
    createDm,
    createGroup,
    zaoMembers,
    startDmWithMember,
    clearError,
    clearActionError,
    reconnectStreams,
    removeConversation,
  } = useXMTPContext();

  const walletXmtp = useWalletXMTP();

  const [dialogType, setDialogType] = useState<'dm' | 'group' | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const showList = !isMobile || !activeConversationId;
  const showThread = !isMobile || !!activeConversationId;

  // Connect XMTP using wallet-based signing (optional address from wallet picker)
  const handleConnect = useCallback(async () => {
    if (walletXmtp.canConnect) {
      await walletXmtp.connectWalletToXMTP();
    }
  }, [walletXmtp]);

  const handleConnectWithWallet = useCallback(async () => {
    await handleConnect();
  }, [handleConnect]);

  // Auto-connect XMTP only if user previously connected (has saved wallets in localStorage)
  useEffect(() => {
    if (!user || isConnected || isConnecting || error) return;
    const hasPreviousConnection = typeof window !== 'undefined' && localStorage.getItem('zaoos-xmtp-wallets');
    if (walletXmtp.canConnect && hasPreviousConnection) {
      walletXmtp.connectWalletToXMTP();
    }
  }, [user, walletXmtp.canConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateDm = useCallback(async (address: `0x${string}`, peerProfile?: XMTPPeerProfile) => {
    const convId = await createDm(address, peerProfile);
    if (convId) selectConversation(convId);
  }, [createDm, selectConversation]);

  const handleCreateGroup = useCallback(async (name: string, members: { address: `0x${string}`; profile?: XMTPPeerProfile }[]) => {
    const convId = await createGroup(name, members);
    if (convId) selectConversation(convId);
  }, [createGroup, selectConversation]);

  // Auto-dismiss action error toast
  const showActionToast = !!actionError;

  if (!user) return null;

  // Not connected — show simple enable screen
  if (!isConnected) {
    return (
      <div className="flex h-[100dvh] bg-[#0a1628] text-white">
        <aside className="hidden md:flex w-64 bg-[#0d1b2a] border-r border-white/[0.08] flex-col">
          <div className="p-4 border-b border-white/[0.08]">
            <h1 className="text-xl font-bold text-[#f5a623] tracking-wide">THE ZAO</h1>
            <p className="text-xs text-gray-500 mt-1">Private Messages</p>
          </div>
          <div className="flex-1" />
          <div className="p-4 border-t border-white/[0.08]">
            <a href="/chat" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to channels
            </a>
          </div>
        </aside>
        <ConnectXMTP isConnecting={isConnecting} error={error} onConnect={handleConnectWithWallet} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[#0a1628] text-white overflow-hidden pb-20 md:pb-0">
      {/* Action error toast (DM/group creation errors) */}
      {showActionToast && actionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] max-w-sm w-full mx-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 shadow-lg backdrop-blur-sm">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <span className="text-sm text-red-300 flex-1">{actionError}</span>
            <button onClick={clearActionError} className="text-red-400/60 hover:text-red-400" aria-label="Dismiss">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-80 border-r border-white/[0.08]'} bg-[#0d1b2a] flex flex-col`}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <a href="/chat" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Channels
            </a>
            {user && (
              <span className="text-[10px] text-gray-500">
                @{user.username || `FID ${user.fid}`}
              </span>
            )}
          </div>
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={selectConversation}
            onNewDm={() => setDialogType('dm')}
            onNewGroup={() => setDialogType('group')}
            onRemove={removeConversation}
          />
        </div>
      )}

      {showThread && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Conversation header */}
          {activeConversation && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a] flex-shrink-0">
              {/* Back button (mobile) */}
              {isMobile && (
                <button
                  onClick={() => selectConversation(null)}
                  className="p-1 -ml-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Back to conversations"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              {/* Avatar */}
              {activeConversation.peerPfpUrl ? (
                <Image
                  src={activeConversation.peerPfpUrl}
                  alt={activeConversation.peerDisplayName || 'avatar'}
                  width={36}
                  height={36}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {activeConversation.type === 'group' ? (
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772" />
                    </svg>
                  ) : (
                    <span className="text-sm text-gray-400 font-medium">
                      {(activeConversation.peerDisplayName || activeConversation.name || '?')[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              {/* Name + info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {activeConversation.type === 'group' && <span className="text-gray-500 mr-1">#</span>}
                  {activeConversation.peerDisplayName || activeConversation.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-[10px] text-green-500/70">Encrypted</span>
                  </div>
                  {activeConversation.type === 'group' && activeConversation.memberCount && (
                    <span className="text-[10px] text-gray-600">· {activeConversation.memberCount} members</span>
                  )}
                </div>
              </div>
              {/* Remove conversation */}
              <button
                onClick={() => removeConversation(activeConversation.id)}
                className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-white/5"
                aria-label="Remove conversation"
                title="Remove from list"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Connection error banner */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-sm">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-red-400/90 flex-1">{error}</span>
              {!reconnecting && !streamConnected && isConnected && (
                <button
                  onClick={reconnectStreams}
                  className="px-3 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors flex-shrink-0"
                >
                  Reconnect
                </button>
              )}
              {reconnecting && (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              <button
                onClick={clearError}
                className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {/* Stream disconnected warning */}
          {!error && !streamConnected && isConnected && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" />
              <span className="text-yellow-400/90 flex-1">
                {reconnecting ? 'Reconnecting to message stream...' : 'Live updates paused'}
              </span>
              {!reconnecting && (
                <button
                  onClick={reconnectStreams}
                  className="px-3 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors flex-shrink-0"
                >
                  Reconnect
                </button>
              )}
              {reconnecting && (
                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>
          )}

          <MessageThread
            conversation={activeConversation}
            messages={messages}
            loading={loadingMessages}
            onNewDm={() => setDialogType('dm')}
            onNewGroup={() => setDialogType('group')}
          />
          {activeConversation && (
            <MessageCompose
              onSend={sendMessage}
              streamDisconnected={isConnected && !streamConnected}
              placeholder={
                isConnected && !streamConnected
                  ? 'Reconnecting...'
                  : activeConversation.type === 'dm'
                  ? `Message ${activeConversation.peerDisplayName || activeConversation.name}...`
                  : `Message #${activeConversation.name}...`
              }
            />
          )}
        </div>
      )}

      <NewConversationDialog
        type={dialogType || 'dm'}
        isOpen={!!dialogType}
        onClose={() => setDialogType(null)}
        onCreateDm={handleCreateDm}
        onCreateGroup={handleCreateGroup}
        zaoMembers={zaoMembers}
        onStartDmWithMember={startDmWithMember}
      />
    </div>
  );
}
