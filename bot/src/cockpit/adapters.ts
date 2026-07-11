/**
 * Cockpit opinionated adapters.
 *
 * The How I AI episode's #1 lesson: custom, opinionated adapters beat generic
 * MCPs - pull only the data the job needs, in the shape the job needs. These
 * wrap the cowork tracker (PostgREST) + reuse ZOE's classifier. The pure
 * partition/stale/rank functions are exported separately so they unit-test
 * without the network.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { classifyTask, type NextOwner } from '../zoe/task-classifier';
import type { Capture, CockpitTask, Handoff, ReviewPR, WriteProposal } from './types';

const execFileAsync = promisify(execFile);

/** A task with no update in this many days (and not recurring) is stale. Doc 983. */
export const STALE_DAYS = 14;

/** An idea capture older than this (with no ship) trips the collector's-fallacy
 * flag - hoarding an idea without acting is procrastination (doc 1031). */
export const CAPTURE_STALE_DAYS = 7;

/** GitHub users/orgs whose open PRs land in Zaal's review lane. */
const REVIEW_OWNERS = ['bettercallzaal', 'ZAODEVZ'];

const MAX_TASKS = 200;
const REQUEST_TIMEOUT_MS = 8000;

interface RawRow {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due: string | null;
  project: string | null;
  legacy_id: string | null;
  legacy_source: string | null;
  notes: string | null;
  updated_at: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
}

function nextOwnerOf(meta: Record<string, unknown> | null): NextOwner | null {
  const v = meta?.next_owner;
  return v === 'me' || v === 'agent' || v === 'review' || v === 'blocked' ? v : null;
}

function toCockpitTask(r: RawRow): CockpitTask {
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    priority: r.priority,
    due: r.due,
    project: r.project,
    legacy_id: r.legacy_id,
    legacy_source: r.legacy_source,
    notes: r.notes,
    next_owner: nextOwnerOf(r.metadata),
    updated_at: r.updated_at,
    created_at: r.created_at,
  };
}

