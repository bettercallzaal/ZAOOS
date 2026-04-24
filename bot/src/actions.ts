// Natural-language -> structured action -> Supabase write, with full attribution.
// Every write logs {via_bot, requested_by, original_text, persona} in stock_activity_log.new_value.

import { z } from 'zod';
import { db } from './supabase';
import { ask, type PersonaName } from './llm';
import type { TeamMember } from './auth';

const ActionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('add_todo'),
    title: z.string().min(1).max(500),
    owner_name: z.string().optional(),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    kind: z.literal('update_todo_status'),
    title_query: z.string().min(2),
    status: z.enum(['todo', 'in_progress', 'done']),
  }),
  z.object({
    kind: z.literal('add_sponsor'),
    name: z.string().min(1).max(200),
    track: z.enum(['local', 'virtual', 'ecosystem']).optional(),
    contact_name: z.string().optional(),
    contact_email: z.string().optional(),
    why_them: z.string().max(1000).optional(),
  }),
  z.object({
    kind: z.literal('update_sponsor_status'),
    name_query: z.string().min(2),
    status: z.enum(['lead', 'contacted', 'in_talks', 'committed', 'paid', 'declined']),
    amount_committed: z.number().optional(),
  }),
  z.object({
    kind: z.literal('add_artist'),
    name: z.string().min(1).max(200),
    genre: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().max(1000).optional(),
  }),
  z.object({
    kind: z.literal('update_artist_status'),
    name_query: z.string().min(2),
    status: z.enum(['wishlist', 'contacted', 'interested', 'confirmed', 'declined', 'travel_booked']),
  }),
  z.object({
    kind: z.literal('add_milestone'),
    title: z.string().min(1).max(300),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    category: z.string().optional(),
  }),
  z.object({
    kind: z.literal('log_contact'),
    entity_type: z.enum(['sponsor', 'artist']),
    name_query: z.string().min(2),
    summary: z.string().min(1).max(2000),
    channel: z.enum(['email', 'call', 'sms', 'dm_farcaster', 'dm_x', 'dm_tg', 'in_person', 'other']).default('other'),
    direction: z.enum(['outbound', 'inbound']).default('outbound'),
  }),
  z.object({
    kind: z.literal('unknown'),
    reason: z.string(),
  }),
]);

type Action = z.infer<typeof ActionSchema>;

function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are a strict parser for the ZAOstock Team Bot. The user is delegating an action.
Today is ${today}. Return ONLY valid JSON matching one of these schemas. NO prose, NO markdown fences, NO explanation.

Allowed actions:
- { "kind": "add_todo", "title": "...", "owner_name": "Zaal|Candy|...?", "notes": "...?" }
- { "kind": "update_todo_status", "title_query": "substring match", "status": "todo|in_progress|done" }
- { "kind": "add_sponsor", "name": "...", "track": "local|virtual|ecosystem?", "contact_name": "...?", "contact_email": "...?", "why_them": "...?" }
- { "kind": "update_sponsor_status", "name_query": "substring match", "status": "lead|contacted|in_talks|committed|paid|declined", "amount_committed": <number>? }
- { "kind": "add_artist", "name": "...", "genre": "...?", "city": "...?", "notes": "...?" }
- { "kind": "update_artist_status", "name_query": "substring match", "status": "wishlist|contacted|interested|confirmed|declined|travel_booked" }
- { "kind": "add_milestone", "title": "...", "due_date": "YYYY-MM-DD", "category": "sponsors|artists|ops|marketing|event|logistics|post|...?" }
- { "kind": "log_contact", "entity_type": "sponsor|artist", "name_query": "substring match", "summary": "brief what was said", "channel": "email|call|sms|dm_farcaster|dm_x|dm_tg|in_person|other?", "direction": "outbound|inbound?" }
- { "kind": "unknown", "reason": "what's missing or ambiguous" }

Rules:
- If user is asking a question (not doing), return { "kind": "unknown", "reason": "this is a question, not an action" }.
- Dates relative to today: "Friday" -> next Friday ISO; "tomorrow" -> ${today} + 1 day; "Sep 3" -> closest Sep 3.
- Never invent data. If owner not specified, omit owner_name.
- Return ONLY the JSON object, nothing else.`;
}

function stripCodeFences(text: string): string {
  let s = text.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*/, '').replace(/```$/, '').trim();
  return s;
}

