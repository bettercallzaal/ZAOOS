'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePlayer } from '@/providers/audio';
import { useRadioContext as useRadio } from '@/providers/audio/RadioProvider';
import { communityConfig } from '@/../community.config';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { timeAgoSimple as timeAgo } from '@/lib/format/timeAgo';
import { RespectTrending } from '@/components/music/RespectTrending';

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

type Submission = {
  id: string;
  url: string;
  title: string | null;
  artist: string | null;
  track_type: string;
  submitted_by_username: string;
  submitted_by_display: string | null;
  created_at: string;
  vote_count: number;
  user_voted: boolean;
};

const TABS = ['Radio', 'Discover', 'Track of the Day', 'Submissions', 'Trending', 'Playlists', 'Binaural', 'Liked', 'History', 'Curators'] as const;
type Tab = (typeof TABS)[number];

const SECTION_IDS: Record<Tab, string> = {
  Radio: 'section-radio',
  Discover: 'section-discover',
  'Track of the Day': 'section-totd',
  Submissions: 'section-submissions',
  Trending: 'section-trending',
  Playlists: 'section-playlists',
  Binaural: 'section-binaural',
  Liked: 'section-liked',
  History: 'section-history',
  Curators: 'section-curators',
};



// ── Main Component ─────────────────────────────────────────────────────

