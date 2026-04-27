'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
          {member.status_text && member.status_text.trim() && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
              <span aria-hidden className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>{member.status_text}</span>
            </div>
          )}
        </div>
      </div>

      {member.bio && member.bio.trim() ? (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Bio</p>
          <div className="bio-rendered text-sm text-gray-200 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{member.bio}</ReactMarkdown>
          </div>
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
      <style>{`
        .bio-rendered p { margin-bottom: 0.75rem; }
        .bio-rendered p:last-child { margin-bottom: 0; }
        .bio-rendered h1, .bio-rendered h2, .bio-rendered h3 {
          color: #f5a623; font-weight: 700; margin: 1rem 0 0.5rem;
        }
        .bio-rendered h1 { font-size: 1.15rem; }
        .bio-rendered h2 { font-size: 1rem; }
        .bio-rendered h3 { font-size: 0.9rem; }
        .bio-rendered ul, .bio-rendered ol { margin: 0.5rem 0 0.75rem 1.4rem; }
        .bio-rendered ul { list-style: disc; }
        .bio-rendered ol { list-style: decimal; }
        .bio-rendered li { margin-bottom: 0.25rem; }
        .bio-rendered strong { color: #fff; font-weight: 700; }
        .bio-rendered em { color: #fbbf24; font-style: italic; }
        .bio-rendered a { color: #f5a623; text-decoration: underline; }
        .bio-rendered code {
          background: #0a1628; padding: 1px 5px; border-radius: 3px;
          font-size: 0.85em; color: #c7d2fe;
        }
        .bio-rendered blockquote {
          border-left: 2px solid rgba(245, 166, 35, 0.5);
          padding-left: 0.75rem; margin: 0.5rem 0;
          color: #cbd5e1; font-style: italic;
        }
        .bio-rendered hr {
          border: 0; border-top: 1px solid rgba(255,255,255,0.1);
          margin: 1rem 0;
        }
      `}</style>
    </section>
  );
}
