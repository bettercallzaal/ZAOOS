import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ZabalSpotlightClient } from './_components/ZabalSpotlightClient';

// Per-route Mini App embed - a shared spotlight link launches the
// spotlight surface, not the root /miniapp. (Research Doc 707 P0.)
const spotlightEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og/zabal',
  button: {
    title: 'Member Spotlight',
    action: {
      type: 'launch_miniapp',
      url: 'https://zaoos.com/zabal/spotlight',
      name: 'ZABAL',
      splashImageUrl: 'https://zaoos.com/splash.png',
      splashBackgroundColor: '#0a0a0a',
    },
  },
});

export const metadata: Metadata = {
  title: 'ZABAL Spotlight - Member of the Week',
  description: 'Nominate and vote for ZAO members who shipped the most this week.',
  other: {
    'fc:miniapp': spotlightEmbed,
    'fc:frame': spotlightEmbed,
  },
};

export const revalidate = 60;

interface WinnerRow {
  fid: number;
  username: string | null;
  wins: number;
  total_votes: number;
  last_win: string;
}

async function getWinners(): Promise<WinnerRow[]> {
  const { data, error } = await supabaseAdmin.rpc('get_zabal_spotlight_leaderboard', {
    p_limit: 25,
  });
  if (error || !data) return [];
  return data as WinnerRow[];
}

export default async function ZabalSpotlightPage() {
  const winners = await getWinners();

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
      <header
        style={{
          padding: '4rem 2rem 1.5rem',
          textAlign: 'center',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <a
          href="/zabal"
          style={{ color: '#a0a0a0', fontSize: '0.85rem', textDecoration: 'none' }}
        >
          {'<-'} ZABAL
        </a>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: 900,
            letterSpacing: '0.05em',
            background: 'linear-gradient(135deg, #ffffff 0%, #e0ddaa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0.5rem 0',
          }}
        >
          Member Spotlight
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '1rem' }}>
          Mon-Wed nominate. Thu-Sun vote. Winner pinned Sun midnight NYC.
        </p>
      </header>

      <ZabalSpotlightClient />

      <section style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: '#e0ddaa',
          }}
        >
          Hall of fame
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
                <th style={th()}>Member</th>
                <th style={th({ textAlign: 'right' })}>Wins</th>
                <th style={th({ textAlign: 'right' })}>Total votes</th>
                <th style={th({ textAlign: 'right' })}>Last win</th>
              </tr>
            </thead>
            <tbody>
              {winners.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#a0a0a0' }}>
                    No spotlight winners yet. First one drops next Sunday.
                  </td>
                </tr>
              )}
              {winners.map((w) => (
                <tr key={w.fid} style={{ borderTop: '1px solid rgba(224, 221, 170, 0.1)' }}>
                  <td style={td()}>{w.username ?? `fid ${w.fid}`}</td>
                  <td style={td({ textAlign: 'right' })}>{w.wins}</td>
                  <td style={td({ textAlign: 'right' })}>{w.total_votes}</td>
                  <td style={td({ textAlign: 'right' })}>{w.last_win}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  return { padding: '0.75rem 1rem', fontSize: '0.95rem', color: '#ffffff', ...extra };
}
