'use client';

import { useCallStateHooks, useCall, hasAudio, type StreamVideoParticipant } from '@stream-io/video-react-sdk';
import Image from 'next/image';
import { useState } from 'react';

interface ParticipantsPanelProps {
  isHost: boolean;
  hostFid?: number;
  onClose: () => void;
}

export function ParticipantsPanel({ isHost, hostFid, onClose }: ParticipantsPanelProps) {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const speakers = participants.filter((p) => hasAudio(p));
  const listeners = participants.filter((p) => !hasAudio(p));

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="text-white text-sm font-semibold">
          Participants{' '}
          <span className="text-[#f5a623] ml-1">({participants.length})</span>
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          &#10005;
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {/* Speakers section */}
        {speakers.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Speakers — {speakers.length}
            </p>
            <div className="space-y-1">
              {speakers.map((p) => (
                <ParticipantRow
                  key={p.sessionId}
                  participant={p}
                  role={hostFid != null && p.userId === String(hostFid) ? 'host' : 'speaker'}
                  isHost={isHost}
                  call={call}
                />
              ))}
            </div>
          </div>
        )}

        {/* Listeners section */}
        {listeners.length > 0 && (
          <div className="px-4 pt-3 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Listeners — {listeners.length}
            </p>
            <div className="space-y-1">
              {listeners.map((p) => (
                <ParticipantRow
                  key={p.sessionId}
                  participant={p}
                  role={hostFid != null && p.userId === String(hostFid) ? 'host' : 'listener'}
                  isHost={isHost}
                  call={call}
                />
              ))}
            </div>
          </div>
        )}

        {participants.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No participants yet
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantRow({
  participant: p,
  role,
  isHost,
  call,
}: {
  participant: StreamVideoParticipant;
  role: 'host' | 'speaker' | 'listener';
  isHost: boolean;
  call: ReturnType<typeof useCall>;
}) {
  const [confirmKick, setConfirmKick] = useState(false);
  const isSpeaking = hasAudio(p) && p.isSpeaking;

  const handleMute = async () => {
    if (!call) return;
    try {
      await call.muteUser(p.userId, 'audio');
    } catch {
      /* ignore */
    }
  };

  const handleKick = async () => {
    if (!call) return;
    try {
      await call.blockUser(p.userId);
    } catch {
      /* ignore */
    }
    setConfirmKick(false);
  };

  const roleBadge = {
    host: { label: 'Host', className: 'bg-[#f5a623]/15 text-[#f5a623]' },
    speaker: { label: 'Speaker', className: 'bg-green-500/15 text-green-400' },
    listener: { label: 'Listener', className: 'bg-gray-700/40 text-gray-400' },
  }[role];

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
            isSpeaking ? 'border-green-400' : 'border-transparent'
          }`}
        >
          {p.image ? (
            <Image
              src={p.image}
              alt={p.name || 'Participant'}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {(p.name || '?')[0]}
            </div>
          )}
        </div>
      </div>

      {/* Name + badge */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{p.name || 'Anonymous'}</p>
      </div>

      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadge.className}`}>
        {roleBadge.label}
      </span>

      {/* Host actions */}
      {isHost && role !== 'host' && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Mute button (only for speakers) */}
          {hasAudio(p) && (
            <button
              onClick={handleMute}
              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Mute"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </button>
          )}

          {/* Kick button */}
          {!confirmKick ? (
            <button
              onClick={() => setConfirmKick(true)}
              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove from room"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleKick}
              onBlur={() => setConfirmKick(false)}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Confirm
            </button>
          )}
        </div>
      )}
    </div>
  );
}
