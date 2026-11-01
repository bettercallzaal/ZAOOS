'use client';

import { useEffect, useState } from 'react';
import type { PublicField } from '@/lib/members/public-profile';

const GROUPS: { title: string; fields: { key: PublicField; label: string; hint?: string }[] }[] = [
  {
    title: 'About you',
    fields: [
      { key: 'username', label: 'Farcaster handle', hint: 'Also makes your profile link' },
      { key: 'avatar', label: 'Profile picture' },
      { key: 'real_name', label: 'Real name' },
      { key: 'bio', label: 'Bio' },
      { key: 'location', label: 'Location' },
      { key: 'website', label: 'Website' },
      { key: 'tags', label: 'Tags' },
    ],
  },
  {
    title: 'Links',
    fields: [
      { key: 'x', label: 'X' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'bluesky', label: 'Bluesky' },
      { key: 'soundcloud', label: 'SoundCloud' },
      { key: 'spotify', label: 'Spotify' },
      { key: 'audius', label: 'Audius' },
      { key: 'discord', label: 'Discord' },
      { key: 'ens', label: 'ENS and Basename' },
    ],
  },
  {
    title: 'In The ZAO',
    fields: [
      { key: 'membership', label: 'ZID and role' },
      { key: 'respect', label: 'Respect history' },
      { key: 'reputation', label: 'Reputation signals' },
      { key: 'artist', label: 'Artist profile' },
      { key: 'farcaster', label: 'Farcaster stats', hint: 'Casts and your FID' },
      { key: 'activity', label: 'Activity dates', hint: 'Joined and last active' },
    ],
  },
];

