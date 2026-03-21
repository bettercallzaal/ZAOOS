'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

interface SolanaWalletConnectProps {
  savedWallet: string | null;
  onSaved: (wallet: string | null) => void;
}

export function SolanaWalletConnect({ savedWallet, onSaved }: SolanaWalletConnectProps) {
  const { publicKey, connected, connect, disconnect, select, wallets, signMessage } = useWallet();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const shortAddr = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const handleConnect = useCallback(async (walletName: string) => {
    setError('');
    setShowWalletPicker(false);
    try {
      const wallet = wallets.find(w => w.adapter.name === walletName);
      if (!wallet) return;
      select(wallet.adapter.name);
      await connect();
    } catch {
      setError('Failed to connect wallet');
    }
  }, [wallets, select, connect]);

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
          {wallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable').length === 0 ? (
            <p className="text-[10px] text-gray-600">No Solana wallets detected. Install Phantom or Solflare.</p>
          ) : (
            wallets
              .filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable')
              .map(wallet => (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleConnect(wallet.adapter.name)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a2a3a] transition-colors text-left"
                >
                  {wallet.adapter.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-5 h-5 rounded" />
                  )}
                  <span className="text-sm text-white">{wallet.adapter.name}</span>
                </button>
              ))
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
