'use client';

import { useState, useMemo } from 'react';
import { KanbanBoard, KanbanColumn } from './KanbanBoard';
import { AttentionCard } from './AttentionCard';

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface Member { id: string; name: string; }

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
  owner: Member | null;
  last_contacted_at: string | null;
  created_at: string;
}

const STATUS_ORDER: Record<Sponsor['status'], number> = {
  lead: 0,
  contacted: 1,
  in_talks: 2,
  committed: 3,
  paid: 4,
  declined: 5,
};

const STATUS_LABEL: Record<Sponsor['status'], string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  in_talks: 'In Talks',
  committed: 'Committed',
  paid: 'Paid',
  declined: 'Declined',
};

const STATUS_COLOR: Record<Sponsor['status'], string> = {
  lead: 'border-gray-600 text-gray-400',
  contacted: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  in_talks: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  committed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  paid: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
  declined: 'border-red-500/40 bg-red-500/10 text-red-400',
};

const TRACK_COLOR: Record<Sponsor['track'], string> = {
  local: 'text-green-400 bg-green-500/10',
  virtual: 'text-indigo-400 bg-indigo-500/10',
  ecosystem: 'text-[#f5a623] bg-[#f5a623]/10',
};

const TRACK_LABEL: Record<Sponsor['track'], string> = {
  local: 'Local',
  virtual: 'Virtual',
  ecosystem: 'Ecosystem',
};

const STATUS_STRIPE: Record<Sponsor['status'], string> = {
  lead: 'bg-gray-600',
  contacted: 'bg-blue-500',
  in_talks: 'bg-amber-500',
  committed: 'bg-emerald-500',
  paid: 'bg-emerald-400',
  declined: 'bg-red-500',
};

