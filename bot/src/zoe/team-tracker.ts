/**
 * Team tracker read access for ZOE (doc 890 - bridge ZOE to the coworking system).
 *
 * ZOE manages Zaal's personal tasks (tasks.json). The TEAM's work lives in the
 * cowork-zaodevz Supabase tracker (public.tasks). These were two silos: ZOE
 * couldn't answer "what's the team blocked on?". This module gives ZOE a
 * read path into the team board via PostgREST.
 *
 * Config (env, server-only - add to bot/.env on the VPS):
 *   COWORK_TRACKER_URL   e.g. https://<ref>.supabase.co
 *   COWORK_TRACKER_KEY   a Supabase key with read access to public.tasks
 * If either is missing, the integration is a no-op (teamTrackerConfigured()
 * returns false) so ZOE keeps working before the creds are seeded.
 *
 * Read-only for now; a write path (ZOE assigns team tasks) is a follow-up.
 */

import { classifyTask, applyClassification, planReconciliation, type TrackerRow } from './task-classifier';
import { remember } from './recall';

export interface TeamTask {
  title: string;
  status: string;
  priority: string | null;
  due: string | null;
  project: string | null;
  legacy_id: string | null;
  // Doc 983: metadata jsonb carries next_owner (me/agent/review/blocked) for the
  // judgment-routing focus line in the morning brief. Optional - null when the
  // row predates the auto-tagger.
  metadata?: Record<string, unknown> | null;
  // Who the task is assigned to (FK -> team_members.id). Needed for the
  // team-coordination digest ("what is each person on"). Null = unassigned.
  owner_id?: string | null;
}

const MAX_TASKS = 30;

export function teamTrackerConfigured(): boolean {
  return Boolean(process.env.COWORK_TRACKER_URL && process.env.COWORK_TRACKER_KEY);
}

/**
 * Fetch open (not done, not archived) team tasks, soonest-due first.
 * Returns [] if unconfigured or on any error (best-effort - never throws).
 */
export async function getOpenTeamTasks(): Promise<TeamTask[]> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return [];

  const url =
    `${base.replace(/\/$/, '')}/rest/v1/tasks` +
    `?status=neq.done&archived_at=is.null` +
    `&select=title,status,priority,due,project,legacy_id,metadata,owner_id` +
    `&order=due.asc.nullslast&limit=${MAX_TASKS}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return [];
    const data = (await res.json()) as TeamTask[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface TaskStatusRow {
  id: string;
  status: string;
  archived_at: string | null;
}

/**
 * Fetch task status (id, status, archived_at) for the given task IDs.
 * Used by ping-lifecycle to check if tasks are closed.
 * Returns [] if unconfigured or on any error (best-effort - never throws).
 */
export async function getTaskStatusByIds(taskIds: string[]): Promise<TaskStatusRow[]> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key || taskIds.length === 0) return [];

  // PostgREST IN clause: id=in.(<id1>,<id2>,...)
  const idList = taskIds.map((id) => `"${id}"`).join(',');
  const url = `${base.replace(/\/$/, '')}/rest/v1/tasks?id=in.(${idList})&select=id,status,archived_at`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return [];
    const data = (await res.json()) as TaskStatusRow[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface NewTeamTask {
  title: string;
  project: string;
  priority?: string;
  /** Rich context stored on the task, so the grill card explains itself. */
  notes?: string;
}

/**
 * Build the row for an INSERT into the cowork tasks table. Only project + title
 * are required by the schema; everything else defaults. We tag source='zoe' and
 * a legacy_source so ZOE-created team tasks are traceable on the board. Pure +
 * exported for testing.
 */
export function buildTeamTaskRow(t: NewTeamTask): Record<string, unknown> {
  const row: Record<string, unknown> = {
    title: t.title.trim(),
    project: t.project.trim(),
    status: 'todo',
    source: 'zoe',
    legacy_source: 'zoe-bot',
  };
  if (t.priority) row.priority = t.priority;
  if (t.notes && t.notes.trim()) row.notes = t.notes.trim();
  // Doc 983 Rec #4: auto-tag on the write-path so every ZOE-created task lands
  // pre-classified (brand / category / themes / next_owner) instead of naked.
  const c = classifyTask({ title: t.title });
  return applyClassification(row, c, new Date().toISOString().slice(0, 10));
}

export interface AddTeamTaskResult {
  ok: boolean;
  error?: string;
}

export interface ReconcileResult {
  ok: boolean;
  scanned: number;
  tagged: number;
  error?: string;
}

/**
 * Doc 983 Rec #4 backfill: find open tasks that were created without tags (any
 * writer other than the ZOE write-path) and classify them in place. Best-effort;
 * never throws. Catches board quick-adds, meeting captures, external-api rows.
 */
export async function reconcileUntaggedTasks(limit = 100): Promise<ReconcileResult> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return { ok: false, scanned: 0, tagged: 0, error: 'team tracker not configured' };
  const root = base.replace(/\/$/, '');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  try {
    const getUrl =
      `${root}/rest/v1/tasks?status=neq.done&archived_at=is.null` +
      `&select=id,title,notes,status,brands,category,metadata&limit=${limit}`;
    const res = await fetch(getUrl, { headers, cache: 'no-store' });
    if (!res.ok) return { ok: false, scanned: 0, tagged: 0, error: `read ${res.status}` };
    const rows = (await res.json()) as TrackerRow[];
    const patches = planReconciliation(rows, new Date().toISOString().slice(0, 10));
    let tagged = 0;
    for (const p of patches) {
      const patchRes = await fetch(`${root}/rest/v1/tasks?id=eq.${p.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(p.patch),
      });
      if (patchRes.ok) tagged += 1;
    }
    return { ok: true, scanned: rows.length, tagged };
  } catch (e) {
    return { ok: false, scanned: 0, tagged: 0, error: e instanceof Error ? e.message : 'reconcile failed' };
  }
}

