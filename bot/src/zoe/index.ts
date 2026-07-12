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
import { startHeartbeat, reportEvent, startCommandPoller, markDone, updateItem, type TaskStatus } from '../lib/cowork';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { runConciergeTurn } from './concierge';
import { checkAndRecordZoeCall } from './call-budget';
import { runCockpit } from '../cockpit/cockpit';
import { applyTaskOps, seedInitialTasks } from './tasks';
import { applyQuestOps, buildQuestsBlock, formatQuestList } from './sidequests';
import { runBotRelayOps, summarizeRelayResults } from './relay';
import { runCrmOps, summarizeCrmResults } from './crm';
import { getOpenTeamTasks, formatTeamTasks, teamTrackerConfigured, addTeamTask } from './team-tracker';
import { decomposeGoal, renderPlanForApproval, shouldDecompose } from './decompose';
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
import { fanOutKnowledgeExtractors, EXTRACT_MIN_LEN } from './extractors';
import { transcriptionConfigured, transcribeTelegramFile, downloadTelegramFile } from './transcribe';
import { captureResume, looksLikeResume } from './resume';
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
  loadDrafts as loadPostDrafts,
  clearDrafts,
  pickBestDraft,
  sendDraftWithKeyboard,
  loadPending as loadPostsPending,
} from './posts';
import { dispatchPlan } from './dispatch';
import { commitResearchDoc } from './research-doc';
import { enqueueTurn } from './turn-queue';
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
import { NOTE_PREFIX, PLAN_PREFIX, QUEUE_PREFIX, isZoeCommand } from './commands';
import { enqueueWork, queueDepth, runWorkTick } from './work-loop';
import { STANDARD_TOPICS, readTopics, writeTopics } from './topics';
import { routeTopic, topicNameForThread } from './topic-router';
import { appendApproved } from './outbox';
import { dispatchHermesRun } from '../hermes/runner';
import { putDraft, getDraft, removeDraft, draftKeyboard, parseDraftCallback } from './drafts';
import { parseQuestionCallback } from './questions';
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


// --- Auth error tracking (doc TBD) ---
// Track last auth alert time so we don't spam Zaal with repeated alerts.
// Fires at most once every 30 min.
let lastAuthAlertTime = 0;
const AUTH_ALERT_DEBOUNCE_MS = 30 * 60 * 1000; // 30 min

async function alertAuthFailure(bot: Bot, zaalId: number, message: string): Promise<void> {
  const now = Date.now();
  if (now - lastAuthAlertTime < AUTH_ALERT_DEBOUNCE_MS) {
    console.log('[zoe/index] auth alert debounced (recently sent)');
    return;
  }
  lastAuthAlertTime = now;
  const fullMessage = `ZOE Research Engine - Auth Failure

${message}

Action: ssh VPS then run 'claude' and /login.`;
  await bot.api.sendMessage(zaalId, fullMessage).catch((err: unknown) => {
    console.error('[zoe/index] failed to send auth alert:', err);
  });
}

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

/**
 * Detect when a message wants link analysis/research.
 * Returns true if: URL present AND research intent keywords.
 *
 * Intent keywords: research, analyze, analysis, look into, dig into,
 * thoughts, what do you think, take on, break down, summarize, what's our,
 * whats our, vet, due diligence.
 *
 * When true, the message should route to research-worker dispatch (not recall).
 */
function wantsLinkResearch(text: string): boolean {
  const hasUrl = /https?:\/\/\S+/i.test(text);
  if (!hasUrl) return false;

  const intentKeywords = [
    'research',
    'analyze',
    'analysis',
    'look into',
    'dig into',
    'thoughts',
    'what do you think',
    'what do you reckon',
    'take on',
    'break down',
    'summarize',
    "what's our",
    'whats our',
    'vet',
    'due diligence',
  ];

  const lowerText = text.toLowerCase();
  return intentKeywords.some((keyword) => lowerText.includes(keyword));
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

/** The ZAAL BOTZ Research topic as a work-loop reply target (env config), or
 * undefined if not configured - then research falls back to Zaal's DM. */
function researchTopicTarget(): { chatId: number; threadId: number } | undefined {
  const g = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
  const t = Number(process.env.ZAAL_BOTZ_RESEARCH_THREAD ?? 0);
  return g && t ? { chatId: g, threadId: t } : undefined;
}

bot.command('start', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  await ctx.reply(
    'ZOE online. Hermes runtime, Sonnet/Opus brain via Max plan. Memory blocks loaded (persona/human/working/tasks). Send anything.',
  );
});

// /chatid - report this chat's id + (in a forum topic) its topic thread id, so
// Zaal can wire a group + topics without a third-party id bot. Works in DMs,
// groups, and topics; commands reach the bot even in privacy mode.
bot.command('chatid', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const chatId = ctx.chat.id;
  const title = 'title' in ctx.chat ? ctx.chat.title : '(dm)';
  const threadId = ctx.message?.message_thread_id;
  const line = threadId
    ? `chat: ${chatId} ("${title}")\ntopic thread id: ${threadId}`
    : `chat: ${chatId} ("${title}")`;
  console.log(`[zoe/chatid] ${line.replace(/\n/g, ' | ')}`);
  await ctx.reply(line, threadId ? { message_thread_id: threadId } : {});
});

