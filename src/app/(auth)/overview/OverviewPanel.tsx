'use client';

import { useState, type ReactNode } from 'react';
import {
  repoMap,
  botFleet,
  controlPlane,
  tooling,
  toolingNote,
  improvements,
  type BotStatus,
  type Priority,
} from './data';

type Tab = 'repo' | 'bots' | 'tooling' | 'fixes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'repo', label: 'Repo map' },
  { id: 'bots', label: 'Bots' },
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

export default function OverviewPanel() {
  const [tab, setTab] = useState<Tab>('repo');

  return (
    <main className="min-h-screen bg-[#0a1628] px-4 pb-24 pt-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold sm:text-4xl">Project Overview</h1>
          <p className="mt-2 text-sm text-white/60">
            A live map of the ZAO OS repo, the bot fleet, the tooling, and what to improve next.
          </p>
        </header>

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
        {tab === 'tooling' && <Tooling />}
        {tab === 'fixes' && <Fixes />}
      </div>
    </main>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-[#0d1b2a] p-4">{children}</div>;
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

function Bots() {
  return (
    <div className="space-y-5">
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
        <h2 className="mb-2 text-sm font-semibold text-[#f5a623]">Fleet</h2>
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