/**
 * Create a team task on the cowork board. Best-effort; returns {ok:false,error}
 * on any failure so the caller can surface it. Requires the write-capable key.
 */
export async function addTeamTask(t: NewTeamTask): Promise<AddTeamTaskResult> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return { ok: false, error: 'team tracker not configured' };
  if (!t.title.trim() || !t.project.trim()) return { ok: false, error: 'title and project required' };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/tasks`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(buildTeamTaskRow(t)),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return { ok: false, error: `tracker returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'insert failed' };
  }
}

/** ZoeTask's high/med/low -> the tracker's P1/P2/P3 (P0 is reserved for true urgents). */
export function capturePriority(p: 'high' | 'med' | 'low' | string): string {
  return p === 'high' ? 'P1' : p === 'low' ? 'P3' : 'P2';
}

/**
 * Mirror concierge-captured tasks into the Supabase tracker (what the grill +
 * board read) WITH the description as notes, so a voice/forward capture becomes
 * a self-explaining grill card - not a title with no context. Best-effort: the
 * local ZoeTask store is still the source for ZOE's brief/reflect/nudge
 * reasoning; this is an additive write so the item also reaches the day-driver.
 * Returns how many mirrored. Never throws.
 */
export async function mirrorCapturesToTracker(
  captured: Array<{ title: string; description?: string; priority?: string }>,
): Promise<number> {
  let n = 0;
  for (const t of captured) {
    if (!t.title?.trim()) continue;
    const r = await addTeamTask({
      title: t.title,
      project: 'zaodevz',
      priority: capturePriority(t.priority ?? 'med'),
      notes: t.description?.trim() || undefined,
    }).catch(() => ({ ok: false }) as { ok: boolean });
    if (r.ok) n++;
  }
  return n;
}

const MAX_SHOWN = 15;

function priorityRank(p: string | null): number {
  const m = (p ?? '').toUpperCase().match(/P([0-9])/);
  return m ? Number(m[1]) : 5;
}

function isRecurring(title: string): boolean {
  return /\[(standing|recurring)\]/i.test(title);
}

function isOverdue(due: string | null): boolean {
  if (!due) return false;
  return due < new Date().toISOString().slice(0, 10);
}

/**
 * Render team tasks as a smooth, scannable Telegram reply: priority-sorted
 * (recurring/standing last), overdue summarized in the header (not on every
 * line), capped to the top N with a "+N more" footer. Drops the repeated
 * project prefix and the noisy uniform due dates.
 */
