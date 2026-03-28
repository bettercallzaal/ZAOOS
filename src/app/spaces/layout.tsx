'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthAudioProviders } from '@/app/(auth)/providers';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LazyPlayer } from '@/components/music/LazyPlayer';
import { LazyGlobalSearch } from '@/components/search/LazyGlobalSearch';

/**
 * Spaces layout — public page with full chrome for authenticated users.
 * Guest users get the page without nav/player/audio providers.
 */
export default function SpacesLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  // Authenticated users get full layout matching (auth) pages
  if (user) {
    return (
      <AuthAudioProviders>
        <div className="md:pt-10">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Suspense fallback={null}>
            <LazyGlobalSearch />
          </Suspense>
          <LazyPlayer />
          <BottomNav />
        </div>
      </AuthAudioProviders>
    );
  }

  // Guest users get minimal layout
  return <>{children}</>;
}
