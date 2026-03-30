/**
 * HMSRoomAdapter
 *
 * Wraps HMSRoom.tsx with the same interface as AudioRoomAdapter expects.
 * Determines role (host/speaker/listener) based on whether the user is the room host.
 */

'use client';

import HMSRoom from './HMSRoom';
import type { Room } from '@/lib/spaces/roomsDb';

interface HMSRoomAdapterProps {
  room: Room;
  user: { fid: number; displayName: string; username: string; pfpUrl?: string } | null;
  onLeave: () => void;
}

export function HMSRoomAdapter({ room, user, onLeave }: HMSRoomAdapterProps) {
  if (!user) {
    // Anonymous users can't join 100ms rooms
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        Sign in to join this room
      </div>
    );
  }

  // Determine role: host → host, otherwise listener
  const isHost = user.fid === room.host_fid;
  const role = isHost ? 'host' : 'listener';
  const userName = String(user.fid);

  return (
    <HMSRoom
      userName={userName}
      role={role}
      onLeave={onLeave}
    />
  );
}