// /inittopics - ZOE creates the standard ZAAL BOTZ topics itself (it is a group
// admin) and stores each name -> thread id in topics.json. Run it inside the
// group. Skips topics already known (e.g. Research), so it is safe to re-run.
bot.command('inittopics', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const chatId = ctx.chat.id;
  const groupId = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
  if (!groupId || chatId !== groupId) {
    await ctx.reply('Run /inittopics inside the ZAAL BOTZ group.');
    return;
  }
  const topics = await readTopics();
  // Seed Research from env so ZOE does not create a duplicate of the manual one.
  const researchThread = Number(process.env.ZAAL_BOTZ_RESEARCH_THREAD ?? 0);
  if (researchThread && !topics.Research) topics.Research = researchThread;

  const results: string[] = [];
  for (const name of STANDARD_TOPICS) {
    if (topics[name]) {
      results.push(`${name}: ${topics[name]} (exists)`);
      continue;
    }
    try {
      const t = await ctx.api.createForumTopic(chatId, name);
      topics[name] = t.message_thread_id;
      results.push(`${name}: ${t.message_thread_id} (created)`);
    } catch (e) {
      results.push(
        `${name}: FAILED - ${e instanceof Error ? e.message : 'error'} (does ZOE have the Manage Topics admin right?)`,
      );
    }
  }
  await writeTopics(topics);
  console.log(`[zoe/inittopics] ${JSON.stringify(topics)}`);
  await ctx.reply('Topics:\n' + results.join('\n'));
});

// /draftdemo - send a sample draft with the [Post] [Skip] [Edit] buttons so
// Zaal can tap-test the approve flow. Real drafts (ZOL casts etc.) reuse the
// same putDraft + draftKeyboard + callback handler below.
bot.command('draftdemo', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const id = 'demo-' + Date.now().toString(36);
  const body = 'Demo draft. Tap Post to confirm, Skip to drop, Edit to revise.';
  putDraft('demo', body, id);
  await ctx.reply(`DRAFT (demo):\n${body}`, {
    reply_markup: draftKeyboard(id),
    ...(ctx.message?.message_thread_id ? { message_thread_id: ctx.message.message_thread_id } : {}),
  });
});

// /zoldraft <text> - stage a ZOL/Farcaster cast in the ZOL topic with the
// approve-buttons. This is the ZOE-side receiver: Zaal can use it directly, and
// the ZOL agent on the Pi can relay drafts to it later. NOTE: [Post] currently
// marks the draft posted - wiring it to actually cast (ZOL identity on the Pi,
// or ZOE's caster) is a follow-up that needs Zaal's call on the posting identity.
bot.command('zoldraft', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const text = (ctx.match ?? '').toString().trim();
  if (!text) {
    await ctx.reply('Usage: /zoldraft <cast text>');
    return;
  }
  const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
  const zolThread = Number(process.env.ZOL_THREAD ?? 0);
  if (!gid || !zolThread) {
    await ctx.reply('ZOL topic not configured (need ZAAL_BOTZ_GROUP_ID + ZOL_THREAD).');
    return;
  }
  const id = 'zol-' + Date.now().toString(36);
  putDraft('zol-cast', text, id);
  await bot.api.sendMessage(gid, `ZOL draft:\n${text}`, {
    message_thread_id: zolThread,
    reply_markup: draftKeyboard(id),
  });
  await ctx.reply('Staged in the ZOL topic with Post/Skip/Edit.');
});

// Approve-button taps. Callback data is "<action>:<id>" (see drafts.ts). Post
// marks the draft posted (real per-kind routing is a follow-up), Skip drops it,
// Edit prompts for a revision. Always answerCallbackQuery so the button spinner
// clears.
// When Zaal taps a question's "Type my own" button, we remember the qid keyed by
// chat id; his NEXT free-text message in that chat is then logged as the answer
// ("[answer:<qid>]"), so a typed answer reaches the orchestrator the same way a
// tapped one does (Fable audit fix - without this, typed answers were untagged).
const pendingTypeAnswers = new Map<number, string>();

