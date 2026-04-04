'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsPeerAudioEnabled,
  selectIsLocalAudioEnabled,
} from '@100mslive/react-sdk';
import { useAuth } from '@/hooks/useAuth';

interface HMSFishbowlRoomProps {
  fishbowlRoomId: string;
  role: 'speaker' | 'listener';
  isHost?: boolean;
  onLeave: () => void;
}

function HMSFishbowlRoomInner({ fishbowlRoomId, role, isHost, onLeave }: HMSFishbowlRoomProps) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const [joining, setJoining] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const pendingTextRef = useRef('');

  const toggleTranscription = useCallback(() => {
    if (transcribing) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setTranscribing(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const results = Array.from(event.results) as any[];
      for (const result of results) {
        const transcript = (result[0] as any).transcript.trim();
        if (!transcript) continue;
        if (result.isFinal) {
          const text = pendingTextRef.current + ' ' + transcript;
          pendingTextRef.current = '';
          try {
            await fetch('/api/fishbowlz/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomId: fishbowlRoomId,
                speakerName: 'Speaker',
                speakerRole: 'speaker',
                text,
                startedAt: new Date().toISOString(),
                source: 'whisper',
              }),
            });
          } catch { /* non-critical */ }
        } else {
          pendingTextRef.current = transcript;
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') return;
      setTranscribing(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setTranscribing(true);
  }, [transcribing, fishbowlRoomId]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const joinRoom = async () => {
      setJoining(true);
      try {
        const res = await fetch('/api/100ms/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: String(fishbowlRoomId), role, roomId: fishbowlRoomId }),
        });
        if (!res.ok) throw new Error('Failed to get token');
        const { token } = await res.json();
        await hmsActions.join({ userName: String(fishbowlRoomId), authToken: token });
      } catch (err) {
        console.error('Failed to join HMS room:', err);
      } finally {
        setJoining(false);
      }
    };

    if (fishbowlRoomId) {
      joinRoom();
    }

    return () => {
      hmsActions.leave().catch(() => {});
    };
  }, [fishbowlRoomId, role]);

  const leaveRoom = async () => {
    await hmsActions.leave();
    onLeave();
  };

  const toggleMute = async () => {
    await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
  };

  if (!isConnected && !joining) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        Connecting to audio...
      </div>
    );
  }

  if (joining) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        Joining audio room...
      </div>
    );
  }

  const speakers = peers.filter((p) => p.roleName === 'speaker' || p.roleName === 'host');
  const listeners = peers.filter((p) => p.roleName === 'listener');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-white text-sm font-medium">Live Audio</span>
          <span className="text-gray-500 text-xs">{peers.length} in room</span>
        </div>
        <div className="flex gap-2">
          {(isHost || role === 'speaker') && (
            <button
              onClick={toggleTranscription}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                transcribing
                  ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
              title={transcribing ? 'Stop transcription' : 'Start live transcription'}
            >
              {transcribing ? '⏹ Live' : '🎤 Transcribe'}
            </button>
          )}
          <button
            onClick={toggleMute}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isLocalAudioEnabled
                ? 'bg-green-600/20 text-green-400'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {isLocalAudioEnabled ? 'Mute' : 'Unmute'}
          </button>
          <button
            onClick={leaveRoom}
            className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Speakers */}
      {speakers.length > 0 && (
        <div className="p-4">
          <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            🔥 Hot Seat ({speakers.length})
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {speakers.map((peer) => (
              <div key={peer.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold border-2 ${
                    selectIsPeerAudioEnabled(peer.id) ? 'border-green-400' : 'border-transparent'
                  }`}
                >
                  {(peer.name || '?')[0]}
                </div>
                <span className="text-white text-xs mt-1 truncate max-w-[60px]">
                  {peer.name} {peer.isLocal && '(You)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listeners */}
      {listeners.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            👥 Listening ({listeners.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {listeners.map((peer) => (
              <div key={peer.id} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full">
                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 text-[10px]">
                  {(peer.name || '?')[0]}
                </div>
                <span className="text-gray-400 text-xs">
                  {peer.name} {peer.isLocal && '(You)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HMSFishbowlRoom({ fishbowlRoomId, role, isHost, onLeave }: HMSFishbowlRoomProps) {
  return (
    <HMSRoomProvider>
      <HMSFishbowlRoomInner fishbowlRoomId={fishbowlRoomId} role={role} isHost={isHost} onLeave={onLeave} />
    </HMSRoomProvider>
  );
}
