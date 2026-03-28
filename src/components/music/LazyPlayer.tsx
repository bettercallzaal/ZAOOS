'use client';

import dynamic from 'next/dynamic';

const PersistentPlayerWithRadio = dynamic(
  () => import('@/components/music/PersistentPlayerWithRadio').then(m => ({ default: m.PersistentPlayerWithRadio })),
  { ssr: false },
);

const QuickAddSong = dynamic(
  () => import('@/components/music/QuickAddSong').then(m => ({ default: m.QuickAddSong })),
  { ssr: false },
);

export function LazyPlayer() {
  return (
    <>
      <QuickAddSong />
      <PersistentPlayerWithRadio />
    </>
  );
}
