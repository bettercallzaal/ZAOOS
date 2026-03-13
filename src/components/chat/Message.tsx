'use client';

import { useState } from 'react';
import { Cast } from '@/types';

interface MessageProps {
  cast: Cast;
  isAdmin: boolean;
  onHide: (hash: string) => void;
  onOpenThread?: (hash: string) => void;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Message({ cast, isAdmin, onHide, onOpenThread }: MessageProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="group flex gap-3 px-4 py-2 hover:bg-white/5 relative"
      onContextMenu={(e) => {
        if (isAdmin) {
          e.preventDefault();
          setShowMenu(!showMenu);
        }
      }}
    >
      {/* Avatar */}
      {cast.author.pfp_url ? (
        <img
          src={cast.author.pfp_url}
          alt={cast.author.display_name}
          className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0 mt-0.5" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm text-white">
            {cast.author.display_name || cast.author.username}
          </span>
          <span className="text-xs text-gray-500">{timeAgo(cast.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">{cast.text}</p>
        {cast.replies.count > 0 && (
          <button
            onClick={() => onOpenThread?.(cast.hash)}
            className="text-xs text-[#f5a623] mt-1 hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            {cast.replies.count} {cast.replies.count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Admin context menu */}
      {isAdmin && showMenu && (
        <div className="absolute right-4 top-2 bg-[#1a2a3a] border border-gray-700 rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              onHide(cast.hash);
              setShowMenu(false);
            }}
            className="px-4 py-2 text-sm text-red-400 hover:bg-white/10 w-full text-left"
          >
            Hide message
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="px-4 py-2 text-sm text-gray-400 hover:bg-white/10 w-full text-left"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
