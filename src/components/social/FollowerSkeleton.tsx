'use client';

export function FollowerSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 bg-gray-800 rounded w-32" />
        <div className="h-3 bg-gray-800/60 rounded w-20" />
        <div className="h-2.5 bg-gray-800/40 rounded w-48" />
      </div>
      <div className="w-20 h-7 bg-gray-800 rounded-lg flex-shrink-0" />
    </div>
  );
}

export function FollowerSkeletonList({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <FollowerSkeleton key={i} />
      ))}
    </>
  );
}
