'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MemberNode {
  fid: number;
  displayName: string;
  username: string;
  pfpUrl: string | null;
  zid: number | null;
  followerCount: number;
  followingCount: number;
  communityFollowers: number;
  communityFollowing: number;
  mutuals: number;
}

interface Connection {
  from: number;
  to: number;
}

interface GraphStats {
  totalMembers: number;
  totalConnections: number;
  density: number;
  mostConnected: { fid: number; displayName: string; mutuals: number }[];
  disconnectedCount: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type SortMode = 'mutuals' | 'communityFollowers' | 'followerCount' | 'zid';

export function CommunityGraph() {
  const [members, setMembers] = useState<MemberNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [currentFid, setCurrentFid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('mutuals');

  useEffect(() => {
    fetch('/api/social/community-graph')
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => {
        setMembers(data.members || []);
        setConnections(data.connections || []);
        setStats(data.stats || null);
        setCurrentFid(data.currentFid || null);
      })
      .catch(() => setError('Failed to load community graph'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...members].sort((a, b) => {
    if (sortMode === 'mutuals') return b.mutuals - a.mutuals;
    if (sortMode === 'communityFollowers') return b.communityFollowers - a.communityFollowers;
    if (sortMode === 'followerCount') return b.followerCount - a.followerCount;
    if (sortMode === 'zid') return (a.zid || 999) - (b.zid || 999);
    return 0;
  });

  const selectedNode = selectedMember ? members.find((m) => m.fid === selectedMember) : null;
  const selectedConnections = selectedMember
    ? {
        follows: connections.filter((c) => c.from === selectedMember).map((c) => c.to),
        followedBy: connections.filter((c) => c.to === selectedMember).map((c) => c.from),
      }
    : null;
  const selectedMutuals = selectedConnections
    ? selectedConnections.follows.filter((f) => selectedConnections.followedBy.includes(f))
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Building community graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1b2a] rounded-lg p-3 border border-gray-800 text-center">
            <p className="text-lg font-bold text-white">{stats.totalMembers}</p>
            <p className="text-[10px] text-gray-500">Members</p>
          </div>
          <div className="bg-[#0d1b2a] rounded-lg p-3 border border-gray-800 text-center">
            <p className="text-lg font-bold text-[#f5a623]">{stats.totalConnections}</p>
            <p className="text-[10px] text-gray-500">Connections</p>
          </div>
          <div className="bg-[#0d1b2a] rounded-lg p-3 border border-gray-800 text-center">
            <p className="text-lg font-bold text-white">{stats.density}%</p>
            <p className="text-[10px] text-gray-500">Density</p>
          </div>
        </div>
      )}

      {/* Most Connected */}
      {stats?.mostConnected && stats.mostConnected.length > 0 && (
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Most Connected</p>
          <div className="space-y-1.5">
            {stats.mostConnected.map((m, i) => (
              <div key={m.fid} className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 w-4 text-right">{i + 1}.</span>
                <span className="text-white font-medium truncate flex-1">{m.displayName}</span>
                <span className="text-xs text-[#f5a623]">{m.mutuals} mutuals</span>
              </div>
            ))}
          </div>
          {(stats.disconnectedCount ?? 0) > 0 && (
            <p className="text-[10px] text-gray-600 mt-2">
              {stats.disconnectedCount} member{stats.disconnectedCount > 1 ? 's' : ''} not connected to anyone
            </p>
          )}
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'mutuals' as SortMode, label: 'Mutuals' },
          { key: 'communityFollowers' as SortMode, label: 'Community Followers' },
          { key: 'followerCount' as SortMode, label: 'Total Followers' },
          { key: 'zid' as SortMode, label: 'ZID' },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSortMode(s.key)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
              sortMode === s.key
                ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Member Grid */}
      <div className="space-y-1">
        {sorted.map((member) => {
          const isSelected = selectedMember === member.fid;
          const isMe = member.fid === currentFid;
          const isHighlighted = selectedMember
            ? selectedConnections?.follows.includes(member.fid) ||
              selectedConnections?.followedBy.includes(member.fid)
            : false;
          const isMutual = selectedMember ? selectedMutuals.includes(member.fid) : false;

          return (
            <button
              key={member.fid}
              onClick={() => setSelectedMember(isSelected ? null : member.fid)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                isSelected
                  ? 'bg-[#f5a623]/10 border border-[#f5a623]/30'
                  : isHighlighted
                  ? isMutual
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                  : selectedMember
                  ? 'opacity-30 border border-transparent'
                  : 'hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              {/* PFP */}
              {member.pfpUrl ? (
                <div className="w-9 h-9 flex-shrink-0 relative">
                  <Image
                    src={member.pfpUrl}
                    alt=""
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white truncate">
                    {member.displayName}
                  </span>
                  {member.zid && (
                    <span className="text-[9px] font-bold bg-[#f5a623]/20 text-[#f5a623] px-1 py-0.5 rounded-full">
                      #{member.zid}
                    </span>
                  )}
                  {isMe && (
                    <span className="text-[9px] bg-white/10 text-gray-400 px-1 py-0.5 rounded">you</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">@{member.username}</span>
              </div>

              {/* Connection stats */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-2 text-[11px]">
                  {member.mutuals > 0 && (
                    <span className="text-green-400" title="Mutual follows in community">
                      {member.mutuals} mutual{member.mutuals > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-gray-600">{formatCount(member.followerCount)}</span>
                </div>
                {isHighlighted && selectedMember && (
                  <span className={`text-[10px] ${isMutual ? 'text-green-400' : 'text-blue-400'}`}>
                    {isMutual ? 'Mutual' : selectedConnections?.follows.includes(member.fid) ? 'Follows' : 'Follower'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Member Detail */}
      {selectedNode && selectedConnections && (
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-[#f5a623]/30 space-y-3">
          <div className="flex items-center gap-3">
            {selectedNode.pfpUrl && (
              <div className="w-10 h-10 relative flex-shrink-0">
                <Image src={selectedNode.pfpUrl} alt="" fill className="rounded-full object-cover" unoptimized />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{selectedNode.displayName}</p>
              <p className="text-xs text-gray-500">@{selectedNode.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-bold text-green-400">{selectedMutuals.length}</p>
              <p className="text-[10px] text-gray-500">Mutuals</p>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-400">{selectedConnections.follows.length}</p>
              <p className="text-[10px] text-gray-500">Follows</p>
            </div>
            <div>
              <p className="text-sm font-bold text-purple-400">{selectedConnections.followedBy.length}</p>
              <p className="text-[10px] text-gray-500">Followers</p>
            </div>
          </div>

          {selectedMutuals.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Mutual with</p>
              <div className="flex flex-wrap gap-1">
                {selectedMutuals.map((fid) => {
                  const m = members.find((n) => n.fid === fid);
                  return m ? (
                    <span key={fid} className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                      {m.displayName}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
