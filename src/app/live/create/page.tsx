'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * /live/create — create a Juke live audio space from the web (doc 695, Path B).
 *
 * Posts to `/api/juke/space`, which is authorised by either an admin session
 * or the shared `JUKE_CREATE_PASSWORD`. This page uses the password path so
 * anyone on the ZAO team can spin up a space. On success it shows the
 * `/live/{id}` link to share.
 */

interface CreatedSpace {
  id: string;
  embedUrl: string;
}

type Status = 'idle' | 'creating' | 'done' | 'error';

/**
 * Convert a `<input type="datetime-local">` value (yyyy-MM-ddTHH:mm in the
 * user's local zone) into an ISO-8601 string Juke + Supabase will accept.
 * Returns null when the input is empty or unparseable.
 */
function localDateTimeToIso(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Default a `<input type="datetime-local">` to "1 hour from now, rounded up
 * to the next half hour" in the user's local zone. Pre-fills the scheduled
 * field with a sensible value so the typical "schedule for soon" case is one
 * click instead of a date-pick.
 */
function defaultScheduledLocal(): string {
  const d = new Date(Date.now() + 60 * 60_000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  // Strip seconds + the trailing Z; <input> expects local time without zone.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateLiveSpacePage() {
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledLocal, setScheduledLocal] = useState<string>(defaultScheduledLocal());
  const [announceCast, setAnnounceCast] = useState<boolean>(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [space, setSpace] = useState<CreatedSpace | null>(null);
  const [copied, setCopied] = useState(false);

  const liveUrl = space
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/live/${space.id}`
    : '';

  const createSpace = async () => {
    setStatus('creating');
    setError(null);

    let scheduledAt: string | null = null;
    if (mode === 'scheduled') {
      scheduledAt = localDateTimeToIso(scheduledLocal);
      if (!scheduledAt) {
        setError('Pick a valid date and time.');
        setStatus('error');
        return;
      }
      if (new Date(scheduledAt).getTime() <= Date.now()) {
        setError('Scheduled time must be in the future.');
        setStatus('error');
        return;
      }
    }

    try {
      const res = await fetch('/api/juke/space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          password,
          scheduledAt,
          announceCast,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(
          res.status === 401
            ? 'Wrong password.'
            : (body.error ?? 'Could not create the space.'),
        );
        setStatus('error');
        return;
      }
      setSpace(body.data as CreatedSpace);
      setStatus('done');
    } catch {
      setError('Network error - please try again.');
      setStatus('error');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(liveUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false),
    );
  };

  const reset = () => {
    setSpace(null);
    setTitle('');
    setMode('now');
    setScheduledLocal(defaultScheduledLocal());
    setAnnounceCast(false);
    setStatus('idle');
    setError(null);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628]">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/live"
            aria-label="Back to ZAO Live"
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-[#f5a623]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-white sm:text-base">Create a ZAO Live space</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-md">
          {status === 'done' && space ? (
            <div>
              <h2 className="text-2xl font-bold text-white">
                {mode === 'scheduled' ? 'Space scheduled' : 'Space created'}
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                {mode === 'scheduled'
                  ? `Set for ${new Date(localDateTimeToIso(scheduledLocal) ?? Date.now()).toLocaleString()}. Share the link - anyone with it sees a countdown until start.`
                  : 'Share this link - anyone can listen in. To speak, they sign in with Farcaster inside the space.'}
              </p>
              <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-4">
                <p className="break-all font-mono text-sm text-[#f5a623]">{liveUrl}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] transition-colors hover:bg-[#ffd700]"
                  >
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                  <Link
                    href={`/live/${space.id}`}
                    className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#f5a623]/50"
                  >
                    Open space
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-4 text-xs text-gray-500 transition-colors hover:text-[#f5a623]"
              >
                Create another
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white">Create a ZAO Live space</h2>
              <p className="mt-2 text-sm text-gray-400">
                Spin up a Farcaster-native live audio space on Juke. Enter the
                team password and a title.
              </p>

              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  createSpace();
                }}
              >
                <label htmlFor="create-password" className="text-xs font-medium text-gray-400">
                  Team password
                </label>
                <input
                  id="create-password"
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
                />

                <label htmlFor="create-title" className="mt-4 block text-xs font-medium text-gray-400">
                  Space title
                </label>
                <input
                  id="create-title"
                  type="text"
                  autoComplete="off"
                  placeholder="ZAOstock Tuesday Standup"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#f5a623]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]"
                />

                {/* Mode: now vs scheduled */}
                <fieldset className="mt-4">
                  <legend className="text-xs font-medium text-gray-400 mb-1.5">When</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'now', label: 'Open now', desc: 'Live the moment you submit' },
                        { id: 'scheduled', label: 'Schedule', desc: 'Pre-create with a start time' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setMode(opt.id);
                          if (error) setError(null);
                        }}
                        aria-pressed={mode === opt.id}
                        className={`text-left p-3 rounded-xl border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] ${
                          mode === opt.id
                            ? 'border-[#f5a623] bg-[#f5a623]/10 text-white'
                            : 'border-white/[0.08] bg-[#0a1628] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <p className="font-semibold text-white">{opt.label}</p>
                        <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {mode === 'scheduled' && (
                  <>
                    <label htmlFor="create-scheduled" className="mt-4 block text-xs font-medium text-gray-400">
                      Start time (your timezone)
                    </label>
                    <input
                      id="create-scheduled"
                      type="datetime-local"
                      value={scheduledLocal}
                      onChange={(e) => {
                        setScheduledLocal(e.target.value);
                        if (error) setError(null);
                      }}
                      className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3 text-sm text-white focus:border-[#f5a623]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]"
                    />
                    <p className="mt-1 text-[11px] text-gray-600">
                      Juke renders a countdown until {scheduledLocal ? new Date(scheduledLocal).toLocaleString() : 'the chosen time'}.
                    </p>
                  </>
                )}

                {/* Announce-cast option */}
                <label className="mt-4 flex items-start gap-2 p-3 rounded-xl border border-white/[0.08] bg-[#0a1628] cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={announceCast}
                    onChange={(e) => setAnnounceCast(e.target.checked)}
                    className="mt-1 accent-[#f5a623]"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">Announce on Farcaster</span>
                    <span className="block text-[11px] text-gray-500 leading-tight">
                      Juke posts a cast from the host account when the space goes live.
                    </span>
                  </span>
                </label>

                {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={
                    status === 'creating' ||
                    password.trim().length === 0 ||
                    title.trim().length === 0
                  }
                  className="mt-4 w-full rounded-xl bg-[#f5a623] py-3 text-sm font-semibold text-[#0a1628] transition-colors hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628]"
                >
                  {status === 'creating'
                    ? mode === 'scheduled'
                      ? 'Scheduling...'
                      : 'Creating...'
                    : mode === 'scheduled'
                      ? 'Schedule space'
                      : 'Create space'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
