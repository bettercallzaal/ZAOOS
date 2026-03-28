'use client';

import { MicButton } from './MicButton';
import { LiveButton } from './LiveButton';
import { ScreenShareButton } from './ScreenShareButton';

interface ControlsPanelProps {
  isHost: boolean;
  isAuthenticated?: boolean;
  onBroadcast?: () => void;
  isBroadcasting?: boolean;
}

export function ControlsPanel({ isHost, isAuthenticated = false, onBroadcast, isBroadcasting }: ControlsPanelProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-6 py-4 flex-wrap">
      <MicButton />
      {isHost && <LiveButton />}
      {isHost && <ScreenShareButton isAuthenticated={isAuthenticated} />}
      {isHost && (
        <button
          onClick={onBroadcast}
          className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
            isBroadcasting
              ? 'bg-red-600/20 text-red-400 border border-red-600/30'
              : 'bg-[#1a2a3a] text-gray-300 hover:text-white border border-gray-700'
          }`}
        >
          {isBroadcasting && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
          📡 {isBroadcasting ? 'Broadcasting' : 'Broadcast'}
        </button>
      )}
    </div>
  );
}