bot.on('callback_query:data', async (ctx) => {
  if (!isFromZaal(ctx)) {
    await ctx.answerCallbackQuery();
    return;
  }
  // Orchestrator question buttons ("q:<qid>:<b64>") - the one-question-at-a-time
  // loop. A tap (or the Type button) logs the answer to recent/ so the open
  // Claude Code session reads it via the bridge and posts the next question.
  const q = parseQuestionCallback(ctx.callbackQuery.data);
  if (q) {
    const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
    if (q.isType) {
      const cbChat = ctx.callbackQuery.message?.chat?.id;
      if (cbChat) pendingTypeAnswers.set(cbChat, q.qid);
      await ctx.answerCallbackQuery({ text: 'Reply with your answer.' });
      // Clear the buttons (like Post/Skip) so the question can't be re-tapped,
      // and show it's awaiting a typed reply.
      await ctx
        .editMessageText(`Answering (${q.qid}) - reply with your text.`, {
          reply_markup: { inline_keyboard: [] },
        })
        .catch(() => {});
      await ctx
        .reply(`Reply to this thread with your answer for "${q.qid}".`, {
          ...(ctx.callbackQuery.message?.message_thread_id
            ? { message_thread_id: ctx.callbackQuery.message.message_thread_id }
            : {}),
        })
        .catch(() => {});
    } else {
      await ctx.answerCallbackQuery({ text: 'Got it.' });
      await ctx
        .editMessageText(`Answered (${q.qid}): ${q.value}`, { reply_markup: { inline_keyboard: [] } })
        .catch(() => {});
      await pushRecent(
        { from: 'zaal', text: `[answer:${q.qid}] ${q.value}`, sender: 'zaalbotz-btn' },
        String(gid),
      ).catch((e) => console.error('[zoe/index] q-answer log failed:', (e as Error)?.message));
    }
    return;
  }

  const parsed = parseDraftCallback(ctx.callbackQuery.data);
  if (!parsed) {
    await ctx.answerCallbackQuery();
    return;
  }
  const draft = getDraft(parsed.id);
  if (!draft) {
    await ctx.answerCallbackQuery({ text: 'That draft expired.' });
    await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }).catch(() => {});
    return;
  }
  if (parsed.action === 'skip') {
    removeDraft(parsed.id);
    await ctx.answerCallbackQuery({ text: 'Skipped.' });
    await ctx.editMessageText(`[SKIPPED] ${draft.text}`, { reply_markup: { inline_keyboard: [] } }).catch(() => {});
  } else if (parsed.action === 'post') {
    removeDraft(parsed.id);
    // Cast + newsletter drafts can't actually send from the VPS yet (ZOL signer
    // is Pi-only; the newsletter builder is a separate Supabase project). Rather
    // than fake "Posted", append to the durable outbox and say so honestly - a
    // future Pi/builder drainer sends from there. Other kinds keep the old path.
    const channel = await appendApproved(draft.kind, draft.text).catch((e) => {
      console.error('[zoe/index] outbox append failed:', (e as Error)?.message);
      return null;
    });
    if (channel === 'cast') {
      await ctx.answerCallbackQuery({ text: 'Approved - queued to cast.' });
      await ctx
        .editMessageText(`[APPROVED to cast - queued, not yet sent] ${draft.text}`, {
          reply_markup: { inline_keyboard: [] },
        })
        .catch(() => {});
    } else if (channel === 'newsletter') {
      await ctx.answerCallbackQuery({ text: 'Approved for the newsletter.' });
      await ctx
        .editMessageText(`[APPROVED for newsletter - queued] ${draft.text}`, {
          reply_markup: { inline_keyboard: [] },
        })
        .catch(() => {});
    } else {
      await ctx.answerCallbackQuery({ text: 'Posted.' });
      await ctx
        .editMessageText(`[POSTED] ${draft.text}`, { reply_markup: { inline_keyboard: [] } })
        .catch(() => {});
    }
  } else {
    await ctx.answerCallbackQuery({ text: 'Reply with the revised text.' });
    await ctx.reply(`Send the revised text for: "${draft.text.slice(0, 80)}"`).catch(() => {});
  }
});

bot.command('tasks', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const blocks = await buildMemoryBlocks('private');
  await replyChunked(ctx, `Open tasks:\n\n${blocks.tasks}`);
});

