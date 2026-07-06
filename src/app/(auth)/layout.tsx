import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PersistentPlayerWithRadio } from '@/components/music/PersistentPlayerWithRadio';
import { BottomNav } from '@/components/navigation/BottomNav';
import { CommandPaletteProvider } from '@/components/navigation/CommandPaletteProvider';
import PWAInstallPrompt from '@/components/navigation/PWAInstallPrompt';
import { HideOnOS } from '@/components/os/HideOnOS';
import { OSBackButton } from '@/components/os/OSBackButton';
import { LazyGlobalSearch } from '@/components/search/LazyGlobalSearch';
import { getSessionData } from '@/lib/auth/session';
import { AuthAudioProviders } from './providers';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
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
      <div>
        <HideOnOS>
          <div className="md:pt-10" />
        </HideOnOS>
        <ErrorBoundary>
          <main id="main-content">{children}</main>
        </ErrorBoundary>
        <HideOnOS>
          <Suspense fallback={null}>
            <LazyGlobalSearch />
          </Suspense>
          <CommandPaletteProvider />
          <PersistentPlayerWithRadio />
          <BottomNav />
          <PWAInstallPrompt />
        </HideOnOS>
        <OSBackButton />
      </div>
    </AuthAudioProviders>
  );
}
