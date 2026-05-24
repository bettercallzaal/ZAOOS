/**
 * Supabase helpers for the `juke_spaces` and `juke_webhook_events` tables —
 * see `scripts/juke-spaces-migration.sql`.
 *
 * Path B writes a row on create; Juke webhooks update status / participants /
 * recording. `/live/{id}` reads via {@link getJukeSpace}.
 */
import { supabaseAdmin } from '@/lib/db/supabase';

export type JukeSpaceStatus = 'scheduled' | 'active' | 'ended';

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
