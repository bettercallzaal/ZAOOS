import Link from 'next/link';

// Every bounty on this page is read from the poidh contract on Base by
// poidhz.com (scripts/build-zao-bounties.py in bettercallzaal/poidhz).
// Nothing here is typed by hand, so the page cannot list a bounty that
// does not exist on-chain.
export const ZAO_BOUNTIES_URL = 'https://poidhz.com/data/zao-bounties.json';

export interface OnchainBounty {
  id: number;
  title: string;
  issuer: string;
  amount_eth: number;
  created_at: string;
  status: 'open' | 'voting' | 'closed' | string;
  has_claims: boolean;
  multiplayer: boolean;
  url: string;
}

export interface ZaoBountiesFeed {
  generated_at: string;
  ours: OnchainBounty[];
  community: OnchainBounty[];
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  voting: 'Voting',
  closed: 'Closed',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// The feed is fetched from another site, so its url is not trusted as an
// href: anything that is not an https link on poidh.xyz is rebuilt from the
// bounty id, which rules out javascript: and look-alike hosts.
function bountyHref(bounty: OnchainBounty) {
  try {
    const u = new URL(bounty.url);
    if (u.protocol === 'https:' && u.hostname === 'poidh.xyz') return u.toString();
  } catch {
    // fall through to the rebuilt link
  }
  return `https://poidh.xyz/base/bounty/${Number(bounty.id)}`;
}

function BountyRow({ bounty }: { bounty: OnchainBounty }) {
  const live = bounty.status !== 'closed';
  return (
    <a
      href={bountyHref(bounty)}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
        live
          ? 'border-[#f5a623]/40 bg-[#0a1a33]/80 hover:bg-[#0c1f3d]'
          : 'border-white/[0.08] bg-[#0c192d]/60 hover:bg-[#0c192d]'
      }`}
    >
      <div className="min-w-0">
        <div className="text-xs font-mono text-white/40">
          #{bounty.id} &bull; {formatDate(bounty.created_at)}
        </div>
        <div className="text-sm sm:text-base font-bold text-white leading-snug break-words">
          {bounty.title}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
        <span className="text-white/70">{bounty.amount_eth} ETH</span>
        <span
          className={`px-2 py-0.5 rounded font-bold uppercase ${
            live ? 'bg-[#f5a623] text-[#070e18]' : 'bg-white/10 text-white/60'
          }`}
        >
          {STATUS_LABEL[bounty.status] ?? bounty.status}
        </span>
      </div>
    </a>
  );
}

function Section({ title, bounties }: { title: string; bounties: OnchainBounty[] }) {
  if (bounties.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-mono uppercase tracking-wider text-white/50 font-bold">
        {title} ({bounties.length})
      </h2>
      {bounties.map((b) => (
        <BountyRow key={b.id} bounty={b} />
      ))}
    </section>
  );
}

export function BountiesHub({ feed }: { feed: ZaoBountiesFeed | null }) {
  const ours = feed?.ours ?? [];
  const live = ours.filter((b) => b.status !== 'closed');
  const past = ours.filter((b) => b.status === 'closed');
  const community = feed?.community ?? [];

  return (
    <div className="min-h-screen bg-[#070e18] text-white flex flex-col font-sans pb-24">
      <header className="border-b border-white/[0.08] bg-[#0a1628]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/os"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 border border-white/10 transition-colors"
            >
              &larr; Back to OS
            </Link>
            <h1 className="text-lg font-bold tracking-wider font-mono uppercase text-white">
              POIDH Bounties
            </h1>
          </div>
          <a
            href="https://poidhz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#f5a623] text-[#070e18] text-xs font-bold font-mono hover:bg-[#ffd700] transition-colors"
          >
            poidhz.com &rarr;
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 flex-1 w-full flex flex-col gap-8">
        <p className="text-sm text-white/70 leading-relaxed">
          ZAO bounties on poidh, on Base. This list is read from the chain, so every row links to a
          real bounty on poidh.xyz. Rules, deadlines and how to enter are in each bounty and on{' '}
          <a href="https://poidhz.com" className="text-[#f5a623] underline">
            poidhz.com
          </a>
          .
        </p>

        {feed === null ? (
          <p className="text-sm font-mono text-white/50">
            Could not load the bounty list right now. See{' '}
            <a href="https://poidhz.com" className="text-[#f5a623] underline">
              poidhz.com
            </a>
            .
          </p>
        ) : (
          <>
            <Section title="Open or voting" bounties={live} />
            {live.length === 0 && (
              <p className="text-sm font-mono text-white/50">No ZAO bounty is open right now.</p>
            )}
            <Section title="From the community" bounties={community} />
            <Section title="Past" bounties={past} />
            <p className="text-xs font-mono text-white/30">
              Read from Base at {new Date(feed.generated_at).toUTCString()}.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