export function formatTeamTasks(tasks: TeamTask[]): string {
  if (tasks.length === 0) return 'No open team tasks (or the tracker is not wired up).';

  const overdue = tasks.filter((t) => isOverdue(t.due)).length;
  const sorted = [...tasks].sort((a, b) => {
    const ra = isRecurring(a.title) ? 1 : 0;
    const rb = isRecurring(b.title) ? 1 : 0;
    if (ra !== rb) return ra - rb;
    return priorityRank(a.priority) - priorityRank(b.priority);
  });

  const lines = sorted.slice(0, MAX_SHOWN).map((t) => {
    const pri = priorityRank(t.priority) <= 4 ? `[${t.priority!.toUpperCase()}] ` : '';
    const doing = t.status === 'in_progress' || t.status === 'doing' ? ' - doing' : '';
    // Show due only when it's a real future date; overdue is in the header.
    const due = t.due && !isOverdue(t.due) ? ` (due ${t.due})` : '';
    return `- ${pri}${t.title}${doing}${due}`;
  });

  const header =
    `Team tracker - ${tasks.length} open` + (overdue ? `, ${overdue} overdue` : '') + ':';
  const more =
    tasks.length > MAX_SHOWN ? `\n\n+${tasks.length - MAX_SHOWN} more (full board: thezao.xyz)` : '';
  return `${header}\n\n${lines.join('\n')}${more}`;
}

/**
 * One-line team summary for the morning brief: "5 open, 3 overdue. Top: ...".
 * Returns null when there's nothing to report (so the brief can skip the line).
 */
export function summarizeTeamForBrief(tasks: TeamTask[]): string | null {
  if (tasks.length === 0) return null;
  const overdue = tasks.filter((t) => isOverdue(t.due)).length;
  const top = [...tasks]
    .filter((t) => !isRecurring(t.title))
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 3)
    .map((t) => t.title)
    .join('; ');
  return `${tasks.length} open${overdue ? `, ${overdue} overdue` : ''}${top ? `. Top: ${top}` : ''}`;
}

/**
 * Doc 983: the judgment-routing focus for the morning brief - the top 3 tasks by
 * DEADLINE (not priority) plus a count of items whose next move belongs to Zaal
 * (metadata.next_owner === 'me'). This answers "what needs me next" rather than
 * "what is the whole board". Pure; returns null when there is nothing dated.
 */
export function zaalFocusForBrief(tasks: TeamTask[]): string | null {
  const dated = tasks
    .filter((t) => typeof t.due === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.due))
    .sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const top3 = dated.slice(0, 3).map((t) => `${t.title} (due ${String(t.due).slice(0, 10)})`);
  const needsMe = tasks.filter((t) => (t.metadata?.next_owner ?? '') === 'me').length;
  if (top3.length === 0 && needsMe === 0) return null;
  const parts: string[] = [];
  if (top3.length) parts.push(`TOP 3 BY DEADLINE: ${top3.join(' | ')}`);
  if (needsMe) parts.push(`${needsMe} task${needsMe === 1 ? '' : 's'} waiting on your call`);
  return parts.join('. ');
}

// --- team-coordination digest (doc 2201) ------------------------------------
// The board reads above are Zaal-facing ("what is the board"). Team coordination
// needs the OWNER dimension: "what is each person actively on". These build a
// shareable per-owner digest + a rich Bonfire episode of current priorities, so
// ZOE integrates BOTH the board (read) and Bonfire (write) from one place.

/** display name for an owner_id, resolved via the member map; 'unassigned' if unknown/null. */
function ownerName(ownerId: string | null | undefined, members: Map<string, string>): string {
  if (!ownerId) return 'unassigned';
  return members.get(ownerId) ?? 'unassigned';
}

function isInProgress(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'in_progress' || s === 'doing';
}

/**
 * Fetch a {owner_id -> display name} map from team_members. Best-effort: returns
 * an empty map if unconfigured or on any error (so the digest degrades to
 * "unassigned" rather than throwing). team_members is small - no limit needed.
 */
export async function getTeamMemberMap(): Promise<Map<string, string>> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  const map = new Map<string, string>();
  if (!base || !key) return map;
  const url = `${base.replace(/\/$/, '')}/rest/v1/team_members?select=id,legacy_owner,name`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return map;
    const rows = (await res.json()) as Array<{ id: string; legacy_owner: string | null; name: string | null }>;
    for (const r of rows) {
      if (r.id) map.set(r.id, r.legacy_owner || r.name || 'member');
    }
    return map;
  } catch {
    return map;
  }
}

// --- live team context for ZOE's turn (doc 2201: reason with team state) -----
// buildMemoryBlocks runs on every concierge turn, so we CACHE the board read
// (5-min TTL) to avoid hammering Supabase per message. Compact by design - the
// full per-owner view is /board; this is just enough for ZOE to know who is on
// what while reasoning.

let _teamCtxCache: { block: string | undefined; ts: number } | null = null;
const TEAM_CTX_TTL_MS = 5 * 60 * 1000;

