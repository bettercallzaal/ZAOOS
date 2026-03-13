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
    connectingWallet,
    isConnected,
    connectedWallets,
    error,
    conversations,
    activeConversationId,
    messages,
    loadingMessages,
    connectWallet,
    selectConversation,
    sendMessage,
    createDm,
    createGroup,
  } = useXMTPContext();

  const [dialogType, setDialogType] = useState<'dm' | 'group' | null>(null);
  const [showWalletSetup, setShowWalletSetup] = useState(!isConnected);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  // On mobile, show either the list or the thread, not both
  const showList = !isMobile || !activeConversationId;
  const showThread = !isMobile || !!activeConversationId;

  const handleConnectWallet = useCallback(async (address: `0x${string}`) => {
    // Get browser wallet provider
    const ethereum = (window as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!ethereum) {
      alert('No wallet extension detected. Install MetaMask or another Ethereum wallet.');
      return;
    }

    try {
      // Request accounts — this opens the wallet popup
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const connectedAddr = accounts?.[0]?.toLowerCase();

      if (!connectedAddr) {
        alert('No account returned from wallet.');
        return;
      }

      // The user needs to switch to the correct account in their wallet
      // if the connected account doesn't match the requested one
      const targetAddr = address.toLowerCase();
      if (connectedAddr !== targetAddr) {
        // Try to switch accounts (some wallets support wallet_requestPermissions)
        try {
          await ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          });
          const newAccounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
          const newAddr = newAccounts?.[0]?.toLowerCase();
          if (newAddr !== targetAddr) {
            alert(`Please switch to ${address.slice(0, 6)}...${address.slice(-4)} in your wallet and try again.`);
            return;
          }
        } catch {
          alert(`Please switch to ${address.slice(0, 6)}...${address.slice(-4)} in your wallet and try again.`);
          return;
        }
      }

      const signMessage = async (message: string) => {
        return ethereum.request({
          method: 'personal_sign',
          params: [message, targetAddr],
        }) as Promise<string>;
      };

      await connectWallet(targetAddr as `0x${string}`, signMessage);
    } catch (err) {
      console.error('Wallet connection error:', err);
    }
  }, [connectWallet]);

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

  // Show wallet setup screen
  if (showWalletSetup || !isConnected) {
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
        <ConnectXMTP
          isConnecting={isConnecting}
          connectingWallet={connectingWallet}
          connectedWallets={connectedWallets}
          error={error}
          onConnectWallet={handleConnectWallet}
          onContinue={() => setShowWalletSetup(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[#0a1628] text-white overflow-hidden">
      {/* Conversation list sidebar */}
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-80 border-r border-gray-800'} bg-[#0d1b2a] flex flex-col`}>
          {/* Back to channels link + wallet count */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <a href="/chat" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Channels
            </a>
            <button
              onClick={() => setShowWalletSetup(true)}
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              title="Manage wallets"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.75a2.25 2.25 0 012.25 2.25V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3H18" />
              </svg>
              {connectedWallets.length} wallet{connectedWallets.length !== 1 ? 's' : ''}
            </button>
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
