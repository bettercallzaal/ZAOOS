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
  /** Epoch ms until which this sender keeps the floor without re-mentioning
   *  ZOE (see markEngaged / engagedUntilFor). Absent or past = no window. */
  engagedUntil?: number;
  /** Clock for the engaged check; tests pass it, callers leave it to Date.now(). */
  nowMs?: number;
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

/**
 * Automatically register a group when ZOE is added or activated.
 * Defaults to mode="mention" with wildcard -1 allowlist so any member
 * can mention the bot, while keeping Zaal recognized.
 */
export async function autoRegisterGroup(
  chatId: number,
  chatTitle: string,
  addedByUserId?: number,
): Promise<GroupConfig> {
  const allowlist: number[] = [-1];
  const zaalId = Number(process.env.ZAAL_TELEGRAM_ID ?? process.env.ZAAL_DM_ID ?? 1447437687);
  if (zaalId) allowlist.push(zaalId);
  if (addedByUserId && !allowlist.includes(addedByUserId)) {
    allowlist.push(addedByUserId);
  }
  return upsertGroup({
    chat_id: chatId,
    chat_title: chatTitle,
    mode: "mention",
    member_allowlist: allowlist,
  });
}

export function shouldRespond(config: GroupConfig | null, gctx: GateContext): GateResult {
  if (!config) return { allow: false, reason: 'group not configured (default silent)' };
  if (config.mode === 'silent') return { allow: false, reason: 'group mode=silent' };
  const isRestricted =
    config.member_allowlist.length > 0 && !config.member_allowlist.includes(-1);
  if (isRestricted && !config.member_allowlist.includes(gctx.fromId)) {
    return { allow: false, reason: `sender ${gctx.fromId} not in member_allowlist` };
  }
  if (config.mode === 'all') {
    return { allow: true, reason: 'mode=all' };
  }
  // mode === 'mention'
  const mentioned = isBotMentioned(gctx);
  const isReplyToBot = gctx.botId !== null && gctx.replyToFromId === gctx.botId;
  if (mentioned) return { allow: true, reason: 'mode=mention + @-mention' };
  if (isReplyToBot) return { allow: true, reason: 'mode=mention + reply-to-bot' };
  // A member who just got an answer from ZOE is still talking to her. Zaal,
  // 1 Nov 2026: give ZOE "more ability to talk to community members,
  // especially groups they're talking back with it in". Measured on the VPS
  // journal, 29 Oct to 1 Nov 2026: 148 group messages skipped as
  // "mode=mention + no mention/reply", most of them a member's next line
  // right after ZOE had replied to that member.
  const now = gctx.nowMs ?? Date.now();
  if (typeof gctx.engagedUntil === 'number' && now < gctx.engagedUntil) {
    return { allow: true, reason: 'mode=mention + engaged window' };
  }
  return { allow: false, reason: 'mode=mention + no mention/reply' };
}

/**
 * The engaged window: after ZOE SENDS a reply to a member in a group, that
 * member's next messages in the same chat reach her for ENGAGED_WINDOW_MS
 * without an @-mention or a reply, for at most ENGAGED_MAX_TURNS replies in a
 * row. The cap is what stops one member holding ZOE in an endless exchange.
 * Once it is spent, a fresh @-mention or a reply still passes the gate on its
 * own merits, but the count resets only after the window lapses (ten quiet
 * minutes from that member). mode=silent and the allowlist win because
 * shouldRespond checks them first. State is
 * in-process only: a restart ends every window, the safe direction.
 */
export const ENGAGED_WINDOW_MS = 10 * 60_000;
export const ENGAGED_MAX_TURNS = 6;
interface Engaged { until: number; turns: number }
const engaged = new Map<string, Engaged>();

/** Call ONLY after a reply to this member was actually sent. */
export function markEngaged(chatId: number | string, fromId: number, nowMs: number = Date.now()): void {
  for (const [k, e] of engaged) if (e.until <= nowMs) engaged.delete(k);
  const key = `${chatId}:${fromId}`;
  const prev = engaged.get(key);
  const turns = prev && prev.until > nowMs ? prev.turns + 1 : 1;
  engaged.set(key, { until: nowMs + ENGAGED_WINDOW_MS, turns });
}

/** The window's end for this sender, or undefined when none is open or the cap is spent. */
export function engagedUntilFor(chatId: number | string, fromId: number): number | undefined {
  const e = engaged.get(`${chatId}:${fromId}`);
  if (!e || e.turns >= ENGAGED_MAX_TURNS) return undefined;
  return e.until;
}

/** Tests only: forget every engaged window. */
export function resetEngagedForTests(): void {
  engaged.clear();
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

/**
 * Detect requests in groups aimed at escalating to Zaal (e.g. "tell Zaal...", "ask Zaal...", "note for Zaal...").
 * The `s` flag keeps every line of a multi-line note: without it `.` stops at
 * the first newline and Zaal received only line one (doc 2570).
 */
export function detectGroupEscalation(text: string): { isEscalation: boolean; note?: string } {
  const cleaned = text.replace(/@\w+\b/g, '').trim();
  const match =
    /(?:please\s+)?(?:tell|ask|let|pass|notify|inform)\s+zaal(?:\s+know)?(?:\s+that|\s+to|\s*[:,])?\s*(.+)/is.exec(cleaned) ||
    /(?:message|note)\s+for\s+zaal(?:\s*[:,])?\s*(.+)/is.exec(cleaned);
  if (match && match[1]?.trim()) {
    return { isEscalation: true, note: match[1].trim() };
  }
  return { isEscalation: false };
}
