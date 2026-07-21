'use client';

import { useEffect, useMemo, useState } from 'react';

// RunAwardsTab - the weekly Respect-awards operator view. Ties together the
// pieces that were scattered/manual: pick members BY NAME (not raw wallets),
// mark camera-on (+10), choose even-split or ranked, and generate the exact
// submission (submitBreakout URL for ranked, CSV for even-split). Newcomers who
// are not yet in respect_members can be added inline.
//
// Documented in research/governance/1770-fractal-respect-operations. The value
// rules encoded here: ranked denominations 55/34/21/13/8/5 (x2 doubles),
// camera-on = +10/meeting, even-split = one flat value for all.

interface Member {
  name: string;
  wallet: string;
  fid: number | null;
  totalRespect: number;
}

interface Pick {
  name: string;
  wallet: string;
  cameraOn: boolean;
}

const RANKED_BASE = [55, 34, 21, 13, 8, 5, 3, 2]; // by position, extend if needed
const CAMERA_RESPECT = 10;

function denom(rankIdx: number, x2: boolean): number {
  const base = RANKED_BASE[rankIdx] ?? 1;
  return x2 ? base * 2 : base;
}

export function RunAwardsTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [picks, setPicks] = useState<Pick[]>([]);
  const [meeting, setMeeting] = useState('');
  const [group, setGroup] = useState('1');
  const [mode, setMode] = useState<'even' | 'ranked'>('even');
  const [evenValue, setEvenValue] = useState('40');
  const [x2, setX2] = useState(false);
  // newcomer entry
  const [newName, setNewName] = useState('');
  const [newWallet, setNewWallet] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/respect/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        const list: Member[] = (d.leaderboard ?? d ?? [])
          .filter((m: Member) => m.wallet)
          .map((m: Member) => ({ name: m.name, wallet: m.wallet, fid: m.fid, totalRespect: m.totalRespect ?? 0 }));
        setMembers(list);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pickedWallets = new Set(picks.map((p) => p.wallet.toLowerCase()));
    return members
      .filter((m) => !pickedWallets.has(m.wallet.toLowerCase()))
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.wallet.toLowerCase().includes(q))
      .slice(0, 8);
  }, [members, search, picks]);

  function addPick(m: { name: string; wallet: string }) {
    if (picks.some((p) => p.wallet.toLowerCase() === m.wallet.toLowerCase())) return;
    setPicks([...picks, { name: m.name, wallet: m.wallet, cameraOn: false }]);
    setSearch('');
  }
  function addNewcomer() {
    if (!newName.trim() || !/^0x[a-fA-F0-9]{40}$/.test(newWallet.trim())) return;
    addPick({ name: `${newName.trim()} (new)`, wallet: newWallet.trim() });
    setNewName('');
    setNewWallet('');
  }
  function remove(w: string) {
    setPicks(picks.filter((p) => p.wallet.toLowerCase() !== w.toLowerCase()));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= picks.length) return;
    const next = [...picks];
    [next[i], next[j]] = [next[j], next[i]];
    setPicks(next);
  }
  function toggleCam(w: string) {
    setPicks(picks.map((p) => (p.wallet === w ? { ...p, cameraOn: !p.cameraOn } : p)));
  }

  // --- outputs ---
  const rankedUrl = useMemo(() => {
    if (mode !== 'ranked' || picks.length === 0) return '';
    const votes = picks.map((p, i) => `vote${i + 1}=${p.wallet}`).join('&');
    return `https://zao.frapps.xyz/submitBreakout?groupnumber=${group}&${votes}`;
  }, [mode, picks, group]);

  const csv = useMemo(() => {
    if (picks.length === 0) return '';
    const mint = x2 ? 10 : 0;
    const rows = ['account,value,title,reason,meetingNumber,mintType,groupNumber'];
    picks.forEach((p, i) => {
      const val = mode === 'even' ? Number(evenValue || 0) : denom(i, x2);
      rows.push(`${p.wallet},${val},Respect Breakout,Meeting ${meeting || '?'} ${mode} split,${meeting || ''},${mint},${group}`);
    });
    return rows.join('\n');
  }, [picks, mode, evenValue, x2, meeting, group]);

  const cameraCsv = useMemo(() => {
    const on = picks.filter((p) => p.cameraOn);
    if (on.length === 0) return '';
    const rows = ['account,value,title,reason,meetingNumber,mintType,groupNumber'];
    on.forEach((p) => rows.push(`${p.wallet},${CAMERA_RESPECT},Camera On,Meeting ${meeting || '?'} camera-on,${meeting || ''},0,${group}`));
    return rows.join('\n');
  }, [picks, meeting, group]);

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  }

  const btn = 'rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition';
  const camCount = picks.filter((p) => p.cameraOn).length;

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h3 className="text-lg font-bold text-[#f5a623]">Run the weekly awards</h3>
        <p className="text-sm text-white/50">
          Pick members by name, mark camera-on (+{CAMERA_RESPECT}), choose even or ranked, then copy the submission. No raw wallets, no spreadsheet.
        </p>
      </div>

      {/* meeting + group + mode */}
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2 text-white/60">
          Meeting #
          <input value={meeting} onChange={(e) => setMeeting(e.target.value)} placeholder="107"
            className="w-16 rounded-md border border-white/15 bg-[#0d1b2a] px-2 py-1 text-white" />
        </label>
        <label className="flex items-center gap-2 text-white/60">
          Group
          <input value={group} onChange={(e) => setGroup(e.target.value)} className="w-12 rounded-md border border-white/15 bg-[#0d1b2a] px-2 py-1 text-white" />
        </label>
        <div className="flex rounded-md border border-white/15 overflow-hidden">
          <button onClick={() => setMode('even')} className={`px-3 py-1 text-xs ${mode === 'even' ? 'bg-[#f5a623] text-black' : 'text-white/60'}`}>Even split</button>
          <button onClick={() => setMode('ranked')} className={`px-3 py-1 text-xs ${mode === 'ranked' ? 'bg-[#f5a623] text-black' : 'text-white/60'}`}>Ranked</button>
        </div>
        {mode === 'even' ? (
          <label className="flex items-center gap-2 text-white/60">Value each
            <input value={evenValue} onChange={(e) => setEvenValue(e.target.value)} className="w-14 rounded-md border border-white/15 bg-[#0d1b2a] px-2 py-1 text-white" />
          </label>
        ) : (
          <label className="flex items-center gap-2 text-white/60">
            <input type="checkbox" checked={x2} onChange={(e) => setX2(e.target.checked)} /> x2 (Breakout x2)
          </label>
        )}
      </div>

      {/* picked members */}
      <div>
        <div className="mb-1 text-xs uppercase tracking-wider text-white/40">This group ({picks.length}){camCount > 0 ? ` · ${camCount} camera-on` : ''}</div>
        {picks.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/30">Add members below.</p>
        ) : (
          <div className="space-y-1">
            {picks.map((p, i) => (
              <div key={p.wallet} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                {mode === 'ranked' && (
                  <div className="flex flex-col">
                    <button onClick={() => move(i, -1)} className="text-[10px] text-white/40 hover:text-white">▲</button>
                    <button onClick={() => move(i, 1)} className="text-[10px] text-white/40 hover:text-white">▼</button>
                  </div>
                )}
                <span className="w-6 text-xs text-[#f5a623]">{mode === 'ranked' ? `${denom(i, x2)}` : evenValue}</span>
                <span className="flex-1 text-sm text-white">{p.name}</span>
                <span className="text-[10px] text-white/30">{p.wallet.slice(0, 6)}...{p.wallet.slice(-4)}</span>
                <label className="flex items-center gap-1 text-[11px] text-white/50">
                  <input type="checkbox" checked={p.cameraOn} onChange={() => toggleCam(p.wallet)} /> cam
                </label>
                <button onClick={() => remove(p.wallet)} className="text-white/30 hover:text-red-400">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* member search */}
      <div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={loading ? 'Loading members...' : 'Search a member by name...'}
          className="w-full rounded-lg border border-white/15 bg-[#0d1b2a] px-3 py-2 text-sm text-white" />
        {results.length > 0 && (
          <div className="mt-1 space-y-1">
            {results.map((m) => (
              <button key={m.wallet} onClick={() => addPick(m)} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm hover:bg-white/[0.06]">
                <span className="text-white">{m.name}</span>
                <span className="text-[10px] text-white/30">{m.totalRespect} R · {m.wallet.slice(0, 6)}...</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* newcomer */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Newcomer (not in the registry yet)</div>
        <div className="flex flex-wrap gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="rounded-md border border-white/15 bg-[#0d1b2a] px-2 py-1 text-sm text-white" />
          <input value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="0x wallet" className="flex-1 rounded-md border border-white/15 bg-[#0d1b2a] px-2 py-1 text-sm text-white" />
          <button onClick={addNewcomer} className={btn}>Add</button>
        </div>
      </div>

      {/* outputs */}
      {picks.length > 0 && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          {mode === 'ranked' && rankedUrl && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/40">Ranked submit URL (frapps auto-assigns values)</span>
                <button onClick={() => copy(rankedUrl, 'url')} className={btn}>{copied === 'url' ? 'Copied' : 'Copy'}</button>
              </div>
              <code className="block break-all rounded-lg bg-black/40 p-2 text-[11px] text-white/70">{rankedUrl}</code>
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/40">Breakout CSV (Import as CSV on the batch form)</span>
              <button onClick={() => copy(csv, 'csv')} className={btn}>{copied === 'csv' ? 'Copied' : 'Copy'}</button>
            </div>
            <code className="block whitespace-pre-wrap rounded-lg bg-black/40 p-2 text-[11px] text-white/70">{csv}</code>
          </div>
          {cameraCsv && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/40">Camera-on CSV (+{CAMERA_RESPECT} each, {camCount} members)</span>
                <button onClick={() => copy(cameraCsv, 'cam')} className={btn}>{copied === 'cam' ? 'Copied' : 'Copy'}</button>
              </div>
              <code className="block whitespace-pre-wrap rounded-lg bg-black/40 p-2 text-[11px] text-white/70">{cameraCsv}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
