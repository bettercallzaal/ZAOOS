'use client';

import dynamic from 'next/dynamic';

const GlobalSearchProvider = dynamic(
  () => import('@/components/search/GlobalSearchProvider').then(m => ({ default: m.GlobalSearchProvider })),
  { ssr: false },
);

export function LazyGlobalSearch() {
  return <GlobalSearchProvider />;
}
