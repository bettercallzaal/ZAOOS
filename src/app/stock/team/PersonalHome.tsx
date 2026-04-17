'use client';

import { useMemo } from 'react';
import { ResearchLinks } from './ResearchLinks';

const FESTIVAL_DATE = new Date('2026-10-03T12:00:00-04:00');

interface Member { id: string; name: string; role: string; scope: string; }

interface Todo {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  notes: string;
  owner: { id: string; name: string } | null;
  creator: { id: string; name: string } | null;
  created_at: string;
}

interface Sponsor {
  id: string;
  name: string;
  track: 'local' | 'virtual' | 'ecosystem';
  status: 'lead' | 'contacted' | 'in_talks' | 'committed' | 'paid' | 'declined';
  amount_committed: number;
  amount_paid: number;
  owner: { id: string; name: string } | null;
}

interface Artist {
  id: string;
  name: string;
  genre: string;
  status: 'wishlist' | 'contacted' | 'interested' | 'confirmed' | 'declined' | 'travel_booked';
  outreach: { id: string; name: string } | null;
}

interface Milestone {
  id: string;
  title: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  category: string;
  owner: { id: string; name: string } | null;
}

interface Props {
  member: Member;
  allMembers: Member[];
  todos: Todo[];
  sponsors: Sponsor[];
  artists: Artist[];
  milestones: Milestone[];
  onNavigate: (tab: 'sponsors' | 'artists' | 'timeline' | 'overview') => void;
}

const TEAM_LABEL: Record<string, string> = {
  ops: 'Operations',
  finance: 'Finance',
  design: 'Design',
  music: 'Music',
};

