'use client';

import { GoalsBoard } from './GoalsBoard';
import { TodoList } from './TodoList';
import { TeamRoles } from './TeamRoles';
import { useRouter } from 'next/navigation';

interface Props {
  memberName: string;
  memberId: string;
  goals: Array<{ id: string; title: string; status: 'locked' | 'wip' | 'tbd'; details: string; category: string; sort_order: number }>;
  todos: Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done'; notes: string; owner: { id: string; name: string } | null; creator: { id: string; name: string } | null; created_at: string }>;
  members: Array<{ id: string; name: string; role: string; scope: string }>;
}

export function Dashboard({ memberName, memberId, goals, todos, members }: Props) {
  const router = useRouter();

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
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-16">
        <GoalsBoard goals={goals} />
        <hr className="border-white/[0.06]" />
        <TodoList todos={todos} members={members.map((m) => ({ id: m.id, name: m.name }))} currentMemberId={memberId} />
        <hr className="border-white/[0.06]" />
        <TeamRoles members={members} />
      </div>
    </div>
  );
}
