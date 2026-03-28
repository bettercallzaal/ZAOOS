'use client';

import { useState, useEffect } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { DescriptionPanel } from './DescriptionPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';
import { RoomMusicPanel } from './RoomMusicPanel';
import { BroadcastModal } from './BroadcastModal';
import { ContentView } from './ContentView';
import { SpeakersGrid } from './SpeakersGrid';
import type { BroadcastTarget } from './BroadcastModal';

interface RoomViewProps {
  isHost: boolean;
  isAuthenticated?: boolean;
  roomId?: string;
  roomType?: 'voice_channel' | 'stage';
  hostFid?: number;
}

export function RoomView({
  isHost,
  isAuthenticated = false,
  roomId,
  roomType = 'voice_channel',
  hostFid,
}: RoomViewProps) {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showMusicSidebar, setShowMusicSidebar] = useState(false);

  const [layout, setLayout] = useState<'content-first' | 'speakers-first'>(
    roomType === 'voice_channel' ? 'speakers-first' : 'content-first'
  );
  const [previousLayout, setPreviousLayout] = useState<'content-first' | 'speakers-first' | null>(null);

  const { useCallCustomData, useHasOngoingScreenShare } = useCallStateHooks();
  const callCustomData = useCallCustomData();
  const hasScreenShareActive = useHasOngoingScreenShare();
  const roomTitle = (callCustomData as Record<string, string>)?.title || 'Audio Room';

  // Auto-switch to content-first when screen share starts, restore when it stops
  useEffect(() => {
    if (hasScreenShareActive && layout !== 'content-first') {
      setPreviousLayout(layout);
      setLayout('content-first');
    } else if (!hasScreenShareActive && previousLayout) {
      setLayout(previousLayout);
      setPreviousLayout(null);
    }
  }, [hasScreenShareActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleLayout = () => {
    setLayout((prev) => (prev === 'content-first' ? 'speakers-first' : 'content-first'));
    setPreviousLayout(null);
  };

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

      {/* Dual layout: content-first or speakers-first */}
      {layout === 'content-first' ? (
        <ContentView isHost={isHost} />
      ) : (
        <SpeakersGrid hostFid={hostFid} />
      )}

      <div className="border-t border-gray-800 bg-[#0d1b2a]">
        <ControlsPanel
          isHost={isHost}
          isAuthenticated={isAuthenticated}
          onBroadcast={() => setShowBroadcast(true)}
          isBroadcasting={isBroadcasting}
          roomType={roomType}
          onMusicToggle={() => setShowMusicSidebar((prev) => !prev)}
          onLayoutToggle={handleToggleLayout}
          layout={layout}
        />
      </div>
      {roomId && showMusicSidebar && <RoomMusicPanel roomId={roomId} isHost={isHost} />}
      <BroadcastModal
        isOpen={showBroadcast}
        onClose={() => setShowBroadcast(false)}
        onStartBroadcast={handleStartBroadcast}
        onStopBroadcast={handleStopBroadcast}
        isBroadcasting={isBroadcasting}
        roomTitle={roomTitle}
      />
    </div>
  );
}
