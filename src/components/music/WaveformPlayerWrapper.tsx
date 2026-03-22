'use client';

import dynamic from 'next/dynamic';

const WaveformPlayer = dynamic(() => import('./WaveformPlayer'), {
  ssr: false,
  loading: () => <div className="h-8 bg-gray-800/50 rounded animate-pulse" />,
});

export { WaveformPlayer };
