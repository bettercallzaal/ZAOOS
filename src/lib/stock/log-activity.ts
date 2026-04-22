import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export type StockEntityType =
  | 'sponsor'
  | 'artist'
  | 'timeline'
  | 'todo'
  | 'note'
  | 'volunteer'
  | 'budget'
  | 'goal'
  | 'member';

export interface LogActivityInput {
  actorId: string | null;
  entityType: StockEntityType;
  entityId: string;
  action: string;
  fieldChanged?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

function stringify(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('stock_activity_log').insert({
      actor_id: input.actorId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      field_changed: input.fieldChanged ?? null,
      old_value: stringify(input.oldValue),
      new_value: stringify(input.newValue),
    });
    if (error) {
      logger.warn({ error, input }, 'stock activity log insert failed');
    }
  } catch (err) {
    logger.warn({ err, input }, 'stock activity log threw');
  }
}

export async function logFieldChanges(
  actorId: string | null,
  entityType: StockEntityType,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Promise<void> {
  const changed = Object.keys(after).filter(
    (k) => after[k] !== undefined && before[k] !== after[k],
  );
  if (changed.length === 0) return;
  await Promise.all(
    changed.map((field) =>
      logActivity({
        actorId,
        entityType,
        entityId,
        action: 'update',
        fieldChanged: field,
        oldValue: before[field],
        newValue: after[field],
      }),
    ),
  );
}
