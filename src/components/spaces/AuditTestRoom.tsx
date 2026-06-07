'use client';

import HMSVideoRoom from '@/components/spaces/HMSVideoRoom';

/**
 * Isolated multiplayer test room for spaces QA. Everyone who opens
 * /spaces/audit-test joins the SAME pinned 100ms room, so opening the page in
 * two browsers (or with a teammate) is a full multiplayer test — without
 * touching the main /spaces flow or the room tables.
 *
 * Thin wrapper over the shared HMSVideoRoom (video grid + screen share),
 * pinned to a fixed room name.
 */

const TEST_ROOM_NAME = 'zao-audit-test';

type Role = 'speaker' | 'listener';

interface AuditTestRoomProps {
  role: Role;
  onLeave: () => void;
}

export default function AuditTestRoom({ role, onLeave }: AuditTestRoomProps) {
  return <HMSVideoRoom roomName={TEST_ROOM_NAME} role={role} onLeave={onLeave} />;
}
