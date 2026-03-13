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
      <div className="text-center w-full max-w-md">
        <Image src="/logo.png" alt="THE ZAO" width={96} height={96} className="mx-auto mb-6 rounded-2xl opacity-60" />

        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Not on the list yet</h1>
        <p className="text-gray-400 text-sm mb-8">
          ZAO OS is currently invite-only for ZAO community members.
        </p>

        <button
          onClick={requestAccess}
          className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity w-full max-w-xs mx-auto block"
        >
          Request Access in /zao
        </button>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-[#f5a623] transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
