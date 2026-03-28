'use client';

import { memo } from 'react';
import { useCallStateHooks, hasAudio, StreamVideoParticipant } from '@stream-io/video-react-sdk';
import Image from 'next/image';

interface SpeakersGridProps {
  hostFid?: number;
}

export function SpeakersGrid({ hostFid }: SpeakersGridProps) {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  if (participants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Waiting for participants...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="flex flex-wrap justify-center gap-4">
        {participants.map((p) => (
          <SpeakerCircle key={p.sessionId} participant={p} hostFid={hostFid} />
        ))}
      </div>
    </div>
  );
}

const SpeakerCircle = memo(function SpeakerCircle({
  participant: p,
  hostFid,
}: {
  participant: StreamVideoParticipant;
  hostFid?: number;
}) {
  const isSpeaking = hasAudio(p) && p.isSpeaking;
  const isListening = !hasAudio(p);
  const isHost = hostFid != null && p.userId === String(hostFid);

  return (
    <div className="flex flex-col items-center w-[72px]">
      <div className="relative">
        <div
          className={`w-[60px] h-[60px] rounded-full overflow-hidden border-2 transition-all ${
            isSpeaking
              ? 'border-green-400 animate-pulse scale-105'
              : 'border-gray-600'
          }`}
        >
          {p.image ? (
            <Image
              src={p.image}
              alt={p.name || 'Participant'}
              width={60}
              height={60}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
              {(p.name || '?')[0]}
            </div>
          )}
        </div>
        {isHost && (
          <span className="absolute -top-1 -right-1 text-sm" title="Host">
            👑
          </span>
        )}
      </div>
      <span className="text-white text-[11px] mt-1.5 truncate max-w-[72px] text-center">
        {p.name || 'Anonymous'}
      </span>
      <span
        className={`text-[9px] ${
          isSpeaking ? 'text-green-400' : 'text-gray-500'
        }`}
      >
        {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Listening'}
      </span>
    </div>
  );
});
