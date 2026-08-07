'use client';

import { useMemo, useState } from 'react';

/**
 * /publish - the compose + test dashboard.
 *
 * Zaal tapped POST on a ZOE draft and it just echoed the text back (posts/buttons.ts
 * only marks a draft approved and resends it as a copy-target). ZAO had every
 * publisher already but nothing that fanned ONE piece of text out. This is the
 * surface to test that path by hand before wiring it to ZOE's button.
 *
 * DRY RUN IS ON BY DEFAULT - publishing is irreversible, so going live is an
 * explicit, deliberate toggle every single time.
 */

const PLATFORMS = [
  {
    id: 'farcaster',
    name: 'Farcaster',
    limit: 320,
    color: '#8A63D2',
    note: 'posts first - the others mirror it',
  },
  { id: 'x', name: 'X', limit: 280, color: '#e0ddaa', note: 'mirrors the cast' },
  { id: 'bluesky', name: 'Bluesky', limit: 300, color: '#0085FF', note: 'mirrors the cast' },
  { id: 'telegram', name: 'Telegram', limit: 4096, color: '#2AABEE', note: 'ZAO channel' },
  { id: 'discord', name: 'Discord', limit: 2000, color: '#5865F2', note: 'webhook' },
] as const;

type PlatformId = (typeof PLATFORMS)[number]['id'];

interface Outcome {
  platform: string;
  ok: boolean;
  detail: string;
  simulated: boolean;
}

export default function PublishDashboard() {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<PlatformId[]>(['farcaster']);
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Outcome[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chars = text.length;
  const overLimit = useMemo(
    () => PLATFORMS.filter((p) => selected.includes(p.id) && chars > p.limit),
    [selected, chars],
  );
  const canSend = chars > 0 && selected.length > 0 && overLimit.length === 0 && !busy;

  function toggle(id: PlatformId) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));
  }

  async function send() {
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/publish/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, platforms: selected, dryRun }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.details
            ? `${json.error}: ${JSON.stringify(json.details)}`
            : (json.error ?? 'failed'),
        );
        return;
      }
      setResults(json.data.results as Outcome[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a1628] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-[#f5a623]">Publish</h1>
        <p className="mt-1 text-sm text-white/60">
          Compose once, send to several places. Dry run is on by default - nothing leaves the
          building until you turn it off.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="What are you posting?"
          className="mt-6 w-full rounded-lg border border-white/15 bg-white/5 p-3 text-base outline-none focus:border-[#f5a623]"
        />

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
          <span>{chars} chars</span>
          {PLATFORMS.filter((p) => selected.includes(p.id)).map((p) => (
            <span key={p.id} className={chars > p.limit ? 'text-red-400' : ''}>
              {p.name} {chars}/{p.limit}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                title={p.note}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  on ? 'border-transparent text-[#0a1628]' : 'border-white/20 text-white/70'
                }`}
                style={on ? { backgroundColor: p.color } : undefined}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="h-4 w-4 accent-[#f5a623]"
          />
          <span>
            Dry run{' '}
            <span className="text-white/50">
              {dryRun ? '- validates only, publishes nothing' : '- LIVE, this really posts'}
            </span>
          </span>
        </label>

        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className={`mt-4 w-full rounded-lg px-4 py-3 font-medium transition disabled:opacity-40 ${
            dryRun ? 'bg-white/15 text-white' : 'bg-[#f5a623] text-[#0a1628]'
          }`}
        >
          {busy
            ? 'Sending...'
            : dryRun
              ? `Test (${selected.length})`
              : `Publish for real (${selected.length})`}
        </button>

        {overLimit.length > 0 && (
          <p className="mt-3 text-sm text-red-400">
            Too long for {overLimit.map((p) => p.name).join(', ')} - trim or deselect.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {results && (
          <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4">
            <h2 className="text-sm font-medium text-white/80">
              {results.every((r) => r.simulated) ? 'Dry run results' : 'Published'}
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {results.map((r) => (
                <li key={r.platform} className={r.ok ? 'text-green-400' : 'text-red-400'}>
                  {r.ok ? 'OK' : 'FAIL'} {r.platform} - {r.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
