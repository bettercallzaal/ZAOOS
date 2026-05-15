/**
 * ZOE — main entry. Telegram polling for @zaoclaw_bot.
 *
 * DM path: messages from Zaal (allowlisted by ZAAL_TELEGRAM_ID) route to
 * the concierge handler with the 'private' memory scope.
 *
 * Group path: configured groups (~/.zao/zoe/groups.json) route to the
 * concierge handler with a per-chat memory scope, gated by group mode +
 * sender allowlist. See groups.ts.
 *
 * Also boots the scheduler (morning brief, evening reflection, hourly nudge).
 *
 * Run via:
 *   pnpm tsx src/zoe/index.ts
 *   OR: systemd user unit zoe-bot.service
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import { Bot, Context } from 'grammy';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { runConciergeTurn } from './concierge';
import { applyTaskOps, seedInitialTasks } from './tasks';
import { applyQuestOps, buildQuestsBlock, formatQuestList } from './sidequests';
import {
  buildMemoryBlocks,
  ensureZoeHome,
  pushRecent,
  ZOE_PATHS,
  type ChatScope,
} from './memory';
import { startScheduler } from './scheduler';
import { disableNudges, enableNudges, nudgesEnabled } from './nudges';
import {
  addAllowlistMember,
  getGroupConfig,
  removeAllowlistMember,
  setGroupMode,
  upsertGroup,
  shouldRespond,
  readGroups,
  type GroupMode,
} from './groups';

const NOTE_PREFIX = /^(note|cc|claude):\s*(.+)/is;
const CLAUDE_NOTES_FILE = join(ZOE_PATHS.home, 'claude-code-notes.md');
const VALID_GROUP_MODES: GroupMode[] = ['silent', 'mention', 'all'];

// Telegram rejects messages over 4096 chars. Leave headroom for the
// "(n/m) " chunk prefix and any markdown.
const TELEGRAM_MAX = 3900;

/**
 * Split a long string into Telegram-sized chunks, preferring paragraph then
 * line then word boundaries. Falls back to a hard cut only if no boundary is
 * found in the back half of the window.
 */
function chunkMessage(text: string, max = TELEGRAM_MAX): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf('\n\n', max);
    if (cut < max * 0.5) cut = remaining.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = remaining.lastIndexOf(' ', max);
    if (cut < max * 0.5) cut = max;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Send a possibly-long reply as one or more Telegram messages. The "reply to"
 * link (reply_parameters) is applied only to the first chunk. Without this,
 * any reply over 4096 chars throws "Bad Request: message is too long" and the
 * user gets nothing.
 */
async function replyChunked(
  ctx: Context,
  text: string,
  opts: { replyToMessageId?: number } = {},
): Promise<void> {
  const chunks = chunkMessage(text);
  for (let i = 0; i < chunks.length; i++) {
    const prefix = chunks.length > 1 ? `(${i + 1}/${chunks.length}) ` : '';
    await ctx.reply(prefix + chunks[i], {
      reply_parameters:
        i === 0 && opts.replyToMessageId
          ? { message_id: opts.replyToMessageId }
          : undefined,
    });
  }
}

async function appendClaudeNote(body: string): Promise<number> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  const ts = new Date().toISOString();
  const block = `\n## ${ts}\n\n${body.trim()}\n`;
  await fs.appendFile(CLAUDE_NOTES_FILE, block, 'utf8');
  let count = 0;
  try {
    const raw = await fs.readFile(CLAUDE_NOTES_FILE, 'utf8');
    count = (raw.match(/^## /gm) ?? []).length;
  } catch {
    count = 1;
  }
  return count;
}

const token = process.env.ZOE_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
const zaalIdRaw = process.env.ZAAL_TELEGRAM_ID;
const repoDir = process.env.ZOE_REPO_DIR ?? '/home/zaal/zao-os';
const devzChatRaw = process.env.ZAO_DEVZ_CHAT_ID;

if (!token) {
  console.error('Missing ZOE_BOT_TOKEN or TELEGRAM_BOT_TOKEN');
  process.exit(1);
}
if (!zaalIdRaw) {
  console.error('Missing ZAAL_TELEGRAM_ID');
  process.exit(1);
}

const zaalId = Number(zaalIdRaw);
const devzChatId = devzChatRaw ? Number(devzChatRaw) : undefined;

const bot = new Bot(token);
const usernameHolder: { value: string | null } = { value: null };
const botIdHolder: { value: number | null } = { value: null };

function isFromZaal(ctx: Context): boolean {
  return ctx.from?.id === zaalId;
}

function senderLabel(ctx: Context): string {
  if (isFromZaal(ctx)) return 'Zaal';
  const first = ctx.from?.first_name;
  const uname = ctx.from?.username;
  return first ?? (uname ? `@${uname}` : `user:${ctx.from?.id ?? 'unknown'}`);
}

function chatScopeFor(ctx: Context): ChatScope {
  if (ctx.chat?.type === 'private') return 'private';
  return String(ctx.chat?.id ?? 'unknown');
}

async function replyAdminOnly(ctx: Context): Promise<void> {
  await ctx.reply('Group admin commands are Zaal-only. DM me if you need access.');
}

bot.command('start', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  await ctx.reply(
    'ZOE online. Hermes runtime, Sonnet/Opus brain via Max plan. Memory blocks loaded (persona/human/working/tasks). Send anything.',
  );
});

