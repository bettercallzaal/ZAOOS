'use client';

import { useState } from 'react';
import { GoalsBoard } from './GoalsBoard';
import { TodoList } from './TodoList';
import { TeamRoles } from './TeamRoles';
import { SponsorCRM } from './SponsorCRM';
import { ArtistPipeline } from './ArtistPipeline';
import { Timeline } from './Timeline';
import { VolunteerRoster } from './VolunteerRoster';
import { BudgetTracker } from './BudgetTracker';
import { MeetingNotes } from './MeetingNotes';
import { PersonalHome } from './PersonalHome';
import { OnboardingModal } from './OnboardingModal';
import { SnapshotButton } from './SnapshotButton';
import { useRouter } from 'next/navigation';

type Tab = 'home' | 'overview' | 'sponsors' | 'artists' | 'timeline' | 'volunteers' | 'budget' | 'notes' | 'team';

interface Sponsor {
  id: string;
  name: string;
  track: 'local' | 'virtual' | 'ecosystem';
  status: 'lead' | 'contacted' | 'in_talks' | 'committed' | 'paid' | 'declined';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  amount_committed: number;
  amount_paid: number;
  why_them: string;
  notes: string;
  owner: { id: string; name: string } | null;
  last_contacted_at: string | null;
  created_at: string;
}

interface Artist {
  id: string;
  name: string;
  genre: string;
  city: string;
  status: 'wishlist' | 'contacted' | 'interested' | 'confirmed' | 'declined' | 'travel_booked';
  socials: string;
  travel_from: string;
  needs_travel: boolean;
  set_time_minutes: number;
  set_order: number | null;
  fee: number;
  rider: string;
  notes: string;
  outreach: { id: string; name: string } | null;
  created_at: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  category: string;
  notes: string;
  owner: { id: string; name: string } | null;
  created_at: string;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'setup' | 'checkin' | 'water' | 'safety' | 'teardown' | 'floater' | 'content' | 'unassigned';
  shift: 'early' | 'block1' | 'block2' | 'teardown' | 'allday';
  confirmed: boolean;
  notes: string;
  recruited_by_member: { id: string; name: string } | null;
  created_at: string;
}

interface BudgetEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  status: 'projected' | 'committed' | 'actual';
  date: string | null;
  notes: string;
  related_sponsor: { id: string; name: string } | null;
  created_at: string;
}

interface Note {
  id: string;
  meeting_date: string;
  title: string;
  attendees: string[];
  notes: string;
  action_items: string;
  creator: { id: string; name: string } | null;
  created_at: string;
}

interface Props {
  memberName: string;
  memberId: string;
  goals: Array<{ id: string; title: string; status: 'locked' | 'wip' | 'tbd'; details: string; category: string; sort_order: number }>;
  todos: Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done'; notes: string; owner: { id: string; name: string } | null; creator: { id: string; name: string } | null; created_at: string }>;
  members: Array<{ id: string; name: string; role: string; scope: string; bio?: string; links?: string; photo_url?: string }>;
  sponsors: Sponsor[];
  artists: Artist[];
  milestones: Milestone[];
  volunteers: Volunteer[];
  budget: BudgetEntry[];
  meetingNotes: Note[];
}

export function Dashboard({
  memberName,
  memberId,
  goals,
  todos,
  members,
  sponsors,
  artists,
  milestones,
  volunteers,
  budget,
  meetingNotes,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');

  async function handleLogout() {
    await fetch('/api/stock/team/logout', { method: 'POST' });
    router.refresh();
  }

  const memberList = members.map((m) => ({ id: m.id, name: m.name }));
  const currentMember = members.find((m) => m.id === memberId) || { id: memberId, name: memberName, role: 'member', scope: 'ops' };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <OnboardingModal memberName={memberName} />
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">ZAOstock Team</h1>
            <p className="text-xs text-gray-400">October 3, 2026 - Ellsworth, ME</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#f5a623] font-medium">{memberName}</span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300">
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          <TabButton active={tab === 'home'} onClick={() => setTab('home')}>Home</TabButton>
          <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabButton>
          <TabButton active={tab === 'sponsors'} onClick={() => setTab('sponsors')}>
            Sponsors <span className="ml-1 text-[10px] text-gray-500">{sponsors.length}</span>
          </TabButton>
          <TabButton active={tab === 'artists'} onClick={() => setTab('artists')}>
            Artists <span className="ml-1 text-[10px] text-gray-500">{artists.length}</span>
          </TabButton>
          <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}>
            Timeline <span className="ml-1 text-[10px] text-gray-500">{milestones.length}</span>
          </TabButton>
          <TabButton active={tab === 'volunteers'} onClick={() => setTab('volunteers')}>
            Volunteers <span className="ml-1 text-[10px] text-gray-500">{volunteers.length}</span>
          </TabButton>
          <TabButton active={tab === 'budget'} onClick={() => setTab('budget')}>Budget</TabButton>
          <TabButton active={tab === 'notes'} onClick={() => setTab('notes')}>
            Notes <span className="ml-1 text-[10px] text-gray-500">{meetingNotes.length}</span>
          </TabButton>
          <TabButton active={tab === 'team'} onClick={() => setTab('team')}>Team</TabButton>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-16">
        {tab === 'home' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Snapshot</p>
              <SnapshotButton sponsors={sponsors} artists={artists} milestones={milestones} budget={budget} />
            </div>
            <PersonalHome
              member={currentMember}
              allMembers={members}
              todos={todos}
              sponsors={sponsors}
              artists={artists}
              milestones={milestones}
              onNavigate={(t) => setTab(t)}
            />
          </>
        )}
        {tab === 'overview' && (
          <>
            <GoalsBoard goals={goals} />
            <hr className="border-white/[0.06]" />
            <TodoList todos={todos} members={memberList} currentMemberId={memberId} />
          </>
        )}
        {tab === 'sponsors' && <SponsorCRM sponsors={sponsors} members={memberList} />}
        {tab === 'artists' && <ArtistPipeline artists={artists} members={memberList} />}
        {tab === 'timeline' && <Timeline milestones={milestones} members={memberList} />}
        {tab === 'volunteers' && <VolunteerRoster volunteers={volunteers} />}
        {tab === 'budget' && <BudgetTracker entries={budget} />}
        {tab === 'notes' && <MeetingNotes notes={meetingNotes} members={memberList} />}
        {tab === 'team' && <TeamRoles members={members} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30'
          : 'text-gray-400 border border-transparent hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {children}
    </button>
  );
}
