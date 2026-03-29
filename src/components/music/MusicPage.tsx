'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePlayer } from '@/providers/audio';
import { useRadioContext as useRadio } from '@/providers/audio/RadioProvider';
import { useQueue } from '@/contexts/QueueContext';
import { PageHeader } from '@/components/navigation/PageHeader';
import type { OmnibarResult } from '@/components/music/MusicOmnibar';
import type { TrackMetadata } from '@/types/music';
import { RespectTrending } from '@/components/music/RespectTrending';
import { NowPlayingBar } from '@/components/music/NowPlayingBar';
import { RadioHero } from '@/components/music/MusicRadioHero';
import { SubmissionsSection } from '@/components/music/MusicSubmissions';
import type { Submission } from '@/components/music/MusicSubmissions';
import { TrendingSection } from '@/components/music/MusicTrending';
import { PlaylistsSection } from '@/components/music/MusicPlaylists';
import { LikedSongsSection, HistorySection } from '@/components/music/MusicLibrarySections';
import { TrackOfTheDayBanner, TrackOfTheDayTabSkeleton } from '@/components/music/MusicPageUtils';

const MusicOmnibar = dynamic(
  () => import('@/components/music/MusicOmnibar'),
  { ssr: false },
);

const AudiusDiscover = dynamic(
  () => import('@/components/music/AudiusDiscover').then((m) => m.AudiusDiscover),
  { ssr: false },
);

const TrackOfTheDay = dynamic(
  () => import('@/components/music/TrackOfTheDay').then((m) => m.TrackOfTheDay),
  { ssr: false, loading: () => <TrackOfTheDayTabSkeleton /> },
);

const BinauralBeats = dynamic(
  () => import('@/components/music/BinauralBeats').then((m) => m.BinauralBeats),
  { ssr: false },
);

const TopCurators = dynamic(
  () => import('@/components/music/TopCurators').then((m) => m.TopCurators),
  { ssr: false },
);

const AiMusicGenerator = dynamic(
  () => import('@/components/music/AiMusicGenerator').then((m) => m.AiMusicGenerator),
  { ssr: false },
);

const MintTrack = dynamic(
  () => import('@/components/music/MintTrack'),
  { ssr: false },
);

const PermawebLibrary = dynamic(
  () => import('@/components/music/PermawebLibrary'),
  { ssr: false },
);

const TABS = ['Radio', 'Discover', 'Track of the Day', 'Submissions', 'Trending', 'Playlists', 'Create', 'Binaural', 'Liked', 'History', 'Curators', 'Permaweb'] as const;
type Tab = (typeof TABS)[number];

const SECTION_IDS: Record<Tab, string> = {
  Radio: 'section-radio',
  Discover: 'section-discover',
  'Track of the Day': 'section-totd',
  Submissions: 'section-submissions',
  Trending: 'section-trending',
  Playlists: 'section-playlists',
  Create: 'section-create',
  Binaural: 'section-binaural',
  Liked: 'section-liked',
  History: 'section-history',
  Curators: 'section-curators',
  Permaweb: 'section-permaweb',
};

// ── Main Component ─────────────────────────────────────────────────────

