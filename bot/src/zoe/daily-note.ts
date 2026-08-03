/**
 * Daily Note Capture + Auto-Rollover (Doc 2169)
 *
 * Each person gets ONE daily note per day. Items append to the BOTTOM.
 * Unchecked items roll to the TOP + increment roll_count. Fully automatic promotion:
 * @mentions + committed dates become real task rows (kind='task', parent_task_id = note id).
 *
 * Config (env, server-only):
 *   COWORK_TRACKER_URL   e.g. https://<ref>.supabase.co
 *   COWORK_TRACKER_KEY   a Supabase key with write access to public.tasks
 *
 * This module is NOT an entrypoint - it is called by scheduler.ts.
 */

import { db } from '../supabase';

export interface DailyNoteItem {
  id: string;
  text: string;
  done: boolean;
  roll_count: number;
  created_at: string;
  promoted_task_id: string | null;
}

export interface DailyNoteMetadata {
  items: DailyNoteItem[];
  note_date: string;
  rolled_from?: string;
}

export interface DailyNoteRow {
  id: string;
  kind: 'daily_note';
  title: string;
  owner_id: string;
  due: string;
  parent_task_id: null;
  metadata: DailyNoteMetadata;
  created_at: string;
  completed_at: null;
}

// Known board people who can be @mentioned for promotion
const KNOWN_PEOPLE = new Set(['zaal', 'iman', 'sam']);

