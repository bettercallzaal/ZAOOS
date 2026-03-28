'use client';

import { DescriptionPanel } from './DescriptionPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';
import { RoomMusicPanel } from './RoomMusicPanel';

interface RoomViewProps {
  isHost: boolean;
  roomId?: string;
}

export function RoomView({ isHost, roomId }: RoomViewProps) {
  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      <div className="border-b border-gray-800 bg-[#0d1b2a]">
        <DescriptionPanel />
      </div>
      {isHost && <PermissionRequests />}
      <ParticipantsPanel />
      <div className="border-t border-gray-800 bg-[#0d1b2a]">
        <ControlsPanel isHost={isHost} />
      </div>
      {roomId && <RoomMusicPanel roomId={roomId} isHost={isHost} />}
    </div>
  );
}
