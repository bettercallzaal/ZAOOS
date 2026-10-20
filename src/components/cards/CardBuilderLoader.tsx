'use client';

import dynamic from 'next/dynamic';

// Konva needs the browser. Next 16 refuses `ssr: false` in a Server Component, so the
// dynamic import lives in this client wrapper and the page stays a server shell.
const CardEditor = dynamic(() => import('./CardEditor'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0a1628]" />,
});

export function CardBuilderLoader() {
  return <CardEditor />;
}
