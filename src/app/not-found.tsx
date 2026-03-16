import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = { title: 'Page Not Found - ZAO OS' };

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        <Image src="/logo.png" alt="THE ZAO" width={96} height={96} className="mx-auto mb-4 rounded-2xl" />
        <h1 className="text-6xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2">
          404
        </h1>
        <p className="text-gray-400 text-sm mb-8">This page doesn&#39;t exist.</p>
        <Link
          href="/"
          className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity inline-block"
        >
          Back to ZAO
        </Link>
      </div>
    </main>
  );
}
