/**
 * Final-reviewer auto-offer (item B of the 7 Nov zoe-devz audit; Zaal,
 * 2026-11-07, vault decisions/seat-2026-11-07-zoe-devz-rulings.md item 2.4,
 * "flag stays off").
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
 */

import type { GhRunner } from './snapshot';
import { isFullSha, isRepoSlug } from './merge-line';
import type { CardView, ReviewOutcome } from './flow';

export const MAX_READS_PER_TICK = 20;
export const MAX_GRADES_PER_TICK = 3;
export const DEFAULT_INTERVAL_MIN = 30;

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
  const min = Number.isFinite(n) && n > 0 ? Math.min(120, Math.max(10, Math.round(n))) : DEFAULT_INTERVAL_MIN;
  return min * 60_000;
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
  const res = await run(['pr', 'list', '-R', repo, '--state', 'open', '--limit', '50', '--json', 'number,headRefOid,isDraft,labels']);
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
  for (const repo of deps.repos) {
    const prs = await deps.list(repo);
    if (prs === null) {
      report.listFailures.push(repo);
      deps.log(`[zoe/final-review-auto] could not list open PRs for ${repo}; skipped this tick`);
      continue;
    }
    report.listed += prs.length;
    for (const pr of prs) {
      if (report.reviewed >= MAX_READS_PER_TICK || report.graded >= MAX_GRADES_PER_TICK) return report;
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
