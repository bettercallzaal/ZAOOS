/**
 * Tombstone casts that their author deleted on Farcaster.
 *
 * Before this, the Neynar webhook handled `cast.created` only, so a cast
 * deleted upstream stayed in `channel_casts` and stayed readable in chat and
 * chat search (doc 2622 section A, step 3 of its remaining work). That is the
 * "ghost memory" half of DreamNet's FC-EVAL-001: a source withdrew something
 * and we kept serving it.
 *
 * HOW. A deleted cast gets a row in the existing `hidden_messages` table,
 * whose own schema comment calls it "soft-deleted messages", and which
 * `/api/chat/messages` and `/api/chat/search` already filter on. No migration,
 * and nothing is deleted: the `channel_casts` row stays, so the tombstone is
 * reversible by removing one `hidden_messages` row.
 *
 * - `hidden_by_fid` is 0, the same "system" value AI moderation uses.
 * - The insert IGNORES an existing row. If a moderator already hid the cast,
 *   their fid and reason are kept, not overwritten by this one.
 * - Only casts we hold are tombstoned. A deletion for a hash not in
 *   `channel_casts` writes nothing, so other channels' deletions do not fill
 *   the table.
 *
 * DEFAULT OFF. Runs only when `NEYNAR_CAST_DELETED_TOMBSTONE` is exactly `1`.
 * The webhook must also be subscribed to `cast.deleted` in the Neynar
 * dashboard; Neynar's subscription schema lists it beside `cast.created`
 * (docs.neynar.com/reference/publish-webhook, WebhookSubscriptionFilters).
 *
 * NOT COVERED: `/api/search`, `/api/activity/feed` and `/api/users/[fid]` read
 * `channel_casts` without checking `hidden_messages`, so a tombstoned cast
 * still shows there, exactly as a moderator-hidden one does today.
 */
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import { castHashSchema } from '@/lib/validation/schemas';

export const TOMBSTONE_REASON = 'Deleted by its author on Farcaster (Neynar cast.deleted)';

/** True only when the flag is exactly '1'. */
export function castTombstoneEnabled(): boolean {
  return process.env.NEYNAR_CAST_DELETED_TOMBSTONE === '1';
}

const deletedCastSchema = z.object({
  type: z.literal('cast.deleted'),
  data: z.object({ hash: castHashSchema }).passthrough(),
});

/** The deleted cast's hash, or null when the payload is not a well-formed cast.deleted. */
export function parseDeletedCastHash(payload: unknown): string | null {
  const parsed = deletedCastSchema.safeParse(payload);
  return parsed.success ? parsed.data.data.hash : null;
}

export type TombstoneResult =
  | { status: 'tombstoned'; hash: string }
  | { status: 'not-held'; hash: string }
  | { status: 'error'; hash: string; error: string };

/** Marks a deleted cast hidden if we hold it. Never throws. */
export async function tombstoneDeletedCast(hash: string): Promise<TombstoneResult> {
  try {
    const { data: held, error: readError } = await supabaseAdmin
      .from('channel_casts')
      .select('hash')
      .eq('hash', hash)
      .limit(1);
    if (readError) throw readError;
    if (!held || held.length === 0) return { status: 'not-held', hash };

    const { error: writeError } = await supabaseAdmin
      .from('hidden_messages')
      .upsert(
        { cast_hash: hash, hidden_by_fid: 0, reason: TOMBSTONE_REASON },
        { onConflict: 'cast_hash', ignoreDuplicates: true },
      );
    if (writeError) throw writeError;

    logger.info(`[cast-tombstone] ${hash} deleted upstream, hidden`);
    return { status: 'tombstoned', hash };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String((err as { message?: unknown })?.message ?? err);
    logger.error(`[cast-tombstone] ${hash} not tombstoned: ${message}`);
    return { status: 'error', hash, error: message };
  }
}
