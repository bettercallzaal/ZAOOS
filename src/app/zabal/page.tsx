import { Metadata } from 'next';
import { ZabalVoteClient } from './_components/ZabalVoteClient';
import { ZabalNav, ZabalTokenPanel, ZabalEcosystem, ZabalAbout } from './_components/ZabalHub';
import { supabaseAdmin } from '@/lib/db/supabase';

// Per-route Mini App embed so a shared zaoos.com/zabal link launches the
// ZABAL hub - not the root /miniapp. (Research Doc 707 P0.)
const zabalEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og/zabal',
  button: {
    title: 'Vote on ZAO',
    action: {
      type: 'launch_miniapp',
      url: 'https://zaoos.com/zabal',
      name: 'ZABAL',
      splashImageUrl: 'https://zaoos.com/splash.png',
      splashBackgroundColor: '#0a0a0a',
    },
  },
});

export const metadata: Metadata = {
  title: 'ZABAL - Vote on ZAO Direction',
  description:
    'The ZABAL hub - vote weekly on ZAO focus (Music, Governance, Events, Build), hold $ZABAL, and explore the ecosystem.',
  openGraph: {
    title: 'ZABAL - Vote on ZAO Direction',
    description: 'Weekly community vote, $ZABAL token, and the whole ZABAL ecosystem.',
    url: 'https://zaoos.com/zabal',
  },
  other: {
    'fc:miniapp': zabalEmbed,
    'fc:frame': zabalEmbed,
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

interface WinnerRow {
  username: string | null;
  fid: number;
  wins: number;
}

async function getTopWinner(): Promise<WinnerRow | null> {
  const { data, error } = await supabaseAdmin.rpc('get_zabal_spotlight_leaderboard', { p_limit: 1 });
  if (error || !data || (data as WinnerRow[]).length === 0) return null;
  return (data as WinnerRow[])[0];
}

export default async function ZabalPage() {
  const [totals, leaders, topWinner] = await Promise.all([
    getWeekTotals(),
    getLeaderboard(),
    getTopWinner(),
  ]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #141e27 100%)',
        color: '#ffffff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      }}
    >
      <ZabalNav />

      {/* Hero - identity above the fold */}
      <header
        style={{
          padding: '3rem 2rem 1.5rem',
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
            marginBottom: '0.75rem',
          }}
        >
          ZABAL
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
          The umbrella over everything Zaal builds - The ZAO, WaveWarZ, ZAO Festivals, and the
          $ZABAL economy. Vote weekly on where it goes.
        </p>
      </header>

      {/* Section 2 - the live weekly vote */}
      <div id="vote">
        <ZabalVoteClient initialTotals={totals} />
      </div>

      {/* Section 3 - $ZABAL token */}
      <ZabalTokenPanel />

      {/* Section 4 - ecosystem portals */}
      <ZabalEcosystem />

      {/* Section 5 - Member Spotlight summary */}
      <section id="spotlight" style={{ padding: '2.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#e0ddaa' }}>
          Member Spotlight
        </h2>
        <a
          href="/zabal/spotlight"
          style={{
            display: 'block',
            background: 'rgba(20, 30, 39, 0.6)',
            border: '1px solid rgba(224, 221, 170, 0.2)',
            borderRadius: 16,
            padding: '1.5rem',
            textDecoration: 'none',
            color: '#fff',
          }}
        >
          <p style={{ margin: 0, fontSize: '1rem' }}>
            {topWinner
              ? `Latest spotlight winner: ${topWinner.username ?? `fid ${topWinner.fid}`} (${topWinner.wins} win${topWinner.wins === 1 ? '' : 's'}).`
              : 'Weekly recognition for ZAO members who ship.'}
          </p>
          <p style={{ margin: '0.5rem 0 0', color: '#e0ddaa', fontSize: '0.9rem' }}>
            Nominate Mon-Wed, vote Thu-Sun -&gt;
          </p>
        </a>
      </section>

      {/* Section 6 - leaderboard */}
      <section id="leaderboard" style={{ padding: '0 2rem 2rem', maxWidth: 960, margin: '0 auto' }}>
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
                <tr key={row.fid} style={{ borderTop: '1px solid rgba(224, 221, 170, 0.1)' }}>
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
          via Empire Builder.
        </p>
      </section>

      {/* Section 7 - about + socials */}
      <ZabalAbout />
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
