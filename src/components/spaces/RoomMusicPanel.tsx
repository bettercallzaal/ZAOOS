'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useListeningRoom, type ListenerInfo } from '@/hooks/useListeningRoom';

interface RoomMusicPanelProps {
  roomId: string;
  isHost: boolean;
}

/**
 * Music/DJ panel for Spaces rooms.
 * Splits into guest (no audio providers) and authenticated (full DJ) modes.
 */
export function RoomMusicPanel({ roomId, isHost }: RoomMusicPanelProps) {
  const { user } = useAuth();

  // Guest users don't have AudioProviders — show minimal prompt
  if (!user) {
    return <GuestMusicPanel />;
  }

  return <AuthenticatedMusicPanel roomId={roomId} isHost={isHost} />;
}

// ─── Guest Panel ───────────────────────────────────────────────────────────────

function GuestMusicPanel() {
  return (
    <div className="border-t border-gray-800 bg-[#0d1b2a] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MusicIcon />
          <span className="text-xs text-gray-500">Music</span>
        </div>
        <a
          href="/"
          className="text-xs text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
        >
          Sign in to DJ
        </a>
      </div>
    </div>
  );
}

// ─── Authenticated Panel (uses useListeningRoom which requires AudioProviders) ─

function AuthenticatedMusicPanel({ roomId, isHost }: { roomId: string; isHost: boolean }) {
  const { user } = useAuth();

  const userInfo: ListenerInfo | null = user
    ? { fid: user.fid, displayName: user.displayName || user.username, pfpUrl: user.pfpUrl || undefined }
    : null;

  const room = useListeningRoom(userInfo);

  // Join the listening room when the component mounts
  useEffect(() => {
    if (userInfo && roomId) {
      room.joinRoom(roomId);
    }
    return () => {
      room.leaveRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userInfo?.fid]);

  const { currentTrack, isPlaying, isDJ, djInfo, listeners, broadcastPause, broadcastResume } = room;

  return (
    <div className="border-t border-gray-800 bg-[#0d1b2a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <MusicIcon />
          <span className="text-xs font-medium text-gray-400">
            {isDJ ? 'DJ Mode' : 'Listening Room'}
          </span>
          {room.isConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {listeners.length > 0 && (
            <span className="text-[10px] text-gray-500">
              {listeners.length} listening
            </span>
          )}
          {djInfo && !isDJ && (
            <span className="text-[10px] text-[#f5a623]/70">
              DJ: {djInfo.displayName}
            </span>
          )}
        </div>
      </div>

      {/* Now Playing / Track Display */}
      {currentTrack ? (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5">
            {/* Artwork */}
            {currentTrack.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.trackName}
                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-[#f5a623]/10 flex items-center justify-center flex-shrink-0">
                <MusicIcon />
              </div>
            )}

            {/* Track Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white font-medium truncate">
                {currentTrack.trackName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentTrack.artistName}
              </p>
            </div>

            {/* Playing indicator for listeners / Controls for DJ */}
            {isDJ ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => (isPlaying ? broadcastPause() : broadcastResume())}
                  className="w-8 h-8 rounded-full bg-[#f5a623] flex items-center justify-center hover:bg-[#ffd700] transition-colors"
                  title={isPlaying ? 'Pause' : 'Resume'}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 flex-shrink-0">
                {isPlaying && <PlayingBars />}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <div className="text-center py-3 text-gray-600 text-xs">
            {isDJ
              ? 'Play a track from the music tab to start DJing'
              : 'No music playing yet'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function MusicIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f5a623"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0a1628">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0a1628">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function PlayingBars() {
  return (
    <div className="flex items-end gap-px">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-0.5 bg-[#f5a623] rounded-full animate-bounce"
          style={{
            height: `${4 + i * 2}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}
