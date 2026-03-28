'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

interface ScreenShareButtonProps {
  isHost?: boolean;
  isAuthenticated?: boolean;
  roomType?: 'voice_channel' | 'stage';
}

export function ScreenShareButton({ isHost, isAuthenticated, roomType }: ScreenShareButtonProps) {
  const call = useCall();
  const { useScreenShareState } = useCallStateHooks();
  const { screenShare, isMute: isNotSharing } = useScreenShareState();

  // Voice channel: all authenticated users can share. Stage: host only.
  const shouldShow = isAuthenticated && (roomType === 'voice_channel' || isHost);
  if (!shouldShow) return null;

  const isSharing = !isNotSharing;

  const handleToggle = async () => {
    try {
      await screenShare.toggle();
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  if (!call) return null;

  return (
    <button
      onClick={handleToggle}
      className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
        isSharing
          ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30'
          : 'bg-[#1a2a3a] text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500'
      }`}
      title={isSharing ? 'Stop sharing screen' : 'Share your screen'}
    >
      {isSharing ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          Sharing
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Share Screen
        </>
      )}
    </button>
  );
}
