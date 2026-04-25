'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PagerLite {
  slug: string;
  title: string;
  audience: string;
  purpose: string;
  body: string;
  status: 'draft' | 'review' | 'final' | 'sent' | 'archived';
  visibility: 'internal' | 'public';
  meeting_date: string | null;
  meeting_location: string | null;
  authors: string | null;
  reviewers: string | null;
}

const STATUSES: PagerLite['status'][] = ['draft', 'review', 'final', 'sent', 'archived'];
const VISIBILITIES: PagerLite['visibility'][] = ['internal', 'public'];

export function OnePagerEditor({ pager }: { pager: PagerLite }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [form, setForm] = useState({
    title: pager.title,
    audience: pager.audience,
    purpose: pager.purpose,
    body: pager.body,
    status: pager.status,
    visibility: pager.visibility,
    meeting_date: pager.meeting_date ?? '',
    meeting_location: pager.meeting_location ?? '',
    reviewers: pager.reviewers ?? '',
  });
  const [appendText, setAppendText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [shareTo, setShareTo] = useState('');

  const send = async (action: string, body: Record<string, unknown>) => {
    setSaving(action);
    setMsg(null);
    try {
      const r = await fetch(`/api/stock/team/onepagers/${pager.slug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg({ ok: false, text: j.error || 'Failed' });
        return false;
      }
      setMsg({ ok: true, text: action + ' saved' });
      router.refresh();
      return true;
    } catch {
      setMsg({ ok: false, text: 'Network error' });
      return false;
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-amber-400">Edit</h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
        >
          {open ? 'Hide' : 'Open'}
        </button>
      </div>

      {!open ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving !== null}
              onClick={() => send('status', { status: s })}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                pager.status === s
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50`}
            >
              {s}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-500">
            quick status flip - or click Open for full editor
          </span>
        </div>
      ) : (
        <div className="mt-4 space-y-5 text-sm">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Audience">
            <input
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Purpose">
            <textarea
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PagerLite['status'] })}
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Visibility">
              <select
                value={form.visibility}
                onChange={(e) =>
                  setForm({ ...form, visibility: e.target.value as PagerLite['visibility'] })
                }
                className={inputCls}
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Meeting date (YYYY-MM-DD)">
              <input
                value={form.meeting_date}
                onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                className={inputCls}
                placeholder="2026-04-28"
              />
            </Field>
            <Field label="Meeting location">
              <input
                value={form.meeting_location}
                onChange={(e) => setForm({ ...form, meeting_location: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Reviewers">
              <input
                value={form.reviewers}
                onChange={(e) => setForm({ ...form, reviewers: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Body (markdown)">
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={20}
              className={inputCls + ' font-mono text-xs leading-relaxed'}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() =>
                send('save', {
                  title: form.title,
                  audience: form.audience,
                  purpose: form.purpose,
                  body: form.body,
                  status: form.status,
                  visibility: form.visibility,
                  meeting_date: form.meeting_date || null,
                  meeting_location: form.meeting_location || null,
                  reviewers: form.reviewers || null,
                })
              }
              className="rounded-md bg-amber-500 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving === 'save' ? 'Saving...' : 'Save changes'}
            </button>
            <span className="text-[11px] text-slate-500">bumps version, logs to activity</span>
          </div>

          <hr className="border-white/5" />

          <Field label="Append to body">
            <textarea
              value={appendText}
              onChange={(e) => setAppendText(e.target.value)}
              rows={3}
              placeholder="Add a paragraph or section to the bottom..."
              className={inputCls}
            />
            <button
              type="button"
              disabled={saving !== null || !appendText.trim()}
              onClick={async () => {
                const ok = await send('append', { append: appendText });
                if (ok) setAppendText('');
              }}
              className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
            >
              {saving === 'append' ? 'Appending...' : 'Append'}
            </button>
          </Field>

          <Field label="Activity note (no body change)">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder='e.g. "Roddy confirmed Tue 4/28"'
              className={inputCls}
            />
            <button
              type="button"
              disabled={saving !== null || !noteText.trim()}
              onClick={async () => {
                const ok = await send('note', { note: noteText });
                if (ok) setNoteText('');
              }}
              className="mt-2 rounded-md border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {saving === 'note' ? 'Logging...' : 'Log note'}
            </button>
          </Field>

          <Field label="Log a share">
            <input
              value={shareTo}
              onChange={(e) => setShareTo(e.target.value)}
              placeholder='e.g. "Roddy via email"'
              className={inputCls}
            />
            <button
              type="button"
              disabled={saving !== null || !shareTo.trim()}
              onClick={async () => {
                const ok = await send('share', { share_to: shareTo });
                if (ok) setShareTo('');
              }}
              className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {saving === 'share' ? 'Logging...' : 'Log share'}
            </button>
          </Field>
        </div>
      )}

      {msg && (
        <p
          className={`mt-3 text-xs ${
            msg.ok ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
