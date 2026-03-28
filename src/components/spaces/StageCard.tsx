'use client';

import Image from 'next/image';
import type { Room } from '@/lib/spaces/roomsDb';

interface StageCardProps {
  room: Room;
  onJoin: (room: Room) => void;
}

const THEME_BADGES: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  default: { bg: 'bg-[#f5a62333]', text: 'text-[#f5a623]', label: 'Default', emoji: '🔊' },
  music: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Music', emoji: '🎵' },
  podcast: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Podcast', emoji: '🎙️' },
  ama: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'AMA', emoji: '❓' },
  chill: { bg: 'bg-teal-500/20', text: 'text-teal-400', label: 'Chill', emoji: '😌' },
};

export default function StageCard({ room, onJoin }: StageCardProps) {
  const theme = THEME_BADGES[room.theme] || THEME_BADGES.default;

  return (
    <div className="bg-[#111d2e] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-white font-bold text-sm truncate">{room.title}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
          <span
            className={`${theme.bg} ${theme.text} text-[10px] px-1.5 py-0.5 rounded-full font-medium`}
          >
            {theme.emoji} {theme.label}
          </span>
        </div>
      </div>

      {/* Host info */}
      <div className="flex items-center gap-2 mb-3">
        {room.host_pfp && (
          <Image
            src={room.host_pfp}
            alt={room.host_name}
            width={20}
            height={20}
            className="rounded-full"
            unoptimized
          />
        )}
        <p className="text-gray-500 text-xs">
          Hosted by {room.host_name}
          {' \u2022 '}
          {room.participant_count} watching
        </p>
      </div>

      {/* Description */}
      {room.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{room.description}</p>
      )}

      {/* Join button */}
      <button
        onClick={() => onJoin(room)}
        className="w-full bg-[#f5a62333] text-[#f5a623] text-sm font-medium py-2 rounded-lg hover:bg-[#f5a62344] transition-colors"
      >
        Join Stage →
      </button>
    </div>
  );
}
