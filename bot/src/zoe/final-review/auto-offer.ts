/**
 * Final-reviewer auto-offer (item B of the 7 Nov zoe-devz audit; Zaal,
 * 2026-11-07, "flag stays off").
 *
 * Without this, a card exists only when Zaal types /finalreview. With
 * ZOE_FINAL_REVIEW=1 AND ZOE_FINAL_REVIEW_AUTO=1, ZOE lists the open PRs of
 * the repos in ZOE_FINAL_REVIEW_REPOS on an interval and runs the same
 * reviewPr() on each new head. Every gate, the grade, the card store and the
 * owner-only tap are the existing ones (flow.ts); this file only decides WHICH
 * PRs to ask about and HOW OFTEN.
 *
 * Cost bound (agent-loops.md rule 5): a head is settled once it is carded or
 * graded (flow.ts NoCardStage), so a PR that fails the grade is not re-graded
 * every tick, while a PR stopped at the gates (CI running, no verdict yet) is
 * read again next tick. Held and draft PRs are skipped from the list, since the
 * gates refuse them. Per tick: at most MAX_READS_PER_TICK PR reads (gh only)
 * and at most MAX_GRADES_PER_TICK reviews that reach the model grade. No repos configured means no
 * reads at all (fail closed). Both flags unset means nothing is scheduled.
 *
 * Per day (UTC): at most ZOE_FINAL_REVIEW_AUTO_DAY_MAX model grades (default
 * DEFAULT_GRADES_PER_DAY, clamped 1..48). The day count and the settled heads
 * are saved after every tick (wire.ts), so a restart neither resets the day's
 * budget nor re-grades heads it already settled. A missing or unreadable state
 * file starts a fresh day with nothing settled; it never blocks the tick.
 */

import type { CardView, ReviewOutcome } from './flow';
import { isFullSha, isRepoSlug } from './merge-line';
import type { GhRunner } from './snapshot';

export const MAX_READS_PER_TICK = 20;
export const MAX_GRADES_PER_TICK = 3;
export const DEFAULT_INTERVAL_MIN = 30;
export const DEFAULT_GRADES_PER_DAY = 12;
/** Settled keys kept across a restart; the oldest are dropped first. */
export const SETTLED_KEEP = 500;

export function autoOfferEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_FINAL_REVIEW === '1' && env.ZOE_FINAL_REVIEW_AUTO === '1';
}

/** Repos to watch. Unset or invalid entries are dropped; empty means none. */
export function autoOfferRepos(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.ZOE_FINAL_REVIEW_REPOS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => isRepoSlug(s));
}

/** Interval in ms, from ZOE_FINAL_REVIEW_AUTO_MIN clamped to 10..120 minutes. */
export function autoOfferIntervalMs(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.ZOE_FINAL_REVIEW_AUTO_MIN);
  const min =
    Number.isFinite(n) && n > 0 ? Math.min(120, Math.max(10, Math.round(n))) : DEFAULT_INTERVAL_MIN;
  return min * 60_000;
}

/** Model grades allowed per UTC day, from ZOE_FINAL_REVIEW_AUTO_DAY_MAX clamped to 1..48. */
export function autoOfferDailyMax(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.ZOE_FINAL_REVIEW_AUTO_DAY_MAX);
  return Number.isFinite(n) && n > 0
    ? Math.min(48, Math.max(1, Math.round(n)))
    : DEFAULT_GRADES_PER_DAY;
}

/** What survives a restart: the day's grade count and the settled head keys. */
export interface AutoOfferState {
  day: string;
  gradedToday: number;
  settled: string[];
}

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Saved state for today. Junk gives a fresh day; another day keeps settled and resets the count. */
export function parseAutoOfferState(raw: unknown, today: string): AutoOfferState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<
    Record<keyof AutoOfferState, unknown>
  >;
  const settled = Array.isArray(r.settled)
    ? r.settled.filter((k): k is string => typeof k === 'string')
    : [];
  const count =
    typeof r.gradedToday === 'number' && Number.isFinite(r.gradedToday) && r.gradedToday > 0
      ? Math.floor(r.gradedToday)
      : 0;
  return {
    day: today,
    gradedToday: r.day === today ? count : 0,
    settled: settled.slice(-SETTLED_KEEP),
  };
}

