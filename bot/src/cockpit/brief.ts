/**
 * Cockpit brief - assemble the fixed CockpitBrief schema from the adapters,
 * format it for Telegram, and persist it to the artifact store (episode lesson:
 * save run evidence to the filesystem so context persists across sessions).
 *
 * Read-only in 'brief' mode; 'triage' additionally attaches gated write
 * proposals (still not applied). Applying is a separate, approved step.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  fetchCockpitTasks,
  fetchReviewPRs,
  topThree,
  needsYou,
  blocked,
  findStale,
  buildProposals,
} from './adapters';
import type { CockpitBrief, CockpitMode } from './types';

/** Artifact store root - mirrors ~/.zao/zoe convention. Override with $COCKPIT_HOME. */
export const COCKPIT_HOME = process.env.COCKPIT_HOME || join(homedir(), '.zao', 'cockpit');

/** Build the cockpit brief. `now` is injectable for tests. */
export async function buildCockpitBrief(mode: CockpitMode = 'brief', now = Date.now()): Promise<CockpitBrief> {
  // Tracker tasks + open PRs run in parallel; either failing degrades to [].
  const [tasks, reviewPRs] = await Promise.all([fetchCockpitTasks(), fetchReviewPRs()]);
  const you = needsYou(tasks);
  const stale = findStale(tasks, now);
  const blk = blocked(tasks);
  return {
    date: new Date(now).toISOString().slice(0, 10),
    top3: topThree(tasks),
    needsYou: you,
    needsReview: reviewPRs,
    stale,
    blocked: blk,
    counts: {
      open: tasks.length,
      needsYou: you.length,
      needsReview: reviewPRs.length,
      stale: stale.length,
      blocked: blk.length,
    },
    proposedWrites: mode === 'brief' ? [] : buildProposals(tasks, now),
  };
}

function line(t: { title: string; due: string | null; priority: string | null }): string {
  const due = t.due ? ` (due ${t.due.slice(0, 10)})` : '';
  const pri = t.priority ? ` [${t.priority}]` : '';
  return `- ${t.title}${pri}${due}`;
}

/** Format the brief in ZOE's voice (spartan, no emojis/em dashes). */
export function formatCockpitBrief(b: CockpitBrief): string {
  const parts: string[] = [];
  parts.push(`Cockpit - ${b.date}`);
  parts.push(
    `${b.counts.open} open | ${b.counts.needsYou} need you | ${b.counts.needsReview} PRs to review | ${b.counts.stale} stale | ${b.counts.blocked} blocked`,
  );
  if (b.top3.length) parts.push('\nDO FIRST\n' + b.top3.map(line).join('\n'));
  if (b.needsReview.length)
    parts.push(
      '\nNEEDS YOUR REVIEW (open PRs)\n' +
        b.needsReview
          .slice(0, 10)
          .map((p) => `- ${p.repo} #${p.number}: ${p.title}\n  ${p.url}`)
          .join('\n'),
    );
  if (b.needsYou.length) parts.push('\nNEEDS YOU\n' + b.needsYou.slice(0, 8).map(line).join('\n'));
  if (b.stale.length) parts.push('\nSTALE (review)\n' + b.stale.slice(0, 8).map(line).join('\n'));
  if (b.blocked.length) parts.push('\nBLOCKED\n' + b.blocked.slice(0, 6).map(line).join('\n'));
  if (b.proposedWrites.length)
    parts.push(
      '\nPROPOSED (approve to apply)\n' +
        b.proposedWrites.slice(0, 10).map((p) => `- [${p.kind}] ${p.title} - ${p.reason}`).join('\n'),
    );
  return parts.join('\n');
}

/** Persist the brief to the artifact store. Best-effort - never throws. */
export async function saveBriefArtifact(b: CockpitBrief): Promise<string | null> {
  try {
    await fs.mkdir(COCKPIT_HOME, { recursive: true });
    const path = join(COCKPIT_HOME, `brief-${b.date}.json`);
    await fs.writeFile(path, JSON.stringify(b, null, 2));
    return path;
  } catch {
    return null;
  }
}
