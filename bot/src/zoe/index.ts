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
import { sendChunkedToTelegram } from './tg-chunk';
loadEnv();

import { Bot, Context, InlineKeyboard } from 'grammy';
import { BUTTON_BAR, ZOE_COMMANDS, isBarLabel } from './button-bar';
import {
  surfaceGrill,
  applyGrillAction,
  applyGrillAnswer,
  resolveGrillByReply,
  getActiveGrill,
  matchTypedAnswer,
  toggleGrillMulti,
  commitGrillMulti,
  multiKeyboard,
} from './grill';
import { resolveTaskDecision } from '../cockpit/adapters';
import type { Client } from 'discord.js';
import { bootDiscordClient } from './discord';
import { startHeartbeat, reportEvent, startCommandPoller, markDone, updateItem, type TaskStatus } from '../lib/cowork';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { detectBuildIntent } from './build-intent';
import { parseBusReply } from './bus-bridge';
import { replySubject, sendBusReply } from './bus-send';
import { doneKeyboard, maybeKeyboard, runningKeyboard } from './dm-build-buttons';
import { LiveStatus, renderBuildStatus } from './live-status';
import { stashPending, takePending, worthOffering } from './dm-build-pending';
import {
  beginBuild,
  describeActive,
  endBuild,
  getActiveBuild,
  isCancelRequested,
  isStopRequest,
  queueFollowUp,
  requestCancel,
  setPhase,
  setRunId,
  takeFollowUp,
} from './dm-build-session';
import { runConciergeTurn } from './concierge';
import { sanitizeErrorForUser } from './user-errors';
import { isConversationalTurn, ZOE_QUICK_MODEL } from './types';
import { checkAndRecordZoeCall } from './call-budget';
import { runCockpit } from '../cockpit/cockpit';
import { applyTaskOps, seedInitialTasks } from './tasks';
import { readFleetStatus, formatLoopsStatus, formatLoopDetail } from './loops-status';
import { applyQuestOps, buildQuestsBlock, formatQuestList } from './sidequests';
import { runBotRelayOps, summarizeRelayResults } from './relay';
import { runCrmOps, summarizeCrmResults } from './crm';
import { getOpenTeamTasks, formatTeamTasks, teamTrackerConfigured, addTeamTask, mirrorCapturesToTracker, runTeamDigest, getTeamMemberMap, formatOwnerDigest } from './team-tracker';
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
  appendDecision,
  appendBuildState,
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
import { disableNudges, enableNudges, nudgesEnabled, markNudgeSent } from './nudges';
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
import { parseVetoCallback, applyVeto } from './brief-veto';
import {
  parseBuildCandidateCallback,
  applyBuildCandidate,
} from './build-candidate';
import { dispatchPlan } from './dispatch';
import {
  handleVoiceAnswer,
  handleMessageReaction,
  handleAutoRoute,
  handleReplyRoute,
  formatPulse,
  formatAgenda,
  parseBatchAnswer,
  classifyIntent,
} from './tg-interactions';
import { recordMessageContext, getMessageContext, clearMessageContext } from './message-context';
import { takePendingAnswer } from './pending-answers';
import { tryInstantRelayReply } from './relay-bridge';
import { commitResearchDoc } from './research-doc';
import { extractFirstUrl, isFollowUpNotResearch, wasResearched } from './research-dedupe';
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
import {
  NOTE_PREFIX,
  PLAN_PREFIX,
  QUEUE_PREFIX,
  FOCUS_ON_RE,
  FOCUS_OFF_RE,
  CHECKPOINT_PREFIX,
  AUDIT_COMMAND_RE,
  BUDGET_COMMAND_RE,
  isZoeCommand,
} from './commands';
import { formatSpendStatus } from './cost-governance';
import { enqueueWork, queueDepth, runWorkTick } from './work-loop';
import { STANDARD_TOPICS, readTopics, writeTopics } from './topics';
import { routeTopic, topicNameForThread } from './topic-router';
import { brandBoxFor, fetchIcmBrain, brandSystemPreamble } from './brand-brain';
import { appendApproved } from './outbox';
import { enqueueZolCast } from './zol-queue';
import { dispatchHermesRun } from '../hermes/runner';
import { shadowSummary } from '../hermes/critic';
import { logTopicThreadId } from './curator';
import { putDraft, getDraft, removeDraft, draftKeyboard, parseDraftCallback } from './drafts';
import { parseQuestionCallback } from './questions';
import { applyThreadOps, summarizeThreadOps } from './thread-ops';
import { loadThreads, deleteThread, renderOpenThreadsBlock } from './threads';
import { ackPush } from './proactive';
import { touchLastSeen } from './events';
import { sendToZaal as sendToZaalRouted, constructRoutingDeps, type SendToZaalOptions } from './telegram-routing';
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
import {
  getPendingReply,
  clearPendingReply,
  postZaalReplyToTask,
  getPendingDraft,
  clearPendingDraft,
  postDraftAnswerToTask,
} from './task-teammate-ack';
import {
  isFocusMode,
  startFocus,
  endFocus,
  decideQueueOrSend,
  buildFocusDigest,
  queuePing,
} from './focus-guard';
import { saveCheckpoint, getCheckpoint, offerCheckpoint } from './session-checkpoint';
import { runAudit, formatAuditForTelegram } from './trust-audit';

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

// Telegram routing: construct deps for sendToZaal (DM vs group routing).
// This centralizes where messages go based on kind (question vs status).
const routingDeps = constructRoutingDeps((chatId: number, text: string, opts?: any) =>
  bot.api.sendMessage(chatId, text, opts),
);

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
    { reply_markup: BUTTON_BAR },
  );
});

// /menu - (re)show the persistent tap-first cockpit bar at the bottom of the DM.
bot.command('menu', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  await ctx.reply('Cockpit bar ready - tap below.', { reply_markup: BUTTON_BAR });
});

// The agent's proactive grill deps: DM Zaal the next thing that needs him, one at
// a time, to his DM (never a group). PIN the open question (and unpin the prior
// one) so ONLY the question awaiting his answer is ever pinned. Reused by /grill,
// the callbacks, and the scheduler cron.
function toGrammyRows(rows: { text: string; data: string }[][]) {
  return rows.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data })));
}

function grillDeps(chatId: number) {
  // No pin/unpin: pinning each grill item spawned a "ZOE pinned ..." service
  // message per item, cluttering the DM. With the daily cap (~5/day) the cards
  // are few and self-resolving (see grillResolvedText), so a pin isn't needed -
  // and the clutter made the DM unusable AFK (Zaal, 2026-07-26).
  return {
    sendDM: (text: string, buttons: { text: string; data: string }[][]) =>
      bot.api.sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))),
        },
      }),
  };
}

// Rewrite a grill card to its resolved state so a tap is UNMISTAKABLE. The old
// callbacks only stripped the buttons + flashed a transient toast, so Skip/Later
// looked dead. This keeps the decision line, drops the reply/buttons prompt, and
// appends the outcome - the card visibly becomes "... -> Skipped".
function grillResolvedText(original: string | undefined, outcome: string): string {
  const lead = (original ?? 'Item').split('\n\n')[0]; // the "Decision needed:\n<title>" block
  return `${lead}\n\n-> ${outcome}`;
}

