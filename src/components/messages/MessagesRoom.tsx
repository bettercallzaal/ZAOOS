'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMobile } from '@/hooks/useMobile';
import { useXMTPContext } from '@/contexts/XMTPContext';
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
    streamConnected,
    reconnecting,
    conversations,
    activeConversationId,
    messages,
    loadingMessages,
    connectedWallets,
    autoConnect,
    selectConversation,
    sendMessage,
    createDm,
    createGroup,
    zaoMembers,
    startDmWithMember,
    clearError,
    reconnectStreams,
  } = useXMTPContext();

  const [dialogType, setDialogType] = useState<'dm' | 'group' | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const showList = !isMobile || !activeConversationId;
  const showThread = !isMobile || !!activeConversationId;

  // One-click connect — generates local XMTP identity from FID
  const handleConnect = useCallback(async () => {
    if (!user) return;
    await autoConnect(user.fid);
  }, [user, autoConnect]);

  const handleCreateDm = useCallback(async (address: `0x${string}`, peerProfile?: XMTPPeerProfile) => {
    const convId = await createDm(address, peerProfile);
    if (convId) selectConversation(convId);
  }, [createDm, selectConversation]);

  const handleCreateGroup = useCallback(async (name: string, members: { address: `0x${string}`; profile?: XMTPPeerProfile }[]) => {
    const convId = await createGroup(name, members);
    if (convId) selectConversation(convId);
  }, [createGroup, selectConversation]);

  if (!user) return null;

  // Not connected — show simple enable screen
  if (!isConnected) {
    return (
      <div className="flex h-[100dvh] bg-[#0a1628] text-white">
        <aside className="hidden md:flex w-64 bg-[#0d1b2a] border-r border-gray-800 flex-col">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold text-[#f5a623] tracking-wide">THE ZAO</h1>
            <p className="text-xs text-gray-500 mt-1">Private Messages</p>
          </div>
          <div className="flex-1" />
          <div className="p-4 border-t border-gray-800">
            <a href="/chat" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to channels
            </a>
          </div>
        </aside>
        <ConnectXMTP isConnecting={isConnecting} error={error} onConnect={handleConnect} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[#0a1628] text-white overflow-hidden">
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-80 border-r border-gray-800'} bg-[#0d1b2a] flex flex-col`}>
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
          />
        </div>
      )}

      {showThread && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Error banner with dismiss and reconnect */}
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
          {/* Stream disconnected warning (only when no error is showing) */}
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