function generateItemId(): string {
  return `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Get or create today's daily note for an owner.
 * If today's note already exists, returns it.
 * If not, creates an empty one (no items yet).
 */
export async function getOrCreateTodayNote(ownerId: string): Promise<DailyNoteRow | null> {
  try {
    const client = db();
    const today = todayIso();
    const title = `daily ${today} - ${ownerId}`;

    // Try to fetch today's note
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('kind', 'daily_note')
      .eq('owner_id', ownerId)
      .eq('due', today)
      .single();

    if (!error && data) {
      return data as DailyNoteRow;
    }

    // Not found — create it
    const metadata: DailyNoteMetadata = {
      items: [],
      note_date: today,
    };

    const { data: newNote, error: insertError } = await client
      .from('tasks')
      .insert({
        kind: 'daily_note',
        title,
        owner_id: ownerId,
        due: today,
        parent_task_id: null,
        metadata,
        created_at: nowIso(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[zoe/daily-note] create today note failed:', insertError.message);
      return null;
    }

    return newNote as DailyNoteRow;
  } catch (err) {
    console.error('[zoe/daily-note] getOrCreateTodayNote error:', (err as Error)?.message ?? err);
    return null;
  }
}

/**
 * Append a new item to today's note for an owner.
 * Creates today's note if it doesn't exist.
 */
export async function appendItem(ownerId: string, text: string): Promise<DailyNoteItem | null> {
  try {
    const note = await getOrCreateTodayNote(ownerId);
    if (!note) return null;

    const item: DailyNoteItem = {
      id: generateItemId(),
      text: text.trim(),
      done: false,
      roll_count: 0,
      created_at: nowIso(),
      promoted_task_id: null,
    };

    const updatedMetadata: DailyNoteMetadata = {
      ...note.metadata,
      items: [...note.metadata.items, item],
    };

    const client = db();
    const { error } = await client
      .from('tasks')
      .update({ metadata: updatedMetadata })
      .eq('id', note.id);

    if (error) {
      console.error('[zoe/daily-note] append item failed:', error.message);
      return null;
    }

    return item;
  } catch (err) {
    console.error('[zoe/daily-note] appendItem error:', (err as Error)?.message ?? err);
    return null;
  }
}

/**
 * Get today's note for an owner (if exists).
 */
export async function getTodayNote(ownerId: string): Promise<DailyNoteRow | null> {
  try {
    const client = db();
    const today = todayIso();

    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('kind', 'daily_note')
      .eq('owner_id', ownerId)
      .eq('due', today)
      .single();

    if (error) return null;
    return data as DailyNoteRow;
  } catch (err) {
    console.error('[zoe/daily-note] getTodayNote error:', (err as Error)?.message ?? err);
    return null;
  }
}

/**
 * Test if text contains a known @mention that should promote.
 */
function hasKnownMention(text: string): boolean {
  const mentions = text.match(/@(\w+)/g) ?? [];
  return mentions.some((m) => KNOWN_PEOPLE.has(m.slice(1).toLowerCase()));
}

/**
 * Test if text contains a parseable future date.
 * Supports: YYYY-MM-DD, "Aug 10", "tomorrow", "next Mon", etc.
 * Conservative parser — errs on the side of promoting when ambiguous.
 */
function hasCommittedDate(text: string): boolean {
  // ISO date: YYYY-MM-DD
  if (/\d{4}-\d{2}-\d{2}/.test(text)) return true;

  // Month + day: "Aug 10", "August 10", etc.
  if (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)\s+\d{1,2}\b/i.test(
    text,
  )) {
    return true;
  }

  // Relative dates: tomorrow, next <day>, this <day>
  if (/\b(tomorrow|today|tonight|yesterday)\b/i.test(text)) return true;
  if (/\b(next|this)\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(text)) {
    return true;
  }

  // Relative weeks: "next week", "in 2 weeks", etc.
  if (/\b(next\s+week|in\s+\d+\s+weeks?)\b/i.test(text)) return true;

  return false;
}

/**
 * Test if the item states a DONE-CONDITION - the work is already defined enough
 * to know when it is finished. Per cowork's measurement across all 1367 board
 * tasks (doc 2169 amendment): source/definition predicts completion far better
 * than priority (decorative, ~flat) or dates (met only 11.5% of the time). The
 * 100%-completion buckets - pr-test-task, research-dispatch, meeting-capture -
 * all shared one trait: a concrete done-condition existed when the work landed.
 * This is the single variable separating the 100% buckets from the ~56%
 * speculative ones, so an item that states one is worth surfacing as a real task.
 */
function hasDoneCondition(text: string): boolean {
  // A concrete deliverable/artifact reference (URL, PR#/issue#, "doc NNN", a file path)
  if (/https?:\/\/|\bPR\s*#?\d+|#\d{2,}|\bdoc\s+\d+|\/[\w-]+\.[a-z]{2,4}\b/i.test(text)) return true;
  // Explicit outcome / done-when clauses
  if (/\b(done when|so that|until it|passes|returns|ships?|deliver(ed|s)?|merge[ds]?|resolves?)\b/i.test(text)) return true;
  // Arrow-to-outcome: "X -> Y"
  if (/->/.test(text)) return true;
  return false;
}

/**
 * Determine if an item should be promoted based on its text, and WHICH signal
 * fired (logged per-promotion so we can measure which of the three earns its
 * place after a few weeks - cowork's ask). Order reflects the measured strength:
 * mention (visibility - items naming a person complete LESS, 68.7% vs 76.1%, so
 * they most need surfacing), then done-condition (the strongest completion
 * predictor), then date (kept but noisy - dates are aspirational 88.5% of the
 * time; promotion only creates a row, so noise is cheap).
 */
function promoteReason(text: string): string | null {
  if (hasKnownMention(text)) return 'mention';
  if (hasDoneCondition(text)) return 'done-condition';
  if (hasCommittedDate(text)) return 'date';
  return null;
}

/**
 * Create a real task row from a promoted daily note item.
 */
async function createPromotedTask(noteId: string, noteOwnerId: string, item: DailyNoteItem, reason: string): Promise<string | null> {
  try {
    const client = db();

    const { data, error } = await client
      .from('tasks')
      .insert({
        kind: 'task',
        title: item.text,
        owner_id: noteOwnerId,
        parent_task_id: noteId,
        source: 'daily_note_promotion',
        metadata: {
          promoted_from_item: item.id,
          promotion_reason: reason,
        },
        created_at: nowIso(),
      })
      .select()
      .single();

    if (error) {
      console.error('[zoe/daily-note] create promoted task failed:', error.message);
      return null;
    }

    return (data as { id: string }).id;
  } catch (err) {
    console.error('[zoe/daily-note] createPromotedTask error:', (err as Error)?.message ?? err);
    return null;
  }
}

/**
 * Perform promotion pass on carried items.
 * For each item not already promoted: if text matches @person or date,
 * create a real task row and mark item.promoted_task_id.
 * Logs every promotion with the matched reason.
 */
async function promoteCarriedItems(note: DailyNoteRow): Promise<DailyNoteRow> {
  try {
    const client = db();
    let promotedCount = 0;

    const updatedItems: DailyNoteItem[] = [];

    for (const item of note.metadata.items) {
      // Skip already-promoted items
      if (item.promoted_task_id) {
        updatedItems.push(item);
        continue;
      }

      // Check if item should promote
      const reason = promoteReason(item.text);
      if (!reason) {
        updatedItems.push(item);
        continue;
      }

      // Promote it
      const taskId = await createPromotedTask(note.id, note.owner_id, item, reason);
      if (!taskId) {
        // Promotion failed — keep rolling
        updatedItems.push(item);
        continue;
      }

      promotedCount++;
      console.log(
        `[zoe/daily-note] promoted item (id=${item.id}, note=${note.id}, reason=${reason}, task=${taskId})`,
      );

      updatedItems.push({
        ...item,
        promoted_task_id: taskId,
      });
    }

    // Update note with promoted items
    const updatedMetadata: DailyNoteMetadata = {
      ...note.metadata,
      items: updatedItems,
    };

    const { data: updated, error } = await client
      .from('tasks')
      .update({ metadata: updatedMetadata })
      .eq('id', note.id)
      .select()
      .single();

    if (error) {
      console.error('[zoe/daily-note] promote save failed:', error.message);
      return note; // Return unchanged on error
    }

    if (promotedCount > 0) {
      console.log(`[zoe/daily-note] promotion pass: ${promotedCount} items promoted`);
    }

    return updated as DailyNoteRow;
  } catch (err) {
    console.error('[zoe/daily-note] promoteCarriedItems error:', (err as Error)?.message ?? err);
    return note;
  }
}

/**
 * What a rollover run reports back to the scheduler.
 *
 * The scheduler must be able to tell "there was nothing to roll" apart from
 * "the database was down", because those need opposite handling: a silent run
 * is normal, a failed run must log at error level and must NOT leave the day's
 * fire sentinel claimed (.claude/rules/silent-failure-guard.md rule 6). This
 * mirrors the discriminated status `persistDailyDigest` already returns.
 */
export type RolloverStatus = 'success' | 'silent' | 'error';

export interface RolloverResult {
  status: RolloverStatus;
  summary: string;
}

/**
 * Rollover cron job — called daily at 00:00 EST.
 * For each owner with a yesterday note:
 *   1. Create today's note if not present (idempotent).
 *   2. Copy unchecked items to TOP of today, increment roll_count.
 *   3. Run promotion pass on carried items.
 *
 * Returns the run status plus a summary of what was rolled (for logging).
 * Never throws — a failure is reported as status 'error' so the caller decides.
 */
export async function rolloverNotes(): Promise<RolloverResult> {
  try {
    const client = db();
    const yesterday = yesterdayIso();
    const today = todayIso();

    // Find all owners with yesterday's note
    const { data: yesterdayNotes, error } = await client
      .from('tasks')
      .select('id, owner_id, metadata')
      .eq('kind', 'daily_note')
      .eq('due', yesterday);

    if (error) {
      console.error('[zoe/daily-note] rollover query failed:', error.message);
      return { status: 'error', summary: `DB query failed: ${error.message}` };
    }

    if (!yesterdayNotes || yesterdayNotes.length === 0) {
      console.log('[zoe/daily-note] rollover: no yesterday notes found (silent)');
      return { status: 'silent', summary: 'no notes to roll' };
    }

    let totalRolled = 0;
    let totalPromoted = 0;
    let failedOwners = 0;

    for (const yesterdayRow of yesterdayNotes) {
      const yesterdayMeta = (yesterdayRow.metadata as DailyNoteMetadata) ?? { items: [], note_date: yesterday };
      const ownerId = yesterdayRow.owner_id;

      // Get unchecked items
      const unchecked = (yesterdayMeta.items ?? []).filter((it) => !it.done);
      if (unchecked.length === 0) {
        continue; // Nothing to roll
      }

      // Create today's note (idempotent by owner + date)
      const todayNote = await getOrCreateTodayNote(ownerId);
      if (!todayNote) {
        console.error(`[zoe/daily-note] failed to create today note for owner ${ownerId}`);
        failedOwners++;
        continue;
      }

      // Increment roll_count and move to top
      const rolledItems = unchecked.map((it) => ({
        ...it,
        roll_count: it.roll_count + 1,
      }));

      // Append any new items that were already in today's note to the bottom
      const existingNewItems = (todayNote.metadata.items ?? []).filter((it) => !unchecked.find((u) => u.id === it.id));

      const mergedItems = [...rolledItems, ...existingNewItems];

      // Update today's note with rolled items
      const updatedMetadata: DailyNoteMetadata = {
        ...todayNote.metadata,
        items: mergedItems,
        rolled_from: yesterdayRow.id,
      };

      const { error: updateError } = await client
        .from('tasks')
        .update({ metadata: updatedMetadata })
        .eq('id', todayNote.id);

      if (updateError) {
        console.error(`[zoe/daily-note] rollover update failed for owner ${ownerId}:`, updateError.message);
        failedOwners++;
        continue;
      }

      totalRolled += unchecked.length;

      // Fetch updated note for promotion pass
      const updatedNote = await getTodayNote(ownerId);
      if (updatedNote) {
        const promotedNote = await promoteCarriedItems(updatedNote);
        const promotedCount = promotedNote.metadata.items.filter((it) => it.promoted_task_id).length;
        totalPromoted += promotedCount;
      }

      console.log(
        `[zoe/daily-note] rolled owner=${ownerId} items=${unchecked.length}`,
      );
    }

    const summary = `rolled ${totalRolled} items, promoted ${totalPromoted}`;

    // A partial failure is still a failure: the owners that errored have items
    // stranded on yesterday's note, and tomorrow's run only looks at TODAY's
    // note, so they are never picked up again unless this run is retried.
    if (failedOwners > 0) {
      const detail = `${summary} (${failedOwners}/${yesterdayNotes.length} owners failed)`;
      console.error(`[zoe/daily-note] rollover partially failed: ${detail}`);
      return { status: 'error', summary: detail };
    }

    console.log(`[zoe/daily-note] rollover complete: ${summary}`);
    return { status: 'success', summary };
  } catch (err) {
    console.error('[zoe/daily-note] rolloverNotes error:', (err as Error)?.message ?? err);
    return { status: 'error', summary: (err as Error)?.message ?? 'unknown' };
  }
}

/**
 * Migration helper: extract #9030's 4 asks from legacy container format.
 * Reads task with legacy_id='9030', parses metadata.comments[0].content as "1... 2... 3... 4...",
 * creates a daily_note with these items for the container's owner, and runs promotion.
 *
 * Exported for manual run (not auto-called) until verified safe.
 * Does NOT delete #9030 — leaves it as a record.
 */
export async function migrateStandupContainers(): Promise<string> {
  try {
    const client = db();
    const today = todayIso();

    // Fetch #9030 container
    const { data: container, error } = await client
      .from('tasks')
      .select('*')
      .eq('legacy_id', '9030')
      .single();

    if (error) {
      console.error('[zoe/daily-note] migrate: #9030 not found:', error.message);
      return 'error: #9030 container not found';
    }

    const ownerId = (container as { owner_id?: string }).owner_id ?? 'iman';

    const comments = (container.metadata?.comments as Array<{ content: string }>) ?? [];
    if (comments.length === 0 || !comments[0].content) {
      console.warn('[zoe/daily-note] migrate: #9030 has no comments to parse');
      return 'silent: no comments in #9030';
    }

    // Parse "1... 2... 3... 4..." format
    const content = comments[0].content;
    const lines = content.split('\n').map((s) => s.trim());
    const asks: string[] = [];

    for (const line of lines) {
      // Match lines like "1. ...", "2. ...", etc.
      const match = line.match(/^\d+\.\s+(.+)$/);
      if (match) {
        asks.push(match[1]);
      }
    }

    if (asks.length === 0) {
      console.warn('[zoe/daily-note] migrate: no parseable asks in #9030');
      return 'silent: no asks found in comments';
    }

    // Create today's daily note for the container's owner
    const note = await getOrCreateTodayNote(ownerId);
    if (!note) {
      return `error: failed to create note for ${ownerId}`;
    }

    // Add each ask as an item
    for (const ask of asks) {
      await appendItem(ownerId, ask);
    }

    console.log(`[zoe/daily-note] migrate: extracted ${asks.length} asks from #9030 for owner=${ownerId}`);

    // Run promotion on the updated note
    const updatedNote = await getTodayNote(ownerId);
    if (updatedNote) {
      await promoteCarriedItems(updatedNote);
    }

    return `migrated ${asks.length} asks from #9030`;
  } catch (err) {
    console.error('[zoe/daily-note] migrateStandupContainers error:', (err as Error)?.message ?? err);
    return `error: ${(err as Error)?.message ?? 'unknown'}`;
  }
}