// /grill - surface the next item that needs you, on demand (also runs on a cron).
bot.command('grill', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const r = await surfaceGrill({ ...grillDeps(zaalId), bypassCap: true });
  if (!r.sent) await ctx.reply('Nothing needs you right now - the queue is clear.');
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
  await sendChunkedToTelegram(
    (cid, t, o) => bot.api.sendMessage(cid, t, o as never),
    gid,
    `ZOL draft:\n${text}`,
    { baseOpts: { message_thread_id: zolThread }, replyMarkup: draftKeyboard(id), markupOn: 'last' },
  );
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

bot.on('callback_query:data', async (ctx, next) => {
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
    // Unpin the question once Zaal engages with it (zao-ask pins each question so
    // open ones stay easy to find; answering clears it from the pin list).
    const pinnedMid = ctx.callbackQuery.message?.message_id;
    if (pinnedMid) {
      // Feature 1: Record message context for this question
      // So when Zaal replies to this message, we can route it with the correct qid context.
      await recordMessageContext(pinnedMid, { qid: q.qid }).catch((err) => {
        console.error('[zoe/index] failed to record question message context:', err);
      });
      await ctx.api.unpinChatMessage(gid, pinnedMid).catch(() => {});
    }
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
      const replyMsg = await ctx
        .reply(`Reply to this thread with your answer for "${q.qid}".`, {
          ...(ctx.callbackQuery.message?.message_thread_id
            ? { message_thread_id: ctx.callbackQuery.message.message_thread_id }
            : {}),
        })
        .catch(() => undefined);
      // Also record the reply message ID so if Zaal replies to this message, we know the context
      if (replyMsg?.message_id) {
        await recordMessageContext(replyMsg.message_id, { qid: q.qid }).catch((err) => {
          console.error('[zoe/index] failed to record reply message context:', err);
        });
      }
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

  // Morning brief veto — "veto:<taskId>" callback. Minimal, reversible veto:
  // set metadata.morning_veto = now.
  const vetoTaskId = parseVetoCallback(ctx.callbackQuery.data);
  if (vetoTaskId) {
    const patchImpl = async (taskId: string, metadata: Record<string, unknown>) => {
      const base = process.env.COWORK_TRACKER_URL;
      const key = process.env.COWORK_TRACKER_KEY;
      if (!base || !key) throw new Error('Tracker not configured');

      const url = `${base.replace(/\/$/, '')}/rest/v1/tasks?legacy_id=eq.${taskId}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata }),
      });
      if (!res.ok) throw new Error(`Tracker PATCH failed (${res.status})`);
    };

    const ok = await applyVeto(vetoTaskId, patchImpl, new Date().toISOString());
    if (ok) {
      await ctx.answerCallbackQuery({ text: 'Vetoed — I\'ll deprioritize it.' });
      await ctx
        .editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } })
        .catch(() => {});
    } else {
      await ctx.answerCallbackQuery({ text: 'Veto failed — check logs.' });
    }
    return;
  }

  // Fleet BUILD candidate — "bc:approve:<id>" / "bc:skip:<id>". Records the
  // decision as a metadata flag (build_approved/build_skipped) so build-queue
  // picks it up; merges into existing metadata so `why`/`tier` survive.
  const bc = parseBuildCandidateCallback(ctx.callbackQuery.data);
  if (bc) {
    const base = process.env.COWORK_TRACKER_URL;
    const key = process.env.COWORK_TRACKER_KEY;
    if (!base || !key) {
      await ctx.answerCallbackQuery({ text: 'Tracker not configured.' });
      return;
    }
    const root = base.replace(/\/$/, '');
    const readMetadata = async (id: string): Promise<Record<string, unknown> | null> => {
      const res = await fetch(
        `${root}/rest/v1/tasks?legacy_id=eq.${id}&select=metadata`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } },
      );
      if (!res.ok) throw new Error(`Tracker GET failed (${res.status})`);
      const rows = (await res.json()) as Array<{ metadata: Record<string, unknown> | null }>;
      if (!rows.length) return null;
      return rows[0].metadata ?? {};
    };
    const patchMetadata = async (id: string, metadata: Record<string, unknown>): Promise<void> => {
      const res = await fetch(`${root}/rest/v1/tasks?legacy_id=eq.${id}`, {
        method: 'PATCH',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      });
      if (!res.ok) throw new Error(`Tracker PATCH failed (${res.status})`);
    };

    const result = await applyBuildCandidate(
      bc.action,
      bc.id,
      readMetadata,
      patchMetadata,
      new Date().toISOString(),
    );
    if (result.ok) {
      const verb = bc.action === 'approve' ? 'Approved' : 'Skipped';
      const note = result.already ? `Already ${verb.toLowerCase()}.` : `${verb}.`;
      const toast =
        bc.action === 'approve' && !result.already
          ? 'Approved - a build session will pick it up.'
          : note;
      await ctx.answerCallbackQuery({ text: toast });
      await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }).catch(() => {});
    } else {
      await ctx.answerCallbackQuery({ text: `Failed - ${result.error ?? 'check logs'}.` });
    }
    return;
  }

  const parsed = parseDraftCallback(ctx.callbackQuery.data);
  if (!parsed) {
    // Not a question/veto/draft callback - pass it THROUGH to the specific
    // handlers registered below (post-*, nudge:*) instead of acking + returning.
    // The old silent return here swallowed those callbacks entirely (this
    // handler runs first), so post/nudge buttons never fired. A final fallback
    // handler acks anything that truly matches nothing.
    return next();
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
      // Enqueue the cast for @zolbot to pick up from the cowork tracker.
      // Best-effort - if this fails, the cast is still in the outbox.jsonl.
      await enqueueZolCast(draft.text).catch((e) => {
        console.error('[zoe/index] zol queue enqueue failed:', (e as Error)?.message);
      });
      await ctx.answerCallbackQuery({ text: 'Approved - queued for @zolbot.' });
      await ctx
        .editMessageText(`[APPROVED to cast - queued for @zolbot] ${draft.text}`, {
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


// FEATURE 2: REACTIONS AS ACTIONS (message reactions)
// Emoji reactions on ZOE status messages: thumbs-up/+1 = approve/ack,
// checkmark = mark done, fire = mark urgent.
bot.on('message_reaction', async (ctx) => {
  if (!isFromZaal(ctx)) {
    await ctx.answerCallbackQuery().catch(() => {});
    return;
  }

  const result = await handleMessageReaction(ctx, {
    isFromZaal: true,
    zaalId: Number(process.env.ZAAL_TELEGRAM_ID ?? 0),
    reactions: {
      unpin: async (chatId, messageId) => {
        await ctx.api.unpinChatMessage(chatId, messageId).catch(() => {});
      },
      markDone: async (taskId, _status) => {
        if (taskId) {
          // _status is the literal 'done'; the tracker's TaskStatus is 'DONE'.
          await updateItem(taskId, { status: 'DONE' }).catch((e) => {
            console.error('[zoe/tg-interactions] mark-done failed:', e);
          });
        }
      },
      getTaskForMessage: async (messageId) => {
        // Feature 3: Look up task ID from persistent message context store
        try {
          const context = await getMessageContext(messageId);
          return context?.taskId ?? null;
        } catch (err) {
          console.error('[zoe/index] getTaskForMessage failed:', err);
          return null;
        }
        // TODO: if you track message ID -> task ID mappings, look it up here
        // For now, return null (reactions won't mark tasks done without this mapping)
        return null;
      },
      ping: async (queueName, reason) => {
        console.log(`[zoe/tg-interactions] reaction ping: ${queueName} - ${reason}`);
      },
    },
  });

  if (result.error) {
    console.error('[zoe/tg-interactions] reaction handler error:', result.error);
  }
});
bot.command('tasks', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const blocks = await buildMemoryBlocks('private');
  await replyChunked(ctx, `Open tasks:\n\n${blocks.tasks}`);
});

// Fleet loop status (Zaal P1, 2026-07-17). /loops = all loops; /loop <name> = one.
// Reads the keepalive supervisor's /tmp/fleet-status.json. Read-only, Zaal-only.
bot.command('loops', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const data = await readFleetStatus();
  await replyChunked(ctx, formatLoopsStatus(data, Date.now()));
});

// Critic-panel shadow eval (doc 2215): panel-vs-single-critic agreement on
// today's Hermes reviews. Read-only, Zaal-only. /shadow [YYYY-MM-DD].
bot.command('shadow', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const day = (ctx.match ?? '').toString().trim() || undefined;
  const s = day ? shadowSummary(day) : shadowSummary();
  if (s.total === 0) {
    await ctx.reply(
      `No critic-panel shadow data${day ? ` for ${day}` : ' today'} yet. Enable with ZOE_CRITIC_PANEL_SHADOW=1 + a few Hermes fix-PRs on complex diffs.`,
    );
    return;
  }
  const lines = [
    `Critic panel shadow eval${day ? ` (${day})` : ' (today)'}:`,
    `- reviews: ${s.total} (both ran: ${s.bothRan}, panel failed: ${s.panelFailedToRun})`,
    `- AGREE with single critic: ${s.agree}/${s.bothRan}`,
    `- disagree: ${s.disagree}`,
    `  - panel stricter (would BLOCK where single passed): ${s.panelStricterFails}  <- candidate extra catches`,
    `  - single stricter (panel too lenient): ${s.singleStricterFails}`,
    '',
    'Read: high panel-stricter with real bugs = the panel earns default-ON; high single-stricter or noise = keep it off. Raw log: ~/.zao/zoe/critic-shadow/.',
  ];
  await replyChunked(ctx, lines.join('\n'));
});

bot.command('loop', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const name = (ctx.match ?? '').toString().trim();
  const data = await readFleetStatus();
  await replyChunked(ctx, formatLoopDetail(data, name, Date.now()));
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

// /board - the shareable per-OWNER team digest ("what is each person on right
// now"), built for Zaal to forward to the team for coordination (doc 2201).
// Read-only, Zaal-only. Does NOT mirror to Bonfire (that's the scheduled run).
bot.command('board', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  if (!teamTrackerConfigured()) {
    await ctx.reply(
      'Team tracker not wired up yet - set COWORK_TRACKER_URL + COWORK_TRACKER_KEY in bot/.env to read the team board.',
    );
    return;
  }
  // "/board iman" -> that person's view; "/board" -> the full per-owner digest.
  const person = (ctx.match ?? '').toString().trim();
  if (person) {
    const [tasks, members] = await Promise.all([getOpenTeamTasks(), getTeamMemberMap()]);
    await replyChunked(ctx, formatOwnerDigest(tasks, members, person));
    return;
  }
  const { digest } = await runTeamDigest({ mirrorToBonfire: false });
  await replyChunked(ctx, digest);
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
// --- DM build buttons (Zaal: "i want more buttons alwys") -------------------
// Every one answers the callback FIRST. An unanswered callback leaves Telegram
// spinning on the button, which reads as a hang and gets tapped again.

bot.callbackQuery('dmb:stop', async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const stopped = requestCancel(chatId);
  await ctx.answerCallbackQuery(stopped ? 'Stopping' : 'Nothing running').catch(() => {});
  await ctx
    .reply(
      stopped
        ? 'Stopping after the current attempt - killing it mid-attempt would leave a ' +
            'half-written worktree and nothing to show for the tokens. No PR will open.'
        : 'Nothing is building right now.',
    )
    .catch(() => {});
});

bot.callbackQuery('dmb:status', async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const running = getActiveBuild(chatId);
  await ctx.answerCallbackQuery(running ? 'Checking' : 'Idle').catch(() => {});
  await ctx
    .reply(running ? describeActive(running) : 'Nothing building. Send a build and I will start one.')
    .catch(() => {});
});

bot.callbackQuery('dmb:again', async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  await ctx
    .reply('Send the next one - or prefix it with "build:" if you want to skip the guessing.')
    .catch(() => {});
});

// The near-miss prompt. "Build it" turns a declined classification into one tap
// instead of a retyped message.
bot.callbackQuery(/^dmb:yes:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  const key = ctx.match?.[1];
  if (!chatId || !key) return;
  const task = takePending(String(key));
  if (!task) {
    // Expired, or already tapped. Say which rather than failing silently - a
    // double-tap must never start two builds.
    await ctx.answerCallbackQuery('That one expired').catch(() => {});
    await ctx.reply('That request aged out (or already started). Send it again.').catch(() => {});
    return;
  }
  if (getActiveBuild(chatId)) {
    await ctx.answerCallbackQuery('Already building').catch(() => {});
    await ctx.reply('A build is already running - send that again when it finishes.').catch(() => {});
    return;
  }
  await ctx.answerCallbackQuery('Building').catch(() => {});
  await startDmBuild(chatId, task, 'you tapped Build it');
});

bot.callbackQuery(/^dmb:no:(.+)$/, async (ctx) => {
  const key = ctx.match?.[1];
  if (key) takePending(String(key)); // drop it so it cannot be tapped later
  await ctx.answerCallbackQuery('Left it').catch(() => {});
  await ctx.reply('Left it alone.').catch(() => {});
});

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


// FEATURE 5: BOT COMMANDS (/pulse /agenda /list)
// Mirror board state via REST API (Supabase or cowork tracker).
bot.command('pulse', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  try {
    const supaUrl = process.env.SUPABASE_URL;
    const supaKey = process.env.SUPABASE_ANON_KEY;

    if (!supaUrl || !supaKey) {
      await ctx.reply('Board integration not configured (missing SUPABASE_URL + SUPABASE_ANON_KEY)');
      return;
    }

    // Fetch open board items (this is a simplified version - adapt to your actual board schema)
    const res = await fetch(`${supaUrl}/rest/v1/board_items?status=neq.archived&select=*`, {
      headers: {
        Authorization: `Bearer ${supaKey}`,
        apikey: supaKey,
      },
    }).catch(() => null);

    if (!res || !res.ok) {
      await ctx.reply('Could not fetch board state');
      return;
    }

    const items: any[] = await res.json();
    const output = await formatPulse(items);
    await replyChunked(ctx, output);
  } catch (e) {
    console.error('[zoe/index] pulse command failed:', e);
    await ctx.reply(`Pulse failed: ${sanitizeErrorForUser(e)}`);
  }
});

// Shared agenda body so /agenda and its /list alias run the SAME handler.
// (Previously /list did `ctx.api.sendMessage(chat, '/agenda')`, which posted the
// literal text "/agenda" from the bot - it never ran the handler, so /list did
// nothing.)
async function sendAgenda(ctx: Context): Promise<void> {
  try {
    const supaUrl = process.env.SUPABASE_URL;
    const supaKey = process.env.SUPABASE_ANON_KEY;

    if (!supaUrl || !supaKey) {
      await ctx.reply('Board integration not configured (missing SUPABASE_URL + SUPABASE_ANON_KEY)');
      return;
    }

    const res = await fetch(`${supaUrl}/rest/v1/board_items?status=neq.archived&select=*`, {
      headers: {
        Authorization: `Bearer ${supaKey}`,
        apikey: supaKey,
      },
    }).catch(() => null);

    if (!res || !res.ok) {
      await ctx.reply('Could not fetch board state');
      return;
    }

    const items: any[] = await res.json();
    const output = await formatAgenda(items);
    await replyChunked(ctx, output);
  } catch (e) {
    console.error('[zoe/index] agenda command failed:', e);
    await ctx.reply(`Agenda failed: ${sanitizeErrorForUser(e)}`);
  }
}

bot.command('agenda', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  await sendAgenda(ctx);
});

bot.command('list', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  // /list is an alias for /agenda (show all items).
  await sendAgenda(ctx);
});


// Auto-allowlist: when someone is added to a CONFIGURED group, add them to that
// group's member_allowlist so they can talk to ZOE. Without this, a new member
// is silently ignored by shouldRespond (sender not in allowlist) - so "add a
// person to the chat" would not work. Only fires for groups ZOE already knows
// (getGroupConfig != null), never for random chats; bots are skipped.
bot.on('message:new_chat_members', async (ctx) => {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  const cfg = await getGroupConfig(chatId);
  if (!cfg) return;
  const added: string[] = [];
  for (const member of ctx.message?.new_chat_members ?? []) {
    if (member.is_bot) continue;
    try {
      await addAllowlistMember(chatId, member.id);
      added.push(member.first_name || String(member.id));
    } catch (err) {
      console.error('[zoe] auto-allowlist failed for', member.id, err);
    }
  }
  if (added.length > 0) {
    console.log(`[zoe] auto-allowlisted ${added.length} new member(s) in ${cfg.chat_title}: ${added.join(', ')}`);
    const threadId = ctx.message?.message_thread_id;
    await ctx
      .reply(`Welcome ${added.join(', ')} - you can talk to me right here.`, threadId ? { message_thread_id: threadId } : {})
      .catch(() => undefined);
  }
});


bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return; // commands handled above

  // Cockpit button-bar taps arrive as plain text (a reply keyboard sends the
  // label). Intercept them BEFORE the concierge treats them as conversation,
  // and route each to its existing action. Zaal-only + private chat.
  if (isFromZaal(ctx) && ctx.chat.type === 'private' && isBarLabel(text)) {
    try {
      if (text === 'Agenda') {
        await sendAgenda(ctx);
      } else if (text === 'Budget') {
        await ctx.reply(formatSpendStatus(false));
      } else if (text === 'Focus') {
        if (await isFocusMode()) {
          const released = await endFocus();
          await ctx.reply(`Focus OFF. ${released.length} queued ping${released.length === 1 ? '' : 's'} released.`);
        } else {
          await startFocus();
          await ctx.reply('Focus ON. Non-urgent pings queue until you tap Focus again.');
        }
      } else if (text === 'Note') {
        await ctx.reply('Send it as: note: <your thought>');
      } else if (text === 'Board') {
        const boardUrl = process.env.BOARD_MINI_URL || 'https://thezao.xyz/board';
        await ctx.reply('ZAO board:', { reply_markup: new InlineKeyboard().url('Open board', boardUrl) });
      }
    } catch (e) {
      console.error('[zoe/index] button-bar action failed:', e);
      await ctx.reply(`That action hit a snag: ${sanitizeErrorForUser(e)}`);
    }
    return;
  }

  const chatType = ctx.chat.type;
  const chatId = ctx.chat.id;

  // FEATURE 6: BATCH-ANSWER parsing
  // Parse "1:A 2:best 3:skip" format for multi-question answers
  if (chatType === 'private' && isFromZaal(ctx) && text.includes(':') && /^\d+:|^[a-z]+:/i.test(text.trim())) {
    const answers = parseBatchAnswer(text);
    if (answers.length > 0) {
      // Log each batch answer
      for (const ans of answers) {
        const logText = `[batch-answer] ${ans.choice}: ${ans.value}`;
        await pushRecent(
          { from: 'zaal', text: logText, sender: 'batch-answer' },
          String(chatId),
        ).catch((e) => console.error('[zoe/index] batch-answer log failed:', (e as Error)?.message));
      }
      await ctx.reply(`Logged ${answers.length} answer${answers.length !== 1 ? 's' : ''} from batch.`);
      return;
    }
  }


  // Reply-bridge for teammate ack: when Zaal replies to one of our asks,
  // handle either the legacy "what should I reply?" flow or the new draft-approval flow.
  if (chatType === 'private' && isFromZaal(ctx) && ctx.message.reply_to_message?.message_id) {
    const replyToId = ctx.message.reply_to_message.message_id;
    try {
      // Resolve-by-reply: if Zaal replied to the pinned OPEN grill question, his
      // text is the resolution. Record it, move the source task off the board's
      // needs-you queue, unpin, and advance to the next grill item. This is the
      // "what do I press to resolve" answer - a reply IS the resolve.
      const gr = await resolveGrillByReply(replyToId, text.trim());
      if (gr) {
        const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        await pushRecent(
          { from: 'zaal', text: `[grill-resolve] ${gr.title ?? gr.key}: ${gr.value}`, sender: 'grill' },
          String(gid || zaalId),
        ).catch((e) => console.error('[zoe/grill] resolve log failed:', (e as Error)?.message));
        await resolveTaskDecision(gr.key, gr.value).catch((e) =>
          console.error('[zoe/grill] board resolve failed:', (e as Error)?.message),
        );
        await ctx.api.unpinChatMessage(zaalId, replyToId).catch(() => {});
        await ctx.reply(`Resolved: ${gr.value}. Logged it and moved it off your plate.`);
        await surfaceGrill({ ...grillDeps(zaalId), bypassCap: true }).catch((e) =>
          console.error('[zoe/grill] advance failed:', (e as Error)?.message),
        );
        return;
      }

      // Try draft flow first
      const draft = await getPendingDraft(replyToId);
      if (draft) {
        // Draft approval/edit/skip handler
        const trimmed = text.trim();
        const firstChar = trimmed.charAt(0);

        if (firstChar === '1') {
          // APPROVE: post the draft as-is
          const success = await postDraftAnswerToTask(draft, draft.draftAnswer);
          if (success) {
            await clearPendingDraft(replyToId);
            await ctx.reply(`Approved and posted to "${draft.taskTitle}".`);
            console.log(`[zoe/index] draft-approval reply-bridge: approved for task ${draft.taskId}`);
            return;
          } else {
            await ctx.reply('Failed to post draft to the task. Check the board API.');
            return;
          }
        } else if (firstChar === '2') {
          // EDIT: take the rest of the text as the edited answer, or ask for it
          const edited = trimmed.slice(1).trim();
          if (edited) {
            // Use the provided text as the edited answer
            const success = await postDraftAnswerToTask(draft, edited);
            if (success) {
              await clearPendingDraft(replyToId);
              await ctx.reply(`Edited and posted to "${draft.taskTitle}".`);
              console.log(`[zoe/index] draft-approval reply-bridge: edited for task ${draft.taskId}`);
              return;
            } else {
              await ctx.reply('Failed to post edited answer to the task. Check the board API.');
              return;
            }
          } else {
            // No text provided; ask for the edited version
            await ctx.reply(
              `Got it. Send me your edited answer and I'll post it. Just reply to this message with the text.`,
            );
            // For now, we'll need Zaal to send a follow-up. In a more elaborate version,
            // we could store an "awaiting edit" state, but for MVP this is good enough.
            return;
          }
        } else if (firstChar === '3') {
          // SKIP: post a contextual "noted" ack instead of the draft
          // For now, just clear the draft and acknowledge
          await clearPendingDraft(replyToId);
          await ctx.reply(`Skipped the draft for "${draft.taskTitle}". The task already has a "Noted" ack.`);
          console.log(`[zoe/index] draft-approval reply-bridge: skipped for task ${draft.taskId}`);
          return;
        } else {
          // Unrecognized input; remind user of options
          await ctx.reply('Reply with 1 (approve), 2 (edit), or 3 (skip).');
          return;
        }
      }

      // Try legacy reply flow (ask-first)
      const pending = await getPendingReply(replyToId);
      if (pending) {
        const success = await postZaalReplyToTask(pending, text);
        if (success) {
          await clearPendingReply(replyToId);
          await ctx.reply(`Posted your reply to "${pending.taskTitle}". Done.`);
          console.log(`[zoe/index] teammate-ack reply-bridge: posted to task ${pending.taskId}`);
          return; // Exit early - don't process as a normal turn
        } else {
          await ctx.reply('Failed to post reply to the task. Check the board API.');
          return;
        }
      }
    } catch (err) {
      console.warn('[zoe/index] reply-bridge handler failed (nbd):', (err as Error)?.message);
      // Fall through to normal message handling if the bridge fails
    }

    // FEATURE 1: REPLY-TO-ROUTE + QUESTION-CONTEXT
    // If Zaal replies to a ZOE question message (without matching draft/pending flows),
    // look up the message ID and route as [answer:qid]
    if (chatType === 'private' && isFromZaal(ctx) && ctx.message.reply_to_message?.message_id) {
      const result = await handleReplyRoute(ctx, { isFromZaal: true });
      if (result.handled) {
        if (result.contextType === 'question') {
          await ctx.reply(`Got your answer for ${result.id}. Processing...`);
        } else if (result.contextType === 'task') {
          await ctx.reply(`Got your reply to task ${result.id}. Processing...`);
        }
        return;
      }
    }
  }

  // DM path: Zaal-only allowlist preserved.
  if (chatType === 'private') {
    if (!isFromZaal(ctx)) return;
    // #51 typed-answer capture: a PLAIN typed message that is option-shaped for
    // the active grill decision ("2", "map", "1 and 3") resolves it directly -
    // previously only button taps and exact swipe-replies registered, so a
    // typed answer sat unregistered until Zaal tapped Later. Only fires on an
    // exact option match, so normal DM chat is never eaten.
    if (!ctx.message.reply_to_message) {
      try {
        const active = await getActiveGrill();
        const matched = active ? matchTypedAnswer(text, active.options) : null;
        if (active && matched) {
          const r = await applyGrillAnswer(matched);
          if (r.key) {
            const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
            await pushRecent(
              { from: 'zaal', text: `[grill-answer] ${r.title ?? r.key}: ${matched}`, sender: 'grill' },
              String(gid || zaalId),
            ).catch((e) => console.error('[zoe/grill] typed-answer log failed:', (e as Error)?.message));
            await resolveTaskDecision(r.key, matched).catch((e) =>
              console.error('[zoe/grill] board resolve failed:', (e as Error)?.message),
            );
            // Strip the now-answered card's buttons (best-effort).
            if (active.messageId) {
              await ctx.api
                .editMessageReplyMarkup(zaalId, active.messageId, { reply_markup: { inline_keyboard: [] } })
                .catch(() => {});
            }
            await ctx.reply(`Locked in: ${matched}. Logged it and moved it off your plate.`);
            await surfaceGrill({ ...grillDeps(zaalId), bypassCap: true }).catch((e) =>
              console.error('[zoe/grill] advance failed:', (e as Error)?.message),
            );
            return;
          }
        }
      } catch (e: unknown) {
        console.error('[zoe/grill] typed-answer capture failed:', (e as Error)?.message);
      }
    }
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

    // THREAD ID LOGGER: when a message arrives in a forum topic, log the topic
    // name + thread_id so Zaal can discover all topic IDs by just sending a
    // message in each one. This is how the curator learns the topic mapping.
    if (threadId && ctx.chat.is_forum) {
      const topicNameForLog = await topicNameForThread(threadId).catch(() => undefined);
      if (topicNameForLog) {
        void logTopicThreadId(topicNameForLog, threadId).catch((e) =>
          console.warn('[zoe/index] thread_id logging failed (nbd):', (e as Error)?.message),
        );
      }
    }

    // NATIVE REPLY ROUTING: if Zaal replied DIRECTLY to a message with recorded
    // context (e.g. a relay push, qid "rl-<lane>"), route it as "[answer:<qid>]"
    // so the orchestrator reads it the same way the "Type my own" button does -
    // no button tap needed. Mirrors the private-DM handleReplyRoute path so a
    // plain reply to a relay message routes back to its lane.
    if (ctx.message.reply_to_message?.message_id) {
      const routed = await handleReplyRoute(ctx, { isFromZaal: isFromZaal(ctx) }).catch(
        () => ({ handled: false as const }),
      );
      if (routed.handled && routed.contextType === 'question') {
        await ctx
          .reply(`Got your answer for "${routed.id}".`, threadId ? { message_thread_id: threadId } : {})
          .catch(() => {});
        return;
      }
    }

    // Per-topic behavior (topic = intent, Zaal 2026-07-11): dropping a plain
    // message into a topic auto-acts per that topic. Internal actions fire now;
    // outbound casts are drafted with an Approve button (money/public gate).
    // If Zaal just tapped a question's "Type my own" button, this message is his
    // typed answer - log it as "[answer:<qid>]" (matching the tapped-button path)
    // and stop, so the orchestrator reads it as the answer, not a topic action.
    const awaitingQid = pendingTypeAnswers.get(chatId);
    if (awaitingQid) {
      pendingTypeAnswers.delete(chatId);
      // Relay answer -> route instantly + skip the [answer] log (tick would double-route).
      if (await tryInstantRelayReply(awaitingQid, text, new Date().toISOString())) {
        await ctx
          .reply(`Sent to ${awaitingQid.replace(/^rl-/, '')}.`, threadId ? { message_thread_id: threadId } : {})
          .catch(() => {});
        return;
      }
      await pushRecent(
        { from: 'zaal', text: `[answer:${awaitingQid}] ${text}`, sender: 'zaalbotz-type' },
        String(zaalBotzGroupId),
      ).catch((e) => console.error('[zoe/index] type-answer log failed:', (e as Error)?.message));
      await ctx
        .reply(`Got your answer for "${awaitingQid}".`, threadId ? { message_thread_id: threadId } : {})
        .catch(() => {});
      return;
    }

    // COMBO (Zaal 2026-07-29): General is the gesture-free ANSWER surface. A plain
    // typed message in General (no topic thread) answers the last relay/question ZOE
    // pushed - no swipe, no button. Topics + DM stay normal chat, so this fires ONLY
    // in General (threadId falsy) and only when something is armed. "use zaalbots as
    // just a response, normal chat -> DM."
    if (!threadId) {
      const armedQid = takePendingAnswer(zaalBotzGroupId);
      if (armedQid) {
        // Relay answer -> route to its lane INSTANTLY (no 5-min tick lag) and do
        // NOT log [answer] (the tick would double-route). Non-relay (orchestrator
        // question) falls through to the tick path.
        if (await tryInstantRelayReply(armedQid, text, new Date().toISOString())) {
          await ctx.reply(`Sent to ${armedQid.replace(/^rl-/, '')}.`).catch(() => {});
          return;
        }
        await pushRecent(
          { from: 'zaal', text: `[answer:${armedQid}] ${text}`, sender: 'zaalbotz-general' },
          String(zaalBotzGroupId),
        ).catch((e) => console.error('[zoe/index] general-answer log failed:', (e as Error)?.message));
        await ctx.reply(`Got your answer for "${armedQid}".`).catch(() => {});
        return;
      }
    }

    const topicName = await topicNameForThread(threadId).catch(() => undefined);
    let action = routeTopic(topicName);
    const threadOpt = threadId ? { message_thread_id: threadId } : {};

    // Brand masks (doc 1021): detect brand topics and fetch ICM context to respond
    // in-character. If brain fetch succeeds, treat as chat action with brand context.
    // If no brain or fetch fails, fall back to default routing (draft for brand topics).
    let brandContext: string | undefined;
    const brandBoxId = brandBoxFor(topicName);
    if (brandBoxId) {
      const brainText = await fetchIcmBrain(brandBoxId).catch(() => null);
      if (brainText) {
        brandContext = brandSystemPreamble(brainText, topicName ?? 'Brand');
        // Override the draft routing to chat routing when we have brand context.
        action = { kind: 'chat' };
      }
    }

    // Research topic reroute: a plain topic or URL is a research subject, but a
    // conversational follow-up/command ("can u share it with me", "thanks") is
    // NOT - queuing it spins a worker to "research" that phrase (audit afaa850).
    // Reroute those to chat so ZOE answers instead of producing a junk doc.
    if (action.kind === 'research' && !extractFirstUrl(text) && isFollowUpNotResearch(text)) {
      action = { kind: 'chat' };
    }

    // Bridge log: record EVERY ZAAL BOTZ turn (all topics, incl auto-act ones)
    // under the group scope so an open Claude Code session can SSH-read Zaal's
    // topic replies and route them to the right worker (the inbox-bridge loop).
    // Text is prefixed with the topic so the reader knows which lane he replied in.
    void pushRecent(
      { from: 'zaal', text: `[${topicName ?? 'General'}] ${text}`, sender: 'zaalbotz' },
      String(zaalBotzGroupId),
    ).catch((e) => console.error('[zoe/index] zaalbotz bridge-log failed:', (e as Error)?.message));

    if (action.kind === 'research') {
      // Dedupe guard: check if this URL was already researched
      const url = extractFirstUrl(text);
      if (url) {
        const researched = await wasResearched(url, join(repoDir, 'research')).catch((e) => {
          console.error('[zoe/index] dedupe check failed (fail-open):', (e as Error)?.message);
          return false;
        });
        if (researched) {
          await ctx
            .reply('Already researched that link — see the Research topic.')
            .catch(() => {});
          return;
        }
      }

      await enqueueWork(text, { chatId, threadId }).catch((e) =>
        console.error('[zoe/index] research enqueue failed:', (e as Error)?.message),
      );
      await ctx
        .reply("On it - researching this. I'll post the doc + PR here when it lands.")
        .catch(() => {});
      // Kick the work-loop now so it starts immediately (else waits for the 2h cron).
      void runWorkTick({
        sendToZaal: (t: string) => sendToZaalRouted(routingDeps, t, { kind: 'status' }),
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
      // Draft text is LLM-length; chunk the send, keyboard on the LAST chunk
      // so Post/Skip/Edit sits at the bottom of the draft.
      await sendChunkedToTelegram(
        (cid, t, o) => bot.api.sendMessage(cid, t, o as never),
        chatId,
        `${action.label}:\n${text}`,
        { baseOpts: { ...threadOpt }, replyMarkup: draftKeyboard(id), markupOn: 'last' },
      ).catch(() => {});
      return;
    }

    // action.kind === 'chat': normal ZOE conversation (Handoffs, Claude Code, etc).
    // May include brand-masked responses with ICM context injected.
    const quotedG = ctx.message.reply_to_message?.text ?? ctx.message.reply_to_message?.caption;
    const turnTextG = quotedG
      ? `[Zaal is replying to your earlier message:\n"${quotedG.slice(0, 1200)}"]\n\nHis reply: ${text}`
      : text;
    enqueueTurn(chatId, () => handlePrivateMessage(ctx, turnTextG, brandContext)).catch((e) =>
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
    await ctx.reply(`Could not transcribe that - ${sanitizeErrorForUser(err, { log: true })}`).catch(() => {});
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
    await ctx.reply(`Could not fetch that ${label} - ${sanitizeErrorForUser(err, { log: true })}`).catch(() => {});
    return;
  }
  // FEATURE 2: FILE/PHOTO/LINK AUTO-ROUTE
  // Classify the intent based on caption + media type, then log and reply
  const hasPhoto = !!ctx.message.photo;
  const hasFile = !!ctx.message.document;
  const hasUrl = /https?:\/\/\S+/i.test(caption);

  let autoRouteGuess = '';
  if (hasPhoto || hasFile || hasUrl) {
    const intent = await classifyIntent(caption, hasFile, hasPhoto, hasUrl);
    autoRouteGuess = `auto-routed: ${intent} - `;
    try {
      const guess = `[classify:${intent}] ${caption || label}`;
      await pushRecent(
        { from: 'zaal', text: guess, sender: 'auto-classify-media' },
        String(chatId),
      ).catch((e) => console.error('[zoe/index] auto-classify log failed:', (e as Error)?.message));
    } catch {
      // best-effort
    }
  }

  await ctx.reply(`Got the ${label === 'image' ? 'image' : `file (${label})`} - ${autoRouteGuess}looking at it...`).catch(() => {});
  const note = caption ? `${caption}\n\n` : '';
  const turnText = `${note}[Zaal sent ${label === 'image' ? 'an image' : `a file named ${label}`}, saved at ${savedPath}. Use the Read tool to view it, then respond to ${caption ? 'the message above' : 'what it contains'}.]`;
  enqueueTurn(chatId, () => handlePrivateMessage(ctx, turnText), {
    onDeferred: () => {
      ctx.reply("Got that - finishing what I'm on, then I'll pick it up.").catch(() => {});
    },
  }).catch((e) => console.error('[zoe/index] media turn failed:', (e as Error)?.message));
});

async function handlePrivateMessage(ctx: Context, text: string, brandContext?: string): Promise<void> {
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
      console.error('[zoe/index] note save failed:', err);
      await ctx.reply(`(note save failed - ${sanitizeErrorForUser(err)})`);
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
      sendToZaal: (t: string) => sendToZaalRouted(routingDeps, t, { kind: 'status' }),
      sendToChat: (chatId: number, threadId: number | undefined, t: string) =>
        bot.api.sendMessage(chatId, t, threadId ? { message_thread_id: threadId } : {}),
      defaultResearchTarget: researchTopicTarget(),
      zaalTgId: zaalId,
      repoDir,
      currentDate: currentDateString(),
    }).catch((e) => console.error('[zoe/index] work-loop kick failed:', (e as Error).message));
    return;
  }

  // Hyperfocus guard: `/focus` or `/focus on` enables focus mode.
  if (FOCUS_ON_RE.test(text.trim())) {
    await startFocus();
    await ctx.reply('Focus mode ON. Non-urgent pings will queue until you send /focus off.');
    return;
  }

  // Hyperfocus guard: `/focus off` disables focus mode and sends queued digest.
  if (FOCUS_OFF_RE.test(text.trim())) {
    const queuedPings = await endFocus();
    const digest = buildFocusDigest(queuedPings);
    await ctx.reply('Focus mode OFF.\n\n' + digest);
    return;
  }

  // Session checkpoint: `/checkpoint <note>` saves a breadcrumb.
  const checkpointMatch = CHECKPOINT_PREFIX.exec(text);
  if (checkpointMatch) {
    if (!ctx.chatId) return;
    const chatId = ctx.chatId.toString();
    await saveCheckpoint(chatId, checkpointMatch[1]);
    await ctx.reply(`Checkpoint saved: "${checkpointMatch[1].slice(0, 60)}${checkpointMatch[1].length > 60 ? '...' : ''}"`);
    return;
  }

  // Trust audit: `/audit` scans for fallen tasks/captures.
  if (AUDIT_COMMAND_RE.test(text.trim())) {
    if (!ctx.chatId) return;
    const progress = startProgressNarration(ctx, ctx.chatId, { first: 'Running audit...' });
    try {
      const report = await runAudit([], Date.now());
      const formatted = formatAuditForTelegram(report);
      progress.stop();
      await replyChunked(ctx, formatted);
    } catch (err) {
      progress.stop();
      console.error('[zoe/index] audit failed:', err);
      await ctx.reply(`Audit failed: ${sanitizeErrorForUser(err)}`);
    }
    return;
  }

  // Budget status: `/budget` shows today's spend and remaining headroom.
  if (BUDGET_COMMAND_RE.test(text.trim())) {
    const detailed = text.toLowerCase().includes('detailed');
    try {
      const budgetText = formatSpendStatus(detailed);
      await ctx.reply(budgetText);
    } catch (err) {
      console.error('[zoe/index] budget lookup failed:', err);
      await ctx.reply(`Budget lookup failed: ${sanitizeErrorForUser(err)}`);
    }
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

  await dispatchConcierge(ctx, text, 'private', 'Zaal', brandContext);
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
  messages: { first: string | null; second?: string },
): ProgressHandle {
  ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  const typingInterval = setInterval(() => {
    ctx.api.sendChatAction(chatId, 'typing').catch(() => {});
  }, TYPING_REFRESH_MS);
  // Conversational turns pass first=null: no "working on it" filler (ack-theater).
  // The native typing indicator still runs; a genuinely long turn can still emit
  // the honest `second` ping. Work turns keep both. (zoe-conversational spec).
  const firstAck = messages.first
    ? setTimeout(() => {
        ctx.reply(messages.first as string).catch(() => {});
      }, ACK_THRESHOLD_MS)
    : null;
  const secondAck = messages.second
    ? setTimeout(() => {
        ctx.reply(messages.second as string).catch(() => {});
      }, SECOND_NARRATION_MS)
    : null;
  return {
    stop: () => {
      clearInterval(typingInterval);
      if (firstAck) clearTimeout(firstAck);
      if (secondAck) clearTimeout(secondAck);
    },
  };
}

