'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  repoMap,
  botFleet,
  controlPlane,
  tooling,
  toolingNote,
  improvements,
  stats,
  quickLinks,
  labLifecycle,
  type BotStatus,
  type Priority,
  type LiveBot,
} from './data';

type Tab = 'repo' | 'bots' | 'lab' | 'tooling' | 'fixes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'repo', label: 'Repo map' },
  { id: 'bots', label: 'Bots' },
  { id: 'lab', label: 'Lab' },
  { id: 'tooling', label: 'Tooling' },
  { id: 'fixes', label: 'Improvements' },
];

const BOT_STATUS_STYLE: Record<BotStatus, string> = {
  live: 'bg-green-500/15 text-green-400 ring-green-500/30',
  pending: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  dormant: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
  decommissioned: 'bg-red-500/15 text-red-400 ring-red-500/30',
  external: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
};

const PRIORITY_STYLE: Record<Priority, string> = {
  P0: 'bg-red-500/15 text-red-400 ring-red-500/30',
  P1: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  P2: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
  P3: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ring-1 ${className}`}>
      {label}
    </span>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-[#0d1b2a] p-4">{children}</div>;
}

export default function OverviewPanel() {
  const [tab, setTab] = useState<Tab>('repo');

  return (
    <main className="min-h-screen bg-[#0a1628] px-4 pb-24 pt-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5">
          <h1 className="text-3xl font-bold sm:text-4xl">Project Overview</h1>
          <p className="mt-2 text-sm text-white/60">
            A live map of the ZAO OS repo, the bot fleet, the tooling, and what to improve next.
          </p>
        </header>

        <StatStrip />
        <QuickLinks />

        <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-[#f5a623] text-[#f5a623]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'repo' && <RepoMap />}
        {tab === 'bots' && <Bots />}
        {tab === 'lab' && <Lab />}
        {tab === 'tooling' && <Tooling />}
        {tab === 'fixes' && <Fixes />}
      </div>
    </main>
  );
}

function StatStrip() {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-white/10 bg-[#0d1b2a] px-3 py-2 text-center">
          <div className="text-lg font-bold text-[#f5a623]">{s.value}</div>
          <div className="text-[11px] text-white/50">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function QuickLinks() {
  return (
    <div className="mb-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((group) => (
          <div key={group.group} className="rounded-xl border border-white/10 bg-[#0d1b2a] p-3">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">{group.group}</h2>
            <ul className="space-y-1">
              {group.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target={l.external ? '_blank' : undefined}
                    rel={l.external ? 'noreferrer' : undefined}
                    className="flex items-baseline justify-between gap-2 text-sm text-white/80 hover:text-[#f5a623]"
                  >
                    <span>
                      {l.label}
                      {l.external && <span className="ml-1 text-white/30">↗</span>}
                    </span>
                    {l.note && <span className="shrink-0 text-[11px] text-white/30">{l.note}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepoMap() {
  return (
    <div className="space-y-5">
      {repoMap.map((group) => (
        <section key={group.group}>
          <h2 className="mb-2 text-sm font-semibold text-[#f5a623]">{group.group}</h2>
          <Card>
            <ul className="divide-y divide-white/5">
              {group.areas.map((a) => (
                <li key={a.path} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{a.area}</span>
                    <code className="ml-2 break-all text-xs text-white/40">{a.path}</code>
                    <p className="mt-0.5 text-xs text-white/60">{a.desc}</p>
                  </div>
                  {a.count && <span className="shrink-0 text-xs text-white/40">{a.count}</span>}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

function ago(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}

interface LiveState {
  loading: boolean;
  configured: boolean;
  bots: LiveBot[];
  error?: string;
}

function Bots() {
  const [live, setLive] = useState<LiveState>({ loading: true, configured: false, bots: [] });

  useEffect(() => {
    let alive = true;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/api/overview/bots', { cache: 'no-store' });
        const data = (await res.json()) as { configured?: boolean; bots?: LiveBot[]; error?: string };
        if (alive) {
          setLive({ loading: false, configured: Boolean(data.configured), bots: data.bots ?? [], error: data.error });
        }
      } catch {
        if (alive) setLive({ loading: false, configured: false, bots: [] });
      }
    };
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-[#f5a623]">Live status</h2>
        <Card>
          {live.loading && <p className="text-xs text-white/40">loading…</p>}
          {!live.loading && !live.configured && (
            <p className="text-xs text-white/50">
              Live status not configured — set <code className="text-white/70">COWORK_API_URL</code> +{' '}
              <code className="text-white/70">COWORK_READ_TOKEN</code> in ZAOOS env to pull real green/red here. Showing the documented fleet below.
            </p>
          )}
          {!live.loading && live.configured && live.bots.length === 0 && (
            <p className="text-xs text-white/50">No heartbeats yet{live.error ? ` (${live.error})` : ''}.</p>
          )}
          {!live.loading && live.bots.length > 0 && (
            <ul className="space-y-2">
              {[...live.bots].sort((a, b) => Number(a.online) - Number(b.online)).map((b) => {
                const dot = !b.online ? 'bg-red-500' : b.status === 'up' ? 'bg-green-500' : 'bg-amber-500';
                const task = typeof b.meta?.current_task === 'string' ? b.meta.current_task : undefined;
                return (
                  <li key={b.bot} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                      <span className="font-medium">{b.bot}</span>
                      {task && <span className="text-xs text-white/40">· {task}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-white/40">
                      {b.online ? b.status : 'offline'} · {ago(b.ageSeconds)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[#f5a623]">Control plane</h2>
        <Card>
          <p className="text-xs text-white/60">{controlPlane.summary}</p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {controlPlane.capabilities.map((c) => (
              <li key={c} className="text-xs text-white/80">• {c}</li>
            ))}
          </ul>
          <a
            href={controlPlane.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-xs font-medium text-[#f5a623] hover:text-[#ffd700]"
          >
            Open the board ↗
          </a>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[#f5a623]">Documented fleet</h2>
        <Card>
          <ul className="divide-y divide-white/5">
            {botFleet.map((b) => (
              <li key={b.name} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{b.name}</span>
                    <code className="text-xs text-white/40">{b.handle}</code>
                  </div>
                  <p className="mt-0.5 text-xs text-white/60">{b.board}</p>
                  <code className="text-[11px] text-white/30">{b.source}</code>
                </div>
                <Badge label={b.status} className={BOT_STATUS_STYLE[b.status]} />
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Lab() {
  return (
    <div className="space-y-5">
      <p className="text-xs text-white/50">
        ZAOOS is the lab — where ZAO experiments get prototyped before they earn their own home. A thing graduates when it&apos;s ready for production, public sharing, and new users; on graduation it gets its own repo / DB / domain and the code is deleted here so there&apos;s no drift.
      </p>
      {labLifecycle.map((stage) => (
        <section key={stage.stage}>
          <h2 className="mb-1 text-sm font-semibold text-[#f5a623]">{stage.stage}</h2>
          <p className="mb-2 text-xs text-white/40">{stage.blurb}</p>
          <Card>
            <ul className="divide-y divide-white/5">
              {stage.items.map((it) => (
                <li key={it.name} className="py-2 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium">{it.name}</span>
                  <p className="mt-0.5 text-xs text-white/60">{it.detail}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

function Tooling() {
  return (
    <div className="space-y-5">
      {tooling.map((group) => (
        <section key={group.group}>
          <h2 className="mb-2 text-sm font-semibold text-[#f5a623]">{group.group}</h2>
          <Card>
            <ul className="space-y-2">
              {group.skills.map((s) => (
                <li key={s.name} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                  <code className="shrink-0 text-sm font-medium text-white">{s.name}</code>
                  <span className="text-xs text-white/60">{s.desc}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
      <p className="text-xs text-white/40">{toolingNote}</p>
    </div>
  );
}

function Fixes() {
  return (
    <div className="space-y-3">
      {improvements.map((imp) => (
        <Card key={imp.title}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge label={imp.priority} className={PRIORITY_STYLE[imp.priority]} />
              <span className="text-sm font-medium">{imp.title}</span>
            </div>
            {imp.effort && <span className="shrink-0 text-xs text-white/40">{imp.effort}</span>}
          </div>
          <p className="mt-1.5 text-xs text-white/60">{imp.detail}</p>
        </Card>
      ))}
    </div>
  );
}
