'use client';

import { useState } from 'react';
import { parseLinks, type PublicMember } from '@/lib/stock/members';

interface Props {
  member: PublicMember;
}

export function MemberProfileView({ member }: Props) {
  const publicLabel = member.role === 'lead' ? 'Team lead'
    : member.role === 'advisory' ? 'Advisor'
    : 'Team member';
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
            <span className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
              {publicLabel}
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
          <ul className="space-y-1">
            {parseLinks(member.links).map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#f5a623] hover:text-[#ffd700] underline break-all"
                >
                  {l.display}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
