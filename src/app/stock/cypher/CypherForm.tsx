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
        setStatus('sent');
      }
    } catch {
      setStatus('error');
      setErrMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent rounded-xl p-6 border border-emerald-500/30 space-y-3 text-center">
        <p className="text-xs uppercase tracking-wider text-emerald-400 font-bold">You are in</p>
        <h2 className="text-xl font-bold text-white">Thanks, {name || 'friend'}.</h2>
        <p className="text-sm text-gray-300">
          Your cypher signup landed in the ZAOstock music team dashboard. DCoop or someone from the music crew will reach out with logistics and the pre-event coordination thread.
        </p>
        <p className="text-xs text-gray-500">
          Questions in the meantime? DM Zaal on Farcaster.
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
