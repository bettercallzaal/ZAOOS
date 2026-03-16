export default function AuthLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header placeholder */}
      <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Content area placeholder */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-gray-800/60 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-800/40 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-800/40 rounded animate-pulse" />
        <div className="h-32 w-full bg-gray-800/30 rounded-xl animate-pulse mt-4" />
        <div className="h-32 w-full bg-gray-800/30 rounded-xl animate-pulse" />
      </div>

      {/* Bottom nav skeleton (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1b2a] border-t border-gray-800">
        <div className="flex items-center justify-around h-14 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 bg-gray-800 rounded animate-pulse" />
              <div className="w-8 h-2 bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </nav>

      {/* Top nav skeleton (desktop) */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-[#0d1b2a] border-b border-gray-800">
        <div className="flex items-center h-10 px-4 max-w-5xl mx-auto gap-4">
          <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-20 bg-gray-800/50 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