export function MusicPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Radio');
  const [showMint, setShowMint] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabBarRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const player = usePlayer();
  const radio = useRadio();
  const queue = useQueue();

  // Auto-advance is handled in PersistentPlayerWithRadio (layout level)
  // so it works across ALL pages, not just /music

  // ── Fetch submissions ────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music/submissions?limit=20', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => setSubmissions(data.submissions || []))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      })
      .finally(() => setSubmissionsLoading(false));
    return () => controller.abort();
  }, []);

  // ── IntersectionObserver for active tab tracking ─────────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const entries = Object.entries(SECTION_IDS);

    for (const [tab, id] of entries) {
      const el = document.getElementById(id);
      if (!el) continue;
      sectionRefs.current[id] = el;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isScrollingRef.current) {
            setActiveTab(tab as Tab);
          }
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // ── Tab click handler ────────────────────────────────────────────────
  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTab(tab);
    isScrollingRef.current = true;
    const el = document.getElementById(SECTION_IDS[tab]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    }
  }, []);

  // ── Radio controls ──────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (player.isPlaying) player.pause();
    else player.resume();
  };

  const handleOmnibarPlay = useCallback(
    (track: OmnibarResult) => {
      const metadata: TrackMetadata = {
        id: track.id,
        type: (track.platform as TrackMetadata['type']) || 'audio',
        trackName: track.title,
        artistName: track.artist,
        artworkUrl: track.artworkUrl,
        url: track.url,
        streamUrl: track.streamUrl,
        feedId: track.id,
      };
      player.play(metadata);
    },
    [player],
  );

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-24 md:pt-12">
      <PageHeader
        title="Music"
        subtitle="Radio, playlists & discovery"
        rightAction={
          <button
            onClick={() => setShowMint(true)}
            className="px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium hover:bg-[#f5a623]/90 transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Mint Track
          </button>
        }
      />

      {/* ── Who's Listening ────────────────────────────────────────── */}
      <NowPlayingBar />

      {/* ── Smart Omnibar ────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <MusicOmnibar onPlay={handleOmnibarPlay} onQueue={(track) => queue.addToQueue({
          id: track.id,
          type: (track.platform as TrackMetadata['type']) || 'audio',
          trackName: track.title,
          artistName: track.artist,
          artworkUrl: track.artworkUrl,
          url: track.url,
          streamUrl: track.streamUrl,
          feedId: track.id,
        })} />
      </div>

      {/* ── Track of the Day Hero Banner ─────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 md:pt-0">
        <TrackOfTheDayBanner />
      </div>

      {/* ── Sticky Tab Bar ─────────────────────────────────────────── */}
      <div
        ref={tabBarRef}
        className="sticky top-0 md:top-10 z-30 bg-[#0a1628]/95 backdrop-blur-md border-b border-gray-800/50"
      >
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-[#f5a623] text-[#0a1628] shadow-md shadow-[#f5a623]/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-8 mt-6">
        {/* ── Section 1: Community Radio (Hero) ────────────────────── */}
        <section id={SECTION_IDS.Radio}>
          <RadioHero
            player={player}
            radio={radio}
            onPlayPause={handlePlayPause}
          />
        </section>

        {/* ── Section 2: Discover (Audius) ────────────────────────── */}
        <section id={SECTION_IDS.Discover}>
          <AudiusDiscover />
        </section>

        {/* ── Section 3: Track of the Day ──────────────────────────── */}
        <section id={SECTION_IDS['Track of the Day']}>
          <TrackOfTheDay />
        </section>

        {/* ── Section 3: Community Submissions ─────────────────────── */}
        <section id={SECTION_IDS.Submissions}>
          <SubmissionsSection
            submissions={submissions}
            setSubmissions={setSubmissions}
            loading={submissionsLoading}
            player={player}
          />
        </section>

        {/* ── Section 3: Trending ──────────────────────────────────── */}
        <section id={SECTION_IDS.Trending}>
          <TrendingSection />
          <RespectTrending />
        </section>

        {/* ── Section 4: Community Playlists ───────────────────────── */}
        <section id={SECTION_IDS.Playlists}>
          <PlaylistsSection radio={radio} />
        </section>

        {/* ── Section: AI Music Generator ───────────────────── */}
        <section id={SECTION_IDS.Create}>
          <AiMusicGenerator />
        </section>

        {/* ── Section: Binaural Beats ────────────────────────── */}
        <section id={SECTION_IDS.Binaural}>
          <BinauralBeats />
        </section>

        {/* ── Section: Liked Songs ─────────────────────────── */}
        <section id={SECTION_IDS.Liked}>
          <LikedSongsSection />
        </section>

        {/* ── Section: Listening History ───────────────────── */}
        <section id={SECTION_IDS.History}>
          <HistorySection />
        </section>

        {/* ── Section: Top Curators ──────────────────────────── */}
        <section id={SECTION_IDS.Curators}>
          <TopCurators />
        </section>

        {/* ── Section: Permaweb Library ─────────────────────── */}
        <section id={SECTION_IDS.Permaweb}>
          <PermawebLibrary />
        </section>
      </div>

      {/* ── Mint Track Modal ──────────────────────────────────── */}
      <MintTrack isOpen={showMint} onClose={() => setShowMint(false)} />
    </div>
  );
}
