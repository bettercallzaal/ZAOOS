'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useListeningRoom } from '@/hooks/useListeningRoom';
import { useRadio } from '@/hooks/useRadio';
import { usePlayer } from '@/providers/audio';
import type { ListenerInfo } from '@/hooks/useListeningRoom';

const JitsiRoom = dynamic(
  () => import('@/components/calls/JitsiRoom').then((mod) => mod.JitsiRoom),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Loading voice chat...
      </div>
    ),
  }
);

interface ListeningRoomProps {
  jitsiRoomName: string;
  roomLabel: string;
  onLeave: () => void;
}

export function ListeningRoom({ jitsiRoomName, roomLabel, onLeave }: ListeningRoomProps) {
  const { user } = useAuth();
  const player = usePlayer();
  const radio = useRadio();
  const [showStationPicker, setShowStationPicker] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);

  const userInfo: ListenerInfo | null = useMemo(() => {
    if (!user) return null;
    return {
      fid: user.fid,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
    };
  }, [user]);

  const room = useListeningRoom(userInfo);

  // Join the broadcast room on mount
  useEffect(() => {
    if (userInfo) {
      room.joinRoom(jitsiRoomName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jitsiRoomName, userInfo?.fid]);

  // Wire up radio's onEnded to auto-advance (DJ only)
  useEffect(() => {
    if (room.isDJ && radio.isRadioMode) {
      player.setOnEnded(() => {
        radio.nextRadioTrack();
      });
    }
    return () => {
      player.setOnEnded(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.isDJ, radio.isRadioMode]);

  // When DJ plays a track via radio, broadcast it
  useEffect(() => {
    if (room.isDJ && player.metadata && player.isPlaying) {
      // Only broadcast if it's a new track (radio auto-advance)
      if (room.currentTrack?.id !== player.metadata.id) {
        room.broadcastSkip(player.metadata);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.metadata?.id, room.isDJ]);

  const handleLeave = useCallback(() => {
    room.leaveRoom();
    radio.stopRadio();
    onLeave();
  }, [room, radio, onLeave]);

  const handlePlayPause = useCallback(() => {
    if (room.isPlaying) {
      room.broadcastPause();
    } else {
      room.broadcastResume();
    }
  }, [room]);

  const handleNext = useCallback(() => {
    radio.nextRadioTrack();
    // The useEffect above will broadcast the new track
  }, [radio]);

  const handlePrev = useCallback(() => {
    radio.prevRadioTrack();
  }, [radio]);

  const handleStartRadio = useCallback(async () => {
    await radio.startRadio();
  }, [radio]);

  const handleSwitchStation = useCallback((index: number) => {
    radio.switchStation(index);
    setShowStationPicker(false);
  }, [radio]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!room.isDJ || !player.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const position = pct * player.duration;
    room.broadcastSeek(position);
  }, [room, player.duration]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = player.duration > 0 ? (player.position / player.duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a1628] flex flex-col overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <h2 className="font-semibold text-sm text-white truncate">{roomLabel}</h2>
          <span className="text-xs text-gray-500 shrink-0">
            {room.listeners.length} listening
          </span>
          {room.isDJ && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0a1628] bg-[#f5a623] px-2 py-0.5 rounded-full shrink-0">
              DJ
            </span>
          )}
          {!room.isDJ && room.djInfo && (
            <span className="text-[10px] text-gray-500 shrink-0">
              DJ: {room.djInfo.displayName}
            </span>
          )}
        </div>
        <button
          onClick={handleLeave}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shrink-0"
        >
          Leave
        </button>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── Voice Chat Panel ────────────────────────────────────────────── */}
        <div className="h-[35vh] md:h-auto md:w-[45%] lg:w-[40%] border-b md:border-b-0 md:border-r border-gray-800 relative">
          <JitsiRoom
            roomName={jitsiRoomName}
            displayName={user?.displayName ?? 'ZAO Member'}
            audioOnly={true}
            onClose={handleLeave}
          />
          {/* Voice mute overlay toggle */}
          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#0d1b2a]/80 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors md:hidden"
            title={voiceMuted ? 'Unmute mic' : 'Mute mic'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              {voiceMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 19 5 5m12 7V4a3 3 0 0 0-6 0v4m-3.42 3.58A3 3 0 0 0 12 15a3 3 0 0 0 3-3m3 0a6 6 0 0 1-9.33 5M12 19v3m-3 0h6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
              )}
            </svg>
          </button>
        </div>

        {/* ── Music Panel ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Now Playing */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
            {player.metadata ? (
              <div className="w-full max-w-md space-y-6">
                {/* Album Art */}
                <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-[#0d1b2a] border border-gray-800 shadow-2xl shadow-black/40">
                  {player.metadata.artworkUrl ? (
                    <img
                      src={player.metadata.artworkUrl}
                      alt={player.metadata.trackName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                  {/* Playing indicator overlay */}
                  {room.isPlaying && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1">
                      <div className="flex gap-0.5 items-end h-4">
                        <div className="w-0.5 bg-[#f5a623] rounded-full animate-[barBounce_0.8s_ease-in-out_infinite]" style={{ height: '60%' }} />
                        <div className="w-0.5 bg-[#f5a623] rounded-full animate-[barBounce_0.8s_ease-in-out_infinite_0.2s]" style={{ height: '100%' }} />
                        <div className="w-0.5 bg-[#f5a623] rounded-full animate-[barBounce_0.8s_ease-in-out_infinite_0.4s]" style={{ height: '40%' }} />
                        <div className="w-0.5 bg-[#f5a623] rounded-full animate-[barBounce_0.8s_ease-in-out_infinite_0.6s]" style={{ height: '80%' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold text-white truncate">
                    {player.metadata.trackName}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {player.metadata.artistName}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div
                    className={`w-full h-1.5 bg-gray-800 rounded-full overflow-hidden ${room.isDJ ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={room.isDJ ? handleSeek : undefined}
                  >
                    <div
                      className="h-full bg-[#f5a623] rounded-full transition-[width] duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600">
                    <span>{formatTime(player.position)}</span>
                    <span>{formatTime(player.duration)}</span>
                  </div>
                </div>

                {/* DJ Controls */}
                {room.isDJ ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={handlePrev}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        title="Previous"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                        </svg>
                      </button>
                      <button
                        onClick={handlePlayPause}
                        className="w-14 h-14 rounded-full bg-[#f5a623] hover:bg-[#ffd700] flex items-center justify-center text-[#0a1628] transition-colors shadow-lg shadow-[#f5a623]/20"
                        title={room.isPlaying ? 'Pause' : 'Play'}
                      >
                        {room.isPlaying ? (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={handleNext}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        title="Next"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                        </svg>
                      </button>
                    </div>

                    {/* Station Picker */}
                    <div className="relative">
                      <button
                        onClick={() => setShowStationPicker(!showStationPicker)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0d1b2a] border border-gray-800 hover:border-[#f5a623]/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A47.865 47.865 0 0012 6.75z" />
                          </svg>
                          <span className="text-sm text-white">
                            {radio.radioPlaylist?.name ?? 'Select Station'}
                          </span>
                        </div>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${showStationPicker ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {showStationPicker && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0d1b2a] border border-gray-800 rounded-xl overflow-hidden shadow-xl shadow-black/40 z-10">
                          {radio.availableStations.map((name, i) => (
                            <button
                              key={name}
                              onClick={() => handleSwitchStation(i)}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1a2a3a] transition-colors ${
                                i === radio.currentStationIndex
                                  ? 'text-[#f5a623] bg-[#f5a623]/5'
                                  : 'text-gray-300'
                              }`}
                            >
                              {name}
                              {i === radio.currentStationIndex && (
                                <span className="ml-2 text-[10px] text-[#f5a623]/60">playing</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Listener view */
                  <div className="text-center">
                    <button
                      onClick={() => room.becomeDJ()}
                      className="px-5 py-2 text-sm font-medium rounded-xl border border-[#f5a623]/30 text-[#f5a623] hover:bg-[#f5a623]/10 transition-colors"
                    >
                      Request DJ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* No track — DJ should start radio */
              <div className="text-center space-y-6 max-w-sm">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-[#0d1b2a] border border-gray-800 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-300 font-medium">
                    {room.isDJ ? 'You\'re the DJ' : 'Waiting for DJ'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {room.isDJ
                      ? 'Start a station to begin playing music for everyone'
                      : 'The DJ will start playing music soon'}
                  </p>
                </div>
                {room.isDJ && (
                  <button
                    onClick={handleStartRadio}
                    disabled={radio.radioLoading}
                    className="px-6 py-3 text-sm font-semibold rounded-xl bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] transition-colors disabled:opacity-50 shadow-lg shadow-[#f5a623]/20"
                  >
                    {radio.radioLoading ? 'Loading Stations...' : 'Start ZAO Radio'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Queue (DJ only, when radio is active) ──────────────────────── */}
          {room.isDJ && radio.isRadioMode && radio.radioQueue.length > 0 && (
            <div className="border-t border-gray-800 bg-[#0d1b2a]/50 px-4 py-3 max-h-[180px] overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">Up Next</p>
              <div className="space-y-1">
                {radio.radioQueue
                  .slice(radio.radioIndex + 1, radio.radioIndex + 6)
                  .map((track, i) => (
                    <div
                      key={`${track.id}-${i}`}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#1a2a3a]/50 transition-colors"
                    >
                      <span className="text-[10px] text-gray-700 w-4 text-right shrink-0">{i + 1}</span>
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded bg-gray-800 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-gray-300 truncate">{track.title}</p>
                        <p className="text-[10px] text-gray-600 truncate">{track.artist}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── Listener Avatars Strip ─────────────────────────────────────── */}
          <div className="border-t border-gray-800 bg-[#0d1b2a] px-4 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {room.listeners.slice(0, 8).map((listener) => (
                  <div
                    key={listener.fid}
                    className="relative w-8 h-8 rounded-full border-2 border-[#0d1b2a] overflow-hidden bg-gray-800 shrink-0"
                    title={listener.displayName}
                  >
                    {listener.pfpUrl ? (
                      <img
                        src={listener.pfpUrl}
                        alt={listener.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-medium">
                        {listener.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Online dot */}
                    <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-[#0d1b2a]" />
                  </div>
                ))}
                {room.listeners.length > 8 && (
                  <div className="w-8 h-8 rounded-full border-2 border-[#0d1b2a] bg-gray-800 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-gray-400">+{room.listeners.length - 8}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {room.listeners.length} {room.listeners.length === 1 ? 'person' : 'people'} listening
              </span>
              {!room.isConnected && (
                <span className="text-[10px] text-yellow-500 ml-auto">Connecting...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
