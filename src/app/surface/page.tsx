import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { GENERATED_AT, ROUTES } from '@/lib/surface-map';
import SurfaceExplorer from './SurfaceExplorer';

// The route explorer - the live, clickable half of the surface map (doc 2245).
//
// WHY IT IS ADMIN-ONLY: the map lists every route AND its auth guard, including
// the ~35 that resolve as public. That is a reconnaissance aid, so it sits behind
// the same isAdmin gate as /crm. The map's VALUE (know what exists before you
// build it) is for the people who build, not for the internet.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Surface - The ZAO', robots: { index: false } };

export default async function SurfacePage() {
  const session = await getSessionData();
  if (!session?.isAdmin) redirect('/');

  return <SurfaceExplorer routes={ROUTES} generatedAt={GENERATED_AT} />;
}