bot.command('tasks', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const blocks = await buildMemoryBlocks('private');
  await replyChunked(ctx, `Open tasks:\n\n${blocks.tasks}`);
});

bot.command('seed', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const result = await seedInitialTasks();
  await ctx.reply(
    result.seeded > 0
      ? `Seeded ${result.seeded} tasks from doc 601.`
      : 'Task queue already has entries - skipped seed.',
  );
});

bot.command('quest', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const block = await buildQuestsBlock();
  await replyChunked(ctx, block);
});

bot.command('quests', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const list = await formatQuestList();
  await replyChunked(ctx, list);
});

bot.command('notes', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  try {
    const raw = await fs.readFile(CLAUDE_NOTES_FILE, 'utf8');
    const blocks = raw
      .split(/^## /m)
      .filter((b) => b.trim())
      .map((b) => '## ' + b.trim());
    if (blocks.length === 0) {
      await ctx.reply('No notes pending. Drop one with `note: <feedback>`.');
      return;
    }
    const recent = blocks.slice(-5).join('\n\n');
    await replyChunked(
      ctx,
      `${blocks.length} note${blocks.length === 1 ? '' : 's'} pending (showing last 5):\n\n${recent}`,
    );
  } catch {
    await ctx.reply('No notes pending. Drop one with `note: <feedback>`.');
  }
});

