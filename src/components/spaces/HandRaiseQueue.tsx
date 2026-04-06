'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/db/supabase';

interface HandRaise {
  id: string;
  fid: number;
  username: string;
  pfp_url: string;
  status: string;
  created_at: string;
}

interface HandRaiseQueueProps {
  roomId: string;
  fid: number;
  username: string;
  pfpUrl: string;
  isHost: boolean;
}

export function HandRaiseQueue({ roomId, fid, isHost }: HandRaiseQueueProps) {
  const [raises, setRaises] = useState<HandRaise[]>([]);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRaises = useCallback(async () => {
    const res = await fetch(`/api/spaces/hand-raise?roomId=${roomId}`);
    if (res.ok) {
      const data = await res.json();
      setRaises(data.raises ?? []);
      const mine = (data.raises as HandRaise[])?.find((r) => r.fid === fid);
      setMyStatus(mine?.status ?? null);
    }
  }, [roomId, fid]);

  useEffect(() => {
    fetchRaises();
  }, [fetchRaises]);

  // Realtime subscription for hand raise changes
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`hand-raises:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_hand_raises', filter: `room_id=eq.${roomId}` },
        () => fetchRaises(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, fetchRaises]);

  const doAction = async (action: string, targetFid?: number) => {
    setLoading(true);
    try {
      await fetch('/api/spaces/hand-raise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action, targetFid }),
      });
    } finally {
      setLoading(false);
    }
  };

  const raisedHands = raises.filter((r) => r.status === 'raised');

  // Listener view: raise/lower hand button
  if (!isHost) {
    return (
      <button
        onClick={() => doAction(myStatus === 'raised' ? 'lower' : 'raise')}
        disabled={loading}
        className={`relative p-2.5 rounded-xl text-sm transition-colors border ${
          myStatus === 'raised'
            ? 'bg-[#f5a623]/15 border-[#f5a623]/40 text-[#f5a623]'
            : 'bg-[#1a2a3a] text-gray-400 hover:text-[#f5a623] border-white/[0.08] hover:border-[#f5a623]/40'
        }`}
        title={myStatus === 'raised' ? 'Lower hand' : 'Raise hand'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l-.075 5.925m3.075-5.925a1.575 1.575 0 013.15 0v1.5m-3.15-1.5v5.925m3.15-5.925v3.075M16.5 12.75v-3m0 3c0 3.375-2.7 6.75-6 6.75s-6-3.375-6-6.75V7.5m0 0a1.575 1.575 0 013.15 0" />
        </svg>
        {myStatus === 'raised' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#f5a623] rounded-full" />
        )}
      </button>
    );
  }

  // Host view: queue of raised hands
  if (raisedHands.length === 0) return null;

  return (
    <div className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-3 mx-4 mb-2">
      <p className="text-xs font-medium text-gray-400 mb-2">
        Raised Hands ({raisedHands.length})
      </p>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {raisedHands.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            {r.pfp_url ? (
              <Image src={r.pfp_url || '/logo.png'} alt="" width={24} height={24} className="w-6 h-6 rounded-full" unoptimized />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-700" />
            )}
            <span className="text-sm text-white flex-1 truncate">{r.username || `FID ${r.fid}`}</span>
            <button
              onClick={() => doAction('invite', r.fid)}
              disabled={loading}
              className="text-xs px-2 py-1 rounded bg-[#f5a623]/15 text-[#f5a623] hover:bg-[#f5a623]/25 transition-colors"
            >
              Invite
            </button>
            <button
              onClick={() => doAction('dismiss', r.fid)}
              disabled={loading}
              className="text-xs px-2 py-1 rounded bg-gray-700/40 text-gray-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
