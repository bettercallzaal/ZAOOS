/**
 * ZOE — main entry. Telegram polling for @zaoclaw_bot DMs.
 *
 * Boots a grammy Bot using TELEGRAM_BOT_TOKEN, listens for DMs from
 * Zaal (allowlist via ZAAL_TELEGRAM_ID), routes to concierge handler.
 * Starts the scheduler for proactive nudges (morning brief, evening
 * reflection).
 *
 * Run via:
 *   pnpm tsx src/zoe/index.ts
 *   OR: systemd user unit zoe-bot.service
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import { Bot, Context, InlineKeyboard } from 'grammy';
import { runConciergeTurn } from './concierge';
import { applyTaskOps, seedInitialTasks } from './tasks';
import { buildMemoryBlocks, ensureZoeHome, pushRecent } from './memory';
import { startScheduler } from './scheduler';

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

async function isAllowed(ctx: Context): Promise<boolean> {
  const fromId = ctx.from?.id;
  if (!fromId) return false;
  return fromId === zaalId;
}

const NUDGE_KEYBOARD = new InlineKeyboard()
  .text('Now', 'nudge:now')
  .text('Later', 'nudge:later')
  .text('Shelve', 'nudge:shelve');

bot.command('start', async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  await ctx.reply('ZOE online. Hermes runtime, Sonnet/Opus brain via Max plan. Memory blocks loaded. Send anything.');
});

bot.command('tasks', async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  const blocks = await buildMemoryBlocks();
  await ctx.reply(`Open tasks:\n\n${blocks.tasks}`);
});

bot.command('seed', async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  const result = await seedInitialTasks();
  await ctx.reply(result.seeded > 0 ? `Seeded ${result.seeded} tasks from doc 601.` : 'Task queue already has entries — skipped seed.');
});

bot.on('message:text', async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  const text = ctx.message.text;
  if (text.startsWith('/')) return;  // commands handled above

  // Skip messages NOT from Zaal's DM (groups handled separately if needed)
  if (ctx.chat.type !== 'private') return;

  await ctx.api.sendChatAction(ctx.chat.id, 'typing').catch(() => {});

  try {
    const blocks = await buildMemoryBlocks();
    await pushRecent({ from: 'zaal', text });

    const result = await runConciergeTurn({
      message: text,
      context: {
        zaal_tg_id: zaalId,
        workspace_dir: repoDir,
        pending_tasks: [],   // covered by blocks.tasks
        recent_captures: [],  // covered by blocks.working
        current_date: new Date().toISOString().slice(0, 10),
      },
    });

    // Apply task ops + log captures
    if (result.task_ops.length > 0) {
      await applyTaskOps(result.task_ops);
    }
    // Captures TODO Phase 2 — wire to Bonfire ingest

    await pushRecent({ from: 'zoe', text: result.reply });

    // Guard against empty replies (the openclaw "·" pattern)
    const safeReply = result.reply.trim();
    if (safeReply.length < 5) {
      await ctx.reply('(empty reply guarded — check logs)');
      console.error('[zoe/index] empty reply blocked, raw:', JSON.stringify(result).slice(0, 300));
      return;
    }

    await ctx.reply(safeReply);

    console.log(`[zoe/index] turn handled — model=${result.model} cost=$${result.costUsd.toFixed(4)} tokens=${result.inputTokens}/${result.outputTokens} duration=${result.durationMs}ms`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] concierge turn failed:', msg);
    await ctx.reply(`(concierge error — ${msg.slice(0, 200)})`);
  }
});

// Inline-keyboard callbacks for proactive nudge dismiss
bot.callbackQuery(/^nudge:(now|later|shelve)$/, async (ctx) => {
  const action = ctx.match[1];
  await ctx.answerCallbackQuery({ text: `Marked ${action}.` });
  // Phase 2 — track dismissal stats per category for auto-reduce
  console.log(`[zoe/index] nudge dismissed: ${action}`);
});

async function main(): Promise<void> {
  await ensureZoeHome();
  console.log('[zoe/index] ZOE booting — token set, zaalId=', zaalId, ' repoDir=', repoDir);

  // Resolve own username for filtering
  try {
    const me = await bot.api.getMe();
    usernameHolder.value = me.username;
    console.log('[zoe/index] bot identity:', `@${me.username} (${me.id})`);
  } catch (err) {
    console.error('[zoe/index] getMe failed:', (err as Error).message);
  }

  // Start scheduler for proactive nudges
  startScheduler({ bot, zaalTgId: zaalId, repoDir, devzChatId });

  // Optional: seed task queue on first boot
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

// Ensure we don't double-print warning on grammy Bot type unused in scope
void Context;
