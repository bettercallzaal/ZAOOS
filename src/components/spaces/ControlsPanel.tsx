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
