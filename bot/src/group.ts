// Group chat handling: chat_id routing (team vs devops vs staging), mode lookup.

import { db } from './supabase';

export type ChatMode = 'team' | 'devops' | 'staging' | 'private';

export interface ChatRow {
  chat_id: number;
  chat_type: string;
  title: string;
  mode: ChatMode;
  forum_enabled: boolean;
  post_digests: boolean;
}

export async function ensureChatRegistered(args: {
  chat_id: number;
  chat_type: string;
  title?: string;
  forum_enabled?: boolean;
}): Promise<ChatRow> {
  const { data: existing } = await db()
    .from('stock_bot_chats')
    .select('chat_id, chat_type, title, mode, forum_enabled, post_digests')
    .eq('chat_id', args.chat_id)
    .maybeSingle();
  if (existing) return existing as ChatRow;

  const mode: ChatMode = args.chat_type === 'private' ? 'private' : 'staging';
  const { data } = await db()
    .from('stock_bot_chats')
    .insert({
      chat_id: args.chat_id,
      chat_type: args.chat_type,
      title: args.title ?? '',
      mode,
      forum_enabled: args.forum_enabled ?? false,
    })
    .select('chat_id, chat_type, title, mode, forum_enabled, post_digests')
    .single();
  return data as ChatRow;
}

export async function getChatRow(chat_id: number): Promise<ChatRow | null> {
  const { data } = await db()
    .from('stock_bot_chats')
    .select('chat_id, chat_type, title, mode, forum_enabled, post_digests')
    .eq('chat_id', chat_id)
    .maybeSingle();
  return (data as ChatRow | null) ?? null;
}

export async function setChatMode(chat_id: number, mode: ChatMode): Promise<void> {
  await db().from('stock_bot_chats').update({ mode }).eq('chat_id', chat_id);
}

export async function setPostDigests(chat_id: number, on: boolean): Promise<void> {
  await db().from('stock_bot_chats').update({ post_digests: on }).eq('chat_id', chat_id);
}

export async function getDigestChats(): Promise<ChatRow[]> {
  const { data } = await db()
    .from('stock_bot_chats')
    .select('chat_id, chat_type, title, mode, forum_enabled, post_digests')
    .eq('post_digests', true)
    .eq('mode', 'team');
  return (data as ChatRow[]) ?? [];
}

export async function getDevopsChats(): Promise<ChatRow[]> {
  const { data } = await db()
    .from('stock_bot_chats')
    .select('chat_id, chat_type, title, mode, forum_enabled, post_digests')
    .eq('mode', 'devops');
  return (data as ChatRow[]) ?? [];
}
