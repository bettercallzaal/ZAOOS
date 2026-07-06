'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { InteractionType, Visibility } from '@/lib/crm/types';

const INTERACTION_TYPES: InteractionType[] = [
  'meeting',
  'call',
  'email',
  'message',
  'gcal',
  'github',
  'note',
];

const inputCls =
  'w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#f5a623] focus:outline-none';
const labelCls = 'block text-xs font-medium text-white/60 mb-1';

export default function CrmAddForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // contact fields
  const [name, setName] = useState('');
  const [farcaster, setFarcaster] = useState('');
  const [x, setX] = useState('');
  const [role, setRole] = useState('');
  const [org, setOrg] = useState('');
  const [howWeMet, setHowWeMet] = useState('');
  const [contactPublicSummary, setContactPublicSummary] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // interaction fields
  const [type, setType] = useState<InteractionType>('note');
  const [title, setTitle] = useState('');
  const [intPublicSummary, setIntPublicSummary] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');

  function reset() {
    setName('');
    setFarcaster('');
    setX('');
    setRole('');
    setOrg('');
    setHowWeMet('');
    setContactPublicSummary('');
    setEmail('');
    setLocation('');
    setIsPublic(false);
    setType('note');
    setTitle('');
    setIntPublicSummary('');
    setPrivateNotes('');
    setVisibility('private');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!name.trim()) {
      setErr('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        contact: {
          name: name.trim(),
          farcaster_handle: farcaster.trim() || undefined,
          x_handle: x.trim() || undefined,
          role: role.trim() || undefined,
          org: org.trim() || undefined,
          how_we_met: howWeMet.trim() || undefined,
          public_summary: contactPublicSummary.trim() || undefined,
          email: email.trim() || undefined,
          location: location.trim() || undefined,
          is_public: isPublic,
        },
        interaction: {
          type,
          title: title.trim() || undefined,
          public_summary: intPublicSummary.trim() || undefined,
          private_notes: privateNotes.trim() || undefined,
          visibility,
        },
      };
      const res = await fetch('/api/crm/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setMsg(`Saved ${name.trim()}.`);
      reset();
      router.refresh();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] hover:opacity-90"
      >
        + Add contact / log interaction
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Add contact + log interaction</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-white/40 hover:text-white/70"
        >
          close
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Name *</label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ryan Kagy"
          />
        </div>
        <div>
          <label className={labelCls}>Farcaster handle</label>
          <input
            className={inputCls}
            value={farcaster}
            onChange={(e) => setFarcaster(e.target.value)}
            placeholder="rskagy"
          />
        </div>
        <div>
          <label className={labelCls}>X handle</label>
          <input className={inputCls} value={x} onChange={(e) => setX(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <input
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Founder"
          />
        </div>
        <div>
          <label className={labelCls}>Org</label>
          <input
            className={inputCls}
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Bonfires"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>How we met</label>
          <input
            className={inputCls}
            value={howWeMet}
            onChange={(e) => setHowWeMet(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Public summary (shows on /network)</label>
          <input
            className={inputCls}
            value={contactPublicSummary}
            onChange={(e) => setContactPublicSummary(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Email (private)</label>
          <input
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>
        <div>
          <label className={labelCls}>Location (private)</label>
          <input
            className={inputCls}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-[#f5a623]"
          />
          Show this contact publicly on /network
        </label>
      </div>

      <div className="my-4 border-t border-white/10" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Interaction type</label>
          <select
            className={inputCls}
            value={type}
            onChange={(e) => setType(e.target.value as InteractionType)}
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#0a1628]">
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Visibility</label>
          <select
            className={inputCls}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
          >
            <option value="private" className="bg-[#0a1628]">
              private
            </option>
            <option value="public" className="bg-[#0a1628]">
              public
            </option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Title</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Intro call"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>
            Public summary (shows on /network if interaction is public)
          </label>
          <input
            className={inputCls}
            value={intPublicSummary}
            onChange={(e) => setIntPublicSummary(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Private notes</label>
          <textarea
            className={inputCls}
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      {msg && <p className="mt-3 text-sm text-[#f5a623]">{msg}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
