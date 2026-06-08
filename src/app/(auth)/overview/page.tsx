import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import OverviewPanel from './OverviewPanel';

export const metadata: Metadata = {
  title: 'Project Overview - ZAO OS',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    redirect('/home');
  }
  return <OverviewPanel />;
}
