'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'closed' | 'todo' | 'sponsor' | 'artist';

export function QuickAdd({ currentMemberId }: { currentMemberId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('closed');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [todoTitle, setTodoTitle] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorTrack, setSponsorTrack] = useState<'local' | 'virtual' | 'ecosystem'>('local');
  const [artistName, setArtistName] = useState('');
  const [artistGenre, setArtistGenre] = useState('');

  async function submitTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!todoTitle.trim()) return;
    setBusy(true);
    const res = await fetch('/api/stock/team/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: todoTitle.trim(), owner_id: currentMemberId }),
    });
    setBusy(false);
    if (res.ok) {
      setTodoTitle('');
      setMsg('Todo added. Refreshing...');
      router.refresh();
      setTimeout(() => { setMode('closed'); setMsg(null); }, 800);
    } else {
      setMsg('Failed to add todo');
    }
  }

  async function submitSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!sponsorName.trim()) return;
    setBusy(true);
    const res = await fetch('/api/stock/team/sponsors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sponsorName.trim(), track: sponsorTrack }),
    });
    setBusy(false);
    if (res.ok) {
      setSponsorName('');
      setMsg('Sponsor added. Refreshing...');
      router.refresh();
      setTimeout(() => { setMode('closed'); setMsg(null); }, 800);
    } else {
      setMsg('Failed to add sponsor');
    }
  }

  async function submitArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!artistName.trim()) return;
    setBusy(true);
    const res = await fetch('/api/stock/team/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: artistName.trim(), genre: artistGenre.trim() || undefined }),
    });
    setBusy(false);
    if (res.ok) {
      setArtistName('');
      setArtistGenre('');
      setMsg('Artist added. Refreshing...');
      router.refresh();
      setTimeout(() => { setMode('closed'); setMsg(null); }, 800);
    } else {
      setMsg('Failed to add artist');
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Quick Add</p>

      <div className="flex gap-2">
        <QuickButton active={mode === 'todo'} onClick={() => setMode(mode === 'todo' ? 'closed' : 'todo')}>
          + Todo
        </QuickButton>
        <QuickButton active={mode === 'sponsor'} onClick={() => setMode(mode === 'sponsor' ? 'closed' : 'sponsor')}>
          + Sponsor
        </QuickButton>
        <QuickButton active={mode === 'artist'} onClick={() => setMode(mode === 'artist' ? 'closed' : 'artist')}>
          + Artist
        </QuickButton>
      </div>

      {mode === 'todo' && (
        <form onSubmit={submitTodo} className="bg-[#0d1b2a] rounded-lg border border-[#f5a623]/30 p-3 flex gap-2">
          <input
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.target.value)}
            placeholder="What needs doing?"
            className="flex-1 bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            autoFocus
          />
          <button type="submit" disabled={busy} className="bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded px-3 py-2 text-xs transition-colors">
            Add
          </button>
        </form>
      )}

      {mode === 'sponsor' && (
        <form onSubmit={submitSponsor} className="bg-[#0d1b2a] rounded-lg border border-[#f5a623]/30 p-3 space-y-2">
          <input
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="Sponsor name..."
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={sponsorTrack}
              onChange={(e) => setSponsorTrack(e.target.value as 'local' | 'virtual' | 'ecosystem')}
              className="flex-1 bg-[#0a1628] border border-white/[0.08] rounded px-2 py-2 text-xs text-gray-300 focus:outline-none"
            >
              <option value="local">Local</option>
              <option value="virtual">Virtual</option>
              <option value="ecosystem">Ecosystem</option>
            </select>
            <button type="submit" disabled={busy} className="bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded px-3 py-2 text-xs transition-colors">
              Add
            </button>
          </div>
        </form>
      )}

      {mode === 'artist' && (
        <form onSubmit={submitArtist} className="bg-[#0d1b2a] rounded-lg border border-[#f5a623]/30 p-3 space-y-2">
          <input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Artist name..."
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              value={artistGenre}
              onChange={(e) => setArtistGenre(e.target.value)}
              placeholder="Genre (optional)"
              className="flex-1 bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            />
            <button type="submit" disabled={busy} className="bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded px-3 py-2 text-xs transition-colors">
              Add
            </button>
          </div>
        </form>
      )}

      {msg && <p className="text-xs text-emerald-400 px-1">{msg}</p>}
    </div>
  );
}

function QuickButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg border text-xs font-bold py-2 transition-colors ${
        active
          ? 'bg-[#f5a623]/15 border-[#f5a623]/40 text-[#f5a623]'
          : 'bg-[#0d1b2a] border-white/[0.08] text-gray-400 hover:text-white hover:border-white/[0.15]'
      }`}
    >
      {children}
    </button>
  );
}
