'use client';

import { useState } from 'react';
import Link from 'next/link';
import { slugify } from '@/lib/stock/members';

interface Member {
  id: string;
  name: string;
  role: string;
  scope: string;
  bio?: string;
  links?: string;
  photo_url?: string;
}

const SCOPE_LABEL: Record<string, string> = {
  ops: 'Operations',
  finance: 'Finance',
  design: 'Design',
  music: 'Music',
};

const SCOPE_COLOR: Record<string, string> = {
  ops: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  finance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  design: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  music: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const ROLE_LABEL: Record<string, string> = {
  lead: 'Lead',
  '2nd': '2nd',
  member: 'Member',
};

export function TeamRoles({ members }: { members: Member[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Team</h2>
      <p className="text-xs text-gray-500">
        Each teammate edits their own profile from the Home tab. If yours is blank, login and add a bio + photo.
      </p>
      <div className="space-y-2">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </div>
  );
}

function MemberCard({ member: m }: { member: Member }) {
  const [photoBroken, setPhotoBroken] = useState(false);
  const showPhoto = m.photo_url && m.photo_url.trim() && !photoBroken;
  const initials = m.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const slug = slugify(m.name);

  return (
    <div className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 flex items-start gap-3">
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.photo_url}
          alt={m.name}
          onError={() => setPhotoBroken(true)}
          className="w-12 h-12 rounded-full object-cover border border-white/[0.08] flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-[#0a1628] border border-white/[0.08] flex-shrink-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-500">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/stock/team/m/${slug}`}
            className="text-sm font-medium text-white hover:text-[#f5a623] transition-colors"
          >
            {m.name}
          </Link>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${SCOPE_COLOR[m.scope] || SCOPE_COLOR.ops}`}>
            {SCOPE_LABEL[m.scope] || m.scope} - {ROLE_LABEL[m.role] || m.role}
          </span>
        </div>
        {m.bio && m.bio.trim() ? (
          <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{m.bio}</p>
        ) : (
          <p className="text-[11px] text-gray-600 italic">No bio yet.</p>
        )}
        {m.links && m.links.trim() && (
          <p className="text-[10px] text-gray-500">{m.links}</p>
        )}
        <Link
          href={`/stock/team/m/${slug}`}
          className="inline-block text-[10px] text-[#f5a623] hover:text-[#ffd700] mt-1"
        >
          Public profile: /stock/team/m/{slug} -&gt;
        </Link>
      </div>
    </div>
  );
}
