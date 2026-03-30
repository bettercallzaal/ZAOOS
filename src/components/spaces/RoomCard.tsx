'use client';

import Image from 'next/image';
import type { RoomTheme } from './HostRoomModal';

export type RoomProvider = 'stream' | '100ms';

const THEME_STYLES: Record<RoomTheme, { border: string; badge: string; label: string }> = {
  default: { border: 'hover:border-[#f5a623]/30', badge: '', label: '' },
  music:   { border: 'hover:border-purple-500/30', badge: 'bg-purple-500/20 text-purple-400', label: 'Music' },
  podcast: { border: 'hover:border-amber-500/30',  badge: 'bg-amber-500/20 text-amber-400',   label: 'Podcast' },
  ama:     { border: 'hover:border-yellow-400/30', badge: 'bg-yellow-400/20 text-yellow-300', label: 'AMA' },
  chill:   { border: 'hover:border-teal-500/30',   badge: 'bg-teal-500/20 text-teal-400',     label: 'Chill' },
};

export interface UnifiedRoom {
  id: string;
  title: string;
  description?: string | null;
  host_fid: number;
  host_name: string;
  host_username?: string;
  host_pfp?: string | null;
  created_at: string;
  participant_count: number;
  provider: RoomProvider;
  theme?: RoomTheme;
}

interface RoomCardProps {
  room: UnifiedRoom;
  isOwner: boolean;
  onJoin: (room: UnifiedRoom) => void;
}

export function RoomCard({ room, isOwner, onJoin }: RoomCardProps) {
  const themeKey = (room.theme ?? 'default') as RoomTheme;
  const themeStyle = THEME_STYLES[themeKey] ?? THEME_STYLES.default;

  return (
    <div className={`bg-[#0d1b2a] border border-gray-800 rounded-xl p-5 ${themeStyle.border} transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-green-400 text-xs font-medium">Live</span>
          {room.provider === 'stream' ? (
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
              Stream.io
            </span>
          ) : (
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              100ms
            </span>
          )}
          {themeStyle.label && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${themeStyle.badge}`}>
              {themeStyle.label}
            </span>
          )}
        </div>
        {isOwner && (
          <span className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-2 py-0.5 rounded-full">
            Your Room
          </span>
        )}
      </div>

      <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-[#f5a623] transition-colors">
        {room.title}
      </h3>
      {room.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{room.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {room.host_pfp && (
            <Image src={room.host_pfp} alt={`${room.host_name} profile picture`} width={24} height={24} className="w-6 h-6 rounded-full" />
          )}
          <div>
            <span className="text-gray-300 text-xs">{room.host_name}</span>
            {room.host_username && (
              <span className="text-gray-600 text-xs ml-1">@{room.host_username}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{room.participant_count} listening</span>
          <button
            onClick={() => onJoin(room)}
            className="px-4 py-1.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-semibold rounded-lg transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