async function parseAction(userText: string, persona: PersonaName): Promise<{ action: Action; raw: string; persona: PersonaName }> {
  const reply = await ask(userText, buildSystemPrompt(), persona);
  const cleaned = stripCodeFences(reply.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { action: { kind: 'unknown', reason: `LLM did not return valid JSON: ${cleaned.slice(0, 200)}` }, raw: cleaned, persona };
  }
  const result = ActionSchema.safeParse(parsed);
  if (!result.success) {
    return {
      action: { kind: 'unknown', reason: `Parse error: ${result.error.issues[0]?.message ?? 'unknown'}` },
      raw: cleaned,
      persona,
    };
  }
  return { action: result.data, raw: cleaned, persona };
}

async function logDelegation(args: {
  requester: TeamMember;
  action: Action;
  originalText: string;
  persona: PersonaName;
  entityType: string;
  entityId: string;
  actionName: string;
}): Promise<void> {
  try {
    await db().from('stock_activity_log').insert({
      actor_id: args.requester.id,
      entity_type: args.entityType,
      entity_id: args.entityId,
      action: args.actionName,
      new_value: JSON.stringify({
        via: 'bot',
        persona: args.persona,
        requested_by: args.requester.name,
        requested_by_id: args.requester.id,
        original_text: args.originalText.slice(0, 500),
        kind: args.action.kind,
      }),
    });
  } catch {
    /* never crash on log */
  }
}

async function findMemberByName(name: string): Promise<TeamMember | null> {
  const { data } = await db()
    .from('stock_team_members')
    .select('id, name, scope, role, telegram_id, active')
    .ilike('name', name)
    .neq('active', false)
    .maybeSingle();
  return data ? (data as TeamMember) : null;
}

export interface ExecuteResult {
  ok: boolean;
  reply: string;
}

