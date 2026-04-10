'use client';

import { useState } from 'react';

interface Goal {
  id: string;
  title: string;
  status: 'locked' | 'wip' | 'tbd';
  details: string;
  category: string;
  sort_order: number;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  locked: { label: 'LOCKED', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  wip: { label: 'WIP', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  tbd: { label: 'TBD', bg: 'bg-red-500/10', text: 'text-red-400' },
};

const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Venue',
  funding: 'Funding',
  artists: 'Artists',
  production: 'Production',
  logistics: 'Logistics',
  marketing: 'Marketing',
  general: 'General',
};

export function GoalsBoard({ goals: initialGoals }: { goals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState('');

  async function updateGoal(id: string, updates: Partial<Pick<Goal, 'status' | 'details'>>) {
    const res = await fetch('/api/stock/team/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    }
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditDetails(goal.details);
  }

  function saveEdit(id: string) {
    updateGoal(id, { details: editDetails });
    setEditingId(null);
  }

  const grouped = goals.reduce<Record<string, Goal[]>>((acc, g) => {
    (acc[g.category] ||= []).push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">Status Board</h2>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
            {CATEGORY_LABELS[cat] || cat}
          </h3>
          <div className="space-y-2">
            {items.map((goal) => {
              const style = STATUS_STYLES[goal.status];
              return (
                <div key={goal.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{goal.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      {editingId === goal.id ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            value={editDetails}
                            onChange={(e) => setEditDetails(e.target.value)}
                            className="flex-1 bg-[#0a1628] border border-white/[0.1] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#f5a623]/50"
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(goal.id)}
                            autoFocus
                          />
                          <button onClick={() => saveEdit(goal.id)} className="text-xs text-[#f5a623] font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500">Cancel</button>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-gray-400 cursor-pointer hover:text-gray-300"
                          onClick={() => startEdit(goal)}
                          title="Click to edit"
                        >
                          {goal.details || 'Click to add details...'}
                        </p>
                      )}
                    </div>
                    <select
                      value={goal.status}
                      onChange={(e) => updateGoal(goal.id, { status: e.target.value as Goal['status'] })}
                      className="bg-[#0a1628] border border-white/[0.08] rounded text-xs text-gray-400 px-2 py-1 focus:outline-none"
                    >
                      <option value="locked">Locked</option>
                      <option value="wip">WIP</option>
                      <option value="tbd">TBD</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
