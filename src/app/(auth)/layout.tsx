import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { BottomNav } from '@/components/navigation/BottomNav';

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
    <>
      {children}
      <BottomNav />
    </>
  );
}
