'use client';

export function RoomCardSkeleton() {
  return (
    <div className="bg-[#1a2a4a] rounded-xl p-5 border border-white/10 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 bg-white/10 rounded w-2/3" />
        <div className="h-5 bg-white/10 rounded-full w-16" />
      </div>
      <div className="h-4 bg-white/10 rounded w-full mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
      <div className="flex gap-4 mb-3">
        <div className="h-4 bg-white/10 rounded w-24" />
        <div className="h-4 bg-white/10 rounded w-20" />
      </div>
      <div className="border-t border-white/10 pt-3 mt-3 flex justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-white/10 rounded-full" />
          <div className="h-3 bg-white/10 rounded w-16" />
        </div>
        <div className="h-3 bg-white/10 rounded w-12" />
      </div>
    </div>
  );
}
