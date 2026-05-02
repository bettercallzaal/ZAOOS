/**
 * AudioRoomAdapter
 *
 * Routes to the correct audio provider component based on room.provider.
 * Both providers implement the same join/leave interface.
 */

'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Room } from '@/lib/spaces/roomsDb';

// Each provider drags in a different ~150KB video SDK (@100mslive/react-sdk
// vs @stream-io/video-react-sdk). Only one is used per room — split them so
// visitors only pay for the SDK their room actually needs.
const HMSRoomAdapter = dynamic(
  () => import('./HMSRoomAdapter').then((m) => ({ default: m.HMSRoomAdapter })),
  { ssr: false, loading: () => <RoomLoadingSkeleton label="Joining room…" /> },
);
const StreamRoomAdapter = dynamic(
  () => import('./StreamRoomAdapter').then((m) => ({ default: m.StreamRoomAdapter })),
  { ssr: false, loading: () => <RoomLoadingSkeleton label="Joining room…" /> },
);

function RoomLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a1628]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="h-8 w-8 rounded-full border-2 border-[#f5a623] border-t-transparent animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

interface AudioRoomAdapterProps {
  room: Room;
  user: { fid: number; displayName: string; username: string; pfpUrl?: string } | null;
  onLeave: () => void;
}

export function AudioRoomAdapter({ room, user, onLeave }: AudioRoomAdapterProps) {
  const provider = room.provider ?? 'stream';

  const handleLeave = useCallback(() => {
    onLeave();
  }, [onLeave]);

  if (provider === '100ms') {
    return (
      <HMSRoomAdapter
        room={room}
        user={user}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <StreamRoomAdapter
      room={room}
      user={user}
      onLeave={handleLeave}
    />
  );
}
