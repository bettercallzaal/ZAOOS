'use client';

import { useState } from 'react';

interface RSVPFormProps {
  eventSlug: string;
}

export function RSVPForm({ eventSlug }: RSVPFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, eventSlug }),
      });

      if (res.status === 409) {
        setStatus('duplicate');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMsg('Network error — please try again');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-2">
        <p className="text-[#f5a623] font-bold">You&apos;re on the list!</p>
        <p className="text-sm text-gray-400 mt-1">We&apos;ll notify you when there&apos;s news.</p>
      </div>
    );
  }

  if (status === 'duplicate') {
    return (
      <div className="text-center py-2">
        <p className="text-[#f5a623] font-medium">You&apos;ve already RSVPed!</p>
        <p className="text-sm text-gray-400 mt-1">We have your info &mdash; stay tuned.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Submitting...' : 'RSVP'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs text-center">{errorMsg}</p>
      )}
    </form>
  );
}