// /zg — zoe-group admin subcommand. Zaal-only.
//   /zg status                    show config for current chat
//   /zg enable [mode]             register chat (default mode=silent)
//   /zg mode <silent|mention|all> change mode
//   /zg add <user_id>             allowlist sender (or reply to user with /zg add)
//   /zg remove <user_id>
//   /zg list                      list all configured groups
bot.command('zg', async (ctx) => {
  if (!isFromZaal(ctx)) {
    await replyAdminOnly(ctx);
    return;
  }
  const chatId = ctx.chat?.id;
  if (!chatId) {
    await ctx.reply('No chat context.');
    return;
  }
  const argStr = (ctx.match ?? '').toString().trim();
  const [sub, ...rest] = argStr.split(/\s+/);
  const replyTargetId = ctx.message?.reply_to_message?.from?.id;

  try {
    switch (sub) {
      case '':
      case 'status': {
        const cfg = await getGroupConfig(chatId);
        if (!cfg) {
          await ctx.reply(
            `Chat ${chatId} not configured. Run \`/zg enable\` to register (default mode=silent, you only).`,
          );
          return;
        }
        await ctx.reply(
          [
            `Group "${cfg.chat_title}" (id ${cfg.chat_id})`,
            `Mode: ${cfg.mode}`,
            `Allowlist (${cfg.member_allowlist.length}): ${cfg.member_allowlist.join(', ') || '(empty)'}`,
            `Updated: ${cfg.updated_at}`,
          ].join('\n'),
        );
        return;
      }
      case 'enable': {
        const mode = (rest[0] as GroupMode) ?? 'silent';
        if (!VALID_GROUP_MODES.includes(mode)) {
          await ctx.reply(`Invalid mode "${mode}". Use one of: ${VALID_GROUP_MODES.join(', ')}.`);
          return;
        }
        const title = ctx.chat && 'title' in ctx.chat ? (ctx.chat.title ?? '(untitled)') : '(untitled)';
        const cfg = await upsertGroup({
          chat_id: chatId,
          chat_title: title,
          mode,
          member_allowlist: [zaalId],
        });
        await ctx.reply(
          `Group registered: "${cfg.chat_title}" mode=${cfg.mode}. Allowlist seeded with Zaal (${zaalId}). Add others via /zg add <user_id>.`,
        );
        return;
      }
      case 'mode': {
        const mode = rest[0] as GroupMode;
        if (!VALID_GROUP_MODES.includes(mode)) {
          await ctx.reply(`Invalid mode "${mode}". Use one of: ${VALID_GROUP_MODES.join(', ')}.`);
          return;
        }
        const cfg = await setGroupMode(chatId, mode);
        await ctx.reply(`Mode set to ${cfg.mode}.`);
        return;
      }
      case 'add': {
        const target = rest[0] ? Number(rest[0]) : replyTargetId;
        if (!target || !Number.isFinite(target)) {
          await ctx.reply('Usage: `/zg add <user_id>` OR reply to the user with `/zg add`.');
          return;
        }
        const cfg = await addAllowlistMember(chatId, target);
        await ctx.reply(
          `Allowlisted ${target}. Total members: ${cfg.member_allowlist.length}.`,
        );
        return;
      }
      case 'remove': {
        const target = rest[0] ? Number(rest[0]) : replyTargetId;
        if (!target || !Number.isFinite(target)) {
          await ctx.reply('Usage: `/zg remove <user_id>`.');
          return;
        }
        const cfg = await removeAllowlistMember(chatId, target);
        await ctx.reply(`Removed ${target}. Total members: ${cfg.member_allowlist.length}.`);
        return;
      }
      case 'list': {
        const groups = await readGroups();
        if (groups.length === 0) {
          await ctx.reply('No groups configured.');
          return;
        }
        const lines = groups.map(
          (g) =>
            `${g.chat_id} "${g.chat_title}" mode=${g.mode} members=${g.member_allowlist.length}`,
        );
        await ctx.reply(lines.join('\n'));
        return;
      }
      default:
        await ctx.reply(
          'Usage: /zg [status|enable [mode]|mode <m>|add <id>|remove <id>|list]. Modes: silent, mention, all.',
        );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] /zg failed:', msg);
    await ctx.reply(`(/zg error - ${msg.slice(0, 200)})`);
  }
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return; // commands handled above

  const chatType = ctx.chat.type;
  const chatId = ctx.chat.id;

  // DM path: Zaal-only allowlist preserved.
  if (chatType === 'private') {
    if (!isFromZaal(ctx)) return;
    await handlePrivateMessage(ctx, text);
    return;
  }

  // Group path: gate by per-group config.
  const fromId = ctx.from?.id;
  if (!fromId) return;

  const cfg = await getGroupConfig(chatId);
  if (!cfg) {
    // Unconfigured group: log non-Zaal sender id for bootstrap discoverability.
    if (fromId !== zaalId) {
      console.log(
        `[zoe/groups] unconfigured chat ${chatId} ("${
          'title' in ctx.chat ? ctx.chat.title : ''
        }") msg from ${fromId} (@${ctx.from?.username ?? '?'}) — Zaal: run \`/zg enable\` here to start`,
      );
    }
    return;
  }

  const gate = shouldRespond(cfg, {
    fromId,
    botUsername: usernameHolder.value,
    botId: botIdHolder.value,
    messageText: text,
    replyToFromId: ctx.message.reply_to_message?.from?.id,
    entities: (ctx.message.entities ?? []) as ReadonlyArray<{
      type: string;
      offset: number;
      length: number;
      user?: { id: number };
    }>,
  });

  if (!gate.allow) {
    if (fromId !== zaalId && !cfg.member_allowlist.includes(fromId)) {
      console.log(
        `[zoe/groups] chat ${chatId} skipped from ${fromId} (@${ctx.from?.username ?? '?'}): ${gate.reason}`,
      );
    }
    return;
  }

  await handleGroupMessage(ctx, text, String(chatId));
});

