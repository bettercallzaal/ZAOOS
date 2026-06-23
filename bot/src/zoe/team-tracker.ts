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

/** Render team tasks as a compact, scannable list for a Telegram reply. */
export function formatTeamTasks(tasks: TeamTask[]): string {
  if (tasks.length === 0) return 'No open team tasks (or the tracker is not wired up).';
  const lines = tasks.map((t) => {
    const due = t.due ? ` (due ${t.due})` : '';
    const pri = t.priority && t.priority !== 'normal' ? ` [${t.priority}]` : '';
    const proj = t.project ? `${t.project}: ` : '';
    return `- ${proj}${t.title}${pri}${due} - ${t.status}`;
  });
  return `Team tracker - ${tasks.length} open:\n\n${lines.join('\n')}`;
}
