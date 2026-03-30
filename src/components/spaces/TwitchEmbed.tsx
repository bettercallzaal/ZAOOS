'use client';

import { useState } from 'react';

interface TwitchEmbedProps {
  channel: string;
  visible: boolean;
}

export function TwitchEmbed({ channel, visible }: TwitchEmbedProps) {
  const [expanded, setExpanded] = useState(true);

  if (!channel || !visible) return null;

  return (
    <div className="border-b border-gray-800 bg-[#0d1b2a]">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Twitch Stream &mdash; {channel}
        </span>
        <span className="text-xs text-gray-500">
          {expanded ? 'Hide Stream' : 'Show Stream'}
        </span>
      </button>

      {expanded && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=zaoos.com&muted=true`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media"
            title={`${channel} Twitch stream`}
          />
        </div>
      )}
    </div>
  );
}
