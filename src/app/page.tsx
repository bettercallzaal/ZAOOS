import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import Image from 'next/image';
import { LoginButton } from '@/components/gate/LoginButton';

export const metadata: Metadata = {
  title: 'ZAO OS — The ZAO Community',
  description:
    'A gated Farcaster community for music artists who govern, collaborate, and build onchain together. Encrypted messaging, live audio spaces, and respect-weighted governance.',
  openGraph: {
    title: 'ZAO OS — The ZAO Community',
    description:
      'A gated Farcaster community for music artists who govern, collaborate, and build onchain together.',
    url: 'https://zaoos.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAO OS — The ZAO Community',
    description:
      'A gated Farcaster community for music artists who govern, collaborate, and build onchain together.',
  },
};

export default async function LandingPage() {
  const session = await getSessionData();
  if (session) {
    redirect('/home');
  }

  return (
    <main className="min-h-[100dvh] flex flex-col bg-[#0a1628] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#f5a623]/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#f5a623]/[0.015] rounded-full blur-3xl pointer-events-none" />

      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8 relative z-10">
        <Image
          src="/logo.png"
          alt="THE ZAO"
          width={100}
          height={100}
          className="mx-auto mb-6 rounded-2xl shadow-2xl shadow-[#f5a623]/10"
          priority
        />
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-3 tracking-tight">
          THE ZAO
        </h1>
        <p className="text-gray-300 text-base md:text-lg mb-1 font-medium">
          Where music artists build onchain
        </p>
        <p className="text-gray-500 text-sm mb-8 max-w-xs text-center">
          A gated community for creators who govern, collaborate, and grow together
        </p>

        {/* What's inside */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {[
            { icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772', label: 'Community' },
            { icon: 'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z', label: 'Music' },
            { icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', label: 'Encrypted' },
            { icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z', label: 'Governance' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <svg className="w-3.5 h-3.5 text-[#f5a623]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Login buttons */}
        <div className="w-full max-w-sm">
          <LoginButton />
        </div>
      </div>

      {/* Portal link */}
      <div className="px-6 pb-4 relative z-10">
        <div className="max-w-sm mx-auto">
          <a
            href="/portal"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#f5a623]/5 border border-[#f5a623]/15 text-sm text-[#f5a623] font-medium hover:bg-[#f5a623]/10 hover:border-[#f5a623]/25 transition-all group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🌐</span>
            Explore the Portal
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      </div>

      {/* Footer — path to membership */}
      <div className="px-6 pb-8 relative z-10">
        <div className="max-w-sm mx-auto">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-gray-400 text-center mb-2">
              Not a member yet?
            </p>
            <p className="text-[11px] text-gray-500 text-center mb-3">
              Join the community, participate in fractal calls, and earn your ZAO to unlock access.
            </p>
            <a
              href="https://discord.thezao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 text-sm text-[#5865F2] font-medium hover:bg-[#5865F2]/15 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              Join on Discord
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
