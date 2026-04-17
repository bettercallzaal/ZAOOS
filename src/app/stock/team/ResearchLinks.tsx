'use client';

import Link from 'next/link';

const INTERNAL_BASE = '/research';

interface Link {
  num: string;
  title: string;
  hook: string;
  folder: string;
  slug: string;
}

const CORE_READS: Link[] = [
  {
    num: '270',
    title: 'ZAOstock Planning',
    hook: 'Master planning doc — goals, budget, timeline, org structure',
    folder: 'events',
    slug: '270-zao-stock-planning',
  },
  {
    num: '274',
    title: 'Team Deep Profiles',
    hook: 'Background on every teammate, their scope, strengths',
    folder: 'events',
    slug: '274-zao-stock-team-deep-profiles',
  },
  {
    num: '364',
    title: 'ZAO Festivals Deep Research',
    hook: 'Broader research on how we think about events',
    folder: 'events',
    slug: '364-zao-festivals-deep-research',
  },
  {
    num: '418',
    title: 'Birding Man Festival Analysis',
    hook: 'Peer festival in NY — what to borrow, what to skip (Year 1 vs 2+)',
    folder: 'events',
    slug: '418-birding-man-festival-analysis',
  },
  {
    num: '425',
    title: 'Dashboard UI: Six Sigma + Kanban',
    hook: 'Why this dashboard looks the way it does — Lean principles',
    folder: 'events',
    slug: '425-zaostock-dashboard-ui-lean-kanban-patterns',
  },
];

const SCOPE_READS: Record<string, Link[]> = {
  music: [
    { num: '144', title: 'ZOUNZ Music NFT Distribution', hook: 'How artists earn onchain', folder: 'music', slug: '144-zounz-music-nft-unified-distribution' },
    { num: '141', title: 'Onchain Music Distribution Landscape', hook: 'Who is doing what in web3 music', folder: 'music', slug: '141-onchain-music-distribution-landscape' },
    { num: '143', title: '0xSplits Revenue Distribution', hook: 'Splitting artist + festival revenue automatically', folder: 'music', slug: '143-0xsplits-revenue-distribution' },
    { num: '029', title: 'Artist Revenue + IP Rights', hook: 'What artists keep, what we need in writing', folder: 'business', slug: '029-artist-revenue-ip-rights' },
  ],
  finance: [
    { num: '125', title: 'Coinflow Fiat Checkout', hook: 'Accept credit cards + crypto for sponsors', folder: 'business', slug: '125-coinflow-fiat-checkout' },
    { num: '222', title: 'Payment Infrastructure (Stripe + Coinbase)', hook: 'Money in, money out', folder: 'business', slug: '222-payment-infrastructure-stripe-coinbase' },
    { num: '258', title: 'ZABAL/SANG Buyback', hook: 'Token economics background', folder: 'business', slug: '258-zabal-sang-buyback' },
    { num: '263', title: 'Obsidian Lean Team Model', hook: 'Running lean, break-even mindset', folder: 'business', slug: '263-obsidian-lean-team-model' },
  ],
  design: [
    { num: '016', title: 'UI Reference Library', hook: 'ZAO design system conventions', folder: 'infrastructure', slug: '016-ui-reference' },
    { num: '282', title: 'Awesome Design System Files', hook: 'How to document a design system for AI', folder: 'dev-workflows', slug: '282-awesome-design-md-system' },
    { num: '425', title: 'Dashboard UI: Six Sigma + Kanban', hook: 'Visual management principles', folder: 'events', slug: '425-zaostock-dashboard-ui-lean-kanban-patterns' },
  ],
  ops: [
    { num: '369', title: 'Dreamevent Framework Gap Analysis', hook: 'What a perfect event would require vs what we have', folder: 'events', slug: '369-dreamevent-framework-gap-analysis' },
    { num: '294', title: 'Event Coordinator AI Agents', hook: 'Automating the operational grind', folder: 'events', slug: '294-event-coordinator-ai-agents' },
    { num: '264', title: 'LinkedIn Build-in-Public Playbook', hook: 'How to post progress publicly', folder: 'business', slug: '264-linkedin-build-in-public-playbook' },
  ],
};

const SCOPE_LABEL: Record<string, string> = {
  ops: 'Operations',
  finance: 'Finance',
  design: 'Design',
  music: 'Music',
};

export function ResearchLinks({ scope }: { scope: string }) {
  const scopeLinks = SCOPE_READS[scope] || [];
  const scopeLabel = SCOPE_LABEL[scope] || scope;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dig Deeper — Research Library</h3>
        <a
          href="https://github.com/bettercallzaal/ZAOOS/tree/main/research"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#f5a623] hover:text-[#ffd700]"
        >
          All docs ↗
        </a>
      </div>

      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 px-1">Core reads (everyone)</p>
        <div className="space-y-1.5">
          {CORE_READS.map((link) => (
            <ResearchRow key={link.num} link={link} />
          ))}
        </div>
      </div>

      {scopeLinks.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 px-1">For your team · {scopeLabel}</p>
          <div className="space-y-1.5">
            {scopeLinks.map((link) => (
              <ResearchRow key={link.num} link={link} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-600 px-1 italic">
        400+ research docs total — ask Zaal if you need something specific.
      </p>
    </div>
  );
}

function ResearchRow({ link }: { link: Link }) {
  return (
    <Link
      href={`${INTERNAL_BASE}/${link.folder}/${link.slug}`}
      className="block bg-[#0d1b2a] rounded-lg border border-white/[0.06] hover:border-[#f5a623]/30 transition-colors p-3"
    >
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-bold text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
          {link.num}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">{link.title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{link.hook}</p>
        </div>
        <span className="text-gray-600 text-sm flex-shrink-0">→</span>
      </div>
    </Link>
  );
}
