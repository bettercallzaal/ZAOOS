'use client';

import { useState } from 'react';

interface Member { id: string; name: string; }

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'setup' | 'checkin' | 'water' | 'safety' | 'teardown' | 'floater' | 'content' | 'unassigned';
  shift: 'early' | 'block1' | 'block2' | 'teardown' | 'allday';
  confirmed: boolean;
  notes: string;
  recruited_by_member: Member | null;
  created_at: string;
}

const ROLE_LABEL: Record<Volunteer['role'], string> = {
  setup: 'Setup',
  checkin: 'Check-In',
  water: 'Water',
  safety: 'Safety',
  teardown: 'Teardown',
  floater: 'Floater',
  content: 'Content',
  unassigned: 'Unassigned',
};

const SHIFT_LABEL: Record<Volunteer['shift'], string> = {
  early: 'Early (8-12)',
  block1: 'Block 1 (12-3)',
  block2: 'Block 2 (3-6)',
  teardown: 'Teardown (6-7:30)',
  allday: 'All Day',
};

export function VolunteerRoster({ volunteers: initial }: { volunteers: Volunteer[] }) {
  const [volunteers, setVolunteers] = useState(initial);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function createVolunteer(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch('/api/stock/team/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
      }),
    });
    if (res.ok) {
      const { volunteer } = await res.json();
      setVolunteers((prev) => [volunteer, ...prev]);
      setNewName('');
      setNewEmail('');
    }
  }

  async function updateVolunteer(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/volunteers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setVolunteers((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    }
  }

  const confirmed = volunteers.filter((v) => v.confirmed).length;
  const target = 20;
  const unassigned = volunteers.filter((v) => v.role === 'unassigned').length;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Volunteers</h2>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-emerald-400">{confirmed} / {target}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Confirmed</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-white">{volunteers.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-amber-400">{unassigned}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">No Role</p>
        </div>
      </div>

      <form onSubmit={createVolunteer} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name"
          className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <button
          type="submit"
          className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {volunteers.map((v) => (
          <div key={v.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] overflow-hidden">
            <div className="p-3 flex items-start gap-3">
              <button
                onClick={() => updateVolunteer(v.id, { confirmed: !v.confirmed })}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  v.confirmed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-600'
                }`}
                title="Toggle confirmed"
              >
                {v.confirmed && '✓'}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{v.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    v.role === 'unassigned' ? 'bg-amber-500/10 text-amber-400' : 'bg-[#f5a623]/10 text-[#f5a623]'
                  }`}>
                    {ROLE_LABEL[v.role]}
                  </span>
                  <span className="text-[10px] text-gray-500">{SHIFT_LABEL[v.shift]}</span>
                  {v.email && <span className="text-[10px] text-gray-500">{v.email}</span>}
                  <button
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                    className="text-[10px] text-gray-500 hover:text-gray-400 ml-auto"
                  >
                    {expandedId === v.id ? 'collapse' : 'edit'}
                  </button>
                </div>
              </div>
            </div>
            {expandedId === v.id && (
              <div className="border-t border-white/[0.06] p-3 space-y-2 bg-[#0a1628]">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={v.role}
                    onChange={(e) => updateVolunteer(v.id, { role: e.target.value })}
                    className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-gray-400 focus:outline-none"
                  >
                    {(Object.keys(ROLE_LABEL) as Volunteer['role'][]).map((r) => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>
                  <select
                    value={v.shift}
                    onChange={(e) => updateVolunteer(v.id, { shift: e.target.value })}
                    className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-gray-400 focus:outline-none"
                  >
                    {(Object.keys(SHIFT_LABEL) as Volunteer['shift'][]).map((s) => (
                      <option key={s} value={s}>{SHIFT_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <input
                  defaultValue={v.phone}
                  onBlur={(e) => e.target.value !== v.phone && updateVolunteer(v.id, { phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
                />
                <textarea
                  defaultValue={v.notes}
                  onBlur={(e) => e.target.value !== v.notes && updateVolunteer(v.id, { notes: e.target.value })}
                  placeholder="Notes"
                  rows={2}
                  className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
                />
              </div>
            )}
          </div>
        ))}
        {volunteers.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No volunteers yet. Add the first one above.</p>
        )}
      </div>
    </div>
  );
}