/** Read open (not done, not archived) tasks with the fields the cockpit needs. Best-effort: returns [] on any failure. */
export async function fetchCockpitTasks(): Promise<CockpitTask[]> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return [];

  const url =
    `${base.replace(/\/$/, '')}/rest/v1/tasks` +
    `?status=neq.done&archived_at=is.null` +
    `&select=id,title,status,priority,due,project,legacy_id,legacy_source,notes,updated_at,created_at,metadata` +
    `&order=due.asc.nullslast&limit=${MAX_TASKS}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return [];
    const rows = (await res.json()) as RawRow[];
    return rows.map(toCockpitTask);
  } catch {
    return [];
  }
}

interface RawPR {
  repository_url?: string;
  number?: number;
  title?: string;
  html_url?: string;
  draft?: boolean;
  created_at?: string;
}

/** Pure: turn raw gh search rows into review PRs, dropping drafts + 'do not merge', newest first. */
export function filterReviewPRs(rows: RawPR[]): ReviewPR[] {
  return rows
    .filter((r) => r && !r.draft && typeof r.number === 'number')
    .filter((r) => !/\b(do not merge|wip|draft)\b/i.test(r.title ?? ''))
    .map((r) => ({
      repo: (r.repository_url ?? '').replace(/^https:\/\/api\.github\.com\/repos\//, '') || 'unknown',
      number: r.number as number,
      title: (r.title ?? '').trim(),
      url: r.html_url ?? '',
      draft: false,
      createdAt: r.created_at ?? null,
    }))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

/**
 * Open PRs across Zaal's repos awaiting his review/merge. Uses the gh CLI
 * (authenticated on the VPS - the bot has no GITHUB_TOKEN env; git.ts relies on
 * gh auth). One search call across the review owners. Best-effort: [] on failure.
 */
export async function fetchReviewPRs(): Promise<ReviewPR[]> {
  const q = `is:pr is:open ${REVIEW_OWNERS.map((o) => `user:${o}`).join(' ')}`;
  // gh is installed at ~/.local/bin on the VPS, which is NOT on the zoe-bot
  // systemd service PATH - so bare 'gh' fails with ENOENT. Prepend ~/.local/bin
  // (and the common user-local bins) so execFile resolves it regardless of the
  // service PATH. Override with GH_BIN_PATH if gh lives elsewhere.
  const home = process.env.HOME ?? '';
  const ghPath = [
    process.env.GH_BIN_PATH,
    home && `${home}/.local/bin`,
    '/usr/local/bin',
    process.env.PATH,
  ]
    .filter(Boolean)
    .join(':');
  try {
    const { stdout } = await execFileAsync(
      'gh',
      ['api', '-X', 'GET', 'search/issues', '-f', `q=${q}`, '-F', 'per_page=40', '--jq', '.items'],
      { timeout: REQUEST_TIMEOUT_MS, maxBuffer: 1_000_000, env: { ...process.env, PATH: ghPath } },
    );
    const rows = JSON.parse(stdout || '[]') as RawPR[];
    return Array.isArray(rows) ? filterReviewPRs(rows) : [];
  } catch {
    return [];
  }
}

// ---- pure logic (unit-testable, no network) ----

/** A task written by /handoff carries legacy_source "handoff:<slug>". */
export function isHandoff(t: CockpitTask): boolean {
  return (t.legacy_source ?? '').startsWith('handoff:');
}

/** Split handoff tasks out of the regular task set so they only show in their own lane. */
export function partitionHandoffs(tasks: CockpitTask[]): { handoffs: CockpitTask[]; rest: CockpitTask[] } {
  const handoffs: CockpitTask[] = [];
  const rest: CockpitTask[] = [];
  for (const t of tasks) (isHandoff(t) ? handoffs : rest).push(t);
  return { handoffs, rest };
}

/** Shape a handoff task into the cockpit Handoff view, newest first when mapped over a sorted list. */
export function toHandoff(t: CockpitTask): Handoff {
  return {
    taskId: t.id,
    slug: (t.legacy_source ?? '').replace(/^handoff:/, '') || 'unknown',
    title: t.title,
    note: t.notes,
    createdAt: t.created_at,
  };
}

/** An idea capture (the "one door") carries legacy_source "inbox:<slug>". This
 * is the second-brain resurface lane (doc 1031). */
export function isCapture(t: CockpitTask): boolean {
  return (t.legacy_source ?? '').startsWith('inbox:');
}

/** Split idea captures out of the regular task set so they show in their own lane. */
export function partitionCaptures(tasks: CockpitTask[]): { captures: CockpitTask[]; rest: CockpitTask[] } {
  const captures: CockpitTask[] = [];
  const rest: CockpitTask[] = [];
  for (const t of tasks) (isCapture(t) ? captures : rest).push(t);
  return { captures, rest };
}

/** Shape a capture into the cockpit Capture view. `stale` trips the
 * collector's-fallacy flag: captured but not shipped in CAPTURE_STALE_DAYS. */
export function toCapture(t: CockpitTask, now: number): Capture {
  const ageDays = daysSince(t.created_at, now);
  return {
    taskId: t.id,
    slug: (t.legacy_source ?? '').replace(/^inbox:/, '') || 'unknown',
    title: t.title,
    createdAt: t.created_at,
    ageDays: Number.isFinite(ageDays) ? Math.floor(ageDays) : 0,
    stale: ageDays >= CAPTURE_STALE_DAYS,
  };
}

export function priorityRank(p: string | null): number {
  const m = (p ?? '').toUpperCase().match(/P([0-9])/);
  return m ? Number(m[1]) : 5;
}

function isRecurring(title: string): boolean {
  return /\[(standing|recurring)\]/i.test(title);
}

export function daysSince(iso: string | null, now: number): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : (now - t) / 86_400_000;
}

/** Top 3 "do first": soonest due wins; undated sinks; ties broken by priority. */
export function topThree(tasks: CockpitTask[]): CockpitTask[] {
  return [...tasks]
    .sort((a, b) => {
      const da = a.due ? Date.parse(a.due) : Number.POSITIVE_INFINITY;
      const db = b.due ? Date.parse(b.due) : Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return priorityRank(a.priority) - priorityRank(b.priority);
    })
    .slice(0, 3);
}

/** Tasks routed to Zaal: next_owner === 'me', OR unrouted AND high-priority (P0/P1). */
export function needsYou(tasks: CockpitTask[]): CockpitTask[] {
  return tasks.filter(
    (t) => t.next_owner === 'me' || (t.next_owner === null && priorityRank(t.priority) <= 1),
  );
}

export function blocked(tasks: CockpitTask[]): CockpitTask[] {
  return tasks.filter((t) => t.next_owner === 'blocked');
}

/** Stale: not recurring AND (undated P0/P1, OR no update in >= STALE_DAYS). */
export function findStale(tasks: CockpitTask[], now: number): CockpitTask[] {
  return tasks.filter((t) => {
    if (isRecurring(t.title)) return false;
    const undatedHot = !t.due && priorityRank(t.priority) <= 1;
    const cold = daysSince(t.updated_at ?? t.created_at, now) >= STALE_DAYS;
    return undatedHot || cold;
  });
}

/** Build gated write proposals: route untagged tasks + flag stale-for-archive. Never applied here. */
export function buildProposals(tasks: CockpitTask[], now: number): WriteProposal[] {
  const proposals: WriteProposal[] = [];
  for (const t of tasks) {
    if (t.next_owner === null) {
      const c = classifyTask({ title: t.title, notes: null });
      proposals.push({
        taskId: t.id,
        title: t.title,
        kind: 'set_owner',
        nextOwner: c.nextOwner,
        reason: `untagged - classifier routes to '${c.nextOwner}'`,
      });
    }
  }
  for (const t of findStale(tasks, now)) {
    const d = daysSince(t.updated_at ?? t.created_at, now);
    if (Number.isFinite(d) && d >= STALE_DAYS * 2) {
      proposals.push({
        taskId: t.id,
        title: t.title,
        kind: 'archive_stale',
        reason: `no update in ${Math.round(d)}d - propose archive`,
      });
    }
  }
  return proposals;
}

/** Apply one approved write proposal (PATCH). GATED: only call after Zaal approves. Best-effort. */
export async function applyWriteProposal(p: WriteProposal): Promise<{ ok: boolean; error?: string }> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return { ok: false, error: 'tracker not configured' };

  const patch: Record<string, unknown> = {};
  if (p.kind === 'set_owner' && p.nextOwner) patch.metadata = { next_owner: p.nextOwner };
  else if (p.kind === 'archive_stale') patch.archived_at = new Date().toISOString();
  else if (p.kind === 'add_tags' && p.tags) patch.brands = p.tags;
  else return { ok: false, error: `unsupported proposal kind ${p.kind}` };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/tasks?id=eq.${encodeURIComponent(p.taskId)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return { ok: false, error: `patch returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'patch failed' };
  }
}
