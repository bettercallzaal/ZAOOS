/**
 * Cockpit opinionated adapters.
 *
 * The How I AI episode's #1 lesson: custom, opinionated adapters beat generic
 * MCPs - pull only the data the job needs, in the shape the job needs. These
 * wrap the cowork tracker (PostgREST) + reuse ZOE's classifier. The pure
 * partition/stale/rank functions are exported separately so they unit-test
 * without the network.
 */

import { classifyTask, type NextOwner } from '../zoe/task-classifier';
import type { CockpitTask, WriteProposal } from './types';

/** A task with no update in this many days (and not recurring) is stale. Doc 983. */
export const STALE_DAYS = 14;

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
    `&select=id,title,status,priority,due,project,legacy_id,updated_at,created_at,metadata` +
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

// ---- pure logic (unit-testable, no network) ----

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