function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="flex h-11 w-14 flex-shrink-0 items-center justify-end disabled:opacity-40 sm:h-8"
    >
      <span
        className={`relative block h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-[#f5a623]' : 'bg-white/[0.12]'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

type Status = 'loading' | 'ready' | 'unavailable';

export function PublicProfileSection({
  wallet,
  walletHidden,
  walletSaving,
  onToggleWallet,
}: {
  wallet: string | null;
  walletHidden: boolean;
  walletSaving: boolean;
  onToggleWallet: () => void;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [fields, setFields] = useState<PublicField[]>([]);
  const [savedFields, setSavedFields] = useState<PublicField[]>([]);
  const [empty, setEmpty] = useState<string[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/members/me/public-profile', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          setStatus('unavailable');
          return;
        }
        const data = await res.json();
        setName(data.name);
        setSavedName(data.name);
        setFields(data.fields);
        setSavedFields(data.fields);
        setEmpty(data.empty);
        setMemberId(data.id ?? null);
        setHandle(data.username ?? null);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('unavailable');
      });
    return () => controller.abort();
  }, []);

  const trimmedName = name.trim();
  const isPublic = savedName.length > 0;
  const dirty =
    trimmedName !== savedName ||
    fields.length !== savedFields.length ||
    fields.some((f) => !savedFields.includes(f));

  // Matches what the server will resolve for a signed-out visitor.
  const linkKey = savedFields.includes('username') && handle ? handle : memberId;
  const copyLink = async () => {
    if (!linkKey) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/members/${encodeURIComponent(linkKey)}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice({ tone: 'error', text: 'Could not copy the link.' });
    }
  };

  const toggle = (field: PublicField) => {
    setNotice(null);
    setFields((current) =>
      current.includes(field) ? current.filter((f) => f !== field) : [...current, field],
    );
  };

  const send = async (method: 'PUT' | 'DELETE') => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch('/api/members/me/public-profile', {
        method,
        ...(method === 'PUT'
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: trimmedName, fields }),
            }
          : {}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({ tone: 'error', text: data?.error || 'Could not save. Try again.' });
        return;
      }
      setName(data.name);
      setSavedName(data.name);
      setFields(data.fields);
      setSavedFields(data.fields);
      setNotice({
        tone: 'ok',
        text:
          method === 'PUT' ? 'Saved. Live within 2 minutes.' : 'Removed. Gone within 2 minutes.',
      });
    } catch {
      setNotice({ tone: 'error', text: 'Could not save. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="public-profile-heading">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2
          id="public-profile-heading"
          className="text-xs font-normal uppercase tracking-wider text-gray-500"
        >
          Public Profile
        </h2>
        {status === 'ready' && isPublic && linkKey && (
          <button
            type="button"
            onClick={copyLink}
            className="ml-auto mr-2 min-h-8 px-1 text-[11px] text-[#f5a623] transition-colors hover:text-[#ffd700]"
          >
            {copied ? 'Link copied' : 'Copy public link'}
          </button>
        )}
        {status === 'ready' && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] ${
              isPublic
                ? 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]'
                : 'border-white/[0.08] text-gray-500'
            }`}
          >
            {isPublic ? 'Public' : 'Not public'}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1b2a]">
        {status === 'loading' && (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f5a623] border-t-transparent" />
          </div>
        )}

        {status === 'unavailable' && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            Public profiles are not available yet.
          </p>
        )}

        {status === 'ready' && (
          <>
            <div className="border-b border-white/[0.08] p-4">
              <label htmlFor="public-name" className="text-sm font-medium text-white">
                Public name <span className="font-normal text-[#f5a623]">Required</span>
              </label>
              <p id="public-name-help" className="mb-2 mt-0.5 text-xs text-gray-400">
                Your real name or a handle. Everything below is off until you turn it on.
              </p>
              <input
                id="public-name"
                type="text"
                value={name}
                maxLength={50}
                autoComplete="nickname"
                aria-describedby="public-name-help"
                onChange={(e) => {
                  setNotice(null);
                  setName(e.target.value);
                }}
                placeholder="How you want to be listed"
                className="w-full rounded-lg border border-white/[0.08] bg-[#0a1628] px-3 py-2.5 text-base text-white outline-none placeholder:text-gray-600 focus:border-[#f5a623] sm:text-sm"
              />
            </div>

            {wallet && (
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-white">Wallet</p>
                  <p className="truncate font-mono text-xs text-gray-400">
                    {wallet.slice(0, 6)}...{wallet.slice(-4)}
                  </p>
                </div>
                <Switch
                  label="Show wallet on public profile"
                  checked={!walletHidden}
                  disabled={walletSaving}
                  onChange={onToggleWallet}
                />
              </div>
            )}

            <div className="sm:grid sm:grid-cols-2 sm:gap-x-8 sm:p-4 sm:pt-2">
              {GROUPS.map((group) => (
                <fieldset
                  key={group.title}
                  className={`border-b border-white/[0.08] px-4 py-3 last:border-b-0 sm:border-b-0 sm:px-0 ${
                    group.title === 'In The ZAO' ? 'sm:col-span-2' : ''
                  }`}
                >
                  <legend className="float-left mb-1 w-full text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    {group.title}
                  </legend>
                  <div
                    className={`clear-both ${
                      group.title === 'In The ZAO' ? 'sm:grid sm:grid-cols-2 sm:gap-x-8' : ''
                    }`}
                  >
                    {group.fields.map((field) => {
                      const on = fields.includes(field.key);
                      const isEmpty = empty.includes(field.key);
                      return (
                        <div key={field.key} className="flex items-center justify-between gap-3">
                          <div className="min-w-0 py-1">
                            <p className="text-sm text-white">{field.label}</p>
                            {(isEmpty || field.hint) && (
                              <p className="text-xs text-gray-400">
                                {isEmpty ? 'Nothing added yet' : field.hint}
                              </p>
                            )}
                          </div>
                          <Switch
                            label={`Show ${field.label} on public profile`}
                            checked={on}
                            onChange={() => toggle(field.key)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p
                role="status"
                className={`text-xs empty:hidden sm:empty:block ${
                  notice?.tone === 'error' ? 'text-red-400' : 'text-[#10b981]'
                }`}
              >
                {notice?.text}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                {isPublic && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => send('DELETE')}
                    className="min-h-11 rounded-lg border border-white/[0.08] px-4 text-sm text-gray-400 transition-colors hover:text-white disabled:opacity-50 sm:min-h-9"
                  >
                    Remove public profile
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving || !trimmedName || !dirty}
                  onClick={() => send('PUT')}
                  className="min-h-11 rounded-lg bg-[#f5a623] px-5 text-sm font-medium text-[#0a1628] transition-colors hover:bg-[#ffd700] disabled:opacity-50 sm:min-h-9"
                >
                  {saving ? 'Saving...' : isPublic ? 'Save changes' : 'Make my profile public'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
