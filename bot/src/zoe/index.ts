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
import { startHeartbeat, reportEvent, startCommandPoller, markDone } from '../lib/cowork';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { runConciergeTurn } from './concierge';
import { applyTaskOps, seedInitialTasks } from './tasks';
import { applyQuestOps, buildQuestsBlock, formatQuestList } from './sidequests';
import { runBotRelayOps, summarizeRelayResults } from './relay';
import { runCrmOps, summarizeCrmResults } from './crm';
import { decomposeGoal, renderPlanForApproval } from './decompose';
import {
  buildMemoryBlocks,
  ensureZoeHome,
  pushRecent,
  readHuman,
  readPersona,
  writeHuman,
  writePersona,
  ZOE_PATHS,
  type ChatScope,
} from './memory';
import {
  runReflexion,
  applyPatch,
  type ReflectionAnswers,
  type ProposedPatch,
} from './reflexion';
import { applyLearnProposal, type LearnProposal } from './learn';
import { startScheduler } from './scheduler';
import { disableNudges, enableNudges, nudgesEnabled } from './nudges';
import { mirrorTurn, recall } from './recall';
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
import {
  handleVoiceMemo,
  handlePostCallback,
  countDrafts,
  dequeueDraft,
  sendDraftWithKeyboard,
  loadPending as loadPostsPending,
} from './posts';
import { dispatchPlan } from './dispatch';
import {
  getPending,
  setPending,
  clearPending,
  loadPending,
  parseApprovalReply,
  wouldClobber,
  pendingKindLabel,
  type PendingApproval,
  type ApprovalReply,
} from './approvals';
import type { DecompositionPlan } from './decompose';
import { NOTE_PREFIX, PLAN_PREFIX, isZoeCommand } from './commands';
import { applyThreadOps, summarizeThreadOps } from './thread-ops';
import { loadThreads, deleteThread, renderOpenThreadsBlock } from './threads';
import { ackPush } from './proactive';
import { touchLastSeen } from './events';
import {
  fetchPending,
  removeFromQueue,
  promoteSubmission,
  renderSubmission,
  queueConfigured,
} from './bonfire-queue';
import type { PendingBonfireSubmission } from './approvals';
import { attachCaster, runCasterPipeline } from './caster';
import { subscribeToCasts } from './farcaster/event-stream';

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

// Cowork control-plane (Phase 1 Observe): live detail surfaced to the board.
const COWORK_BOOT_TS = Date.now();
let coworkTask = 'booting';
let coworkLastError: string | null = null;
let coworkPaused = false;
bot.catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  coworkLastError = msg;
  console.error('[zoe/index] bot error:', msg);
  void reportEvent('error', msg, { unit: 'zoe-bot' });
});
// Phase 2 Control: a `pause` command drops incoming Telegram updates (control-
// plane ask/run_task still work - they call the brain directly, not via this
// middleware). `resume` clears it. Registered before handlers so it gates them.
bot.use(async (ctx, next) => {
  if (coworkPaused) return;
  await next();
});

function isFromZaal(ctx: Context): boolean {
  return ctx.from?.id === zaalId;
}

// ZOE anchors all reasoning to Eastern time (Zaal's tz). Shared by the
// concierge turn and the decompose path so the model never sees a UTC date.
function currentDateString(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
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

// Post slate v1 - voice memo capture. /voicememo <text> or /vm <text>.
// Appends to ~/.zao/zoe/voice-memos/YYYY-MM-DD.md for the personal-post drafter.
bot.command(['voicememo', 'vm'], async (ctx) => {
  await handleVoiceMemo(ctx, isFromZaal(ctx));
});

// doc 796 Decision 2 - /drafts pull. Surfaces the next silently-queued post
// draft into the existing POST/REGEN/SKIP review flow. One at a time: if a
// review is already in flight, ask Zaal to disposition it first.
bot.command('drafts', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const inFlight = await loadPostsPending();
  if (inFlight && inFlight.state === 'pending') {
    await ctx.reply('A draft is already up for review - tap POST/REGEN/SKIP on it first, then /drafts for the next.');
    return;
  }
  const remaining = await countDrafts();
  if (remaining === 0) {
    await ctx.reply('No drafts queued. I generate them silently through the day - check back, or I\'ll ping you once a day when some are ready.');
    return;
  }
  const next = await dequeueDraft();
  if (!next) {
    await ctx.reply('No drafts queued.');
    return;
  }
  await sendDraftWithKeyboard({
    bot: ctx.api,
    zaalTgId: zaalId,
    category: next.category,
    text: next.text,
    isResend: false,
  });
  const left = remaining - 1;
  if (left > 0) {
    await ctx.reply(`${left} more draft${left === 1 ? '' : 's'} queued. /drafts for the next.`);
  }
});

