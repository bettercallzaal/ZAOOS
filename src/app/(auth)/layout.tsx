import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PersistentPlayer } from '@/components/music/PersistentPlayer';
import { QuickAddSong } from '@/components/music/QuickAddSong';

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
      <QuickAddSong />
      <PersistentPlayer />
      <BottomNav />
    </div>
  );
}
