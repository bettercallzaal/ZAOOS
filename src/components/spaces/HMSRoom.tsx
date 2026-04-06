'use client';

import { useEffect, useState } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsPeerAudioEnabled,
  selectIsLocalAudioEnabled,
} from '@100mslive/react-sdk';

function HMSRoomInner({ userName, role, onLeave }: { userName: string; role: string; onLeave: () => void }) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const joinRoom = async () => {
      setJoining(true);
      try {
        const res = await fetch('/api/100ms/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userName, role }),
        });
        const { token } = await res.json();
        await hmsActions.join({ userName, authToken: token });
      } catch (err) {
        console.error('Failed to join 100ms room:', err);
      } finally {
        setJoining(false);
      }
    };

    joinRoom();

    return () => {
      hmsActions.leave().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        Connecting to room...
      </div>
    );
  }

  if (joining) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        Joining room...
      </div>
    );
  }

  const speakers = peers.filter((p) => p.roleName === 'speaker' || p.roleName === 'host');
  const listeners = peers.filter((p) => p.roleName === 'listener');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-white text-sm font-medium">Live</span>
          <span className="text-gray-500 text-xs">{peers.length} in room</span>
          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full ml-2">100ms</span>
        </div>
        <div className="flex gap-2">
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

      {/* Participants */}
      <div className="flex-1 overflow-y-auto p-4">
        {speakers.length > 0 && (
          <div className="mb-6">
            <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-3">Speakers ({speakers.length})</h4>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {speakers.map((peer) => (
                <PeerAvatar key={peer.id} peerId={peer.id} name={peer.name} isLocal={peer.isLocal} />
              ))}
            </div>
          </div>
        )}
        {listeners.length > 0 && (
          <div>
            <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-3">Listeners ({listeners.length})</h4>
            <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
              {listeners.map((peer) => (
                <div key={peer.id} className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs">
                    {(peer.name || '?')[0]}
                  </div>
                  <span className="text-gray-500 text-[10px] mt-1 truncate max-w-[40px]">
                    {peer.name} {peer.isLocal && '(You)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PeerAvatar({ peerId, name, isLocal }: { peerId: string; name: string; isLocal: boolean }) {
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peerId));

  return (
    <div className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold border-2 ${isAudioEnabled ? 'border-green-400' : 'border-transparent'} transition-all`}>
        {(name || '?')[0]}
      </div>
      <span className="text-white text-xs mt-1 truncate max-w-[60px]">
        {name} {isLocal && '(You)'}
      </span>
    </div>
  );
}

export default function HMSRoom({ userName, role = 'listener', onLeave }: { userName: string; role?: string; onLeave: () => void }) {
  return (
    <HMSRoomProvider>
      <HMSRoomInner userName={userName} role={role} onLeave={onLeave} />
    </HMSRoomProvider>
  );
}
