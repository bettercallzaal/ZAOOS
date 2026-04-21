'use client';

import { useState } from 'react';

const ROLE_OPTIONS = [
  { value: 'Vocalist / Rapper', label: 'Vocalist / Rapper' },
  { value: 'Producer', label: 'Producer (laptop + beats)' },
  { value: 'Instrumentalist - guitar', label: 'Guitar' },
  { value: 'Instrumentalist - bass', label: 'Bass' },
  { value: 'Instrumentalist - keys', label: 'Keys / Piano' },
  { value: 'Instrumentalist - horns', label: 'Horns' },
  { value: 'Instrumentalist - drums', label: 'Drums / Percussion' },
  { value: 'DJ', label: 'DJ' },
  { value: 'Spoken word / poet', label: 'Spoken word / poet' },
  { value: 'Other', label: 'Other (tell us below)' },
];

export function CypherForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [socials, setSocials] = useState('');
  const [roleSelect, setRoleSelect] = useState(ROLE_OPTIONS[0].value);
  const [roleCustom, setRoleCustom] = useState('');
  const [notes, setNotes] = useState('');
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrMsg('');
    const cypherRole = roleSelect === 'Other' ? roleCustom.trim() : roleSelect;
    try {
      const res = await fetch('/api/stock/cypher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          socials: socials || undefined,
          cypher_role: cypherRole,
          notes: notes || undefined,
          hp,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setStatus('error');
        setErrMsg(d.error || 'Submission failed');
      } else {
        const d = await res.json();
        if (d.editUrl) setEditUrl(d.editUrl);
        if (d.publicUrl) setPublicUrl(d.publicUrl);
        setStatus('sent');
      }
    } catch {
      setStatus('error');
      setErrMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  function copyEdit() {
    const abs = typeof window !== 'undefined' ? `${window.location.origin}${editUrl}` : editUrl;
    navigator.clipboard.writeText(abs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (status === 'sent') {
    return (
      <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent rounded-xl p-6 border border-emerald-500/30 space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-emerald-400 font-bold">You are in</p>
          <h2 className="text-xl font-bold text-white mt-1">Thanks, {name || 'friend'}.</h2>
          <p className="text-sm text-gray-300 mt-2">
            Your cypher signup landed in the ZAOstock music team dashboard. DCoop or someone from the music crew will reach out with logistics.
          </p>
        </div>

        {editUrl && (
          <div className="bg-[#0a1628] border border-[#f5a623]/30 rounded-lg p-4 space-y-3">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-[#f5a623] font-bold">Next step: earn your first ZAOfestivals Point</p>
              <p className="text-xs text-gray-300 mt-1">
                Claim your artist profile, add a bio, earn 1 point. Complete the contributor path to be eligible to work the event on Oct 3.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={editUrl}
                className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2.5 text-sm transition-colors text-center"
              >
                Claim + edit my profile -&gt;
              </a>
              <button
                onClick={copyEdit}
                className="text-xs text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded px-3 py-2 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy the private edit link'}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center">
              Save this link. Anyone with it can edit your page. Your public page is{' '}
              {publicUrl && <a href={publicUrl} className="text-[#f5a623] hover:text-[#ffd700]">{publicUrl}</a>}
            </p>
          </div>
        )}

        <p className="text-[11px] text-gray-500 text-center">
          Questions? DM Zaal on Farcaster.
        </p>
      </div>
    );
  }

  const needsCustomRole = roleSelect === 'Other';

  return (
    <form onSubmit={submit} className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-4">
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Name or artist handle</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="How the cypher track will credit you"
          maxLength={200}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Email (optional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="We follow up here"
          maxLength={200}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Socials or music links</label>
        <input
          value={socials}
          onChange={(e) => setSocials(e.target.value)}
          placeholder="X, Farcaster, Spotify, Soundcloud, website"
          maxLength={500}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">What do you bring to the cypher?</label>
        <select
          value={roleSelect}
          onChange={(e) => setRoleSelect(e.target.value)}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5a623]/30"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {needsCustomRole && (
          <input
            value={roleCustom}
            onChange={(e) => setRoleCustom(e.target.value)}
            placeholder="Tell us exactly what you bring"
            maxLength={200}
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            required
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Anything else? (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Genre, references, other artists you want to work with, equipment you bring, anything else"
          rows={4}
          maxLength={1000}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={busy || !name.trim() || (needsCustomRole && !roleCustom.trim())}
        className="w-full bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded-lg px-4 py-3 text-sm transition-colors"
      >
        {busy ? 'Sending...' : 'I want in on the cypher'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-400 text-center">{errMsg || 'Something went wrong. Try again.'}</p>
      )}

      <p className="text-[11px] text-gray-600 text-center">
        The music team reaches out within a few days with the pre-event coordination thread.
      </p>
    </form>
  );
}
