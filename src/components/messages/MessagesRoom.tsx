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
    connect,
    selectConversation,
    sendMessage,
    createDm,
    createGroup,
  } = useXMTPContext();

  const [dialogType, setDialogType] = useState<'dm' | 'group' | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  // On mobile, show either the list or the thread, not both
  const showList = !isMobile || !activeConversationId;
  const showThread = !isMobile || !!activeConversationId;

  const handleConnect = useCallback(async () => {
    if (!user) return;

    // We need the user's wallet address — fetch it from their Farcaster profile
    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(user.username)}`);
      const data = await res.json();
      const farcasterUser = data.users?.find((u: { fid: number }) => u.fid === user.fid);

      let address: string | null = null;

      // Try verified ETH addresses first, then custody address
      if (farcasterUser?.verified_addresses?.eth_addresses?.length > 0) {
        address = farcasterUser.verified_addresses.eth_addresses[0];
      } else if (farcasterUser?.custody_address) {
        address = farcasterUser.custody_address;
      }

      if (!address) {
        throw new Error('No wallet address found. Connect a wallet to your Farcaster account first.');
      }

      // For browser wallet signing, we use window.ethereum
      const ethereum = (window as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<string> } }).ethereum;
      if (!ethereum) {
        throw new Error('No wallet detected. Install MetaMask or another wallet extension.');
      }

      // Request account access
      await ethereum.request({ method: 'eth_requestAccounts' });

      const signMessage = async (message: string) => {
        return ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
      };

      await connect(address as `0x${string}`, signMessage);
    } catch (err) {
      console.error('Connection error:', err);
    }
  }, [user, connect]);

  const handleCreateDm = useCallback(async (address: `0x${string}`) => {
    const convId = await createDm(address);
    if (convId) {
      selectConversation(convId);
    }
  }, [createDm, selectConversation]);

  const handleCreateGroup = useCallback(async (name: string, addresses: `0x${string}`[]) => {
    const convId = await createGroup(name, addresses);
    if (convId) {
      selectConversation(convId);
    }
  }, [createGroup, selectConversation]);

  if (!user) return null;

  // Not connected to XMTP yet — show connect screen
  if (!isConnected) {
    return (
      <div className="flex h-[100dvh] bg-[#0a1628] text-white">
        {/* Sidebar placeholder */}
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
      {/* Conversation list sidebar */}
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-80 border-r border-gray-800'} bg-[#0d1b2a] flex flex-col`}>
          {/* Back to channels link */}
          <div className="px-4 pt-3 pb-1">
            <a href="/chat" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Channels
            </a>
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

      {/* Message thread */}
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

      {/* New conversation dialog */}
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
