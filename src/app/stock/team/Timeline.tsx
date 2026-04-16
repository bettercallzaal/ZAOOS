'use client';

import { useState } from 'react';

interface Member { id: string; name: string; }

interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  category: string;
  notes: string;
  owner: Member | null;
  created_at: string;
}

const STATUS_LABEL: Record<Milestone['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

const STATUS_COLOR: Record<Milestone['status'], string> = {
  pending: 'border-gray-600 text-gray-400',
  in_progress: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  done: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
  blocked: 'border-red-500/40 bg-red-500/10 text-red-400',
};

const CATEGORY_COLOR: Record<string, string> = {
  venue: 'text-blue-400 bg-blue-500/10',
  finance: 'text-emerald-400 bg-emerald-500/10',
  music: 'text-purple-400 bg-purple-500/10',
  marketing: 'text-pink-400 bg-pink-500/10',
  ops: 'text-[#f5a623] bg-[#f5a623]/10',
  design: 'text-indigo-400 bg-indigo-500/10',
  partnerships: 'text-teal-400 bg-teal-500/10',
  logistics: 'text-cyan-400 bg-cyan-500/10',
  digital: 'text-violet-400 bg-violet-500/10',
  event: 'text-rose-400 bg-rose-500/10',
  post: 'text-gray-400 bg-gray-500/10',
  strategy: 'text-[#f5a623] bg-[#f5a623]/10',
  general: 'text-gray-400 bg-gray-500/10',
};

function daysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function monthLabel(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function Timeline({ milestones: initial, members }: { milestones: Milestone[]; members: Member[] }) {
  const [milestones, setMilestones] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'done'>('active');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  async function createMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    const res = await fetch('/api/stock/team/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), due_date: newDate }),
    });
    if (res.ok) {
      const { milestone } = await res.json();
      setMilestones((prev) => [...prev, milestone].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      setNewTitle('');
      setNewDate('');
    }
  }

  async function updateMilestone(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/timeline', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    }
  }

  function cycleStatus(m: Milestone) {
    const next = m.status === 'pending' ? 'in_progress' : m.status === 'in_progress' ? 'done' : 'pending';
    updateMilestone(m.id, { status: next });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = milestones.filter((m) => {
    const days = daysUntil(m.due_date);
    if (filter === 'done') return m.status === 'done';
    if (filter === 'active') return m.status !== 'done';
    if (filter === 'overdue') return m.status !== 'done' && days < 0;
    return true;
  });

  // Group by month
  const grouped = filtered.reduce<Record<string, Milestone[]>>((acc, m) => {
    const month = monthLabel(m.due_date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(m);
    return acc;
  }, {});

  const overdueCount = milestones.filter((m) => m.status !== 'done' && daysUntil(m.due_date) < 0).length;
  const activeCount = milestones.filter((m) => m.status !== 'done').length;
  const doneCount = milestones.filter((m) => m.status === 'done').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Timeline</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'overdue' | 'done')}
          className="bg-[#0a1628] border border-white/[0.08] rounded text-xs text-gray-400 px-2 py-1 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="done">Done</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-red-400">{overdueCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Overdue</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-amber-400">{activeCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-emerald-400">{doneCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Done</p>
        </div>
      </div>

      <form onSubmit={createMilestone} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New milestone..."
          className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Add
        </button>
      </form>

      <div className="space-y-4">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">{month}</p>
            {items.map((m) => {
              const days = daysUntil(m.due_date);
              const overdue = m.status !== 'done' && days < 0;
              return (
                <div
                  key={m.id}
                  className={`bg-[#0d1b2a] rounded-lg border p-3 flex items-start gap-3 ${
                    overdue ? 'border-red-500/40' : 'border-white/[0.06]'
                  }`}
                >
                  <button
                    onClick={() => cycleStatus(m)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${STATUS_COLOR[m.status]}`}
                    title="Click to cycle status"
                  >
                    {STATUS_LABEL[m.status]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${m.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] ${overdue ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                        {new Date(m.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'today' : `${days}d`}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          CATEGORY_COLOR[m.category] || CATEGORY_COLOR.general
                        }`}
                      >
                        {m.category}
                      </span>
                      {m.owner && (
                        <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full">
                          {m.owner.name}
                        </span>
                      )}
                    </div>
                    {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
                    <select
                      value={m.owner?.id || ''}
                      onChange={(e) => updateMilestone(m.id, { owner_id: e.target.value || null })}
                      className="mt-2 bg-[#0a1628] border border-white/[0.06] rounded px-2 py-1 text-[10px] text-gray-400 focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {members.map((mem) => (
                        <option key={mem.id} value={mem.id}>{mem.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No milestones in this filter</p>
        )}
      </div>
    </div>
  );
}
