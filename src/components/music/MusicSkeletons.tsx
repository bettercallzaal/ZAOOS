'use client';

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const BASE_COLOR = '#1a2a3a';
const HIGHLIGHT_COLOR = '#243447';

/** Matches MusicQueueTrackCard layout: art + title/artist + duration */
export function TrackCardSkeleton() {
  return (
    <SkeletonTheme baseColor={BASE_COLOR} highlightColor={HIGHLIGHT_COLOR}>
      <div className="flex items-center gap-3 p-3">
        <Skeleton width={48} height={48} borderRadius={8} />
        <div className="flex-1 min-w-0">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} className="mt-1" />
        </div>
        <Skeleton width={32} height={12} />
      </div>
    </SkeletonTheme>
  );
}

/** Matches NowPlayingHero active layout: large art + text + progress bar */
export function NowPlayingHeroSkeleton() {
  return (
    <SkeletonTheme baseColor={BASE_COLOR} highlightColor={HIGHLIGHT_COLOR}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b2a] to-[#1a2a3a] border border-gray-800">
        <div className="relative flex items-center gap-4 p-4">
          <Skeleton width={80} height={80} borderRadius={12} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} className="mt-1.5" />
            <Skeleton
              width="100%"
              height={4}
              borderRadius={2}
              className="mt-3"
            />
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}

/** Matches PillarCard layout: icon + label + badge */
export function PillarCardSkeleton() {
  return (
    <SkeletonTheme baseColor={BASE_COLOR} highlightColor={HIGHLIGHT_COLOR}>
      <div className="flex items-center gap-3 p-3">
        <Skeleton width={48} height={48} borderRadius={12} />
        <div className="flex-1 min-w-0">
          <Skeleton width="50%" height={14} />
        </div>
        <Skeleton width={28} height={18} borderRadius={9} />
      </div>
    </SkeletonTheme>
  );
}

/** A 2x3 grid of album-art-sized skeletons with title text beneath each */
export function MusicGridSkeleton() {
  return (
    <SkeletonTheme baseColor={BASE_COLOR} highlightColor={HIGHLIGHT_COLOR}>
      <div className="grid grid-cols-2 gap-3 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton
              containerClassName="block w-full"
              className="!block"
              style={{ aspectRatio: '1 / 1', width: '100%' }}
              borderRadius={8}
            />
            <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}
