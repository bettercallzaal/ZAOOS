'use client';

import { useState } from 'react';
import type { PublicMember } from '@/lib/stock/members';

const SCOPE_COLOR: Record<string, string> = {
  ops: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  finance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  design: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  music: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

interface Props {
  member: PublicMember;
  scopeLabel: string;
  roleLabel: string;
}

export function MemberProfileView({ member, scopeLabel, roleLabel }: Props) {
  const [photoBroken, setPhotoBroken] = useState(false);
  const showPhoto = member.photo_url && !photoBroken;
  const initials = member.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="bg-gradient-to-br from-[#f5a623]/10 via-transparent to-transparent rounded-2xl p-6 border border-white/[0.08] space-y-4">
      <div className="flex items-start gap-4">
        {showPhoto ? (
          <img
            src={member.photo_url}
            alt={member.name}
            onError={() => setPhotoBroken(true)}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#f5a623]/40 flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#0d1b2a] border-2 border-white/[0.08] flex-shrink-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-500">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">{member.name}</h1>
          <div className="mt-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${SCOPE_COLOR[member.scope] || SCOPE_COLOR.ops}`}>
              {scopeLabel} - {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {member.bio && member.bio.trim() ? (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Bio</p>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{member.bio}</p>
        </div>
      ) : (
        <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-lg p-4">
          <p className="text-sm text-gray-500 italic">Bio coming soon.</p>
        </div>
      )}

      {member.links && member.links.trim() && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Links</p>
          <p className="text-xs text-gray-400">{member.links}</p>
        </div>
      )}
    </section>
  );
}
