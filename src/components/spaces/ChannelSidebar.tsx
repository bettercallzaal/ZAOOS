'use client';

import { communityConfig } from '@/../community.config';
import type { Room } from '@/lib/spaces/roomsDb';

interface ChannelSidebarProps {
  channels: Room[];
  connectedRoomId: string | null;
  connectedDuration: number;
  onJoinChannel: (room: Room) => void;
  onLeaveChannel: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ChannelSidebar({
  channels,
  connectedRoomId,
  connectedDuration,
  onJoinChannel,
  onLeaveChannel,
  onToggleMute,
  isMuted,
}: ChannelSidebarProps) {
  const voiceChannels = communityConfig.voiceChannels;
  const connectedRoom = channels.find((c) => c.id === connectedRoomId);

  return (
    <div className="hidden md:flex w-[220px] bg-[#081420] border-r border-gray-800 flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Voice Channels
        </h3>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-1.5 space-y-0.5">
        {channels.map((channel) => {
          const isActive = channel.participant_count > 0;
          const isConnected = channel.id === connectedRoomId;
          const vcConfig = voiceChannels.find((vc) => vc.id === channel.channel_id);
          const emoji = vcConfig?.emoji || '🔊';

          return (
            <button
              key={channel.id}
              onClick={() => !isConnected && onJoinChannel(channel)}
              disabled={isConnected}
              className={`w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors ${
                isConnected
                  ? 'bg-[#0d2847] border-l-[3px] border-green-400 cursor-default'
                  : isActive
                    ? 'bg-[#0d2847] border-l-[3px] border-green-400 hover:bg-[#112d52]'
                    : 'opacity-50 hover:opacity-70 border-l-[3px] border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{emoji}</span>
                <span className="text-gray-200 truncate text-[13px]">
                  {channel.title}
                </span>
                {isActive && (
                  <span className="ml-auto flex-shrink-0 bg-green-500/20 text-green-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    {channel.participant_count}
                  </span>
                )}
              </div>
              {!isActive && channel.last_active_at && (
                <p className="text-gray-600 text-[10px] mt-0.5 ml-6">
                  Last active {timeAgo(new Date(channel.last_active_at))}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Connected Footer */}
      {connectedRoom && (
        <div className="p-2.5">
          <div className="bg-[#0f2e1a] rounded-lg p-3 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-xs font-medium truncate">
                {connectedRoom.title}
              </span>
            </div>
            <p className="text-green-400/60 text-[10px] mb-2">
              {formatDuration(connectedDuration)}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={onToggleMute}
                className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {isMuted ? '🔇 Unmute' : '🎤 Mute'}
              </button>
              <button
                onClick={onLeaveChannel}
                className="flex-1 text-xs py-1.5 rounded font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
