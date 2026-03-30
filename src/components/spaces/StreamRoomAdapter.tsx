/**
 * StreamRoomAdapter
 *
 * Stub adapter for Stream.io rooms.
 * The Stream.io room is currently rendered directly in /spaces/[id]/page.tsx.
 * This adapter exists for symmetry with HMSRoomAdapter and for future extraction.
 *
 * For now, the room page handles Stream.io directly.
 * This adapter can be expanded when we extract Stream room logic out of the page.
 */

'use client';

import type { Room } from '@/lib/spaces/roomsDb';

interface StreamRoomAdapterProps {
  room: Room;
  user: { fid: number; displayName: string; username: string; pfpUrl?: string } | null;
  onLeave: () => void;
}

/**
 * Stream.io rooms are currently rendered inline in /spaces/[id]/page.tsx.
 * This adapter is a placeholder — the actual rendering is handled by the page.
 *
 * Returning null here means the page continues to render Stream.io itself.
 * When we extract Stream room logic, this adapter will return the extracted component.
 */
export function StreamRoomAdapter({ room, user, onLeave }: StreamRoomAdapterProps) {
  // Returning null means the parent page continues to render Stream.io inline.
  // This is intentional — the Stream logic stays in the page until extracted.
  return null;
}
