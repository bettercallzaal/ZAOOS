'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useRadio } from '@/hooks/useRadio';
import { useMobile } from '@/hooks/useMobile';
import { DescriptionPanel } from './DescriptionPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';
import { RoomMusicPanel } from './RoomMusicPanel';
import { BroadcastModal } from './BroadcastModal';
import { ContentView } from './ContentView';
import { SpeakersGrid } from './SpeakersGrid';
import type { BroadcastTarget } from './BroadcastModal';

const MusicSidebar = dynamic(
  () => import('@/components/music/MusicSidebar').then((m) => ({ default: m.MusicSidebar })),
  { ssr: false },
);

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
  const radio = useRadio();
  const isMobile = useMobile();

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
      <div className="flex flex-1 overflow-hidden">
        {/* Main room content */}
        <div className="flex-1 flex flex-col min-w-0">
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
          {roomId && <RoomMusicPanel roomId={roomId} isHost={isHost} onOpenMusicBrowser={() => setShowMusicSidebar(true)} />}
        </div>

        {/* Desktop music sidebar */}
        {showMusicSidebar && (
          <div className="hidden md:flex flex-col w-[350px] border-l border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <span className="text-white text-sm font-medium">Browse Music</span>
              <button
                onClick={() => setShowMusicSidebar(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                &#10005;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MusicSidebar
                activeChannel="zao"
                isOpen={showMusicSidebar}
                isMobile={false}
                onClose={() => setShowMusicSidebar(false)}
                isRadioMode={radio.isRadioMode}
                radioLoading={radio.radioLoading}
                onRadioStart={radio.startRadio}
                onRadioStop={radio.stopRadio}
                radioPlaylistName={radio.radioPlaylist?.name}
                availableStations={radio.availableStations}
                currentStationIndex={radio.currentStationIndex}
                onSwitchStation={radio.switchStation}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile music overlay */}
      {showMusicSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0a1628] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <span className="text-white font-medium">Browse Music</span>
            <button
              onClick={() => setShowMusicSidebar(false)}
              className="text-gray-400 hover:text-white text-xl transition-colors"
            >
              &#10005;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MusicSidebar
              activeChannel="zao"
              isOpen={showMusicSidebar}
              isMobile={true}
              onClose={() => setShowMusicSidebar(false)}
              isRadioMode={radio.isRadioMode}
              radioLoading={radio.radioLoading}
              onRadioStart={radio.startRadio}
              onRadioStop={radio.stopRadio}
              radioPlaylistName={radio.radioPlaylist?.name}
              availableStations={radio.availableStations}
              currentStationIndex={radio.currentStationIndex}
              onSwitchStation={radio.switchStation}
            />
          </div>
        </div>
      )}

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
