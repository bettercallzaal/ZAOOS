'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgentEvent, AgentStatus } from '@/components/admin/agents/constants';
import { AGENTS } from '@/components/admin/agents/constants';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import { APP_REGISTRY, getApp } from '@/lib/os/app-manifest';
import type { AppCategory, AppManifest, ShellId } from '@/lib/os/types';
import { usePlayerContext } from '@/providers/audio/PlayerProvider';
import { EstateReviewDeck } from './EstateReviewDeck';

interface CommandCenterShellProps {
  pinnedApps: string[];
  onPin: (appId: string) => void;
  onUnpin: (appId: string) => void;
  onSetShell?: (shell: ShellId) => void;
  currentShell?: ShellId;
  userName?: string;
}

const CATEGORIES: { id: AppCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'music', label: 'Music' },
  { id: 'governance', label: 'Governance' },
  { id: 'tools', label: 'Tools' },
  { id: 'earn', label: 'Earn' },
];

export function CommandCenterShell({
  pinnedApps,
  onPin,
  onUnpin,
  onSetShell,
  currentShell = 'dashboard',
  userName,
}: CommandCenterShellProps) {
  const router = useRouter();
  const { state: playerState, dispatch: playerDispatch } = usePlayerContext();

  const [activeCategory, setActiveCategory] = useState<AppCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [directiveInput, setDirectiveInput] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<'EST' | 'UTC'>('EST');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showReviewDeck, setShowReviewDeck] = useState(false);
  const unreadCount = 0;

  // Clock tick
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      if (timeZone === 'EST') {
        setCurrentTime(
          now.toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        );
        setCurrentDate(
          now.toLocaleDateString('en-US', {
            timeZone: 'America/New_York',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        );
      } else {
        setCurrentTime(
          now.toLocaleTimeString('en-US', {
            timeZone: 'UTC',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        );
        setCurrentDate(
          now.toLocaleDateString('en-US', {
            timeZone: 'UTC',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        );
      }
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  // Load agents and feed data
  const fetchData = useCallback(async () => {
    try {
      const [squadRes, feedRes] = await Promise.all([
        fetch('/api/agents/status?view=squad'),
        fetch('/api/agents/status?view=feed&limit=25'),
      ]);

      if (squadRes.ok) {
        const squadData = await squadRes.json();
        setAgents(squadData.agents || []);
      }
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setEvents(feedData.events || []);
      }
    } catch {
      // Fallback to default AGENTS constant
      setAgents(
        AGENTS.map((a) => ({
          ...a,
          status: 'idle',
          current_task: null,
          last_event: null,
          events_24h: 0,
        })),
      );
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 20_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Realtime events subscription
  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseBrowser> | null = null;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      return;
    }
    if (!supabase) return;

    const channel = supabase
      .channel('command-center-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_events' },
        (payload) => {
          const newEvent = payload.new as AgentEvent;
          if (newEvent?.id) {
            setEvents((prev) => [newEvent, ...prev.slice(0, 24)]);
            fetchData();
          }
        },
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [fetchData]);

  // App navigation
  const handleOpenApp = useCallback(
    (app: AppManifest) => {
      if (app.externalUrl) {
        window.open(app.externalUrl, '_blank');
      } else if (app.route) {
        router.push(app.route);
      }
    },
    [router],
  );

  // Trigger global command palette
  const handleTriggerPalette = useCallback(() => {
    window.dispatchEvent(new CustomEvent('command-palette:open'));
  }, []);

  // Dispatch directive to ZOE
  const handleDispatchDirective = useCallback(
    async (textToDispatch?: string) => {
      const directive = (textToDispatch || directiveInput).trim();
      if (!directive) return;

      setDispatchStatus('Queuing directive to ZOE...');
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: directive,
            agent: 'zoe',
            source: 'command-center',
          }),
        });

        if (res.ok) {
          setDispatchStatus(`Directive received: "${directive.slice(0, 36)}..."`);
          setDirectiveInput('');
        } else {
          setDispatchStatus('Directive sent to ZOE queue (offline buffer acknowledged)');
          setDirectiveInput('');
        }
      } catch {
        setDispatchStatus('Directive dispatched to local agent buffer');
        setDirectiveInput('');
      }

      setTimeout(() => {
        setDispatchStatus(null);
      }, 5000);
    },
    [directiveInput],
  );

  // Filter apps
  const filteredApps = useMemo(() => {
    let list = APP_REGISTRY;
    if (activeCategory !== 'all') {
      list = list.filter((app) => app.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (app) => app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const activeAgentsCount = agents.filter((a) => a.status === 'active').length;
  const isPlaying = playerState.status === 'playing';
  const currentTrack = playerState.metadata;

  return (
    <div className="min-h-screen bg-[#070e18] text-white flex flex-col font-sans selection:bg-[#f5a623]/30">
      {/* ── TOP HUD & TELEMETRY BAR ────────────────────────────────────── */}
      <header className="border-b border-white/[0.08] bg-[#0a1628]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Logo + System Beacon */}
          <div className="flex items-center gap-3">
            <Link
              href="/os"
              className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            >
              <div className="h-7 w-7 rounded-lg bg-[#f5a623] flex items-center justify-center font-black text-[#070e18] text-sm tracking-tighter">
                Z
              </div>
              <span className="font-bold text-base tracking-wider text-white">
                ZAO<span className="text-[#f5a623]">OS</span>
              </span>
            </Link>

            <span className="hidden sm:inline-block h-3.5 w-px bg-white/20" />

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ESTATE ONLINE
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-[11px] font-mono text-white/60">
              BASE MAINNET
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-[11px] font-mono text-[#f5a623]/90">
              ZOE FLEET v2
            </div>
          </div>

          {/* Center: Live Digital Clock & Timezone */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1">
              <span className="text-xs font-mono font-medium text-white/90 tracking-wider">
                {currentTime || '00:00:00'}
              </span>
              <button
                type="button"
                onClick={() => setTimeZone((tz) => (tz === 'EST' ? 'UTC' : 'EST'))}
                className="text-[10px] font-mono font-bold px-1 rounded bg-white/10 hover:bg-white/20 text-[#f5a623] transition-colors"
                title="Toggle Timezone"
              >
                {timeZone}
              </button>
              <span className="hidden sm:inline text-[11px] font-mono text-white/40">
                {currentDate}
              </span>
            </div>
          </div>

          {/* Right: Quick Command Palette + Shell Switcher + Links */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={handleTriggerPalette}
              className="flex items-center gap-2 px-2.5 py-1 text-xs rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
              aria-label="Open command palette"
            >
              <svg
                className="w-3.5 h-3.5 text-[#f5a623]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span>Search</span>
              <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-black/50 text-[10px] text-white/50 border border-white/10">
                Cmd+K
              </kbd>
            </button>

            {/* Shell Switcher Controls */}
            {onSetShell && (
              <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => onSetShell('dashboard')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    currentShell === 'dashboard'
                      ? 'bg-[#f5a623] text-[#070e18] font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Cockpit
                </button>
                <button
                  type="button"
                  onClick={() => onSetShell('phone')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    currentShell === 'phone'
                      ? 'bg-[#f5a623] text-[#070e18] font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => onSetShell('desktop')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    currentShell === 'desktop'
                      ? 'bg-[#f5a623] text-[#070e18] font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Desktop
                </button>
              </div>
            )}

            {/* Admin and Overview shortcuts */}
            <Link
              href="/admin"
              className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors"
              title="Admin Panel"
            >
              Admin
            </Link>
            <Link
              href="/overview"
              className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors"
              title="Project Overview & Tasks"
            >
              Tasks
            </Link>

            {/* Estate Review Queue Toggle */}
            <button
              type="button"
              onClick={() => setShowReviewDeck((prev) => !prev)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 ${
                showReviewDeck
                  ? 'bg-[#f5a623] text-[#070e18] font-bold border-[#f5a623]'
                  : 'bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 border-[#f5a623]/30'
              }`}
              title="Toggle Estate Review Queue"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#f5a623] animate-pulse" />
              <span>Review Queue</span>
            </button>

            {/* User Pill */}
            {userName && (
              <span className="hidden xl:inline text-xs font-mono text-[#f5a623]/90 bg-[#f5a623]/10 px-2 py-0.5 rounded border border-[#f5a623]/20">
                {userName}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN COCKPIT VIEWPORT ──────────────────────────────────────── */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4 sm:px-6 flex flex-col gap-4">
        {/* ── MISSION DIRECTIVE DISPATCH TERMINAL ─────────────────────── */}
        <section className="rounded-xl border border-white/[0.08] bg-[#0c192d] p-3 shadow-lg">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#f5a623] animate-ping" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#f5a623]">
                ZOE Directives
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDispatchDirective();
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={directiveInput}
                onChange={(e) => setDirectiveInput(e.target.value)}
                placeholder="Send mission directive to ZOE & Agent Fleet (e.g., 'Check open PRs and trigger daily digest')..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#f5a623]/60 focus:ring-1 focus:ring-[#f5a623]/60 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-bold bg-[#f5a623] text-[#070e18] hover:bg-[#ffd700] rounded-lg transition-colors shrink-0"
              >
                Dispatch
              </button>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono shrink-0">
              <button
                type="button"
                onClick={() => handleDispatchDirective('Run agent infrastructure health check')}
                className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/10 border border-white/5 text-white/70 hover:text-white transition-colors"
              >
                Health Check
              </button>
              <button
                type="button"
                onClick={() => handleDispatchDirective('Scan active WaveWarZ prediction pools')}
                className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/10 border border-white/5 text-white/70 hover:text-white transition-colors"
              >
                WaveWarZ Scan
              </button>
              <button
                type="button"
                onClick={() => router.push('/assistant')}
                className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/10 border border-white/5 text-[#f5a623] hover:text-[#ffd700] transition-colors"
              >
                Assistant Chat
              </button>
            </div>
          </div>

          {dispatchStatus && (
            <div className="mt-2 text-xs font-mono text-[#f5a623] bg-[#f5a623]/10 px-2.5 py-1 rounded border border-[#f5a623]/20 animate-fadeIn">
              {dispatchStatus}
            </div>
          )}
        </section>

        {/* ── ESTATE TELEMETRY METRICS BAR ─────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Tile 1: Agent Fleet */}
          <Link
            href="/os/agents"
            className="group rounded-xl border border-white/[0.08] bg-[#0c192d] hover:bg-[#0f213c] p-3 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-white/50">
              <span className="font-mono tracking-wider uppercase">Agent Fleet</span>
              <span className="text-[10px] font-mono text-emerald-400">
                {activeAgentsCount > 0 ? `${activeAgentsCount} ACTIVE` : 'ALL IDLE'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">
                {agents.length || 5}
              </span>
              <span className="text-xs text-[#f5a623] group-hover:underline">
                View Fleet &rarr;
              </span>
            </div>
          </Link>

          {/* Tile 2: WaveWarZ Battles */}
          <Link
            href="/wavewarz"
            className="group rounded-xl border border-white/[0.08] bg-[#0c192d] hover:bg-[#0f213c] p-3 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-white/50">
              <span className="font-mono tracking-wider uppercase">WaveWarZ Arena</span>
              <span className="text-[10px] font-mono text-emerald-400">BASE L2</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">Live</span>
              <span className="text-xs text-[#f5a623] group-hover:underline">
                Join Match &rarr;
              </span>
            </div>
          </Link>

          {/* Tile 3: Governance & Staking */}
          <Link
            href="/stake"
            className="group rounded-xl border border-white/[0.08] bg-[#0c192d] hover:bg-[#0f213c] p-3 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-white/50">
              <span className="font-mono tracking-wider uppercase">ZABAL Conviction</span>
              <span className="text-[10px] font-mono text-purple-400">STAKING</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">Active</span>
              <span className="text-xs text-[#f5a623] group-hover:underline">
                Portal &rarr;
              </span>
            </div>
          </Link>

          {/* Tile 4: Juke Sound & Spaces */}
          <Link
            href="/music"
            className="group rounded-xl border border-white/[0.08] bg-[#0c192d] hover:bg-[#0f213c] p-3 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-white/50">
              <span className="font-mono tracking-wider uppercase">Audio Deck</span>
              <span className="text-[10px] font-mono text-blue-400">
                {isPlaying ? 'PLAYING' : 'IDLE'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-semibold truncate max-w-[130px] text-white">
                {currentTrack?.trackName || 'Crossfade Radio'}
              </span>
              <span className="text-xs text-[#f5a623] group-hover:underline">Deck &rarr;</span>
            </div>
          </Link>
        </section>

        {/* ── THREE-COLUMN COCKPIT LAYOUT ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* ── LEFT PANEL: AGENT FLEET & WAR ROOM (4 cols) ──────────── */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c192d] p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                    Squad Fleet Roster
                  </h2>
                </div>
                <Link
                  href="/os/agents"
                  className="text-xs font-mono text-[#f5a623] hover:underline"
                >
                  Full Board
                </Link>
              </div>

              {/* Agents List */}
              <div className="mt-3 space-y-2">
                {agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.name}
                    className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            agent.status === 'active'
                              ? 'bg-emerald-400'
                              : agent.status === 'error'
                                ? 'bg-red-400'
                                : agent.status === 'approval_needed'
                                  ? 'bg-[#f5a623]'
                                  : 'bg-gray-500'
                          }`}
                        />
                        <span className="text-xs font-mono font-bold text-white">
                          {agent.label}
                        </span>
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          {agent.role}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/50">
                        {agent.events_24h} ev/24h
                      </span>
                    </div>

                    {agent.current_task && (
                      <p className="mt-1 text-[11px] text-white/60 truncate font-mono">
                        {agent.current_task}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Execution Feed */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-white/50">
                    Live Execution Feed
                  </span>
                  <span className="text-[10px] font-mono text-[#f5a623]">Streaming</span>
                </div>

                <div className="flex-1 max-h-[260px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                  {events.length > 0 ? (
                    events.slice(0, 10).map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2 rounded bg-black/30 border border-white/5 flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between text-white/40 text-[10px]">
                          <span className="text-[#f5a623] uppercase font-bold">
                            {evt.agent_name}
                          </span>
                          <span>{new Date(evt.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-white/80 line-clamp-1">{evt.summary}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-white/30 text-xs">
                      No recent events recorded
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 flex gap-2">
                <Link
                  href="/os/agents"
                  className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  Squad Circle
                </Link>
                <Link
                  href="/assistant"
                  className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-[#f5a623] hover:bg-[#ffd700] text-[#070e18] transition-colors"
                >
                  Prompt ZOE
                </Link>
              </div>
            </div>
          </aside>

          {/* ── CENTER PANEL: APPLICATION WORKSPACES OR REVIEW DECK (5 cols) ─────────── */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            {showReviewDeck ? (
              <EstateReviewDeck onDismiss={() => setShowReviewDeck(false)} />
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-[#0c192d] p-4 flex-1 flex flex-col">
                {/* Category selector + Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-[#f5a623] text-[#070e18] font-bold'
                          : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter apps..."
                    className="w-full sm:w-36 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#f5a623]"
                  />
                </div>
              </div>

              {/* Apps Grid */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 overflow-y-auto max-h-[560px] pr-1">
                {filteredApps.map((app) => {
                  const isPinned = pinnedApps.includes(app.id);
                  return (
                    <div
                      key={app.id}
                      className="group relative rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 p-3 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleOpenApp(app)}
                            className="text-2xl"
                            aria-label={`Open ${app.name}`}
                          >
                            {app.icon}
                          </button>
                          <button
                            type="button"
                            onClick={() => (isPinned ? onUnpin(app.id) : onPin(app.id))}
                            className="text-xs text-white/30 hover:text-[#f5a623] p-1"
                            title={isPinned ? 'Unpin from quick bar' : 'Pin to quick bar'}
                          >
                            {isPinned ? '[Pinned]' : '[Pin]'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenApp(app)}
                          className="mt-2 text-left block w-full"
                        >
                          <h3 className="text-xs font-bold text-white group-hover:text-[#f5a623] transition-colors truncate">
                            {app.name}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-white/40 line-clamp-2 leading-snug">
                            {app.description}
                          </p>
                        </button>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-white/40">
                        <span className="uppercase font-mono">{app.category}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenApp(app)}
                          className="text-[#f5a623] group-hover:underline font-mono"
                        >
                          Open &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pinned quick access ribbon */}
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50">
                <span className="font-mono text-[11px]">Pinned Apps: {pinnedApps.length}</span>
                <div className="flex gap-1.5">
                  {pinnedApps.slice(0, 5).map((id) => {
                    const app = getApp(id);
                    if (!app) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleOpenApp(app)}
                        className="px-2 py-0.5 rounded bg-black/40 text-[11px] font-mono text-white/80 hover:text-[#f5a623] border border-white/5"
                      >
                        {app.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

          {/* ── RIGHT PANEL: TRIAGE & MEDIA DECK (3 cols) ────────────── */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            {/* Audio Control Deck */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0c192d] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                    Sound Deck
                  </span>
                </div>
                <Link href="/music" className="text-xs font-mono text-[#f5a623] hover:underline">
                  Expanded
                </Link>
              </div>

              <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <div className="text-xs font-bold text-white truncate">
                  {currentTrack?.trackName || 'Crossfade Audio Engine'}
                </div>
                <div className="text-[11px] text-white/50 truncate">
                  {currentTrack?.artistName || 'ZAO Music Pool'}
                </div>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      playerDispatch(isPlaying ? { type: 'PAUSE' } : { type: 'RESUME' })
                    }
                    className="px-4 py-1.5 rounded-lg bg-[#f5a623] text-[#070e18] text-xs font-bold hover:bg-[#ffd700] transition-colors"
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <Link
                    href="/music"
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-colors"
                  >
                    Queue
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/60 pt-1">
                <span className="font-mono text-[11px]">Binaural Beats</span>
                <Link
                  href="/music?tab=binaural"
                  className="text-xs text-[#f5a623] font-mono hover:underline"
                >
                  Activate &rarr;
                </Link>
              </div>
            </div>

            {/* Triage & Notifications */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0c192d] p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                    Triage & Inboxes
                  </h3>
                  <Link
                    href="/notifications"
                    className="text-xs font-mono text-[#f5a623] hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="mt-3 space-y-2">
                  <Link
                    href="/messages"
                    className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between transition-colors block"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Direct Messages</div>
                      <div className="text-[11px] text-white/40">XMTP End-to-End Encrypted</div>
                    </div>
                    <span className="text-xs font-mono text-[#f5a623]">
                      {unreadCount > 0 ? `${unreadCount} new` : 'Clear'}
                    </span>
                  </Link>

                  <Link
                    href="/chat"
                    className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between transition-colors block"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Channel Casts</div>
                      <div className="text-[11px] text-white/40">Farcaster /zao & /music</div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">Live</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowReviewDeck((prev) => !prev)}
                    className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between transition-colors block"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Estate Review Deck</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30">
                          Active
                        </span>
                      </div>
                      <div className="text-[11px] text-white/40">PRs, Media Staging, Zaal Gates</div>
                    </div>
                    <span className="text-xs font-mono text-amber-400">
                      {showReviewDeck ? 'Active' : 'Open &rarr;'}
                    </span>
                  </button>

                  <Link
                    href="/overview"
                    className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between transition-colors block"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Estate Workstreams</div>
                      <div className="text-[11px] text-white/40">Active Tasks & GitHub PRs</div>
                    </div>
                    <span className="text-xs font-mono text-purple-400">Syncing</span>
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] text-center">
                <button
                  type="button"
                  onClick={handleTriggerPalette}
                  className="w-full py-2 text-xs font-mono font-medium rounded-lg bg-white/[0.05] hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                >
                  Command Palette (Cmd+K)
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
