'use client';

import { useState, useCallback } from 'react';

interface TwitchChatPanelProps {
  twitchUsername: string;
  canSend?: boolean;
  onClose?: () => void;
}

export function TwitchChatPanel({ twitchUsername, canSend = false, onClose }: TwitchChatPanelProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const popoutUrl = `https://www.twitch.tv/popout/${encodeURIComponent(twitchUsername)}/chat`;

  const handleSend = useCallback(async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/twitch/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), channel: twitchUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send');
        return;
      }
      setSent((prev) => [...prev.slice(-19), message.trim()]);
      setMessage('');
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  }, [message, sending, twitchUsername]);

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#9146ff]" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
          </svg>
          <span className="text-sm font-medium">Twitch Chat</span>
          <span className="text-xs text-gray-400">/{twitchUsername}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={popoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#9146ff] hover:text-[#b380ff] transition-colors"
            title="Open Twitch chat popout"
          >
            Open in Twitch
          </a>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              &#10005;
            </button>
          )}
        </div>
      </div>

      {/* Chat area — embedded popout iframe for reading, sent messages overlay */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <iframe
          src={`${popoutUrl}?darkpopout`}
          title="Twitch Chat"
          className="flex-1 w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />

        {/* Sent messages toast */}
        {sent.length > 0 && (
          <div className="absolute bottom-16 left-2 right-2 flex flex-col gap-1 pointer-events-none">
            {sent.slice(-3).map((msg, i) => (
              <div key={i} className="text-xs bg-[#9146ff]/20 text-[#b380ff] rounded px-2 py-1 truncate">
                You: {msg}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.08] p-2">
        {canSend ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send to Twitch chat..."
              maxLength={500}
              className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2 border border-white/[0.08] focus:border-[#9146ff] focus:outline-none placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="px-3 py-2 bg-[#9146ff] hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        ) : (
          <p className="text-xs text-gray-500 text-center py-1">
            Reconnect Twitch with chat permissions to send messages
          </p>
        )}
        {error && <p className="text-xs text-red-400 mt-1 px-1">{error}</p>}
      </div>
    </div>
  );
}
