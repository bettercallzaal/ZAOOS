'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface ReviewItem {
  id: string;
  category: 'pr' | 'media' | 'decision' | 'agent';
  title: string;
  repoOrLocation: string;
  status: 'ready' | 'merged' | 'waiting_zaal' | 'in_progress';
  summary: string;
  primaryActionUrl?: string;
  primaryActionLabel?: string;
  badge: string;
  updatedAt: string;
}

const DEFAULT_REVIEW_ITEMS: ReviewItem[] = [
  {
    id: 'pr-dotfiles-423',
    category: 'pr',
    title: 'Fleet Context, 50% Auto-Compact, Review Dispatch Tool',
    repoOrLocation: 'bettercallzaal/zaal-dotfiles #423',
    status: 'merged',
    summary: 'Auto lane-context injection on session start in any Orca worktree, proactive auto-compaction at 50% context, and zao-review-dispatch CLI.',
    primaryActionUrl: 'https://github.com/bettercallzaal/zaal-dotfiles/pull/423',
    primaryActionLabel: 'View PR #423',
    badge: 'MERGED & LIVE',
    updatedAt: 'Today 08:40',
  },
  {
    id: 'bounty-poidh-videos',
    category: 'decision',
    title: 'POIDH Video Bounties: Community Edits from Raw Footage',
    repoOrLocation: 'poidh.com / Base & zaoos.com/bounties',
    status: 'ready',
    summary: 'Distribute raw 4K ground footage and drone footage to poidhz and the community with Base bounties for the best recap videos and artist reels.',
    primaryActionUrl: '/bounties',
    primaryActionLabel: 'Open Bounties Hub',
    badge: 'POIDH BOUNTY',
    updatedAt: 'Active Today',
  },
  {
    id: 'media-daily-social-post',
    category: 'media',
    title: 'Daily Content Drip: Share Ready Clips & Photos',
    repoOrLocation: 'Desktop/zaostock-content & Socials',
    status: 'ready',
    summary: 'Post existing photos and raw stage cuts daily across Farcaster, X, and Instagram so momentum continues steadily.',
    primaryActionLabel: 'Ready to Post',
    badge: 'DAILY DRIP',
    updatedAt: 'Daily Cadence',
  },
  {
    id: 'media-crownvics-teasers',
    category: 'media',
    title: 'Crown Vics 20-Second Teaser Video Drafts',
    repoOrLocation: 'Google Drive / 10-teasers-and-recap-drafts',
    status: 'ready',
    summary: 'Rendered teasers in both 9x16 vertical (Reels/TikTok) and 16x9 horizontal (YouTube/X) featuring "She Said Yeah" live performance.',
    primaryActionUrl: 'https://drive.google.com/drive/folders/1SNKFMJBxIEs5lZG4dAcEy4gJb6CLZXbg',
    primaryActionLabel: 'Inspect Video Drafts',
    badge: 'READY FOR REVIEW',
    updatedAt: 'Today 07:22',
  },
  {
    id: 'pr-paragraph-118',
    category: 'pr',
    title: 'Day 276 Newsletter: ZAOstock Festival Recap',
    repoOrLocation: 'bettercallzaal/zaoonparagraph #118',
    status: 'merged',
    summary: 'Daily newsletter celebration post with attendee numbers, confirmed artist lineup, and community reflection.',
    primaryActionUrl: 'https://github.com/bettercallzaal/zaoonparagraph/pull/118',
    primaryActionLabel: 'View Edition',
    badge: 'MERGED & PUBLISHED',
    updatedAt: 'Today 08:44',
  },
  {
    id: 'pr-zaostock-448-450',
    category: 'pr',
    title: 'ZAOstock Lineup Confirmation & 2027 Festival Direction',
    repoOrLocation: 'ZAODEVZ/ZAOstock #448 & #450',
    status: 'merged',
    summary: 'Locked public copy to 7 performing acts; established ZAOville and ZAOstock as the two headline festivals for 2027.',
    primaryActionUrl: 'https://github.com/ZAODEVZ/ZAOstock/pull/450',
    primaryActionLabel: 'View Site Changes',
    badge: 'MERGED & DEPLOYED',
    updatedAt: 'Today 08:46',
  },
  {
    id: 'pr-downeast-2-3-4',
    category: 'pr',
    title: 'DownEast ZAO Promoter Platform & Outreach Prospects',
    repoOrLocation: 'bettercallzaal/downeast-zao #2, #3, #4',
    status: 'merged',
    summary: 'Overnight research covering 90-day promoter starter plan, artist fee splits, venue directory across Hancock County, and grant opportunities.',
    primaryActionUrl: 'https://github.com/bettercallzaal/downeast-zao',
    primaryActionLabel: 'View DownEast Repo',
    badge: 'MERGED INTO MAIN',
    updatedAt: 'Today 08:54',
  },
  {
    id: 'dec-twitch-highlights',
    category: 'decision',
    title: 'Convert Twitch Festival Broadcasts to Permanent Highlights',
    repoOrLocation: 'twitch.tv/zaofestivals',
    status: 'waiting_zaal',
    summary: 'The 6 festival live stream VODs expire in ~11 days under Twitch standard 14-day retention. Convert to Highlights to prevent deletion.',
    primaryActionUrl: 'https://dashboard.twitch.tv/u/zaofestivals/content/video-producer',
    primaryActionLabel: 'Open Twitch Manager',
    badge: 'ACTION: ZAAL',
    updatedAt: 'Urgent (11d left)',
  },
  {
    id: 'dec-drone-footage-sync',
    category: 'decision',
    title: 'Sync 8.6 GB Drone Footage from ZUSB Flash Drive',
    repoOrLocation: 'Local Hardware (ZUSB)',
    status: 'waiting_zaal',
    summary: 'Plug the ZUSB drive at work to copy the 43 drone clips into Drive folder 02-drone, unblocking Maceo message M2 and final reel assembly.',
    badge: 'HARDWARE: PLUG USB',
    updatedAt: 'Pending Arrival',
  },
  {
    id: 'pr-poidhz-220-221',
    category: 'pr',
    title: 'Proof of Ink DAO: Community Vote Spec & Round Drafts',
    repoOrLocation: 'bettercallzaal/poidhz #220, #221',
    status: 'in_progress',
    summary: 'Active specifications for community voting thresholds and drafts for upcoming round releases.',
    primaryActionUrl: 'https://github.com/bettercallzaal/poidhz/pull/221',
    primaryActionLabel: 'Inspect Spec PR #221',
    badge: 'IN PROGRESS',
    updatedAt: 'In Orca Lane',
  },
];

