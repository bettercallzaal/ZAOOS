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
 * Also boots the scheduler (morning brief, evening reflection, hourly tips).
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
import {
  buildMemoryBlocks,
  ensureZoeHome,
  pushRecent,
  ZOE_PATHS,
  type ChatScope,
} from './memory';
import { startScheduler } from './scheduler';
import { disableTips, enableTips, tipsEnabled } from './tips';
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
  await ctx.reply(`Open tasks:\n\n${blocks.tasks}`);
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
    await ctx.reply(
      `${blocks.length} note${blocks.length === 1 ? '' : 's'} pending (showing last 5):\n\n${recent.slice(
        0,
        3500,
      )}`,
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
  // Hourly tip toggle
  const tipToggle = /^(stop|pause|disable)\s+tips?$/i.exec(text.trim())
    ? 'off'
    : /^(start|resume|enable)\s+tips?$/i.exec(text.trim())
      ? 'on'
      : null;
  if (tipToggle === 'off') {
    await disableTips();
    await ctx.reply('Hourly tips paused. Send "start tips" to resume.');
    return;
  }
  if (tipToggle === 'on') {
    await enableTips();
    const status = await tipsEnabled();
    await ctx.reply(status ? 'Hourly tips on.' : 'Tips toggle failed - check logs.');
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

async function dispatchConcierge(
  ctx: Context,
  text: string,
  scope: ChatScope,
  label: string,
): Promise<void> {
  if (!ctx.chat) return;
  await ctx.api.sendChatAction(ctx.chat.id, 'typing').catch(() => {});

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

    await ctx.reply(safeReply, {
      reply_parameters:
        scope === 'private' ? undefined : { message_id: ctx.message?.message_id ?? 0 },
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
