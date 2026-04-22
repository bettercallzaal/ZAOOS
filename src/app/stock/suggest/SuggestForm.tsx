'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SuggestForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!suggestion.trim()) return;
    setBusy(true);
    setErrMsg('');
    try {
      const res = await fetch('/api/stock/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          contact: contact || undefined,
          suggestion,
          hp,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setStatus('error');
        setErrMsg(d.error || 'Submission failed');
      } else {
        setStatus('sent');
        setSuggestion('');
        setName('');
        setContact('');
        setTimeout(() => {
          router.refresh();
          setStatus('idle');
        }, 1500);
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
      <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent rounded-xl p-6 border border-emerald-500/30 text-center">
        <p className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Thanks</p>
        <p className="text-sm text-gray-300 mt-2">
          Suggestion submitted. The team sees it in the dashboard. Refreshing the list now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-3">
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          maxLength={200}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Contact (optional)"
          maxLength={200}
          className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
      </div>
      <textarea
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        placeholder="Your suggestion..."
        required
        rows={4}
        maxLength={2000}
        className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
      />
      <button
        type="submit"
        disabled={busy || !suggestion.trim()}
        className="w-full bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {busy ? 'Sending...' : 'Drop suggestion'}
      </button>
      {status === 'error' && <p className="text-xs text-red-400 text-center">{errMsg}</p>}
    </form>
  );
}
