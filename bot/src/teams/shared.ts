/**
 * Shared helpers for team bots: allowlist gates, context stitching, mention
 * detection, intent classification (cheap), daily-summary scheduler.
 */
import { Bot, Context } from 'grammy';
 
import cron from 'node-cron';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { messagesSince, type BotName, listOpenTasks, listFacts } from './memory';
import { think, type BrainKind } from './brain';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface BotConfig {
  name: BotName;
  token: string;
  chatId: number;
  allowedTelegramIds: number[];
  /** Telegram bot username, populated on boot via getMe. */
  username?: string;
  /** Absolute path to persona.md. */
  personaPath: string;
  /** When to send the daily summary - cron expression (server local time). */
  dailySummaryCron: string;
}

export function envBotConfig(name: BotName): BotConfig {
  const tokenEnv = name === 'magnetiq' ? 'MAGNETIQ_BOT_TOKEN' : 'ATTABOTTY_BOT_TOKEN';
  const chatEnv = name === 'magnetiq' ? 'MAGNETIQ_CHAT_ID' : 'ATTABOTTY_CHAT_ID';
  const allowEnv = name === 'magnetiq' ? 'MAGNETIQ_ALLOWED_IDS' : 'ATTABOTTY_ALLOWED_IDS';
  const cronEnv = name === 'magnetiq' ? 'MAGNETIQ_SUMMARY_CRON' : 'ATTABOTTY_SUMMARY_CRON';

  const token = process.env[tokenEnv];
  const chatRaw = process.env[chatEnv];
  const allowRaw = process.env[allowEnv] ?? '';
  if (!token) throw new Error(`Missing ${tokenEnv}`);
  if (!chatRaw) throw new Error(`Missing ${chatEnv}`);
  const chatId = Number(chatRaw);
  if (!Number.isFinite(chatId)) throw new Error(`${chatEnv} must be a number, got: ${chatRaw}`);

  const allowedTelegramIds = allowRaw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  return {
    name,
    token,
    chatId,
    allowedTelegramIds,
    personaPath: resolve(__dirname, name, 'persona.md'),
    dailySummaryCron: process.env[cronEnv] ?? '0 6 * * *', // 06:00 server local (set TZ=America/New_York via systemd)
  };
}

/** Reject messages from chats other than the configured one. */
export function chatGate(cfg: BotConfig) {
  return async (ctx: Context, next: () => Promise<void>): Promise<void> => {
    if (ctx.chat?.id !== cfg.chatId) {
      // Silently ignore - never reply outside the allowed group, so we don't
      // surface ourselves to drive-by chats.
      return;
    }
    await next();
  };
}

/** For commands that mutate state (/idea, /clip, /tasks), require allowlist. */
export function userGate(cfg: BotConfig, ctx: Context): boolean {
  const id = ctx.from?.id;
  if (!id) return false;
  if (cfg.allowedTelegramIds.length === 0) return true; // permissive if not set yet
  return cfg.allowedTelegramIds.includes(id);
}

/** Match @mentions of this bot's username so plain-text triggers work. */
export function isMentioned(ctx: Context, username: string | undefined): boolean {
  if (!username) return false;
  const text = ctx.message?.text ?? '';
  const re = new RegExp(`@${username}\\b`, 'i');
  return re.test(text);
}

/** Cheap heuristic gate so chat replies only fire when needed (cost saver). */
export function shouldReplyToText(ctx: Context, cfg: BotConfig): boolean {
  if (!cfg.username) return false;
  const text = ctx.message?.text ?? '';
  if (!text) return false;
  if (text.startsWith('/')) return false; // commands handle themselves
  if (isMentioned(ctx, cfg.username)) return true;
  // Replies-to-bot count as addressed
  const reply = ctx.message?.reply_to_message;
  if (reply && reply.from?.username?.toLowerCase() === cfg.username.toLowerCase()) return true;
  return false;
}

