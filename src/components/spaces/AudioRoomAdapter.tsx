/**
 * AudioRoomAdapter
 *
 * Routes to the correct audio provider component based on room.provider.
 * Both providers implement the same join/leave interface.
 */

'use client';

import { useCallback } from 'react';
import type { Room } from '@/lib/spaces/roomsDb';
import { HMSRoomAdapter } from './HMSRoomAdapter';
import { StreamRoomAdapter } from './StreamRoomAdapter';

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