export async function executeFromText(
  requester: TeamMember,
  userText: string,
  persona: PersonaName = 'minimax',
): Promise<ExecuteResult> {
  const { action, persona: usedPersona } = await parseAction(userText, persona);

  if (action.kind === 'unknown') {
    return { ok: false, reply: `I can't act on that yet. Reason: ${action.reason}\n\nTry /ask for a Q&A reply, or give me something concrete like "add a todo to call Bangor by Friday".` };
  }

  try {
    switch (action.kind) {
      case 'add_todo': {
        let ownerId = requester.id;
        if (action.owner_name) {
          const m = await findMemberByName(action.owner_name);
          if (m) ownerId = m.id;
        }
        const { data, error } = await db()
          .from('stock_todos')
          .insert({
            title: action.title,
            owner_id: ownerId,
            created_by: requester.id,
            notes: action.notes ?? '',
          })
          .select('id, title')
          .single();
        if (error || !data) return { ok: false, reply: `Couldn't add todo: ${error?.message ?? 'unknown'}` };
        await logDelegation({
          requester,
          action,
          originalText: userText,
          persona: usedPersona,
          entityType: 'todo',
          entityId: data.id,
          actionName: 'bot_add_todo',
        });
        return { ok: true, reply: `Added todo: "${data.title}" (owner: ${action.owner_name ?? requester.name}). via bot @ ${usedPersona}` };
      }
      case 'update_todo_status': {
        const { data: match } = await db()
          .from('stock_todos')
          .select('id, title')
          .ilike('title', `%${action.title_query}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!match) return { ok: false, reply: `No todo matched "${action.title_query}".` };
        const { error } = await db().from('stock_todos').update({ status: action.status, updated_at: new Date().toISOString() }).eq('id', match.id);
        if (error) return { ok: false, reply: `Update failed: ${error.message}` };
        await logDelegation({ requester, action, originalText: userText, persona: usedPersona, entityType: 'todo', entityId: match.id, actionName: 'bot_update_todo_status' });
        return { ok: true, reply: `Set "${match.title}" to ${action.status}. via bot @ ${usedPersona}` };
      }
      case 'add_sponsor': {
        const { data, error } = await db()
          .from('stock_sponsors')
          .insert({
            name: action.name,
            track: action.track ?? 'local',
            contact_name: action.contact_name ?? '',
            contact_email: action.contact_email ?? '',
            why_them: action.why_them ?? '',
            owner_id: requester.id,
          })
          .select('id, name, track')
          .single();
        if (error || !data) return { ok: false, reply: `Couldn't add sponsor: ${error?.message ?? 'unknown'}` };
        await logDelegation({ requester, action, originalText: userText, persona: usedPersona, entityType: 'sponsor', entityId: data.id, actionName: 'bot_add_sponsor' });
        return { ok: true, reply: `Added sponsor: ${data.name} (${data.track}). via bot @ ${usedPersona}` };
      }
      case 'update_sponsor_status': {
        const { data: match } = await db()
          .from('stock_sponsors')
          .select('id, name')
          .ilike('name', `%${action.name_query}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!match) return { ok: false, reply: `No sponsor matched "${action.name_query}".` };
        const updates: Record<string, unknown> = { status: action.status, updated_at: new Date().toISOString() };
        if (action.status === 'contacted' || action.status === 'in_talks') updates.last_contacted_at = new Date().toISOString();
        if (action.amount_committed !== undefined) updates.amount_committed = action.amount_committed;
        const { error } = await db().from('stock_sponsors').update(updates).eq('id', match.id);
        if (error) return { ok: false, reply: `Update failed: ${error.message}` };
        await logDelegation({ requester, action, originalText: userText, persona: usedPersona, entityType: 'sponsor', entityId: match.id, actionName: 'bot_update_sponsor_status' });
        return { ok: true, reply: `Set ${match.name} to ${action.status}${action.amount_committed ? ` @ $${action.amount_committed}` : ''}. via bot @ ${usedPersona}` };
      }
      case 'add_artist': {
        const { data, error } = await db()
          .from('stock_artists')
          .insert({
            name: action.name,
            genre: action.genre ?? '',
            city: action.city ?? '',
            notes: action.notes ?? '',
            outreach_by: requester.id,
          })
          .select('id, name')
          .single();
        if (error || !data) return { ok: false, reply: `Couldn't add artist: ${error?.message ?? 'unknown'}` };
        await logDelegation({ requester, action, originalText: userText, persona: usedPersona, entityType: 'artist', entityId: data.id, actionName: 'bot_add_artist' });
        return { ok: true, reply: `Added artist: ${data.name}${action.genre ? ` (${action.genre})` : ''}. via bot @ ${usedPersona}` };
      }
      case 'update_artist_status': {
        const { data: match } = await db()
          .from('stock_artists')
          .select('id, name')
          .ilike('name', `%${action.name_query}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!match) return { ok: false, reply: `No artist matched "${action.name_query}".` };
        const { error } = await db().from('stock_artists').update({ status: action.status, updated_at: new Date().toISOString() }).eq('id', match.id);
        if (error) return { ok: false, reply: `Update failed: ${error.message}` };
        await logDelegation({ requester, action, originalText: userText, persona: usedPersona, entityType: 'artist', entityId: match.id, actionName: 'bot_update_artist_status' });
        return { ok: true, reply: `Set ${match.name} to ${action.status}. via bot @ ${usedPersona}` };
      }
      case 'add_milestone': {
        const { data, error } = await db()
          .from('stock_timeline')
          .insert({
            title: action.title,
            due_date: action.due_date,
            category: action.category ?? 'general',
            owner_id: requester.id,
          })
          .select('id, title, due_date')
          .single();
        if (error || !data) return { ok: false, reply: `Couldn't add milestone: ${error?.message ?? 'unknown'}` };
        await logDelegation({ requester, action, originalText: userText, persona: usedPersona, entityType: 'timeline', entityId: data.id, actionName: 'bot_add_milestone' });
        return { ok: true, reply: `Added milestone: "${data.title}" due ${data.due_date}. via bot @ ${usedPersona}` };
      }
      case 'log_contact': {
        const table = action.entity_type === 'sponsor' ? 'stock_sponsors' : 'stock_artists';
        const { data: match } = await db()
          .from(table)
          .select('id, name')
          .ilike('name', `%${action.name_query}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!match) return { ok: false, reply: `No ${action.entity_type} matched "${action.name_query}".` };
        const { data: contact, error } = await db()
          .from('stock_contact_log')
          .insert({
            entity_type: action.entity_type,
            entity_id: match.id,
            channel: action.channel,
            direction: action.direction,
            summary: action.summary,
            contacted_by: requester.id,
            contacted_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error) return { ok: false, reply: `Couldn't log contact: ${error.message}` };
        await logDelegation({ requester, action, originalText: userText, persona: usedPersona, entityType: action.entity_type, entityId: match.id, actionName: 'bot_log_contact' });
        return { ok: true, reply: `Logged ${action.direction} ${action.channel} with ${match.name}: "${action.summary.slice(0, 80)}${action.summary.length > 80 ? '...' : ''}". via bot @ ${usedPersona}` };
      }
    }
  } catch (err) {
    return { ok: false, reply: `Action failed: ${err instanceof Error ? err.message : 'unknown error'}` };
  }
}