async function handlePrivateMessage(ctx: Context, text: string): Promise<void> {
  // Hourly nudge toggle. Accepts "nudges" and the legacy "tips" phrasing.
  const nudgeToggle = /^(stop|pause|disable)\s+(nudges?|tips?)$/i.exec(text.trim())
    ? 'off'
    : /^(start|resume|enable)\s+(nudges?|tips?)$/i.exec(text.trim())
      ? 'on'
      : null;
  if (nudgeToggle === 'off') {
    await disableNudges();
    await ctx.reply('Hourly nudges paused. Send "start nudges" to resume.');
    return;
  }
  if (nudgeToggle === 'on') {
    await enableNudges();
    const status = await nudgesEnabled();
    await ctx.reply(status ? 'Hourly nudges on.' : 'Nudge toggle failed - check logs.');
    return;
  }

  // Note: capture path
  const noteMatch = NOTE_PREFIX.exec(text);
  if (noteMatch) {
    try {
      const count = await appendClaudeNote(noteMatch[2]);
      await ctx.reply(
        `Saved. ${count} note${count === 1 ? '' : 's'} pending for next Claude Code session.`,
      );
      console.log(`[zoe/index] note saved (#${count}): ${noteMatch[2].slice(0, 80)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[zoe/index] note save failed:', msg);
      await ctx.reply(`(note save failed - ${msg.slice(0, 200)})`);
    }
    return;
  }

  await dispatchConcierge(ctx, text, 'private', 'Zaal');
}

async function handleGroupMessage(
  ctx: Context,
  text: string,
  scope: ChatScope,
): Promise<void> {
  const label = senderLabel(ctx);
  // In groups we keep the special "note:" capture path Zaal-only.
  const noteMatch = NOTE_PREFIX.exec(text);
  if (noteMatch && isFromZaal(ctx)) {
    try {
      const count = await appendClaudeNote(noteMatch[2]);
      await ctx.reply(
        `Saved. ${count} note${count === 1 ? '' : 's'} pending for next Claude Code session.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.reply(`(note save failed - ${msg.slice(0, 200)})`);
    }
    return;
  }
  await dispatchConcierge(ctx, text, scope, label);
}

// A concierge turn can take 60s+ on Opus. Telegram clears the typing
// indicator after ~5s, so without this the user stares at silence and
// assumes the bot is dead. We refresh the typing action every 4s and, if
// the turn crosses ACK_THRESHOLD_MS, send one "still working" text ping.
const ACK_THRESHOLD_MS = 6000;
const TYPING_REFRESH_MS = 4000;

async function dispatchConcierge(
  ctx: Context,
  text: string,
  scope: ChatScope,
  label: string,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;
  await ctx.api.sendChatAction(chatId, 'typing').catch(() => {});

  const typingInterval = setInterval(() => {
    ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  }, TYPING_REFRESH_MS);
  const ackTimeout = setTimeout(() => {
    ctx.reply('Got it. Working on this one - reply incoming.').catch(() => {});
  }, ACK_THRESHOLD_MS);

  try {
    const chatTitle =
      ctx.chat && 'title' in ctx.chat ? ctx.chat.title : undefined;
    await pushRecent({ from: label === 'Zaal' ? 'zaal' : 'other', text, sender: label }, scope);

    const blocks = await buildMemoryBlocks(scope, chatTitle);

    const result = await runConciergeTurn({
      message: text,
      blocks,
      senderLabel: label,
      context: {
        zaal_tg_id: zaalId,
        workspace_dir: repoDir,
        current_date: new Date().toISOString().slice(0, 10),
      },
    });

    if (result.task_ops.length > 0) {
      await applyTaskOps(result.task_ops);
    }

    if (result.quest_ops.length > 0) {
      await applyQuestOps(result.quest_ops);
    }

    await pushRecent({ from: 'zoe', text: result.reply }, scope);

    const safeReply = result.reply.trim();
    if (safeReply.length < 5) {
      await ctx.reply('(empty reply guarded - check logs)');
      console.error(
        '[zoe/index] empty reply blocked, raw:',
        JSON.stringify(result).slice(0, 300),
      );
      return;
    }

    await replyChunked(ctx, safeReply, {
      replyToMessageId: scope === 'private' ? undefined : ctx.message?.message_id,
    });

    console.log(
      `[zoe/index] turn handled — scope=${scope} sender=${label} model=${result.model} cost=$${result.costUsd.toFixed(
        4,
      )} tokens=${result.inputTokens}/${result.outputTokens} duration=${result.durationMs}ms`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] concierge turn failed:', msg);
    await ctx.reply(`(concierge error - ${msg.slice(0, 200)})`);
  } finally {
    clearInterval(typingInterval);
    clearTimeout(ackTimeout);
  }
}

bot.callbackQuery(/^nudge:(now|later|shelve)$/, async (ctx) => {
  const action = ctx.match[1];
  await ctx.answerCallbackQuery({ text: `Marked ${action}.` });
  console.log(`[zoe/index] nudge dismissed: ${action}`);
});

async function main(): Promise<void> {
  await ensureZoeHome();
  console.log(
    '[zoe/index] ZOE booting — token set, zaalId=',
    zaalId,
    ' repoDir=',
    repoDir,
  );

  try {
    const me = await bot.api.getMe();
    usernameHolder.value = me.username;
    botIdHolder.value = me.id;
    console.log('[zoe/index] bot identity:', `@${me.username} (${me.id})`);
  } catch (err) {
    console.error('[zoe/index] getMe failed:', (err as Error).message);
  }

  startScheduler({ bot, zaalTgId: zaalId, repoDir, devzChatId });

  try {
    const seed = await seedInitialTasks();
    if (seed.seeded > 0) {
      console.log(`[zoe/index] seeded ${seed.seeded} initial tasks from doc 601`);
    }
  } catch (err) {
    console.warn('[zoe/index] task seed failed (nbd):', (err as Error).message);
  }

  await bot.start({
    onStart: (info) => {
      console.log(`[zoe/index] polling as @${info.username}`);
    },
  });
}

void main();
