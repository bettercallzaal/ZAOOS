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
  fractalHistory: { sessionName: string; sessionDate: string | null; era: string; rank: number; score: number; participants: number; source: string }[];
  events: { type: string; amount: number; description: string | null; date: string | null }[];
  lastActiveAt: string | null;
  createdAt: string;
}

function shortAddr(addr: string) {
  return addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr;
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-800 flex-shrink-0">
            {p.pfpUrl ? (
              <Image src={p.pfpUrl} alt="" fill className="object-cover" sizes="80px" />
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
              {p.social?.powerBadge && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">Power Badge</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 flex-wrap">
              {p.username && <span>@{p.username}</span>}
              {p.ensName && <span className="text-[#f5a623]">{p.ensName}</span>}
              {displayWallet && <span className="font-mono text-xs">{shortAddr(displayWallet)}</span>}
            </div>
            {p.bio && <p className="text-sm text-gray-400 mt-2 line-clamp-3">{p.bio}</p>}
            {p.artistProfile?.biography && !p.bio && (
              <p className="text-sm text-gray-400 mt-2 line-clamp-3">{p.artistProfile.biography}</p>
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

        {/* Respect stats */}
        {p.respect && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Respect</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-[#f5a623]">{p.respect.total}</p>
                <p className="text-[10px] text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{p.respect.fractalCount}</p>
                <p className="text-[10px] text-gray-500">Fractals</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {p.respect.onchainOG > 0 || p.respect.onchainZOR > 0
                    ? `${p.respect.onchainOG + p.respect.onchainZOR}`
                    : '0'}
                </p>
                <p className="text-[10px] text-gray-500">On-chain</p>
              </div>
            </div>
            {p.respect.firstRespectAt && (
              <p className="text-[10px] text-gray-600 mt-2 text-center">
                Member since {p.respect.firstRespectAt}
              </p>
            )}
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
              {p.artistProfile?.website && (
                <a href={p.artistProfile.website} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#f5a623]/10 text-[#f5a623] text-xs hover:bg-[#f5a623]/20 transition-colors">
                  Website
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
