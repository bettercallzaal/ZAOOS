'use client';

import { useState, useCallback } from 'react';

interface Contact {
  id: string;
  name: string;
  handle: string | null;
  category: string | null;
  met_at: string | null;
  organization: string | null;
  location: string | null;
  location_2: string | null;
  notes: string | null;
  can_support: string | null;
  background: string | null;
  extra: string | null;
  score: number;
  checked: boolean;
  first_met: string | null;
  last_interaction: string | null;
  source: string | null;
  fid: number | null;
  created_at: string;
  updated_at: string;
}

interface ContactRowProps {
  contact: Contact;
  onUpdate: (updated: Contact) => void;
}

function scoreColor(score: number): string {
  if (score > 2) return 'bg-green-500/15 text-green-400 border-green-500/30';
  if (score >= 1) return 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/30';
  return 'bg-white/5 text-white/40 border-white/10';
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const EDITABLE_FIELDS = [
  { key: 'name', label: 'Name', type: 'input' },
  { key: 'handle', label: 'Handle', type: 'input' },
  { key: 'category', label: 'Category', type: 'input' },
  { key: 'organization', label: 'Organization', type: 'input' },
  { key: 'met_at', label: 'Met At', type: 'input' },
  { key: 'first_met', label: 'First Met', type: 'input' },
  { key: 'last_interaction', label: 'Last Interaction', type: 'input' },
  { key: 'location', label: 'Location', type: 'input' },
  { key: 'location_2', label: 'Location 2', type: 'input' },
  { key: 'source', label: 'Source', type: 'input' },
  { key: 'score', label: 'Score', type: 'input' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
  { key: 'can_support', label: 'Can Support', type: 'textarea' },
  { key: 'background', label: 'Background', type: 'textarea' },
  { key: 'extra', label: 'Extra', type: 'textarea' },
] as const;

type EditableKey = (typeof EDITABLE_FIELDS)[number]['key'];

export function ContactRow({ contact, onUpdate }: ContactRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = useCallback(() => {
    const initial: Record<string, string> = {};
    for (const f of EDITABLE_FIELDS) {
      const val = contact[f.key as EditableKey];
      initial[f.key] = val !== null && val !== undefined ? String(val) : '';
    }
    setForm(initial);
    setEditing(true);
    setError(null);
  }, [contact]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setError(null);
  }, []);

  const saveEdit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { id: contact.id };
      for (const f of EDITABLE_FIELDS) {
        const raw = form[f.key] ?? '';
        if (f.key === 'score') {
          payload[f.key] = raw === '' ? 0 : parseFloat(raw);
        } else {
          payload[f.key] = raw.trim() === '' ? null : raw.trim();
        }
      }
      const res = await fetch('/api/admin/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Save failed');
      }
      const j = await res.json() as { contact: Contact };
      onUpdate(j.contact);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [contact.id, form, onUpdate]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleExpanded = useCallback(() => {
    if (!editing) setExpanded(prev => !prev);
  }, [editing]);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-[#1a2a4a] transition-all">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
        aria-expanded={expanded}
      >
        {/* Name + handle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white truncate">{contact.name}</span>
            {contact.handle && (
              <span className="text-sm text-white/40 truncate">@{contact.handle}</span>
            )}
          </div>
          {contact.met_at && (
            <div className="text-xs text-white/30 mt-0.5 truncate">{contact.met_at}</div>
          )}
        </div>

        {/* Right-side pills */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {contact.first_met && (
            <span className="hidden sm:inline text-xs text-white/30">{relativeTime(contact.first_met)}</span>
          )}
          {contact.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#0a1628] border border-white/10 text-white/50">
              {contact.category}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${scoreColor(contact.score)}`}>
            {contact.score.toFixed(1)}
          </span>
          <svg
            className={`w-4 h-4 text-white/30 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          {editing ? (
            /* Edit mode */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EDITABLE_FIELDS.filter(f => f.type === 'input').map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-white/40 mb-1">{f.label}</label>
                    <input
                      type="text"
                      value={form[f.key] ?? ''}
                      onChange={e => handleFieldChange(f.key, e.target.value)}
                      className="w-full bg-[#0a1628] border border-white/15 rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50"
                    />
                  </div>
                ))}
              </div>
              {EDITABLE_FIELDS.filter(f => f.type === 'textarea').map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-white/40 mb-1">{f.label}</label>
                  <textarea
                    value={form[f.key] ?? ''}
                    onChange={e => handleFieldChange(f.key, e.target.value)}
                    rows={3}
                    className="w-full bg-[#0a1628] border border-white/15 rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 resize-y"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#f5a623]/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-white/5 text-white/60 text-sm hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-4">
              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                {contact.organization && (
                  <DetailItem label="Organization" value={contact.organization} />
                )}
                {contact.source && (
                  <DetailItem label="Source" value={contact.source} />
                )}
                {contact.fid && (
                  <DetailItem label="FID" value={String(contact.fid)} />
                )}
                {contact.first_met && (
                  <DetailItem label="First Met" value={`${formatDate(contact.first_met)} (${relativeTime(contact.first_met)})`} />
                )}
                {contact.last_interaction && (
                  <DetailItem label="Last Interaction" value={`${formatDate(contact.last_interaction)} (${relativeTime(contact.last_interaction)})`} />
                )}
                {contact.location && (
                  <DetailItem label="Location" value={contact.location} />
                )}
                {contact.location_2 && (
                  <DetailItem label="Location 2" value={contact.location_2} />
                )}
                <DetailItem label="Checked" value={contact.checked ? 'Yes' : 'No'} />
              </div>

              {/* Long-form fields */}
              {contact.notes && <LongField label="Notes" value={contact.notes} />}
              {contact.can_support && <LongField label="Can Support" value={contact.can_support} />}
              {contact.background && <LongField label="Background" value={contact.background} />}
              {contact.extra && <LongField label="Extra" value={contact.extra} />}

              {/* Edit button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={startEdit}
                  className="text-xs px-3 py-1.5 rounded bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-white/30">{label}</div>
      <div className="text-sm text-white/80 mt-0.5">{value}</div>
    </div>
  );
}

function LongField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-white/30 mb-1">{label}</div>
      <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}