// On-demand operator cockpit: the same brief the 5am cron sends, triggerable
// any time (e.g. from the car). Read-only. /cockpit
bot.command('cockpit', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  await ctx.reply('Building your cockpit...');
  try {
    const run = await runCockpit('brief');
    await replyChunked(ctx, run.message);
  } catch (e) {
    await ctx.reply(`Cockpit failed: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
});

bot.command('team', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  if (!teamTrackerConfigured()) {
    await ctx.reply(
      'Team tracker not wired up yet - set COWORK_TRACKER_URL + COWORK_TRACKER_KEY in bot/.env to read the team board.',
    );
    return;
  }
  const tasks = await getOpenTeamTasks();
  await replyChunked(ctx, formatTeamTasks(tasks));
});

// Write path: add a task to the team board. Usage:
//   /teamadd <title>                 -> project defaults to zaodevz
//   /teamadd <project> | <title>     -> explicit project
bot.command('teamadd', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  if (!teamTrackerConfigured()) {
    await ctx.reply('Team tracker not wired up - set COWORK_TRACKER_URL + COWORK_TRACKER_KEY.');
    return;
  }
  const arg = (ctx.match ?? '').toString().trim();
  if (!arg) {
    await ctx.reply('Usage: /teamadd <title>   or   /teamadd <project> | <title>');
    return;
  }
  const [a, b] = arg.includes('|') ? arg.split('|', 2).map((s) => s.trim()) : ['zaodevz', arg];
  const project = b ? a : 'zaodevz';
  const title = b ? b : a;
  const res = await addTeamTask({ title, project });
  await ctx.reply(res.ok ? `Added to ${project} board: ${title}` : `Could not add it - ${res.error}`);
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

// /resume <thing> (or /cv) - capture a resume/bio credential -> resume.md + Bonfire.
// Voice notes that start with "add to my resume ..." route here too (see voice handler).
bot.command(['resume', 'cv'], async (ctx) => {
  if (!isFromZaal(ctx)) return;
  await ctx.reply(await captureResume(ctx.message?.text ?? ''));
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
  // v4: surface the SINGLE best draft from the backlog, then clear the rest.
  // No more paging through a queue of 30 - ZOE judges the day's drafts and
  // sends Zaal the one strongest candidate to POST/REGEN/SKIP.
  const all = await loadPostDrafts();
  if (all.length === 0) {
    await ctx.reply('No drafts queued. I generate them silently through the day - check back, or I\'ll ping you once a day when one is ready.');
    return;
  }
  const pick = await pickBestDraft(all, { cwd: repoDir });
  if (!pick) {
    await ctx.reply('No drafts queued.');
    return;
  }
  await clearDrafts(pick.dropped);
  await sendDraftWithKeyboard({
    bot: ctx.api,
    zaalTgId: zaalId,
    category: pick.best.category,
    text: pick.best.text,
    isResend: false,
  });
  if (pick.considered > 1) {
    await ctx.reply(`Picked the best of ${pick.considered} fresh drafts. The rest are cleared.`);
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
    // Thread context: when Zaal QUOTE-REPLIES a message, fold what he replied to
    // into the turn so a short reply ("zol yes") anchors to the right draft
    // instead of arriving context-free. Telegram only gives us the quoted text.
    const quoted = ctx.message.reply_to_message?.text ?? ctx.message.reply_to_message?.caption;
    const turnText = quoted
      ? `[Zaal is replying to your earlier message:\n"${quoted.slice(0, 1200)}"]\n\nHis reply: ${text}`
      : text;
    // doc 872 (live steering / "finish then apply"): run the turn OFF the poll
    // loop so a new message is received mid-turn instead of blocking the bot.
    // Same-chat turns are serialized in turn-queue; a deferred turn gets a quick
    // ack so Zaal knows it landed and will run after the current one.
    enqueueTurn(chatId, () => handlePrivateMessage(ctx, turnText), {
      onDeferred: () => {
        ctx
          .reply("Got that - finishing what I'm on, then I'll pick it up.")
          .catch(() => {});
      },
    }).catch((e) => console.error('[zoe/index] private turn failed:', (e as Error)?.message));
    return;
  }

  // ZAAL BOTZ ops group: Zaal's own private bot group with forum topics. Treat
  // his messages here like a DM (ZOE responds), and grammy auto-threads the
  // reply back into the same topic. The group id is env config (private-instance
  // per doc 1025) so it stays out of the repo. No @-tag needed.
  const zaalBotzGroupId = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
  if (zaalBotzGroupId && chatId === zaalBotzGroupId && isFromZaal(ctx)) {
    const threadId = ctx.message.message_thread_id;
    // Per-topic behavior (topic = intent, Zaal 2026-07-11): dropping a plain
    // message into a topic auto-acts per that topic. Internal actions fire now;
    // outbound casts are drafted with an Approve button (money/public gate).
    // If Zaal just tapped a question's "Type my own" button, this message is his
    // typed answer - log it as "[answer:<qid>]" (matching the tapped-button path)
    // and stop, so the orchestrator reads it as the answer, not a topic action.
    const awaitingQid = pendingTypeAnswers.get(chatId);
    if (awaitingQid) {
      pendingTypeAnswers.delete(chatId);
      await pushRecent(
        { from: 'zaal', text: `[answer:${awaitingQid}] ${text}`, sender: 'zaalbotz-type' },
        String(zaalBotzGroupId),
      ).catch((e) => console.error('[zoe/index] type-answer log failed:', (e as Error)?.message));
      await ctx
        .reply(`Got your answer for "${awaitingQid}".`, threadId ? { message_thread_id: threadId } : {})
        .catch(() => {});
      return;
    }

    const topicName = await topicNameForThread(threadId).catch(() => undefined);
    const action = routeTopic(topicName);
    const threadOpt = threadId ? { message_thread_id: threadId } : {};

    // Bridge log: record EVERY ZAAL BOTZ turn (all topics, incl auto-act ones)
    // under the group scope so an open Claude Code session can SSH-read Zaal's
    // topic replies and route them to the right worker (the inbox-bridge loop).
    // Text is prefixed with the topic so the reader knows which lane he replied in.
    void pushRecent(
      { from: 'zaal', text: `[${topicName ?? 'General'}] ${text}`, sender: 'zaalbotz' },
      String(zaalBotzGroupId),
    ).catch((e) => console.error('[zoe/index] zaalbotz bridge-log failed:', (e as Error)?.message));

    if (action.kind === 'research') {
      await enqueueWork(text, { chatId, threadId }).catch((e) =>
        console.error('[zoe/index] research enqueue failed:', (e as Error)?.message),
      );
      await ctx
        .reply("On it - researching this. I'll post the doc + PR here when it lands.")
        .catch(() => {});
      // Kick the work-loop now so it starts immediately (else waits for the 2h cron).
      void runWorkTick({
        sendToZaal: (t: string) => bot.api.sendMessage(zaalId, t),
        sendToChat: (cid: number, tid: number | undefined, t: string) =>
          bot.api.sendMessage(cid, t, tid ? { message_thread_id: tid } : {}),
        defaultResearchTarget: researchTopicTarget(),
        zaalTgId: zaalId,
        repoDir,
        currentDate: currentDateString(),
      }).catch((e) => console.error('[zoe/index] research kick failed:', (e as Error).message));
      return;
    }

    if (action.kind === 'coding') {
      // Full auto-PR: the coder+critic pipeline (PR-only, own daily-cap guard).
      // A human still merges. Progress + the PR link report back into the topic.
      await ctx.reply('On it - running the coder+critic pipeline. PR link lands here.').catch(() => {});
      const say = (t: string) => bot.api.sendMessage(chatId, t, threadOpt).catch(() => {});
      void dispatchHermesRun(
        { triggered_by_telegram_id: zaalId, triggered_in_chat_id: chatId, issue_text: text },
        {
          onPrOpened: async (_id, prNumber, prUrl, score) => {
            await say(`Coding done: PR #${prNumber} (critic ${score}/10)\n${prUrl}`);
          },
          onEscalated: async (_id, reason) => {
            await say(`Coding escalated - needs your eyes: ${reason.slice(0, 200)}`);
          },
          onFailed: async (_id, reason) => {
            await say(`Coding failed: ${reason.slice(0, 200)}`);
          },
        },
      ).catch((e) => say(`Coding pipeline error: ${(e as Error).message.slice(0, 160)}`));
      return;
    }

    if (action.kind === 'capture') {
      const res = await addTeamTask({ title: text.slice(0, 300), project: action.project }).catch(
        (e) => ({ ok: false as const, error: (e as Error).message }),
      );
      await ctx
        .reply(res.ok ? `Filed under ${action.project}.` : `Could not file it - ${res.error}`)
        .catch(() => {});
      return;
    }

    if (action.kind === 'draft') {
      // Also file a tagged note for brand topics (WaveWarZ / ZABAL Games).
      if (action.alsoCapture) {
        await addTeamTask({ title: text.slice(0, 300), project: action.alsoCapture }).catch(() => {});
      }
      const id = `${action.draftKind}-${Date.now().toString(36)}`;
      putDraft(action.draftKind, text, id);
      await bot.api
        .sendMessage(chatId, `${action.label}:\n${text}`, {
          ...threadOpt,
          reply_markup: draftKeyboard(id),
        })
        .catch(() => {});
      return;
    }

    // action.kind === 'chat': normal ZOE conversation (Handoffs, Claude Code, etc).
    const quotedG = ctx.message.reply_to_message?.text ?? ctx.message.reply_to_message?.caption;
    const turnTextG = quotedG
      ? `[Zaal is replying to your earlier message:\n"${quotedG.slice(0, 1200)}"]\n\nHis reply: ${text}`
      : text;
    enqueueTurn(chatId, () => handlePrivateMessage(ctx, turnTextG)).catch((e) =>
      console.error('[zoe/index] zaalbotz turn failed:', (e as Error)?.message),
    );
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

  // Groups: serialize per chat off the poll loop too (no deferred ack - groups
  // are noisy and an extra "queued" line per message would add to the noise).
  enqueueTurn(chatId, () => handleGroupMessage(ctx, text, String(chatId))).catch((e) =>
    console.error('[zoe/index] group turn failed:', (e as Error)?.message),
  );
});

