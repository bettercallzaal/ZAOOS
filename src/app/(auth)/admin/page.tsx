import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { AdminPanel } from './AdminPanel';

export const metadata: Metadata = { title: 'Admin - ZAO OS', robots: { index: false } };

export default async function AdminPage() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    redirect('/chat');
  }
  return <AdminPanel />;
}
