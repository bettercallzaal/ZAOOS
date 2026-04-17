import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthAudioProviders } from './providers';
import { PersistentPlayerWithRadio } from '@/components/music/PersistentPlayerWithRadio';
import { LazyGlobalSearch } from '@/components/search/LazyGlobalSearch';
import { CommandPaletteProvider } from '@/components/navigation/CommandPaletteProvider';
import PWAInstallPrompt from '@/components/navigation/PWAInstallPrompt';
import { OSBackButton } from '@/components/os/OSBackButton';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await getSessionData();
  } catch {
    // Supabase or session service down - redirect to landing with error hint
    redirect('/?error=unavailable');
  }
  if (!session) {
    redirect('/');
  }
  return (
    <AuthAudioProviders>
      {/* Skip to main content — hidden until focused by keyboard */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="md:pt-10">
        <ErrorBoundary>
          <main id="main-content" className="pb-[120px] md:pb-[64px]">
            {children}
          </main>
        </ErrorBoundary>
        <Suspense fallback={null}>
          <LazyGlobalSearch />
        </Suspense>
        <CommandPaletteProvider />
        <PersistentPlayerWithRadio />
        <BottomNav />
        <OSBackButton />
        <PWAInstallPrompt />
      </div>
    </AuthAudioProviders>
  );
}
