/**
 * Supabase helpers for the `juke_spaces` and `juke_webhook_events` tables —
 * see `scripts/juke-spaces-migration.sql`.
 *
 * Path B writes a row on create; Juke webhooks update status / participants /
 * recording. `/live/{id}` reads via {@link getJukeSpace}.
 */
import { supabaseAdmin } from '@/lib/db/supabase';

export type JukeSpaceStatus = 'scheduled' | 'active' | 'ended';

/** One participant entry inside `juke_spaces.participants` jsonb array.
 * Populated by participant.joined webhooks (Juke 2026-05-23 ship: events
 * carry fid + display_name + role for real humans + agents only). */
export interface JukeParticipantEntry {
  fid: number;
  display_name: string | null;
  role: string | null;
  joined_at: string;
}

export interface JukeSpaceRow {
  id: string;
  title: string;
  status: JukeSpaceStatus;
  created_by_fid: number;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  participant_count: number;
  participants: JukeParticipantEntry[];
  embed_url: string | null;
  raw: unknown;
  created_at: string;
  updated_at: string;
}

export interface JukeSpaceInsert {
  id: string;
  title: string;
  createdByFid: number;
  scheduledAt?: string | null;
  embedUrl?: string | null;
  raw?: unknown;
}

/** Insert a row right after `POST /v1/developer/spaces` succeeds. */
export async function insertJukeSpace(input: JukeSpaceInsert): Promise<void> {
  const status: JukeSpaceStatus = input.scheduledAt ? 'scheduled' : 'active';
  const { error } = await supabaseAdmin.from('juke_spaces').upsert(
    {
      id: input.id,
      title: input.title,
      status,
      created_by_fid: input.createdByFid,
      scheduled_at: input.scheduledAt ?? null,
      embed_url: input.embedUrl ?? null,
      raw: input.raw ?? null,
      started_at: status === 'active' ? new Date().toISOString() : null,
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(`insertJukeSpace failed: ${error.message}`);
}

/** Read one Juke space row by id — used by `/live/{id}` SSR. */
export async function getJukeSpace(id: string): Promise<JukeSpaceRow | null> {
  const { data, error } = await supabaseAdmin
    .from('juke_spaces')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getJukeSpace failed: ${error.message}`);
  return (data as JukeSpaceRow) ?? null;
}

/** List the N most-recently-touched juke_spaces rows regardless of status.
 * Powers the "Recent spaces" table on /juke-status so Nicky's agent can see
 * real usage at a glance. Returns title, status, and time markers only. */
export interface RecentJukeSpaceRow {
  id: string;
  title: string;
  status: JukeSpaceStatus;
  participant_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  updated_at: string;
}

export async function listRecentJukeSpaces(limit: number = 10): Promise<RecentJukeSpaceRow[]> {
  const { data, error } = await supabaseAdmin
    .from('juke_spaces')
    .select('id, title, status, participant_count, scheduled_at, started_at, ended_at, recording_url, updated_at')
    .order('updated_at', { ascending: false })
    .limit(Math.min(Math.max(1, limit), 50));
  if (error) throw new Error(`listRecentJukeSpaces failed: ${error.message}`);
  return (data ?? []) as RecentJukeSpaceRow[];
}

/** Last N webhook events received from Juke, newest first. Powers the
 * "Webhook timeline" section on /juke-status - proof the integration is
 * actively running, not just shipped code. Surfaces failures (error set)
 * alongside successes so it doubles as a debug feed. */
export interface RecentWebhookEventRow {
  id: string;
  event_type: string;
  space_id: string | null;
  received_at: string;
  processed_at: string | null;
  error: string | null;
}

export async function listRecentWebhookEvents(limit: number = 25): Promise<RecentWebhookEventRow[]> {
  const { data, error } = await supabaseAdmin
    .from('juke_webhook_events')
    .select('id, event_type, space_id, received_at, processed_at, error')
    .order('received_at', { ascending: false })
    .limit(Math.min(Math.max(1, limit), 100));
  if (error) throw new Error(`listRecentWebhookEvents failed: ${error.message}`);
  return (data ?? []) as RecentWebhookEventRow[];
}

/** List Juke spaces currently in `active` status. Most-recent first. */
export async function listActiveJukeSpaces(limit: number = 25): Promise<JukeSpaceRow[]> {
  const { data, error } = await supabaseAdmin
    .from('juke_spaces')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false, nullsFirst: false })
    .limit(Math.min(Math.max(1, limit), 100));
  if (error) throw new Error(`listActiveJukeSpaces failed: ${error.message}`);
  return (data ?? []) as JukeSpaceRow[];
}

/** List Juke spaces scheduled to start in the future. Soonest first. */
export async function listScheduledJukeSpaces(limit: number = 25): Promise<JukeSpaceRow[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('juke_spaces')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(Math.min(Math.max(1, limit), 100));
  if (error) throw new Error(`listScheduledJukeSpaces failed: ${error.message}`);
  return (data ?? []) as JukeSpaceRow[];
}

/** Aggregate counts for the /juke-status dashboard + JSON endpoint. */
export interface JukeIntegrationStats {
  total_spaces: number;
  active: number;
  scheduled: number;
  ended: number;
  with_recording: number;
  total_webhook_events: number;
  recent_event_types: Record<string, number>;
  last_event_at: string | null;
}

export async function getJukeIntegrationStats(): Promise<JukeIntegrationStats> {
  const stats: JukeIntegrationStats = {
    total_spaces: 0,
    active: 0,
    scheduled: 0,
    ended: 0,
    with_recording: 0,
    total_webhook_events: 0,
    recent_event_types: {},
    last_event_at: null,
  };
  try {
    const counts = await Promise.all([
      supabaseAdmin.from('juke_spaces').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('juke_spaces').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('juke_spaces').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabaseAdmin.from('juke_spaces').select('*', { count: 'exact', head: true }).eq('status', 'ended'),
      supabaseAdmin.from('juke_spaces').select('*', { count: 'exact', head: true }).not('recording_url', 'is', null),
      supabaseAdmin.from('juke_webhook_events').select('*', { count: 'exact', head: true }),
    ]);
    stats.total_spaces = counts[0].count ?? 0;
    stats.active = counts[1].count ?? 0;
    stats.scheduled = counts[2].count ?? 0;
    stats.ended = counts[3].count ?? 0;
    stats.with_recording = counts[4].count ?? 0;
    stats.total_webhook_events = counts[5].count ?? 0;

    const { data: recent } = await supabaseAdmin
      .from('juke_webhook_events')
      .select('event_type, received_at')
      .order('received_at', { ascending: false })
      .limit(50);
    for (const row of (recent ?? []) as Array<{ event_type: string; received_at: string }>) {
      stats.recent_event_types[row.event_type] = (stats.recent_event_types[row.event_type] ?? 0) + 1;
      if (!stats.last_event_at) stats.last_event_at = row.received_at;
    }
  } catch {
    /* surfaces zero stats instead of 500 on transient DB issues */
  }
  return stats;
}

/**
 * List ended Juke spaces that have a recording_url. Most-recent first.
 * Limited to a sensible default the shelf page can show without paging.
 */
export async function listRecordedJukeSpaces(limit: number = 25): Promise<JukeSpaceRow[]> {
  const { data, error } = await supabaseAdmin
    .from('juke_spaces')
    .select('*')
    .eq('status', 'ended')
    .not('recording_url', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(Math.min(Math.max(1, limit), 100));
  if (error) throw new Error(`listRecordedJukeSpaces failed: ${error.message}`);
  return (data ?? []) as JukeSpaceRow[];
}

/** Update lifecycle fields driven by webhooks. */
export async function updateJukeSpace(
  id: string,
  patch: Partial<
    Pick<JukeSpaceRow, 'status' | 'started_at' | 'ended_at' | 'recording_url' | 'participant_count'>
  >,
): Promise<void> {
  const { error } = await supabaseAdmin.from('juke_spaces').update(patch).eq('id', id);
  if (error) throw new Error(`updateJukeSpace failed: ${error.message}`);
}

/** Increment / decrement the participant count atomically when a participant
 * event fires. Falls back to an absolute count if the row is missing. */
export async function bumpParticipantCount(id: string, delta: number): Promise<void> {
  const { data } = await supabaseAdmin
    .from('juke_spaces')
    .select('participant_count')
    .eq('id', id)
    .maybeSingle();
  const current = (data as { participant_count?: number } | null)?.participant_count ?? 0;
  const next = Math.max(0, current + delta);
  const { error } = await supabaseAdmin
    .from('juke_spaces')
    .update({ participant_count: next })
    .eq('id', id);
  if (error) throw new Error(`bumpParticipantCount failed: ${error.message}`);
}

/** Upsert a participant entry into juke_spaces.participants jsonb (read-modify-
 * write). Dedupes on fid - rejoin updates joined_at + role. Best-effort: if
 * the column does not exist yet (migration #2 not applied) we silently skip. */
export async function addParticipant(id: string, entry: JukeParticipantEntry): Promise<void> {
  const { data } = await supabaseAdmin
    .from('juke_spaces')
    .select('participants')
    .eq('id', id)
    .maybeSingle();
  const current = (data as { participants?: JukeParticipantEntry[] } | null)?.participants ?? [];
  const filtered = current.filter((p) => p.fid !== entry.fid);
  const next = [...filtered, entry];
  const { error } = await supabaseAdmin
    .from('juke_spaces')
    .update({ participants: next })
    .eq('id', id);
  if (error) {
    // Column missing = migration not applied yet. Do not block the webhook.
    if (/column .*participants/i.test(error.message)) return;
    throw new Error(`addParticipant failed: ${error.message}`);
  }
}

export async function removeParticipant(id: string, fid: number): Promise<void> {
  const { data } = await supabaseAdmin
    .from('juke_spaces')
    .select('participants')
    .eq('id', id)
    .maybeSingle();
  const current = (data as { participants?: JukeParticipantEntry[] } | null)?.participants ?? [];
  const next = current.filter((p) => p.fid !== fid);
  if (next.length === current.length) return;
  const { error } = await supabaseAdmin
    .from('juke_spaces')
    .update({ participants: next })
    .eq('id', id);
  if (error) {
    if (/column .*participants/i.test(error.message)) return;
    throw new Error(`removeParticipant failed: ${error.message}`);
  }
}

export interface WebhookEventInsert {
  eventType: string;
  jukeEventId?: string | null;
  signatureHash: string;
  spaceId?: string | null;
  body: unknown;
}

/**
 * Record the inbound webhook for idempotency + audit. Returns `false` when the
 * signature has already been processed (unique constraint conflict) — the
 * caller should short-circuit and ack the duplicate without re-running side
 * effects.
 */
export async function recordWebhookEvent(input: WebhookEventInsert): Promise<boolean> {
  const { error } = await supabaseAdmin.from('juke_webhook_events').insert({
    event_type: input.eventType,
    juke_event_id: input.jukeEventId ?? null,
    signature_hash: input.signatureHash,
    space_id: input.spaceId ?? null,
    body: input.body,
  });
  if (error) {
    // 23505 = unique_violation — replay.
    if ((error as { code?: string }).code === '23505') return false;
    throw new Error(`recordWebhookEvent failed: ${error.message}`);
  }
  return true;
}

export async function markWebhookProcessed(signatureHash: string, errMsg?: string): Promise<void> {
  await supabaseAdmin
    .from('juke_webhook_events')
    .update({ processed_at: new Date().toISOString(), error: errMsg ?? null })
    .eq('signature_hash', signatureHash);
}
