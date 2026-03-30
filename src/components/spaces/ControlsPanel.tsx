'use client';

import { MicButton } from './MicButton';
import { CameraButton } from './CameraButton';
import { LiveButton } from './LiveButton';
import { ScreenShareButton } from './ScreenShareButton';
import { LayoutToggle } from './LayoutToggle';

interface ControlsPanelProps {
  isHost: boolean;
  isAuthenticated?: boolean;
  onBroadcast?: () => void;
  isBroadcasting?: boolean;
  roomType?: 'voice_channel' | 'stage';
  onMusicToggle?: () => void;
  onLayoutToggle?: () => void;
  layout?: 'content-first' | 'speakers-first';
  twitchUsername?: string | null;
  onTwitchChat?: () => void;
}

export function ControlsPanel({
  isHost,
  isAuthenticated = false,
  onBroadcast,
  isBroadcasting,
  roomType,
  onMusicToggle,
  onLayoutToggle,
  layout,
  twitchUsername,
  onTwitchChat,
}: ControlsPanelProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-3 flex-wrap">
      <MicButton />
      <CameraButton />
      {isHost && <LiveButton />}
      <ScreenShareButton isHost={isHost} isAuthenticated={isAuthenticated} roomType={roomType} />

      {/* Music toggle */}
      {isAuthenticated && (
        <button
          onClick={onMusicToggle}
          className="px-3 py-2.5 rounded-xl text-sm transition-colors bg-[#1a2a3a] text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500"
          title="Toggle music panel"
        >
          🎵
        </button>
      )}

      {/* Layout toggle — host only, stages only */}
      {isHost && roomType === 'stage' && layout && onLayoutToggle && (
        <LayoutToggle layout={layout} onToggle={onLayoutToggle} />
      )}

      {/* Raise hand — audience in stages */}
      {!isHost && roomType === 'stage' && (
        <button
          className="px-3 py-2.5 rounded-xl text-sm transition-colors bg-[#1a2a3a] text-gray-300 hover:text-[#f5a623] border border-gray-700 hover:border-[#f5a623]/50"
          title="Raise hand"
        >
          ✋
        </button>
      )}

      {/* Twitch Chat button — shown when host has Twitch connected */}
      {twitchUsername && onTwitchChat && (
        <button
          onClick={onTwitchChat}
          className="px-3 py-2.5 rounded-xl text-sm transition-colors bg-[#1a2a3a] text-gray-300 hover:text-[#9146ff] border border-gray-700 hover:border-[#9146ff]/50 flex items-center gap-1.5"
          title="Twitch Chat"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
          </svg>
          Chat
        </button>
      )}

      {/* Broadcast button */}
      {isHost && (
        isBroadcasting ? (
          <button
            onClick={onBroadcast}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium"
          >
            <span className="animate-pulse">📡</span>
            LIVE
          </button>
        ) : (
          <button
            onClick={onBroadcast}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 bg-[#1a2a3a] text-gray-300 hover:text-white border border-gray-700"
          >
            📡 Broadcast
          </button>
        )
      )}
    </div>
  );
}