/**
 * Run one DM build and narrate every phase back into the same chat.
 *
 * The narrator already exposed EIGHT hooks - coder start/done, critic
 * start/done, retry, escalate, fail, PR. #2956 wired three of them, which is why
 * a build went quiet after "on it" and only spoke again at the end. A silent
 * three-minute gap is indistinguishable from a hang, and the natural response to
 * a hang is to send the request again - which is how you get two builds.
 *
 * So: every hook reports. Retries especially, because a retry is the single most
 * reassuring thing to see - it means the critic caught something and the loop is
 * working, not that it is stuck.
 */
async function startDmBuild(chatId: number, task: string, reason: string): Promise<void> {
  beginBuild(chatId, task);

  // ONE message that updates, not six that pile up. Found by reading the
  // Telegram Bot API changelog: ZOE only ever edited messages inside button
  // callbacks and had never held a message id across a long operation, so a
  // single build emitted start / coded / critic / retry / PR as separate blocks -
  // a screenful on a phone to find the one line that matters.
  const live = new LiveStatus({
    send: async (text, markup) => {
      const m = await bot.api
        .sendMessage(chatId, text, markup ? { reply_markup: markup as never } : {})
        .catch(() => null);
      return m?.message_id ?? null;
    },
    edit: async (messageId, text, markup) => {
      await bot.api.editMessageText(chatId, messageId, text, {
        ...(markup ? { reply_markup: markup as never } : {}),
      });
    },
  });

  const startedAt = Date.now();
  const history: string[] = [];
  const show = (phase: string, opts: { done?: boolean; force?: boolean } = {}) =>
    live.render(
      renderBuildStatus({
        task,
        phase,
        history,
        elapsedSec: Math.round((Date.now() - startedAt) / 1000),
        done: opts.done,
      }),
      opts.done ? undefined : runningKeyboard(),
      opts.force ?? opts.done,
    );

  await show(`Building (${reason})`);

  void dispatchHermesRun(
    {
      triggered_by_telegram_id: zaalId,
      triggered_in_chat_id: chatId,
      issue_text: task,
      shouldCancel: () => isCancelRequested(chatId),
    },
    {
      onCoderStart: async (runId, attempt, max) => {
        setRunId(chatId, runId);
        setPhase(chatId, `coding (attempt ${attempt}/${max})`);
        await show(`Coding - attempt ${attempt}/${max}`);
      },
      onCoderDone: async (_id, _attempt, filesChanged) => {
        setPhase(chatId, 'coded, awaiting critic');
        const n = filesChanged.length;
        history.push(`wrote ${n} file${n === 1 ? '' : 's'}: ${filesChanged.slice(0, 3).join(', ')}`);
        await show('Critic reviewing');
      },
      onCriticStart: async () => {
        setPhase(chatId, 'critic reviewing');
        await show('Critic reviewing');
      },
      onCriticDone: async (_id, score) => {
        setPhase(chatId, `critic scored ${score}/10`);
        history.push(`critic scored ${score}/10`);
        await show(`Critic scored ${score}/10`);
      },
      // A retry is GOOD news - the critic caught something and the loop works.
      // Said plainly, or it reads as failure.
      onRetry: async (_id, nextAttempt, feedback) => {
        setPhase(chatId, `retrying (attempt ${nextAttempt})`);
        history.push(`retry ${nextAttempt}: ${feedback.slice(0, 90)}`);
        await show(`Critic pushed back - going again (attempt ${nextAttempt})`);
      },
      onPrOpened: async (_id, prNumber, prUrl, score) => {
        const followUp = takeFollowUp(chatId);
        endBuild(chatId);
        await live.flush();
        history.push(`PR #${prNumber} opened`);
        await live.render(
          renderBuildStatus({
            task,
            phase: `Built it: PR #${prNumber} (critic ${score}/10) - yours to merge`,
            history,
            elapsedSec: Math.round((Date.now() - startedAt) / 1000),
            done: true,
          }),
          doneKeyboard(prUrl),
          true,
        );
        if (followUp) await runQueuedFollowUp(chatId, followUp);
      },
      onEscalated: async (_id, escalateReason) => {
        const followUp = takeFollowUp(chatId);
        endBuild(chatId);
        await live.flush();
        await show(`Stopped - needs your eyes: ${escalateReason.slice(0, 180)}`, { done: true });
        if (followUp) await runQueuedFollowUp(chatId, followUp);
      },
      onFailed: async (_id, failReason) => {
        const cancelled = failReason.includes('cancelled');
        const followUp = takeFollowUp(chatId);
        endBuild(chatId);
        await live.flush();
        await show(
          cancelled ? 'Stopped. No PR opened, nothing merged.' : `Could not build it: ${failReason.slice(0, 180)}`,
          { done: true },
        );
        // A cancel makes a queued correction stale - surface it, do not run it.
        if (followUp) {
          if (cancelled) {
            await bot.api
              .sendMessage(chatId, `You had queued: "${followUp.slice(0, 140)}"\nSend it again if you still want it.`)
              .catch(() => {});
          } else {
            await runQueuedFollowUp(chatId, followUp);
          }
        }
      },
    },
  ).catch(async (e) => {
    endBuild(chatId);
    await show(`Build pipeline error: ${(e as Error).message.slice(0, 160)}`, { done: true });
  });
}

