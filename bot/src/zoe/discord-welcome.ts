/**
 * discord-welcome.ts - role picker, welcome on join, and which invite brought them.
 *
 * Zaal, 2026-10-18, picking from five Discord ideas: "All of them". This is A,
 * the one that speaks in public. Zaal approved the wording below on 2026-10-18
 * (option A, as proposed). Both flags still default off; turning them on is his.
 *
 * 1. Role picker (ZOE_DISCORD_SELF_ROLES = role names, comma-separated). Zaal
 *    runs /roles post in a channel; ZOE posts one message with a button per
 *    role. A member's press adds or removes that role for themselves. Only the
 *    listed roles, and only ones below ZOE's own role.
 * 2. Welcome on join (ZOE_DISCORD_WELCOME=1, channel ZOE_DISCORD_WELCOME_CHANNEL).
 *    Needs Discord's Server Members Intent, a Developer Portal switch that is
 *    Zaal's. ZOE greets the new member in that channel with the same buttons.
 * 3. Invite attribution (with 2). ZOE remembers each invite's use count and, on
 *    a join, writes which invite went up to discord-joins.jsonl in its home
 *    (owner-only, 0600). Private: the first step of the per-source invite plan
 *    (Discord invite -> source -> role -> Hat), never posted anywhere.
 *
 * Pure helpers here; discord.ts does the Discord calls.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export function selfRoleNames(env: NodeJS.ProcessEnv = process.env): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (env.ZOE_DISCORD_SELF_ROLES ?? '').split(',')) {
    const name = raw.trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      out.push(name);
    }
  }
  // Discord allows 5 rows of 5 buttons per message.
  return out.slice(0, 25);
}

export function welcomeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_DISCORD_WELCOME === '1';
}

export function welcomeChannelName(env: NodeJS.ProcessEnv = process.env): string {
  return (env.ZOE_DISCORD_WELCOME_CHANNEL ?? 'welcome').trim().replace(/^#/, '').toLowerCase();
}

/** Wording approved by Zaal on 2026-10-18. Changing it is a public-wording change: ask him first. */
export const ROLE_PICKER_TEXT = 'Pick the roles that fit you. Tap again to remove one.';
export function welcomeText(memberMention: string): string {
  return `Welcome to ZM, ${memberMention}. This is The ZAO's music home. Pick the roles that fit you below, then say hi.`;
}

export const ROLE_BUTTON_PREFIX = 'zrole_';
export const roleButtonId = (roleId: string): string => `${ROLE_BUTTON_PREFIX}${roleId}`;
export function parseRoleButton(id: string): string | null {
  const m = id.match(/^zrole_(\d{5,25})$/);
  return m ? m[1] : null;
}

/** Split buttons into rows of five, at most five rows. */
export function inRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < Math.min(items.length, 25); i += 5) rows.push(items.slice(i, i + 5));
  return rows;
}

/**
 * Which invite brought a new member: the one whose use count went up since the
 * last look. null when none or more than one did (two joins at once), because
 * a guess would be a wrong record.
 */
export function inviteUsed(before: Map<string, number>, after: Map<string, number>): string | null {
  const up: string[] = [];
  for (const [code, uses] of after) {
    if (uses > (before.get(code) ?? 0)) up.push(code);
  }
  return up.length === 1 ? up[0] : null;
}

export const joinLogPath = (): string => join(ZOE_PATHS.home, 'discord-joins.jsonl');

/** One line per join. Owner-only. Never throws. */
export async function appendJoinLog(
  row: { guildId: string; userId: string; invite: string | null; inviter?: string },
  now: Date = new Date(),
  path: string = joinLogPath(),
): Promise<void> {
  try {
    await fs.mkdir(join(path, '..'), { recursive: true });
    await fs.appendFile(path, `${JSON.stringify({ ts: now.toISOString(), ...row })}\n`, { mode: 0o600 });
    await fs.chmod(path, 0o600);
  } catch (err) {
    console.error(`[zoe/discord-welcome] could not write ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