export function EstateReviewDeck({
  items = DEFAULT_REVIEW_ITEMS,
  onDismiss,
}: {
  items?: ReviewItem[];
  onDismiss?: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'pr' | 'media' | 'decision' | 'agent'>('all');
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.repoOrLocation.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: items.length,
    pr: items.filter((i) => i.category === 'pr').length,
    media: items.filter((i) => i.category === 'media').length,
    decision: items.filter((i) => i.category === 'decision').length,
    agent: items.filter((i) => i.category === 'agent').length,
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#081220]/95 backdrop-blur-xl p-5 text-white flex flex-col gap-4 shadow-2xl">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f5a623] animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-wider uppercase text-white">
              Estate Review & Approvals Cockpit
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30">
              ORCHESTRATOR LIVE
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Review staged media, verify code pull requests, and resolve active human decision gates across BetterCallZaal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 font-mono transition-colors"
            >
              Close View
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'all', label: `All (${counts.all})` },
              { id: 'media', label: `Media (${counts.media})` },
              { id: 'pr', label: `PRs (${counts.pr})` },
              { id: 'decision', label: `Decisions (${counts.decision})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#f5a623] text-[#070e18] font-bold'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search review items..."
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#f5a623] w-full sm:w-56 font-mono"
        />
      </div>

      {/* ── CARDS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
        {filtered.map((item) => {
          const isMerged = item.status === 'merged';
          const isAction = item.status === 'waiting_zaal';
          const isReady = item.status === 'ready';

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all group ${
                isAction
                  ? 'border-amber-500/40 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]'
                  : isReady
                  ? 'border-emerald-500/30 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]'
                  : isMerged
                  ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  : 'border-purple-500/30 bg-purple-500/[0.02] hover:bg-purple-500/[0.05]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight uppercase ${
                      isAction
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isReady
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isMerged
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">{item.updatedAt}</span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-[#f5a623] transition-colors leading-snug">
                  {item.title}
                </h3>
                <div className="text-[11px] font-mono text-white/50 mt-1 truncate">
                  {item.repoOrLocation}
                </div>

                <p className="text-xs text-white/60 mt-2.5 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-white/40">
                  {item.category}
                </span>

                {item.primaryActionUrl ? (
                  <a
                    href={item.primaryActionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-medium text-[#f5a623] hover:underline flex items-center gap-1"
                  >
                    {item.primaryActionLabel || 'Review &rarr;'}
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                ) : (
                  <span className="text-xs font-mono text-white/40">Zaal Hand Action</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
