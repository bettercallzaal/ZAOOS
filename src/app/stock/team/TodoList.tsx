'use client';

import { useState } from 'react';

interface Member { id: string; name: string; }
interface Todo {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  notes: string;
  owner: Member | null;
  creator: Member | null;
  created_at: string;
}

const STATUS_ORDER = { todo: 0, in_progress: 1, done: 2 };

export function TodoList({ todos: initialTodos, members, currentMemberId }: {
  todos: Todo[];
  members: Member[];
  currentMemberId: string;
}) {
  const [todos, setTodos] = useState(() =>
    [...initialTodos].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  );
  const [filter, setFilter] = useState<'all' | 'mine' | string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState<string>('');
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesVal, setEditNotesVal] = useState('');

  const filtered = todos.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'mine') return t.owner?.id === currentMemberId;
    return t.owner?.id === filter;
  });

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch('/api/stock/team/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), owner_id: newOwner || null }),
    });
    if (res.ok) {
      const { todo } = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setNewTitle('');
      setNewOwner('');
    }
  }

  async function updateTodo(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
          .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      );
    }
  }

  function cycleStatus(todo: Todo) {
    const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' } as const;
    updateTodo(todo.id, { status: next[todo.status] });
  }

  const statusIcon = { todo: '', in_progress: '~', done: '\u2713' };
  const statusColor = {
    todo: 'border-gray-600',
    in_progress: 'border-amber-500 bg-amber-500/10',
    done: 'border-emerald-500 bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Todos</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#0a1628] border border-white/[0.08] rounded text-xs text-gray-400 px-2 py-1 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="mine">Mine</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={createTodo} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a todo..."
          className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <select
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          className="bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-gray-400 focus:outline-none"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2 text-sm transition-colors">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {filtered.map((todo) => (
          <div key={todo.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3">
            <div className="flex items-start gap-3">
              <button
                onClick={() => cycleStatus(todo)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${statusColor[todo.status]}`}
                title={`Status: ${todo.status}. Click to cycle.`}
              >
                {statusIcon[todo.status]}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${todo.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {todo.owner && (
                    <span className="text-[10px] font-medium text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
                      {todo.owner.name}
                    </span>
                  )}
                  <button
                    onClick={() => { setEditNotesId(editNotesId === todo.id ? null : todo.id); setEditNotesVal(todo.notes || ''); }}
                    className="text-[10px] text-gray-500 hover:text-gray-400"
                  >
                    {todo.notes ? 'notes' : '+ note'}
                  </button>
                </div>
                {editNotesId === todo.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={editNotesVal}
                      onChange={(e) => setEditNotesVal(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 bg-[#0a1628] border border-white/[0.1] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#f5a623]/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') { updateTodo(todo.id, { notes: editNotesVal }); setEditNotesId(null); } }}
                      autoFocus
                    />
                    <button onClick={() => { updateTodo(todo.id, { notes: editNotesVal }); setEditNotesId(null); }} className="text-xs text-[#f5a623]">Save</button>
                  </div>
                )}
                {editNotesId !== todo.id && todo.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">{todo.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No todos yet</p>
        )}
      </div>
    </div>
  );
}
