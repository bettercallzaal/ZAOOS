'use client';

import { useState } from 'react';
import { useCallStateHooks, hasScreenShare, ParticipantView } from '@stream-io/video-react-sdk';
import { DescriptionPanel } from './DescriptionPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';
import { RoomMusicPanel } from './RoomMusicPanel';
import { BroadcastModal } from './BroadcastModal';
import type { BroadcastTarget } from './BroadcastModal';

interface RoomViewProps {
  isHost: boolean;
  isAuthenticated?: boolean;
  roomId?: string;
}

function ScreenShareView() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  // Find the participant who is screen sharing
  const screenSharingParticipant = participants.find((p) => hasScreenShare(p));

  if (!screenSharingParticipant) return null;

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl overflow-hidden border border-blue-500/30 bg-[#0d1b2a]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
        <span className="text-blue-400 text-xs font-medium">
          {screenSharingParticipant.name || 'Someone'} is sharing their screen
        </span>
      </div>
      <div className="aspect-video w-full bg-black">
        <ParticipantView
          participant={screenSharingParticipant}
          trackType="screenShareTrack"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

export function RoomView({ isHost, isAuthenticated = false, roomId }: RoomViewProps) {
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
      <ScreenShareView />
      <ParticipantsPanel />
      <div className="border-t border-gray-800 bg-[#0d1b2a]">
        <ControlsPanel
          isHost={isHost}
          isAuthenticated={isAuthenticated}
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