const KANBAN_COLUMNS: KanbanColumn<Sponsor['status']>[] = [
  { key: 'lead', label: 'Lead', accent: 'border-gray-600 text-gray-400' },
  { key: 'contacted', label: 'Contacted', accent: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { key: 'in_talks', label: 'In Talks', accent: 'border-amber-500/40 bg-amber-500/10 text-amber-400', wipSoftCap: 8 },
  { key: 'committed', label: 'Committed', accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { key: 'paid', label: 'Paid', accent: 'border-emerald-500 bg-emerald-500/20 text-emerald-300' },
  { key: 'declined', label: 'Declined', accent: 'border-red-500/40 bg-red-500/10 text-red-400', defaultCollapsed: true },
];

export function SponsorCRM({ sponsors: initial, members }: { sponsors: Sponsor[]; members: Member[] }) {
  const [sponsors, setSponsors] = useState(initial);
  const [track, setTrack] = useState<'all' | Sponsor['track']>('all');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newTrack, setNewTrack] = useState<Sponsor['track']>('local');

  const filtered = sponsors
    .filter((s) => track === 'all' || s.track === track)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const totalCommitted = sponsors.reduce((sum, s) => sum + Number(s.amount_committed || 0), 0);
  const totalPaid = sponsors.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
  const committedCount = sponsors.filter((s) => s.status === 'committed' || s.status === 'paid').length;

  const attention = useMemo(() => {
    const flagged: Array<{ id: string; title: string; reason: string; score: number }> = [];
    for (const s of sponsors) {
      if (s.status === 'contacted' && daysSince(s.last_contacted_at) > 14) {
        flagged.push({ id: s.id, title: s.name, reason: `Contacted ${daysSince(s.last_contacted_at)}d ago — no reply`, score: 3 });
      } else if (s.status === 'in_talks' && daysSince(s.last_contacted_at) > 7) {
        flagged.push({ id: s.id, title: s.name, reason: `In talks, silent ${daysSince(s.last_contacted_at)}d — follow up`, score: 2 });
      } else if (s.status === 'committed' && Number(s.amount_paid) < Number(s.amount_committed) && daysSince(s.created_at) > 30) {
        flagged.push({ id: s.id, title: s.name, reason: `Committed $${Number(s.amount_committed).toLocaleString()} not paid yet`, score: 1 });
      }
    }
    return flagged.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [sponsors]);

  async function createSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch('/api/stock/team/sponsors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), track: newTrack }),
    });
    if (res.ok) {
      const { sponsor } = await res.json();
      setSponsors((prev) => [sponsor, ...prev]);
      setNewName('');
    }
  }

  async function updateSponsor(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/sponsors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    }
  }

  function cycleStatus(s: Sponsor) {
    const order: Sponsor['status'][] = ['lead', 'contacted', 'in_talks', 'committed', 'paid'];
    const idx = order.indexOf(s.status);
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'lead';
    const update: Record<string, unknown> = { status: next };
    if (next !== 'lead' && !s.last_contacted_at) {
      update.last_contacted_at = new Date().toISOString();
    }
    updateSponsor(s.id, update);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white">Sponsors</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-white/[0.08] overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`text-[10px] font-bold px-2 py-1 transition-colors ${
                view === 'list' ? 'bg-[#f5a623]/15 text-[#f5a623]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('board')}
              className={`text-[10px] font-bold px-2 py-1 transition-colors border-l border-white/[0.08] ${
                view === 'board' ? 'bg-[#f5a623]/15 text-[#f5a623]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Board
            </button>
          </div>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value as 'all' | Sponsor['track'])}
            className="bg-[#0a1628] border border-white/[0.08] rounded text-xs text-gray-400 px-2 py-1 focus:outline-none"
          >
            <option value="all">All Tracks</option>
            <option value="local">Local</option>
            <option value="virtual">Virtual</option>
            <option value="ecosystem">Ecosystem</option>
          </select>
        </div>
      </div>

      <AttentionCard items={attention} />

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-emerald-400">${totalPaid.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Paid</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-amber-400">${totalCommitted.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Committed</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-white">{committedCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Secured</p>
        </div>
      </div>

      <form onSubmit={createSponsor} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a sponsor..."
          className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <select
          value={newTrack}
          onChange={(e) => setNewTrack(e.target.value as Sponsor['track'])}
          className="bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-gray-400 focus:outline-none"
        >
          <option value="local">Local</option>
          <option value="virtual">Virtual</option>
          <option value="ecosystem">Ecosystem</option>
        </select>
        <button
          type="submit"
          className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Add
        </button>
      </form>

      {view === 'list' ? (
        <div className="space-y-2">
          {filtered.map((sponsor) => (
            <div key={sponsor.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] overflow-hidden">
              <div className="p-3 flex items-start gap-3">
                <button
                  onClick={() => cycleStatus(sponsor)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${STATUS_COLOR[sponsor.status]}`}
                  title="Click to advance status"
                >
                  {STATUS_LABEL[sponsor.status]}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{sponsor.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${TRACK_COLOR[sponsor.track]}`}>
                      {TRACK_LABEL[sponsor.track]}
                    </span>
                    {Number(sponsor.amount_committed) > 0 && (
                      <span className="text-[10px] text-amber-400">${Number(sponsor.amount_committed).toLocaleString()}</span>
                    )}
                  </div>
                  {sponsor.why_them && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{sponsor.why_them}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {sponsor.contact_name && (
                      <span className="text-[10px] text-gray-400">{sponsor.contact_name}</span>
                    )}
                    {sponsor.owner && (
                      <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full">
                        {sponsor.owner.name}
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedId(expandedId === sponsor.id ? null : sponsor.id)}
                      className="text-[10px] text-gray-500 hover:text-gray-400"
                    >
                      {expandedId === sponsor.id ? 'collapse' : 'edit'}
                    </button>
                  </div>
                </div>
              </div>
              {expandedId === sponsor.id && (
                <div className="border-t border-white/[0.06] p-3 space-y-2 bg-[#0a1628]">
                  <EditRow sponsor={sponsor} members={members} onUpdate={updateSponsor} />
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No sponsors in this track yet</p>
          )}
        </div>
      ) : (
        <KanbanBoard
          items={filtered}
          columns={KANBAN_COLUMNS}
          onStatusChange={(id, status) => {
            const s = sponsors.find((x) => x.id === id);
            const update: Record<string, unknown> = { status };
            if (s && status !== 'lead' && !s.last_contacted_at) {
              update.last_contacted_at = new Date().toISOString();
            }
            updateSponsor(id, update);
          }}
          getStripeColor={(s) => STATUS_STRIPE[s.status]}
          renderCard={(sponsor) => (
            <div className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-white">{sponsor.name}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${TRACK_COLOR[sponsor.track]}`}>
                  {TRACK_LABEL[sponsor.track]}
                </span>
              </div>
              {Number(sponsor.amount_committed) > 0 && (
                <p className="text-[11px] text-amber-400 mt-1">${Number(sponsor.amount_committed).toLocaleString()}</p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {sponsor.contact_name && (
                  <span className="text-[10px] text-gray-400">{sponsor.contact_name}</span>
                )}
                {sponsor.owner && (
                  <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full">
                    {sponsor.owner.name}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

function EditRow({
  sponsor,
  members,
  onUpdate,
}: {
  sponsor: Sponsor;
  members: Member[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
}) {
  const [committed, setCommitted] = useState(String(sponsor.amount_committed || ''));
  const [paid, setPaid] = useState(String(sponsor.amount_paid || ''));
  const [notes, setNotes] = useState(sponsor.notes || '');
  const [contactName, setContactName] = useState(sponsor.contact_name || '');
  const [contactEmail, setContactEmail] = useState(sponsor.contact_email || '');

  function save() {
    onUpdate(sponsor.id, {
      amount_committed: Number(committed) || 0,
      amount_paid: Number(paid) || 0,
      notes,
      contact_name: contactName,
      contact_email: contactEmail,
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Contact name"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <input
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Contact email"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={committed}
          onChange={(e) => setCommitted(e.target.value)}
          placeholder="Committed $"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <input
          type="number"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
          placeholder="Paid $"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={sponsor.owner?.id || ''}
          onChange={(e) => onUpdate(sponsor.id, { owner_id: e.target.value || null })}
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-gray-400 focus:outline-none"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button
          onClick={save}
          className="ml-auto bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded px-3 py-1.5 text-xs transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
