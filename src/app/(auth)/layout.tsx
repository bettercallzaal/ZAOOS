import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PersistentPlayerWithRadio } from '@/components/music/PersistentPlayerWithRadio';
import { QuickAddSong } from '@/components/music/QuickAddSong';
import { GlobalSearchProvider } from '@/components/search/GlobalSearchProvider';

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
    <div className="md:pt-10">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <GlobalSearchProvider />
      <QuickAddSong />
      <PersistentPlayerWithRadio />
      <BottomNav />
    </div>
  );
}
