'use client';

import { useState, useEffect } from 'react';

export function ListenBrainzConnect() {
  const [token, setToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/listenbrainz/status').then(r => r.json()).then(data => {
      if (data.connected) setConnected(true);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/listenbrainz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConnected(true);
      setToken('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/auth/listenbrainz', { method: 'DELETE' });
    setConnected(false);
  };

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">ListenBrainz</p>
          <p className="text-xs text-gray-500">Open-source scrobbling — get your token from listenbrainz.org/profile</p>
        </div>
        {connected && (
          <button
            onClick={handleDisconnect}
            className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
      {connected ? (
        <p className="text-[10px] text-green-400 mt-2">Connected — your plays are being scrobbled</p>
      ) : (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your ListenBrainz user token"
            className="flex-1 bg-[#0a1628] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50"
          />
          <button
            onClick={handleSave}
            disabled={!token || saving}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#f5a623] text-[#0a1628] font-medium hover:bg-[#f5a623]/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
