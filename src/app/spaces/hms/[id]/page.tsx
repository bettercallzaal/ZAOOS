'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import type { MSRoom } from '@/lib/social/msRoomsDb';
import type { TokenGateConfig } from '@/lib/spaces/tokenGate';

const HMSVideoRoom = dynamic(() => import('@/components/spaces/HMSVideoRoom'), { ssr: false });

async function fetchMSRoom(id: string): Promise<MSRoom> {
  const res = await fetch(`/api/100ms/rooms/${id}`);
  if (!res.ok) throw new Error('Room not found');
  const data = await res.json();
  return data.room;
}

export default function HMSRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { address: walletAddress } = useAccount();

  const [room, setRoom] = useState<MSRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateBlocked, setGateBlocked] = useState(false);

  const isHost = user?.fid === room?.host_fid;

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;

    const init = async () => {
      try {
        const roomData = await fetchMSRoom(roomId);
        if (roomData.state === 'ended') throw new Error('This room has ended');
        if (mounted) setRoom(roomData);

        // Enforce token gate before joining (mirrors the Stream room flow).
        // gate_config is stored in the room's settings jsonb at create time.
        const gateConfig = (roomData.settings?.gate_config ?? null) as TokenGateConfig | null;
        if (gateConfig) {
          if (!walletAddress) {
            if (mounted) { setGateBlocked(true); setLoading(false); }
            return;
          }
          const gateRes = await fetch('/api/spaces/gate-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, gateConfig }),
          });
          const gateData = await gateRes.json();
          if (!gateData.allowed) {
            if (mounted) { setGateBlocked(true); setLoading(false); }
            return;
          }
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [roomId, authLoading, walletAddress]);

  const handleLeave = async () => {
    if (isHost && room) {
      await fetch(`/api/100ms/rooms/${room.id}`, {
        method: 'PATCH',
      }).catch(console.error);
    }
    router.push('/spaces');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center text-gray-400">
        Loading room...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button
          onClick={() => router.push('/spaces')}
          className="px-6 py-2 bg-[#f5a623] text-[#0a1628] rounded-lg font-semibold"
        >
          Back to Spaces
        </button>
      </div>
    );
  }

  if (gateBlocked) {
    const gate = (room?.settings?.gate_config ?? null) as { type?: string; contractAddress?: string } | null;
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-white font-bold text-lg mb-2">Token-Gated Room</h2>
          <p className="text-gray-400 text-sm mb-1">
            This room requires a {gate?.type?.toUpperCase() || 'token'} to enter.
          </p>
          {gate?.contractAddress && (
            <p className="text-gray-500 text-xs font-mono mb-4">
              {gate.contractAddress.slice(0, 6)}...{gate.contractAddress.slice(-4)}
            </p>
          )}
          {!walletAddress && (
            <p className="text-[#f5a623] text-xs mb-4">Connect your wallet to check eligibility.</p>
          )}
          <button
            onClick={() => router.push('/spaces')}
            className="px-6 py-2 bg-[#f5a623] text-[#0a1628] rounded-lg font-semibold text-sm"
          >
            Back to Spaces
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col">
      <header className="px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold">{room.title}</h1>
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">100ms</span>
          </div>
          <p className="text-gray-400 text-xs">Hosted by {room.host_name}</p>
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors"
            >
              Sign in to speak
            </Link>
          )}
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <HMSVideoRoom
          roomId={room.room_id_100ms ?? undefined}
          roomName={room.room_id_100ms ? undefined : room.id}
          role="speaker"
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
}