// Post slate v2 - callback handler for POST/REGEN/SKIP buttons under draft messages.
bot.callbackQuery(/^post-(approve|regen|skip):/, async (ctx) => {
  if (ctx.from?.id !== zaalId) {
    await ctx.answerCallbackQuery('not authorized');
    return;
  }
  await handlePostCallback({ ctx, repoDir, zaalTgId: zaalId });
});

// /bonfire — review the ZABAL Gamez community submission queue (doc 781 Phase 2).
// v1 steward gate = Zaal's DM (the only allowed DM); BONFIRE_STEWARD_FIDS is the
// forward-looking multi-steward list. Surfaces one pending item; reply y/n.
bot.command('bonfire', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  if (!queueConfigured()) {
    await ctx.reply(
      'Bonfire queue not configured — set ZG_UPSTASH_REST_URL + ZG_UPSTASH_REST_TOKEN.',
    );
    return;
  }
  await showNextSubmission(ctx);
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
  // Track activity for inactivity detection (best-effort: never blocks the handler).
  touchLastSeen().catch(() => {});
  // Pending-approval interception (doc 759 keystone). If ZOE is waiting on a
  // y/n for this chat, route the reply to the resolver. Ambiguous messages
  // (not-an-approval) fall through to normal handling and leave the pending
  // item in place — it auto-expires via TTL.
  //
  // Command-prefixed messages (plan:/note:/nudge) are exempt (H1): they always
  // reach their handler even while a pending is armed. The pending stays in
  // place, so a later free-form DM still resolves it.
  const pending = getPending('private');
  if (pending) {
    if (pending.kind === 'await-reflection') {
      // The next free-form DM is Zaal's reflection answer — UNLESS it's a
      // command (plan:/note:/nudge toggle). A command is not a reflection
      // answer, so let it fall through to normal handling and leave the
      // reflection pending armed (it auto-expires via TTL). Fixes doc 770 H1:
      // a `plan:` sent in the long reflection window was being swallowed and
      // never dispatched.
      if (!isZoeCommand(text)) {
        await clearPending('private');
        await handleReflectionAnswer(ctx, text);
        return;
      }
    } else {
      const reply = parseApprovalReply(text);
      if (reply.decision !== 'not-an-approval') {
        await resolvePendingApproval(ctx, pending, reply);
        return;
      }
      // reflexion with outstanding voice-note requests: a free-form (non-y/n)
      // reply is Zaal's clarification — re-run reflexion with it as the
      // transcript (typed clarification stands in for an audio voice note).
      if (pending.kind === 'reflexion' && pending.hasVoiceNoteRequests && text.trim().length > 10) {
        await clearPending('private');
        await runReflexionFlow(ctx, pending.answers, text);
        return;
      }
    }
  }

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

  // doc 796 — phantom-thread undo. "untrack th-... th-..." deletes mis-extracted
  // commitment threads so ZOE never nudges on something Zaal never committed to.
  const untrackMatch = /^untrack\s+(.+)$/i.exec(text.trim());
  if (untrackMatch) {
    const ids = untrackMatch[1].match(/th-[\w-]+/gi) ?? [];
    let removed = 0;
    for (const id of ids) {
      if (await deleteThread(id)) removed += 1;
    }
    await ctx.reply(
      removed > 0
        ? `Untracked ${removed} thread${removed === 1 ? '' : 's'}. I won't nudge on those.`
        : 'No matching threads to untrack.',
    );
    return;
  }

  // doc 796 — a reply after a proactive nudge acks the latest push, so the
  // unacked self-throttle stays honest (an answered ping isn't "ignored").
  // Best-effort; the concierge still handles the content (e.g. "done with X"
  // emits a resolve thread_op).
  await ackPush().catch(() => {});

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

  // Goal decomposition + dispatch: opt-in `plan:`/`decompose:` prefix.
  const planMatch = PLAN_PREFIX.exec(text);
  if (planMatch) {
    await handlePlanCommand(ctx, planMatch[2]);
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
    // doc 796 Move 2: surface live commitment threads so the concierge can
    // resolve/snooze/drop them by id (DMs with Zaal only).
    if (scope === 'private') blocks.open_threads = renderOpenThreadsBlock();

    // Pull relevant prior context from the ZABAL knowledge graph (Bonfire) via
    // recall()/delve and inject it into the turn. DMs only + substantive
    // messages (skip "y"/"ok"/short acks). Best-effort: no-op if Bonfire
    // unconfigured or delve returns nothing; never blocks the turn.
    let recallContext: string | undefined;
    if (scope === 'private' && text.trim().length >= 12) {
      try {
        const r = await recall({
          query: text,
          reason: 'concierge turn context',
          expected_kind: 'mixed',
        });
        if (r.kind === 'sdk_response' && r.text) recallContext = r.text;
      } catch (err) {
        console.warn('[zoe/index] recall failed (nbd):', (err as Error).message);
      }
    }

    const result = await runConciergeTurn({
      message: text,
      blocks,
      senderLabel: label,
      recallContext,
      context: {
        zaal_tg_id: zaalId,
        workspace_dir: repoDir,
        current_date: currentDateString(),
      },
    });

    if (result.task_ops.length > 0) {
      await applyTaskOps(result.task_ops);
    }

    if (result.quest_ops.length > 0) {
      await applyQuestOps(result.quest_ops);
    }

    // Cross-bot relay (Phase 2 Bonfire integration). ZOE can ask other bots
    // in Telegram groups (e.g. @zabal_bonfire_bot in ZAO Civilization) by
    // emitting bot_relay_ops in her JSON reply. v1 is fire-and-forget;
    // result summary appends to her DM reply so Zaal sees what was sent.
    let relayPostscript = '';
    if (result.bot_relay_ops && result.bot_relay_ops.length > 0) {
      try {
        const relayResults = await runBotRelayOps(
          (chatId, text) => bot.api.sendMessage(chatId, text),
          result.bot_relay_ops,
        );
        const summary = summarizeRelayResults(relayResults);
        if (summary) relayPostscript = '\n\n' + summary;
      } catch (err) {
        console.error('[zoe/index] bot relay failed:', (err as Error).message);
        relayPostscript = '\n\n(bot relay failed - check logs)';
      }
    }

    // CRM write path (doc 772). ZOE can upsert a contact + log an interaction
    // by emitting crm_ops in her JSON reply; this POSTs to the app's
    // /api/crm/interactions with the CRM_BOT_SECRET bearer. Fire-and-forget;
    // a one-line summary appends to her DM reply.
    let crmPostscript = '';
    if (result.crm_ops && result.crm_ops.length > 0) {
      try {
        const crmResults = await runCrmOps(result.crm_ops);
        const summary = summarizeCrmResults(crmResults);
        if (summary) crmPostscript = '\n\n' + summary;
      } catch (err) {
        console.error('[zoe/index] crm write failed:', (err as Error).message);
        crmPostscript = '\n\n(CRM write failed - check logs)';
      }
    }

    // Open-threads (doc 796 Move 2). ZOE opens/advances commitments Zaal makes
    // ("I'll ship X today") so a later reasoning tick can surface them at the
    // right time. Opening a thread also emits to Bonfire (cross-agent memory).
    let threadPostscript = '';
    if (result.thread_ops && result.thread_ops.length > 0) {
      try {
        const summary = await applyThreadOps(result.thread_ops);
        const line = summarizeThreadOps(summary);
        if (line) threadPostscript = '\n\n' + line;
      } catch (err) {
        console.error('[zoe/index] thread ops failed:', (err as Error).message);
      }
    }

    // Bonfire: mirror this turn's captures + task/quest changes into the
    // ZABAL knowledge graph. Best-effort, fire-and-forget — never blocks the
    // reply, never throws. No-op if BONFIRE_API_KEY/BONFIRE_ID are unset.
    mirrorTurn({
      captures: result.captures,
      task_ops: result.task_ops as unknown as Array<Record<string, unknown>>,
      quest_ops: result.quest_ops as unknown as Array<Record<string, unknown>>,
    })
      .then((m) => {
        if (m.mirrored > 0) {
          console.log(`[zoe/index] bonfire mirror — ${m.mirrored} episode(s), ${m.skipped} skipped`);
        }
      })
      .catch((e) => console.error('[zoe/index] bonfire mirror failed:', e));

    await pushRecent({ from: 'zoe', text: result.reply }, scope);

    const safeReply = result.reply.trim() + relayPostscript + crmPostscript + threadPostscript;
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

function zoeContext() {
  return {
    zaal_tg_id: zaalId,
    workspace_dir: repoDir,
    current_date: currentDateString(),
  };
}

/**
 * `plan:`/`decompose:` handler — decompose the goal, store it as a pending
 * approval, and render it for y/n. On "y" the resolver dispatches the workers.
 * If the plan has unresolved ambiguities, nothing is stored (there's nothing
 * to dispatch yet) and ZOE just asks for clarification.
 */
async function handlePlanCommand(ctx: Context, goal: string): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;
  // Refuse-when-busy (doc 770 H2): don't decompose (or clobber) a plan while a
  // different approval is already waiting on Zaal's y/n. Checked before the
  // decompose spend.
  const busy = getPending('private');
  if (wouldClobber(busy, 'plan')) {
    await ctx.reply(
      `You've got a pending ${pendingKindLabel(busy!.kind)} waiting on your y/n. Reply to it (or say "cancel") first, then re-send your plan.`,
    );
    return;
  }
  await ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  const typingInterval = setInterval(() => {
    ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  }, TYPING_REFRESH_MS);
  const ackTimeout = setTimeout(() => {
    ctx.reply('Decomposing into a routed plan — one moment.').catch(() => {});
  }, ACK_THRESHOLD_MS);

  // H2 (doc 770): note if a new plan replaces an unresolved approval, so a
  // live plan-gate / reflexion / learn pending is never silently clobbered.
  const prior = getPending('private');

  try {
    const result = await decomposeGoal({ goal, context: zoeContext() });
    const { plan } = result;
    const dispatchable = plan.ambiguities.length === 0 && plan.subtasks.length > 0;
    let priorNote = '';
    if (dispatchable) {
      if (prior && (prior.kind === 'plan-gate' || prior.kind === 'reflexion' || prior.kind === 'learn')) {
        priorNote = `\n\n(Heads up: this replaced a pending ${prior.kind} you hadn't resolved.)`;
      }
      await setPending({
        kind: 'plan',
        chatScope: 'private',
        createdAt: new Date().toISOString(),
        goal,
        plan,
      });
    }
    await replyChunked(ctx, renderPlanForApproval(plan) + priorNote);
    console.log(
      `[zoe/index] plan proposed — subtasks=${plan.subtasks.length} ambiguities=${plan.ambiguities.length} dispatchable=${dispatchable} cost=$${result.costUsd.toFixed(4)}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] decompose failed:', msg);
    await ctx.reply(`(decompose error - ${msg.slice(0, 200)})`);
  } finally {
    clearInterval(typingInterval);
    clearTimeout(ackTimeout);
  }
}

/**
 * Route a parsed y/n/edit reply against whatever ZOE is waiting to approve.
 * Wraps the resolver in a try/catch (doc 770 H5): the inner path clears the
 * pending item before dispatching, so a throw from ctx.reply / setPending /
 * dispatch would otherwise propagate to grammY and the user would see nothing
 * with the plan already lost. On error we always reply so Zaal can re-send.
 */
async function resolvePendingApproval(
  ctx: Context,
  pending: PendingApproval,
  reply: ApprovalReply,
): Promise<void> {
  try {
    await doResolvePendingApproval(ctx, pending, reply);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] approval resolution failed:', msg);
    await ctx
      .reply(`(couldn't complete that — ${msg.slice(0, 200)}. Nothing is pending now; re-send when ready.)`)
      .catch(() => {});
  }
}

async function doResolvePendingApproval(
  ctx: Context,
  pending: PendingApproval,
  reply: ApprovalReply,
): Promise<void> {
  // Bonfire submissions have their own promote/reject/LREM lifecycle (doc 781
  // Phase 2) — route the whole decision there before the generic plan handling.
  if (pending.kind === 'bonfire-submission') {
    await resolveBonfireSubmission(ctx, pending, reply);
    return;
  }

  if (reply.decision === 'reject') {
    await clearPending(pending.chatScope);
    await ctx.reply('Cancelled. Nothing dispatched.');
    return;
  }

  if (reply.decision === 'edit') {
    await clearPending(pending.chatScope);
    if (pending.kind === 'plan' || pending.kind === 'plan-gate') {
      await ctx.reply('Re-planning with your changes…');
      await handlePlanCommand(ctx, `${pending.goal}\n\nRevision from Zaal: ${reply.editText ?? ''}`);
    } else {
      await ctx.reply('Okay, dropped that. Send a fresh request when ready.');
    }
    return;
  }

  // approve-all / approve-ids
  switch (pending.kind) {
    case 'plan':
      await clearPending(pending.chatScope);
      await runApprovedPlan(ctx, pending.goal, pending.plan, []);
      return;
    case 'plan-gate':
      await clearPending(pending.chatScope);
      await runApprovedPlan(ctx, pending.goal, pending.plan, pending.completed);
      return;
    case 'reflexion':
      await clearPending(pending.chatScope);
      await applyReflexionPatches(ctx, pending.patches, reply);
      return;
    case 'learn':
      await clearPending(pending.chatScope);
      await applyLearnProposals(ctx, pending.proposals, reply);
      return;
    case 'await-reflection':
      // Shouldn't reach here (handled in the interception), but be safe.
      await clearPending(pending.chatScope);
      return;
  }
}

// --- ZABAL Bonfire submission queue (doc 781 Phase 2) ----------------------

/** Fetch the queue and arm the oldest pending submission for y/n review. */
async function showNextSubmission(ctx: Context): Promise<void> {
  let pending;
  try {
    pending = await fetchPending();
  } catch (err) {
    await ctx.reply(`(bonfire queue read failed — ${(err as Error).message.slice(0, 160)})`);
    return;
  }
  if (pending.length === 0) {
    await ctx.reply('ZABAL Bonfire queue is empty — nothing to review.');
    return;
  }
  // LPUSH puts newest at the head, so the last element is the oldest (FIFO).
  const entry = pending[pending.length - 1];
  const armed = await setPending({
    kind: 'bonfire-submission',
    chatScope: 'private',
    createdAt: new Date().toISOString(),
    entry,
  });
  if (!armed.armed) {
    await ctx.reply(
      `Can't review yet — you have a pending ${pendingKindLabel(armed.blockedBy!.kind)}. Resolve that first, then /bonfire.`,
    );
    return;
  }
  await replyChunked(ctx, renderSubmission(entry, pending.length));
}

/** Promote / reject one reviewed submission, then advance to the next. */
async function resolveBonfireSubmission(
  ctx: Context,
  pending: PendingBonfireSubmission,
  reply: ApprovalReply,
): Promise<void> {
  await clearPending(pending.chatScope);
  const { item, raw } = pending.entry;
  const who = item.username ? `@${item.username}` : `fid ${item.fid}`;

  if (reply.decision === 'edit') {
    // No meaningful "edit" for a submission — leave it queued, re-arm for y/n.
    await setPending({
      kind: 'bonfire-submission',
      chatScope: 'private',
      createdAt: new Date().toISOString(),
      entry: pending.entry,
    });
    await ctx.reply('Left in the queue (submissions are promote/reject only — reply y or n).');
    return;
  }

  if (reply.decision === 'reject') {
    await removeFromQueue(raw).catch(() => 0);
    console.log(`[zoe/bonfire] rejected ${item.id} from ${who}`);
    await ctx.reply(`Rejected ${item.type} from ${who} — removed from the queue.`);
    await showNextSubmission(ctx);
    return;
  }

  // approve-all / approve-ids -> promote into the canonical graph.
  const result = await promoteSubmission(item);
  if (!result.ok) {
    const why = result.skipped ?? result.error ?? 'unknown';
    await ctx.reply(`Could not promote ${item.type} from ${who} (${why}). Left in the queue.`);
    return;
  }
  await removeFromQueue(raw).catch(() => 0);
  console.log(`[zoe/bonfire] promoted ${item.id} from ${who} to the graph`);
  await ctx.reply(`✅ Promoted ${item.type} from ${who} to the ZABAL Bonfire graph.`);
  await showNextSubmission(ctx);
}

/** Dispatch an approved plan with live Telegram progress, then report. */
async function runApprovedPlan(
  ctx: Context,
  goal: string,
  plan: DecompositionPlan,
  alreadyCompleted: string[],
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;
  // H5 (doc 770): the whole dispatch + gate-stash + reply path is wrapped so a
  // throw (ctx.reply, setPending disk write, etc.) can never silently drop the
  // plan. dispatchPlan never throws by contract; this guards the rest.
  try {
    await ctx.reply(alreadyCompleted.length > 0 ? 'Continuing past the gate…' : 'Dispatching the plan…');

    const report = await dispatchPlan({
      goal,
      plan,
      context: zoeContext(),
      chatId,
      zaalTgId: zaalId,
      alreadyCompleted,
      hooks: {
        onSubtaskStart: async (st) => {
          await ctx.reply(`▶ ${st.id} (${st.worker}): ${st.title}`.slice(0, 300)).catch(() => {});
        },
      },
    });

    // Paused at a gate — stash the partial plan so the next "y" resumes it.
    if (report.status === 'paused-for-gate' && report.gateAfterId) {
      await setPending({
        kind: 'plan-gate',
        chatScope: 'private',
        createdAt: new Date().toISOString(),
        goal,
        plan,
        completed: report.completedIds,
        gateAfterId: report.gateAfterId,
      });
    }

    await replyChunked(ctx, report.summary);
    console.log(
      `[zoe/index] dispatch ${report.status} — ${report.results.length} subtask(s) $${report.totalCostUsd.toFixed(2)}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] runApprovedPlan failed:', msg);
    await ctx.reply(`(dispatch error - ${msg.slice(0, 200)})`).catch(() => {});
  }
}

// --- Reflexion / Gap 4: learn-from-reflection -> memory patches ------------

/**
 * Loosely parse a free-form evening-reflection reply into the 3 answer slots.
 * If the reply has numbered parts (1. / 2) / 3:) map them; otherwise dump the
 * whole thing into `extra` and let the reflexion prompt sort it out.
 */
function parseReflectionAnswers(text: string): ReflectionAnswers {
  const parts = text
    .split(/\n?\s*[1-3][.):]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return {
      shipped: parts[0],
      stuck: parts[1],
      tomorrow_first: parts[2],
      extra: parts.slice(3).join('\n') || undefined,
    };
  }
  return { shipped: '', stuck: '', tomorrow_first: '', extra: text };
}

/** Entry from the await-reflection interception: parse + run reflexion. */
async function handleReflectionAnswer(ctx: Context, rawText: string): Promise<void> {
  await runReflexionFlow(ctx, parseReflectionAnswers(rawText));
}

/**
 * Run the reflexion layer over reflection answers (optionally clarified by a
 * voice note), then offer high-confidence memory patches for y/n approval.
 */
async function runReflexionFlow(
  ctx: Context,
  answers: ReflectionAnswers,
  voiceNoteTranscript?: string,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;
  await ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  try {
    const [human_md, persona_md] = await Promise.all([readHuman(), readPersona()]);
    const result = await runReflexion({
      answers,
      human_md,
      persona_md,
      context: zoeContext(),
      voiceNoteTranscript,
    });
    const { plan } = result;

    if (plan.patches.length === 0) {
      await ctx.reply('Reflection logged. No memory updates needed tonight.');
      return;
    }

    // Stash high-confidence patches for y/n; low-confidence ones get a
    // voice-note request and are resolved on Zaal's next free-form reply.
    if (plan.highConfidence.length > 0 || plan.needsVoiceNote.length > 0) {
      const armed = await setPending({
        kind: 'reflexion',
        chatScope: 'private',
        createdAt: new Date().toISOString(),
        patches: plan.highConfidence,
        answers,
        hasVoiceNoteRequests: plan.needsVoiceNote.length > 0,
      });
      if (!armed.armed) {
        // doc 770 H2: a live approval is already waiting — don't clobber it.
        await ctx.reply(
          `Reflection logged, but I couldn't queue the memory updates — you have a pending ${pendingKindLabel(
            armed.blockedBy!.kind,
          )} first. Resolve it and re-run reflect.`,
        );
        return;
      }
    }

    if (plan.highConfidence.length > 0) {
      await replyChunked(ctx, plan.approval_message);
    }
    if (plan.voice_note_request) {
      await replyChunked(ctx, plan.voice_note_request);
    }
    console.log(
      `[zoe/index] reflexion — ${plan.highConfidence.length} hi-conf, ${plan.needsVoiceNote.length} need-voice, cost=$${result.costUsd.toFixed(4)}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] reflexion failed:', msg);
    await ctx.reply(`(reflexion error - ${msg.slice(0, 200)})`);
  }
}

/** Apply the Zaal-approved subset of reflexion patches to the memory files. */
async function applyReflexionPatches(
  ctx: Context,
  patches: ProposedPatch[],
  reply: ApprovalReply,
): Promise<void> {
  const selected =
    reply.decision === 'approve-all'
      ? patches
      : patches.filter((p) => reply.ids.includes(p.id.toLowerCase()));

  if (selected.length === 0) {
    await ctx.reply('No matching patch ids — nothing applied. Reply "y all" or "y patch-1".');
    return;
  }

  // Apply per target file: read once, fold all selected patches in, write once.
  const byTarget = new Map<ProposedPatch['target'], ProposedPatch[]>();
  for (const p of selected) {
    byTarget.set(p.target, [...(byTarget.get(p.target) ?? []), p]);
  }

  const applied: string[] = [];
  try {
    for (const [target, group] of byTarget) {
      let content = target === 'human.md' ? await readHuman() : await readPersona();
      for (const patch of group) {
        content = applyPatch(content, patch);
        applied.push(`${patch.id} -> ${target}`);
      }
      if (target === 'human.md') await writeHuman(content);
      else await writePersona(content);
    }
    await ctx.reply(`Applied ${applied.length} patch${applied.length === 1 ? '' : 'es'}:\n${applied.join('\n')}`);
    console.log(`[zoe/index] reflexion patches applied: ${applied.join(', ')}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] applyReflexionPatches failed:', msg);
    await ctx.reply(`(patch apply failed - ${msg.slice(0, 200)})`);
  }
}

/** Apply the Zaal-approved subset of weekly learn proposals (Gap 5). */
async function applyLearnProposals(
  ctx: Context,
  proposals: LearnProposal[],
  reply: ApprovalReply,
): Promise<void> {
  const selected =
    reply.decision === 'approve-all'
      ? proposals
      : proposals.filter((p) => reply.ids.includes(p.id.toLowerCase()));
  if (selected.length === 0) {
    await ctx.reply('No matching proposal ids — nothing applied. Reply "y all" or "y lp-1".');
    return;
  }
  const applied: string[] = [];
  for (const p of selected) {
    try {
      await applyLearnProposal(p);
      applied.push(`${p.id} -> ${p.target}`);
    } catch (err) {
      console.error('[zoe/index] applyLearnProposal failed:', (err as Error).message);
    }
  }
  await ctx.reply(
    applied.length > 0
      ? `Applied ${applied.length} learning${applied.length === 1 ? '' : 's'}:\n${applied.join('\n')}`
      : '(learning apply failed - check logs)',
  );
  console.log(`[zoe/index] learnings applied: ${applied.join(', ')}`);
}

bot.callbackQuery(/^nudge:(now|later|shelve)$/, async (ctx) => {
  const action = ctx.match[1];
  await ctx.answerCallbackQuery({ text: `Marked ${action}.` });
  console.log(`[zoe/index] nudge dismissed: ${action}`);
});

async function main(): Promise<void> {
  await ensureZoeHome();
  await loadPending(); // restore any approval ZOE was waiting on before restart
  await loadThreads(); // restore open commitment threads (doc 796 Move 2)
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

  // Caster (doc 761, Phase 2). Approval callback always attached; the event-stream subscriber
  // only starts when a node gRPC is configured. Single-agent persona via CASTER_PERSONA.
  attachCaster(bot, { zaalId });
  if (process.env.FARCASTER_NODE_GRPC && process.env.CASTER_ENABLED === '1') {
    const persona =
      process.env.CASTER_PERSONA ??
      'You are the ZAO community caster. Reply in a warm, sharp, builder voice. Never shill, never overpromise.';
    try {
      await subscribeToCasts((cast) => {
        // Fire-and-forget per cast (the pipeline self-gates + returns a verdict
        // we don't consume here). Wrapped so the callback returns void — unbreaks
        // the bot typecheck after #729. See doc 770/773.
        void runCasterPipeline(bot, zaalId, {
          agentId: 'caster',
          persona,
          context: `Someone cast (fid ${cast.fid}): "${cast.text}". Draft a reply.`,
          parent: { fid: cast.fid, hash: cast.hash },
        });
      });
      console.log('[zoe/index] caster event stream subscribed');
    } catch (err) {
      console.warn('[zoe/index] caster event stream not started:', (err as Error).message);
    }
  }

  try {
    const seed = await seedInitialTasks();
    if (seed.seeded > 0) {
      console.log(`[zoe/index] seeded ${seed.seeded} initial tasks from doc 601`);
    }
  } catch (err) {
    console.warn('[zoe/index] task seed failed (nbd):', (err as Error).message);
  }

  // Heartbeat to the coworking status board (dormant unless COWORK_API_URL/TOKEN set).
  // metaFn enriches each heartbeat with live detail for the board's per-bot panel.
  startHeartbeat(60_000, () => 'up', { unit: 'zoe-bot' }, () => ({
    current_task: coworkTask,
    last_error: coworkLastError,
    uptime_s: Math.round((Date.now() - COWORK_BOOT_TS) / 1000),
  }));

  // Phases 2-4 Control/Task/Converse: pull + execute commands from the board.
  // ZOE has a brain, so it serves run_task (assign a cowork todo) and ask
  // (answer a question) via the concierge; lifecycle is handled generically.
  startCommandPoller({
    onPause: () => {
      coworkPaused = true;
      coworkTask = 'paused';
      void reportEvent('paused', 'paused via control plane', { unit: 'zoe-bot' });
    },
    onResume: () => {
      coworkPaused = false;
      coworkTask = 'idle (polling)';
      void reportEvent('resumed', 'resumed via control plane', { unit: 'zoe-bot' });
    },
    onAsk: async (args) => {
      const prompt = typeof args.prompt === 'string' ? args.prompt : '';
      if (!prompt) return { error: 'no prompt' };
      coworkTask = 'answering (ask)';
      void reportEvent('ask', prompt.slice(0, 200), { unit: 'zoe-bot' });
      const blocks = await buildMemoryBlocks('private');
      const result = await runConciergeTurn({
        message: prompt,
        blocks,
        senderLabel: 'Board',
        context: { zaal_tg_id: zaalId, workspace_dir: repoDir, current_date: currentDateString() },
      });
      coworkTask = 'idle (polling)';
      return { reply: result.reply };
    },
    onRunTask: async (args) => {
      const instructions = typeof args.instructions === 'string' ? args.instructions : '';
      const todoId = args.todo_id != null && args.todo_id !== '' ? String(args.todo_id) : '';
      coworkTask = `run_task ${todoId}`.trim();
      void reportEvent('run_task', instructions.slice(0, 200), { unit: 'zoe-bot', todo_id: todoId });
      const blocks = await buildMemoryBlocks('private');
      const result = await runConciergeTurn({
        message:
          `You are executing an assigned task${todoId ? ` (cowork todo #${todoId})` : ''}. ` +
          `Instructions: ${instructions || '(none provided)'}\n\n` +
          `Do what you can from here and summarize the outcome concisely.`,
        blocks,
        senderLabel: 'Board',
        context: { zaal_tg_id: zaalId, workspace_dir: repoDir, current_date: currentDateString() },
      });
      if (result.task_ops.length > 0) await applyTaskOps(result.task_ops);
      let todoMarked = false;
      if (todoId) {
        const r = await markDone(todoId, 'completed by ZOE via control plane');
        todoMarked = r.ok;
      }
      coworkTask = 'idle (polling)';
      return { reply: result.reply, todo_marked: todoMarked };
    },
  });

  await bot.start({
    onStart: (info) => {
      console.log(`[zoe/index] polling as @${info.username}`);
      coworkTask = 'idle (polling)';
      void reportEvent('startup', `online as @${info.username}`, { unit: 'zoe-bot' });
    },
  });
}

void main();