/** Run the correction Zaal queued mid-build, once the first run has ended. */
async function runQueuedFollowUp(chatId: number, text: string): Promise<void> {
  const say = (t: string) => bot.api.sendMessage(chatId, t).catch(() => {});
  const intent = detectBuildIntent(text);
  if (!intent.build || !intent.task) {
    // It was a comment, not a build. Say so plainly rather than silently
    // dropping it - a swallowed message is how trust in the surface dies.
    await say(`Your follow-up did not read as a build (${intent.reason}), so I left it:\n"${text.slice(0, 160)}"`);
    return;
  }
  await say(`Now the follow-up: "${intent.task.slice(0, 140)}"`);
  await startDmBuild(chatId, intent.task, intent.reason);
}

async function dispatchConcierge(
  ctx: Context,
  text: string,
  scope: ChatScope,
  label: string,
  brandContext?: string,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;

  // BUILD FROM THE DM, AND BE ABLE TO TALK TO IT WHILE IT RUNS.
  //
  // #2956 wired the DM to the coder (a 1 -> ~4: you can start a build and get a
  // PR link). This adds the part that makes it a conversation rather than a
  // fire-and-forget button: real phase-by-phase progress, "stop", and a
  // correction that queues instead of starting a competing second build.
  //
  // Flag-gated (ZOE_DM_BUILD=1, default OFF). PR-only is what makes auto-
  // dispatch safe: the pipeline opens a PR, a human merges (agent-loops rule 8).
  // "reply <id> <your words>" - the syntax every bus message tells him to type.
  //
  // Until now nothing parsed it, so typing it fell through to the concierge and
  // was answered as ordinary chat. bus-bridge.ts has had parseBusReply() for
  // exactly this and was left deliberately unwired; this is that wiring step.
  //
  // Checked BEFORE the build classifier, because "reply ab12cd fix the api" must
  // be a bus reply, not a build request - the prefix is explicit and wins.
  if (scope === 'private') {
    const busReply = parseBusReply(text);
    if (busReply) {
      const res = await sendBusReply({
        to: process.env.BUS_PARTNER ?? 'coordinator',
        subject: replySubject(),
        body: busReply.text,
      });
      await ctx.reply(res.reply).catch(() => {});
      if (!res.ok) {
        console.warn(`[zoe/index] bus reply not sent (${res.reason}) - text preserved in the chat`);
      }
      return;
    }
  }

  if (scope === 'private' && process.env.ZOE_DM_BUILD === '1') {
    const running = getActiveBuild(chatId);

    // A message arriving DURING a build is about that build. Treating it as a
    // fresh turn is what made mid-run corrections either start a second build or
    // disappear into the concierge while the wrong PR kept going.
    if (running) {
      if (isStopRequest(text)) {
        requestCancel(chatId);
        await ctx
          .reply(
            'Stopping after the current attempt - killing it mid-attempt would leave a ' +
              'half-written worktree and nothing to show for the tokens. No PR will open.',
          )
          .catch(() => {});
        return;
      }
      const { replaced } = queueFollowUp(chatId, text);
      await ctx
        .reply(
          `${describeActive(running)}\n\n` +
            (replaced
              ? 'Swapped your correction for this newer one - I keep only the latest, so you get one PR, not three.'
              : 'Queued that as the follow-up. It runs when this finishes.') +
            '\nSay "stop" to drop the current one instead.',
        )
        .catch(() => {});
      return;
    }

    const intent = detectBuildIntent(text);
    if (intent.build && intent.task) {
      await startDmBuild(chatId, intent.task, intent.reason);
      return;
    }
    // Declined, but borderline: offer the tap instead of making him retype the
    // whole thing with a `build:` prefix. The classifier stays stingy; the COST
    // of its stinginess drops to one button.
    if (worthOffering(text, intent.reason)) {
      const key = stashPending(text);
      await ctx
        .reply(`Want me to build that? (${intent.reason})`, { reply_markup: maybeKeyboard(key) })
        .catch(() => {});
      return;
    }
  }

  // Conversational turns (short chat, no link/plan/build) answer directly on the
  // quick model with NO "working on it" ack. Real work keeps the honest progress
  // narration + default/hard model. (zoe-conversational spec, 2026-07-16).
  const conversational = isConversationalTurn(text);
  const progress = startProgressNarration(ctx, chatId, {
    first: conversational ? null : 'Got it. Working on this one - reply incoming.',
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
      await ctx.reply(`Past today's ${budget.cap}-call budget (${budget.count}). Still answering, but worth a glance.`).catch(() => {});
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
      // Chat -> quick model for instant replies; real work -> selectModel picks
      // default/hard. (zoe-conversational spec).
      model: conversational ? ZOE_QUICK_MODEL : undefined,
      recallContext,
      brandContext,
      linkResearchIntent: wantsLinkResearch(text),
      // Conversational turns skip task/quest/thread context blocks (irrelevant overhead).
      conversational,
      context: {
        zaal_tg_id: zaalId,
        workspace_dir: repoDir,
        current_date: currentDateString(),
      },
    });

    if (result.task_ops.length > 0) {
      const { added } = await applyTaskOps(result.task_ops);
      // Mirror new captures into the Supabase tracker WITH context, so a voice/
      // forward/DM capture becomes a self-explaining grill card (not a bare title).
      if (added.length > 0) {
        await mirrorCapturesToTracker(added).catch((e) =>
          console.warn('[zoe/index] capture->tracker mirror failed (nbd):', (e as Error).message),
        );
      }
    }

    if (result.quest_ops.length > 0) {
      await applyQuestOps(result.quest_ops);
    }

    // Deeper memory: persist decision ops (increment 1)
    for (const op of result.decision_ops) {
      try {
        await appendDecision({
          decision: op.decision,
          rationale: op.rationale,
          context: op.context,
        });
      } catch (err) {
        console.error('[zoe/index] decision op failed:', (err as Error).message);
      }
    }

    // Deeper memory: persist build-state ops (increment 1)
    for (const op of result.build_state_ops) {
      try {
        await appendBuildState({
          feature: op.feature,
          status: op.status,
          pr: op.pr,
          branch: op.branch,
          reason: op.reason,
        });
      } catch (err) {
        console.error('[zoe/index] build-state op failed:', (err as Error).message);
      }
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

    if (process.env.DEBUG_ZOE) {
      console.log(
        `[zoe/index] turn handled — scope=${scope} sender=${label} model=${result.model} cost=$${result.costUsd.toFixed(
          4,
        )} tokens=${result.inputTokens}/${result.outputTokens} duration=${result.durationMs}ms`,
      );
    }
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

// One-click ANSWER: for a decision with baked-in options (pick 1/2/3, yes/no),
// the buttons ARE the options. Tapping records the answer, logs the decision so
// ZOE's brain + loops act on it, then surfaces the next item.
bot.callbackQuery(/^grill:ans:(.+)$/, async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const value = ctx.match[1];
  const r = await applyGrillAnswer(value);
  await ctx.answerCallbackQuery({ text: r.note }).catch(() => {});
  await ctx
    .editMessageText(grillResolvedText(ctx.callbackQuery.message?.text, `Locked in: ${value}`), {
      reply_markup: { inline_keyboard: [] },
    })
    .catch(() => {});
  if (r.key) {
    const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
    await pushRecent(
      { from: 'zaal', text: `[grill-answer] ${r.title ?? r.key}: ${value}`, sender: 'grill' },
      String(gid || zaalId),
    ).catch((e) => console.error('[zoe/grill] answer log failed:', (e as Error)?.message));
    // Move the resolved decision off the board's needs-you queue (best-effort).
    await resolveTaskDecision(r.key, value).catch((e) =>
      console.error('[zoe/grill] board resolve failed:', (e as Error)?.message),
    );
  }
  await surfaceGrill({ ...grillDeps(zaalId), bypassCap: true }).catch((e) =>
    console.error('[zoe/grill] advance failed:', (e as Error)?.message),
  );
});

// #51 multi-choice: "Pick multiple" swaps the card's keyboard for toggle rows
// ([x]/[ ] per option) + Send/Cancel. Single taps elsewhere stay instant.
bot.callbackQuery('grill:multi', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const active = await getActiveGrill();
  if (!active) {
    await ctx.answerCallbackQuery({ text: 'Nothing active.' }).catch(() => {});
    return;
  }
  await ctx.answerCallbackQuery().catch(() => {});
  await ctx
    .editMessageReplyMarkup({ reply_markup: { inline_keyboard: toGrammyRows(multiKeyboard(active.options, active.selected)) } })
    .catch(() => {});
});

