'use client';

import { useEffect, useState } from 'react';

export type ContactEntityType = 'sponsor' | 'artist';

type Channel = 'email' | 'call' | 'sms' | 'dm_farcaster' | 'dm_x' | 'dm_tg' | 'in_person' | 'other';
type Direction = 'outbound' | 'inbound';

interface Entry {
  id: string;
  entity_type: string;
  entity_id: string;
  channel: Channel;
  direction: Direction;
  summary: string;
  contacted_at: string;
  next_action: string;
  next_action_at: string | null;
  contacted_by_member: { id: string; name: string } | null;
}

const CHANNEL_LABEL: Record<Channel, string> = {
  email: 'Email',
  call: 'Call',
  sms: 'SMS',
  dm_farcaster: 'FC DM',
  dm_x: 'X DM',
  dm_tg: 'TG DM',
  in_person: 'In person',
  other: 'Other',
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (day === 0) return 'today';
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ContactLogPanel({
  entityType,
  entityId,
}: {
  entityType: ContactEntityType;
  entityId: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [channel, setChannel] = useState<Channel>('email');
  const [direction, setDirection] = useState<Direction>('outbound');
  const [summary, setSummary] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionAt, setNextActionAt] = useState('');

  async function refresh() {
    try {
      const res = await fetch(
        `/api/stock/team/contact-log?entity_type=${entityType}&entity_id=${entityId}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setEntries(json.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch('/api/stock/team/contact-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          channel,
          direction,
          summary: summary.trim(),
          next_action: nextAction.trim() || undefined,
          next_action_at: nextActionAt || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Log failed');
      setEntries((prev) => [json.entry, ...prev]);
      setSummary('');
      setNextAction('');
      setNextActionAt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Log failed');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    const res = await fetch('/api/stock/team/contact-log', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-gray-500">Contact log</div>

      <form onSubmit={handlePost} className="bg-[#0a1628] border border-white/5 rounded p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className="text-xs bg-[#0d1b2a] border border-white/10 rounded px-2 py-1.5 text-gray-300"
          >
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
            className="text-xs bg-[#0d1b2a] border border-white/10 rounded px-2 py-1.5 text-gray-300"
          >
            {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What happened? (summary of the touch)"
          rows={2}
          maxLength={2000}
          className="w-full text-sm bg-[#0d1b2a] border border-white/10 rounded px-3 py-2 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-[#f5a623]/40"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Next action (optional)"
            maxLength={500}
            className="text-xs bg-[#0d1b2a] border border-white/10 rounded px-2 py-1.5 text-gray-300 placeholder-gray-600"
          />
          <input
            type="date"
            value={nextActionAt}
            onChange={(e) => setNextActionAt(e.target.value)}
            className="text-xs bg-[#0d1b2a] border border-white/10 rounded px-2 py-1.5 text-gray-300"
          />
        </div>
        <div className="flex items-center justify-between">
          {error ? (
            <span className="text-xs text-red-400">{error}</span>
          ) : (
            <span className="text-xs text-gray-600">&nbsp;</span>
          )}
          <button
            type="submit"
            disabled={!summary.trim() || posting}
            className="text-xs px-3 py-1 rounded border border-[#f5a623]/40 text-[#f5a623] hover:bg-[#f5a623]/10 disabled:opacity-40"
          >
            {posting ? 'Logging...' : 'Log touch'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-xs text-gray-500 italic">No contact history yet.</div>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((e) => (
            <li
              key={e.id}
              className="text-xs bg-[#0a1628] border border-white/5 rounded px-3 py-2 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                      e.direction === 'outbound'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {e.direction === 'outbound' ? 'OUT' : 'IN'}
                  </span>
                  <span className="text-gray-400">{CHANNEL_LABEL[e.channel]}</span>
                  <span className="text-gray-600">{relativeDate(e.contacted_at)}</span>
                  {e.contacted_by_member && (
                    <span className="text-gray-600">by {e.contacted_by_member.name}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-gray-600 hover:text-red-400"
                >
                  x
                </button>
              </div>
              <div className="text-gray-200 whitespace-pre-wrap">{e.summary}</div>
              {e.next_action && (
                <div className="text-[#f5a623]">
                  Next: {e.next_action}
                  {e.next_action_at && (
                    <span className="text-gray-500 ml-2">({e.next_action_at})</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
