'use client';

import { useMemo, useState } from 'react';

// ============================================================
// ZABAL demo - all data mock, all interaction client-side.
// Mirrors the real /zabal + /zabal/spotlight surfaces so the
// full flow is clickable with zero Supabase / zero auth.
// ============================================================

type Tab = 'focus' | 'spotlight' | 'leaderboard';
type Mode = 'music' | 'governance' | 'events' | 'build';
type Phase = 'nominate' | 'vote';

const MODES: { id: Mode; label: string; blurb: string; icon: string }[] = [
  { id: 'music', label: 'Music', blurb: 'Drops, jams, mixes. Music-week focus.', icon: '♫' },
  { id: 'governance', label: 'Governance', blurb: 'Proposal sprints. Voting drives.', icon: '⚖' },
  { id: 'events', label: 'Events', blurb: 'IRL + virtual gatherings.', icon: '◉' },
  { id: 'build', label: 'Build', blurb: 'Dev, agents, infra. Ship week.', icon: '⛏' },
];

const SEED_TOTALS: Record<Mode, number> = {
  music: 42,
  governance: 31,
  events: 18,
  build: 27,
};

interface LeaderRow {
  fid: number;
  username: string;
  score: number;
  streak: number;
}

const SEED_LEADERBOARD: LeaderRow[] = [
  { fid: 19640, username: 'bettercallzaal', score: 14, streak: 9 },
  { fid: 3, username: 'dwr', score: 12, streak: 7 },
  { fid: 99, username: 'jessepollak', score: 11, streak: 6 },
  { fid: 1325, username: 'cassie', score: 9, streak: 5 },
  { fid: 2433, username: 'seneca', score: 8, streak: 4 },
  { fid: 680, username: 'woj', score: 6, streak: 3 },
  { fid: 5097, username: 'yerbearserker', score: 5, streak: 2 },
];

interface Nominee {
  fid: number;
  username: string;
  nominations: number;
  reason: string;
}

const SEED_NOMINEES: Nominee[] = [
  { fid: 5097, username: 'yerbearserker', nominations: 6, reason: 'Shipped Empire Builder v3 leaderboard refresh.' },
  { fid: 1325, username: 'cassie', nominations: 5, reason: 'Kept haatz online all week, free Neynar reads for everyone.' },
  { fid: 2433, username: 'seneca', nominations: 3, reason: 'Ran the Tuesday fractal + wrote the recap.' },
  { fid: 680, username: 'woj', nominations: 2, reason: 'Onboarded 4 new artists into /zao.' },
];

interface WinnerRow {
  fid: number;
  username: string;
  wins: number;
  totalVotes: number;
  lastWin: string;
}

const SEED_WINNERS: WinnerRow[] = [
  { fid: 19640, username: 'bettercallzaal', wins: 3, totalVotes: 41, lastWin: '2026-05-11' },
  { fid: 1325, username: 'cassie', wins: 2, totalVotes: 28, lastWin: '2026-04-27' },
  { fid: 2433, username: 'seneca', wins: 1, totalVotes: 12, lastWin: '2026-04-13' },
];

const C = {
  bg: '#0a0a0a',
  bg2: '#141e27',
  gold: '#e0ddaa',
  goldBright: '#ffd700',
  text: '#ffffff',
  dim: '#a0a0a0',
  faint: '#666666',
  border: 'rgba(224, 221, 170, 0.2)',
  borderStrong: 'rgba(224, 221, 170, 0.5)',
  panel: 'rgba(20, 30, 39, 0.6)',
  green: '#22c55e',
};

