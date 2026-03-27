'use client';

import { DescriptionPanel } from './DescriptionPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';

interface RoomViewProps {
  isHost: boolean;
}

export function RoomView({ isHost }: RoomViewProps) {
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
    </div>
  );
}
