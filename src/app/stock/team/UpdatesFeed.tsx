'use client';

import Link from 'next/link';
import { slugify } from '@/lib/stock/members';
import { HelpIcon } from './HelpIcon';

export interface FeedEntry {
  id: string;
  actorName: string | null;
  actorId: string | null;
  entityType: string;
  action: string;
  fieldChanged: string | null;
  newValue: string | null;
  createdAt: string;
}

interface Props {
  entries: FeedEntry[];
  currentMemberId: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

function describe(entry: FeedEntry): string {
  const subject = entry.actorName || 'Someone';
  const action = entry.action;
  const entity = entry.entityType;
  const field = entry.fieldChanged;

  // Profile updates
  if (entity === 'team_member' || entity === 'profile') {
    if (field === 'bio') return `${subject} updated their bio`;
    if (field === 'photo_url') return `${subject} added a profile photo`;
    if (field === 'links') return `${subject} updated their links`;
    if (field === 'status_text') return `${subject} updated their status`;
    if (field === 'scope') return `${subject} picked a team`;
    return `${subject} updated their profile`;
  }

  // Common verbs
  if (entity === 'todo') {
    if (action === 'created') return `${subject} added a todo`;
    if (action === 'completed' || action === 'done') return `${subject} finished a todo`;
    if (action === 'updated') return `${subject} updated a todo`;
    return `${subject} ${action} a todo`;
  }
  if (entity === 'sponsor') return `${subject} ${action} sponsor activity`;
  if (entity === 'artist') return `${subject} ${action} artist activity`;
  if (entity === 'idea') return `${subject} dropped an idea`;
  if (entity === 'note') return `${subject} added a note`;
  if (entity === 'gemba') return `${subject} logged a standup note`;
  if (entity === 'contact_log') return `${subject} logged a contact`;

  return `${subject} ${action} ${entity}`;
}

export function UpdatesFeed({ entries, currentMemberId }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Recent activity</p>
          <HelpIcon section="updates-feed" />
        </div>
        <p className="text-xs text-gray-500 italic">
          Nothing yet. Drop a status, log a contribution, finish a todo - it all shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Recent activity</p>
          <HelpIcon section="updates-feed" />
        </div>
        <span className="text-[10px] text-gray-600">last {entries.length}</span>
      </div>

      <ul className="divide-y divide-white/[0.04]">
        {entries.map((e) => {
          const isYou = e.actorId === currentMemberId;
          const summary = describe(e);
          const linkable = e.actorId && e.actorName;
          return (
            <li key={e.id} className="py-2 flex items-start gap-2.5">
              <span aria-hidden className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#f5a623]/60 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-200 leading-relaxed">
                  {linkable && e.actorId !== currentMemberId ? (
                    <Link
                      href={`/stock/team/m/${slugify(e.actorName!)}`}
                      className="text-[#f5a623] hover:underline font-medium"
                    >
                      {e.actorName}
                    </Link>
                  ) : (
                    <span className={isYou ? 'text-[#f5a623] font-medium' : 'text-white'}>
                      {isYou ? 'You' : (e.actorName || 'Someone')}
                    </span>
                  )}
                  {' '}
                  <span className="text-gray-300">{summary.replace(/^\S+\s+/, '')}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(e.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
