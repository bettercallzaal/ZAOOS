'use client';

import { useState } from 'react';

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

const STATUS_COLOR: Record<BudgetEntry['status'], string> = {
  projected: 'border-gray-600 text-gray-400',
  committed: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  actual: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
};

export function BudgetTracker({ entries: initial }: { entries: BudgetEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [view, setView] = useState<'all' | 'income' | 'expense'>('all');
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');

  async function createEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim() || !newDescription.trim() || !newAmount) return;
    const res = await fetch('/api/stock/team/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: newType,
        category: newCategory.trim(),
        description: newDescription.trim(),
        amount: Number(newAmount),
      }),
    });
    if (res.ok) {
      const { entry } = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setNewCategory('');
      setNewDescription('');
      setNewAmount('');
    }
  }

  async function updateEntry(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/budget', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    }
  }

  function cycleStatus(entry: BudgetEntry) {
    const next = entry.status === 'projected' ? 'committed' : entry.status === 'committed' ? 'actual' : 'projected';
    updateEntry(entry.id, { status: next });
  }

  const income = entries.filter((e) => e.type === 'income');
  const expenses = entries.filter((e) => e.type === 'expense');
  const incomeActual = income.filter((e) => e.status === 'actual').reduce((sum, e) => sum + Number(e.amount), 0);
  const incomeCommitted = income.filter((e) => e.status !== 'projected').reduce((sum, e) => sum + Number(e.amount), 0);
  const incomeProjected = income.reduce((sum, e) => sum + Number(e.amount), 0);
  const expenseActual = expenses.filter((e) => e.status === 'actual').reduce((sum, e) => sum + Number(e.amount), 0);
  const expenseProjected = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProjected = incomeProjected - expenseProjected;

  const filtered = view === 'all' ? entries : entries.filter((e) => e.type === view);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Budget</h2>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as 'all' | 'income' | 'expense')}
          className="bg-[#0a1628] border border-white/[0.08] rounded text-xs text-gray-400 px-2 py-1 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06]">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Income</p>
          <p className="text-base font-bold text-emerald-400">${incomeActual.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">
            ${incomeCommitted.toLocaleString()} committed · ${incomeProjected.toLocaleString()} projected
          </p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06]">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Expenses</p>
          <p className="text-base font-bold text-red-400">${expenseActual.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">
            ${expenseProjected.toLocaleString()} projected
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-lg p-3 border border-[#f5a623]/30 text-center">
        <p className="text-[10px] text-[#f5a623] uppercase tracking-wider">Projected Net</p>
        <p className={`text-2xl font-bold ${netProjected >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {netProjected >= 0 ? '+' : ''}${netProjected.toLocaleString()}
        </p>
      </div>

      <form onSubmit={createEntry} className="space-y-2">
        <div className="flex gap-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'income' | 'expense')}
            className="bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-gray-400 focus:outline-none"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category"
            className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="$"
            className="w-24 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description"
            className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
          <button
            type="submit"
            className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 flex items-start gap-3">
            <button
              onClick={() => cycleStatus(entry)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${STATUS_COLOR[entry.status]}`}
              title="Cycle status"
            >
              {entry.status}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  entry.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {entry.type}
                </span>
                <p className="text-sm text-white">{entry.description}</p>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] text-gray-500">{entry.category}</span>
                {entry.related_sponsor && (
                  <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full">
                    via {entry.related_sponsor.name}
                  </span>
                )}
              </div>
            </div>
            <p className={`text-base font-bold flex-shrink-0 ${
              entry.type === 'income' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {entry.type === 'income' ? '+' : '-'}${Number(entry.amount).toLocaleString()}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No entries in this view</p>
        )}
      </div>
    </div>
  );
}
