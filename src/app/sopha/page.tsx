import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og-sopha.png',
  button: {
    title: 'See the Trending feed',
    action: { type: 'launch_miniapp', url: 'https://zaoos.com/sopha' },
  },
});

export const metadata: Metadata = {
  title: 'Sopha x ZAO OS — Curated Farcaster, inside the music DAO',
  description:
    'Sopha curates the long-form, philosophy, and art end of Farcaster. ZAO OS pipes that signal into our Trending tab — the only public-feed window inside the gated community.',
  openGraph: {
    title: 'Sopha x ZAO OS — Curated Farcaster',
    description:
      'Deep Social meets the Music DAO. Sopha-curated Farcaster casts power the ZAO OS Trending tab.',
    url: 'https://zaoos.com/sopha',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sopha x ZAO OS — Curated Farcaster',
    description: 'Deep Social meets the Music DAO. Sopha curates, ZAO governs.',
  },
  other: { 'fc:miniapp': miniAppEmbed },
};

const STATS: { label: string; value: string }[] = [
  { label: 'Casts per refresh', value: '50' },
  { label: 'Quality score range', value: '65-85' },
  { label: 'Cache TTL', value: '5 min' },
  { label: 'Max age window', value: '30 days' },
];

const FEATURES: { title: string; body: string }[] = [
  {
    title: 'Editorial metadata, not just engagement',
    body: 'Every Sopha cast arrives with a quality score, category, title, summary, and the list of curators who flagged it. Engagement metrics are a side dish, not the main filter.',
  },
  {
    title: 'Cross-curated, not algorithmic',
    body: 'Real curators (not a feed algorithm) score and tag casts. ZAO members see what readers across Farcaster found worth their attention.',
  },
  {
    title: 'The only outside signal in our feed',
    body: 'ZAO OS chat is gated. Sopha is the one window where casts from beyond ZAO members enter the Trending tab — without spam, without engagement bait.',
  },
  {
    title: 'Music + governance still come first',
    body: 'Sopha-curated casts land beside ZAO music submissions, fractal proposals, and member casts. Curation enriches the room; it does not replace the community.',
  },
];

export default function SophaPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a1628] text-gray-200">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#B8966F]/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#f5a623]/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pt-10 pb-24">
        <nav className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="THE ZAO"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-sm font-medium text-gray-300 group-hover:text-[#f5a623] transition-colors">
              ZAO OS
            </span>
          </Link>
          <a
            href="https://www.sopha.social"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#B8966F] transition-colors"
          >
            sopha.social -&gt;
          </a>
        </nav>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8966F]/10 border border-[#B8966F]/25 text-[11px] uppercase tracking-wider text-[#B8966F] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8966F] animate-pulse" />
            Live integration
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent">
              Sopha
            </span>
            <span className="text-gray-400"> x </span>
            <span className="text-white">ZAO OS</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl">
            Sopha curates the long-form, philosophy, and art end of Farcaster.
            ZAO OS pipes that signal directly into our Trending tab — the
            single public-feed window inside our gated music community.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Deep Social meets the Music DAO. Sopha curates. ZAO governs.
          </p>
        </header>

        <section className="mb-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map(s => (
              <div
                key={s.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="text-2xl font-semibold text-[#f5a623]">
                  {s.value}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-white mb-5">
            How the integration works
          </h2>
          <ol className="space-y-4 text-sm sm:text-base text-gray-300 leading-relaxed">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#B8966F]/15 border border-[#B8966F]/30 text-[#B8966F] text-xs font-semibold flex items-center justify-center mt-0.5">
                1
              </span>
              <p>
                Sopha runs its own curation pipeline across Farcaster — quality
                scores, categories, summaries, and credited curators per cast.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#B8966F]/15 border border-[#B8966F]/30 text-[#B8966F] text-xs font-semibold flex items-center justify-center mt-0.5">
                2
              </span>
              <p>
                ZAO OS pulls a curated batch over Sopha&apos;s authenticated
                external feed API every 5 minutes. The endpoint lives at{' '}
                <code className="px-1.5 py-0.5 rounded bg-white/5 text-[#f5a623] text-xs">
                  /api/external/feed
                </code>
                .
              </p>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#B8966F]/15 border border-[#B8966F]/30 text-[#B8966F] text-xs font-semibold flex items-center justify-center mt-0.5">
                3
              </span>
              <p>
                The Trending tab in ZAO OS chat merges Sopha-curated casts
                with high-engagement Neynar trending casts, dedupes, and shows
                quality + curator attribution inline.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#B8966F]/15 border border-[#B8966F]/30 text-[#B8966F] text-xs font-semibold flex items-center justify-center mt-0.5">
                4
              </span>
              <p>
                ZAO members react, reply, and quote-cast directly back to the
                Farcaster network — every interaction credits the original
                cast and curator.
              </p>
            </li>
          </ol>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-white mb-5">
            Why this collab matters
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <h3 className="text-sm font-semibold text-[#f5a623] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-white mb-4">
            Try it
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="https://www.sopha.social"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[#B8966F]/30 bg-[#B8966F]/5 hover:bg-[#B8966F]/10 transition-colors p-5"
            >
              <div className="text-sm font-semibold text-[#B8966F] mb-1">
                Open Sopha -&gt;
              </div>
              <div className="text-xs text-gray-400">
                The curated long-form Farcaster client. Read deep, slowly.
              </div>
            </a>
            <a
              href="https://farcaster.xyz/sopha_social"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-5"
            >
              <div className="text-sm font-semibold text-white mb-1">
                Follow @sopha_social
              </div>
              <div className="text-xs text-gray-400">
                Updates from the team building Deep Social on Farcaster.
              </div>
            </a>
            <Link
              href="/"
              className="rounded-xl border border-[#f5a623]/25 bg-[#f5a623]/5 hover:bg-[#f5a623]/10 transition-colors p-5"
            >
              <div className="text-sm font-semibold text-[#f5a623] mb-1">
                Enter ZAO OS -&gt;
              </div>
              <div className="text-xs text-gray-400">
                Members see Sopha-curated casts in the Trending tab.
              </div>
            </Link>
            <a
              href="https://discord.thezao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-5"
            >
              <div className="text-sm font-semibold text-white mb-1">
                Join the ZAO Discord
              </div>
              <div className="text-xs text-gray-400">
                Earn your way into the community. ZAO holders get the gated
                chat with the curated feed inside.
              </div>
            </a>
          </div>
        </section>

        <footer className="border-t border-white/[0.05] pt-6 mt-10">
          <p className="text-xs text-gray-500 leading-relaxed">
            Sopha runs at{' '}
            <a
              href="https://www.sopha.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B8966F] hover:underline"
            >
              sopha.social
            </a>
            . The integration on the ZAO OS side is open in the codebase at{' '}
            <code className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
              src/lib/sopha/client.ts
            </code>
            . If you build a Farcaster client and want to plug into the gated
            ZAO music community the same way, reach out on Farcaster at{' '}
            <a
              href="https://farcaster.xyz/zaal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              @zaal
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
