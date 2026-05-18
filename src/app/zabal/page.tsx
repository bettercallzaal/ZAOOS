import { Metadata } from 'next';
import { ZabalVoteClient } from './_components/ZabalVoteClient';
import { supabaseAdmin } from '@/lib/db/supabase';

export const metadata: Metadata = {
  title: 'ZABAL - Vote on ZAO Direction',
  description:
    'Weekly community vote on ZAO focus: Music, Governance, Events, Build. Powered by Farcaster + $ZABAL Empire.',
  openGraph: {
    title: 'ZABAL - Vote on ZAO Direction',
    description: 'Weekly community vote: Music, Governance, Events, Build.',
    url: 'https://thezao.com/zabal',
  },
};

export const revalidate = 30;

interface ModeTotal {
  mode: string;
  vote_count: number;
  total_power: number;
}

async function getWeekTotals(): Promise<ModeTotal[]> {
  const { data, error } = await supabaseAdmin.rpc('get_this_zabal_weeks_votes');
  if (error || !data) return [];
  return data as ModeTotal[];
}

interface LeaderRow {
  rank: number;
  fid: number;
  username: string | null;
  score: number;
  streak: number;
}

async function getLeaderboard(): Promise<LeaderRow[]> {
  const { data, error } = await supabaseAdmin.rpc('get_zabal_leaderboard', { p_limit: 25 });
  if (error || !data) return [];
  return data as LeaderRow[];
}

export default async function ZabalPage() {
  const [totals, leaders] = await Promise.all([getWeekTotals(), getLeaderboard()]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0a0a0a 0%, #141e27 100%)',
        color: '#ffffff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      }}
    >
      <header
        style={{
          padding: '4rem 2rem 2rem',
          textAlign: 'center',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: 900,
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #ffffff 0%, #e0ddaa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
          }}
        >
          ZABAL
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '1.1rem' }}>
          Vote weekly on ZAO direction. Mon-Sun in NYC.
        </p>
      </header>

      <ZabalVoteClient initialTotals={totals} />

      <section style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: '#e0ddaa',
          }}
        >
          Top voters
        </h2>
        <div
          style={{
            border: '1px solid rgba(224, 221, 170, 0.2)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(20, 30, 39, 0.6)' }}>
                <th style={th()}>#</th>
                <th style={th()}>Voter</th>
                <th style={th({ textAlign: 'right' })}>Score</th>
                <th style={th({ textAlign: 'right' })}>Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaders.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#a0a0a0' }}>
                    No votes yet this week. Be first.
                  </td>
                </tr>
              )}
              {leaders.map((row) => (
                <tr
                  key={row.fid}
                  style={{ borderTop: '1px solid rgba(224, 221, 170, 0.1)' }}
                >
                  <td style={td()}>{row.rank}</td>
                  <td style={td()}>{row.username ?? `fid ${row.fid}`}</td>
                  <td style={td({ textAlign: 'right' })}>{row.score}</td>
                  <td style={td({ textAlign: 'right' })}>{row.streak}w</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#a0a0a0' }}>
          Cumulative leaderboard powers the{' '}
          <a href="https://songjam.space/zabal" style={{ color: '#e0ddaa' }}>
            $ZABAL Empire
          </a>{' '}
          via Empire Builder.{' '}
          <a href="/zabal/spotlight" style={{ color: '#e0ddaa' }}>
            Member Spotlight
          </a>
        </p>
      </section>
    </main>
  );
}

function th(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#a0a0a0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    ...extra,
  };
}

function td(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    color: '#ffffff',
    ...extra,
  };
}
