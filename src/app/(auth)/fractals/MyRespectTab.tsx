'use client';

// My Respect - a member-facing view of their own Respect: total, category
// breakdown, leaderboard rank, and the unified ledger (fractal + events +
// on-chain) from /api/respect/member. Identity comes from the logged-in fid;
// members with no linked fid (name<->wallet only) can look themselves up.

import { useCallback, useEffect, useMemo, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  totalRespect: number;
}

interface LedgerRow {
  date: string | null;
  source: 'fractal' | 'event' | 'onchain';
  type: string;
  amount: number;
  detail: string;
}

interface MemberData {
  name: string;
  wallet_address: string | null;
  fid: number | null;
  total_respect: number;
  fractal_respect: number;
  event_respect: number;
  hosting_respect: number;
  bonus_respect: number;
  onchain_og: number;
  onchain_zor: number;
  first_respect_at: string | null;
  fractal_count: number;
  hosting_count: number;
}

interface MemberResponse {
  member: MemberData;
  ledger: LedgerRow[];
}

interface Props {
  currentFid: number;
}

const SOURCE_STYLE: Record<LedgerRow['source'], string> = {
  fractal: 'bg-[#f5a623]/15 border-[#f5a623]/40 text-[#f5a623]',
  event: 'bg-blue-500/15 border-blue-500/40 text-blue-200',
  onchain: 'bg-purple-500/15 border-purple-500/40 text-purple-200',
};