bot.callbackQuery(/^grill:tog:(.+)$/, async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const r = await toggleGrillMulti(ctx.match[1]);
  if (!r) {
    await ctx.answerCallbackQuery({ text: 'Nothing active.' }).catch(() => {});
    return;
  }
  await ctx.answerCallbackQuery().catch(() => {});
  await ctx
    .editMessageReplyMarkup({ reply_markup: { inline_keyboard: toGrammyRows(multiKeyboard(r.options, r.selected)) } })
    .catch(() => {});
});

bot.callbackQuery('grill:multicancel', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const active = await getActiveGrill();
  await ctx.answerCallbackQuery().catch(() => {});
  if (!active) return;
  // Back to single-tap rows (same shape formatGrill builds for a decision).
  const answerRow = active.options.map((o) => ({ text: o.label.slice(0, 28), callback_data: `grill:ans:${o.value}`.slice(0, 60) }));
  const tailRow = [{ text: 'Skip', callback_data: 'grill:skip' }, { text: 'Later', callback_data: 'grill:snooze' }];
  if (active.options.length >= 3) tailRow.unshift({ text: 'Pick multiple', callback_data: 'grill:multi' });
  await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [answerRow, tailRow] } }).catch(() => {});
});

bot.callbackQuery('grill:multisend', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const r = await commitGrillMulti();
  if (!r) {
    await ctx.answerCallbackQuery({ text: 'Toggle at least one option first.' }).catch(() => {});
    return;
  }
  await ctx.answerCallbackQuery({ text: r.note }).catch(() => {});
  await ctx
    .editMessageText(grillResolvedText(ctx.callbackQuery.message?.text, `Locked in: ${r.value}`), {
      reply_markup: { inline_keyboard: [] },
    })
    .catch(() => {});
  if (r.key) {
    const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
    await pushRecent(
      { from: 'zaal', text: `[grill-answer] ${r.title ?? r.key}: ${r.value}`, sender: 'grill' },
      String(gid || zaalId),
    ).catch((e) => console.error('[zoe/grill] multi log failed:', (e as Error)?.message));
    await resolveTaskDecision(r.key, r.value).catch((e) =>
      console.error('[zoe/grill] board resolve failed:', (e as Error)?.message),
    );
  }
  await surfaceGrill({ ...grillDeps(zaalId), bypassCap: true }).catch((e) =>
    console.error('[zoe/grill] advance failed:', (e as Error)?.message),
  );
});

