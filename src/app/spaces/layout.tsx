'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthAudioProviders } from '@/app/(auth)/providers';

/**
 * Spaces layout — conditionally wraps with audio providers
 * when user is authenticated, so music/DJ features work.
 * Guest users get the page without audio providers.
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

  // Authenticated users get full audio providers for music/DJ features
  if (user) {
    return <AuthAudioProviders>{children}</AuthAudioProviders>;
  }

  // Guest users get the page without audio providers
  return <>{children}</>;
}
