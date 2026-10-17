/**
 * member-dm.ts - a DM turn for a ZAO member who is not Zaal.
 *
 * Until now a DM from anyone but Zaal got one line, "That one is Zaal's.", once
 * an hour. Tom Fellenz (16 Oct 2026) chatted with ZOE and wanted more of her,
 * not less. With ZOE_MEMBER_DM=1 (default OFF) a member gets a real answer in a
 * scope built for them:
 *
 * - who counts: a user on the member allowlist of any group ZOE is in (the
 *   same list a group already uses to decide whom to answer, groups.ts). Anyone
 *   else keeps the owner-only line.
 * - what she knows: persona plus this DM's own recent turns. None of Zaal's
 *   memory: buildMemoryBlocks loads human, tasks, decisions, inbox and team
 *   only for the 'private' scope, and this scope is never 'private'.
 * - what she can do: talk. Every tool is denied (concierge.ts toolsFor('none')),
 *   the turn runs in an empty directory, and every op the model emits (tasks,
 *   relays, CRM, decisions) is dropped unread. No builds, no bus, no captures.
 * - how often: MEMBER_DM_DEFAULT_PER_HOUR turns per member per hour
 *   (ZOE_MEMBER_DM_PER_HOUR), one plain line when the limit is reached.
 *
 * Zaal decides whether this goes live (grill Q9). Off = identical to before.
 */

import type { GroupConfig } from './groups';
import type { MemoryBlocks } from './memory';

export function memberDmEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_MEMBER_DM === '1';
}

export const MEMBER_DM_DEFAULT_PER_HOUR = 6;
export const MEMBER_DM_WINDOW_MS = 60 * 60 * 1000;
export const MEMBER_DM_LIMIT_LINE = "That's a lot of questions for one hour. Try me again in a bit.";

export const MEMBER_DM_EMPTY_LINE = "I don't have a good answer for that one.";

export function memberDmPerHour(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.ZOE_MEMBER_DM_PER_HOUR);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : MEMBER_DM_DEFAULT_PER_HOUR;
}

/** A ZAO member: on the allowlist of any group ZOE is configured in. */
export function isZaoMember(userId: number, groups: readonly GroupConfig[]): boolean {
  return groups.some((g) => g.member_allowlist.includes(userId));
}

/**
 * The memory scope for one member's DM. Never 'private': that scope is Zaal's
 * (owner-only.ts privateScopeAllowed) and is the only one that loads his memory.
 */
export function memberDmScope(userId: number): string {
  return `member-dm-${userId}`;
}

export interface MemberDmLimiter {
  // Telegram ids are numbers; Discord ids are snowflake strings (discord.ts).
  turns: Map<number | string, number[]>;
}

export function newMemberDmLimiter(): MemberDmLimiter {
  return { turns: new Map() };
}

/** True when this member may have another turn now. Records the turn. */
export function allowMemberTurn(state: MemberDmLimiter, userId: number | string, nowMs: number, perHour: number): boolean {
  const recent = (state.turns.get(userId) ?? []).filter((t) => nowMs - t < MEMBER_DM_WINDOW_MS);
  if (recent.length >= perHour) {
    state.turns.set(userId, recent);
    return false;
  }
  recent.push(nowMs);
  state.turns.set(userId, recent);
  for (const [id, ts] of state.turns) {
    if (!ts.some((t) => nowMs - t < MEMBER_DM_WINDOW_MS)) state.turns.delete(id);
  }
  return true;
}

/** Replaces the group profile: same privacy and escalation rules, one person. */
export function memberDmContext(name: string): string {
  return [
    `Direct message with ${name}, a member of The ZAO (not Zaal).`,
    '',
    'Role & Boundaries:',
    "- You are ZOE, The ZAO's assistant. Be warm, concise and direct.",
    '- You can answer questions about The ZAO, its projects, music and events from what you already know.',
    "- Privacy: you have none of Zaal's private memory here. Do not share Zaal's schedule, credentials, financial figures, internal systems or anyone's contact details.",
    '- You cannot run tools, create tasks, start builds or message anyone in this chat. If asked, say so plainly.',
    '- If they want Zaal, tell them to message him directly or ask in a ZAO group.',
  ].join('\n');
}

export interface MemberTurnResult {
  reply: string;
}

export interface MemberDmDeps {
  buildBlocks: (scope: string) => Promise<MemoryBlocks>;
  /** Runs the model with every tool denied. Whatever ops it returns are ignored. */
  runTurn: (blocks: MemoryBlocks, message: string, senderLabel: string) => Promise<MemberTurnResult>;
  remember: (turn: { from: 'zoe' | 'other'; text: string; sender?: string }, scope: string) => Promise<void>;
  reply: (text: string) => Promise<void>;
}

export type MemberDmOutcome = 'answered' | 'limited' | 'empty';

/**
 * One member DM turn. The caller has already checked the flag, that the sender
 * is not Zaal, and that they are a member.
 */
export async function runMemberDmTurn(
  deps: MemberDmDeps,
  input: { userId: number; name: string; text: string; nowMs: number; limiter: MemberDmLimiter; perHour: number },
): Promise<MemberDmOutcome> {
  if (!allowMemberTurn(input.limiter, input.userId, input.nowMs, input.perHour)) {
    await deps.reply(MEMBER_DM_LIMIT_LINE);
    return 'limited';
  }
  const scope = memberDmScope(input.userId);
  await deps.remember({ from: 'other', text: input.text, sender: input.name }, scope);
  const blocks = await deps.buildBlocks(scope);
  blocks.group_context = memberDmContext(input.name);
  const result = await deps.runTurn(blocks, input.text, input.name);
  const reply = result.reply.trim();
  if (reply.length < 2) {
    await deps.reply(MEMBER_DM_EMPTY_LINE);
    return 'empty';
  }
  await deps.remember({ from: 'zoe', text: reply }, scope);
  await deps.reply(reply);
  return 'answered';
}
