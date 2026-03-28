'use client';

import { useState } from 'react';
import { DescriptionPanel } from './DescriptionPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';
import { RoomMusicPanel } from './RoomMusicPanel';
import { BroadcastModal } from './BroadcastModal';
import type { BroadcastTarget } from './BroadcastModal';

interface RoomViewProps {
  isHost: boolean;
  roomId?: string;
}

export function RoomView({ isHost, roomId }: RoomViewProps) {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleStartBroadcast = async (_targets: BroadcastTarget[]) => {
    // Phase 2: wire up actual RTMP relay API here
    setIsBroadcasting(true);
  };

  const handleStopBroadcast = async () => {
    // Phase 2: call API to stop RTMP streams
    setIsBroadcasting(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      <div className="border-b border-gray-800 bg-[#0d1b2a]">
        <DescriptionPanel />
      </div>
      {isHost && <PermissionRequests />}
      <ParticipantsPanel />
      <div className="border-t border-gray-800 bg-[#0d1b2a]">
        <ControlsPanel
          isHost={isHost}
          onBroadcast={() => setShowBroadcast(true)}
          isBroadcasting={isBroadcasting}
        />
      </div>
      {roomId && <RoomMusicPanel roomId={roomId} isHost={isHost} />}
      <BroadcastModal
        isOpen={showBroadcast}
        onClose={() => setShowBroadcast(false)}
        onStartBroadcast={handleStartBroadcast}
        onStopBroadcast={handleStopBroadcast}
        isBroadcasting={isBroadcasting}
      />
    </div>
  );
}
