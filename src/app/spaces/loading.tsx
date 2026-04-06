export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] p-4">
      <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 bg-[#0d1b2a] rounded-xl animate-pulse border border-white/[0.08]" />
        ))}
      </div>
    </div>
  );
}
