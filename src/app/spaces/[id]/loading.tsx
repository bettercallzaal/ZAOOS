export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a] px-4 py-3">
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
      </header>
      <div className="flex-1 p-4">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white/5 rounded-full animate-pulse" />
              <div className="h-3 w-14 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-48 bg-[#0d1b2a] rounded-xl border border-white/[0.08] animate-pulse" />
      </div>
    </div>
  );
}
