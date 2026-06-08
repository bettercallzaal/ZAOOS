'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseBrowser } from '@/lib/db/supabase';
// Type-only imports — the msRoomsDb module itself is server-only (service role).
import type { MSRoom, SpeakerRequest, PinnedLink } from '@/lib/social/msRoomsDb';
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

  // Stage state (only meaningful when room.settings.room_type === 'stage').
  const [speakers, setSpeakers] = useState<number[]>([]);
  const [speakerNames, setSpeakerNames] = useState<Record<number, string>>({});
  const [pendingRequests, setPendingRequests] = useState<SpeakerRequest[]>([]);
  const [handRaised, setHandRaised] = useState(false);

  // Pinned links (host-curated quick links / agenda).
  const [pinnedLinks, setPinnedLinks] = useState<PinnedLink[]>([]);
  const [editingLinks, setEditingLinks] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const isHost = user?.fid === room?.host_fid;
  const isStage = room?.settings?.room_type === 'stage';
  // In a stage room only the host + approved speakers publish; everyone else
  // joins as a 'listener' (subscribe-only, enforced by the 100ms role + the
  // token route). Non-stage rooms keep the open "everyone speaks" behavior.
  const canSpeak = !isStage || isHost || (user ? speakers.includes(user.fid) : false);
  const hmsRole = canSpeak ? 'speaker' : 'listener';

  // Post-load API/realtime calls key off the room's real UUID (room.id), not the
  // URL param — which may be a share slug. Only the initial fetch uses the param.
  const roomDbId = room?.id;

  const refreshStage = useCallback(async () => {
    if (!roomDbId) return;
    try {
      const res = await fetch(`/api/100ms/rooms/${roomDbId}/stage`);
      if (!res.ok) return;
      const data = await res.json();
      setSpeakers((data.speakers as number[]) ?? []);
      setSpeakerNames((data.speakerNames as Record<number, string>) ?? {});
      setPendingRequests((data.requests as SpeakerRequest[]) ?? []);
    } catch {
      // Non-fatal — the room still works without live stage state.
    }
  }, [roomDbId]);

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

  // Stage rooms: load + live-subscribe to hand-raises and the approved-speaker
  // list. Both tables are in the Supabase realtime publication. When the
  // speakers list changes, canSpeak/hmsRole recompute and HMSVideoRoom rejoins
  // with the new role (promotion = re-fetch a speaker token + rejoin).
  useEffect(() => {
    if (!isStage || !room) return;
    refreshStage();

    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`hms-stage-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'speaker_requests', filter: `room_id=eq.${room.id}` }, () => refreshStage())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ms_rooms', filter: `id=eq.${room.id}` }, () => refreshStage())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isStage, room, refreshStage]);

  // Clear the local "hand raised" flag once the host acts (we're now a speaker)
  // or the request is gone from the pending list.
  useEffect(() => {
    if (canSpeak) setHandRaised(false);
  }, [canSpeak]);

  // Keep the editable pinned-links list in sync with the loaded room.
  useEffect(() => {
    if (room) setPinnedLinks(Array.isArray(room.pinned_links) ? room.pinned_links : []);
  }, [room]);

  // Canonicalize the address bar to the shareable slug URL, so a host who landed
  // on the raw /spaces/hms/<uuid> link can just copy /spaces/hms/<slug>.
  useEffect(() => {
    const slug = room?.settings?.slug;
    if (typeof slug === 'string' && slug && typeof window !== 'undefined' && roomId !== slug) {
      window.history.replaceState(null, '', `/spaces/hms/${slug}`);
    }
  }, [room, roomId]);

  // Leaderboard session tracking — parity with the Stream room page. Records
  // time spent in 100ms rooms into space_sessions so it counts on the
  // leaderboard. Starts once the user has actually entered (room loaded, gate
  // passed, signed in); ends on tab close + on unmount (route change / leave).
  const sessionStartedRef = useRef(false);
  useEffect(() => {
    if (!room || gateBlocked || loading || !user?.fid || sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    fetch('/api/spaces/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.id,
        roomName: room.title,
        roomType: isStage ? 'stage' : 'voice_channel',
      }),
    }).catch(() => {});
  }, [room, gateBlocked, loading, user?.fid, isStage]);

  useEffect(() => {
    const endSession = () => {
      if (!room?.id || !sessionStartedRef.current) return;
      fetch('/api/spaces/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', endSession);
    return () => {
      window.removeEventListener('beforeunload', endSession);
      endSession(); // route change / leave
    };
  }, [room?.id]);

  const raiseHand = async () => {
    setHandRaised(true);
    try {
      const res = await fetch(`/api/100ms/rooms/${roomDbId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'raise_hand' }),
      });
      if (!res.ok) setHandRaised(false);
    } catch {
      setHandRaised(false);
    }
  };

  const hostAction = async (action: 'approve' | 'deny' | 'demote', fid: number) => {
    await fetch(`/api/100ms/rooms/${roomDbId}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, fid }),
    }).catch(() => {});
    refreshStage();
  };

  const savePinnedLinks = async (next: PinnedLink[]) => {
    setSavingLinks(true);
    try {
      const res = await fetch(`/api/100ms/rooms/${roomDbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinnedLinks: next }),
      });
      if (res.ok) setPinnedLinks(next);
    } finally {
      setSavingLinks(false);
    }
  };

  const addPinnedLink = () => {
    const label = linkLabel.trim();
    let url = linkUrl.trim();
    if (!label || !url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setLinkLabel('');
    setLinkUrl('');
    savePinnedLinks([...pinnedLinks, { label, url }].slice(0, 10));
  };

  const removePinnedLink = (index: number) => {
    savePinnedLinks(pinnedLinks.filter((_, i) => i !== index));
  };

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
            {isStage && (
              <span className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-2 py-0.5 rounded-full">STAGE</span>
            )}
          </div>
          <p className="text-gray-400 text-xs">
            Hosted by {room.host_name}
            {isStage && !canSpeak && ' · listening'}
          </p>
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
        {/* Host stage controls: approve / deny raised hands. */}
        {isStage && isHost && (
          <div className="mb-4 rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Requests to speak ({pendingRequests.length})
            </h2>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-sm">No raised hands right now.</p>
            ) : (
              <ul className="space-y-2">
                {pendingRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3">
                    <span className="text-white text-sm truncate">✋ {r.requester_name}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => hostAction('approve', r.requester_fid)}
                        className="px-3 py-1 rounded-lg bg-[#f5a623] text-[#0a1628] text-xs font-semibold hover:bg-[#ffd700]"
                      >
                        Add to stage
                      </button>
                      <button
                        type="button"
                        onClick={() => hostAction('deny', r.requester_fid)}
                        className="px-3 py-1 rounded-lg border border-white/20 text-white text-xs hover:bg-white/10"
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Host stage moderation: remove an already-approved speaker. */}
        {isStage && isHost && speakers.filter((f) => f !== room.host_fid).length > 0 && (
          <div className="mb-4 rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              On stage ({speakers.filter((f) => f !== room.host_fid).length})
            </h2>
            <ul className="space-y-2">
              {speakers
                .filter((f) => f !== room.host_fid)
                .map((fid) => (
                  <li key={fid} className="flex items-center justify-between gap-3">
                    <span className="text-white text-sm truncate">🎙️ {speakerNames[fid] || `fid-${fid}`}</span>
                    <button
                      type="button"
                      onClick={() => hostAction('demote', fid)}
                      className="px-3 py-1 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10 flex-shrink-0"
                    >
                      Remove from stage
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Listener raise-hand control. */}
        {isStage && !canSpeak && user && (
          <div className="mb-4 flex items-center justify-center">
            {handRaised ? (
              <p className="text-sm text-[#f5a623]">✋ Hand raised — waiting for the host to add you.</p>
            ) : (
              <button
                type="button"
                onClick={raiseHand}
                className="rounded-lg bg-[#f5a623] px-5 py-2 text-sm font-semibold text-[#0a1628] hover:bg-[#ffd700]"
              >
                ✋ Raise hand to speak
              </button>
            )}
          </div>
        )}

        {/* Pinned links / agenda — visible to everyone, editable by the host. */}
        {(pinnedLinks.length > 0 || isHost) && (
          <div className="mb-4 rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pinned links</h2>
              {isHost && (
                <button
                  type="button"
                  onClick={() => setEditingLinks((v) => !v)}
                  className="text-xs text-[#f5a623] hover:underline"
                >
                  {editingLinks ? 'Done' : 'Edit'}
                </button>
              )}
            </div>

            {pinnedLinks.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {isHost ? 'Add links for everyone in the room — agenda, docs, mints.' : 'No links pinned.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pinnedLinks.map((link, i) => (
                  <span
                    key={`${link.url}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[12rem] truncate text-[#f5a623] hover:underline"
                    >
                      {link.label}
                    </a>
                    {isHost && editingLinks && (
                      <button
                        type="button"
                        onClick={() => removePinnedLink(i)}
                        aria-label={`Remove ${link.label}`}
                        className="text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {isHost && editingLinks && pinnedLinks.length < 10 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Label"
                  maxLength={80}
                  className="min-w-[8rem] flex-1 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-1.5 text-sm text-white placeholder:text-gray-600"
                />
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  maxLength={500}
                  className="min-w-[10rem] flex-[2] rounded-lg border border-white/15 bg-[#0a1628] px-3 py-1.5 text-sm text-white placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={addPinnedLink}
                  disabled={savingLinks || !linkLabel.trim() || !linkUrl.trim()}
                  className="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs font-semibold text-[#0a1628] hover:bg-[#ffd700] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}

        <HMSVideoRoom
          roomId={room.room_id_100ms ?? undefined}
          roomName={room.room_id_100ms ? undefined : room.id}
          role={hmsRole}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
}