/** Compact "who is on what right now" block for the turn context. Pure. */
export function buildTeamContextBlock(tasks: TeamTask[], members: Map<string, string>): string | undefined {
  const active = tasks.filter((t) => !isRecurring(t.title));
  if (active.length === 0) return undefined;
  const doing = active.filter((t) => isInProgress(t.status));
  const lines: string[] = [`Team board (live): ${active.length} open.`];
  if (doing.length) {
    lines.push('In progress now:');
    for (const t of doing.slice(0, 10)) {
      lines.push(`- ${ownerName(t.owner_id, members)}: ${t.title.slice(0, 80)}`);
    }
  }
  return lines.join('\n');
}

/**
 * Cached live team-context block for buildMemoryBlocks. Best-effort: returns the
 * cached value within the TTL, refetches otherwise, and returns undefined when
 * the tracker is unconfigured or the board is empty (so ZOE degrades silently).
 */
export async function getTeamContextBlock(nowMs: number): Promise<string | undefined> {
  if (_teamCtxCache && nowMs - _teamCtxCache.ts < TEAM_CTX_TTL_MS) return _teamCtxCache.block;
  if (!teamTrackerConfigured()) {
    _teamCtxCache = { block: undefined, ts: nowMs };
    return undefined;
  }
  try {
    const [tasks, members] = await Promise.all([getOpenTeamTasks(), getTeamMemberMap()]);
    const block = buildTeamContextBlock(tasks, members);
    _teamCtxCache = { block, ts: nowMs };
    return block;
  } catch {
    _teamCtxCache = { block: undefined, ts: nowMs };
    return undefined;
  }
}

const MAX_PER_OWNER = 6;

/**
 * A shareable, per-owner team digest: for each person, their in-progress items
 * first (that is "happening now"), then their top open todos by priority. Built
 * for Zaal to forward to the team for coordination. Pure + exported for testing.
 *
 * Ordering: owners with in-progress work first, then by open-task count; within
 * an owner, in-progress before todo, then priority. 'unassigned' always last.
 */
export function formatTeamDigest(tasks: TeamTask[], members: Map<string, string>): string {
  if (tasks.length === 0) return 'No open team tasks (or the tracker is not wired up).';

  // Group by owner display name, excluding standing/recurring noise.
  const groups = new Map<string, TeamTask[]>();
  for (const t of tasks) {
    if (isRecurring(t.title)) continue;
    const who = ownerName(t.owner_id, members);
    (groups.get(who) ?? groups.set(who, []).get(who)!).push(t);
  }
  if (groups.size === 0) return 'No active team tasks right now (only standing items are open).';

  const ownerHasDoing = (list: TeamTask[]) => list.some((t) => isInProgress(t.status));
  const ordered = [...groups.entries()].sort((a, b) => {
    if (a[0] === 'unassigned') return 1;
    if (b[0] === 'unassigned') return -1;
    const da = ownerHasDoing(a[1]) ? 0 : 1;
    const db = ownerHasDoing(b[1]) ? 0 : 1;
    if (da !== db) return da - db;
    return b[1].length - a[1].length;
  });

  const blocks = ordered.map(([who, list]) => {
    const sorted = [...list].sort((a, b) => {
      const ia = isInProgress(a.status) ? 0 : 1;
      const ib = isInProgress(b.status) ? 0 : 1;
      if (ia !== ib) return ia - ib;
      return priorityRank(a.priority) - priorityRank(b.priority);
    });
    const lines = sorted.slice(0, MAX_PER_OWNER).map((t) => {
      const doing = isInProgress(t.status) ? ' [doing]' : '';
      const pri = priorityRank(t.priority) <= 2 ? `[${t.priority!.toUpperCase()}] ` : '';
      const over = isOverdue(t.due) ? ' (overdue)' : '';
      return `  - ${pri}${t.title}${doing}${over}`;
    });
    const more = list.length > MAX_PER_OWNER ? `\n  +${list.length - MAX_PER_OWNER} more` : '';
    return `${who} (${list.length}):\n${lines.join('\n')}${more}`;
  });

  const doingCount = tasks.filter((t) => isInProgress(t.status)).length;
  const header = `Team todos - ${doingCount} in progress now, ${groups.size} people active:`;
  return `${header}\n\n${blocks.join('\n\n')}\n\nfull board: thezao.xyz`;
}

