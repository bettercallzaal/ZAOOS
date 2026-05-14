/**
 * Per-Telegram-chat config for ZOE in group/channel contexts.
 *
 * Default behavior = silent. A group only becomes interactive after Zaal
 * runs /zoe-group-enable in that chat (or upserts via SSH for bootstrap).
 *
 * Stored at ~/.zao/zoe/groups.json (file-backed, no DB).
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export type GroupMode = 'silent' | 'mention' | 'all';

export interface GroupConfig {
  chat_id: number;
  chat_title: string;
  mode: GroupMode;
  member_allowlist: number[];
  persona_override?: string;
  created_at: string;
  updated_at: string;
}

interface MessageEntity {
  type: string;
  offset: number;
  length: number;
  user?: { id: number };
}

export interface GateContext {
  fromId: number;
  botUsername: string | null;
  botId: number | null;
  messageText: string;
  replyToFromId?: number;
  entities: ReadonlyArray<MessageEntity>;
}

export interface GateResult {
  allow: boolean;
  reason: string;
}

const GROUPS_PATH = join(ZOE_PATHS.home, 'groups.json');

export async function readGroups(): Promise<GroupConfig[]> {
  try {
    const raw = await fs.readFile(GROUPS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as GroupConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeGroups(groups: GroupConfig[]): Promise<void> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(GROUPS_PATH, JSON.stringify(groups, null, 2), 'utf8');
}

export async function getGroupConfig(chatId: number): Promise<GroupConfig | null> {
  const groups = await readGroups();
  return groups.find((g) => g.chat_id === chatId) ?? null;
}

export async function upsertGroup(
  input: Partial<GroupConfig> & { chat_id: number },
): Promise<GroupConfig> {
  const groups = await readGroups();
  const now = new Date().toISOString();
  const existing = groups.find((g) => g.chat_id === input.chat_id);
  if (existing) {
    if (input.chat_title !== undefined) existing.chat_title = input.chat_title;
    if (input.mode !== undefined) existing.mode = input.mode;
    if (input.member_allowlist !== undefined) existing.member_allowlist = input.member_allowlist;
    if (input.persona_override !== undefined) existing.persona_override = input.persona_override;
    existing.updated_at = now;
    await writeGroups(groups);
    return existing;
  }
  const created: GroupConfig = {
    chat_id: input.chat_id,
    chat_title: input.chat_title ?? '(untitled)',
    mode: input.mode ?? 'silent',
    member_allowlist: input.member_allowlist ?? [],
    persona_override: input.persona_override,
    created_at: now,
    updated_at: now,
  };
  groups.push(created);
  await writeGroups(groups);
  return created;
}

export async function addAllowlistMember(chatId: number, userId: number): Promise<GroupConfig> {
  const groups = await readGroups();
  const g = groups.find((x) => x.chat_id === chatId);
  if (!g) throw new Error(`group ${chatId} not configured — upsert it first`);
  if (!g.member_allowlist.includes(userId)) {
    g.member_allowlist.push(userId);
    g.updated_at = new Date().toISOString();
    await writeGroups(groups);
  }
  return g;
}

export async function removeAllowlistMember(chatId: number, userId: number): Promise<GroupConfig> {
  const groups = await readGroups();
  const g = groups.find((x) => x.chat_id === chatId);
  if (!g) throw new Error(`group ${chatId} not configured`);
  const before = g.member_allowlist.length;
  g.member_allowlist = g.member_allowlist.filter((id) => id !== userId);
  if (g.member_allowlist.length !== before) {
    g.updated_at = new Date().toISOString();
    await writeGroups(groups);
  }
  return g;
}

export async function setGroupMode(chatId: number, mode: GroupMode): Promise<GroupConfig> {
  const groups = await readGroups();
  const g = groups.find((x) => x.chat_id === chatId);
  if (!g) throw new Error(`group ${chatId} not configured`);
  g.mode = mode;
  g.updated_at = new Date().toISOString();
  await writeGroups(groups);
  return g;
}

export function shouldRespond(config: GroupConfig | null, gctx: GateContext): GateResult {
  if (!config) return { allow: false, reason: 'group not configured (default silent)' };
  if (config.mode === 'silent') return { allow: false, reason: 'group mode=silent' };
  if (!config.member_allowlist.includes(gctx.fromId)) {
    return { allow: false, reason: `sender ${gctx.fromId} not in member_allowlist` };
  }
  if (config.mode === 'all') {
    return { allow: true, reason: 'mode=all + sender allowlisted' };
  }
  // mode === 'mention'
  const mentioned = isBotMentioned(gctx);
  const isReplyToBot = gctx.botId !== null && gctx.replyToFromId === gctx.botId;
  if (mentioned) return { allow: true, reason: 'mode=mention + @-mention' };
  if (isReplyToBot) return { allow: true, reason: 'mode=mention + reply-to-bot' };
  return { allow: false, reason: 'mode=mention + no mention/reply' };
}

export function isBotMentioned(gctx: GateContext): boolean {
  if (!gctx.botUsername) return false;
  const handle = `@${gctx.botUsername.toLowerCase()}`;
  return gctx.entities.some((e) => {
    if (e.type !== 'mention') return false;
    const slice = gctx.messageText.slice(e.offset, e.offset + e.length).toLowerCase();
    return slice === handle;
  });
}
