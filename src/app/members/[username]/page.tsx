'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface MemberProfile {
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  realName: string | null;
  bio: string | null;
  ensName: string | null;
  zid: string | null;
  tier: string;
  role: string;
  tags: string[];
  primaryWallet: string | null;
  preferredWallet: string | null;
  hiddenWallets: string[];
  platforms: Record<string, string | null>;
  ensNames: Record<string, string> | null;
  ensAvatar: string | null;
  ensProfile: Record<string, string> | null;
  respect: {
    total: number;
    fractal: number;
    event: number;
    hosting: number;
    bonus: number;
    onchainOG: number;
    onchainZOR: number;
    fractalCount: number;
    firstRespectAt: string | null;
  } | null;
  artistProfile: {
    slug: string;
    biography: string | null;
    category: string;
    coverImageUrl: string | null;
    thumbnailUrl: string | null;
    isFeatured: boolean;
    website: string | null;
  } | null;
  social: { followerCount: number; followingCount: number; powerBadge: boolean } | null;
  reputation: {
    neynarScore: number | null;
    openRank: { score: number; rank: number } | null;
    coinbaseVerified: boolean;
    easAttestationCount: number;
    github: { username: string; repos: number; followers: number } | null;
  } | null;
  fractalHistory: { sessionName: string; sessionDate: string | null; era: string; rank: number; score: number; participants: number; source: string }[];
  events: { type: string; amount: number; description: string | null; date: string | null }[];
  lastActiveAt: string | null;
  createdAt: string;
}

