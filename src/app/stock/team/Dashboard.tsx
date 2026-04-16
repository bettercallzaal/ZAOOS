'use client';

import { useState } from 'react';
import { GoalsBoard } from './GoalsBoard';
import { TodoList } from './TodoList';
import { TeamRoles } from './TeamRoles';
import { SponsorCRM } from './SponsorCRM';
import { useRouter } from 'next/navigation';

type Tab = 'overview' | 'sponsors' | 'team';

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

interface Props {
  memberName: string;
  memberId: string;
  goals: Array<{ id: string; title: string; status: 'locked' | 'wip' | 'tbd'; details: string; category: string; sort_order: number }>;
  todos: Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done'; notes: string; owner: { id: string; name: string } | null; creator: { id: string; name: string } | null; created_at: string }>;
  members: Array<{ id: string; name: string; role: string; scope: string }>;
  sponsors: Sponsor[];
}

export function Dashboard({ memberName, memberId, goals, todos, members, sponsors }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  async function handleLogout() {
    await fetch('/api/stock/team/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
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
          <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={tab === 'sponsors'} onClick={() => setTab('sponsors')}>
            Sponsors
            <span className="ml-1 text-[10px] text-gray-500">{sponsors.length}</span>
          </TabButton>
          <TabButton active={tab === 'team'} onClick={() => setTab('team')}>
            Team
          </TabButton>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-16">
        {tab === 'overview' && (
          <>
            <GoalsBoard goals={goals} />
            <hr className="border-white/[0.06]" />
            <TodoList
              todos={todos}
              members={members.map((m) => ({ id: m.id, name: m.name }))}
              currentMemberId={memberId}
            />
          </>
        )}
        {tab === 'sponsors' && (
          <SponsorCRM sponsors={sponsors} members={members.map((m) => ({ id: m.id, name: m.name }))} />
        )}
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