/** State after a tick that graded `graded` heads, rolled to `today`, settled trimmed to SETTLED_KEEP. */
export function recordTick(
  state: AutoOfferState,
  today: string,
  graded: number,
  settled: Iterable<string>,
): AutoOfferState {
  const base = state.day === today ? state.gradedToday : 0;
  return { day: today, gradedToday: base + graded, settled: [...settled].slice(-SETTLED_KEEP) };
}

export interface OpenPr {
  number: number;
  headSha: string;
}

interface RawListed {
  number?: unknown;
  headRefOid?: unknown;
  isDraft?: unknown;
  labels?: Array<{ name?: unknown }>;
}

/** Open PRs of one repo, or null when gh failed (an error is not an empty list). */
export async function listOpenPrs(repo: string, run: GhRunner): Promise<OpenPr[] | null> {
  const res = await run([
    'pr',
    'list',
    '-R',
    repo,
    '--state',
    'open',
    '--limit',
    '50',
    '--json',
    'number,headRefOid,isDraft,labels',
  ]);
  if (res.code !== 0) return null;
  try {
    const raw = JSON.parse(res.stdout) as RawListed[];
    if (!Array.isArray(raw)) return null;
    return raw
      .filter((p) => typeof p.number === 'number' && isFullSha(p.headRefOid))
      .filter((p) => p.isDraft !== true)
      .filter((p) => !(p.labels ?? []).some((l) => String(l.name ?? '').toLowerCase() === 'hold'))
      .map((p) => ({ number: p.number as number, headSha: p.headRefOid as string }));
  } catch {
    return null;
  }
}

export interface AutoOfferDeps {
  repos: readonly string[];
  list: (repo: string) => Promise<OpenPr[] | null>;
  review: (repo: string, number: number) => Promise<ReviewOutcome>;
  send: (view: CardView) => Promise<void>;
  /** repo#n@sha keys settled (carded or graded) in this process. */
  settled: Set<string>;
  log: (line: string) => void;
  /** Grades left today (per-day cap); unset means only the per-tick cap applies. */
  maxGrades?: number;
}

export interface TickReport {
  listed: number;
  reviewed: number;
  graded: number;
  carded: number;
  listFailures: string[];
}

export async function runAutoOfferTick(deps: AutoOfferDeps): Promise<TickReport> {
  const report: TickReport = { listed: 0, reviewed: 0, graded: 0, carded: 0, listFailures: [] };
  const gradeCap = Math.min(MAX_GRADES_PER_TICK, deps.maxGrades ?? MAX_GRADES_PER_TICK);
  if (gradeCap <= 0) return report;
  for (const repo of deps.repos) {
    const prs = await deps.list(repo);
    if (prs === null) {
      report.listFailures.push(repo);
      deps.log(`[zoe/final-review-auto] could not list open PRs for ${repo}; skipped this tick`);
      continue;
    }
    report.listed += prs.length;
    for (const pr of prs) {
      if (report.reviewed >= MAX_READS_PER_TICK || report.graded >= gradeCap) return report;
      const key = `${repo}#${pr.number}@${pr.headSha}`;
      if (deps.settled.has(key)) continue;
      report.reviewed += 1;
      const out = await deps.review(repo, pr.number);
      if (out.kind === 'card') {
        deps.settled.add(key);
        report.graded += 1;
        await deps.send(out.view);
        report.carded += 1;
      } else if (out.stage === 'graded') {
        deps.settled.add(key);
        report.graded += 1;
      } else if (out.stage === 'carded') {
        deps.settled.add(key);
      }
    }
  }
  return report;
}
