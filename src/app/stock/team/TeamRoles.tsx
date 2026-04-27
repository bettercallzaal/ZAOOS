'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { slugify, parseLinks, type ParsedLink } from '@/lib/stock/members';
import { HelpIcon } from './HelpIcon';

interface Member {
  id: string;
  name: string;
  role: string;
  scope: string;
  secondary_scope?: string;
  bio?: string;
  links?: string;
  photo_url?: string;
  status_text?: string;
  skills?: string;
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

const ALL_SCOPES = ['', 'ops', 'music', 'finance', 'design'];

function pickReachOutLink(links: ParsedLink[]): ParsedLink | null {
  // Prefer X handle, then Farcaster, then email, then any link.
  return (
    links.find((l) => /x\.com|twitter\.com/i.test(l.href)) ||
    links.find((l) => /farcaster|warpcast/i.test(l.href)) ||
    links.find((l) => l.href.startsWith('mailto:')) ||
    links[0] ||
    null
  );
}

export function TeamRoles({ members }: { members: Member[] }) {
  const [query, setQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (scopeFilter && m.scope !== scopeFilter) return false;
      if (!q) return true;
      const haystack = `${m.name} ${m.bio ?? ''} ${m.links ?? ''} ${m.scope ?? ''} ${m.role ?? ''} ${m.status_text ?? ''} ${m.skills ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [members, query, scopeFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
          Team
          <HelpIcon section="directory" />
        </h2>
        <span className="text-[11px] text-gray-500">{filtered.length} of {members.length}</span>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, bio, link..."
          className="flex-1 min-w-[160px] bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/40"
        />
        <div className="flex gap-1 flex-wrap">
          {ALL_SCOPES.map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setScopeFilter(s)}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                scopeFilter === s
                  ? 'bg-[#f5a623]/15 border-[#f5a623]/50 text-[#f5a623]'
                  : 'bg-[#0a1628] border-white/[0.08] text-gray-400 hover:border-white/20'
              }`}
            >
              {s ? SCOPE_LABEL[s] || s : 'All'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Each teammate edits their own profile from the Home tab. Click a name for the public profile, or hit &ldquo;Reach out&rdquo; to ping them.
      </p>

      {filtered.length === 0 ? (
        <div className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-6 text-center">
          <p className="text-sm text-gray-500">No teammates match.</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setScopeFilter(''); }}
            className="text-[11px] text-[#f5a623] hover:underline mt-1"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member: m }: { member: Member }) {
  const [photoBroken, setPhotoBroken] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const showPhoto = m.photo_url && m.photo_url.trim() && !photoBroken;
  const initials = m.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const slug = slugify(m.name);
  const parsedLinks = m.links && m.links.trim() ? parseLinks(m.links) : [];
  const reachOut = pickReachOutLink(parsedLinks);

  async function copyShare() {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/stock/team/m/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      window.prompt('Copy this URL:', url);
    }
  }

  return (
    <div className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 flex items-start gap-3">
      {showPhoto ? (
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
          {m.scope && m.scope.trim() && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${SCOPE_COLOR[m.scope] || 'border-gray-600 text-gray-400'}`}>
              {SCOPE_LABEL[m.scope] || m.scope}
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
            {ROLE_LABEL[m.role] || m.role}
          </span>
        </div>

        {m.status_text && m.status_text.trim() && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span className="truncate">{m.status_text}</span>
          </div>
        )}

        {m.bio && m.bio.trim() ? (
          <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed line-clamp-3">{m.bio}</p>
        ) : (
          <p className="text-[11px] text-gray-600 italic">No bio yet.</p>
        )}

        {m.skills && m.skills.trim() && (
          <div className="flex flex-wrap gap-1">
            {m.skills.split(/[,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 6).map((s, i) => (
              <span
                key={i}
                className="text-[10px] bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-full px-2 py-0.5 text-[#fbbf24]"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {parsedLinks.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {parsedLinks.slice(0, 5).map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#f5a623] hover:text-[#ffd700] underline break-all"
              >
                {l.display}
              </a>
            ))}
            {parsedLinks.length > 5 && (
              <span className="text-[10px] text-gray-600">+{parsedLinks.length - 5} more</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {reachOut && (
            <a
              href={reachOut.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] bg-[#f5a623]/10 hover:bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30 rounded-full px-2.5 py-0.5 transition-colors"
            >
              <span aria-hidden>&rarr;</span> Reach out
            </a>
          )}
          <button
            type="button"
            onClick={copyShare}
            className="inline-flex items-center gap-1 text-[10px] bg-[#0a1628] hover:bg-white/[0.04] text-gray-300 border border-white/[0.08] rounded-full px-2.5 py-0.5 transition-colors"
          >
            {shareCopied ? 'Link copied' : 'Share profile'}
          </button>
          <Link
            href={`/stock/team/m/${slug}`}
            className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 px-1 py-0.5"
          >
            Public profile &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
