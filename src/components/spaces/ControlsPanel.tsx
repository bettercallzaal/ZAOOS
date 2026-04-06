'use client';

import { useState } from 'react';
import { MicButton } from './MicButton';
import { CameraButton } from './CameraButton';
import { LiveButton } from './LiveButton';
import { ScreenShareButton } from './ScreenShareButton';
import { LayoutToggle } from './LayoutToggle';
import { TwitchInteractivePanel } from './TwitchInteractivePanel';
import { HandRaiseQueue } from './HandRaiseQueue';
import { TranscriptionButton } from './TranscriptionButton';
import { NoiseCancelButton } from './NoiseCancelButton';

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
  roomId?: string;
  userFid?: number;
  username?: string;
  pfpUrl?: string;
  onRoomChat?: () => void;
  onParticipants?: () => void;
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
  roomId,
  userFid,
  username,
  pfpUrl,
  onRoomChat,
  onParticipants,
}: ControlsPanelProps) {
  const [showTwitchPanel, setShowTwitchPanel] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const hasExtras = (isAuthenticated && onMusicToggle) ||
    (isHost && roomType === 'stage' && layout && onLayoutToggle) ||
    (twitchUsername && onTwitchChat) ||
    (isHost && twitchUsername) ||
    (!isHost && roomType === 'stage') ||
    onRoomChat ||
    onParticipants;

  return (
    <div className="space-y-0">
      <div className="border-t border-white/[0.08] bg-[#0d1b2a]/80 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 px-4 py-3 max-w-2xl mx-auto">
          {/* Group 1: Audio controls */}
          <div className="flex items-center gap-2">
            <MicButton />
            <NoiseCancelButton />
            <CameraButton />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-700/50 mx-1 hidden sm:block" />

          {/* Group 2: Stream controls */}
          <div className="flex items-center gap-2">
            {isHost && <LiveButton />}
            <ScreenShareButton isHost={isHost} isAuthenticated={isAuthenticated} roomType={roomType} />

            {/* Broadcast button */}
            {isHost && (
              isBroadcasting ? (
                <button
                  onClick={onBroadcast}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  LIVE
                </button>
              ) : (
                <button
                  onClick={onBroadcast}
                  className="p-2.5 rounded-xl transition-colors bg-[#1a2a3a] text-gray-400 hover:text-white border border-white/[0.08] hover:border-gray-600"
                  title="Broadcast"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75z" />
                  </svg>
                </button>
              )
            )}

            {/* Transcription / Closed Captions toggle (host only) */}
            <TranscriptionButton isHost={isHost} />
          </div>

          {/* Divider before extras */}
          {hasExtras && <div className="w-px h-6 bg-gray-700/50 mx-1 hidden sm:block" />}

          {/* Group 3: Extras - visible on desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Music toggle */}
            {isAuthenticated && onMusicToggle && (
              <button
                onClick={onMusicToggle}
                className="p-2.5 rounded-xl text-sm transition-colors bg-[#1a2a3a] text-gray-400 hover:text-white border border-white/[0.08] hover:border-gray-600"
                title="Toggle music panel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </button>
            )}

            {/* Layout toggle */}
            {isHost && roomType === 'stage' && layout && onLayoutToggle && (
              <LayoutToggle layout={layout} onToggle={onLayoutToggle} />
            )}

            {/* Raise hand (listener) */}
            {!isHost && roomType === 'stage' && roomId && userFid && (
              <HandRaiseQueue
                roomId={roomId}
                fid={userFid}
                username={username ?? ''}
                pfpUrl={pfpUrl ?? ''}
                isHost={false}
              />
            )}

            {/* Room Chat */}
            {onRoomChat && (
              <button
                onClick={onRoomChat}
                className="p-2.5 rounded-xl text-sm transition-colors bg-[#1a2a3a] text-gray-400 hover:text-[#f5a623] border border-white/[0.08] hover:border-[#f5a623]/40"
                title="Room Chat"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </button>
            )}

            {/* Participants */}
            {onParticipants && (
              <button
                onClick={onParticipants}
                className="p-2.5 rounded-xl text-sm transition-colors bg-[#1a2a3a] text-gray-400 hover:text-[#f5a623] border border-white/[0.08] hover:border-[#f5a623]/40"
                title="Participants"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </button>
            )}

            {/* Twitch Chat */}
            {twitchUsername && onTwitchChat && (
              <button
                onClick={onTwitchChat}
                className="p-2.5 rounded-xl text-sm transition-colors bg-[#1a2a3a] text-gray-400 hover:text-[#9146ff] border border-white/[0.08] hover:border-[#9146ff]/40"
                title="Twitch Chat"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                </svg>
              </button>
            )}

            {/* Twitch interactive (polls/predictions/clips) */}
            {isHost && twitchUsername && (
              <button
                onClick={() => setShowTwitchPanel((p) => !p)}
                className={`p-2.5 rounded-xl text-sm transition-colors border ${
                  showTwitchPanel
                    ? 'bg-[#9146ff]/15 border-[#9146ff]/30 text-[#9146ff]'
                    : 'bg-[#1a2a3a] text-gray-400 hover:text-[#9146ff] border-white/[0.08] hover:border-[#9146ff]/40'
                }`}
                title="Twitch Polls, Predictions & Clips"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile: "More" overflow button */}
          {hasExtras && (
            <div className="sm:hidden relative">
              <button
                onClick={() => setShowMore(!showMore)}
                className={`p-2.5 rounded-xl text-sm transition-colors border ${
                  showMore
                    ? 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30'
                    : 'bg-[#1a2a3a] text-gray-400 border-white/[0.08] hover:text-white'
                }`}
                title="More options"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </button>

              {/* Mobile overflow menu */}
              {showMore && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#111d2e] border border-white/[0.08] rounded-xl shadow-xl shadow-black/30 py-1.5 min-w-[180px] z-10">
                  {isAuthenticated && onMusicToggle && (
                    <button
                      onClick={() => { onMusicToggle(); setShowMore(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                      </svg>
                      Music
                    </button>
                  )}
                  {onRoomChat && (
                    <button
                      onClick={() => { onRoomChat(); setShowMore(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-[#f5a623] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      Room Chat
                    </button>
                  )}
                  {onParticipants && (
                    <button
                      onClick={() => { onParticipants(); setShowMore(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-[#f5a623] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      Participants
                    </button>
                  )}
                  {twitchUsername && onTwitchChat && (
                    <button
                      onClick={() => { onTwitchChat(); setShowMore(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-[#9146ff] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                      </svg>
                      Twitch Chat
                    </button>
                  )}
                  {isHost && twitchUsername && (
                    <button
                      onClick={() => { setShowTwitchPanel((p) => !p); setShowMore(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-[#9146ff] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                      Interact
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Twitch interactive panel (expandable) */}
      {showTwitchPanel && <div className="px-4"><TwitchInteractivePanel /></div>}
    </div>
  );
}
