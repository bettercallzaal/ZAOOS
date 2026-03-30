'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const THRESHOLD = 80; // px to pull before triggering refresh
const MAX_PULL = 120; // max pull distance

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable pull-to-refresh when scrolled to top
    const target = e.currentTarget;
    if (target.scrollTop > 0) return;

    touchStartY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Only pull down, not up
    if (diff < 0) {
      setPullDistance(0);
      return;
    }

    // Apply resistance (diminishing returns as you pull further)
    const distance = Math.min(diff * 0.5, MAX_PULL);
    setPullDistance(distance);
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD * 0.5); // Shrink to loading position

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
          // Small delay for visual feedback
          await new Promise((r) => setTimeout(r, 500));
        }
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, router]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ height: `${pullDistance}px` }}
        >
          <div
            className={`w-8 h-8 rounded-full border-2 border-[#f5a623] flex items-center justify-center ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              opacity: progress,
              borderTopColor: progress < 1 && !isRefreshing ? 'transparent' : undefined,
              transform: `rotate(${progress * 360}deg)`,
            }}
          >
            {isRefreshing ? (
              <div className="w-3 h-3 rounded-full border-2 border-[#f5a623] border-t-transparent animate-spin" />
            ) : (
              <svg
                className="w-4 h-4 text-[#f5a623]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                  transition: 'transform 0.1s',
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content with pull transform */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling.current ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