export function MusicPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Radio');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabBarRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const player = usePlayer();
  const radio = useRadio();

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

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-24 md:pt-12">
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
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function RadioHero({
  player,
  radio,
  onPlayPause,
}: {
  player: ReturnType<typeof usePlayer>;
  radio: ReturnType<typeof useRadio>;
  onPlayPause: () => void;
}) {
  const isPlaying = radio.isRadioMode && player.metadata;

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#1a2a3a] via-[#0d1b2a] to-[#0a1628] border border-gray-800">
      {isPlaying ? (
        /* ── Now Playing State ──────────────────────────────────── */
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" />
            <p className="text-xs font-semibold text-[#f5a623] uppercase tracking-wider">
              Now Playing
            </p>
            {radio.radioPlaylist && (
              <span className="text-xs text-gray-500 ml-1">
                &middot; {radio.radioPlaylist.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Album art */}
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 shadow-lg ring-1 ring-[#f5a623]/20">
              {player.metadata?.artworkUrl ? (
                <Image
                  src={player.metadata.artworkUrl}
                  alt={player.metadata.trackName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
                  <MusicIcon className="w-8 h-8 text-[#f5a623]/40" />
                </div>
              )}
              {player.isPlaying && (
                <div className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-t from-black/50 to-transparent">
                  <PlayingBars />
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white truncate">
                {player.metadata?.trackName || 'Unknown Track'}
              </p>
              {player.metadata?.artistName && (
                <p className="text-sm text-gray-400 truncate mt-0.5">
                  {player.metadata.artistName}
                </p>
              )}
              {radio.radioPlaylist && (
                <p className="text-xs text-gray-500 mt-1">
                  {communityConfig.music.radioName}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <button
              onClick={radio.prevRadioTrack}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Previous track"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={onPlayPause}
              disabled={player.isLoading}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] disabled:opacity-50 transition-colors shadow-lg shadow-[#f5a623]/25"
              aria-label={player.isPlaying ? 'Pause' : 'Play'}
            >
              {player.isLoading ? (
                <div className="w-5 h-5 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
              ) : player.isPlaying ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={radio.nextRadioTrack}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Next track"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Listen Together */}
          <div className="flex justify-center mt-4">
            <Link
              href="/calls"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-full transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <svg className="w-3.5 h-3.5 -ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Listen Together
            </Link>
          </div>

          {/* Station pills */}
          {radio.availableStations.length > 1 && (
            <div className="flex gap-2 mt-5 overflow-x-auto scrollbar-hide justify-center">
              {radio.availableStations.map((name, i) => (
                <button
                  key={name}
                  onClick={() => radio.switchStation(i)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    i === radio.currentStationIndex
                      ? 'bg-[#f5a623]/20 text-[#f5a623] ring-1 ring-[#f5a623]/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Idle State ─────────────────────────────────────────── */
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center">
              <div className="animate-pulse">
                <MusicIcon className="w-8 h-8 text-[#f5a623]" />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            {communityConfig.music.radioName}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Community radio powered by Audius
          </p>

          {/* Station picker pills */}
          {communityConfig.music.radioPlaylists.length > 0 && (
            <div className="flex gap-2 justify-center flex-wrap mb-5">
              {communityConfig.music.radioPlaylists.map((pl) => (
                <span
                  key={pl.name}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400"
                >
                  {pl.name}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => radio.startRadio()}
            disabled={radio.radioLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f5a623] text-[#0a1628] font-semibold text-sm hover:bg-[#ffd700] disabled:opacity-50 transition-colors shadow-lg shadow-[#f5a623]/25"
          >
            {radio.radioLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Listening
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Submissions Section ────────────────────────────────────────────────

function SubmissionsSection({
  submissions,
  setSubmissions,
  loading,
  player,
}: {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  loading: boolean;
  player: ReturnType<typeof usePlayer>;
}) {
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [artworkCache, setArtworkCache] = useState<Record<string, string>>({});

  const handlePlay = useCallback(async (sub: Submission) => {
    // If already playing this track, toggle pause/resume
    if (player.metadata?.url === sub.url) {
      if (player.isPlaying) {
        player.pause();
      } else {
        player.resume();
      }
      return;
    }

    setLoadingTrackId(sub.id);
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(sub.url)}`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      const metadata = await res.json();

      // Cache artwork for this submission
      if (metadata.artworkUrl) {
        setArtworkCache((prev) => ({ ...prev, [sub.id]: metadata.artworkUrl }));
      }

      player.play(metadata);
    } catch {
      // Fallback: play with basic metadata
      player.play({
        id: sub.id,
        type: sub.track_type as import('@/types/music').TrackType,
        trackName: sub.title || 'Untitled Track',
        artistName: sub.artist || '',
        artworkUrl: '',
        url: sub.url,
        feedId: `submission-${sub.id}`,
      });
    } finally {
      setLoadingTrackId(null);
    }
  }, [player]);

  const handleVote = useCallback(async (sub: Submission) => {
    if (votingId) return;
    setVotingId(sub.id);

    // Capture previous state for rollback
    const prevVoted = sub.user_voted;
    const prevCount = sub.vote_count;

    // Optimistic update
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === sub.id
          ? {
              ...s,
              user_voted: !s.user_voted,
              vote_count: s.user_voted ? s.vote_count - 1 : s.vote_count + 1,
            }
          : s,
      ),
    );

    try {
      const res = await fetch('/api/music/submissions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: sub.id }),
      });

      if (!res.ok) throw new Error('Vote failed');

      const { voted, voteCount } = await res.json();

      // Reconcile with server truth
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, user_voted: voted, vote_count: voteCount }
            : s,
        ),
      );
    } catch {
      // Revert optimistic update on error
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, user_voted: prevVoted, vote_count: prevCount }
            : s,
        ),
      );
    } finally {
      setVotingId(null);
    }
  }, [votingId, setSubmissions]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Community Submissions</h2>
        <Link
          href="/chat"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
        >
          Submit
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b2a] border border-gray-800 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-800" />
              <div className="w-10 h-10 rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[#0d1b2a] border border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623]/10 to-[#f5a623]/5 flex items-center justify-center mx-auto mb-3">
            <MusicIcon className="w-7 h-7 text-[#f5a623]/40" />
          </div>
          <p className="text-sm font-medium text-gray-400">No submissions yet</p>
          <p className="text-xs text-gray-500 mt-1">Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => {
            const isCurrentTrack = player.metadata?.url === sub.url;
            const isTrackPlaying = isCurrentTrack && player.isPlaying;
            const isTrackLoading = loadingTrackId === sub.id;
            const artwork = artworkCache[sub.id];

            return (
              <div
                key={sub.id}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                  isCurrentTrack
                    ? 'bg-[#0d1b2a] border-[#f5a623]/30'
                    : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Play button */}
                <button
                  onClick={() => handlePlay(sub)}
                  disabled={isTrackLoading}
                  className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    isCurrentTrack
                      ? 'bg-[#f5a623] text-[#0a1628]'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-label={isTrackPlaying ? 'Pause' : 'Play'}
                >
                  {isTrackLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isTrackPlaying ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Artwork 40x40 */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] flex items-center justify-center overflow-hidden">
                  {artwork || (isCurrentTrack && player.metadata?.artworkUrl) ? (
                    <Image
                      src={artwork || player.metadata?.artworkUrl || ''}
                      alt={sub.title || 'Track artwork'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <MusicIcon className="w-4 h-4 text-[#f5a623]/30" />
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isCurrentTrack ? 'text-[#f5a623]' : 'text-white'
                  }`}>
                    {sub.title || 'Untitled Track'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {sub.artist && (
                      <span className="text-xs text-gray-400 truncate max-w-[120px]">
                        {sub.artist}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 truncate">
                      @{sub.submitted_by_username}
                    </span>
                  </div>
                </div>

                {/* Vote button */}
                <button
                  onClick={() => handleVote(sub)}
                  disabled={votingId === sub.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                    sub.user_voted
                      ? 'bg-[#f5a623]/15 text-[#f5a623]'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                  }`}
                  aria-label={sub.user_voted ? 'Remove vote' : 'Upvote'}
                >
                  <span className="text-sm">{'\uD83D\uDD25'}</span>
                  {sub.vote_count > 0 && (
                    <span>{sub.vote_count}</span>
                  )}
                </button>

                {/* Time ago */}
                <span className="text-[10px] text-gray-600 flex-shrink-0 hidden sm:block">
                  {timeAgo(sub.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Trending Section (Audius API) ───────────────────────────────────────

type AudiusTrendingTrack = {
  id: string;
  title: string;
  artwork: { '150x150'?: string; '480x480'?: string } | null;
  user: { name: string };
  permalink: string;
  duration: number;
};

function TrendingSection() {
  const [tracks, setTracks] = useState<AudiusTrendingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const player = usePlayer();

  useEffect(() => {
    const controller = new AbortController();

    fetch('https://api.audius.co/v1/tracks/trending?app_name=ZAO-OS&limit=8', {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((json) => {
        if (json?.data) {
          setTracks(json.data);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const handlePlay = (track: AudiusTrendingTrack) => {
    const streamUrl = `https://api.audius.co/v1/tracks/${track.id}/stream?app_name=ZAO-OS`;
    player.play({
      id: track.id,
      trackName: track.title,
      artistName: track.user.name,
      artworkUrl: track.artwork?.['480x480'] || track.artwork?.['150x150'] || '',
      streamUrl,
      url: `https://audius.co${track.permalink}`,
      type: 'audius',
      feedId: `trending-${track.id}`,
    });
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Trending on Audius</h2>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] animate-pulse">
              <div className="w-[140px] h-[140px] rounded-xl bg-gray-800 mb-2" />
              <div className="h-3.5 bg-gray-800 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-800/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error || tracks.length === 0 ? (
        <div className="text-center py-10 rounded-xl bg-[#0d1b2a] border border-gray-800">
          <MusicIcon className="w-8 h-8 text-[#f5a623]/30 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Trending unavailable</p>
          <p className="text-xs text-gray-600 mt-1">Check back later</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {tracks.map((track) => {
            const isThisTrack = player.metadata?.feedId === `trending-${track.id}`;
            const isThisPlaying = isThisTrack && player.isPlaying;

            return (
              <button
                key={track.id}
                onClick={() => handlePlay(track)}
                className="flex-shrink-0 w-[140px] group text-left"
              >
                {/* Album art */}
                <div className={`w-[140px] h-[140px] rounded-xl border mb-2 overflow-hidden relative transition-colors ${
                  isThisTrack
                    ? 'border-[#f5a623]/40 shadow-lg shadow-[#f5a623]/10'
                    : 'border-gray-800 group-hover:border-gray-700'
                }`}>
                  <ArtworkImage
                    src={track.artwork?.['480x480'] || track.artwork?.['150x150'] || null}
                    alt={track.title}
                    fill
                    className="object-cover"
                    sizes="140px"
                  />
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                    isThisPlaying ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100 bg-black/30'
                  }`}>
                    {isThisPlaying ? (
                      <div className="flex items-end gap-px">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
                            style={{
                              height: `${6 + i * 3}px`,
                              animationDelay: `${i * 0.15}s`,
                              animationDuration: '0.6s',
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#f5a623]/90 flex items-center justify-center">
                        <svg className="w-5 h-5 ml-0.5 text-[#0a1628]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-medium truncate ${isThisTrack ? 'text-[#f5a623]' : 'text-white'}`}>
                  {track.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{track.user.name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Playlists Section ──────────────────────────────────────────────────

function PlaylistsSection({ radio }: { radio: ReturnType<typeof useRadio> }) {
  const playlists = communityConfig.music.radioPlaylists;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Playlists</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {playlists.map((pl, i) => {
          const isActive =
            radio.isRadioMode && radio.currentStationIndex === i;

          return (
            <button
              key={pl.name}
              onClick={() => {
                if (isActive) return;
                if (radio.isRadioMode) {
                  radio.switchStation(i);
                } else {
                  radio.startRadio(i);
                }
              }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
                  : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Playlist artwork */}
              <div className={`w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden ${
                isActive
                  ? 'bg-[#f5a623]/20 ring-1 ring-[#f5a623]/30'
                  : 'bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]'
              }`}>
                {isActive ? (
                  <PlayingBars />
                ) : (
                  <MusicIcon className="w-6 h-6 text-[#f5a623]/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  isActive ? 'text-[#f5a623]' : 'text-white'
                }`}>
                  {pl.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{pl.artist}</p>
              </div>

              {/* Play indicator */}
              <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
                isActive
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'bg-white/5 text-gray-400 group-hover:text-white'
              }`}>
                {isActive ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Liked Songs Section ─────────────────────────────────────────────────

type LikedSong = {
  id: string;
  url: string;
  platform: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  stream_url: string | null;
  duration: number;
  created_at: string;
};

function LikedSongsSection() {
  const [songs, setSongs] = useState<LikedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const player = usePlayer();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music/library/like?list=true', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        setSongs(data.songs || []);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handlePlay = useCallback(async (song: LikedSong) => {
    if (player.metadata?.url === song.url) {
      if (player.isPlaying) player.pause();
      else player.resume();
      return;
    }

    setLoadingTrackId(song.id);
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(song.url)}`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      const metadata = await res.json();
      player.play(metadata);
    } catch {
      player.play({
        id: song.id,
        type: (song.platform || 'audio') as import('@/types/music').TrackType,
        trackName: song.title || 'Untitled Track',
        artistName: song.artist || '',
        artworkUrl: song.artwork_url || '',
        url: song.url,
        feedId: `liked-${song.id}`,
      });
    } finally {
      setLoadingTrackId(null);
    }
  }, [player]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <h2 className="text-lg font-bold text-white">Liked Songs</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b2a] border border-gray-800 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error || songs.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[#0d1b2a] border border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-red-400/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">No liked songs yet</p>
          <p className="text-xs text-gray-500 mt-1">Tap the heart on any track</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => {
            const isCurrentTrack = player.metadata?.url === song.url;
            const isTrackPlaying = isCurrentTrack && player.isPlaying;
            const isTrackLoading = loadingTrackId === song.id;

            return (
              <button
                key={song.id}
                onClick={() => handlePlay(song)}
                disabled={isTrackLoading}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  isCurrentTrack
                    ? 'bg-[#0d1b2a] border-[#f5a623]/30'
                    : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Artwork */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] relative">
                  <ArtworkImage
                    src={song.artwork_url}
                    alt={song.title || 'Track artwork'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                  {isTrackPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayingBars />
                    </div>
                  )}
                  {isTrackLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isCurrentTrack ? 'text-[#f5a623]' : 'text-white'
                  }`}>
                    {song.title || 'Untitled Track'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {song.artist && (
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">
                        {song.artist}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {song.platform === 'applemusic' ? 'Apple Music' : song.platform === 'soundxyz' ? 'Sound.xyz' : song.platform}
                    </span>
                  </div>
                </div>

                {/* Heart icon (filled) */}
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── History Section ─────────────────────────────────────────────────────

type HistorySong = {
  id: string;
  url: string;
  platform: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  stream_url: string | null;
  duration: number;
  play_count: number;
  last_played_at: string | null;
  created_at: string;
};

function HistorySection() {
  const [songs, setSongs] = useState<HistorySong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const player = usePlayer();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music/library?sort=played&limit=20', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        // Filter to only songs that have been played (have last_played_at)
        const played = (data.songs || []).filter((s: HistorySong) => s.last_played_at);
        setSongs(played);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handlePlay = useCallback(async (song: HistorySong) => {
    if (player.metadata?.url === song.url) {
      if (player.isPlaying) player.pause();
      else player.resume();
      return;
    }

    setLoadingTrackId(song.id);
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(song.url)}`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      const metadata = await res.json();
      player.play(metadata);
    } catch {
      player.play({
        id: song.id,
        type: (song.platform || 'audio') as import('@/types/music').TrackType,
        trackName: song.title || 'Untitled Track',
        artistName: song.artist || '',
        artworkUrl: song.artwork_url || '',
        url: song.url,
        streamUrl: song.stream_url || undefined,
        feedId: `history-${song.id}`,
      });
    } finally {
      setLoadingTrackId(null);
    }
  }, [player]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-bold text-white">Listening History</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b2a] border border-gray-800 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error || songs.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[#0d1b2a] border border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623]/10 to-[#f5a623]/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-[#f5a623]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">No listening history yet</p>
          <p className="text-xs text-gray-500 mt-1">Play some tracks to see them here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => {
            const isCurrentTrack = player.metadata?.url === song.url;
            const isTrackPlaying = isCurrentTrack && player.isPlaying;
            const isTrackLoading = loadingTrackId === song.id;

            return (
              <button
                key={song.id}
                onClick={() => handlePlay(song)}
                disabled={isTrackLoading}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  isCurrentTrack
                    ? 'bg-[#0d1b2a] border-[#f5a623]/30'
                    : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Artwork */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] relative">
                  <ArtworkImage
                    src={song.artwork_url}
                    alt={song.title || 'Track artwork'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                  {isTrackPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayingBars />
                    </div>
                  )}
                  {isTrackLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isCurrentTrack ? 'text-[#f5a623]' : 'text-white'
                  }`}>
                    {song.title || 'Untitled Track'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {song.artist && (
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">
                        {song.artist}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {song.platform === 'applemusic' ? 'Apple Music' : song.platform === 'soundxyz' ? 'Sound.xyz' : song.platform}
                    </span>
                  </div>
                </div>

                {/* Last played time */}
                <div className="flex flex-col items-end flex-shrink-0">
                  {song.last_played_at && (
                    <span className="text-[10px] text-gray-500">
                      {timeAgo(song.last_played_at)}
                    </span>
                  )}
                  {song.play_count > 1 && (
                    <span className="text-[10px] text-gray-600 mt-0.5">
                      {song.play_count} plays
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared small components ────────────────────────────────────────────

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function PlayingBars() {
  return (
    <div className="flex items-end gap-px">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
          style={{
            height: `${6 + i * 3}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

// ── Track of the Day Banner (above tabs) ──────────────────────────────

function TrackOfTheDayBanner() {
  const [featured, setFeatured] = useState<{
    track_title: string | null;
    track_artist: string | null;
    artwork_url: string | null;
    track_url: string;
    nominated_by_username: string | null;
    votes_count: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music/track-of-day', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        if (data.selected) {
          setFeatured(data.selected);
        } else if (data.nominations?.length > 0) {
          // Show top nomination as preview
          setFeatured(data.nominations[0]);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, []);

  if (!featured) return null;

  return (
    <div className="mb-4 rounded-xl bg-gradient-to-r from-[#f5a623]/10 via-[#0d1b2a] to-[#f5a623]/5 border border-[#f5a623]/20 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        {/* Star icon */}
        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          {featured.artwork_url ? (
            <Image
              src={featured.artwork_url}
              alt={featured.track_title || 'Track artwork'}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="text-[10px] font-semibold text-[#f5a623] uppercase tracking-wider">
              Track of the Day
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate mt-0.5">
            {featured.track_title || 'Untitled Track'}
          </p>
          {featured.track_artist && (
            <p className="text-xs text-gray-400 truncate">
              {featured.track_artist}
            </p>
          )}
        </div>

        {/* Arrow linking to the TOTD section */}
        <button
          onClick={() => {
            const el = document.getElementById('section-totd');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="w-8 h-8 flex-shrink-0 rounded-full bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
          aria-label="View Track of the Day"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Skeleton for dynamic TrackOfTheDay loading ────────────────────────

function TrackOfTheDayTabSkeleton() {
  return (
    <div className="rounded-2xl bg-[#0d1b2a] border border-[#1a2a3a] p-6 animate-pulse">
      <div className="h-6 w-48 bg-[#1a2a3a] rounded mb-4" />
      <div className="h-32 bg-[#1a2a3a] rounded mb-4" />
      <div className="space-y-3">
        <div className="h-16 bg-[#1a2a3a] rounded" />
        <div className="h-16 bg-[#1a2a3a] rounded" />
      </div>
    </div>
  );
}
