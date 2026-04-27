'use client';

import Link from 'next/link';
import { slugify } from '@/lib/stock/members';
import { HelpIcon } from './HelpIcon';

interface Member {
  id: string;
  name: string;
  role: string;
  scope: string;
  bio?: string;
  links?: string;
  photo_url?: string;
  status_text?: string;
}

interface Props {
  members: Member[];
  currentMemberId: string;
}

function completeness(m: Member): number {
  let pct = 0;
  if ((m.bio ?? '').trim().length >= 30) pct += 40;
  else if ((m.bio ?? '').trim().length > 0) pct += 20;
  if ((m.photo_url ?? '').trim().length > 0) pct += 30;
  if ((m.scope ?? '').trim().length > 0 || m.role === 'advisory') pct += 20;
  if ((m.links ?? '').trim().length > 0) pct += 10;
  return pct;
}

export function CompletenessLeaderboard({ members, currentMemberId }: Props) {
  const ranked = members
    .map((m) => ({ ...m, pct: completeness(m) }))
    .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));

  const top = ranked.slice(0, 5);
  const myRank = ranked.findIndex((m) => m.id === currentMemberId);
  const me = ranked.find((m) => m.id === currentMemberId);

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Most-complete profiles</p>
          <HelpIcon section="leaderboard" />
        </div>
        {me && (
          <span className="text-[10px] text-gray-500">
            You: <span className="text-white font-bold">#{myRank + 1}</span> ({me.pct}%)
          </span>
        )}
      </div>

      <ol className="space-y-1.5">
        {top.map((m, i) => {
          const isYou = m.id === currentMemberId;
          const medal = i === 0 ? '🏆' : i === 1 ? '·' : i === 2 ? '·' : '·';
          return (
            <li key={m.id}>
              <Link
                href={`/stock/team/m/${slugify(m.name)}`}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  isYou
                    ? 'bg-[#f5a623]/10 border border-[#f5a623]/30'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-gray-500 font-mono w-4 text-right" aria-hidden>
                    {i === 0 ? medal : `${i + 1}.`}
                  </span>
                  <span className={`text-xs font-medium truncate ${isYou ? 'text-[#f5a623]' : 'text-white'}`}>
                    {m.name}{isYou ? ' (you)' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="h-1 w-12 bg-[#0a1628] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.pct === 100 ? 'bg-emerald-400' : 'bg-[#f5a623]'}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold w-9 text-right ${
                    m.pct === 100 ? 'text-emerald-400' : m.pct >= 60 ? 'text-amber-300' : 'text-gray-500'
                  }`}>
                    {m.pct}%
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {me && myRank >= top.length && (
        <div className="pt-2 border-t border-white/[0.04]">
          <Link
            href={`/stock/team/m/${slugify(me.name)}`}
            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/30"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-gray-500 font-mono w-4 text-right">{myRank + 1}.</span>
              <span className="text-xs font-medium text-[#f5a623]">You</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-1 w-12 bg-[#0a1628] rounded-full overflow-hidden">
                <div
                  className={`h-full ${me.pct === 100 ? 'bg-emerald-400' : 'bg-[#f5a623]'}`}
                  style={{ width: `${me.pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold w-9 text-right ${
                me.pct === 100 ? 'text-emerald-400' : me.pct >= 60 ? 'text-amber-300' : 'text-gray-500'
              }`}>
                {me.pct}%
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
