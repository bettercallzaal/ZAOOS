'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PublicMember } from '@/lib/stock/members';

const SCOPE_COLOR: Record<string, string> = {
  ops: 'border-blue-500/30',
  finance: 'border-emerald-500/30',
  design: 'border-indigo-500/30',
  music: 'border-rose-500/30',
};

const SCOPE_LABEL: Record<string, string> = {
  ops: 'Operations',
  finance: 'Finance',
  design: 'Design',
  music: 'Music',
};

const ROLE_LABEL: Record<string, string> = {
  lead: 'Lead',
  '2nd': '2nd',
  member: 'Member',
};

const SCOPE_ORDER = ['ops', 'design', 'music', 'finance'];

export function PublicTeamGrid({ members }: { members: PublicMember[] }) {
  const byScope: Record<string, PublicMember[]> = {};
  for (const m of members) {
    if (!byScope[m.scope]) byScope[m.scope] = [];
    byScope[m.scope].push(m);
  }
  for (const s of Object.keys(byScope)) {
    byScope[s].sort((a, b) => {
      const rank = (r: string) => (r === 'lead' ? 0 : r === '2nd' ? 1 : 2);
      return rank(a.role) - rank(b.role);
    });
  }

  const orderedScopes = SCOPE_ORDER.filter((s) => byScope[s] && byScope[s].length > 0);

  return (
    <div className="space-y-4">
      {orderedScopes.map((scope) => (
        <div key={scope} className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="bg-gradient-to-r from-[#f5a623]/15 to-transparent px-4 py-2.5">
            <span className="font-bold text-sm text-[#f5a623]">{SCOPE_LABEL[scope] || scope}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3">
            {byScope[scope].map((m) => (
              <MemberTile key={m.id} member={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberTile({ member }: { member: PublicMember }) {
  const [photoBroken, setPhotoBroken] = useState(false);
  const showPhoto = member.photo_url && !photoBroken;
  const initials = member.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/stock/team/m/${member.slug}`}
      className={`flex items-center gap-3 p-3 rounded-lg bg-[#0a1628] border ${SCOPE_COLOR[member.scope] || 'border-white/[0.08]'} hover:bg-[#0a1628]/80 transition-colors`}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photo_url}
          alt={member.name}
          onError={() => setPhotoBroken(true)}
          className="w-10 h-10 rounded-full object-cover border border-white/[0.06] flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#0d1b2a] border border-white/[0.06] flex-shrink-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-gray-500">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.name}</p>
        <p className="text-[10px] text-gray-500 truncate">
          {ROLE_LABEL[member.role] || member.role}
        </p>
      </div>
    </Link>
  );
}
