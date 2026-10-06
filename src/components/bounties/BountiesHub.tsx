'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Bounty {
  id: string;
  title: string;
  sponsor: string;
  network: string;
  reward: string;
  category: 'video' | 'design' | 'code' | 'audio';
  status: 'active' | 'evaluating' | 'upcoming';
  description: string;
  requirements: string[];
  resourcesUrl?: string;
  resourcesLabel?: string;
  poidhUrl: string;
  deadline: string;
  featured?: boolean;
}

const BOUNTIES: Bounty[] = [
  {
    id: 'bounty-zaostock-video',
    title: 'ZAOstock 2026: Community Video Creation & Recap Reels',
    sponsor: 'Proof of Ink DAO & The ZAO',
    network: 'Base',
    reward: 'Active Pool (POIDH)',
    category: 'video',
    status: 'active',
    featured: true,
    description:
      'Download the raw multi-camera 4K stage recordings and 43 aerial drone clips from ZAOstock 2026 (Ellsworth, ME). Edit viral 15-30s shorts, vertical 9:16 reels, or 60-90s multi-act festival recap reels featuring the 7 performing artists.',
    requirements: [
      'Use official raw footage from Google Drive',
      'Feature at least 2 performing acts (DCoop, Tom Fellenz, Crown Vics, Maine Rhythms, Jango UU, Frank Hopkins, King Kyote)',
      'Publish edit on Farcaster or X tagging @thezao & @poidh',
      'Submit post link as proof on poidhz.com to claim bounty',
    ],
    resourcesUrl: 'https://drive.google.com/drive/folders/1SNKFMJBxIEs5lZG4dAcEy4gJb6CLZXbg',
    resourcesLabel: 'Download Raw 4K & Drone Assets',
    poidhUrl: 'https://poidhz.com',
    deadline: 'Rolling Submissions',
  },
  {
    id: 'bounty-zao-2027-mark',
    title: '2027 Visual Identity: ZAOville & ZAOstock Direction Mark',
    sponsor: 'The ZAO Governance',
    network: 'Base',
    reward: 'Community Bounty',
    category: 'design',
    status: 'active',
    featured: false,
    description:
      'Design official branding assets, vector marks, and promotional motion cards for the 2027 two-event festival calendar: ZAOville (June 2027) and ZAOstock (September 2027).',
    requirements: [
      'Vector SVG + high-resolution master format',
      'Clean typography adhering to ZAO brand standards',
      'Submit proof on poidhz.com',
    ],
    poidhUrl: 'https://poidhz.com',
    deadline: 'Oct 31, 2026',
  },
  {
    id: 'bounty-juke-visualizer',
    title: 'Real-Time Audio Visualizer for Crossfade Engine',
    sponsor: 'WaveWarZ Lab',
    network: 'Base',
    reward: 'Developer Bounty',
    category: 'code',
    status: 'active',
    featured: false,
    description:
      'Build a lightweight Canvas or WebGL visualizer component reacting in real-time to the Crossfade Audio Engine inside ZAO OS and Juke live spaces.',
    requirements: [
      'React / TypeScript compatible component',
      '60fps performant rendering on mobile and desktop',
      'Open-source PR into bettercallzaal/ZAOOS',
    ],
    poidhUrl: 'https://poidhz.com',
    deadline: 'Nov 15, 2026',
  },
];

export function BountiesHub() {
  const [filter, setFilter] = useState<'all' | 'video' | 'design' | 'code'>('all');

  const filtered = BOUNTIES.filter((b) => (filter === 'all' ? true : b.category === filter));

  return (
    <div className="min-h-screen bg-[#070e18] text-white flex flex-col font-sans selection:bg-[#f5a623]/30 pb-24">
      {/* ── HEADER ── */}
      <header className="border-b border-white/[0.08] bg-[#0a1628]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/os"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 border border-white/10 transition-colors"
            >
              &larr; Back to OS
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f5a623] animate-pulse" />
              <h1 className="text-lg font-bold tracking-wider font-mono uppercase text-white">
                POIDH Bounties Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://poidhz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#f5a623] text-[#070e18] text-xs font-bold font-mono hover:bg-[#ffd700] transition-colors flex items-center gap-1.5"
            >
              <span>Launch POIDHz</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 flex-1 w-full flex flex-col gap-8">
        {/* Banner Section */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0a182e] via-[#0c1f3d] to-[#0a182e] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#f5a623]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#f5a623]/20 border border-[#f5a623]/30 text-[#f5a623] text-xs font-mono font-bold uppercase mb-3">
              Decentralized Creative Production
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Create, Edit, and Earn with Proof of Ink DAO
            </h2>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              We empower our global community to edit videos, design marks, and build software on Base.
              Download raw festival assets directly, produce your best work, and submit verifiable proof on POIDH.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <a
              href="https://poidhz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#f5a623] text-[#070e18] text-xs font-bold font-mono hover:bg-[#ffd700] text-center transition-colors shadow-lg shadow-[#f5a623]/10"
            >
              Submit Proof on POIDH
            </a>
            <a
              href="https://drive.google.com/drive/folders/1SNKFMJBxIEs5lZG4dAcEy4gJb6CLZXbg"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium font-mono hover:bg-white/15 text-center transition-colors border border-white/10"
            >
              Browse Raw Drive
            </a>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            {(
              [
                { id: 'all', label: 'All Bounties' },
                { id: 'video', label: 'Video & Editing' },
                { id: 'design', label: 'Design & Visual' },
                { id: 'code', label: 'Code & Web3' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  filter === cat.id
                    ? 'bg-[#f5a623] text-[#070e18] font-bold'
                    : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-white/40 hidden sm:inline">
            {filtered.length} active opportunities
          </span>
        </div>

        {/* Bounties List */}
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((bounty) => (
            <div
              key={bounty.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                bounty.featured
                  ? 'border-[#f5a623]/40 bg-[#0a1a33]/80 shadow-xl'
                  : 'border-white/[0.08] bg-[#0c192d]/60 hover:bg-[#0c192d]'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {bounty.featured && (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#f5a623] text-[#070e18]">
                        Featured Flagship Bounty
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-white/80 border border-white/10">
                      {bounty.category}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      Network: {bounty.network}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-white/50">{bounty.deadline}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {bounty.title}
                </h3>
                <div className="text-xs font-mono text-[#f5a623] mt-1">
                  Sponsor: {bounty.sponsor} &bull; Reward: {bounty.reward}
                </div>

                <p className="text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
                  {bounty.description}
                </p>

                {/* Requirements */}
                <div className="mt-4 p-4 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2 font-bold">
                    Submission Criteria:
                  </div>
                  <ul className="space-y-1.5 text-xs text-white/70">
                    {bounty.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#f5a623] font-bold">&bull;</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {bounty.resourcesUrl ? (
                  <a
                    href={bounty.resourcesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white text-center transition-colors border border-white/10"
                  >
                    {bounty.resourcesLabel || 'View Assets'} &rarr;
                  </a>
                ) : (
                  <div />
                )}

                <a
                  href={bounty.poidhUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-lg bg-[#f5a623] hover:bg-[#ffd700] text-[#070e18] text-xs font-bold font-mono text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Submit Proof on POIDHz</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
