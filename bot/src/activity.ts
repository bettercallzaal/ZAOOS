import { db } from './supabase';

type EntityType = 'member' | 'todo' | 'sponsor' | 'artist' | 'timeline' | 'note' | 'volunteer' | 'budget' | 'goal';

export async function logBotActivity(args: {
  actorId: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  newValue?: unknown;
  oldValue?: unknown;
  fieldChanged?: string;
}) {
  try {
    await db().from('activity_log').insert({
      actor_id: args.actorId,
      entity_type: args.entityType,
      entity_id: args.entityId,
      action: args.action,
      field_changed: args.fieldChanged ?? null,
      old_value: args.oldValue !== undefined ? JSON.stringify(args.oldValue) : null,
      new_value: args.newValue !== undefined ? JSON.stringify(args.newValue) : null,
    });
  } catch {
    // Activity log failures should never crash the bot response.
  }
}
