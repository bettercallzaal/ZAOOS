'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseBrowser } from '@/lib/db/supabase';

interface PresenceUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string | null;
}

export function WhosOnline() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    const channel = supabase.channel('online-users', { config: { presence: { key: String(user.fid) } } });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        const seen = new Set<number>();
        for (const entries of Object.values(state)) {
          for (const entry of entries) {
            if (!seen.has(entry.fid)) {
              seen.add(entry.fid);
              users.push(entry);
            }
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            fid: user.fid,
            username: user.username || '',
            displayName: user.displayName || user.username || '',
            pfpUrl: user.pfpUrl || null,
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-400 mb-2">
        <span className="text-[#f5a623] font-semibold">{onlineUsers.length}</span> online now
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {onlineUsers.map((u) => (
          <Link key={u.fid} href={`/members/${u.username || u.fid}`} className="flex-shrink-0 relative group">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#f5a623] transition-colors">
              {u.pfpUrl ? (
                <Image src={u.pfpUrl} alt={u.displayName} width={36} height={36} className="rounded-full" unoptimized />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                  {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a1628]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
