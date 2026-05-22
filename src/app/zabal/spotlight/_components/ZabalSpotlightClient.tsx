'use client';

import { useEffect, useState, useTransition } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface Nominee {
  nominee_fid: number;
  nomination_count: number;
  reasons: string[] | null;
  username: string | null;
  pfp_url: string | null;
}

type Phase = 'nominate' | 'vote' | 'closed';

function currentPhase(): Phase {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });
  const day = fmt.format(new Date());
  if (['Mon', 'Tue', 'Wed'].includes(day)) return 'nominate';
  if (['Thu', 'Fri', 'Sat', 'Sun'].includes(day)) return 'vote';
  return 'closed';
}

export function ZabalSpotlightClient() {
  const [phase] = useState<Phase>(currentPhase());
  const [fid, setFid] = useState<number | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [nomineeInput, setNomineeInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = await sdk.context;
        const userFid = ctx?.user?.fid;
        if (cancelled) return;
        // Base App can report fid -1 before context settles (Issue #537).
        if (userFid && userFid >= 1) setFid(userFid);

        // sdk.actions.ready() is fired globally by <MiniAppReady /> in the
        // root layout - not called here, so a slow fetch never sticks the splash.
        const res = await fetch('/api/zabal/spotlight/nominees?limit=8');
        if (res.ok) {
          const data = (await res.json()) as { nominees: Nominee[] };
          if (!cancelled) setNominees(data.nominees ?? []);
        }
      } catch (err) {
        if (!cancelled) setStatus(`init failed: ${String(err).slice(0, 80)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function submitNomination() {
    if (!fid) return setStatus('Open in Farcaster to nominate.');
    const nomineeFid = Number(nomineeInput.trim());
    if (!Number.isInteger(nomineeFid) || nomineeFid <= 0) {
      return setStatus('Enter a numeric Farcaster FID.');
    }
    setStatus('Submitting...');
    startTransition(async () => {
      const res = await fetch('/api/zabal/spotlight/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominator_fid: fid,
          nominee_fid: nomineeFid,
          reason: reasonInput.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        return setStatus(`Failed (${res.status}). ${t.slice(0, 120)}`);
      }
      setStatus('Nominated.');
      setNomineeInput('');
      setReasonInput('');
    });
  }

  function castVote(nomineeFid: number) {
    if (!fid) return setStatus('Open in Farcaster to vote.');
    setStatus('Voting...');
    startTransition(async () => {
      const res = await fetch('/api/zabal/spotlight/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_fid: fid, nominee_fid: nomineeFid }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        return setStatus(`Failed (${res.status}). ${t.slice(0, 120)}`);
      }
      setStatus(`Voted for fid ${nomineeFid}.`);
    });
  }

  return (
    <section style={{ padding: '0 2rem 1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          background: 'rgba(20, 30, 39, 0.6)',
          border: '1px solid rgba(224, 221, 170, 0.2)',
          borderRadius: 12,
          padding: '1rem 1.5rem',
          marginBottom: '1.25rem',
          textAlign: 'center',
        }}
      >
        <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Current phase:</span>{' '}
        <strong style={{ color: '#e0ddaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {phase}
        </strong>
      </div>

      {phase === 'nominate' && (
        <div
          style={{
            background: 'rgba(20, 30, 39, 0.6)',
            border: '1px solid rgba(224, 221, 170, 0.2)',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#e0ddaa' }}>Nominate a ZAO member</h3>
          <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '1rem' }}>
            FID of the person who shipped this week. Add an optional 280-char reason.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="number"
              placeholder="Nominee FID"
              value={nomineeInput}
              onChange={(e) => setNomineeInput(e.target.value)}
              style={input({ flex: '0 0 180px' })}
            />
            <input
              type="text"
              placeholder="Reason (optional, 280 chars max)"
              value={reasonInput}
              maxLength={280}
              onChange={(e) => setReasonInput(e.target.value)}
              style={input({ flex: '1 1 320px' })}
            />
            <button
              onClick={submitNomination}
              disabled={isPending || !fid}
              style={primaryButton(isPending || !fid)}
            >
              Nominate
            </button>
          </div>
        </div>
      )}

      {phase === 'vote' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#e0ddaa', marginTop: 0 }}>This week’s ballot</h3>
          {nominees.length === 0 ? (
            <p style={{ color: '#a0a0a0' }}>No nominees yet for this week.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {nominees.map((n) => (
                <div
                  key={n.nominee_fid}
                  style={{
                    background: 'rgba(20, 30, 39, 0.6)',
                    border: '1px solid rgba(224, 221, 170, 0.2)',
                    borderRadius: 16,
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{n.username ?? `fid ${n.nominee_fid}`}</strong>
                    <span style={{ color: '#e0ddaa' }}>{n.nomination_count} nom.</span>
                  </div>
                  {n.reasons && n.reasons.length > 0 && (
                    <p
                      style={{
                        color: '#a0a0a0',
                        fontSize: '0.85rem',
                        marginTop: '0.5rem',
                        marginBottom: '1rem',
                      }}
                    >
                      “{n.reasons[0]}”
                    </p>
                  )}
                  <button
                    onClick={() => castVote(n.nominee_fid)}
                    disabled={isPending || !fid}
                    style={primaryButton(isPending || !fid, { width: '100%' })}
                  >
                    Vote
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status && (
        <p
          style={{
            fontSize: '0.9rem',
            color: '#e0ddaa',
            textAlign: 'center',
            marginTop: '1rem',
          }}
        >
          {status}
        </p>
      )}
    </section>
  );
}

function input(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: 'rgba(10, 10, 10, 0.6)',
    border: '1px solid rgba(224, 221, 170, 0.3)',
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    color: '#fff',
    fontSize: '0.95rem',
    ...extra,
  };
}

function primaryButton(disabled: boolean, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: disabled ? 'rgba(224, 221, 170, 0.15)' : '#e0ddaa',
    color: disabled ? '#a0a0a0' : '#0a0a0a',
    border: 'none',
    borderRadius: 8,
    padding: '0.6rem 1.25rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...extra,
  };
}
