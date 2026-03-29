'use client';

import { useState, useEffect } from 'react';

export function LastfmConnect() {
  const [status, setStatus] = useState<{ connected: boolean; connectUrl: string | null } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/lastfm').then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  if (!status) return null;

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Last.fm</p>
          <p className="text-xs text-gray-500">Scrobble your ZAO OS plays to Last.fm</p>
        </div>
        {status.connected ? (
          <button
            onClick={async () => {
              setDisconnecting(true);
              await fetch('/api/auth/lastfm/disconnect', { method: 'POST' });
              setStatus({ connected: false, connectUrl: null });
              setDisconnecting(false);
            }}
            disabled={disconnecting}
            className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <a
            href={status.connectUrl || '#'}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20 hover:bg-[#f5a623]/20 transition-colors"
          >
            Connect
          </a>
        )}
      </div>
      {status.connected && (
        <p className="text-[10px] text-green-400 mt-2">Connected — your plays are being scrobbled</p>
      )}
    </div>
  );
}