// Voice / audio intake (Zaal DM only): transcribe via Groq Whisper, then run it
// through the exact same turn path as a typed message. Lets Zaal voice-answer.
bot.on(['message:voice', 'message:audio'], async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const zaalBotzGroupIdV = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
  const isZaalBotzV = zaalBotzGroupIdV !== 0 && ctx.chat.id === zaalBotzGroupIdV;
  // Voice is handled in Zaal's DM and in the ZAAL BOTZ group (voice-answer a
  // question / voice-drop into a topic). Ignore any other chat.
  if (ctx.chat.type !== 'private' && !isZaalBotzV) return;
  const chatId = ctx.chat.id;
  const fileId = ctx.message.voice?.file_id ?? ctx.message.audio?.file_id;
  if (!fileId) return;
  if (!transcriptionConfigured()) {
    await ctx
      .reply('Voice received, but transcription is off. Add GROQ_API_KEY to bot/.env (free at console.groq.com) and restart me.')
      .catch(() => {});
    return;
  }
  let transcript: string;
  try {
    transcript = await transcribeTelegramFile(token, fileId);
  } catch (err) {
    await ctx.reply(`Could not transcribe that - ${(err as Error).message.slice(0, 160)}`).catch(() => {});
    return;
  }
  if (!transcript) {
    await ctx.reply('(that voice note came through empty)').catch(() => {});
    return;
  }
  // ZAAL BOTZ group voice: a spoken answer to a pending "Type my own" question
  // becomes [answer:<qid>]; otherwise it's bridge-logged under its topic so the
  // open session reads it. (Voice-answer any button-question, hands-free.)
  if (isZaalBotzV) {
    const threadId = ctx.message.message_thread_id;
    const awaitingQid = pendingTypeAnswers.get(chatId);
    const replyOpt = threadId ? { message_thread_id: threadId } : {};
    if (awaitingQid) {
      pendingTypeAnswers.delete(chatId);
      await pushRecent(
        { from: 'zaal', text: `[answer:${awaitingQid}] ${transcript}`, sender: 'zaalbotz-voice' },
        String(zaalBotzGroupIdV),
      ).catch((e) => console.error('[zoe/index] voice-answer log failed:', (e as Error)?.message));
      await ctx
        .reply(`Got your voice answer for "${awaitingQid}": "${transcript.slice(0, 200)}"`, replyOpt)
        .catch(() => {});
    } else {
      const topicName = await topicNameForThread(threadId).catch(() => undefined);
      await pushRecent(
        { from: 'zaal', text: `[${topicName ?? 'General'}] ${transcript}`, sender: 'zaalbotz-voice' },
        String(zaalBotzGroupIdV),
      ).catch((e) => console.error('[zoe/index] voice bridge-log failed:', (e as Error)?.message));
      await ctx.reply(`Heard: "${transcript.slice(0, 300)}"`, replyOpt).catch(() => {});
    }
    return;
  }
  await ctx.reply(`Heard: "${transcript.slice(0, 300)}"`).catch(() => {});
  // Voice resume capture: "add to my resume that I am a National Ski Patroller..."
  if (looksLikeResume(transcript)) {
    captureResume(transcript)
      .then((r) => ctx.reply(r))
      .catch((e) => console.error('[zoe/index] voice resume failed:', (e as Error)?.message));
    return;
  }
  enqueueTurn(chatId, () => handlePrivateMessage(ctx, transcript), {
    onDeferred: () => {
      ctx.reply("Got that - finishing what I'm on, then I'll pick it up.").catch(() => {});
    },
  }).catch((e) => console.error('[zoe/index] voice turn failed:', (e as Error)?.message));
});

