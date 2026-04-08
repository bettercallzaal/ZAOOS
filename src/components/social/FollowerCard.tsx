'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { OGBadge } from '@/components/badges/OGBadge';
import { muteUserAction, blockUserAction } from '@/lib/farcaster/neynarActions';

export interface FollowerUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile?: { bio?: { text?: string } };
  follower_count: number;
  following_count: number;
  power_badge: boolean;
  active_status?: 'active' | 'inactive';
  isZaoMember?: boolean;
  zid?: number | null;
  viewer_context?: {
    following: boolean;
    followed_by: boolean;
  };
  experimental?: {
    neynar_user_score?: number;
  };
}

interface FollowerCardProps {
  user: FollowerUser;
  hasSigner: boolean;
  currentFid: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function FollowerCard({ user, hasSigner, currentFid }: FollowerCardProps) {
  const isMe = user.fid === currentFid;
  const [isFollowing, setIsFollowing] = useState(user.viewer_context?.following ?? false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muteState, setMuteState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [blockState, setBlockState] = useState<'idle' | 'loading' | 'done'>('idle');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleMute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (muteState !== 'idle') return;
    setMuteState('loading');
    try {
      await muteUserAction(user.fid);
      setMuteState('done');
    } catch (err) {
      console.error('[FollowerCard] mute failed:', err);
      setMuteState('idle');
    }
  };

  const handleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (blockState !== 'idle') return;
    setBlockState('loading');
    try {
      await blockUserAction(user.fid);
      setBlockState('done');
    } catch (err) {
      console.error('[FollowerCard] block failed:', err);
      setBlockState('idle');
    }
  };

  const isMutual = isFollowing && user.viewer_context?.followed_by;
  const followsYou = !isMe && user.viewer_context?.followed_by && !isFollowing;

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasSigner || isMe || loading) return;

    const prev = isFollowing;
    setIsFollowing(!prev);
    setLoading(true);

    try {
      const res = await fetch('/api/users/follow', {
        method: prev ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFid: user.fid }),
      });
      if (!res.ok) {
        setIsFollowing(prev);
      }
    } catch (err) {
      console.error('[FollowerCard] follow toggle failed:', err);
      setIsFollowing(prev);
    } finally {
      setLoading(false);
    }
  };

  const bio = user.profile?.bio?.text || '';

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
      {/* PFP with relationship ring */}
      <div className="relative flex-shrink-0">
        {user.pfp_url ? (
          <div className={`w-10 h-10 relative rounded-full ${isMutual ? 'ring-2 ring-green-500/50' : ''}`}>
            <Image
              src={user.pfp_url}
              alt={user.display_name}
              fill
              className="rounded-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700" />
        )}
        {user.isZaoMember && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#f5a623] rounded-full flex items-center justify-center border-2 border-[#0a1628]">
            <span className="text-[7px] font-black text-black">Z</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{user.display_name}</span>
          {user.power_badge && (
            <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
            </svg>
          )}
          <OGBadge zid={user.zid} />
          {isMutual && (
            <span className="text-[9px] font-bold bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
              Mutual
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">@{user.username}</span>
          {followsYou && (
            <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">Follows you</span>
          )}
        </div>
        {bio && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{bio}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px] text-gray-600">{formatCount(user.follower_count)} followers</span>
          <span className="text-[11px] text-gray-600">{formatCount(user.following_count)} following</span>
          {user.active_status === 'inactive' && (
            <span className="text-[10px] text-red-400/70 bg-red-400/10 px-1.5 py-0.5 rounded">Inactive</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!isMe && (
        <div className="flex items-center gap-1 flex-shrink-0 mt-1">
          {/* Direct Cast intent link */}
          <a
            href={`https://farcaster.xyz/~/inbox/create/${user.fid}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-500 hover:text-[#f5a623] transition-colors rounded-lg hover:bg-white/[0.05]"
            title="Direct Cast"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </a>

          {/* Follow button */}
          {hasSigner && (
            <button
              onClick={handleToggleFollow}
              disabled={loading}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isFollowing
                  ? 'bg-gray-800 text-gray-300 hover:bg-red-900/30 hover:text-red-400'
                  : 'bg-[#f5a623] text-black hover:bg-[#ffd700]'
              } disabled:opacity-50`}
            >
              {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/[0.05]"
              title="More options"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-[#0f1e35] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={handleMute}
                  disabled={muteState !== 'idle'}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/[0.06] transition-colors disabled:opacity-60"
                >
                  {muteState === 'loading' ? 'Muting...' : muteState === 'done' ? 'Muted' : 'Mute'}
                </button>
                <button
                  onClick={handleBlock}
                  disabled={blockState !== 'idle'}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-60"
                >
                  {blockState === 'loading' ? 'Blocking...' : blockState === 'done' ? 'Blocked' : 'Block'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
