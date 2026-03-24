import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PersistentPlayerWithRadio } from '@/components/music/PersistentPlayerWithRadio';
import { QuickAddSong } from '@/components/music/QuickAddSong';
import { GlobalSearchProvider } from '@/components/search/GlobalSearchProvider';
import { AuthAudioProviders } from './providers';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionData();
  if (!session) {
    redirect('/');
  }
  return (
    <AuthAudioProviders>
      <div className="md:pt-10">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Suspense fallback={null}>
          <GlobalSearchProvider />
        </Suspense>
        <Suspense fallback={null}>
          <QuickAddSong />
        </Suspense>
        <PersistentPlayerWithRadio />
        <BottomNav />
      </div>
    </AuthAudioProviders>
  );
}
