/**
 * Per-bot chat memory in Supabase. Each team bot writes here so the brain
 * can recall what was said earlier in the chat without re-fetching Telegram.
 *
 * Tables (created by migrations/team_bots.sql):
 *   team_bot_messages  - rolling message log (~last 200 per bot)
 *   team_bot_facts     - extracted facts/decisions the team agreed on
 *   team_bot_ideas     - captured via /idea
 *   team_bot_tasks     - captured via /tasks
 *   team_bot_clips     - captured via /clip
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

const supabase: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false },
});

export type BotName = 'magnetiq' | 'attabotty';

export interface ChatMessage {
  bot: BotName;
  chat_id: number;
  message_id: number;
  from_id: number;
  from_username: string | null;
  text: string;
  is_bot_reply: boolean;
  ts: string;
}

export async function logMessage(m: Omit<ChatMessage, 'ts'>): Promise<void> {
  const { error } = await supabase.from('team_bot_messages').insert({
    bot: m.bot,
    chat_id: m.chat_id,
    message_id: m.message_id,
    from_id: m.from_id,
    from_username: m.from_username,
    text: m.text.slice(0, 4000),
    is_bot_reply: m.is_bot_reply,
  });
  if (error) console.error(`[teams/memory] logMessage failed: ${error.message}`);
}

/** Most recent N messages for context-stitching. */
export async function recentMessages(bot: BotName, limit = 30): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('team_bot_messages')
    .select('*')
    .eq('bot', bot)
    .order('ts', { ascending: false })
    .limit(limit);
  if (error) {
    console.error(`[teams/memory] recentMessages failed: ${error.message}`);
    return [];
  }
  return (data ?? []).reverse();
}

/** Messages since timestamp. Used by the daily summary cron. */
export async function messagesSince(bot: BotName, sinceIso: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('team_bot_messages')
    .select('*')
    .eq('bot', bot)
    .gte('ts', sinceIso)
    .order('ts', { ascending: true });
  if (error) {
    console.error(`[teams/memory] messagesSince failed: ${error.message}`);
    return [];
  }
  return data ?? [];
}

export async function saveIdea(bot: BotName, from_id: number, text: string): Promise<string> {
  const { data, error } = await supabase
    .from('team_bot_ideas')
    .insert({ bot, from_id, text: text.slice(0, 2000) })
    .select('id')
    .single();
  if (error) throw new Error(`saveIdea: ${error.message}`);
  return data.id as string;
}

export async function saveTask(bot: BotName, from_id: number, text: string): Promise<string> {
  const { data, error } = await supabase
    .from('team_bot_tasks')
    .insert({ bot, from_id, text: text.slice(0, 2000), status: 'open' })
    .select('id')
    .single();
  if (error) throw new Error(`saveTask: ${error.message}`);
  return data.id as string;
}

export async function listOpenTasks(bot: BotName, limit = 20): Promise<Array<{ id: string; text: string; from_id: number; created_at: string }>> {
  const { data, error } = await supabase
    .from('team_bot_tasks')
    .select('id, text, from_id, created_at')
    .eq('bot', bot)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error(`[teams/memory] listOpenTasks failed: ${error.message}`);
    return [];
  }
  return data ?? [];
}

export async function markTaskDone(bot: BotName, id: string): Promise<boolean> {
  const { error } = await supabase
    .from('team_bot_tasks')
    .update({ status: 'done', closed_at: new Date().toISOString() })
    .eq('bot', bot)
    .eq('id', id);
  if (error) {
    console.error(`[teams/memory] markTaskDone failed: ${error.message}`);
    return false;
  }
  return true;
}

export async function saveClip(bot: BotName, from_id: number, url: string, note: string): Promise<string> {
  const { data, error } = await supabase
    .from('team_bot_clips')
    .insert({ bot, from_id, url: url.slice(0, 600), note: note.slice(0, 2000) })
    .select('id')
    .single();
  if (error) throw new Error(`saveClip: ${error.message}`);
  return data.id as string;
}

export async function saveFact(bot: BotName, fact: string): Promise<void> {
  const { error } = await supabase
    .from('team_bot_facts')
    .insert({ bot, fact: fact.slice(0, 1000) });
  if (error) console.error(`[teams/memory] saveFact failed: ${error.message}`);
}

export async function listFacts(bot: BotName, limit = 30): Promise<string[]> {
  const { data, error } = await supabase
    .from('team_bot_facts')
    .select('fact')
    .eq('bot', bot)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => r.fact as string);
}