// Image / document intake (Zaal DM only): download the file, then point ZOE at it.
// ZOE's Read tool already views images + PDFs (vision), so no brain-input change -
// the turn just references the saved path and ZOE Reads it.
bot.on(['message:photo', 'message:document'], async (ctx) => {
  if (ctx.chat.type !== 'private' || !isFromZaal(ctx)) return;
  const chatId = ctx.chat.id;
  const caption = ctx.message.caption ?? '';
  let fileId: string | undefined;
  let label = 'file';
  let preferName: string | undefined;
  if (ctx.message.photo?.length) {
    fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id; // largest size
    label = 'image';
  } else if (ctx.message.document) {
    fileId = ctx.message.document.file_id;
    preferName = ctx.message.document.file_name;
    label = preferName || 'document';
  }
  if (!fileId) return;
  let savedPath: string;
  try {
    savedPath = await downloadTelegramFile(token, fileId, join(ZOE_PATHS.home, 'inbox'), preferName);
  } catch (err) {
    await ctx.reply(`Could not fetch that ${label} - ${(err as Error).message.slice(0, 150)}`).catch(() => {});
    return;
  }
  await ctx.reply(`Got the ${label === 'image' ? 'image' : `file (${label})`} - looking at it...`).catch(() => {});
  const note = caption ? `${caption}\n\n` : '';
  const turnText = `${note}[Zaal sent ${label === 'image' ? 'an image' : `a file named ${label}`}, saved at ${savedPath}. Use the Read tool to view it, then respond to ${caption ? 'the message above' : 'what it contains'}.]`;
  enqueueTurn(chatId, () => handlePrivateMessage(ctx, turnText), {
    onDeferred: () => {
      ctx.reply("Got that - finishing what I'm on, then I'll pick it up.").catch(() => {});
    },
  }).catch((e) => console.error('[zoe/index] media turn failed:', (e as Error)?.message));
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
      // command (plan:/note:/nudge toggle) OR an agent-worthy request. A
      // command is not a reflection answer; neither is "research X and draft
      // Y" (that's a job to dispatch). Let those fall through to normal
      // handling and leave the reflection pending armed (it auto-expires via
      // TTL). Fixes doc 770 H1 (a `plan:` in the reflection window was
      // swallowed) and the auto-decompose swallow (an agent request sent while
      // an unanswered reflection was pending got logged as a reflection answer
      // instead of spawning agents).
      if (!isZoeCommand(text) && !shouldDecompose(text)) {
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

  // Close a cowork tracker task straight from TG: "/done 123", "done #123",
  // optional note after a dash ("done 123 - shipped in PR #99"). Same
  // markDone() the control plane uses; fails soft with a clear message when
  // the cowork API creds (COWORK_API_URL + COWORK_BOT_TOKEN) are missing.
  const doneCmd = /^\/?done\s+#?([\w-]+)(?:\s*[-:]\s*(.+))?$/i.exec(text.trim());
  if (doneCmd) {
    const r = await markDone(doneCmd[1], doneCmd[2] ?? 'closed by Zaal via ZOE');
    await ctx.reply(
      r.ok
        ? `Task ${doneCmd[1]} marked done.`
        : `Could not mark ${doneCmd[1]} done: ${'error' in r && r.error ? r.error : 'cowork API not configured'}`,
    );
    return;
  }

  // Update task status from TG: "/task 123 blocked - waiting on X",
  // "task 123 in_progress", "/task #123 todo", etc.
  // Supports status: blocked, todo, in_progress (maps to WIP), done
  // Optional note after dash or colon. Fails soft like doneCmd.
  const taskStatusCmd = /^\/?task\s+#?([\w-]+)\s+(blocked|todo|in_progress|done)(?:\s*[-:]\s*(.+))?$/i.exec(text.trim());
  if (taskStatusCmd) {
    const [, id, statusStr, noteText] = taskStatusCmd;
    const statusMap: Record<string, TaskStatus> = {
      blocked: 'BLOCKED',
      todo: 'TODO',
      in_progress: 'WIP',
      done: 'DONE',
    };
    const mappedStatus = statusMap[statusStr.toLowerCase()];
    const notes = noteText ? noteText.trim() : undefined;
    const r = await updateItem(id, { status: mappedStatus, notes });
    await ctx.reply(
      r.ok
        ? `Task ${id} status updated to ${statusStr.toLowerCase()}.${notes ? ` Note: ${notes}` : ''}`
        : `Could not update ${id}: ${'error' in r && r.error ? r.error : 'cowork API not configured'}`,
    );
    return;
  }

  // List all open team tasks: "/tasks" or "tasks"
  const tasksCmd = /^\/?tasks\s*$/i.exec(text.trim());
  if (tasksCmd) {
    try {
      const tasks = await getOpenTeamTasks();
      const formatted = formatTeamTasks(tasks);
      await replyChunked(ctx, formatted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[zoe/index] tasks list failed:', msg);
      await ctx.reply(`Could not fetch tasks: ${msg.slice(0, 100)}`);
    }
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

  // Work-loop enqueue: `queue: <topic>` adds a research topic ZOE works
  // autonomously (research-only, capped) and lands as a doc PR.
  const queueMatch = QUEUE_PREFIX.exec(text);
  if (queueMatch) {
    const item = await enqueueWork(queueMatch[1]);
    const depth = await queueDepth();
    await ctx
      .reply(`Queued #${depth} for the work-loop: "${item.input.slice(0, 80)}". On it now.`)
      .catch(() => {});
    void runWorkTick({
      sendToZaal: (t: string) => bot.api.sendMessage(zaalId, t),
      sendToChat: (chatId: number, threadId: number | undefined, t: string) =>
        bot.api.sendMessage(chatId, t, threadId ? { message_thread_id: threadId } : {}),
      defaultResearchTarget: researchTopicTarget(),
      zaalTgId: zaalId,
      repoDir,
      currentDate: currentDateString(),
    }).catch((e) => console.error('[zoe/index] work-loop kick failed:', (e as Error).message));
    return;
  }

  // Goal decomposition + dispatch: opt-in `plan:`/`decompose:` prefix.
  const planMatch = PLAN_PREFIX.exec(text);
  if (planMatch) {
    await handlePlanCommand(ctx, planMatch[2]);
    return;
  }

  // Efficiency (doc 863): agent-worthy DMs auto-route to the decompose+approve
  // flow so Zaal never has to remember the `plan:` prefix. ZOE proposes a plan
  // and ASKS y/n - no agent spends until he approves. Plain questions + short
  // messages stay inline (shouldDecompose filters them). We never clobber a
  // waiting y/n approval (plan/learn/reflexion/bonfire), but an unanswered
  // evening reflection IS superseded - a fresh agent request means Zaal moved
  // on, so we clear it and dispatch rather than swallow the request.
  if (shouldDecompose(text)) {
    const blocking = getPending('private');
    if (!blocking || blocking.kind === 'await-reflection') {
      if (blocking) await clearPending('private');
      await handlePlanCommand(ctx, text, { autoDetected: true });
      return;
    }
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
// assumes the bot is dead. We refresh the typing action every 4s and narrate
// progress with up to two text pings as the turn drags on (doc 872).
const ACK_THRESHOLD_MS = 6000;
const TYPING_REFRESH_MS = 4000;
// Second, "still on it" narration ping for genuinely long turns. Keeps Zaal
// informed without being chatty - capped at these two pings total.
const SECOND_NARRATION_MS = 28000;

interface ProgressHandle {
  stop: () => void;
}

/**
 * Keep the typing indicator alive and narrate progress on a slow turn:
 * one ack at ACK_THRESHOLD_MS, one "still on it" at SECOND_NARRATION_MS.
 * Returns a handle whose stop() clears the timers (call it once the reply is
 * sent). doc 872 progress narration; replaces the old single-ack pattern.
 */
function startProgressNarration(
  ctx: Context,
  chatId: number,
  messages: { first: string; second?: string },
): ProgressHandle {
  ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  const typingInterval = setInterval(() => {
    ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  }, TYPING_REFRESH_MS);
  const firstAck = setTimeout(() => {
    ctx.reply(messages.first).catch(() => {});
  }, ACK_THRESHOLD_MS);
  const secondAck = messages.second
    ? setTimeout(() => {
        ctx.reply(messages.second as string).catch(() => {});
      }, SECOND_NARRATION_MS)
    : null;
  return {
    stop: () => {
      clearInterval(typingInterval);
      clearTimeout(firstAck);
      if (secondAck) clearTimeout(secondAck);
    },
  };
}

async function dispatchConcierge(
  ctx: Context,
  text: string,
  scope: ChatScope,
  label: string,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;
  const progress = startProgressNarration(ctx, chatId, {
    first: 'Got it. Working on this one - reply incoming.',
    second: "Still on it - bigger one than it looked. Hang tight.",
  });

  try {
    // doc 869 fix: enforce ZOE's documented 50-call/day cap. Warn (alert) once
    // crossed; soft-block only if ZOE_CALL_CAP_ENFORCE=block, so the owner is
    // never silently locked out by default.
    const budget = checkAndRecordZoeCall();
    if (!budget.allowed) {
      console.error(`[zoe/index] ALERT daily LLM call cap hit (${budget.count}/${budget.cap}) — soft-blocked this turn`);
      progress.stop();
      await ctx
        .reply(`I've hit today's ${budget.cap}-call cap (set ZOE_CALL_CAP_ENFORCE=off or bump ZOE_DAILY_CALL_CAP to keep going).`)
        .catch(() => {});
      return;
    }
    if (budget.justCrossed) {
      console.error(`[zoe/index] ALERT daily LLM call cap exceeded (${budget.count}/${budget.cap}) — still answering (warn-only)`);
      await ctx.reply(`⚠️ Past today's ${budget.cap}-call budget (${budget.count}). Still answering, but worth a glance.`).catch(() => {});
    }

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
    // EXCEPTION: skip recall if the message has a URL + research intent. Links
    // should be fetched + analyzed by research-worker, not answered from recall.
    let recallContext: string | undefined;
    if (scope === 'private' && text.trim().length >= 12 && !wantsLinkResearch(text)) {
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
      linkResearchIntent: wantsLinkResearch(text),
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

    // Inline op summary (doc 890): tell Zaal what state changed this turn
    // ("tasks: 2 add, 1 complete") so he sees it in the reply without /tasks.
    // Relay/CRM/thread ops already do this; task + quest ops did not.
    let taskPostscript = '';
    {
      const opLines: string[] = [];
      if (result.task_ops.length > 0) {
        const counts: Record<string, number> = {};
        for (const op of result.task_ops) counts[op.op] = (counts[op.op] ?? 0) + 1;
        opLines.push(`tasks: ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')}`);
      }
      if (result.quest_ops.length > 0) {
        const counts: Record<string, number> = {};
        for (const op of result.quest_ops) counts[op.op] = (counts[op.op] ?? 0) + 1;
        opLines.push(`quests: ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')}`);
      }
      if (opLines.length > 0) taskPostscript = '\n\n' + opLines.join(' · ');
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

    // Knowledge extraction fan-out (doc 862): on substantive DMs, fan out 4
    // Haiku readers that comb Zaal's message for people/projects/decisions/
    // commitments and write graph-ready episodes. Silent, fire-and-forget,
    // never blocks the reply. DMs only - group chatter does not seed Zaal's graph.
    if (scope === 'private' && text.trim().length >= EXTRACT_MIN_LEN) {
      fanOutKnowledgeExtractors(text, { cwd: repoDir })
        .then((f) => {
          if (f.written > 0) {
            console.log(`[zoe/index] extract — ${f.written} episode(s), ${f.skipped} skipped`);
          }
        })
        .catch((e) => console.error('[zoe/index] extract fan-out failed:', e));
    }

    await pushRecent({ from: 'zoe', text: result.reply }, scope);

    const safeReply = result.reply.trim() + taskPostscript + relayPostscript + crmPostscript + threadPostscript;
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

    // Inline research -> durable doc on main (closes the gap where research
    // answered inline, not via the worker dispatch, never landed a doc). A
    // private DM that is a research request (a URL + "research") commits the
    // answer as a numbered doc + PR, same as the dispatch path. Fire-and-forget.
    if (scope === 'private' && /https?:\/\/\S+/i.test(text) && /res[ae]arch/i.test(text)) {
      commitResearchDoc({ question: text, findings: result.reply })
        .then((d) => {
          if (d.ok) ctx.reply(`Saved to main: doc ${d.num} -> ${d.prUrl}`).catch(() => {});
        })
        .catch((e) => console.error('[zoe/index] inline research-doc failed:', (e as Error)?.message));
    }

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
    progress.stop();
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
async function handlePlanCommand(
  ctx: Context,
  goal: string,
  opts: { autoDetected?: boolean } = {},
): Promise<void> {
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
  const progress = startProgressNarration(ctx, chatId, {
    first: 'Decomposing into a routed plan — one moment.',
    second: 'Still mapping the subtasks - almost there.',
  });

  // H2 (doc 770): note if a new plan replaces an unresolved approval, so a
  // live plan-gate / reflexion / learn pending is never silently clobbered.
  const prior = getPending('private');

  try {
    const result = await decomposeGoal({ goal, context: zoeContext() });
    const { plan } = result;
    const dispatchable = plan.ambiguities.length === 0 && plan.subtasks.length > 0;
    // Auto-dispatch a single research-worker task (no y/n) - a plain "research
    // this URL" shouldn't need a confirm; it's read-only + lands a doc PR.
    const singleResearch =
      dispatchable && plan.subtasks.length === 1 && plan.subtasks[0].worker === 'research-worker';
    let priorNote = '';
    if (dispatchable) {
      if (prior && (prior.kind === 'plan-gate' || prior.kind === 'reflexion' || prior.kind === 'learn')) {
        priorNote = `\n\n(Heads up: this replaced a pending ${prior.kind} you hadn't resolved.)`;
      }
      const pendingPlan: PendingApproval = {
        kind: 'plan',
        chatScope: 'private',
        createdAt: new Date().toISOString(),
        goal,
        plan,
      };
      await setPending(pendingPlan);
      if (singleResearch) {
        await ctx
          .reply('On it - researching this and saving the result to main (no confirm needed for a single research task).')
          .catch(() => {});
        await resolvePendingApproval(ctx, pendingPlan, { decision: 'approve-all', ids: [] });
        return;
      }
    }
    const autoNote =
      opts.autoDetected && dispatchable
        ? 'This looks like multi-step work, so I drafted a plan to run with agents.\n\n'
        : '';
    await replyChunked(ctx, autoNote + renderPlanForApproval(plan) + priorNote);
    console.log(
      `[zoe/index] plan proposed — subtasks=${plan.subtasks.length} ambiguities=${plan.ambiguities.length} dispatchable=${dispatchable} cost=$${result.costUsd.toFixed(4)}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] decompose failed:', msg);
    await ctx.reply(`(decompose error - ${msg.slice(0, 200)})`);
  } finally {
    progress.stop();
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
        // doc 872 progress narration: tick each subtask as it lands so a long
        // plan reads as live progress, not silence between start and summary.
        onSubtaskDone: async (st, res) => {
          const mark = res.status === 'completed' ? '✓' : res.status === 'failed' ? '✗' : '↻';
          await ctx.reply(`${mark} ${st.id} ${res.status}`.slice(0, 120)).catch(() => {});
          // Durability: a completed research-worker subtask becomes a numbered doc
          // + PR to main (trusted Node commit; the worker stays sandboxed).
          if (st.worker === 'research-worker' && res.status === 'completed' && res.output) {
            const doc = await commitResearchDoc({ question: goal, findings: res.output });
            await ctx
              .reply(doc.ok ? `Saved to main: doc ${doc.num} -> ${doc.prUrl}` : `(could not auto-save the research doc: ${doc.error})`)
              .catch(() => {});
          }
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

    // Alert if any worker hit auth errors during dispatch
    if (report.authErrorsDetected && ctx.chat) {
      const failedAuth = report.results.filter((r) => r.authError);
      const detail = failedAuth.map((r) => `${r.worker} (${r.subtaskId})`).join(', ');
      await alertAuthFailure(bot, zaalId, `Research/task workers failed with auth errors: ${detail}. Recent research may not have completed.`);
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
