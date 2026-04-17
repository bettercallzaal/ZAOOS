'use client';

import { useState, useMemo } from 'react';
import { KanbanBoard, KanbanColumn } from './KanbanBoard';
import { AttentionCard } from './AttentionCard';

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface Member { id: string; name: string; }

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
  outreach: Member | null;
  created_at: string;
}

const STATUS_ORDER: Record<Artist['status'], number> = {
  wishlist: 0,
  contacted: 1,
  interested: 2,
  confirmed: 3,
  travel_booked: 4,
  declined: 5,
};

const STATUS_LABEL: Record<Artist['status'], string> = {
  wishlist: 'Wishlist',
  contacted: 'Contacted',
  interested: 'Interested',
  confirmed: 'Confirmed',
  travel_booked: 'Booked',
  declined: 'Declined',
};

const STATUS_COLOR: Record<Artist['status'], string> = {
  wishlist: 'border-gray-600 text-gray-400',
  contacted: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  interested: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  confirmed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  travel_booked: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
  declined: 'border-red-500/40 bg-red-500/10 text-red-400',
};

const STATUS_STRIPE: Record<Artist['status'], string> = {
  wishlist: 'bg-gray-600',
  contacted: 'bg-blue-500',
  interested: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  travel_booked: 'bg-emerald-400',
  declined: 'bg-red-500',
};

