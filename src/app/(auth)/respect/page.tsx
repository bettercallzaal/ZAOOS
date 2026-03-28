import Link from 'next/link';
import { getSessionData } from '@/lib/auth/session';
import { RespectPageClient } from './RespectPageClient';

export default async function RespectPage() {
  const session = await getSessionData();
  const currentFid = session?.fid ?? 0;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <Link href="/home" className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="font-semibold text-sm text-gray-300">Fractal Respect</h2>
        <div className="flex-1" />
        <Link href="/fractals" className="text-[10px] text-[#f5a623]/70 hover:text-[#f5a623] transition-colors">
          Fractals Hub
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <RespectPageClient currentFid={currentFid} />

        <p className="text-xs text-gray-600 text-center">
          Respect data from community database. On-chain balances synced from Optimism.
        </p>
      </div>
    </div>
  );
}
