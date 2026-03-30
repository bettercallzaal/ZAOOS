'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useListeningRoom, type ListenerInfo } from '@/hooks/useListeningRoom';
import { useRadio } from '@/hooks/useRadio';
import { usePlayer } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';

interface RoomMusicPanelProps {
  roomId: string;
  isHost: boolean;
  onOpenMusicBrowser?: () => void;
}

/**
 * Music/DJ panel for Spaces rooms.
 * Splits into guest (no audio providers) and authenticated (full DJ) modes.
 */
export function RoomMusicPanel({ roomId, isHost, onOpenMusicBrowser }: RoomMusicPanelProps) {
  const { user } = useAuth();

  // Guest users don't have AudioProviders — show minimal prompt
  if (!user) {
    return <GuestMusicPanel />;
  }

  return <AuthenticatedMusicPanel roomId={roomId} isHost={isHost} onOpenMusicBrowser={onOpenMusicBrowser} />;
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
        <Link
          href="/"
          className="text-xs text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
        >
          Sign in to DJ
        </Link>
      </div>
    </div>
  );
}

// ─── Authenticated Panel (uses useListeningRoom which requires AudioProviders) ─

function AuthenticatedMusicPanel({ roomId, onOpenMusicBrowser }: { roomId: string; isHost: boolean; onOpenMusicBrowser?: () => void }) {
  const { user } = useAuth();

  const userInfo: ListenerInfo | null = user
    ? { fid: user.fid, displayName: user.displayName || user.username, pfpUrl: user.pfpUrl || undefined }
    : null;

  const room = useListeningRoom(userInfo);
  const radio = useRadio();

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

  const {
    currentTrack,
    isPlaying,
    isDJ,
    djInfo,
    listeners,
    broadcastPlay,
    broadcastPause,
    broadcastResume,
    broadcastSkip,
  } = room;

  const handleStartRadio = async () => {
    await radio.startRadio();
  };

  const handleSkipRadioTrack = () => {
    radio.nextRadioTrack();
  };

  return (
    <div className="border-t border-gray-800 bg-[#0d1b2a]">
      {/* Auto-broadcast player state changes to room listeners when DJ.
          This ensures radio track changes (which bypass broadcastPlay) are
          automatically synced to all listeners in the room. */}
      {isDJ && (
        <PlayerBroadcastBridge
          isDJ={isDJ}
          isRadioMode={radio.isRadioMode}
          broadcastPlay={broadcastPlay}
          broadcastSkip={broadcastSkip}
        />
      )}

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
                {/* Browse music button */}
                {onOpenMusicBrowser && (
                  <button
                    onClick={onOpenMusicBrowser}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Browse music"
                  >
                    <BrowseIcon />
                  </button>
                )}
                {/* Skip button — only shown in radio mode */}
                {radio.isRadioMode && (
                  <button
                    onClick={handleSkipRadioTrack}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Skip to next track"
                  >
                    <SkipIcon />
                  </button>
                )}
                {/* Play / Pause */}
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
          {isDJ ? (
            <div className="flex flex-col items-center gap-2 py-2">
              {/* Start Radio CTA */}
              <button
                onClick={handleStartRadio}
                disabled={radio.radioLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-xs font-semibold hover:bg-[#ffd700] disabled:opacity-60 transition-colors w-full justify-center"
              >
                {radio.radioLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
                    Loading radio...
                  </>
                ) : (
                  <>
                    <RadioIcon />
                    Start ZAO Radio
                  </>
                )}
              </button>
              {onOpenMusicBrowser && (
                <button
                  onClick={onOpenMusicBrowser}
                  className="w-full py-3 rounded-lg bg-[#f5a62320] text-[#f5a623] text-sm hover:bg-[#f5a62340] transition-colors flex items-center justify-center gap-2"
                >
                  <MusicIcon /> Browse Music
                </button>
              )}
              {!onOpenMusicBrowser && (
                <p className="text-[10px] text-gray-600 text-center">
                  or play any track from the music tab
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-600 text-xs">
              No music playing yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PlayerBroadcastBridge ────────────────────────────────────────────────────
// Invisible component that watches player.metadata and auto-broadcasts to the
// room channel whenever the DJ starts a new track (e.g. via radio or manual play).
// This ensures listeners stay in sync without the DJ having to manually trigger
// a broadcast — radio and manual plays are both picked up automatically.

function PlayerBroadcastBridge({
  isDJ,
  isRadioMode,
  broadcastPlay,
  broadcastSkip,
}: {
  isDJ: boolean;
  isRadioMode: boolean;
  broadcastPlay: (track: TrackMetadata) => void;
  broadcastSkip: (track: TrackMetadata) => void;
}) {
  const player = usePlayer();
  const lastBroadcastIdRef = useRef<string | null>(null);
  const hasInitialBroadcastRef = useRef(false);

  useEffect(() => {
    if (!isDJ) return;
    if (!player.metadata) return;

    const trackId = player.metadata.feedId ?? player.metadata.id;
    if (trackId === lastBroadcastIdRef.current) return;

    lastBroadcastIdRef.current = trackId;

    if (isRadioMode && hasInitialBroadcastRef.current) {
      // Subsequent radio track — broadcast as a skip
      broadcastSkip(player.metadata);
    } else {
      // First track or a manual (non-radio) play
      broadcastPlay(player.metadata);
      hasInitialBroadcastRef.current = true;
    }
  }, [isDJ, player.metadata, isRadioMode, broadcastPlay, broadcastSkip]);

  // Reset initial-broadcast flag when radio mode turns off
  useEffect(() => {
    if (!isRadioMode) {
      hasInitialBroadcastRef.current = false;
    }
  }, [isRadioMode]);

  return null;
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

function RadioIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  );
}

function BrowseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
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
