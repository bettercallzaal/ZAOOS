/**
 * Team view in allowlisted groups (iman-desk #168 item 3; vault decisions
 * 2026-11-08 item 4). In a chat on ZOE_TEAM_VIEW_CHATS, a member ZOE answers
 * there can ask `/teamview` (their own open tasks, matched by their Telegram
 * first name) or `/teamview <name>` (one teammate's). The reply is
 * team-tracker.ts formatOwnerDigest, the same per-person view Zaal's
 * `/board <person>` shows, read from the team board.
 *
 * Only the team board. This path never reads ZOE's private task queue
 * (memory.ts tasks.json) or Zaal's daily file; it imports neither, and a test
 * holds that line. OFF unless ZOE_TEAM_VIEW=1 and at least one chat is listed.
 * The group gate is groups.ts shouldRespond.
 *
 * Seat-merge NEEDS_WORK on #4276: formatOwnerDigest matches members by
 * substring, so `/teamview a` merged many people's rows into a group. Here a
 * name resolves to exactly ONE member, by case-insensitive equality with the
 * member's full display name or its first word, or by the member id; zero or
 * several matches get a short reply and no rows. ZOE_TEAM_VIEW_EXCLUDE (names
 * or ids, comma separated) keeps a member's rows out of every group: whether
 * Zaal's own rows stay out is his ruling, so it is one env value, empty by
 * default. Zaal's /board <person> keeps its own substring match.
 */
import type { Bot, Context } from 'grammy';
import { type GroupConfig, shouldRespond } from './groups';
import { formatOwnerDigest, type TeamTask } from './team-tracker';

export const TEAM_VIEW_MAX_CHARS = 1500;

export interface TeamViewConfig {
  chats: number[];
  /** Lower-cased names or ids whose rows never show in a group. */
  exclude?: string[];
}

/** The config, or null when off. */
export function readTeamViewConfig(env: NodeJS.ProcessEnv = process.env): TeamViewConfig | null {
  if (env.ZOE_TEAM_VIEW !== '1') return null;
  const chats = (env.ZOE_TEAM_VIEW_CHATS ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n !== 0);
  const exclude = (env.ZOE_TEAM_VIEW_EXCLUDE ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return chats.length ? { chats, exclude } : null;
}

export interface TeamViewDeps {
  getGroupConfig: (chatId: number) => Promise<GroupConfig | null>;
  trackerConfigured: () => boolean;
  getTasks: () => Promise<TeamTask[]>;
  getMembers: () => Promise<Map<string, string>>;
  featureRan: (name: string, detail?: string) => void;
  botUsername: () => string | null;
  botId: () => number | null;
}

export type MemberMatch = { kind: 'one'; id: string; name: string } | { kind: 'none' } | { kind: 'many' };

/** Exactly one member by case-insensitive equality (full name, first name, or id). Never a substring. */
export function resolveMember(members: Map<string, string>, who: string): MemberMatch {
  const q = who.trim().toLowerCase();
  if (!q) return { kind: 'none' };
  const hits: Array<[string, string]> = [];
  for (const [id, name] of members) {
    const full = name.trim().toLowerCase();
    const first = full.split(/\s+/)[0] ?? '';
    if (full === q || first === q || id.toLowerCase() === q) hits.push([id, name]);
  }
  if (hits.length === 0) return { kind: 'none' };
  if (hits.length > 1) return { kind: 'many' };
  return { kind: 'one', id: hits[0][0], name: hits[0][1] };
}

function isExcluded(cfg: TeamViewConfig, id: string, name: string): boolean {
  const ex = cfg.exclude ?? [];
  const full = name.trim().toLowerCase();
  return ex.includes(id.toLowerCase()) || ex.includes(full) || ex.includes(full.split(/\s+/)[0] ?? '');
}

function cap(s: string): string {
  return s.length > TEAM_VIEW_MAX_CHARS ? `${s.slice(0, TEAM_VIEW_MAX_CHARS - 20).trimEnd()}\n...and more` : s;
}

/** Handle one /teamview. Silent outside the allowlisted chats and for anyone the group gate refuses. */
export async function handleTeamView(ctx: Context, arg: string, cfg: TeamViewConfig, deps: TeamViewDeps): Promise<void> {
  const chatId = ctx.chat?.id;
  const fromId = ctx.from?.id;
  if (chatId === undefined || !fromId || !cfg.chats.includes(chatId)) return;
  const gate = shouldRespond(
    await deps.getGroupConfig(chatId),
    { fromId, botUsername: deps.botUsername(), botId: deps.botId(), messageText: arg, entities: [], isCommand: true },
    false,
  );
  if (!gate.allow) return;
  if (!deps.trackerConfigured()) {
    await ctx.reply('The team board is not connected yet.');
    return;
  }
  const who = arg.trim() || (ctx.from?.first_name ?? '').trim();
  if (!who) {
    await ctx.reply('Use: /teamview, or /teamview <name>');
    return;
  }
  let text: string;
  try {
    const [tasks, members] = await Promise.all([deps.getTasks(), deps.getMembers()]);
    const match = resolveMember(members, who);
    if (match.kind === 'none') {
      await ctx.reply(`No teammate named "${who.slice(0, 40)}" on the board.`);
      return;
    }
    if (match.kind === 'many') {
      await ctx.reply(`More than one teammate matches "${who.slice(0, 40)}". Use the full name.`);
      return;
    }
    if (isExcluded(cfg, match.id, match.name)) {
      await ctx.reply('That board is not shown in this chat.');
      return;
    }
    // Only the one matched member goes in, so formatOwnerDigest's own
    // substring match has nobody else to find; the id query matches exactly.
    text = formatOwnerDigest(tasks, new Map([[match.id, match.name]]), match.id);
  } catch (e) {
    console.error('[zoe/team-view] board read failed:', (e as Error)?.message);
    await ctx.reply('I could not read the team board just now.');
    return;
  }
  await ctx.reply(cap(text));
  deps.featureRan('team-view', arg.trim() ? 'named' : 'self');
}

/** Register /teamview. Call once at boot, only when readTeamViewConfig() is not null. */
export function registerTeamView(bot: Bot, cfg: TeamViewConfig, deps: TeamViewDeps): void {
  bot.command('teamview', async (ctx) => {
    const arg = (ctx.message?.text ?? '').replace(/^\/teamview(@\w+)?\s*/, '');
    await handleTeamView(ctx, arg, cfg, deps);
  });
}
