'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { Room } from '@/lib/spaces/roomsDb';

/**
 * MiniSpaceBanner — shows a compact "Live Now" banner when a ZAO audio room
 * is active. Subscribes to realtime Supabase changes so it appears/disappears
 * without any user interaction or polling delay.
 */
export function MiniSpaceBanner() {
  const [liveRoom, setLiveRoom] = useState<Room | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Initial load — get the most recently started live room
    supabase
      .from('rooms')
      .select('*')
      .eq('state', 'live')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setLiveRoom(data ?? null);
      });

    // Realtime subscription — react to any rooms table change
    const channel = supabase
      .channel('mini-space-banner')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          supabase
            .from('rooms')
            .select('*')
            .eq('state', 'live')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
            .then(({ data }) => {
              setLiveRoom(data ?? null);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!liveRoom) return null;

  return (
    <Link
      href="/calls"
      className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-[#f5a623]/15 to-[#f5a623]/5 border-b border-[#f5a623]/20 hover:from-[#f5a623]/25 hover:to-[#f5a623]/10 transition-colors group"
    >
      {/* Live pulse indicator */}
      <span className="relative flex-shrink-0 w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>

      {/* Host avatar */}
      {liveRoom.host_pfp ? (
        <div className="w-6 h-6 relative rounded-full flex-shrink-0 overflow-hidden">
          <Image
            src={liveRoom.host_pfp}
            alt={liveRoom.host_name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-[#f5a623]/30 flex-shrink-0" />
      )}

      {/* Room info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#f5a623] truncate leading-tight">
          {liveRoom.title}
        </p>
        <p className="text-[10px] text-gray-500 truncate leading-tight">
          Hosted by @{liveRoom.host_username}
          {liveRoom.participant_count > 1 && ` · ${liveRoom.participant_count} listening`}
        </p>
      </div>

      {/* Join CTA */}
      <span className="flex-shrink-0 text-[10px] font-semibold text-[#f5a623] group-hover:text-[#ffd700] transition-colors uppercase tracking-wide">
        Join
      </span>

      {/* Chevron */}
      <svg
        className="w-3 h-3 text-[#f5a623]/60 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}