/**
 * Per-person board view: "/board iman" -> what that one teammate is on right now
 * (in-progress first, then their open todos by priority). `query` is matched
 * case-insensitively against the member display names AND their raw owner_id.
 * Pure + exported for testing. Returns a not-found message when no one matches.
 */
export function formatOwnerDigest(
  tasks: TeamTask[],
  members: Map<string, string>,
  query: string,
): string {
  const q = query.trim().toLowerCase();
  if (!q) return 'Usage: /board <person> - e.g. /board iman';
  // resolve matching owner_ids: display name contains q, or the id equals q
  const matchIds = new Set<string>();
  for (const [id, name] of members) {
    if (name.toLowerCase().includes(q) || id.toLowerCase() === q) matchIds.add(id);
  }
  const theirs = tasks.filter(
    (t) => !isRecurring(t.title) && t.owner_id != null && matchIds.has(t.owner_id),
  );
  // resolve the display name for the header (first match), fall back to the query
  const displayName =
    [...matchIds].map((id) => members.get(id)).find(Boolean) ?? query.trim();
  if (theirs.length === 0) {
    return `No open tasks found for "${query.trim()}" (they may have nothing assigned, or the name didn't match a teammate).`;
  }
  const sorted = [...theirs].sort((a, b) => {
    const ia = isInProgress(a.status) ? 0 : 1;
    const ib = isInProgress(b.status) ? 0 : 1;
    if (ia !== ib) return ia - ib;
    return priorityRank(a.priority) - priorityRank(b.priority);
  });
  const lines = sorted.map((t) => {
    const doing = isInProgress(t.status) ? ' [doing]' : '';
    const pri = priorityRank(t.priority) <= 2 ? `[${t.priority!.toUpperCase()}] ` : '';
    const over = isOverdue(t.due) ? ' (overdue)' : '';
    return `- ${pri}${t.title}${doing}${over}`;
  });
  const doingN = theirs.filter((t) => isInProgress(t.status)).length;
  return `${displayName} - ${theirs.length} open, ${doingN} in progress:\n\n${lines.join('\n')}`;
}

/**
 * A rich "current team priorities" episode for Bonfire (doc 2201 gap: the graph
 * was full of shallow doc-title stubs, not current state). Body is prose so a
 * /delve for "what are we doing now" returns substance, not just titles. Pure.
 * Returns null when there is nothing in progress or P0/P1 to report.
 */
export function buildPrioritiesEpisode(
  tasks: TeamTask[],
  members: Map<string, string>,
  dateIso: string,
): { name: string; body: string } | null {
  const doing = tasks.filter((t) => isInProgress(t.status) && !isRecurring(t.title));
  const topTodos = tasks
    .filter((t) => !isInProgress(t.status) && !isRecurring(t.title) && priorityRank(t.priority) <= 1)
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 8);
  if (doing.length === 0 && topTodos.length === 0) return null;

  const day = dateIso.slice(0, 10);
  const line = (t: TeamTask) => `- ${t.title} (${ownerName(t.owner_id, members)})`;
  const parts: string[] = [`ZAO current priorities as of ${day}.`];
  if (doing.length) parts.push(`In progress right now:\n${doing.map(line).join('\n')}`);
  if (topTodos.length) parts.push(`Top open priorities (P0/P1):\n${topTodos.map(line).join('\n')}`);
  return { name: `zao-priorities:${day}`, body: parts.join('\n\n') };
}

export interface TeamDigestResult {
  digest: string;
  taskCount: number;
  mirrored: boolean;
}

/**
 * Orchestrate the team digest: read the board + the member map, format the
 * shareable per-owner digest, and (when mirrorToBonfire) push a rich current-
 * priorities episode so the graph reflects live state (doc 2201). Best-effort:
 * the digest is always returned; a Bonfire failure only flips `mirrored`.
 */
export async function runTeamDigest(opts?: { mirrorToBonfire?: boolean }): Promise<TeamDigestResult> {
  const [tasks, members] = await Promise.all([getOpenTeamTasks(), getTeamMemberMap()]);
  const digest = formatTeamDigest(tasks, members);
  let mirrored = false;
  if (opts?.mirrorToBonfire) {
    const ep = buildPrioritiesEpisode(tasks, members, new Date().toISOString());
    if (ep) {
      const r = await remember({ body: ep.body, name: ep.name, sourceTag: 'zoe:priorities' }).catch(
        () => ({ ok: false }) as { ok: boolean },
      );
      mirrored = r.ok === true;
    }
  }
  return { digest, taskCount: tasks.length, mirrored };
}
