'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import { PageHeader } from '@/components/navigation/PageHeader';
import StageCard from '@/components/spaces/StageCard';
import { HostRoomModal, type RoomTheme } from '@/components/spaces/HostRoomModal';
import type { GateConfig } from '@/components/spaces/TokenGateSection';
import { generateCallId } from '@/lib/spaces/streamHelpers';
import SpacesTabs from '@/components/spaces/SpacesTabs';
import CategoryFilter from '@/components/spaces/CategoryFilter';
import ScheduledRooms from '@/components/spaces/ScheduledRooms';
import PastRooms from '@/components/spaces/PastRooms';
import type { Room, AudioProvider } from '@/lib/spaces/roomsDb';

export default function PublicSpacesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showHostModal, setShowHostModal] = useState(false);
  const [stages, setStages] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [category, setCategory] = useState('all');

  const fetchStages = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_type', 'stage')
      .eq('state', 'live')
      .order('created_at', { ascending: false });

    setStages((data as Room[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    fetchStages();

    const channel = supabase
      .channel('live-stages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchStages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStages]);

  const handleCreateRoom = async (
    title: string,
    description: string,
    theme: RoomTheme,
    gateConfig?: GateConfig | null,
    provider: AudioProvider = 'stream'
  ) => {
    if (!user) throw new Error('Not authenticated');
    const streamCallId = generateCallId();
    const res = await fetch('/api/stream/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, streamCallId, theme, room_type: 'stage', gate_config: gateConfig || null, provider }),
    });
    if (!res.ok) throw new Error('Failed to create room');
    const { room } = await res.json();
    router.push(`/spaces/${room.id}`);
  };

  const handleJoinStage = (room: Room) => { router.push(`/spaces/${room.id}`); };

  const filteredStages = useMemo(() => {
    if (category === 'all') return stages;
    return stages.filter((s) => s.theme === category);
  }, [stages, category]);

  const { myRooms, otherRooms } = useMemo(() => {
    if (!user) return { myRooms: [], otherRooms: filteredStages };
    const my = filteredStages.filter((s) => s.host_fid === user.fid);
    const other = filteredStages.filter((s) => s.host_fid !== user.fid);
    return { myRooms: my, otherRooms: other };
  }, [filteredStages, user]);

  return (
    <div className="text-white flex flex-col min-h-[100dvh] bg-[#0a1628]">
      <PageHeader
        title="Spaces"
        subtitle={stages.length > 0 ? `${stages.length} live now` : 'Audio stages'}
        backHref="/home"
        count={stages.length > 0 ? stages.length : undefined}
        rightAction={
          user ? (
            <button onClick={() => setShowHostModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-bold rounded-xl transition-colors shadow-lg shadow-[#f5a623]/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Go Live
            </button>
          ) : (
            <Link href="/" className="px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors">
              Sign in to host
            </Link>
          )
        }
      />

      <div className="px-4 max-w-4xl mx-auto w-full">
        <SpacesTabs active={activeTab} onChange={setActiveTab} liveBadge={stages.length} />
        <div className="py-4">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 max-w-4xl mx-auto w-full">
        {activeTab === 'live' && (
          <LiveTab loading={loading} stages={filteredStages} myRooms={myRooms} otherRooms={otherRooms} user={user} onHost={() => setShowHostModal(true)} onJoin={handleJoinStage} />
        )}
        {activeTab === 'upcoming' && <ScheduledRooms category={category} />}
        {activeTab === 'past' && <PastRooms category={category} />}
      </div>

      {user && <HostRoomModal isOpen={showHostModal} onClose={() => setShowHostModal(false)} onCreateRoom={handleCreateRoom} />}
    </div>
  );
}

function LiveTab({ loading, stages, myRooms, otherRooms, user, onHost, onJoin }: {
  loading: boolean; stages: Room[]; myRooms: Room[]; otherRooms: Room[];
  user: { fid: number } | null; onHost: () => void; onJoin: (room: Room) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#111d2e] border border-gray-800 rounded-xl p-5 animate-pulse h-44" />
        ))}
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-[#f5a623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-white text-lg font-semibold mb-1">No live stages yet</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Start a stage to go live with your community. Listeners can join and request to speak.
        </p>
        {user && (
          <button onClick={onHost} className="flex items-center gap-2 px-6 py-2.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] font-bold rounded-xl transition-colors shadow-lg shadow-[#f5a623]/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create a Stage
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myRooms.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-[#f5a623] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-pulse" />
            Your Active Rooms
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {myRooms.map((stage) => (
              <StageCard key={stage.id} room={stage} onJoin={onJoin} isOwn />
            ))}
          </div>
        </section>
      )}
      <section>
        {myRooms.length > 0 && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">All Live Stages</h3>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {(myRooms.length > 0 ? otherRooms : stages).map((stage) => (
            <StageCard key={stage.id} room={stage} onJoin={onJoin} />
          ))}
        </div>
      </section>
    </div>
  );
}