const KANBAN_COLUMNS: KanbanColumn<Artist['status']>[] = [
  { key: 'wishlist', label: 'Wishlist', accent: 'border-gray-600 text-gray-400' },
  { key: 'contacted', label: 'Contacted', accent: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { key: 'interested', label: 'Interested', accent: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  { key: 'confirmed', label: 'Confirmed', accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', wipSoftCap: 10 },
  { key: 'travel_booked', label: 'Booked', accent: 'border-emerald-500 bg-emerald-500/20 text-emerald-300' },
  { key: 'declined', label: 'Declined', accent: 'border-red-500/40 bg-red-500/10 text-red-400', defaultCollapsed: true },
];

export function ArtistPipeline({ artists: initial, members }: { artists: Artist[]; members: Member[] }) {
  const [artists, setArtists] = useState(initial);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newCity, setNewCity] = useState('');

  const sorted = [...artists].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const counts = {
    wishlist: artists.filter((a) => a.status === 'wishlist').length,
    contacted: artists.filter((a) => a.status === 'contacted' || a.status === 'interested').length,
    confirmed: artists.filter((a) => a.status === 'confirmed' || a.status === 'travel_booked').length,
  };

  const attention = useMemo(() => {
    const flagged: Array<{ id: string; title: string; reason: string; score: number }> = [];
    for (const a of artists) {
      if (a.status === 'contacted' && daysSince(a.created_at) > 10) {
        flagged.push({ id: a.id, title: a.name, reason: `Contacted ${daysSince(a.created_at)}d ago — nudge`, score: 3 });
      } else if (a.status === 'interested' && !a.notes) {
        flagged.push({ id: a.id, title: a.name, reason: 'Interested but no notes — log next step', score: 2 });
      } else if (a.status === 'confirmed' && a.needs_travel && !a.travel_from) {
        flagged.push({ id: a.id, title: a.name, reason: 'Confirmed, needs travel, no origin set', score: 1 });
      }
    }
    return flagged.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [artists]);

  async function createArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch('/api/stock/team/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        genre: newGenre.trim() || undefined,
        city: newCity.trim() || undefined,
      }),
    });
    if (res.ok) {
      const { artist } = await res.json();
      setArtists((prev) => [artist, ...prev]);
      setNewName('');
      setNewGenre('');
      setNewCity('');
    }
  }

  async function updateArtist(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/stock/team/artists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      setArtists((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    }
  }

  function cycleStatus(a: Artist) {
    const order: Artist['status'][] = ['wishlist', 'contacted', 'interested', 'confirmed', 'travel_booked'];
    const idx = order.indexOf(a.status);
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'wishlist';
    updateArtist(a.id, { status: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white">Artists</h2>
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
      </div>

      <AttentionCard items={attention} />

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-gray-400">{counts.wishlist}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Wishlist</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-amber-400">{counts.contacted}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pipeline</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
          <p className="text-lg font-bold text-emerald-400">{counts.confirmed} / 10</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Confirmed</p>
        </div>
      </div>

      <form onSubmit={createArtist} className="space-y-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Artist name..."
          className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <div className="flex gap-2">
          <input
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            placeholder="Genre"
            className="flex-1 bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
          <input
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="City"
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

      {view === 'board' ? (
        <KanbanBoard
          items={artists}
          columns={KANBAN_COLUMNS}
          onStatusChange={(id, status) => updateArtist(id, { status })}
          getStripeColor={(a) => STATUS_STRIPE[a.status]}
          renderCard={(artist) => (
            <div className="p-3">
              <p className="text-sm font-medium text-white">{artist.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {artist.genre && <span className="text-[10px] text-gray-500">{artist.genre}</span>}
                {artist.city && <span className="text-[10px] text-gray-500">{artist.city}</span>}
                {artist.needs_travel && artist.status !== 'declined' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase">Travel</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {artist.outreach && (
                  <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full">{artist.outreach.name}</span>
                )}
                {artist.set_order !== null && (
                  <span className="text-[10px] text-gray-400">Slot {artist.set_order}</span>
                )}
              </div>
            </div>
          )}
        />
      ) : (
      <div className="space-y-2">
        {sorted.map((artist) => (
          <div key={artist.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] overflow-hidden">
            <div className="p-3 flex items-start gap-3">
              <button
                onClick={() => cycleStatus(artist)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${STATUS_COLOR[artist.status]}`}
                title="Click to advance status"
              >
                {STATUS_LABEL[artist.status]}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{artist.name}</p>
                  {artist.genre && <span className="text-[10px] text-gray-500">{artist.genre}</span>}
                  {artist.city && <span className="text-[10px] text-gray-500">• {artist.city}</span>}
                  {artist.needs_travel && artist.status !== 'declined' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase">
                      Travel
                    </span>
                  )}
                </div>
                {artist.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{artist.notes}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {artist.outreach && (
                    <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full">
                      {artist.outreach.name}
                    </span>
                  )}
                  {artist.set_order !== null && (
                    <span className="text-[10px] text-gray-400">Slot {artist.set_order}</span>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === artist.id ? null : artist.id)}
                    className="text-[10px] text-gray-500 hover:text-gray-400"
                  >
                    {expandedId === artist.id ? 'collapse' : 'edit'}
                  </button>
                </div>
              </div>
            </div>
            {expandedId === artist.id && (
              <div className="border-t border-white/[0.06] p-3 space-y-2 bg-[#0a1628]">
                <ArtistEditRow artist={artist} members={members} onUpdate={updateArtist} />
              </div>
            )}
          </div>
        ))}
        {artists.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No artists yet. Add one above.</p>
        )}
      </div>
      )}
    </div>
  );
}

function ArtistEditRow({
  artist,
  members,
  onUpdate,
}: {
  artist: Artist;
  members: Member[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
}) {
  const [travelFrom, setTravelFrom] = useState(artist.travel_from || '');
  const [socials, setSocials] = useState(artist.socials || '');
  const [notes, setNotes] = useState(artist.notes || '');
  const [fee, setFee] = useState(String(artist.fee || ''));
  const [setOrder, setSetOrder] = useState(artist.set_order !== null ? String(artist.set_order) : '');
  const [needsTravel, setNeedsTravel] = useState(artist.needs_travel);

  function save() {
    onUpdate(artist.id, {
      travel_from: travelFrom,
      socials,
      notes,
      fee: Number(fee) || 0,
      set_order: setOrder === '' ? null : Number(setOrder),
      needs_travel: needsTravel,
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          value={socials}
          onChange={(e) => setSocials(e.target.value)}
          placeholder="Socials (X/FC/IG)"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <input
          value={travelFrom}
          onChange={(e) => setTravelFrom(e.target.value)}
          placeholder="Traveling from"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="Fee $"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <input
          type="number"
          value={setOrder}
          onChange={(e) => setSetOrder(e.target.value)}
          placeholder="Set order (1-10)"
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes / rider"
        rows={2}
        className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
      />
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={needsTravel}
            onChange={(e) => setNeedsTravel(e.target.checked)}
            className="accent-[#f5a623]"
          />
          Needs travel
        </label>
        <select
          value={artist.outreach?.id || ''}
          onChange={(e) => onUpdate(artist.id, { outreach_by: e.target.value || null })}
          className="bg-[#0d1b2a] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-gray-400 focus:outline-none"
        >
          <option value="">Outreach: Unassigned</option>
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
