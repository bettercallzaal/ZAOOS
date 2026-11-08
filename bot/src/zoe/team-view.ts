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
 */
import type { Bot, Context } from 'grammy';
import { type GroupConfig, shouldRespond } from './groups';
import { formatOwnerDigest, type TeamTask } from './team-tracker';

export const TEAM_VIEW_MAX_CHARS = 1500;

export interface TeamViewConfig {
  chats: number[];
}

/** The config, or null when off. */
export function readTeamViewConfig(env: NodeJS.ProcessEnv = process.env): TeamViewConfig | null {
  if (env.ZOE_TEAM_VIEW !== '1') return null;
  const chats = (env.ZOE_TEAM_VIEW_CHATS ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n !== 0);
  return chats.length ? { chats } : null;
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
    text = formatOwnerDigest(tasks, members, who).replace('Usage: /board <person> - e.g. /board iman', 'Use: /teamview <name>');
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
