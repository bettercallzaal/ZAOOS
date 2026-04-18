import { Metadata } from 'next';
import Link from 'next/link';
import { CypherForm } from './CypherForm';

export const metadata: Metadata = {
  title: 'ZAOstock Cypher | Live multi-artist session Oct 3',
  description: 'Sign up to be part of the ZAOstock cypher - a live multi-artist collaborative track created at the festival on October 3, 2026.',
};

export default function CypherPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/stock" className="text-xs text-gray-400 hover:text-[#f5a623]">
            &larr; ZAOstock
          </Link>
          <span className="text-xs text-gray-500">The Cypher</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="inline-block rounded-full bg-[#f5a623]/10 px-3 py-1 text-xs text-[#f5a623] font-medium border border-[#f5a623]/30">
            ZAO Signature Product
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">The ZAOstock Cypher</h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Live multi-artist collaborative track. Created on-site at ZAOstock, Oct 3, 2026. If you bring verses, beats, or an instrument, this is your signup.
          </p>
        </div>

        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-3">
          <p className="text-xs text-[#f5a623] uppercase tracking-wider font-bold">What is a cypher?</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            A cypher is a multi-artist collaborative track built live. Vocalists trade verses, producers cook the beat on the spot, instrumentalists add texture. One track, many voices. It becomes the cultural artifact of the day.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            The ZAOstock Cypher will be recorded, mixed, and released as onchain music after the festival. Every contributor gets credit and share.
          </p>
        </div>

        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-3">
          <p className="text-xs text-[#f5a623] uppercase tracking-wider font-bold">Who should sign up</p>
          <ul className="text-sm text-gray-300 space-y-1.5">
            <li>- Rappers, vocalists, singers</li>
            <li>- Producers (bring your laptop + a beat or two)</li>
            <li>- Instrumentalists (guitar, bass, horns, keys, etc)</li>
            <li>- Spoken word / poets</li>
            <li>- Anyone who wants to add a voice to the day</li>
          </ul>
          <p className="text-xs text-gray-500">
            You do not need to be on the main lineup to join the cypher. Cypher is open.
          </p>
        </div>

        <CypherForm />

        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08]">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">What happens next</p>
          <p className="text-sm text-gray-400">
            The music team reviews every signup and reaches out with logistics, timing, and the pre-event coordination thread. Expect a follow-up within a few days.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/stock/program"
              className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              See the program
            </Link>
            <Link
              href="/stock"
              className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              Back to ZAOstock
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
