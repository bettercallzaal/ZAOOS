'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { FollowerUser } from './FollowerCard';

interface NetworkStats {
  followerCount: number;
  followingCount: number;
  ratio: number;
  zaoCount: number;
  zaoPercent: number;
  mutualCount: number;
  powerBadgePercent: number;
  avgScore: number;
}

interface ChannelRank {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  score: number;
  rank: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
      <p className={`text-xl font-bold ${accent ? 'text-[#f5a623]' : 'text-white'}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function Skel({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-700/50 rounded ${className}`} />;
}

function ScoreBar({ score, max = 1 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  return (
    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-[#f5a623] to-[#f5c623]" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Avatar({ src, alt, small }: { src?: string | null; alt: string; small?: boolean }) {
  const cls = small ? 'w-6 h-6' : 'w-9 h-9';
  if (!src) return <div className={`${cls} rounded-full bg-gray-700 flex-shrink-0`} />;
  return (
    <div className={`${cls} relative flex-shrink-0`}>
      <Image src={src} alt={alt} fill className="rounded-full object-cover" unoptimized />
    </div>
  );
}

export function SocialAnalytics({ currentFid }: { currentFid: number }) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [topFollowers, setTopFollowers] = useState<FollowerUser[]>([]);
  const [channelRanks, setChannelRanks] = useState<ChannelRank[] | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [followingFids, setFollowingFids] = useState<Set<number>>(new Set());
  const [followLoading, setFollowLoading] = useState<number | null>(null);

  const computeStats = useCallback((followers: FollowerUser[], profile: { follower_count: number; following_count: number }) => {
    const { follower_count: fc, following_count: fgc } = profile;
    const ratio = fgc > 0 ? Math.round((fc / fgc) * 100) / 100 : 0;
    const zao = followers.filter((u) => u.isZaoMember);
    const mutuals = followers.filter((u) => u.viewer_context?.following && u.viewer_context?.followed_by);
    const pb = followers.filter((u) => u.power_badge);
    const scores = followers.map((u) => u.experimental?.neynar_user_score ?? 0).filter((s) => s > 0);
    const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;

    setFollowingFids(new Set(followers.filter((u) => u.viewer_context?.following).map((u) => u.fid)));
    setStats({
      followerCount: fc || 0, followingCount: fgc || 0, ratio,
      zaoCount: zao.length, zaoPercent: followers.length > 0 ? Math.round((zao.length / followers.length) * 100) : 0,
      mutualCount: mutuals.length,
      powerBadgePercent: followers.length > 0 ? Math.round((pb.length / followers.length) * 100) : 0,
      avgScore,
    });
    setTopFollowers(
      [...followers].filter((u) => (u.experimental?.neynar_user_score ?? 0) > 0)
        .sort((a, b) => (b.experimental?.neynar_user_score ?? 0) - (a.experimental?.neynar_user_score ?? 0))
        .slice(0, 5)
    );
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const s = ac.signal;
    (async () => {
      setLoading(true);
      const [pR, fR, cR] = await Promise.allSettled([
        fetch(`/api/users/${currentFid}`, { signal: s }),
        fetch(`/api/users/${currentFid}/followers?sort=relevant`, { signal: s }),
        fetch(`/api/social/trending?channel=thezao`, { signal: s }),
      ]);
      if (s.aborted) return;

      let profile = { follower_count: 0, following_count: 0 };
      if (pR.status === 'fulfilled' && pR.value.ok) {
        const d = await pR.value.json();
        const u = d.user || d;
        profile = { follower_count: u.follower_count ?? 0, following_count: u.following_count ?? 0 };
      }
      let followers: FollowerUser[] = [];
      if (fR.status === 'fulfilled' && fR.value.ok) {
        followers = (await fR.value.json()).users || [];
      }
      computeStats(followers, profile);

      if (cR.status === 'fulfilled' && cR.value.ok) {
        try {
          const d = await cR.value.json();
          const ranks: ChannelRank[] = (d.rankings || d.users || []).slice(0, 5);
          setChannelRanks(ranks);
          const me = ranks.findIndex((r) => r.fid === currentFid);
          setUserRank(me >= 0 ? me + 1 : null);
        } catch { setChannelRanks(null); }
      }
      setLoading(false);
    })().catch(() => { if (!s.aborted) setLoading(false); });
    return () => { ac.abort(); };
  }, [currentFid, computeStats]);

  const handleFollow = async (targetFid: number) => {
    setFollowLoading(targetFid);
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFid }),
      });
      if (res.ok) setFollowingFids((prev) => { const n = new Set(prev); n.add(targetFid); return n; });
    } catch { /* silent */ } finally { setFollowLoading(null); }
  };

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Your Network Stats */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Your Network</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 animate-pulse">
              <Skel className="h-6 w-16 mb-2" /><Skel className="h-3 w-20" />
            </div>
          )) : stats ? (
            <>
              <StatCard label="Followers" value={fmt(stats.followerCount)} />
              <StatCard label="Following" value={fmt(stats.followingCount)} />
              <StatCard label="ZAO Members" value={`${stats.zaoCount} (${stats.zaoPercent}%)`} accent />
              <StatCard label="Mutual Follows" value={String(stats.mutualCount)} />
            </>
          ) : (
            <p className="col-span-2 md:col-span-4 text-center py-6 text-sm text-gray-500">Unable to load network stats</p>
          )}
        </div>
      </div>

      {/* Network Quality */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Network Quality</h3>
        {loading ? (
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 animate-pulse space-y-3">
            <Skel className="h-3 w-32" /><Skel className="h-2 w-full" /><Skel className="h-3 w-28" />
          </div>
        ) : stats ? (
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs text-gray-400">Avg Engagement Score</span>
                <span className="text-sm font-semibold text-[#f5a623]">{stats.avgScore}</span>
              </div>
              <ScoreBar score={stats.avgScore} />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs text-gray-400">Power Badge Holders</span>
                <span className="text-sm font-semibold text-white">{stats.powerBadgePercent}%</span>
              </div>
              <ScoreBar score={stats.powerBadgePercent} max={100} />
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-gray-800">
              <span className="text-xs text-gray-400">Follower / Following Ratio</span>
              <span className={`text-sm font-semibold ${stats.ratio >= 1 ? 'text-green-400' : 'text-gray-300'}`}>{stats.ratio}x</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Top Engaged Followers */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Top Engaged Followers</h3>
        {loading ? (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 divide-y divide-gray-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                <Skel className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5"><Skel className="h-3.5 w-24" /><Skel className="h-2.5 w-16" /></div>
              </div>
            ))}
          </div>
        ) : topFollowers.length > 0 ? (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 divide-y divide-gray-800">
            {topFollowers.map((user) => {
              const score = user.experimental?.neynar_user_score ?? 0;
              const isFollowed = followingFids.has(user.fid);
              return (
                <div key={user.fid} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar src={user.pfp_url} alt={`${user.display_name || user.username} avatar`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{user.display_name}</span>
                      {user.power_badge && (
                        <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9.315 7.584C12.195 3.883 16.615 1.838 21.305 2.07c.232 4.69-1.813 9.11-5.514 11.99L12 18l-2.69 2.69A1 1 0 018 20v-3.382a2 2 0 00-.586-1.414l-.828-.828A2 2 0 006 13.382V10a1 1 0 01.293-.707l3.022-3.022z" />
                        </svg>
                      )}
                      {user.isZaoMember && <span className="text-[9px] font-bold bg-[#f5a623]/20 text-[#f5a623] px-1 py-0.5 rounded-full">ZAO</span>}
                    </div>
                    <div className="mt-1"><ScoreBar score={score} /></div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-gray-500 tabular-nums w-8 text-right">{Math.round(score * 100)}%</span>
                    {!isFollowed && user.fid !== currentFid && (
                      <button onClick={() => handleFollow(user.fid)} disabled={followLoading === user.fid}
                        className="px-2.5 py-1 text-[11px] rounded-full border border-[#f5a623]/40 text-[#f5a623] hover:bg-[#f5a623]/10 transition-colors disabled:opacity-50">
                        {followLoading === user.fid ? '...' : 'Follow'}
                      </button>
                    )}
                    {isFollowed && user.fid !== currentFid && <span className="text-[10px] text-green-400/70">Following</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No engagement data available yet</p>
            <p className="text-[11px] text-gray-600 mt-1">Scores will appear as followers interact with the network</p>
          </div>
        )}
      </div>

      {/* Channel Rankings (only renders if API exists) */}
      {channelRanks !== null && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">/thezao Channel Rankings</h3>
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 space-y-3">
            {userRank && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <span className="text-xs text-gray-400">Your rank</span>
                <span className="text-lg font-bold text-[#f5a623]">#{userRank}</span>
              </div>
            )}
            <div className="space-y-2">
              {channelRanks.map((entry, i) => (
                <div key={entry.fid} className={`flex items-center gap-2.5 text-sm ${entry.fid === currentFid ? 'text-[#f5a623]' : 'text-white'}`}>
                  <span className="text-gray-600 w-5 text-right text-xs">{i + 1}.</span>
                  <Avatar src={entry.pfp_url} alt={`${entry.display_name || entry.username} avatar`} small />
                  <span className="font-medium truncate flex-1">{entry.display_name}</span>
                  <span className="text-[11px] text-gray-500 tabular-nums">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