export function ZabalDemoClient() {
  const [tab, setTab] = useState<Tab>('focus');

  // Focus vote state
  const [totals, setTotals] = useState<Record<Mode, number>>({ ...SEED_TOTALS });
  const [myMode, setMyMode] = useState<Mode | null>(null);
  const [focusStatus, setFocusStatus] = useState('');

  // Leaderboard - demo "you"
  const [myScore, setMyScore] = useState(0);
  const [board, setBoard] = useState<LeaderRow[]>([...SEED_LEADERBOARD]);

  // Spotlight state
  const [phase, setPhase] = useState<Phase>('nominate');
  const [nominees, setNominees] = useState<Nominee[]>([...SEED_NOMINEES]);
  const [nomineeInput, setNomineeInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [myVote, setMyVote] = useState<number | null>(null);
  const [spotStatus, setSpotStatus] = useState('');

  const DEMO_FID = 19640;
  const DEMO_USER = 'you (demo)';
  const DEMO_POWER = 3;

  const totalPower = useMemo(
    () => Object.values(totals).reduce((s, n) => s + n, 0),
    [totals],
  );

  function castFocusVote(mode: Mode) {
    setTotals((prev) => {
      const next = { ...prev };
      if (myMode && myMode !== mode) next[myMode] = Math.max(0, next[myMode] - DEMO_POWER);
      if (myMode !== mode) next[mode] += DEMO_POWER;
      return next;
    });
    if (myMode === mode) {
      setFocusStatus(`Locked in ${mode} (+${DEMO_POWER}).`);
    } else {
      setFocusStatus(
        myMode ? `Switched to ${mode} (+${DEMO_POWER}).` : `Locked in ${mode} (+${DEMO_POWER}).`,
      );
      // First vote this "week" bumps your leaderboard row
      if (!myMode) {
        const newScore = myScore + 1;
        setMyScore(newScore);
        setBoard((prev) => {
          const without = prev.filter((r) => r.fid !== DEMO_FID);
          return [...without, { fid: DEMO_FID, username: DEMO_USER, score: newScore, streak: 1 }];
        });
      }
    }
    setMyMode(mode);
  }

  function submitNomination() {
    const fid = Number(nomineeInput.trim());
    if (!Number.isInteger(fid) || fid <= 0) {
      setSpotStatus('Enter a numeric FID.');
      return;
    }
    if (fid === DEMO_FID) {
      setSpotStatus('Cannot nominate yourself (demo enforces the real rule).');
      return;
    }
    setNominees((prev) => {
      const existing = prev.find((n) => n.fid === fid);
      if (existing) {
        return prev.map((n) =>
          n.fid === fid ? { ...n, nominations: n.nominations + 1 } : n,
        );
      }
      return [
        ...prev,
        {
          fid,
          username: `fid ${fid}`,
          nominations: 1,
          reason: reasonInput.trim() || 'No reason given.',
        },
      ];
    });
    setSpotStatus(`Nominated fid ${fid}.`);
    setNomineeInput('');
    setReasonInput('');
  }

  function castSpotlightVote(fid: number) {
    setMyVote(fid);
    setSpotStatus(`Voted for ${nominees.find((n) => n.fid === fid)?.username ?? `fid ${fid}`}.`);
  }

  const sortedBoard = [...board].sort((a, b) => b.score - a.score || b.streak - a.streak);
  const sortedNominees = [...nominees].sort((a, b) => b.nominations - a.nominations);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${C.bg} 0%, ${C.bg2} 100%)`,
        color: C.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      }}
    >
      {/* Demo banner */}
      <div
        style={{
          background: 'rgba(245, 166, 35, 0.12)',
          borderBottom: '1px solid rgba(245, 166, 35, 0.4)',
          color: '#ffd6a3',
          textAlign: 'center',
          padding: '0.6rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 600,
        }}
      >
        DEMO MODE - all data is mock, nothing is saved. Real surfaces:{' '}
        <a href="/zabal" style={{ color: C.gold }}>/zabal</a>{' + '}
        <a href="/zabal/spotlight" style={{ color: C.gold }}>/zabal/spotlight</a>
      </div>

      <header style={{ padding: '3rem 2rem 1rem', textAlign: 'center', maxWidth: 960, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 9vw, 5rem)',
            fontWeight: 900,
            letterSpacing: '0.1em',
            background: `linear-gradient(135deg, ${C.text} 0%, ${C.gold} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ZABAL
        </h1>
        <p style={{ color: C.dim, fontSize: '1rem' }}>
          Vote weekly on ZAO direction. Recognize members who ship.
        </p>
      </header>

      {/* Tabs */}
      <nav
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          padding: '0 1rem 1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {([
          ['focus', 'Weekly Focus'],
          ['spotlight', 'Member Spotlight'],
          ['leaderboard', 'Leaderboard'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              background: tab === id ? C.gold : C.panel,
              color: tab === id ? C.bg : C.dim,
              border: `1px solid ${tab === id ? C.gold : C.border}`,
              borderRadius: 999,
              padding: '0.5rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 2rem 4rem' }}>
        {/* ---------- FOCUS VOTE ---------- */}
        {tab === 'focus' && (
          <section>
            <div style={panelBar()}>
              <span style={{ color: C.dim, fontSize: '0.95rem' }}>
                You: <strong style={{ color: C.text }}>{DEMO_USER}</strong> - vote power{' '}
                <strong style={{ color: C.gold }}>{DEMO_POWER}</strong>
              </span>
              <span style={{ color: C.dim, fontSize: '0.85rem' }}>
                Week power: <strong style={{ color: C.gold }}>{totalPower}</strong>
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              {MODES.map((m) => {
                const pct = totalPower ? Math.round((totals[m.id] / totalPower) * 100) : 0;
                const isMine = myMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => castFocusVote(m.id)}
                    style={{
                      cursor: 'pointer',
                      background: isMine ? 'rgba(224, 221, 170, 0.15)' : C.panel,
                      border: `1px solid ${isMine ? C.gold : C.border}`,
                      borderRadius: 16,
                      padding: '1.5rem 1.25rem',
                      color: C.text,
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${pct}%`,
                        background:
                          'linear-gradient(90deg, rgba(224,221,170,0.12), rgba(224,221,170,0.02))',
                        pointerEvents: 'none',
                        transition: 'width 0.3s ease',
                      }}
                    />
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                      <span style={{ color: C.gold, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <h3 style={{ position: 'relative', fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>
                      {m.label}
                    </h3>
                    <p style={{ position: 'relative', fontSize: '0.85rem', color: C.dim, margin: 0 }}>
                      {m.blurb}
                    </p>
                    <p style={{ position: 'relative', fontSize: '0.8rem', color: C.faint, marginTop: '0.5rem' }}>
                      {totals[m.id]} power{isMine ? ' - your pick' : ''}
                    </p>
                  </button>
                );
              })}
            </div>
            {focusStatus && (
              <p style={{ marginTop: '1rem', color: C.gold, textAlign: 'center', fontSize: '0.9rem' }}>
                {focusStatus}
              </p>
            )}
            <p style={{ marginTop: '1rem', color: C.faint, fontSize: '0.82rem', textAlign: 'center' }}>
              Real version: one vote per week, power from /zao casts + Neynar score, capped at 6.
            </p>
          </section>
        )}

        {/* ---------- SPOTLIGHT ---------- */}
        {tab === 'spotlight' && (
          <section>
            <div style={{ ...panelBar(), justifyContent: 'center', gap: '1rem' }}>
              <span style={{ color: C.dim, fontSize: '0.9rem' }}>Phase:</span>
              {(['nominate', 'vote'] as Phase[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  style={{
                    background: phase === p ? C.gold : 'transparent',
                    color: phase === p ? C.bg : C.dim,
                    border: `1px solid ${phase === p ? C.gold : C.border}`,
                    borderRadius: 8,
                    padding: '0.35rem 0.9rem',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {p}
                </button>
              ))}
              <span style={{ color: C.faint, fontSize: '0.78rem' }}>
                (demo toggle - real app gates by day: Mon-Wed nominate, Thu-Sun vote)
              </span>
            </div>

            {phase === 'nominate' && (
              <div
                style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <h3 style={{ marginTop: 0, color: C.gold }}>Nominate a ZAO member</h3>
                <p style={{ color: C.dim, fontSize: '0.9rem', marginBottom: '1rem' }}>
                  FID of someone who shipped this week + optional reason.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    placeholder="Nominee FID"
                    value={nomineeInput}
                    onChange={(e) => setNomineeInput(e.target.value)}
                    style={inputStyle({ flex: '0 0 160px' })}
                  />
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={reasonInput}
                    maxLength={280}
                    onChange={(e) => setReasonInput(e.target.value)}
                    style={inputStyle({ flex: '1 1 300px' })}
                  />
                  <button onClick={submitNomination} style={primaryBtn()}>
                    Nominate
                  </button>
                </div>
              </div>
            )}

            <h3 style={{ color: C.gold }}>
              {phase === 'nominate' ? 'Current nominations' : "This week's ballot"}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginTop: '0.75rem',
              }}
            >
              {sortedNominees.map((n) => (
                <div
                  key={n.fid}
                  style={{
                    background: myVote === n.fid ? 'rgba(224,221,170,0.15)' : C.panel,
                    border: `1px solid ${myVote === n.fid ? C.gold : C.border}`,
                    borderRadius: 16,
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{n.username}</strong>
                    <span style={{ color: C.gold }}>{n.nominations} nom.</span>
                  </div>
                  <p style={{ color: C.dim, fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
                    &ldquo;{n.reason}&rdquo;
                  </p>
                  {phase === 'vote' && (
                    <button
                      onClick={() => castSpotlightVote(n.fid)}
                      style={primaryBtn({ width: '100%' })}
                    >
                      {myVote === n.fid ? 'Voted' : 'Vote'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {spotStatus && (
              <p style={{ marginTop: '1rem', color: C.gold, textAlign: 'center', fontSize: '0.9rem' }}>
                {spotStatus}
              </p>
            )}

            <h3 style={{ color: C.gold, marginTop: '2rem' }}>Hall of fame</h3>
            <Table
              head={['Member', 'Wins', 'Total votes', 'Last win']}
              rows={SEED_WINNERS.map((w) => [
                w.username,
                String(w.wins),
                String(w.totalVotes),
                w.lastWin,
              ])}
              rightAlignFrom={1}
            />
          </section>
        )}

        {/* ---------- LEADERBOARD ---------- */}
        {tab === 'leaderboard' && (
          <section>
            <h3 style={{ color: C.gold, marginBottom: '0.75rem' }}>Top voters</h3>
            <Table
              head={['#', 'Voter', 'Score', 'Streak']}
              rows={sortedBoard.map((r, i) => [
                String(i + 1),
                r.username + (r.fid === DEMO_FID ? '  <- you' : ''),
                String(r.score),
                `${r.streak}w`,
              ])}
              rightAlignFrom={2}
            />
            <p style={{ marginTop: '1rem', color: C.faint, fontSize: '0.82rem' }}>
              Vote on the Weekly Focus tab - your demo row appears here after your first vote.
              Real leaderboard powers the $ZABAL Empire via Empire Builder.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

// ---------- small presentational helpers ----------

function Table({
  head,
  rows,
  rightAlignFrom,
}: {
  head: string[];
  rows: string[][];
  rightAlignFrom: number;
}) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.panel }}>
            {head.map((h, i) => (
              <th
                key={h}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: C.dim,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: i >= rightAlignFrom ? 'right' : 'left',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderTop: `1px solid rgba(224,221,170,0.1)` }}>
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    color: cell.includes('<- you') ? C.gold : C.text,
                    textAlign: ci >= rightAlignFrom ? 'right' : 'left',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function panelBar(): React.CSSProperties {
  return {
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '1rem 1.5rem',
    marginBottom: '1.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    alignItems: 'center',
    justifyContent: 'space-between',
  };
}

function inputStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: 'rgba(10,10,10,0.6)',
    border: `1px solid ${C.borderStrong}`,
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    color: C.text,
    fontSize: '0.95rem',
    ...extra,
  };
}

function primaryBtn(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: C.gold,
    color: C.bg,
    border: 'none',
    borderRadius: 8,
    padding: '0.6rem 1.25rem',
    fontWeight: 700,
    cursor: 'pointer',
    ...extra,
  };
}
