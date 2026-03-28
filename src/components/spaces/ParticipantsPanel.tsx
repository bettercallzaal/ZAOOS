'use client';

import Image from 'next/image';
import { useCallStateHooks, hasAudio, hasVideo, ParticipantsAudio, Video } from '@stream-io/video-react-sdk';

export function ParticipantsPanel() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const speakers = participants.filter((p) => hasAudio(p));
  const listeners = participants.filter((p) => !hasAudio(p));

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <ParticipantsAudio participants={participants} />

      {speakers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Speakers ({speakers.length})
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
            {speakers.map((p) => (
              <div key={p.sessionId} className="flex flex-col items-center">
                {hasVideo(p) ? (
                  <div className={`w-24 h-[72px] rounded-lg overflow-hidden bg-gray-900 border-2 ${p.isSpeaking ? 'border-green-400' : 'border-transparent'} transition-all`}>
                    <Video
                      participant={p}
                      trackType="videoTrack"
                      className="w-full h-full object-cover"
                      VideoPlaceholder={null}
                    />
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold border-2 ${p.isSpeaking ? 'border-green-400 scale-110' : 'border-transparent'} transition-all`}>
                    {p.image ? (
                      <Image src={p.image} alt={`${p.name || 'Speaker'} avatar`} width={56} height={56} className="w-full h-full rounded-full object-cover" unoptimized />
                    ) : (
                      <span>{(p.name || '?')[0]}</span>
                    )}
                  </div>
                )}
                <span className="text-white text-xs mt-1 truncate max-w-[60px]">{p.name}</span>
                {p.isSpeaking && (
                  <span className="text-green-400 text-[10px] animate-pulse">speaking</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {listeners.length > 0 && (
        <div>
          <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Listeners ({listeners.length})
          </h3>
          <div className="grid grid-cols-5 md:grid-cols-6 gap-3">
            {listeners.map((p) => (
              <div key={p.sessionId} className="flex flex-col items-center">
                {hasVideo(p) ? (
                  <div className="w-20 h-[60px] rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                    <Video
                      participant={p}
                      trackType="videoTrack"
                      className="w-full h-full object-cover"
                      VideoPlaceholder={null}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm">
                    {p.image ? (
                      <Image src={p.image} alt={`${p.name || 'Listener'} avatar`} width={40} height={40} className="w-full h-full rounded-full object-cover" unoptimized />
                    ) : (
                      <span>{(p.name || '?')[0]}</span>
                    )}
                  </div>
                )}
                <span className="text-gray-400 text-[10px] mt-1 truncate max-w-[50px]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {participants.length === 0 && (
        <div className="text-center text-gray-500 py-8">Waiting for participants...</div>
      )}
    </div>
  );
}
