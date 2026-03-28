import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthAudioProviders } from './providers';
import { LazyPlayer } from '@/components/music/LazyPlayer';
import { LazyGlobalSearch } from '@/components/search/LazyGlobalSearch';

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
          <LazyGlobalSearch />
        </Suspense>
        <LazyPlayer />
        <BottomNav />
      </div>
    </AuthAudioProviders>
  );
}
