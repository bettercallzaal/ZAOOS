import { getSessionData } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { FractalsClient } from './FractalsClient';

export const metadata = { title: 'Fractals — ZAO OS' };

export default async function FractalsPage() {
  const session = await getSessionData();
  if (!session) redirect('/');
  const { fid, isAdmin } = session;

  return <FractalsClient currentFid={fid ?? 0} isAdmin={isAdmin ?? false} />;
}