// grill:approve - the one-tap resolve for a single-action decision ("yes, do
// this") or an unblock. Records the call AND moves the source task off the
// board's needs-you queue, then advances. This is what "resolve" means for an
// item that has no clean 1/2/3 options.
bot.callbackQuery('grill:approve', async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const r = await applyGrillAnswer('approved');
  await ctx.answerCallbackQuery({ text: r.note }).catch(() => {});
  await ctx
    .editMessageText(grillResolvedText(ctx.callbackQuery.message?.text, 'Approved - on it.'), {
      reply_markup: { inline_keyboard: [] },
    })
    .catch(() => {});
  if (r.key) {
    const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
    await pushRecent(
      { from: 'zaal', text: `[grill-approve] ${r.title ?? r.key}: approved`, sender: 'grill' },
      String(gid || zaalId),
    ).catch((e) => console.error('[zoe/grill] approve log failed:', (e as Error)?.message));
    await resolveTaskDecision(r.key, 'approved').catch((e) =>
      console.error('[zoe/grill] board resolve failed:', (e as Error)?.message),
    );
  }
  await surfaceGrill({ ...grillDeps(zaalId), bypassCap: true }).catch((e) =>
    console.error('[zoe/grill] advance failed:', (e as Error)?.message),
  );
});

// Grill buttons (Done / Skip / Later) act on the active grill item, then the
// next item pops immediately - the "answer and the next one comes" behavior.
bot.callbackQuery(/^grill:(done|skip|snooze)$/, async (ctx) => {
  if (!isFromZaal(ctx)) return;
  const action = ctx.match[1] as 'done' | 'skip' | 'snooze';
  const note = await applyGrillAction(action);
  await ctx.answerCallbackQuery({ text: note }).catch(() => {});
  const outcome = action === 'done' ? 'Done.' : action === 'skip' ? 'Skipped.' : 'Later - I will bring it back.';
  await ctx
    .editMessageText(grillResolvedText(ctx.callbackQuery.message?.text, outcome), {
      reply_markup: { inline_keyboard: [] },
    })
    .catch(() => {});
  // Advance: surface the next item that needs him.
  await surfaceGrill({ ...grillDeps(zaalId), bypassCap: true }).catch((e) =>
    console.error('[zoe/grill] advance failed:', (e as Error)?.message),
  );
});