const TEAM_COLOR: Record<string, string> = {
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

function daysUntil(target: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysToDue(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(date + 'T00:00:00').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function PersonalHome({ member, allMembers, todos, sponsors, artists, milestones, onNavigate }: Props) {
  const daysToFest = daysUntil(FESTIVAL_DATE);

  const myTodos = useMemo(() => todos.filter((t) => t.owner?.id === member.id), [todos, member.id]);
  const mySponsors = useMemo(() => sponsors.filter((s) => s.owner?.id === member.id), [sponsors, member.id]);
  const myArtists = useMemo(() => artists.filter((a) => a.outreach?.id === member.id), [artists, member.id]);
  const myMilestones = useMemo(() => milestones.filter((m) => m.owner?.id === member.id), [milestones, member.id]);

  const todoOpen = myTodos.filter((t) => t.status !== 'done');
  const todoInProgress = myTodos.filter((t) => t.status === 'in_progress');
  const todoDone = myTodos.filter((t) => t.status === 'done').length;

  const overdueMilestones = myMilestones.filter((m) => m.status !== 'done' && daysToDue(m.due_date) < 0);
  const upcomingMilestones = myMilestones
    .filter((m) => m.status !== 'done' && daysToDue(m.due_date) >= 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5);

  const sponsorsInPipeline = mySponsors.filter((s) => s.status !== 'declined' && s.status !== 'paid').length;
  const sponsorsPaid = mySponsors.filter((s) => s.status === 'paid').length;

  const teammates = allMembers.filter((m) => m.scope === member.scope && m.id !== member.id);

  // What should I do next? Most urgent item
  const nextAction = useMemo(() => {
    if (overdueMilestones.length > 0) {
      return { type: 'overdue', text: overdueMilestones[0].title, tab: 'timeline' as const };
    }
    if (todoInProgress.length > 0) {
      return { type: 'in_progress', text: todoInProgress[0].title, tab: 'overview' as const };
    }
    if (upcomingMilestones.length > 0 && daysToDue(upcomingMilestones[0].due_date) <= 7) {
      return { type: 'due_soon', text: upcomingMilestones[0].title, tab: 'timeline' as const };
    }
    if (todoOpen.length > 0) {
      return { type: 'todo', text: todoOpen[0].title, tab: 'overview' as const };
    }
    return null;
  }, [overdueMilestones, todoInProgress, upcomingMilestones, todoOpen]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-[#f5a623]/20 via-[#f5a623]/5 to-transparent rounded-xl p-5 border border-[#f5a623]/30">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#f5a623] uppercase tracking-wider font-bold">Welcome back</p>
            <h2 className="text-2xl font-bold text-white mt-1">{member.name}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${TEAM_COLOR[member.scope] || TEAM_COLOR.ops}`}>
                {TEAM_LABEL[member.scope] || member.scope} · {ROLE_LABEL[member.role] || member.role}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold text-[#f5a623]">{daysToFest}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">days to festival</p>
          </div>
        </div>
      </div>

      {/* Next action card */}
      {nextAction && (
        <button
          onClick={() => onNavigate(nextAction.tab)}
          className="w-full text-left bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] hover:border-[#f5a623]/40 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                {nextAction.type === 'overdue' && '⚠ Overdue - do this'}
                {nextAction.type === 'in_progress' && '▶ Continue this'}
                {nextAction.type === 'due_soon' && '◷ Due within a week'}
                {nextAction.type === 'todo' && '→ Next up'}
              </p>
              <p className="text-sm text-white mt-1 font-medium">{nextAction.text}</p>
            </div>
            <span className="text-[#f5a623] text-lg flex-shrink-0">→</span>
          </div>
        </button>
      )}

      {!nextAction && myTodos.length === 0 && mySponsors.length === 0 && myArtists.length === 0 && myMilestones.length === 0 && (
        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] text-center">
          <p className="text-sm text-gray-400">Nothing assigned to you yet.</p>
          <p className="text-xs text-gray-500 mt-2">
            Your team lead can assign you items from the Sponsors, Artists, Timeline, or Overview tabs.
          </p>
        </div>
      )}

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          onClick={() => onNavigate('overview')}
          label="Your Tasks"
          main={`${todoOpen.length}`}
          sub={`${todoInProgress.length} in progress · ${todoDone} done`}
          color="text-white"
        />
        <StatCard
          onClick={() => onNavigate('sponsors')}
          label="Your Sponsors"
          main={`${sponsorsInPipeline}`}
          sub={`${sponsorsPaid} paid · ${mySponsors.length} total`}
          color="text-emerald-400"
        />
        <StatCard
          onClick={() => onNavigate('artists')}
          label="Your Artists"
          main={`${myArtists.length}`}
          sub={myArtists.filter((a) => a.status === 'confirmed' || a.status === 'travel_booked').length + ' confirmed'}
          color="text-purple-400"
        />
        <StatCard
          onClick={() => onNavigate('timeline')}
          label="Your Milestones"
          main={`${upcomingMilestones.length}`}
          sub={overdueMilestones.length > 0 ? `${overdueMilestones.length} overdue` : 'all on track'}
          color={overdueMilestones.length > 0 ? 'text-red-400' : 'text-white'}
        />
      </div>

      {/* Your tasks - open only */}
      {todoOpen.length > 0 && (
        <Section title="Your Open Tasks" onSeeAll={() => onNavigate('overview')}>
          <div className="space-y-2">
            {todoOpen.slice(0, 5).map((t) => (
              <div key={t.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 flex items-start gap-3">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                    t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {t.status === 'in_progress' ? 'IN PROGRESS' : 'TODO'}
                </span>
                <p className="text-sm text-white flex-1 min-w-0">{t.title}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming milestones */}
      {(upcomingMilestones.length > 0 || overdueMilestones.length > 0) && (
        <Section title="Your Upcoming" onSeeAll={() => onNavigate('timeline')}>
          <div className="space-y-2">
            {overdueMilestones.slice(0, 3).map((m) => (
              <MilestoneRow key={m.id} milestone={m} overdue />
            ))}
            {upcomingMilestones.slice(0, 5 - overdueMilestones.slice(0, 3).length).map((m) => (
              <MilestoneRow key={m.id} milestone={m} />
            ))}
          </div>
        </Section>
      )}

      {/* Your sponsors preview */}
      {mySponsors.length > 0 && (
        <Section title="Your Sponsors" onSeeAll={() => onNavigate('sponsors')}>
          <div className="space-y-2">
            {mySponsors.slice(0, 4).map((s) => (
              <div key={s.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{s.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{s.track}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
                  {s.status}
                </span>
                {Number(s.amount_committed) > 0 && (
                  <span className="text-xs text-amber-400">${Number(s.amount_committed).toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Your artists preview */}
      {myArtists.length > 0 && (
        <Section title="Your Artist Outreach" onSeeAll={() => onNavigate('artists')}>
          <div className="space-y-2">
            {myArtists.slice(0, 4).map((a) => (
              <div key={a.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{a.name}</p>
                  {a.genre && <p className="text-[10px] text-gray-500">{a.genre}</p>}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
                  {a.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Your team */}
      {teammates.length > 0 && (
        <Section title={`Your ${TEAM_LABEL[member.scope] || member.scope} Teammates`}>
          <div className="flex flex-wrap gap-2">
            {teammates.map((t) => (
              <span
                key={t.id}
                className="text-xs bg-[#0d1b2a] border border-white/[0.06] rounded-full px-3 py-1.5 text-gray-300"
              >
                {t.name} <span className="text-[10px] text-gray-500">· {ROLE_LABEL[t.role] || t.role}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Research library */}
      <ResearchLinks scope={member.scope} />
    </div>
  );
}

function StatCard({
  label,
  main,
  sub,
  color,
  onClick,
}: {
  label: string;
  main: string;
  sub: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] hover:border-white/[0.12] transition-colors text-left"
    >
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{main}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
    </button>
  );
}

function Section({
  title,
  children,
  onSeeAll,
}: {
  title: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-[10px] text-[#f5a623] hover:text-[#ffd700]">
            See all →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function MilestoneRow({ milestone, overdue }: { milestone: Milestone; overdue?: boolean }) {
  const days = daysToDue(milestone.due_date);
  return (
    <div
      className={`bg-[#0d1b2a] rounded-lg border p-3 flex items-center gap-3 ${
        overdue ? 'border-red-500/40' : 'border-white/[0.06]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{milestone.title}</p>
        <p className={`text-[10px] mt-0.5 ${overdue ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
          {new Date(milestone.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' · '}
          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'today' : `${days}d away`}
          {' · '}
          <span className="uppercase">{milestone.category}</span>
        </p>
      </div>
    </div>
  );
}
