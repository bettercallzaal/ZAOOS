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

export interface TeamTask {
  title: string;
  status: string;
  priority: string | null;
  due: string | null;
  project: string | null;
  legacy_id: string | null;
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
    `&select=title,status,priority,due,project,legacy_id` +
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

export interface NewTeamTask {
  title: string;
  project: string;
  priority?: string;
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
  return row;
}

export interface AddTeamTaskResult {
  ok: boolean;
  error?: string;
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
