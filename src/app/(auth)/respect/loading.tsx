export default function RespectLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="w-5 h-5 bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-28 bg-gray-800 rounded animate-pulse" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Your Respect card skeleton */}
        <div className="rounded-xl p-5 border border-gray-800 bg-[#0d1b2a] animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-20 bg-gray-700 rounded" />
            <div className="h-4 w-14 bg-gray-700 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-24 bg-gray-700 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-800 rounded" />
            </div>
            <div className="text-right">
              <div className="h-10 w-12 bg-gray-700 rounded mb-1" />
              <div className="h-3 w-10 bg-gray-800 rounded ml-auto" />
            </div>
          </div>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800 animate-pulse">
              <div className="h-6 w-10 bg-gray-700 rounded mx-auto mb-2" />
              <div className="h-3 w-14 bg-gray-800 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Leaderboard label */}
        <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />

        {/* Leaderboard rows skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-800 bg-[#0d1b2a] animate-pulse"
            >
              <div className="w-8 h-6 bg-gray-700 rounded" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-28 bg-gray-700 rounded mb-1.5" />
                <div className="h-3 w-20 bg-gray-800 rounded" />
              </div>
              <div className="text-right">
                <div className="h-4 w-12 bg-gray-700 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
