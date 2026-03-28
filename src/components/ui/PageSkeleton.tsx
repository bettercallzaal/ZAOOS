/**
 * Reusable page skeleton for loading states.
 * Used by loading.tsx files across auth routes.
 * Server Component — no "use client" directive.
 */

interface PageSkeletonProps {
  /** Number of content block placeholders (default: 4) */
  blocks?: number;
}

export default function PageSkeleton({ blocks = 4 }: PageSkeletonProps) {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header bar placeholder */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse" />
        <div className="ml-auto h-8 w-8 bg-gray-800 rounded-lg animate-pulse" />
      </header>

      {/* Content block placeholders */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: blocks }, (_, i) => (
          <div
            key={i}
            className="rounded-lg bg-[#0d1b2a] border border-gray-800 animate-pulse"
            style={{ height: i === 0 ? '6rem' : i % 2 === 0 ? '5rem' : '4rem' }}
          />
        ))}
      </div>
    </div>
  );
}
