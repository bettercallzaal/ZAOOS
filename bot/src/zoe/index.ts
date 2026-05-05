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

import { Bot, Context } from 'grammy';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { runConciergeTurn } from './concierge';
import { applyTaskOps, seedInitialTasks } from './tasks';
import { buildMemoryBlocks, ensureZoeHome, pushRecent, ZOE_PATHS } from './memory';
import { startScheduler } from './scheduler';
import { disableTips, enableTips, tipsEnabled } from './tips';
import { tryRouteAgent, listAgents } from './agents';
import { FACTS_PREFIX, appendFact, listFactsCount, readFacts } from './facts';

const NOTE_PREFIX = /^(note|cc|claude):\s*(.+)/is;
const CLAUDE_NOTES_FILE = join(ZOE_PATHS.home, 'claude-code-notes.md');

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

async function isAllowed(ctx: Context): Promise<boolean> {
  const fromId = ctx.from?.id;
  if (!fromId) return false;
  return fromId === zaalId;
}

// Nudge keyboard ([Now][Later][Shelve]) wired in scheduler.ts when sending proactive nudges.

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
  await ctx.reply(result.seeded > 0 ? `Seeded ${result.seeded} tasks from doc 601.` : 'Task queue already has entries - skipped seed.');
});

bot.command(['agents', 'help'], async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  await ctx.reply(`Agents available:\n\n${listAgents()}\n\nFree-form text routes to general concierge. Slash commands: /start /tasks /seed /notes /facts /agents.`);
});

bot.command('facts', async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  try {
    const raw = await readFacts();
    if (!raw) {
      await ctx.reply('No facts on file yet. Drop one with "remember: <fact>" or "fyi: <fact>" or "always <fact>". They load into every future ZOE call.');
      return;
    }
    const count = await listFactsCount();
    await ctx.reply(`${count} fact${count === 1 ? '' : 's'} on file:\n\n${raw.slice(-3500)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ctx.reply(`(facts read failed - ${msg.slice(0, 200)})`);
  }
});

bot.command('notes', async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  try {
    const raw = await fs.readFile(CLAUDE_NOTES_FILE, 'utf8');
    const blocks = raw.split(/^## /m).filter((b) => b.trim()).map((b) => '## ' + b.trim());
    if (blocks.length === 0) {
      await ctx.reply('No notes pending. Drop one with `note: <feedback>`.');
      return;
    }
    const recent = blocks.slice(-5).join('\n\n');
    await ctx.reply(`${blocks.length} note${blocks.length === 1 ? '' : 's'} pending (showing last 5):\n\n${recent.slice(0, 3500)}`);
  } catch {
    await ctx.reply('No notes pending. Drop one with `note: <feedback>`.');
  }
});

bot.on('message:text', async (ctx) => {
  if (!(await isAllowed(ctx))) return;
  const text = ctx.message.text;
  if (text.startsWith('/')) return;  // commands handled above

  // Skip messages NOT from Zaal's DM (groups handled separately if needed)
  if (ctx.chat.type !== 'private') return;

  // Hourly tip toggle: "stop tips" / "start tips" disables/enables the cron.
  const tipToggle = /^(stop|pause|disable)\s+tips?$/i.exec(text.trim()) ? 'off'
    : /^(start|resume|enable)\s+tips?$/i.exec(text.trim()) ? 'on'
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

  // Telegram-native reply detection: if Zaal hits "reply" on a ZOE message that
  // looks like a newsletter draft, treat his text as a newsletter edit. Saves
  // him from having to type "@newsletter edit" - just reply with context.
  // Detection: reply_to is from the bot itself AND text starts with the
  // Year of the ZABAL header. Other ZOE messages (briefs, tips) are ignored.
  const replyTo = ctx.message.reply_to_message;
  let resolvedText = text;
  if (replyTo && 'from' in replyTo && replyTo.from?.is_bot && 'text' in replyTo) {
    const repliedText = (replyTo as { text?: string }).text ?? '';
    const isNewsletter = /^Year of the ZABAL\b/m.test(repliedText);
    const alreadyAgentPrefixed = /^@\w+\s/.test(text) || /^\/\w+/.test(text);
    if (isNewsletter && !alreadyAgentPrefixed) {
      resolvedText = `@newsletter edit ${text}`;
      console.log(`[zoe/index] reply-to-newsletter detected, rerouting to: ${resolvedText.slice(0, 80)}`);
    }
  }

  // Agent route: @recall / @research / @newsletter / @zaostock etc.
  // Fast path - skip the LLM if a prefix matches a registered agent.
  // /agents and /help are handled as bot.command above (Telegram strips them
  // before this text handler ever sees them).
  const agentResult = await tryRouteAgent(resolvedText, {
    bot,
    zaalTgId: zaalId,
    repoDir,
    rawText: resolvedText,
  });
  if (agentResult) {
    const reply = agentResult.reply.trim() || `(${agentResult.agentName} agent returned empty)`;
    await ctx.reply(reply.slice(0, 4000));
    console.log(`[zoe/index] agent route - ${agentResult.agentName} - reply ${reply.length}b`);
    return;
  }

  // Facts capture - prefix `remember:` / `fact:` / `fyi:` / `actually` / `always` / `never` / `btw:`
  // Lands in ~/.zao/zoe/facts.md and gets loaded into EVERY future ZOE call as persistent context.
  // This is what powers "the more you tell me, the better I get" - facts persist across sessions.
  const factsMatch = FACTS_PREFIX.exec(text);
  if (factsMatch) {
    try {
      const count = await appendFact(factsMatch[2]);
      await ctx.reply(`Got it. ${count} fact${count === 1 ? '' : 's'} on file. Future replies and drafts will know.`);
      console.log(`[zoe/index] fact saved (#${count}): ${factsMatch[2].slice(0, 80)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[zoe/index] fact save failed:', msg);
      await ctx.reply(`(fact save failed - ${msg.slice(0, 200)})`);
    }
    return;
  }

  // Note: capture path - prefix `note:` / `cc:` / `claude:` lands in claude-code-notes.md
  // No concierge turn fires. Picked up next Claude Code session via "what feedback did I leave for you?"
  const noteMatch = NOTE_PREFIX.exec(text);
  if (noteMatch) {
    try {
      const count = await appendClaudeNote(noteMatch[2]);
      await ctx.reply(`Saved. ${count} note${count === 1 ? '' : 's'} pending for next Claude Code session.`);
      console.log(`[zoe/index] note saved (#${count}): ${noteMatch[2].slice(0, 80)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[zoe/index] note save failed:', msg);
      await ctx.reply(`(note save failed - ${msg.slice(0, 200)})`);
    }
    return;
  }

  await ctx.api.sendChatAction(ctx.chat.id, 'typing').catch(() => {});

  try {
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
