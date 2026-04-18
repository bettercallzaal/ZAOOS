'use client';

import { useState } from 'react';

interface RoleOption {
  value: string;
  label: string;
  hint: string;
}

interface ShiftOption {
  value: string;
  label: string;
}

export function ApplyForm({ roles, shifts }: { roles: RoleOption[]; shifts: ShiftOption[] }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleInterest, setRoleInterest] = useState('unassigned');
  const [shiftInterest, setShiftInterest] = useState('allday');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrMsg('');
    try {
      const res = await fetch('/api/stock/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          role_interest: roleInterest,
          shift_interest: shiftInterest,
          message: message || undefined,
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
          We got your application. Someone from the ZAOstock crew will follow up in the next few days with shift details and a crew kickoff message.
        </p>
        <p className="text-xs text-gray-500">
          Questions in the meantime? Reply to the confirmation email or DM on Farcaster.
        </p>
      </div>
    );
  }

  const selectedRole = roles.find((r) => r.value === roleInterest);

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
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Your name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First Last or handle"
          maxLength={200}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={200}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Phone (optional)</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Day-of only, so we can reach you fast"
          maxLength={50}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Where do you want to plug in?</label>
        <select
          value={roleInterest}
          onChange={(e) => setRoleInterest(e.target.value)}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5a623]/30"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {selectedRole && (
          <p className="text-[11px] text-gray-500 italic">{selectedRole.hint}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Shift preference</label>
        <select
          value={shiftInterest}
          onChange={(e) => setShiftInterest(e.target.value)}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5a623]/30"
        >
          {shifts.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Anything else? (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Skills, availability caveats, who referred you, why you want to help"
          rows={4}
          maxLength={1000}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={busy || !name.trim() || !email.trim()}
        className="w-full bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded-lg px-4 py-3 text-sm transition-colors"
      >
        {busy ? 'Sending...' : 'Sign me up'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-400 text-center">{errMsg || 'Something went wrong. Try again.'}</p>
      )}

      <p className="text-[11px] text-gray-600 text-center">
        We reach out within a few days. No commitment until you say yes to a specific shift.
      </p>
    </form>
  );
}
