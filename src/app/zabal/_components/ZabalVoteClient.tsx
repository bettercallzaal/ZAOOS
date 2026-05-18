'use client';

import { useEffect, useState, useTransition } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

const MODES = [
  {
    id: 'music',
    label: 'Music',
    blurb: 'Drops, jams, mixes. Music-week focus.',
    icon: '♫',
  },
  {
    id: 'governance',
    label: 'Governance',
    blurb: 'Proposal sprints. Voting drives.',
    icon: '⚖',
  },
  {
    id: 'events',
    label: 'Events',
    blurb: 'IRL + virtual gatherings.',
    icon: '⚫',
  },
  {
    id: 'build',
    label: 'Build',
    blurb: 'Dev, agents, infra. Ship week.',
    icon: '⛏',
  },
] as const;

type Mode = (typeof MODES)[number]['id'];

interface ModeTotal {
  mode: string;
  vote_count: number;
  total_power: number;
}

interface VotePower {
  fid: number;
  username: string | null;
  power: number;
  zaoCasts: number;
  neynarScore: number;
}

export function ZabalVoteClient({ initialTotals }: { initialTotals: ModeTotal[] }) {
  const [totals, setTotals] = useState(initialTotals);
  const [fid, setFid] = useState<number | null>(null);
  const [votePower, setVotePower] = useState<VotePower | null>(null);
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = await sdk.context;
        const userFid = ctx?.user?.fid;
        if (cancelled || !userFid) return;
        setFid(userFid);

        // Pre-compute vote power (also primes the cache for /vote acceptance)
        const res = await fetch(`/api/zabal/calculate-vote-power?fid=${userFid}`);
        if (res.ok) {
          const data = (await res.json()) as VotePower;
          if (!cancelled) setVotePower(data);
        }
        await sdk.actions.ready();
      } catch (err) {
        if (!cancelled) setStatus(`miniapp init failed: ${String(err).slice(0, 80)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPower = totals.reduce((s, t) => s + Number(t.total_power || 0), 0);

  function pct(mode: Mode): number {
    const t = totals.find((x) => x.mode === mode);
    if (!t || totalPower === 0) return 0;
    return Math.round((Number(t.total_power) / totalPower) * 100);
  }

  function castVote(mode: Mode) {
    if (!fid) {
      setStatus('Open this in Farcaster to vote.');
      return;
    }
    if (!votePower) {
      setStatus('Calculating your vote power, try again in a sec.');
      return;
    }
    setStatus('Submitting...');
    startTransition(async () => {
      const res = await fetch('/api/zabal/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, mode }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        setStatus(`Vote failed (${res.status}). ${errBody.slice(0, 120)}`);
        return;
      }
      const data = await res.json();
      setCurrentMode(data.new_mode as Mode);
      setStatus(
        data.changed
          ? `Switched to ${data.new_mode} (+${data.vote_power}).`
          : `Locked in ${data.new_mode} (+${data.vote_power}).`,
      );

      // Refresh totals
      const tot = await fetch('/api/zabal/week-totals').catch(() => null);
      if (tot && tot.ok) {
        const d = (await tot.json()) as { totals: ModeTotal[] };
        if (Array.isArray(d.totals)) setTotals(d.totals);
      }
    });
  }

  return (
    <section style={{ padding: '0 2rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          background: 'rgba(20, 30, 39, 0.6)',
          border: '1px solid rgba(224, 221, 170, 0.2)',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: '0.95rem', color: '#a0a0a0' }}>
          {fid ? (
            <>
              You: <strong style={{ color: '#fff' }}>{votePower?.username ?? `fid ${fid}`}</strong>
              {' - '}vote power{' '}
              <strong style={{ color: '#e0ddaa' }}>{votePower?.power ?? '…'}</strong>
              {votePower?.zaoCasts != null && (
                <>
                  {' '}
                  <span style={{ color: '#666' }}>
                    ({votePower.zaoCasts} /zao casts, neynar {votePower.neynarScore?.toFixed?.(2)})
                  </span>
                </>
              )}
            </>
          ) : (
            'Open in Farcaster to see your vote power.'
          )}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
          Week power: <strong style={{ color: '#e0ddaa' }}>{totalPower}</strong>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {MODES.map((m) => {
          const p = pct(m.id);
          const isCurrent = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => castVote(m.id)}
              disabled={isPending}
              style={{
                cursor: isPending ? 'wait' : 'pointer',
                background: isCurrent
                  ? 'rgba(224, 221, 170, 0.15)'
                  : 'rgba(20, 30, 39, 0.6)',
                border: `1px solid ${
                  isCurrent ? '#e0ddaa' : 'rgba(224, 221, 170, 0.2)'
                }`,
                borderRadius: 16,
                padding: '1.5rem 1.25rem',
                color: '#fff',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${p}%`,
                  background:
                    'linear-gradient(90deg, rgba(224, 221, 170, 0.1), rgba(224, 221, 170, 0.02))',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                <span style={{ color: '#e0ddaa', fontWeight: 700 }}>{p}%</span>
              </div>
              <h3
                style={{
                  position: 'relative',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0.5rem 0 0.25rem',
                }}
              >
                {m.label}
              </h3>
              <p
                style={{
                  position: 'relative',
                  fontSize: '0.85rem',
                  color: '#a0a0a0',
                  margin: 0,
                }}
              >
                {m.blurb}
              </p>
            </button>
          );
        })}
      </div>

      {status && (
        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: '#e0ddaa',
            textAlign: 'center',
          }}
        >
          {status}
        </p>
      )}
    </section>
  );
}
