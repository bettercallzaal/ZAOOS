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

export function MessagesRoom() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const {
    isConnecting,
    isConnected,
    error,
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

  const handleCreateDm = useCallback(async (address: `0x${string}`) => {
    const convId = await createDm(address);
    if (convId) selectConversation(convId);
  }, [createDm, selectConversation]);

  const handleCreateGroup = useCallback(async (name: string, addresses: `0x${string}`[]) => {
    const convId = await createGroup(name, addresses);
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
            {connectedWallets.length > 0 && (
              <span className="text-[10px] text-gray-600 font-mono">
                {connectedWallets[0].slice(0, 6)}...{connectedWallets[0].slice(-4)}
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
          <MessageThread
            conversation={activeConversation}
            messages={messages}
            loading={loadingMessages}
            onBack={isMobile ? () => selectConversation(null) : undefined}
          />
          {activeConversation && (
            <MessageCompose
              onSend={sendMessage}
              placeholder={
                activeConversation.type === 'dm'
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
      />
    </div>
  );
}
