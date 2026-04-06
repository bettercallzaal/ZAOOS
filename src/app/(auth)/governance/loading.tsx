export default function GovernanceLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-800 rounded animate-pulse md:hidden" />
        </div>
        {/* Tab switcher skeleton */}
        <div className="flex gap-1 mt-3">
          <div className="flex-1 h-8 bg-gray-800/60 rounded-lg animate-pulse" />
          <div className="flex-1 h-8 bg-gray-800/40 rounded-lg animate-pulse" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Your Respect card skeleton */}
        <div className="rounded-xl p-5 border border-white/[0.08] bg-[#0d1b2a] animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-20 bg-gray-700 rounded" />
            <div className="h-4 w-14 bg-gray-700 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-24 bg-gray-700 rounded mb-2" />
              <div className="h-3 w-40 bg-gray-800 rounded" />
            </div>
            <div className="text-right">
              <div className="h-10 w-12 bg-gray-700 rounded mb-1" />
              <div className="h-3 w-10 bg-gray-800 rounded ml-auto" />
            </div>
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div>
          <div className="h-3 w-40 bg-gray-800 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] animate-pulse">
                <div className="h-3 w-16 bg-gray-800 rounded mb-2" />
                <div className="h-6 w-12 bg-gray-700 rounded mb-1" />
                <div className="h-2 w-20 bg-gray-800/60 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard preview skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-800 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-[#0d1b2a] animate-pulse"
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
