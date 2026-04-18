'use client';

import { useState } from 'react';

interface Rsvp {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export function RsvpList({ rsvps }: { rsvps: Rsvp[] }) {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const filtered = query.trim()
    ? rsvps.filter((r) => {
        const q = query.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      })
    : rsvps;

  function copyEmails() {
    const emails = rsvps.map((r) => r.email).filter(Boolean).join(', ');
    navigator.clipboard.writeText(emails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white">RSVPs</h2>
        <button
          onClick={copyEmails}
          disabled={rsvps.length === 0}
          className="text-[10px] text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded px-2 py-1 transition-colors disabled:opacity-40"
        >
          {copied ? 'Copied!' : 'Copy all emails'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Total" value={rsvps.length} color="text-[#f5a623]" />
        <StatTile label="This week" value={rsvps.filter((r) => daysSince(r.created_at) <= 7).length} color="text-emerald-400" />
        <StatTile label="Today" value={rsvps.filter((r) => daysSince(r.created_at) === 0).length} color="text-white" />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full bg-[#0d1b2a] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
      />

      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{r.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{r.email}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[10px] text-gray-500">{formatDate(r.created_at)}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && rsvps.length > 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No matches for &quot;{query}&quot;</p>
        )}
        {rsvps.length === 0 && (
          <div className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-6 text-center">
            <p className="text-sm text-gray-400">No RSVPs yet.</p>
            <p className="text-xs text-gray-500 mt-2">
              Share zaoos.com/stock to start filling this list. Every submission from the RSVP form lands here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
