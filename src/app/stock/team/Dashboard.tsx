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
import { RsvpList } from './RsvpList';
import { CollapsibleDetail } from './CollapsibleDetail';
import { SponsorSummary, ArtistSummary, TimelineSummary } from './TabSummaries';
import { useRouter } from 'next/navigation';

type Tab = 'home' | 'overview' | 'sponsors' | 'artists' | 'timeline' | 'volunteers' | 'rsvps' | 'budget' | 'notes' | 'team';

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
  cypher_interested?: boolean;
  cypher_role?: string;
  day_of_start_time?: string | null;
  day_of_duration_min?: number | null;
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

interface Rsvp {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Props {
  memberName: string;
  memberId: string;
  goals: Array<{ id: string; title: string; status: 'locked' | 'wip' | 'tbd'; details: string; category: string; sort_order: number }>;
  todos: Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done'; notes: string; owner: { id: string; name: string } | null; creator: { id: string; name: string } | null; created_at: string }>;
  members: Array<{ id: string; name: string; role: string; scope: string; bio?: string; links?: string; photo_url?: string; status_text?: string; skills?: string }>;
  sponsors: Sponsor[];
  artists: Artist[];
  milestones: Milestone[];
  volunteers: Volunteer[];
  rsvps: Rsvp[];
  budget: BudgetEntry[];
  meetingNotes: Note[];
  myCirclesCount?: number;
  myActivityCount?: number;
  feed?: Array<{
    id: string;
    actorName: string | null;
    actorId: string | null;
    entityType: string;
    action: string;
    fieldChanged: string | null;
    newValue: string | null;
    createdAt: string;
  }>;
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
  rsvps,
  budget,
  meetingNotes,
  myCirclesCount = 0,
  myActivityCount = 0,
  feed = [],
}: Props) {
  const router = useRouter();
  const [tab, setTabRaw] = useState<Tab>('home');
  const [showMore, setShowMore] = useState(false);

  function setTab(t: Tab) {
    setTabRaw(t);
    if (t !== 'home') setShowMore(true);
  }

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
            <a
              href="/stock/team/help"
              className="text-xs text-gray-500 hover:text-[#f5a623]"
              title="How to use the dashboard"
            >
              Help
            </a>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300">
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto items-center">
          <TabButton active={tab === 'home'} onClick={() => setTab('home')}>Home</TabButton>
          <a
            href="/stock/circles"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 whitespace-nowrap"
            title="Pick which circles you want to work on"
          >
            Circles -&gt;
          </a>
          <a
            href="/stock/onepagers"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 whitespace-nowrap"
            title="Briefing docs for sponsors, partners, venues"
          >
            One-pagers -&gt;
          </a>
          {!showMore && (
            <button
              onClick={() => setShowMore(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 border border-transparent hover:text-white hover:bg-white/[0.04] whitespace-nowrap"
            >
              More details -&gt;
            </button>
          )}
          {showMore && (
            <>
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
              <TabButton active={tab === 'rsvps'} onClick={() => setTab('rsvps')}>
                RSVPs <span className="ml-1 text-[10px] text-gray-500">{rsvps.length}</span>
              </TabButton>
              <TabButton active={tab === 'budget'} onClick={() => setTab('budget')}>Budget</TabButton>
              <TabButton active={tab === 'notes'} onClick={() => setTab('notes')}>
                Notes <span className="ml-1 text-[10px] text-gray-500">{meetingNotes.length}</span>
              </TabButton>
              <TabButton active={tab === 'team'} onClick={() => setTab('team')}>Team</TabButton>
              <button
                onClick={() => { setShowMore(false); setTab('home'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-transparent hover:text-gray-300 whitespace-nowrap"
                title="Collapse extra tabs"
              >
                &lt;- Less
              </button>
            </>
          )}
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
              inAnyCircle={myCirclesCount > 0}
              hasFirstActivity={myActivityCount > 0}
              feed={feed}
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
        {tab === 'sponsors' && (
          <CollapsibleDetail
            title="Sponsors"
            summary={<SponsorSummary sponsors={sponsors} />}
          >
            <SponsorCRM sponsors={sponsors} members={memberList} />
          </CollapsibleDetail>
        )}
        {tab === 'artists' && (
          <CollapsibleDetail
            title="Artists"
            summary={<ArtistSummary artists={artists} />}
          >
            <ArtistPipeline artists={artists} members={memberList} />
          </CollapsibleDetail>
        )}
        {tab === 'timeline' && (
          <CollapsibleDetail
            title="Timeline"
            summary={<TimelineSummary milestones={milestones} />}
          >
            <Timeline milestones={milestones} members={memberList} />
          </CollapsibleDetail>
        )}
        {tab === 'volunteers' && (
          <>
            <CalloutBanner
              title="Where do these come from?"
              body="Every row here is someone who submitted the form at /stock/apply. New rows land as unconfirmed. Confirm or reassign a row as shifts firm up."
            />
            <VolunteerRoster volunteers={volunteers} />
          </>
        )}
        {tab === 'rsvps' && (
          <>
            <CalloutBanner
              title="Where do these come from?"
              body="Every row is someone who submitted the RSVP form on the /stock landing page. This is your marketing list. Notify them when tickets drop and when the lineup is announced."
            />
            <RsvpList rsvps={rsvps} />
          </>
        )}
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

function CalloutBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-lg p-3 mb-4">
      <p className="text-[10px] text-[#f5a623] uppercase tracking-wider font-bold">{title}</p>
      <p className="text-xs text-gray-300 mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
