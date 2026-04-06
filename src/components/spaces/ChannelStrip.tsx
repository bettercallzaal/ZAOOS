'use client';

import { communityConfig } from '@/../community.config';
import type { Room } from '@/lib/spaces/roomsDb';

interface ChannelStripProps {
  channels: Room[];
  onJoinChannel: (room: Room) => void;
}

export default function ChannelStrip({ channels, onJoinChannel }: ChannelStripProps) {
  const voiceChannels = communityConfig.voiceChannels;

  return (
    <div className="md:hidden flex gap-2 px-3 py-2 overflow-x-auto border-b border-white/[0.08]">
      {channels.map((channel) => {
        const isActive = channel.participant_count > 0;
        const vcConfig = voiceChannels.find((vc) => vc.id === channel.channel_id);
        const emoji = vcConfig?.emoji || '🔊';
        const shortName = channel.title.split(' ')[0];

        return (
          <button
            key={channel.id}
            onClick={() => onJoinChannel(channel)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs flex items-center gap-1.5 transition-colors ${
              isActive
                ? 'bg-[#0d2847] border border-green-400 text-white'
                : 'border border-white/[0.08] text-gray-500 opacity-40'
            }`}
          >
            <span>{emoji}</span>
            <span className="truncate">{shortName}</span>
            {isActive && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-green-400 text-[10px] font-medium">
                  {channel.participant_count}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
