'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SpotlightMember {
  fid: number;
  displayName: string;
  username: string;
  pfpUrl: string | null;
  bio: string | null;
  location: string | null;
  respect: { total: number } | null;
  lastActiveAt: string | null;
}

export function MemberSpotlight() {
  const [member, setMember] = useState<SpotlightMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/social/spotlight', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!controller.signal.aborted && data?.member) setMember(data.member);
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="mx-4 my-3 rounded-xl bg-white/[0.03] border border-[#f5a623]/20 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-800" />
          <div className="flex-1">
            <div className="h-4 bg-gray-800 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!member) return null;

  const daysAgo = member.lastActiveAt
    ? Math.floor((Date.now() - new Date(member.lastActiveAt).getTime()) / 86400000)
    : null;

  return (
    <div className="mx-4 my-3 rounded-xl bg-white/[0.03] border border-[#f5a623]/20 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[#f5a623] text-xs font-semibold uppercase tracking-wider">Member of the Day</span>
        <svg className="w-3.5 h-3.5 text-[#f5a623]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <div className="flex items-center gap-3">
        {member.pfpUrl ? (
          <img src={member.pfpUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-[#f5a623]/30" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#f5a623]/20 flex items-center justify-center text-[#f5a623] font-bold">
            {member.displayName?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{member.displayName}</p>
          <p className="text-xs text-gray-500 truncate">@{member.username}</p>
          {member.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{member.bio}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500 uppercase tracking-wider">
        {member.respect && <span className="text-[#f5a623]">{member.respect.total.toLocaleString()} Respect</span>}
        {member.location && <span>{member.location}</span>}
        {daysAgo !== null && daysAgo <= 7 && <span className="text-green-500">Active recently</span>}
        <Link href={`/members/${member.username || member.fid}`} className="ml-auto text-[#f5a623] hover:underline text-xs normal-case">
          View Profile
        </Link>
      </div>
    </div>
  );
}