function fmt(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

function fmtDate(d: string | null): string {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MyRespectTab({ currentFid }: Props) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [member, setMember] = useState<MemberData | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMember, setLoadingMember] = useState(false);
  const [lookup, setLookup] = useState('');
  const [notFound, setNotFound] = useState(false);

  // ranked list (respect > 0), used for rank + name/wallet lookup
  const ranked = useMemo(() => {
    const seen = new Map<string, LeaderboardEntry>();
    for (const e of board) {
      const prev = seen.get(e.name);
      if (!prev || e.totalRespect > prev.totalRespect) seen.set(e.name, e);
    }
    return [...seen.values()]
      .filter((e) => e.totalRespect > 0)
      .sort((a, b) => b.totalRespect - a.totalRespect)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [board]);

  const fetchMember = useCallback(
    async (params: { fid?: number; wallet?: string; name?: string; entry?: LeaderboardEntry }) => {
      setLoadingMember(true);
      setNotFound(false);
      try {
        // Prefer wallet, then fid. If only a name, resolve via the ranked list.
        let qs = '';
        let entry = params.entry;
        if (params.wallet) qs = `wallet=${encodeURIComponent(params.wallet)}`;
        else if (params.fid) qs = `fid=${params.fid}`;
        else if (params.name) {
          entry = ranked.find((e) => e.name.toLowerCase() === params.name!.toLowerCase());
          if (entry?.wallet) qs = `wallet=${encodeURIComponent(entry.wallet)}`;
          else if (entry?.fid) qs = `fid=${entry.fid}`;
        }
        if (!qs) {
          setMember(null);
          setNotFound(true);
          return;
        }
        const res = await fetch(`/api/respect/member?${qs}`);
        if (!res.ok) {
          setMember(null);
          setNotFound(true);
          return;
        }
        const data: MemberResponse = await res.json();
        setMember(data.member);
        setLedger(data.ledger || []);
        // rank from the ranked list by name
        const r = ranked.find((e) => e.name === data.member.name);
        setRank(r?.rank ?? entry?.rank ?? null);
      } catch (err) {
        console.error('member fetch failed', err);
        setNotFound(true);
      } finally {
        setLoadingMember(false);
      }
    },
    [ranked],
  );

  // Load the leaderboard once, then auto-resolve the logged-in member by fid.
  useEffect(() => {
    fetch('/api/respect/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        const entries: LeaderboardEntry[] = d.leaderboard ?? [];
        setBoard(entries);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    setTotalMembers(ranked.length);
    if (member) return; // already resolved (e.g. via lookup)
    if (currentFid > 0) {
      const mine = ranked.find((e) => e.fid === currentFid);
      if (mine) {
        void fetchMember({ entry: mine, wallet: mine.wallet || undefined, fid: mine.fid || undefined });
        return;
      }
    }
    // no fid match - leave to manual lookup
  }, [loading, ranked, currentFid, member, fetchMember]);

  const lookupMatches = useMemo(() => {
    if (!lookup.trim()) return [];
    const q = lookup.toLowerCase();
    return ranked
      .filter((e) => e.name.toLowerCase().includes(q) || e.wallet?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [lookup, ranked]);

  if (loading) {
    return <div className="py-10 text-center text-gray-500 text-sm">Loading your Respect...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Lookup - always available so you can view any member, defaults to you */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-3">
        <input
          type="text"
          value={lookup}
          onChange={(e) => setLookup(e.target.value)}
          placeholder={member ? `Viewing ${member.name} - search another member...` : 'Find yourself by name or wallet...'}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-[#f5a623]/50"
        />
        {lookupMatches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {lookupMatches.map((e) => (
              <button
                key={e.name}
                onClick={() => {
                  setLookup('');
                  setMember(null);
                  void fetchMember({ entry: e, wallet: e.wallet || undefined, fid: e.fid || undefined });
                }}
                className="text-xs px-2 py-1 rounded border border-[#f5a623]/30 text-[#f5a623] hover:bg-[#f5a623]/10 transition"
              >
                {e.name} · {fmt(e.totalRespect)}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingMember && (
        <div className="py-8 text-center text-gray-500 text-sm">Loading member...</div>
      )}

      {!loadingMember && notFound && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-6 text-center">
          <p className="text-sm text-gray-300">
            {currentFid > 0
              ? "Your Farcaster account isn't linked to a Respect record yet."
              : 'No Respect record found.'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Search by your name or wallet above to find your Respect, or ask an admin to link your fid.
          </p>
        </div>
      )}

      {!loadingMember && member && (
        <>
          {/* Hero */}
          <div className="rounded-2xl border border-[#f5a623]/25 bg-gradient-to-b from-[#f5a623]/10 to-transparent p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-[#f5a623]/70">{member.name}</p>
            <p className="mt-1 text-5xl font-bold text-white tabular-nums">{fmt(member.total_respect)}</p>
            <p className="text-xs text-gray-400 mt-1">total Respect</p>
            <div className="mt-3 flex items-center justify-center gap-3 text-xs">
              {rank !== null && (
                <span className="px-2.5 py-1 rounded-full border border-[#f5a623]/40 text-[#f5a623]">
                  Rank #{rank}{totalMembers ? ` of ${totalMembers}` : ''}
                </span>
              )}
              {member.fractal_count > 0 && (
                <span className="px-2.5 py-1 rounded-full border border-white/15 text-gray-300">
                  {member.fractal_count} fractals
                </span>
              )}
              {member.first_respect_at && (
                <span className="text-gray-500">since {fmtDate(member.first_respect_at)}</span>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <Cat label="Fractal" value={member.fractal_respect} tone="gold" />
            <Cat label="Events" value={member.event_respect} tone="blue" />
            <Cat label="Hosting" value={member.hosting_respect} tone="blue" />
            <Cat label="Bonus" value={member.bonus_respect} tone="blue" />
            <Cat label="On-chain OG" value={member.onchain_og} tone="purple" />
            <Cat label="On-chain ZOR" value={member.onchain_zor} tone="purple" />
          </div>

          {/* Ledger */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d1b2a] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Respect history</h3>
              <span className="text-[11px] text-gray-500">{ledger.length} entries</span>
            </div>
            {ledger.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-500">No history yet.</p>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-[60vh] overflow-y-auto">
                {ledger.map((row, i) => (
                  <div key={`${row.date}-${i}`} className="px-4 py-2.5 flex items-center gap-3">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${SOURCE_STYLE[row.source]}`}>
                      {row.source.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{row.detail}</p>
                      <p className="text-[10px] text-gray-500">{row.type}{row.date ? ` · ${fmtDate(row.date)}` : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#f5a623] tabular-nums flex-shrink-0">
                      +{fmt(row.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Cat({ label, value, tone }: { label: string; value: number; tone: 'gold' | 'blue' | 'purple' }) {
  const toneClass =
    tone === 'gold'
      ? 'border-[#f5a623]/25 text-[#f5a623]'
      : tone === 'purple'
        ? 'border-purple-500/25 text-purple-200'
        : 'border-blue-500/20 text-blue-200';
  return (
    <div className={`rounded-xl border bg-black/20 px-3 py-2.5 text-center ${toneClass}`}>
      <div className="text-lg font-bold tabular-nums">{fmt(value)}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
