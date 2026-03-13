import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { AdminPanel } from './AdminPanel';

export default async function AdminPage() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    redirect('/chat');
  }
  return <AdminPanel />;
}
