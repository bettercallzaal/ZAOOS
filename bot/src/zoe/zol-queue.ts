/**
 * ZOL queue - bridge ZOE cast approvals to the cowork tracker.
 *
 * When Zaal approves a cast draft via ZOE, enqueueZolCast() writes a row to the
 * cowork tracker (public.tasks) with legacy_source='zolcast:<id>'. A Pi drainer
 * reads 'zolcast:%' rows and casts them via the signer.
 *
 * Config (env, server-only):
 *   COWORK_TRACKER_URL   e.g. https://<ref>.supabase.co
 *   COWORK_TRACKER_KEY   a Supabase key with write access to public.tasks
 *
 * If either is missing, enqueueZolCast() returns {ok:false} and the cast still
 * lands in the outbox.jsonl (so it's never lost). Best-effort: never throws.
 */

export interface ZolQueueResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Build the row for an INSERT into the cowork tasks table for a ZOL cast.
 * Pure - exported for unit testing.
 *
 * Row shape:
 *   - title: first 300 chars of text
 *   - legacy_source: "zolcast:<id>" to identify as Pi casting task
 *   - status: "todo"
 *   - project: "zol"
 */
export function buildZolRow(text: string, id: string): Record<string, unknown> {
  return {
    title: text.slice(0, 300).trim(),
    legacy_source: `zolcast:${id}`,
    status: 'todo',
    project: 'zol',
  };
}

/**
 * Enqueue a cast approval for ZOL to pick up. Posts a row to the cowork tracker.
 * Returns {ok:true,id} on success, {ok:false,error} on any failure.
 * Best-effort: never throws, never blocks the approval path.
 */
export async function enqueueZolCast(text: string): Promise<ZolQueueResult> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) {
    return { ok: false, error: 'zol queue not configured' };
  }

  const id = Date.now().toString(36);
  const row = buildZolRow(text, id);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/tasks`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      return { ok: false, error: `tracker returned ${res.status}` };
    }

    // Parse response to extract the id (PostgREST returns the inserted row)
    const inserted = (await res.json()) as Array<Record<string, unknown>>;
    const rowId = Array.isArray(inserted) && inserted.length > 0 ? String(inserted[0].id ?? id) : id;

    return { ok: true, id: rowId };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : 'enqueue failed';
    return { ok: false, error: errMsg };
  }
}
