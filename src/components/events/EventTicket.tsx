'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import type { ZaoEvent } from '@/lib/unlock/events';

interface EventTicketProps {
  event: ZaoEvent;
}

type RsvpState = 'idle' | 'saving' | 'done' | 'error';
type CheckState = 'idle' | 'checking' | 'holds' | 'missing' | 'error';

export function EventTicket({ event }: EventTicketProps) {
  const { address } = useAccount();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rsvp, setRsvp] = useState<RsvpState>('idle');
  const [rsvpMsg, setRsvpMsg] = useState('');

  const [check, setCheck] = useState<CheckState>('idle');
  const [checkMsg, setCheckMsg] = useState('');

  async function submitRsvp(e: React.FormEvent) {
    e.preventDefault();
    setRsvp('saving');
    setRsvpMsg('');
    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, eventSlug: event.slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRsvp('error');
        setRsvpMsg(data.error ?? 'Could not save your RSVP.');
        return;
      }
      setRsvp('done');
      setRsvpMsg('You are on the list. Watch your email for the ticket.');
    } catch {
      setRsvp('error');
      setRsvpMsg('Network error. Try again.');
    }
  }

  async function checkTicket() {
    if (!address) return;
    setCheck('checking');
    setCheckMsg('');
    try {
      const res = await fetch('/api/events/verify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug: event.slug, wallet: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheck('error');
        setCheckMsg(data.error ?? 'Could not check your ticket.');
        return;
      }
      if (data.holdsTicket) {
        setCheck('holds');
        setCheckMsg('CONFIRMED - your wallet holds the ticket.');
      } else {
        setCheck('missing');
        setCheckMsg('No ticket found for this wallet yet.');
      }
    } catch {
      setCheck('error');
      setCheckMsg('Network error. Try again.');
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[#f5a623]">{event.title}</h1>
        {event.description ? <p className="text-sm text-gray-300">{event.description}</p> : null}
        {event.location ? <p className="text-xs text-gray-400">{event.location}</p> : null}
      </header>

      {/* Get the ticket - hosted Unlock event page */}
      <section className="rounded-lg border border-[#1e2d40] bg-[#0a1628] p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-200">Get the ticket</h2>
        {event.unlock_event_url ? (
          <a
            href={event.unlock_event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-md bg-[#f5a623] px-4 py-3 text-center text-sm font-semibold text-[#0a1628] transition hover:opacity-90"
          >
            Get the ticket
          </a>
        ) : (
          <p className="text-xs text-gray-400">
            Ticket opens soon. Add your email below and we will send it to you.
          </p>
        )}
      </section>

      {/* Email RSVP - existing flow, kept */}
      <section className="rounded-lg border border-[#1e2d40] bg-[#0a1628] p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-200">RSVP by email</h2>
        {rsvp === 'done' ? (
          <p className="text-sm text-[#f5a623]">{rsvpMsg}</p>
        ) : (
          <form onSubmit={submitRsvp} className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-[#1e2d40] bg-[#0d1a2d] px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-[#f5a623] focus:outline-none"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-md border border-[#1e2d40] bg-[#0d1a2d] px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-[#f5a623] focus:outline-none"
            />
            <button
              type="submit"
              disabled={rsvp === 'saving'}
              className="w-full rounded-md border border-[#f5a623] px-4 py-2 text-sm font-semibold text-[#f5a623] transition hover:bg-[#f5a623] hover:text-[#0a1628] disabled:opacity-50"
            >
              {rsvp === 'saving' ? 'Saving...' : 'RSVP'}
            </button>
            {rsvp === 'error' ? <p className="text-xs text-red-400">{rsvpMsg}</p> : null}
          </form>
        )}
      </section>

      {/* Check ownership - for connected wallet */}
      {event.lock_address ? (
        <section className="rounded-lg border border-[#1e2d40] bg-[#0a1628] p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-200">Check my ticket</h2>
          {address ? (
            <button
              type="button"
              onClick={checkTicket}
              disabled={check === 'checking'}
              className="w-full rounded-md border border-[#1e2d40] px-4 py-2 text-sm text-gray-200 transition hover:border-[#f5a623] disabled:opacity-50"
            >
              {check === 'checking' ? 'Checking...' : 'Check my ticket'}
            </button>
          ) : (
            <p className="text-xs text-gray-400">Connect your wallet to check.</p>
          )}
          {checkMsg ? (
            <p className={`mt-2 text-xs ${check === 'holds' ? 'text-[#f5a623]' : 'text-gray-400'}`}>
              {checkMsg}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
