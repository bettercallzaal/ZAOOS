'use client';

import { useState, useEffect } from 'react';

interface TwitchConnection {
  connected: boolean;
  username?: string;
  displayName?: string;
  streamKey?: string;
  rtmpUrl?: string;
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

export function TwitchConnect() {
  const [connection, setConnection] = useState<TwitchConnection>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<'key' | 'rtmp' | null>(null);

  useEffect(() => {
    fetch('/api/platforms/twitch')
      .then((r) => r.json())
      .then((data) => setConnection(data))
      .catch(() => setConnection({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/platforms/twitch', { method: 'DELETE' });
      setConnection({ connected: false });
    } catch {
      // silent — connection state unchanged
    }
    setDisconnecting(false);
  };

  const handleCopy = async (value: string, field: 'key' | 'rtmp') => {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#9147ff]/15">
            <TwitchIcon className="w-4 h-4 text-[#9147ff]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Twitch</p>
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
            href="/api/auth/twitch"
            className="text-xs px-3 py-1.5 rounded-lg font-semibold text-[#0a1628] bg-[#f5a623] hover:bg-[#ffd700] transition-colors"
          >
            Connect
          </a>
        )}
      </div>

      {/* Stream credentials (only when connected) */}
      {connection.connected && (connection.streamKey || connection.rtmpUrl) && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/[0.08] pt-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Stream Credentials
          </p>

          {/* RTMP URL */}
          {connection.rtmpUrl && (
            <div className="flex items-center gap-2 bg-[#0a1628] rounded-lg px-3 py-2 border border-white/[0.08]">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-600 mb-0.5">RTMP URL</p>
                <p className="text-xs text-gray-300 font-mono truncate">{connection.rtmpUrl}</p>
              </div>
              <button
                onClick={() => handleCopy(connection.rtmpUrl!, 'rtmp')}
                className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                title="Copy RTMP URL"
              >
                {copied === 'rtmp' ? (
                  <span className="text-[10px] text-green-400">Copied</span>
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Stream Key */}
          {connection.streamKey && (
            <div className="flex items-center gap-2 bg-[#0a1628] rounded-lg px-3 py-2 border border-white/[0.08]">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-600 mb-0.5">Stream Key</p>
                <p className="text-xs text-gray-300 font-mono truncate">
                  {showKey ? connection.streamKey : '••••••••••••••••••••'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                  title={showKey ? 'Hide stream key' : 'Show stream key'}
                >
                  {showKey ? (
                    <EyeOffIcon className="w-3.5 h-3.5" />
                  ) : (
                    <EyeIcon className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleCopy(connection.streamKey!, 'key')}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                  title="Copy stream key"
                >
                  {copied === 'key' ? (
                    <span className="text-[10px] text-green-400">Copied</span>
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-600 mt-1">
            These are auto-filled when you go live — no manual copy needed.
          </p>
        </div>
      )}
    </div>
  );
}

export default TwitchConnect;
