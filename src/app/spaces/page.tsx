'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import { PageHeader } from '@/components/navigation/PageHeader';
import StageCard from '@/components/spaces/StageCard';
import { HostRoomModal, type RoomTheme, type RoomMode } from '@/components/spaces/HostRoomModal';
import type { GateConfig } from '@/components/spaces/TokenGateSection';
import { generateCallId, generateSlug } from '@/lib/spaces/streamHelpers';
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

  // Juke-hosted spaces live in a separate Supabase table (juke_spaces, RLS
  // publicly readable). Different shape than ZAO Stream/100ms rooms, so kept
  // as its own state slice + rendered in its own section.
  const [jukeRooms, setJukeRooms] = useState<JukeRoomCard[]>([]);

  const fetchStages = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    // Include both stage (audio-only) and voice_channel (full A+V) live rooms.
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .in('room_type', ['stage', 'voice_channel'])
      .eq('state', 'live')
      .order('created_at', { ascending: false });

    setStages((data as Room[]) ?? []);
    setLoading(false);
  }, []);

  const fetchJuke = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from('juke_spaces')
      .select('id, title, status, participant_count, started_at, created_by_fid')
      .eq('status', 'active')
      .order('started_at', { ascending: false });
    setJukeRooms((data as JukeRoomCard[] | null) ?? []);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    fetchStages();
    fetchJuke();

    const channel = supabase
      .channel('live-spaces-mixed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchStages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'juke_spaces' }, () => fetchJuke())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStages, fetchJuke]);

  const handleCreateRoom = async (
    title: string,
    description: string,
    theme: RoomTheme,
    gateConfig?: GateConfig | null,
    provider: AudioProvider = 'stream',
    roomMode: RoomMode = 'stage',
  ) => {
    if (!user) throw new Error('Not authenticated');

    // Juke is owned + hosted on juke.audio — Path B via /api/juke/space mints
    // the room on Juke's side and we land on /live/{spaceId} (keyless iframe).
    // ZAO concepts (theme, room_mode, gate_config, slug) do not apply to Juke.
    if (provider === 'juke') {
      const res = await fetch('/api/juke/space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.status === 401) {
        throw new Error(
          'Juke creation requires admin access. /live/create has a team-password path for non-admins.',
        );
      }
      if (res.status === 503) {
        throw new Error(
          'Juke is not configured on this environment yet (missing JUKE_API_KEY).',
        );
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Failed to create Juke space');
      }
      const body = await res.json();
      const spaceId = body?.data?.id;
      if (!spaceId) throw new Error('Juke returned no space id');
      router.push(`/live/${spaceId}`);
      return;
    }

    const streamCallId = generateCallId();
    const slug = generateSlug(title);

    const endpoint = provider === '100ms' ? '/api/100ms/rooms' : '/api/stream/rooms';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, streamCallId, theme, room_type: roomMode, gate_config: gateConfig || null, provider, slug }),
    });
    if (!res.ok) throw new Error('Failed to create room');
    const { room } = await res.json();

    // Use slug for clean URLs, fall back to ID
    const roomPath = room.slug || room.id;
    const path = provider === '100ms' ? `/spaces/hms/${roomPath}` : `/spaces/${roomPath}`;
    router.push(path);
  };

  const handleJoinStage = (room: Room) => { router.push(`/spaces/${room.slug || room.id}`); };

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
          <div className="flex items-center gap-2">
            <Link
              href="/live/recordings"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 border border-white/[0.12] rounded-lg hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              Recordings
            </Link>
            {user ? (
              <button onClick={() => setShowHostModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-bold rounded-xl transition-colors shadow-lg shadow-[#f5a623]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Go Live
              </button>
            ) : (
              <Link href="/" className="px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors">
                Sign in to host
              </Link>
            )}
          </div>
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
          <LiveTab loading={loading} stages={filteredStages} jukeRooms={jukeRooms} myRooms={myRooms} otherRooms={otherRooms} user={user} onHost={() => setShowHostModal(true)} onJoin={handleJoinStage} />
        )}
        {activeTab === 'upcoming' && <ScheduledRooms category={category} />}
        {activeTab === 'past' && <PastRooms category={category} />}
      </div>

      {user && <HostRoomModal isOpen={showHostModal} onClose={() => setShowHostModal(false)} onCreateRoom={handleCreateRoom} />}
    </div>
  );
}

/** Minimal shape /spaces needs to render a Juke-hosted live row.
 * Source: public.juke_spaces (RLS allow-all on SELECT). */
interface JukeRoomCard {
  id: string;
  title: string;
  status: 'scheduled' | 'active' | 'ended';
  participant_count: number;
  started_at: string | null;
  created_by_fid: number;
}

function LiveTab({ loading, stages, jukeRooms, myRooms, otherRooms, user, onHost, onJoin }: {
  loading: boolean; stages: Room[]; jukeRooms: JukeRoomCard[]; myRooms: Room[]; otherRooms: Room[];
  user: { fid: number } | null; onHost: () => void; onJoin: (room: Room) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-5 animate-pulse h-44" />
        ))}
      </div>
    );
  }

  if (stages.length === 0 && jukeRooms.length === 0) {
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
      {jukeRooms.length > 0 && <JukeLiveSection rooms={jukeRooms} />}

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

/**
 * Live Juke spaces section. Different look + CTA than ZAO Stream/100ms rooms
 * because the routing target is /live/{id} (keyless Juke iframe) and the data
 * shape is distinct. A subtle "FC" badge per-card makes the source obvious so
 * a listener knows what they are walking into.
 */
function JukeLiveSection({ rooms }: { rooms: JukeRoomCard[] }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 text-[#855dcd]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#855dcd] animate-pulse" aria-hidden="true" />
        Live on Juke
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((r) => (
          <Link
            key={r.id}
            href={`/live/${r.id}`}
            aria-label={`Join Juke space: ${r.title}`}
            className="group block bg-[#111d2e] border border-white/[0.08] rounded-xl p-4 transition-all hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#855dcd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628]"
          >
            <div className="w-8 h-1 rounded-full bg-[#855dcd] mb-3 opacity-60" aria-hidden="true" />
            <div className="flex items-start justify-between gap-2 mb-3">
              <h4 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-[#a78bfa] transition-colors">
                {r.title || 'Untitled space'}
              </h4>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                  Live
                </span>
                <span className="inline-flex items-center text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-full border border-[#855dcd]/40 bg-[#855dcd]/10 text-[#a78bfa]">
                  FC Juke
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {r.participant_count <= 1
                  ? 'Just host'
                  : `${r.participant_count} listening`}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-[#855dcd] text-white text-xs font-bold group-hover:bg-[#a78bfa] transition-colors">
                Listen
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