function shortAddr(addr: string) {
  return addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MemberProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/members/${encodeURIComponent(username)}`)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Member not found' : 'Failed to load');
        return r.json();
      })
      .then(setProfile)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">{error || 'Member not found'}</p>
        <Link href="/" className="text-[#f5a623] text-sm hover:underline">Back to ZAO OS</Link>
      </div>
    );
  }

  const p = profile;
  const displayWallet = p.preferredWallet || p.primaryWallet;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      {/* Header bar */}
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-[#f5a623] font-bold text-sm">THE ZAO</Link>
        <Link href="/members" className="text-xs text-gray-500 hover:text-white">All Members</Link>
      </nav>

      {/* Cover image hero */}
      {p.artistProfile?.coverImageUrl && (
        <div className="relative h-40 sm:h-52 overflow-hidden">
          <Image src={p.artistProfile.coverImageUrl} alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/60 via-transparent to-[#0a1628]" />
        </div>
      )}

      <div className={`max-w-2xl mx-auto px-4 ${p.artistProfile?.coverImageUrl ? '-mt-16 relative z-10' : 'pt-8'}`}>
        {/* Hero */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-800 flex-shrink-0 ring-2 ring-[#0a1628]">
            {(p.pfpUrl || p.ensAvatar) ? (
              <Image src={p.pfpUrl || p.ensAvatar || ''} alt="" fill className="object-cover" sizes="80px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
                {(p.displayName || p.username || '?')[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{p.displayName || p.username || 'Unknown'}</h1>
              {p.zid && (
                <span className="text-xs font-bold text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
                  ZID #{p.zid}
                </span>
              )}
              {p.tier === 'respect_holder' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  Respect Holder
                </span>
              )}
              {p.artistProfile?.isFeatured && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">
                  Featured
                </span>
              )}
              {p.artistProfile?.category && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 capitalize">
                  {p.artistProfile.category}
                </span>
              )}
              {p.role === 'admin' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  Admin
                </span>
              )}
              {p.role === 'moderator' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Moderator
                </span>
              )}
              {p.social?.powerBadge && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">Power Badge</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 flex-wrap">
              {p.username && <span>@{p.username}</span>}
              {p.realName && p.realName !== p.displayName && (
                <span className="text-gray-600">({p.realName})</span>
              )}
              {/* Show all ENS names */}
              {p.ensNames && Object.values(p.ensNames).filter(Boolean).length > 0 ? (
                Object.values(p.ensNames).filter(Boolean).map((name, i) => (
                  <span key={i} className="text-[#f5a623]">{name}</span>
                ))
              ) : p.ensName ? (
                <span className="text-[#f5a623]">{p.ensName}</span>
              ) : null}
              {displayWallet && <span className="font-mono text-xs">{shortAddr(displayWallet)}</span>}
            </div>
            {p.bio && <p className="text-sm text-gray-400 mt-2 line-clamp-3">{p.bio}</p>}
            {p.artistProfile?.biography && !p.bio && (
              <p className="text-sm text-gray-400 mt-2 line-clamp-3">{p.artistProfile.biography}</p>
            )}
            {/* Last active */}
            {p.lastActiveAt && (
              <p className="text-[10px] text-gray-600 mt-1">
                Active {timeAgo(p.lastActiveAt)}
              </p>
            )}
          </div>
        </div>

        {/* Social stats */}
        {p.social && (
          <div className="flex gap-4 mb-6 text-sm">
            <span><strong className="text-white">{p.social.followerCount.toLocaleString()}</strong> <span className="text-gray-500">followers</span></span>
            <span><strong className="text-white">{p.social.followingCount.toLocaleString()}</strong> <span className="text-gray-500">following</span></span>
          </div>
        )}

        {/* Respect stats — full breakdown */}
        {p.respect && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Respect</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="text-center bg-[#0a1628] rounded-lg p-2">
                <p className="text-lg font-bold text-[#f5a623]">{p.respect.total}</p>
                <p className="text-[9px] text-gray-500">Total</p>
              </div>
              <div className="text-center bg-[#0a1628] rounded-lg p-2">
                <p className="text-lg font-bold text-white">{p.respect.fractal}</p>
                <p className="text-[9px] text-gray-500">Fractal</p>
              </div>
              <div className="text-center bg-[#0a1628] rounded-lg p-2">
                <p className="text-lg font-bold text-white">{p.respect.event}</p>
                <p className="text-[9px] text-gray-500">Events</p>
              </div>
              <div className="text-center bg-[#0a1628] rounded-lg p-2">
                <p className="text-lg font-bold text-white">{p.respect.hosting}</p>
                <p className="text-[9px] text-gray-500">Hosting</p>
              </div>
              <div className="text-center bg-[#0a1628] rounded-lg p-2">
                <p className="text-lg font-bold text-white">{p.respect.onchainOG}</p>
                <p className="text-[9px] text-gray-500">OG Chain</p>
              </div>
              <div className="text-center bg-[#0a1628] rounded-lg p-2">
                <p className="text-lg font-bold text-white">{p.respect.onchainZOR}</p>
                <p className="text-[9px] text-gray-500">ZOR Chain</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-[10px] text-gray-600">
              <span>{p.respect.fractalCount} fractal sessions</span>
              {p.respect.firstRespectAt && <span>Member since {p.respect.firstRespectAt}</span>}
            </div>
          </div>
        )}

        {/* Platforms */}
        {Object.values(p.platforms).some(Boolean) && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {p.fid && (
                <a href={`https://warpcast.com/${p.username}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs hover:bg-purple-500/20 transition-colors">
                  Farcaster
                </a>
              )}
              {p.platforms.bluesky && (
                <a href={`https://bsky.app/profile/${p.platforms.bluesky}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
                  Bluesky
                </a>
              )}
              {p.platforms.x && (
                <a href={`https://x.com/${p.platforms.x}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 transition-colors">
                  X
                </a>
              )}
              {p.platforms.instagram && (
                <a href={`https://instagram.com/${p.platforms.instagram}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-xs hover:bg-pink-500/20 transition-colors">
                  Instagram
                </a>
              )}
              {p.platforms.spotify && (
                <a href={p.platforms.spotify} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs hover:bg-green-500/20 transition-colors">
                  Spotify
                </a>
              )}
              {p.platforms.soundcloud && (
                <a href={p.platforms.soundcloud} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs hover:bg-orange-500/20 transition-colors">
                  SoundCloud
                </a>
              )}
              {p.platforms.audius && (
                <a href={`https://audius.co/${p.platforms.audius}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-xs hover:bg-purple-500/20 transition-colors">
                  Audius
                </a>
              )}
              {p.platforms.discord && (
                <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs">
                  Discord: {p.platforms.discord}
                </span>
              )}
              {p.artistProfile?.website && (
                <a href={p.artistProfile.website} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#f5a623]/10 text-[#f5a623] text-xs hover:bg-[#f5a623]/20 transition-colors">
                  Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* Reputation Signals */}
        {p.reputation && (p.reputation.neynarScore || p.reputation.openRank || p.reputation.coinbaseVerified || p.reputation.easAttestationCount > 0 || p.reputation.github) && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Reputation Signals</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Neynar Score */}
              {p.reputation.neynarScore !== null && (
                <div className="bg-[#0a1628] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-1">Farcaster Score</p>
                  <p className={`text-lg font-bold ${
                    p.reputation.neynarScore >= 0.7 ? 'text-green-400' :
                    p.reputation.neynarScore >= 0.4 ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {(p.reputation.neynarScore * 100).toFixed(0)}
                  </p>
                  <p className="text-[9px] text-gray-600">Neynar quality</p>
                </div>
              )}

              {/* OpenRank */}
              {p.reputation.openRank && (
                <div className="bg-[#0a1628] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-1">OpenRank</p>
                  <p className="text-lg font-bold text-purple-400">
                    #{p.reputation.openRank.rank.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-gray-600">Engagement rank</p>
                </div>
              )}

              {/* Coinbase Verified */}
              {p.reputation.coinbaseVerified && (
                <div className="bg-[#0a1628] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-1">Coinbase</p>
                  <p className="text-lg font-bold text-blue-400">Verified</p>
                  <p className="text-[9px] text-gray-600">On-chain ID (Base)</p>
                </div>
              )}

              {/* EAS Attestations */}
              {p.reputation.easAttestationCount > 0 && (
                <div className="bg-[#0a1628] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-1">Attestations</p>
                  <p className="text-lg font-bold text-[#f5a623]">{p.reputation.easAttestationCount}</p>
                  <p className="text-[9px] text-gray-600">EAS on Optimism</p>
                </div>
              )}

              {/* GitHub */}
              {p.reputation.github && (
                <a
                  href={`https://github.com/${p.reputation.github.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0a1628] rounded-lg p-3 hover:bg-white/5 transition-colors"
                >
                  <p className="text-[10px] text-gray-500 mb-1">GitHub</p>
                  <p className="text-sm font-bold text-white">{p.reputation.github.repos} repos</p>
                  <p className="text-[9px] text-gray-600">{p.reputation.github.followers} followers · @{p.reputation.github.username}</p>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ENS On-Chain Profile */}
        {p.ensProfile && Object.keys(p.ensProfile).length > 0 && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">ENS Profile</p>
              {p.ensName && <span className="text-xs text-[#f5a623]">{p.ensName}</span>}
            </div>
            {p.ensProfile.description && (
              <p className="text-sm text-gray-400 mb-3">{p.ensProfile.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {p.ensProfile['com.twitter'] && (
                <a href={`https://x.com/${p.ensProfile['com.twitter']}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 transition-colors">
                  X: @{p.ensProfile['com.twitter']}
                </a>
              )}
              {p.ensProfile['com.github'] && (
                <a href={`https://github.com/${p.ensProfile['com.github']}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-300 text-xs hover:bg-gray-500/20 transition-colors">
                  GitHub: {p.ensProfile['com.github']}
                </a>
              )}
              {p.ensProfile['com.discord'] && (
                <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs">
                  Discord: {p.ensProfile['com.discord']}
                </span>
              )}
              {p.ensProfile.url && (
                <a href={p.ensProfile.url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#f5a623]/10 text-[#f5a623] text-xs hover:bg-[#f5a623]/20 transition-colors">
                  {p.ensProfile.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
              {p.ensProfile.email && (
                <a href={`mailto:${p.ensProfile.email}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
                  {p.ensProfile.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Fractal History */}
        {p.fractalHistory.length > 0 && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Fractal History ({p.fractalHistory.length} sessions)
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {p.fractalHistory.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-[#0a1628] rounded">
                  <span className={`w-6 font-bold flex-shrink-0 ${
                    h.rank === 1 ? 'text-yellow-400' :
                    h.rank === 2 ? 'text-gray-300' :
                    h.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    #{h.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-300 truncate block">{h.sessionName}</span>
                    <span className="text-[10px] text-gray-600">
                      {h.sessionDate || ''}{h.participants ? ` · ${h.participants}p` : ''}
                    </span>
                  </div>
                  <span className="font-mono text-[#f5a623] flex-shrink-0">{h.score}</span>
                  {h.source === 'ordao' && (
                    <span className="text-[10px] px-1 rounded bg-[#f5a623]/10 text-[#f5a623] flex-shrink-0">on-chain</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-fractal events */}
        {p.events.length > 0 && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Contributions</p>
            <div className="space-y-1">
              {p.events.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-[#0a1628] rounded">
                  <span className="text-[10px] text-gray-600 w-16 flex-shrink-0">{e.date || '—'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 capitalize flex-shrink-0">{e.type}</span>
                  <span className="flex-1 text-gray-400 truncate">{e.description || e.type}</span>
                  <span className="font-mono text-green-400 flex-shrink-0">+{e.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {p.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500 text-[10px]">{tag}</span>
            ))}
          </div>
        )}

        {/* Profile completeness */}
        {(() => {
          const missing: string[] = [];
          if (!p.bio && !p.artistProfile?.biography) missing.push('Bio');
          if (!p.ensName) missing.push('ENS name');
          if (!Object.values(p.platforms).some(Boolean)) missing.push('Social platforms');
          if (!p.respect) missing.push('Respect (join fractal calls!)');
          if (!p.zid) missing.push('ZID number');
          if (!p.pfpUrl) missing.push('Profile picture');

          if (missing.length === 0) return null;

          const completeness = Math.round(((6 - missing.length) / 6) * 100);

          return (
            <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Profile Completeness</p>
                <span className={`text-xs font-bold ${completeness >= 80 ? 'text-green-400' : completeness >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {completeness}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${completeness >= 80 ? 'bg-green-500' : completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    Missing: {m}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-800/50">
          <p className="text-[10px] text-gray-600">
            ZAO OS · <Link href="/" className="text-[#f5a623] hover:underline">zaoos.com</Link> · Powered by Farcaster
          </p>
        </div>
      </div>
    </div>
  );
}
