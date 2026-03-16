'use client';

interface RespectEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  username: string | null;
  zid: number | null;
  ogRespect: number;
  zorRespect: number;
  totalRespect: number;
  firstTokenDate: string | null;
}

interface RespectStats {
  totalMembers: number;
  totalOG: number;
  totalZOR: number;
}

interface RespectLeaderboardProps {
  leaderboard: RespectEntry[];
  stats: RespectStats;
  currentFid: number;
}

export function RespectLeaderboard({ leaderboard, stats, currentFid }: RespectLeaderboardProps) {
  const myEntry = leaderboard.find((e) => e.fid === currentFid);

  return (
    <>
      {/* Your Respect card */}
      {myEntry && (
        <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#f5a623] uppercase tracking-wider">Your Respect</p>
            {myEntry.zid && (
              <span className="text-xs font-bold text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
                ZID #{myEntry.zid}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{myEntry.totalRespect.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">
                {myEntry.ogRespect > 0 && `${myEntry.ogRespect.toLocaleString()} OG`}
                {myEntry.ogRespect > 0 && myEntry.zorRespect > 0 && ' + '}
                {myEntry.zorRespect > 0 && `${myEntry.zorRespect.toLocaleString()} ZOR`}
                {myEntry.totalRespect === 0 && 'No respect earned yet'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-[#f5a623]">#{myEntry.rank}</p>
              <p className="text-xs text-gray-400">of {stats.totalMembers}</p>
            </div>
          </div>
        </div>
      )}

      {/* No wallet linked notice */}
      {!myEntry && (
        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            Your wallet isn&apos;t linked yet. Ask an admin to add your FID to the allowlist to see your Respect here.
          </p>
        </div>
      )}

      {/* Community Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-xl font-bold text-white">{stats.totalMembers}</p>
          <p className="text-xs text-gray-500 mt-1">Members</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-xl font-bold text-white">{stats.totalOG.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">OG Respect</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800 text-center">
          <p className="text-xl font-bold text-white">{stats.totalZOR.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">ZOR Respect</p>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Leaderboard</p>
          {leaderboard.map((entry) => {
            const isMe = entry.fid === currentFid;
            return (
              <div
                key={entry.fid ?? entry.wallet}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  isMe
                    ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
                    : entry.rank <= 3
                      ? 'bg-[#f5a623]/5 border-[#f5a623]/20'
                      : 'bg-[#0d1b2a] border-gray-800'
                }`}
              >
                <span className="text-lg font-bold w-8 text-center">
                  {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : entry.rank === 3 ? '\uD83E\uDD49' : entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                      {entry.name}{isMe && ' (you)'}
                    </p>
                    {entry.zid && (
                      <span className="text-[10px] text-[#f5a623]/70 font-medium flex-shrink-0">ZID #{entry.zid}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">
                      {entry.username ? `@${entry.username}` : entry.fid ? `FID ${entry.fid}` : `${entry.wallet.slice(0, 6)}...${entry.wallet.slice(-4)}`}
                    </span>
                    {entry.firstTokenDate && (
                      <span className="text-[10px] text-gray-600 flex-shrink-0">since {entry.firstTokenDate}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                    {entry.totalRespect.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.ogRespect > 0 && `${entry.ogRespect.toLocaleString()} OG`}
                    {entry.ogRespect > 0 && entry.zorRespect > 0 && ' + '}
                    {entry.zorRespect > 0 && `${entry.zorRespect.toLocaleString()} ZOR`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No respect data found.</p>
        </div>
      )}
    </>
  );
}
