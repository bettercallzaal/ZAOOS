'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  useVideo,
  useScreenShare,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsPeerAudioEnabled,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectVideoTrackByPeerID,
  selectScreenShareByPeerID,
} from '@100mslive/react-sdk';

interface HMSFishbowlRoomProps {
  fishbowlRoomId: string;
  fishbowlSlug?: string;
  userFid: number;
  userName: string;
  role: 'speaker' | 'listener';
  isHost?: boolean;
  onLeave: () => void;
}

/** Renders a video element for a given track ID using the 100ms useVideo hook */
function VideoTile({ trackId, isLocal }: { trackId: string; isLocal?: boolean }) {
  const { videoRef } = useVideo({ trackId });
  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isLocal}
      playsInline
      className="w-full h-full object-cover rounded-lg"
      style={{ transform: isLocal ? 'scaleX(-1)' : undefined }}
    />
  );
}

/** Renders a screen share track */
function ScreenShareTile({ trackId }: { trackId: string }) {
  const { videoRef } = useVideo({ trackId });
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-contain"
    />
  );
}

/** Sub-component to read peer audio state via useHMSStore */
function PeerAudioIndicator({ peerId, initial }: { peerId: string; initial: string }) {
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peerId));
  return (
    <div className="relative">
      {isAudioEnabled && (
        <span className="absolute inset-0 rounded-full border-2 border-[#f5a623] animate-ping opacity-30" />
      )}
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] flex items-center justify-center text-[#ededed] font-semibold border-2 transition-colors ${
          isAudioEnabled ? 'border-[#f5a623] shadow-[0_0_12px_rgba(245,166,35,0.4)]' : 'border-white/10'
        }`}
      >
        {initial}
      </div>
    </div>
  );
}

/** Peer tile that shows video if enabled, otherwise falls back to audio indicator */
function PeerTile({ peerId, peerName, isLocal }: { peerId: string; peerName: string; isLocal: boolean }) {
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  const initial = (peerName || '?')[0];
  const hasVideo = videoTrack?.enabled;

  if (hasVideo && videoTrack?.id) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-[#f5a623] shadow-[0_0_12px_rgba(245,166,35,0.3)]">
          <VideoTile trackId={videoTrack.id} isLocal={isLocal} />
        </div>
        <span className="text-white text-xs mt-1 truncate max-w-[80px] sm:max-w-[96px]">
          {peerName} {isLocal && '(You)'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <PeerAudioIndicator peerId={peerId} initial={initial} />
      <span className="text-white text-xs mt-1 truncate max-w-[48px] sm:max-w-[60px]">
        {peerName} {isLocal && '(You)'}
      </span>
    </div>
  );
}

/** Shows screen share from a peer */
function ScreenShareView({ peerId, peerName }: { peerId: string; peerName: string }) {
  const screenShare = useHMSStore(selectScreenShareByPeerID(peerId));
  if (!screenShare?.id) return null;
  return (
    <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video max-h-[400px] relative">
      <ScreenShareTile trackId={screenShare.id} />
      <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded text-white">
        {peerName} is sharing screen
      </div>
    </div>
  );
}

function HMSFishbowlRoomInner({ fishbowlRoomId, fishbowlSlug, userFid, userName, role, isHost, onLeave }: HMSFishbowlRoomProps) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const {
    amIScreenSharing,
    screenSharingPeerId,
    screenSharingPeerName,
    toggleScreenShare,
  } = useScreenShare();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = Array.from(event.results) as any[];
      for (const result of results) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                speakerFid: userFid,
                speakerName: userName,
                speakerRole: role === 'speaker' && isHost ? 'host' : 'speaker',
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
  }, [transcribing, fishbowlRoomId, userFid, userName, role, isHost]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const joinRoom = async () => {
      setJoining(true);
      setError(null);
      try {
        const hmsRole = isHost ? 'moderator' : role;
        const roomName = fishbowlSlug ? `fishbowl-${fishbowlSlug}` : undefined;
        const res = await fetch('/api/100ms/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: String(userFid), role: hmsRole, roomName }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Token request failed (${res.status})`);
        }
        const { token } = await res.json();
        await hmsActions.join({ userName, authToken: token });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to audio');
      } finally {
        setJoining(false);
      }
    };

    if (fishbowlRoomId && userFid) {
      joinRoom();
    }

    return () => {
      hmsActions.leave().catch(() => {});
    };
  }, [fishbowlRoomId, userFid, role, isHost, fishbowlSlug, userName, hmsActions]);

  const leaveRoom = async () => {
    await hmsActions.leave();
    onLeave();
  };

  const retryJoin = () => {
    setError(null);
    setJoining(true);
    // Re-trigger by toggling state — the useEffect will re-run
    const hmsRole = isHost ? 'moderator' : role;
    const roomName = fishbowlSlug ? `fishbowl-${fishbowlSlug}` : undefined;
    fetch('/api/100ms/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: String(userFid), role: hmsRole, roomName }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Token request failed (${res.status})`);
        }
        return res.json();
      })
      .then(({ token }) => hmsActions.join({ userName, authToken: token }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to connect'))
      .finally(() => setJoining(false));
  };

  const toggleMute = async () => {
    await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 px-4">
        <p className="text-red-400 text-sm text-center">{error}</p>
        <p className="text-gray-500 text-xs text-center max-w-xs">
          Check that your browser has microphone permission enabled. If the problem persists, try refreshing the page.
        </p>
        <button
          onClick={retryJoin}
          className="px-4 py-1.5 bg-[#f5a623] text-[#0a1628] rounded-lg text-xs font-medium hover:bg-[#d4941f] transition-colors"
        >
          Retry Connection
        </button>
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

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        Connecting to audio...
      </div>
    );
  }

  const speakers = peers.filter((p) => p.roleName === 'speaker' || p.roleName === 'host');
  const listeners = peers.filter((p) => p.roleName === 'listener');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5a623] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5a623]" />
          </span>
          <span className="text-white text-sm font-medium">Live</span>
          <span className="text-gray-500 text-xs">{peers.length} in room</span>
        </div>
        <div className="flex gap-2">
          {(isHost || role === 'speaker') && (
            <button
              onClick={toggleTranscription}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                transcribing
                  ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              title={transcribing ? 'Stop transcription' : 'Start live transcription'}
            >
              {transcribing ? '⏹ Live' : '🎤 Transcribe'}
            </button>
          )}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full transition-colors ${
              isLocalAudioEnabled
                ? 'bg-[#f5a623]/20 text-[#f5a623]'
                : 'bg-red-500/20 text-red-400'
            }`}
            aria-label={isLocalAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            title={isLocalAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isLocalAudioEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5.29"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            )}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-full transition-colors ${
              isLocalVideoEnabled
                ? 'bg-[#f5a623]/20 text-[#f5a623]'
                : 'bg-red-500/20 text-red-400'
            }`}
            aria-label={isLocalVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            title={isLocalVideoEnabled ? 'Camera off' : 'Camera on'}
          >
            {isLocalVideoEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            )}
          </button>
          {toggleScreenShare && (
            <button
              onClick={() => toggleScreenShare()}
              className={`p-2 rounded-full transition-colors ${
                amIScreenSharing
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={amIScreenSharing ? 'Stop sharing screen' : 'Share screen'}
              title={amIScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            </button>
          )}
          <button
            onClick={leaveRoom}
            className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Screen Share */}
      {screenSharingPeerId && (
        <div className="p-4 pb-0">
          <ScreenShareView peerId={screenSharingPeerId} peerName={screenSharingPeerName || 'Someone'} />
        </div>
      )}

      {/* Speakers */}
      {speakers.length > 0 && (
        <div className="p-4">
          <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            🔥 Hot Seat ({speakers.length})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {speakers.map((peer) => (
              <PeerTile
                key={peer.id}
                peerId={peer.id}
                peerName={peer.name || '?'}
                isLocal={peer.isLocal}
              />
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

export function HMSFishbowlRoom(props: HMSFishbowlRoomProps) {
  return (
    <HMSRoomProvider>
      <HMSFishbowlRoomInner {...props} />
    </HMSRoomProvider>
  );
}