bot.callbackQuery(/^nudge:(now|later|shelve)$/, async (ctx) => {
  const action = ctx.match[1];
  // Previously this only acked + logged - the button was a no-op, so "later"
  // still nudged again on the next tick. "later"/"shelve" now actually snooze
  // the nudge stream for the cooldown window (markNudgeSent resets it); "now"
  // just acknowledges (Zaal is acting on it). Confirm the real effect to Zaal.
  const acted: Record<string, string> = { now: 'On it.', later: 'Snoozed for now.', shelve: 'Shelved for now.' };
  if (action === 'later' || action === 'shelve') {
    try {
      await markNudgeSent();
    } catch (e) {
      console.error('[zoe/index] nudge snooze failed:', e);
    }
  }
  await ctx.answerCallbackQuery({ text: acted[action] ?? 'Got it.' });
  console.log(`[zoe/index] nudge ${action} (snoozed=${action !== 'now'})`);
});

// Final callback fallback: registered LAST, so it only runs when a callback
// matched no handler above (question/veto/draft/post/nudge all pass through on
// no-match). Instead of leaving Zaal with a silent spinner on a stale/expired
// button, give feedback + log the orphan data. Only Zaal's callbacks reach here
// (non-Zaal is acked+returned at the top handler).
bot.on('callback_query:data', async (ctx) => {
  console.log(`[zoe/index] unhandled callback data: ${ctx.callbackQuery.data?.slice(0, 40)}`);
  await ctx
    .answerCallbackQuery({ text: "That button expired or isn't recognized - the message may be old." })
    .catch(() => {});
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

  // Register the `/` command menu so the underused commands are discoverable.
  await bot.api.setMyCommands(ZOE_COMMANDS).catch((err: unknown) => {
    console.error('[zoe/index] setMyCommands failed:', (err as Error).message);
  });

  startScheduler({ bot, zaalTgId: zaalId, repoDir, devzChatId, routingDeps });

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
      if (result.task_ops.length > 0) {
        const { added } = await applyTaskOps(result.task_ops);
        if (added.length > 0)
          await mirrorCapturesToTracker(added).catch((e) =>
            console.warn('[zoe/index] capture->tracker mirror failed (nbd):', (e as Error).message),
          );
      }
      let todoMarked = false;
      if (todoId) {
        const r = await markDone(todoId, 'completed by ZOE via control plane');
        todoMarked = r.ok;
      }
      coworkTask = 'idle (polling)';
      return { reply: result.reply, todo_marked: todoMarked };
    },
  });

  // Boot Discord client (optional, no-op if DISCORD_BOT_TOKEN unset).
  let discordClient: Client | null = null;
  try {
    discordClient = await bootDiscordClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zoe/index] Discord client boot failed (Telegram still active):', msg);
  }

  await bot.start({
    onStart: (info) => {
      console.log(`[zoe/index] polling as @${info.username}`);
      coworkTask = 'idle (polling)';
      void reportEvent('startup', `online as @${info.username}`, { unit: 'zoe-bot' });
    },
  });
}

void main();