/** Stitch recent messages + facts into a prompt the brain can act on. */
export async function buildContextStitch(cfg: BotConfig, userPrompt: string, kind: BrainKind = 'chat'): Promise<string> {
  const recent = await messagesSince(
    cfg.name,
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
  const facts = await listFacts(cfg.name, 10);
  const tasks = await listOpenTasks(cfg.name, 10);

  const lines: string[] = [];
  if (facts.length) {
    lines.push('## Known facts about this team (do not contradict, do not repeat unless asked):');
    facts.forEach((f) => lines.push(`- ${f}`));
    lines.push('');
  }
  if (tasks.length) {
    lines.push('## Open tasks the team agreed on:');
    tasks.forEach((t, i) => lines.push(`${i + 1}. ${t.text}`));
    lines.push('');
  }
  if (recent.length) {
    lines.push('## Last 24h of chat (for context, do not summarize unless asked):');
    recent.slice(-30).forEach((m) => {
      const who = m.is_bot_reply ? 'BOT' : `@${m.from_username ?? m.from_id}`;
      lines.push(`${who}: ${m.text.slice(0, 200)}`);
    });
    lines.push('');
  }
  lines.push('## Current message (respond to this):');
  lines.push(userPrompt);

  void kind; // reserved for future kind-specific stitching
  return lines.join('\n');
}

export async function brainReply(cfg: BotConfig, userPrompt: string, kind: BrainKind = 'chat'): Promise<string> {
  const stitched = await buildContextStitch(cfg, userPrompt, kind);
  const reply = await think({
    kind,
    personaPath: cfg.personaPath,
    prompt: stitched,
  });
  return reply.text;
}

/**
 * Send a daily summary at the configured cron. The summary is generated by the
 * brain (Opus) from the last 24h of chat + open tasks. Posted to the group.
 */
export function scheduleDailySummary(bot: Bot<Context>, cfg: BotConfig): void {
  cron.schedule(
    cfg.dailySummaryCron,
    () => {
      void runDailySummary(bot, cfg);
    },
    { timezone: process.env.TEAMS_TZ ?? 'America/New_York' },
  );
  console.log(`[teams/${cfg.name}] daily summary scheduled '${cfg.dailySummaryCron}' (${process.env.TEAMS_TZ ?? 'America/New_York'})`);
}

async function runDailySummary(bot: Bot<Context>, cfg: BotConfig): Promise<void> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const msgs = await messagesSince(cfg.name, since);
    if (msgs.length === 0) {
      console.log(`[teams/${cfg.name}] no messages in last 24h - skipping summary`);
      return;
    }
    const tasks = await listOpenTasks(cfg.name, 20);
    const transcript = msgs
      .map((m) => `${m.is_bot_reply ? 'BOT' : `@${m.from_username ?? m.from_id}`}: ${m.text}`)
      .join('\n');

    const prompt = [
      'Generate the daily morning summary for this team.',
      '',
      'Format (max 12 lines):',
      '1. One-sentence headline of what the team discussed yesterday',
      '2. Decisions made (bullet, max 3)',
      '3. Open questions (bullet, max 3)',
      '4. Top 3 actions for today (bullet, ranked by urgency)',
      '5. Anything blocked or waiting on external (bullet, max 2)',
      '',
      '## Transcript (last 24h):',
      transcript.slice(0, 12_000),
      '',
      '## Open tasks already tracked:',
      tasks.map((t, i) => `${i + 1}. ${t.text}`).join('\n') || '(none yet)',
    ].join('\n');

    const reply = await think({
      kind: 'summary',
      personaPath: cfg.personaPath,
      prompt,
    });

    const header = `Daily summary (${new Date().toISOString().slice(0, 10)})`;
    await bot.api.sendMessage(cfg.chatId, `${header}\n\n${reply.text}`);
    console.log(`[teams/${cfg.name}] daily summary posted (cost $${reply.costUsd.toFixed(3)}, ${reply.durationMs}ms)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[teams/${cfg.name}] daily summary failed: ${msg}`);
    try {
      await bot.api.sendMessage(cfg.chatId, `Daily summary failed: ${msg.slice(0, 200)}`);
    } catch {
      /* ignore */
    }
  }
}
