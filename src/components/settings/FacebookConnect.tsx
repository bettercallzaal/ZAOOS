'use client';

import { useState, useEffect } from 'react';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface FacebookConnection {
  connected: boolean;
  userId?: string;
  username?: string;
  displayName?: string;
  primaryPageId?: string;
  primaryPageName?: string;
  pages?: FacebookPage[];
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export function FacebookConnect() {
  const [connection, setConnection] = useState<FacebookConnection>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/platforms/facebook')
      .then((r) => r.json())
      .then((data) => setConnection(data))
      .catch(() => setConnection({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/platforms/facebook', { method: 'DELETE' });
      setConnection({ connected: false });
    } catch {
      // silent — connection state unchanged
    }
    setDisconnecting(false);
  };

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-800" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-20 bg-gray-800 rounded" />
            <div className="h-3 w-28 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1877f2]/15">
            <FacebookIcon className="w-4 h-4 text-[#1877f2]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Facebook Live</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connection.connected ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
              <span className={`text-xs ${connection.connected ? 'text-gray-400' : 'text-gray-600'}`}>
                {connection.connected
                  ? `Connected as ${connection.displayName || connection.username}`
                  : 'Not connected'}
              </span>
            </div>
          </div>
        </div>

        {connection.connected ? (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <a
            href="/api/auth/facebook"
            className="text-xs px-3 py-1.5 rounded-lg font-semibold text-[#0a1628] bg-[#f5a623] hover:bg-[#ffd700] transition-colors"
          >
            Connect
          </a>
        )}
      </div>

      {/* Page info (only when connected) */}
      {connection.connected && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/[0.08] pt-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Streaming Page
          </p>

          {connection.primaryPageName ? (
            <div className="flex items-center gap-2 bg-[#0a1628] rounded-lg px-3 py-2 border border-white/[0.08]">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-600 mb-0.5">Primary Page</p>
                <p className="text-xs text-gray-300 truncate">{connection.primaryPageName}</p>
              </div>
              {connection.primaryPageId && (
                <button
                  onClick={() => handleCopy(connection.primaryPageId!)}
                  className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Copy page ID"
                >
                  {copied ? (
                    <span className="text-[10px] text-green-400">Copied</span>
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#0a1628] rounded-lg px-3 py-2 border border-amber-500/20">
              <p className="text-[10px] text-amber-400/80">
                No Facebook Page found. You need to manage at least one Page to go live.
              </p>
            </div>
          )}

          {connection.pages && connection.pages.length > 1 && (
            <p className="text-[10px] text-gray-600">
              {connection.pages.length} pages available — first page used by default.
            </p>
          )}

          <p className="text-[10px] text-gray-600 mt-1">
            RTMP stream URL is generated each time you go live — no manual copy needed.
          </p>
        </div>
      )}
    </div>
  );
}
export default FacebookConnect;
