export default function SocialLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
          <div className="h-5 w-5 bg-gray-800 rounded animate-pulse" />
        </div>
        {/* View tabs skeleton */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-8 bg-gray-800/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Search bar skeleton */}
        <div className="h-10 w-full bg-[#0d1b2a] border border-gray-800 rounded-lg animate-pulse" />

        {/* Sort tabs skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-16 bg-gray-800/40 rounded-full animate-pulse" />
          ))}
        </div>

        {/* User card skeletons */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-800 bg-[#0d1b2a] animate-pulse"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0" />
            {/* Name + bio */}
            <div className="flex-1 min-w-0">
              <div className="h-4 w-28 bg-gray-700 rounded mb-1.5" />
              <div className="h-3 w-40 bg-gray-800 rounded" />
            </div>
            {/* Follow button */}
            <div className="h-7 w-16 bg-gray-700 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
