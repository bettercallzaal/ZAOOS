'use client';

import { useState } from 'react';

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

export function MeetingNotes({ notes: initial }: { notes: Note[] }) {
  const [notes, setNotes] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newNotes, setNewNotes] = useState('');

  async function createNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    const res = await fetch('/api/stock/team/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        meeting_date: newDate,
        notes: newNotes.trim() || undefined,
      }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewTitle('');
      setNewNotes('');
      setCreating(false);
    }
  }

  async function updateNote(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Meeting Notes</h2>
        <button
          onClick={() => setCreating(!creating)}
          className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-3 py-1.5 text-xs transition-colors"
        >
          {creating ? 'Cancel' : '+ New'}
        </button>
      </div>

      {creating && (
        <form onSubmit={createNote} className="bg-[#0d1b2a] rounded-lg border border-[#f5a623]/30 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Meeting title (e.g. Tuesday Standup)"
              className="flex-1 bg-[#0a1628] border border-white/[0.06] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
              autoFocus
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-[#0a1628] border border-white/[0.06] rounded px-2 py-2 text-xs text-gray-400 focus:outline-none"
            />
          </div>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes..."
            rows={4}
            className="w-full bg-[#0a1628] border border-white/[0.06] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
          />
          <button
            type="submit"
            className="w-full bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded px-4 py-2 text-sm transition-colors"
          >
            Save Note
          </button>
        </form>
      )}

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
              className="w-full p-3 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{note.title}</p>
                  <span className="text-[10px] text-[#f5a623]">
                    {new Date(note.meeting_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {note.attendees.length > 0 && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    {note.attendees.join(', ')}
                  </p>
                )}
                {expandedId !== note.id && note.notes && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{note.notes}</p>
                )}
              </div>
              <span className="text-gray-500 text-xs mt-0.5">{expandedId === note.id ? '▲' : '▼'}</span>
            </button>
            {expandedId === note.id && (
              <div className="border-t border-white/[0.06] p-3 space-y-3 bg-[#0a1628]">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                  <textarea
                    defaultValue={note.notes}
                    onBlur={(e) => e.target.value !== note.notes && updateNote(note.id, { notes: e.target.value })}
                    rows={6}
                    className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5a623]/30 resize-none"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Action Items</p>
                  <textarea
                    defaultValue={note.action_items}
                    onBlur={(e) => e.target.value !== note.action_items && updateNote(note.id, { action_items: e.target.value })}
                    placeholder="- [ ] ..."
                    rows={4}
                    className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        {notes.length === 0 && !creating && (
          <p className="text-sm text-gray-500 text-center py-4">No meeting notes yet</p>
        )}
      </div>
    </div>
  );
}
