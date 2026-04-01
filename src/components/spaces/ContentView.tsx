'use client';

import { useCallStateHooks, ParticipantView, hasScreenShare, hasAudio } from '@stream-io/video-react-sdk';
import Image from 'next/image';

interface ContentViewProps {
  isHost: boolean;
}

export function ContentView({ isHost }: ContentViewProps) {
  const { useParticipants, useDominantSpeaker, useHasOngoingScreenShare } = useCallStateHooks();
  const participants = useParticipants();
  const dominantSpeaker = useDominantSpeaker();
  const hasScreenShareActive = useHasOngoingScreenShare();

  const screenSharer = participants.find((p) => hasScreenShare(p));
  const mainParticipant = screenSharer || dominantSpeaker || participants[0];

  // Host participant for PiP overlay
  const hostParticipant = isHost ? participants.find((p) => hasAudio(p)) : null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Main content area */}
      <div className="relative flex-1 min-h-[200px] sm:min-h-[300px] bg-black/30 mx-4 mt-3 rounded-xl overflow-hidden border border-gray-800">
        {mainParticipant && hasScreenShareActive && screenSharer ? (
          <ParticipantView
            participant={screenSharer}
            trackType="screenShareTrack"
            className="w-full h-full object-contain"
          />
        ) : mainParticipant ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
              {mainParticipant.image ? (
                <Image
                  src={mainParticipant.image}
                  alt={mainParticipant.name || 'Speaker'}
                  width={96}
                  height={96}
                  className="w-full h-full rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{(mainParticipant.name || '?')[0]}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            Waiting for speakers...
          </div>
        )}

        {/* PiP overlay — host camera in bottom-left */}
        {hostParticipant && (
          <div className="absolute bottom-3 left-3 w-20 h-[60px] rounded-lg overflow-hidden border-2 border-[#f5a623] bg-gray-900 shadow-lg">
            {hostParticipant.image ? (
              <Image
                src={hostParticipant.image}
                alt="Host"
                width={80}
                height={60}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs bg-gradient-to-br from-purple-500 to-blue-500">
                {(hostParticipant.name || '?')[0]}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Speaker strip + Now Playing */}
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {participants.map((p) => (
            <div key={p.sessionId} className="flex-shrink-0 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                  p.isSpeaking ? 'border-green-400 animate-pulse' : 'border-transparent'
                }`}
              >
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name || 'Participant'}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">
                    {(p.name || '?')[0]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Now Playing placeholder */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs">
          <span>🎵</span>
          <span className="hidden sm:inline">Now Playing</span>
        </div>
      </div>
    </div>
  );
}
