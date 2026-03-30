'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useRadio } from '@/hooks/useRadio';
import { useMobile } from '@/hooks/useMobile';
import { startBroadcast, stopTarget, stopAll, retryTarget, type BroadcastState, type BroadcastTarget } from '@/lib/spaces/rtmpManager';
import { DescriptionPanel } from './DescriptionPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';
import { RoomMusicPanel } from './RoomMusicPanel';
import { BroadcastModal } from './BroadcastModal';
import { BroadcastPanel } from './BroadcastPanel';
import { ContentView } from './ContentView';
import { SpeakersGrid } from './SpeakersGrid';
import { TwitchChatPanel } from './TwitchChatPanel';
import { TwitchEmbed } from './TwitchEmbed';

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
  const [broadcastState, setBroadcastState] = useState<BroadcastState | null>(null);
  const [showMusicSidebar, setShowMusicSidebar] = useState(false);
  const [showTwitchChat, setShowTwitchChat] = useState(false);
  const [twitchInfo, setTwitchInfo] = useState<{ username: string; canSend: boolean } | null>(null);
  const call = useCall();
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

  // Fetch Twitch connection info for the host (all viewers see the embed, host gets chat)
  useEffect(() => {
    // Host: fetch own info (includes stream key). Non-host: look up host's public Twitch username.
    const url = isHost
      ? '/api/platforms/twitch'
      : hostFid
        ? `/api/platforms/twitch?fid=${hostFid}`
        : null;
    if (!url) return;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.connected && d.username) {
          if (isHost) {
            // Host can also chat
            fetch(`/api/twitch/chat?channel=${encodeURIComponent(d.username)}`)
              .then((r2) => r2.json())
              .then((c) => setTwitchInfo({ username: d.username, canSend: c.canSend ?? false }))
              .catch(() => setTwitchInfo({ username: d.username, canSend: false }));
          } else {
            setTwitchInfo({ username: d.username, canSend: false });
          }
        }
      })
      .catch(() => {});
  }, [isHost, hostFid]);

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

  const handleStartBroadcast = async (targets: BroadcastTarget[], mode: 'direct' | 'relay') => {
    if (!call) return;
    const state = await startBroadcast(call, targets, mode, roomTitle);
    setBroadcastState(state);
    setShowBroadcast(false);
  };

  const handleStopBroadcast = async () => {
    if (!call || !broadcastState) return;
    await stopAll(call, broadcastState);
    setBroadcastState(null);
  };

  const handleStopTarget = async (platform: string) => {
    if (!call || !broadcastState) return;
    const updated = await stopTarget(call, broadcastState, platform);
    setBroadcastState(updated);
  };

  const handleRetryTarget = async (platform: string) => {
    if (!call || !broadcastState) return;
    const updated = await retryTarget(call, broadcastState, platform);
    setBroadcastState(updated);
  };

  const handleStopAll = async () => {
    if (!call || !broadcastState) return;
    await stopAll(call, broadcastState);
    setBroadcastState(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      <div className="flex flex-1 overflow-hidden">
        {/* Main room content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-gray-800 bg-[#0d1b2a]">
            <DescriptionPanel />
          </div>
          <TwitchEmbed
            channel={twitchInfo?.username ?? ''}
            visible={!!twitchInfo?.username}
          />
          {isHost && <PermissionRequests />}

          {/* Dual layout: content-first or speakers-first */}
          {layout === 'content-first' ? (
            <ContentView isHost={isHost} />
          ) : (
            <SpeakersGrid hostFid={hostFid} />
          )}

          {broadcastState?.isLive && (
            <div className="flex justify-center px-4 py-2 border-t border-gray-800 bg-[#0d1b2a]">
              <BroadcastPanel
                state={broadcastState}
                onStopTarget={handleStopTarget}
                onRetryTarget={handleRetryTarget}
                onStopAll={handleStopAll}
                roomId={roomId ?? ''}
              />
            </div>
          )}
          <div className="border-t border-gray-800 bg-[#0d1b2a]">
            <ControlsPanel
              isHost={isHost}
              isAuthenticated={isAuthenticated}
              onBroadcast={() => setShowBroadcast(true)}
              isBroadcasting={broadcastState?.isLive ?? false}
              roomType={roomType}
              onMusicToggle={() => setShowMusicSidebar((prev) => !prev)}
              onLayoutToggle={handleToggleLayout}
              layout={layout}
              twitchUsername={twitchInfo?.username ?? null}
              onTwitchChat={() => setShowTwitchChat((prev) => !prev)}
            />
          </div>
          {roomId && <RoomMusicPanel roomId={roomId} isHost={isHost} onOpenMusicBrowser={() => setShowMusicSidebar(true)} />}
        </div>

        {/* Desktop Twitch chat sidebar */}
        {showTwitchChat && twitchInfo && (
          <div className="hidden md:flex flex-col w-[350px] border-l border-gray-800 overflow-hidden">
            <TwitchChatPanel
              twitchUsername={twitchInfo.username}
              canSend={twitchInfo.canSend}
              onClose={() => setShowTwitchChat(false)}
            />
          </div>
        )}

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

      {/* Mobile Twitch chat overlay */}
      {showTwitchChat && twitchInfo && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0a1628] flex flex-col">
          <TwitchChatPanel
            twitchUsername={twitchInfo.username}
            canSend={twitchInfo.canSend}
            onClose={() => setShowTwitchChat(false)}
          />
        </div>
      )}

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
        isOpen={showBroadcast && !broadcastState?.isLive}
        onClose={() => setShowBroadcast(false)}
        onStartBroadcast={handleStartBroadcast}
        onStopBroadcast={handleStopBroadcast}
        isBroadcasting={broadcastState?.isLive ?? false}
        roomTitle={roomTitle}
      />
    </div>
  );
}
