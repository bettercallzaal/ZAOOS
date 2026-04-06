export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-40 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-[#f5a623]/20 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white/5 rounded-full" />
              <div className="h-4 w-32 bg-white/5 rounded" />
            </div>
            <div className="h-3 w-48 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
