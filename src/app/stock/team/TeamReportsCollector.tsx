'use client';

import { useState } from 'react';

interface Member {
  id: string;
  name: string;
}

interface Props {
  members: Member[];
  currentNotes: string;
  onAppend: (newNotes: string) => void;
}

export function TeamReportsCollector({ members, currentNotes, onAppend }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [movedForward, setMovedForward] = useState('');
  const [blockers, setBlockers] = useState('');
  const [ask, setAsk] = useState('');
  const [lastAppended, setLastAppended] = useState<string | null>(null);

  function appendReport() {
    const member = members.find((m) => m.id === selectedMember);
    if (!member) return;
    if (!movedForward.trim() && !blockers.trim() && !ask.trim()) return;

    const today = new Date().toISOString().slice(0, 10);
    const block = [
      '',
      `### ${member.name} - ${today}`,
      movedForward.trim() ? `- Moved forward: ${movedForward.trim()}` : '- Moved forward: (nothing reported)',
      blockers.trim() ? `- Blockers: ${blockers.trim()}` : '- Blockers: none',
      ask.trim() ? `- Ask: ${ask.trim()}` : '- Ask: none',
      '',
    ].join('\n');

    const nextNotes = (currentNotes || '').trimEnd() + '\n' + block;
    onAppend(nextNotes);

    setLastAppended(member.name);
    setMovedForward('');
    setBlockers('');
    setAsk('');
    setSelectedMember('');
  }

  return (
    <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Team Reports Collector</p>
          <p className="text-xs text-gray-400 mt-0.5">Log a structured status report from a teammate into this meeting&apos;s notes.</p>
        </div>
        <span className="text-gray-500 text-xs">{open ? 'hide' : 'open'}</span>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] p-3 space-y-2">
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#f5a623]/30"
          >
            <option value="">Select teammate...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <input
            value={movedForward}
            onChange={(e) => setMovedForward(e.target.value)}
            placeholder="Moved forward this week..."
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
          <input
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="Blockers..."
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="Top ask for the group..."
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            {lastAppended && (
              <p className="text-[10px] text-emerald-400">Appended report for {lastAppended}.</p>
            )}
            <button
              onClick={appendReport}
              disabled={!selectedMember}
              className="ml-auto bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded px-3 py-1.5 text-xs transition-colors"
            >
              Append to Notes
            </button>
          </div>
          <p className="text-[10px] text-gray-600 italic">
            Report is appended as a markdown block to the Notes field above. You can still edit the Notes directly after.
          </p>
        </div>
      )}
    </div>
  );
}
