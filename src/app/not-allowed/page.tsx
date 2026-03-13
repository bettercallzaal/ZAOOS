'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotAllowedPage() {
  const requestAccess = () => {
    const text = encodeURIComponent('@zaal requesting access to ZAO OS!');
    const url = `https://warpcast.com/~/compose?text=${text}&channelKey=zao`;
    window.open(url, '_blank');
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        <Image src="/logo.png" alt="THE ZAO" width={96} height={96} className="mx-auto mb-4 rounded-2xl" />
        <h1 className="text-3xl font-bold text-white mb-4">Not on the list yet</h1>
        <p className="text-gray-400 mb-8">
          ZAO OS is currently invite-only for ZAO community members.
        </p>

        <button
          onClick={requestAccess}
          className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity w-full"
        >
          Request Access in /zao
        </button>

        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-[#f5a623] transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
