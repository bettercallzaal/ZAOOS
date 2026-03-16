import Link from 'next/link';
import { getSessionData } from '@/lib/auth/session';
import { fetchLeaderboard } from '@/lib/respect/leaderboard';
import { RespectLeaderboard } from './RespectLeaderboard';

export default async function RespectPage() {
  const session = await getSessionData();
  const currentFid = session?.fid ?? 0;

  let leaderboard;
  let stats;
  let error = '';

  try {
    const result = await fetchLeaderboard();
    leaderboard = result.leaderboard;
    stats = result.stats;
  } catch (err) {
    console.error('Respect page error:', err);
    error = 'Failed to load respect data';
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <Link href="/chat" className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="font-semibold text-sm text-gray-300">Fractal Respect</h2>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : leaderboard && stats ? (
          <RespectLeaderboard
            leaderboard={leaderboard}
            stats={stats}
            currentFid={currentFid}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No respect data found.</p>
          </div>
        )}

        <p className="text-xs text-gray-600 text-center">
          Live onchain data from Optimism. Refreshes every 5 minutes.
        </p>
      </div>
    </div>
  );
}
