'use client';

import Image from 'next/image';
import type { Room } from '@/lib/spaces/roomsDb';

interface StageCardProps {
  room: Room;
  onJoin: (room: Room) => void;
  isOwn?: boolean;
}

const THEME_BADGES: Record<string, { bg: string; text: string; label: string; border: string }> = {
  default: { bg: 'bg-[#f5a62320]', text: 'text-[#f5a623]', label: 'Default', border: 'border-[#f5a623]/20' },
  music: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Music', border: 'border-purple-500/20' },
  podcast: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Podcast', border: 'border-amber-500/20' },
  ama: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'AMA', border: 'border-yellow-500/20' },
  chill: { bg: 'bg-teal-500/15', text: 'text-teal-400', label: 'Chill', border: 'border-teal-500/20' },
};

const THEME_DOTS: Record<string, string> = {
  default: 'bg-[#f5a623]',
  music: 'bg-purple-500',
  podcast: 'bg-amber-500',
  ama: 'bg-yellow-400',
  chill: 'bg-teal-500',
};

function formatLiveDuration(createdAt: string): string {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just started';
  if (diffMin < 60) return `Live for ${diffMin}m`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins > 0 ? `Live for ${hours}h ${mins}m` : `Live for ${hours}h`;
}

export default function StageCard({ room, onJoin, isOwn }: StageCardProps) {
  const theme = THEME_BADGES[room.theme] || THEME_BADGES.default;
  const dot = THEME_DOTS[room.theme] || THEME_DOTS.default;

  return (
    <div
      className={`group bg-[#111d2e] rounded-xl p-4 border transition-all duration-200 hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 cursor-pointer ${
        isOwn ? 'border-[#f5a623]/30 ring-1 ring-[#f5a623]/10' : 'border-white/[0.08]'
      }`}
      onClick={() => onJoin(room)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onJoin(room)}
    >
      {/* Top: Theme color accent bar */}
      <div className={`w-8 h-1 rounded-full ${dot} mb-3 opacity-60`} />

      {/* Title + badges row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-[#f5a623] transition-colors">
          {room.title}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Host info row */}
      <div className="flex items-center gap-2 mb-2">
        {room.host_pfp ? (
          <Image
            src={room.host_pfp}
            alt={room.host_name}
            width={24}
            height={24}
            className="rounded-full ring-1 ring-gray-700"
            unoptimized
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">
            {room.host_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <span className="text-gray-300 text-xs font-medium">{room.host_name}</span>
      </div>

      {/* Description */}
      {room.description && (
        <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{room.description}</p>
      )}

      {/* Bottom: meta row + join button */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.08]/60">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {/* Participant count */}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.16v-.088c0-2.517 1.813-4.607 4.2-5.032a8.153 8.153 0 011.6-.16c.549 0 1.085.055 1.6.16 2.387.425 4.2 2.515 4.2 5.032v.088c0 .465-.171.89-.453 1.217" />
            </svg>
            {room.participant_count}
          </span>

          {/* Duration */}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatLiveDuration(room.created_at)}
          </span>

          {/* Theme badge */}
          <span className={`${theme.bg} ${theme.text} text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${theme.border}`}>
            {theme.label}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoin(room);
          }}
          className="px-4 py-1.5 bg-[#f5a623] text-[#0a1628] text-xs font-bold rounded-lg hover:bg-[#ffd700] transition-colors shadow-sm"
        >
          Join
        </button>
      </div>
    </div>
  );
}
