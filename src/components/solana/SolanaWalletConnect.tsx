'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { WalletName } from '@solana/wallet-adapter-base';
import bs58 from 'bs58';

interface SolanaWalletConnectProps {
  savedWallet: string | null;
  onSaved: (wallet: string | null) => void;
}

export function SolanaWalletConnect({ savedWallet, onSaved }: SolanaWalletConnectProps) {
  const { publicKey, connected, connect, disconnect, select, wallets, signMessage, wallet } = useWallet();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const pendingWalletName = useRef<string | null>(null);

  const shortAddr = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  // Clear connecting state when wallet connects or disconnects
  useEffect(() => {
    if (connected && publicKey) {
      queueMicrotask(() => setConnecting(false));
      pendingWalletName.current = null;
    }
  }, [connected, publicKey]);

  // After select() updates the wallet adapter, trigger connect()
  useEffect(() => {
    if (!pendingWalletName.current || !wallet) return;
    if (wallet.adapter.name === pendingWalletName.current) {
      pendingWalletName.current = null;
      // Small delay to let the adapter fully initialize
      const timer = setTimeout(() => {
        connect().catch(() => {
          setError('Failed to connect — check your wallet extension');
          setConnecting(false);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [wallet, connect]);

  // Timeout fallback — don't stay stuck on "Connecting..." forever
  useEffect(() => {
    if (!connecting) return;
    const timeout = setTimeout(() => {
      if (connecting) {
        setConnecting(false);
        setError('Connection timed out — try again');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [connecting]);

  const handleConnect = useCallback((walletName: string) => {
    setError('');
    setShowWalletPicker(false);
    setConnecting(true);
    pendingWalletName.current = walletName;
    select(walletName as WalletName);
  }, [select]);

  const handleVerifyAndSave = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    setSaving(true);
    setError('');
    try {
      const message = new TextEncoder().encode(
        `Verify Solana wallet for ZAO OS\nAddress: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`
      );
      const signature = await signMessage(message);

      const res = await fetch('/api/users/solana-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message: new TextDecoder().decode(message),
        }),
      });

      if (res.ok) {
        onSaved(publicKey.toBase58());
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save wallet');
      }
    } catch {
      setError('Signature rejected or failed');
    }
    setSaving(false);
  }, [publicKey, signMessage, onSaved]);

  const handleDisconnect = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users/solana-wallet', { method: 'DELETE' });
      if (res.ok) {
        onSaved(null);
        await disconnect();
      }
    } catch {
      setError('Failed to disconnect');
    }
    setSaving(false);
  }, [disconnect, onSaved]);

  // Already saved — show connected state
  if (savedWallet) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-sm text-white">Solana</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-400 font-mono">{shortAddr(savedWallet)}</span>
          <button
            onClick={handleDisconnect}
            disabled={saving}
            className="text-[10px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {saving ? 'Removing...' : 'Disconnect'}
          </button>
        </div>
      </div>
    );
  }

  // Connecting state
  if (connecting) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-sm text-white">Solana</span>
        </div>
        <span className="text-xs text-gray-400">Connecting...</span>
      </div>
    );
  }

  // Connected but not yet verified/saved
  if (connected && publicKey) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-sm text-white">Solana</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">{shortAddr(publicKey.toBase58())}</span>
            <button
              onClick={handleVerifyAndSave}
              disabled={saving}
              className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              {saving ? 'Verifying...' : 'Verify & Save'}
            </button>
          </div>
        </div>
        {error && <p className="text-[10px] text-red-400 mt-1 text-right">{error}</p>}
      </div>
    );
  }

  // Not connected — show connect options
  const availableWallets = wallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-sm text-white">Solana</span>
        </div>
        <button
          onClick={() => setShowWalletPicker(!showWalletPicker)}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Connect
        </button>
      </div>

      {showWalletPicker && (
        <div className="mt-2 bg-[#0a1628] rounded-lg p-3 border border-gray-700 space-y-2">
          <p className="text-[10px] text-gray-500">Choose a Solana wallet</p>
          {availableWallets.length === 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-600">No Solana wallets detected.</p>
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] text-purple-400 hover:text-purple-300"
              >
                Install Phantom &rarr;
              </a>
            </div>
          ) : (
            availableWallets.map(w => (
              <button
                key={w.adapter.name}
                onClick={() => handleConnect(w.adapter.name)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a2a3a] transition-colors text-left"
              >
                {w.adapter.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.adapter.icon} alt={w.adapter.name} className="w-5 h-5 rounded" />
                )}
                <span className="text-sm text-white">{w.adapter.name}</span>
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
