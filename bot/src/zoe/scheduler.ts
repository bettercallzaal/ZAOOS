/**
 * Scheduler — proactive nudges on cron.
 *
 * No quiet hours per Zaal feedback 2026-05-04 ("rather get pinged than ignored").
 *
 * Triggers:
 *   02:30 EST (06:30 UTC daily)  — stale capture + overdue task nudge (General topic)
 *   05:00 EST (09:00 UTC daily)  — morning brief
 *   05:00 EST (09:00 UTC daily)  — backlog grill, ONE batch (was a 2-min drip)
 *   21:00 EST (01:00 UTC daily)  — evening reflection
 *   21:00 EST (02:00 UTC daily)  — nightly recap (silent if nothing shipped)
 *   hourly                        — forward nudge: the real next move from the task queue
 *
 * Posting target: Zaal's DM via @zaoclaw_bot (chat_id from ZAAL_TELEGRAM_ID env).
 *
 * Idempotency: each trigger writes a sentinel file at ~/.zao/zoe/sentinels/<trigger>-<date>.flag
 * to prevent double-fires if the scheduler restarts mid-cycle.
 */
import cron from 'node-cron';
type ScheduledTask = { stop: () => void };
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Bot } from 'grammy';
import { generateMorningBrief } from './brief';
import { runCockpit } from '../cockpit/cockpit';
import { generateEveningReflection } from './reflect';
import { generateNightlyRecap } from './recap';
import { persistDailyDigest } from './afferent-digest';
import { rolloverNotes } from './daily-note';
import { ZOE_PATHS } from './memory';
import { nextNudge, nudgesEnabled, nudgeCooldownElapsed, markNudgeSent } from './nudges';
import { startPostsScheduler } from './posts';
import { setPending, pendingKindLabel } from './approvals';
import { runLearnCycle, renderLearnProposals } from './learn';
import { runWatcherTick, renderWatcherAlerts } from './watcher';
import { healFleet } from './fleet-health';
import { runWorkTick } from './work-loop';
import { runErrorRemediationTick, defaultRemediationDeps } from './error-remediation';
import { runRepoImproverTick } from './repo-improver-io';
import { sendChunkedToTelegram } from './tg-chunk';
import { heartCanaryEnabled, runHeartFleetCanary } from './heart-canary';
import {
  HeartFleet,
  SupabaseLeaseStore,
  executeWithLease,
  type ExecuteOutcome,
  type SupabaseLikeClient,
} from '../../../packages/heart-fleet/src/index';
import { ensureLeaseRun, resetRunReady, type RunTableClient } from './heart-run';
import { db } from '../supabase';
import { runPreflight } from './preflight';
import { shouldFireAlert, shouldPauseAutonomousWork, formatSpendStatus } from './cost-governance';
import { surfaceNewHandoffs } from './handoffs-surface';
import { surfaceZaostockApprovals } from './zaostock-approvals-surface';
import { runOrchestratorTick, runNudgePing } from './orchestrator-tick';
import { surfaceNudges } from './nudge';
import { surfaceGrill } from './grill';
import { runBacklogGrillBatch } from './backlog-grill-runner';
import { runPinnedBriefTick } from './pinned-brief-runner';
import { checkClaudeAuth } from '../hermes/claude-cli';
import { withTickLock } from './tick-lock';
import { featureRan } from './feature-ran';
import { runWithSendClass, drainDeferred, renderDeferredBatch } from './send-budget';
import { runReasoningTick, recordPush, type Candidate } from './proactive';
import { gatherEventCandidates, gatherGraphCandidates, gatherInactivityCandidates, gatherCalendarCandidates } from './events';
import { markNudged } from './threads';
import { flushEmitQueue } from './thread-memory';
import { flushQueue } from './bonfire-retry';
import { checkAndResend, readLastUserReplyAt } from './escalation';
import { reconcileUntaggedTasks, getTaskStatusByIds, autoCloseFinishedTasks } from './team-tracker';
import { ingestAllIdentities } from './fleet';
import { runTaskCommentReplies } from './task-comment-replies';
import { runMentionNotify } from './task-mention-notify';
import { runTaskTeammateAck, readPendingReplies, removePendingReply } from './task-teammate-ack';
import { runCuratorTick } from './curator';
import { runPingLifecycleTick } from './ping-lifecycle';
import { sendToZaal as sendToZaalRouted, constructRoutingDeps, type SendToZaalOptions } from './telegram-routing';
import { getOpenTeamTasks, runTeamDigest } from './team-tracker';
import { buildVetoKeyboard, type VetoTask } from './brief-veto';
import { postBriefToDiscord } from './discord-webhook';

/** await-reflection waits overnight for Zaal's reply, so a 14h TTL not 30m. */
const AWAIT_REFLECTION_TTL_MS = 14 * 60 * 60 * 1000;

const SENTINEL_DIR = join(ZOE_PATHS.home, 'sentinels');

function sentinelPath(trigger: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return join(SENTINEL_DIR, `${trigger}-${today}.flag`);
}

/**
 * Atomically claim a trigger for today (doc 770 MED). Writes the sentinel with
 * O_EXCL ('wx') BEFORE the side-effecting send, so a restart mid-send can't
 * double-fire and two racing ticks can't both proceed. Returns true iff THIS
 * call won the claim. On send failure the caller calls releaseFire() so a later
 * tick can retry.
 */
async function claimFire(trigger: string): Promise<boolean> {
  await fs.mkdir(SENTINEL_DIR, { recursive: true });
  try {
    await fs.writeFile(sentinelPath(trigger), new Date().toISOString(), { flag: 'wx' });
    return true;
  } catch {
    return false; // sentinel already exists → already fired today
  }
}

/** Release a claim so a later tick can retry (used when the send itself fails). */
async function releaseFire(trigger: string): Promise<void> {
  try {
    await fs.unlink(sentinelPath(trigger));
  } catch {
    // already gone — nothing to release
  }
}

/** Flag to enable repo-improver scout through the Heart lease layer. Default OFF. */
function repoImproverLeaseEnabled(): boolean {
  return process.env.ZOE_REPO_IMPROVER_LEASES === 'true';
}

/**
 * Cross-machine leasing for the remaining autonomous loops (work-loop and the
 * orchestrator tick).
 *
 * Why a second flag rather than reusing ZOE_REPO_IMPROVER_LEASES: these loops
 * carry a different blast radius. The repo-improver scout proposes; the work-loop
 * spends on research and opens PRs. Rolling them independently means the proven
 * one stays on if the new one has to come off.
 *
 * WHAT THIS ADDS THAT THE FILE LOCK CANNOT. tick-lock.ts made the single-machine
 * case correct (atomic create - exactly one winner). But a filesystem lock cannot
 * span machines, and ZOE's loops can run from a Mac, the VPS, a Pi and a Windows
 * desktop. The Heart fences on a shared Supabase row, so it is the only layer
 * that can stop two HOSTS running the same tick. Both are wanted: the file lock
 * is free and instant, the lease is authoritative.
 */
function loopLeasesEnabled(): boolean {
  return process.env.ZOE_LOOP_LEASES === 'true';
}

/**
 * Run a named tick under a Heart lease when its flag is on. The ONE wrapper all
 * three leased loops go through - work-loop, orchestrator-tick and the
 * repo-improver scout - because two hand-written copies of the lease dance is how
 * the same resource-id bug got into both of them.
 *
 * `enabled` off means the tick runs exactly as it does today, byte for byte.
 */
async function runTickLeased(
  name: string,
  enabled: boolean,
  ttlSeconds: number,
  run: () => Promise<void>,
): Promise<ExecuteOutcome<void>> {
  if (!enabled) {
    await run();
    console.log(`[zoe/scheduler] ${name} ran (lease disabled)`);
    return { ran: true, result: undefined };
  }

  // The lease fences on an agent_runs ROW, so the row has to exist and we have
  // to pass its primary key. deterministicResourceId is the idempotency_key, not
  // the id - passing it straight through meant acquire never found a row and the
  // tick never ran. See heart-run.ts.
  const runId = await ensureLeaseRun(
    db() as unknown as RunTableClient,
    `zoe.${name}`,
    'singleton',
    `ZOE ${name}: cross-machine single-instance lease for the scheduler's ${name} tick`,
  );
  if (!runId) {
    // Fail OPEN, loudly. Running unleased is exactly what the flag-off path does
    // today, so this is no worse than the current production behaviour and the
    // per-machine tick-lock still holds; skipping instead would mean a Supabase
    // blip silently stops ZOE's autonomous loops, which is the failure mode we
    // are here to remove.
    console.error(
      `[zoe/scheduler] ${name} could not establish a lease row - running UNLEASED (per-machine tick-lock still applies)`,
    );
    await run();
    return { ran: true, result: undefined };
  }

  const owner = `zoe:scheduler:${process.env.HOSTNAME ?? 'host'}:${process.pid}`;
  const outcome = await executeWithLease(
    heart(),
    { runId, owner, ttlSeconds },
    async () => {
      await run();
      return undefined;
    },
  );

  // executeWithLease releases to a terminal status, but canAcquire only takes
  // 'ready' or an expired lease - so without this the resource works once and
  // then refuses every later tick forever.
  await resetRunReady(db() as unknown as RunTableClient, runId);

  // Log BOTH outcomes. A skip is the feature working - another host already has
  // it - and a silent skip is indistinguishable from a loop that stopped running,
  // which is exactly how a broken loop hides (silent-failure-guard). 'lease-held'
  // and 'lease-error' are reported apart: only the first one means the feature
  // worked, and calling an error "held elsewhere" is the lie that hid this bug.
  if (outcome.ran) {
    console.log(`[zoe/scheduler] ${name} ran (lease acquired)`);
  } else if (outcome.reason === 'lease-held') {
    console.log(`[zoe/scheduler] ${name} skipped (lease held elsewhere)`);
  } else {
    console.error(`[zoe/scheduler] ${name} DID NOT RUN - lease error (${outcome.reason})`);
  }
  return outcome;
}

/** Singleton Heart instance for scheduler-wide use. */
let _heart: HeartFleet | null = null;
function heart(): HeartFleet {
  if (_heart) return _heart;
  _heart = new HeartFleet({
    store: new SupabaseLeaseStore(db() as unknown as SupabaseLikeClient),
    onReceipt: (r) => {
      console.log(`[zoe/scheduler] heart receipt ${r.event} run=${r.runId.slice(0, 8)} owner=${r.owner}`);
    },
  });
  return _heart;
}

/**
 * Wraps runRepoImproverTick through the Heart lease layer when the flag is on.
 * When the flag is off, runs the scout exactly as today (zero behavior change).
 *
 * This now goes through the SAME wrapper as the other loops rather than carrying
 * its own copy of the lease dance. Two hand-written copies is how the resource-id
 * bug reached both of them (code-restraint rung 2: reuse beats rewrite).
 */
async function runRepoImproverScout(log: (m: string) => Promise<void>): Promise<ExecuteOutcome<void>> {
  return runTickLeased('repo-improver-scout', repoImproverLeaseEnabled(), 120, () =>
    runRepoImproverTick(log),
  );
}

export interface SchedulerOptions {
  bot: Bot;
  zaalTgId: number;
  repoDir: string;
  devzChatId?: number;
  devzTopicId?: number;
  routingDeps?: ReturnType<typeof constructRoutingDeps>; // for message routing
}

export function startScheduler(opts: SchedulerOptions): { stop: () => void } {
  const tasks: ScheduledTask[] = [];

  // Config preflight FIRST: report any capability that is missing its env, to
  // the log and to Zaal. Silent degradation (a dead db() that every tick just
  // logs past) is the failure mode this exists to kill. Fire-and-forget - a
  // preflight problem must never stop the scheduler from starting.
  void runPreflight(async (report: string) => {
    const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
    const target = gid || opts.zaalTgId;
    if (target)
      await sendChunkedToTelegram((cid, t, o) => opts.bot.api.sendMessage(cid, t, o as never), target, report);
  });

  // Morning brief — 09:00 UTC = 05:00 EDT, 04:00 EST. We anchor to UTC; Zaal in EST/EDT.
  // Cron: '0 9 * * *' → 09:00 UTC daily.
  tasks.push(
    cron.schedule(
      '0 9 * * *',
      () =>
        runWithSendClass('digest', async () => {
        if (!(await claimFire('morning-brief'))) return;
        try {
          // Cockpit is the primary morning brief (doc 997 harness). Falls back to
          // the legacy brief if the cockpit read fails. Note: cockpit is task-
          // focused; commits/PRs/inbox from the legacy brief are a follow-up adapter.
          let brief: string;
          try {
            brief = (await runCockpit('brief')).message;
          } catch (cockpitErr) {
            console.warn(
              '[zoe/scheduler] cockpit brief failed, using legacy brief:',
              (cockpitErr as Error).message,
            );
            brief = await generateMorningBrief({ repoDir: opts.repoDir });
          }

          // Build veto keyboard from top open tasks (best-effort, gracefully degrade)
          let vetoKeyboard: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } | undefined;
          try {
            const tasks = await getOpenTeamTasks();
            const vetoTasks: VetoTask[] = tasks.slice(0, 5).map((t) => ({ id: t.legacy_id || '', title: t.title }));
            vetoKeyboard = buildVetoKeyboard(vetoTasks, 5);
          } catch (err) {
            console.warn('[zoe/scheduler] veto keyboard build failed (nbd):', (err as Error).message);
            vetoKeyboard = undefined;
          }

          // Route the morning brief as a status message (with veto keyboard if available)
          if (opts.routingDeps) {
            await sendToZaalRouted(opts.routingDeps, brief, { kind: 'status', replyMarkup: vetoKeyboard });
          } else {
            // Brief is LLM-generated and can exceed 4096 - chunk the fallback
            // send too (the routed path already chunks). Keyboard on chunk 1.
            await sendChunkedToTelegram(
              (cid, t, o) => opts.bot.api.sendMessage(cid, t, o as never),
              opts.zaalTgId,
              brief,
              vetoKeyboard ? { replyMarkup: vetoKeyboard } : undefined,
            );
          }
          console.log('[zoe/scheduler] morning brief sent (cockpit)' + (vetoKeyboard?.inline_keyboard.length ? ' + veto keyboard' : ''));

          // Everything the send budget held back since the last batch goes out
          // HERE, as one message. A deferred digest that never resurfaces is
          // just a silent drop with extra steps.
          try {
            const held = await drainDeferred();
            if (held.length > 0) {
              await sendChunkedToTelegram(
                (cid, t, o) => opts.bot.api.sendMessage(cid, t, o as never),
                opts.zaalTgId,
                renderDeferredBatch(held),
              );
              console.log(`[zoe/scheduler] morning batch: released ${held.length} deferred send(s)`);
            }
          } catch (batchErr) {
            console.warn('[zoe/scheduler] deferred morning batch failed (nbd):', (batchErr as Error).message);
          }
          // Mirror to Discord #zao-status if DISCORD_WEBHOOK_STATUS is set (doc 1135 Stage 1a).
          postBriefToDiscord(brief).catch((err) =>
            console.warn('[zoe/scheduler] discord webhook failed (non-fatal):', (err as Error).message),
          );

          // Week-grill: right after the digest, start walking Zaal through today
          // one item at a time (events + the top coding task + reviews), so the
          // morning brief flows straight into the do-it-with-me loop instead of
          // being a passive read. The hourly grill loop below carries it onward.
          try {
            await surfaceGrill({
              sendDM: (text, buttons) =>
                opts.bot.api.sendMessage(opts.zaalTgId, text, {
                  reply_markup: {
                    inline_keyboard: buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))),
                  },
                }),
            });
          } catch (grillErr) {
            console.warn('[zoe/scheduler] morning grill kick failed (nbd):', (grillErr as Error).message);
          }
        } catch (err) {
          await releaseFire('morning-brief');
          console.error('[zoe/scheduler] morning brief failed:', (err as Error).message);
        }
        }),
      { timezone: 'UTC' },
    ),
  );

  // BACKLOG GRILL. ONE BATCH A DAY, at the same instant as the morning brief.
  //
  // This is not the grill above. That one surfaces what NEEDS him - decisions,
  // PRs - and waits for each answer. This one works the backlog with the same
  // five answers every time (1 done, 2 keep, 3 work on it, 4 drop, 5 skip).
  //
  // IT USED TO DRIP, every 2 minutes from 06:00 to 22:00 his time, on the
  // theory that the pile IS the queue he sweeps - he had cleared 24 in one
  // sitting in a terminal doing exactly that. Measured over the four days to
  // 2026-08-26 the theory did not hold: 153, 281, 294 and 190 cards sent, and
  // ZERO answers recorded on the 25th or the 26th. 480 slots a day is not a
  // queue to sweep, it is a feed, and the measured response to a feed was
  // nothing at all.
  //
  // Zaal, 2026-08-26: one batch a day at his wake time, and every card into
  // the orchestrator grill lane rather than only Telegram. So this cron is now
  // the brief's own '0 9 * * *' - if he is reading anything, he is reading it
  // then - and runBacklogGrillBatch also appends the batch to GRILL-QUEUE.md,
  // where the grill lane can clear the reversible ones under his standing rule
  // without waiting for a thumb.
  //
  // The remaining guards still live in backlog-grill.ts: nothing once the cap
  // is reached, nothing when the queue is empty. The hour window and the
  // 2-minute spacing are gone with the drip - see BATCH_DEFAULT for why both
  // had to go, and why the cap did not.
  tasks.push(
    cron.schedule(
      '0 9 * * *',
      () =>
        runWithSendClass('gated', async () => {
        if (!(await claimFire('backlog-grill-batch'))) return;
        try {
          // Zaal is ET; the box is UTC. Still computed rather than assumed:
          // the batch no longer gates on the hour, but the value is logged and
          // a wrong one would misreport which morning this was.
          const localHour = Number(
            new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/New_York',
              hour: 'numeric',
              hour12: false,
            }).format(new Date()),
          );
          // One batch at a time. A daily cron cannot overlap itself the way a
          // 2-minute one could, but a restart at 09:00 can fire it beside the
          // running one, and both would read the same state, pick the same
          // oldest task, and clobber each other's write. Kept for that, and
          // for the redeploy-at-the-wrong-minute case that actually happens.
          const locked = await withTickLock(
            join(ZOE_PATHS.home, 'backlog-grill.tick.lock'),
            async () =>
              runBacklogGrillBatch({
                localHour,
                sendDM: (text, buttons) =>
                  opts.bot.api.sendMessage(opts.zaalTgId, text, {
                    reply_markup: {
                      inline_keyboard: buttons.map((row) =>
                        row.map((b) => ({ text: b.text, callback_data: b.data })),
                      ),
                    },
                  }),
                pinMessage: (messageId) =>
                  opts.bot.api.pinChatMessage(opts.zaalTgId, messageId, {
                    disable_notification: true,
                  }),
                unpinMessage: (messageId) => opts.bot.api.unpinChatMessage(opts.zaalTgId, messageId),
              }),
          );
          // Announce whatever it decided, so a quiet morning is legible:
          // 'queue empty', 'cap reached' and a contended lock are very
          // different from a cron that never fired, and without this they look
          // identical (state-claims.md). Once a day this line is the ONLY
          // evidence the batch happened, so it also carries where the cards
          // landed - 'queue:10' and 'spool:10' mean the grill lane can see
          // them and that it cannot, and those must not read the same.
          const r = locked.ran
            ? locked.value
            : { sent: 0, reason: `lock ${locked.reason}`, queued: 'nothing:0', titles: [] };
          featureRan('backlog-grill', r.sent ? `batch ${r.sent}` : r.reason);
          console.log(
            `[zoe/backlog-grill] batch: sent ${r.sent}, ${r.reason}, queue ${r.queued}`,
          );
        } catch (err) {
          console.warn('[zoe/backlog-grill] batch failed (nbd):', (err as Error).message);
        }
        }),
      { timezone: 'UTC' },
    ),
  );

  // THE PINNED BRIEF. Zaal (2026-08-09): "can we stop making artifacts, they
  // just get lost... if it not a quick glance its hard to get to it."
  //
  // Measured: he answers what ARRIVES (11 of 14 grill cards) and ignores what he
  // must NAVIGATE to (hosted pages, the cockpit, docs - all near zero). So this
  // is not another page. It is ONE message, pinned in his DM, edited in place
  // forever - always the same spot, one tap, never scrolling away.
  //
  // Every 5 minutes: cheap (a file read plus one gh call), and it skips the API
  // entirely when nothing changed, so a quiet hour costs nothing and never
  // re-marks the message as changed on his phone.
  tasks.push(
    cron.schedule(
      '*/5 * * * *',
      async () => {
        try {
          const r = await withTickLock(
            join(ZOE_PATHS.home, 'pinned-brief.tick.lock'),
            async () =>
              runPinnedBriefTick({
                sendMessage: async (text) => {
                  const m = await opts.bot.api.sendMessage(opts.zaalTgId, text);
                  return { message_id: m.message_id };
                },
                pinMessage: (messageId) =>
                  // disable_notification: the brief updating is not an event he
                  // needs alerting to - the whole point is that it is quietly
                  // always correct when he looks.
                  opts.bot.api.pinChatMessage(opts.zaalTgId, messageId, {
                    disable_notification: true,
                  }),
                editMessage: (messageId, text) =>
                  opts.bot.api.editMessageText(opts.zaalTgId, messageId, text),
              }),
          );
          featureRan('pinned-brief-tick', r.ran ? r.value.action : `lock ${r.reason}`);
        } catch (err) {
          console.warn('[zoe/pinned-brief] tick failed (nbd):', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Prove Claude is reachable, hourly, with an actual call.
  //
  // This is the positive half of the 401 fix. Recording outcomes inside
  // callClaudeCli covers every real call, but a quiet ZOE makes no real calls -
  // and "no failures recorded" is not evidence of health
  // (`.claude/rules/state-claims.md`, silence is not evidence). So once an hour
  // we spend one haiku call to establish the fact either way, and the pinned
  // brief reads the result.
  //
  // checkClaudeAuth already existed in hermes/claude-cli.ts and its docstring
  // claimed "Used by: bot/src/zoe/index.ts onBotStart hook". It had zero callers.
  // This is that wiring, finally made real.
  tasks.push(
    cron.schedule(
      '7 * * * *',
      async () => {
        try {
          const r = await checkClaudeAuth();
          featureRan('claude-auth-probe', r.ok ? 'ok' : `${r.kind ?? 'fail'}`);
          if (!r.ok) console.warn(`[zoe/scheduler] claude auth probe failed: ${r.kind ?? 'unknown'} - ${r.hint ?? ''}`);
        } catch (err) {
          // The probe failing to RUN is different from Claude being down, and
          // callClaudeCli has already recorded whatever it saw.
          console.warn('[zoe/scheduler] claude auth probe threw:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // The AGENT grill loop (bot->agent upgrade). Every 2 hours during waking hours
  // (10:00-01:00 UTC ~= 6am-9pm ET), DM Zaal the next thing that needs him - one
  // at a time, to his DM. This is what makes ZOE proactive instead of reactive:
  // it comes to him with decisions + builds-to-test, he answers, the next pops.
  // Defensive: surfaceGrill only sends if there is an unanswered item + honours
  // its own cooldown, so it never nags.
  tasks.push(
    cron.schedule(
      '0 10-23,0,1 * * *',
      () =>
        runWithSendClass('gated', async () => {
        try {
          const r = await surfaceGrill({
            sendDM: (text, buttons) =>
              opts.bot.api.sendMessage(opts.zaalTgId, text, {
                reply_markup: {
                  inline_keyboard: buttons.map((row) =>
                    row.map((b) => ({ text: b.text, callback_data: b.data })),
                  ),
                },
              }),
          });
          if (r.sent) console.log(`[zoe/scheduler] grilled Zaal: ${r.item?.kind} - ${r.item?.title?.slice(0, 50)}`);
        } catch (err) {
          console.warn('[zoe/scheduler] grill tick failed (nbd):', (err as Error).message);
        }
        }),
      { timezone: 'UTC' },
    ),
  );

  // Doc 989 (backlog #2): escalation resend. Every 30 min, re-ping any
  // super-important message Zaal hasn't acknowledged past the window. Standalone
  // so it stays independent of the reasoning tick. Defensive - never spams.
  tasks.push(
    cron.schedule(
      '*/30 * * * *',
      async () => {
        try {
          const lastReply = await readLastUserReplyAt(opts.zaalTgId);
          const n = await checkAndResend(
            (chatId, text) => opts.bot.api.sendMessage(chatId, text).then(() => undefined),
            lastReply,
          );
          if (n > 0) console.log(`[zoe/scheduler] escalated ${n} unacked critical ping(s)`);
        } catch (err) {
          console.warn('[zoe/scheduler] escalation check failed (nbd):', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Evening reflection — 01:00 UTC = 21:00 EDT, 20:00 EST.
  tasks.push(
    cron.schedule(
      '0 1 * * *',
      () =>
        runWithSendClass('digest', async () => {
        if (!(await claimFire('evening-reflect'))) return;
        try {
          const prompt = await generateEveningReflection({ repoDir: opts.repoDir });
          // Evening reflection is a question for Zaal - route as 'question'
          if (opts.routingDeps) {
            await sendToZaalRouted(opts.routingDeps, prompt, { kind: 'question' });
          } else {
            await opts.bot.api.sendMessage(opts.zaalTgId, prompt);
          }
          // Arm reflexion (Gap 4): Zaal's next free-form DM is captured as the
          // reflection answer and fed to the reflexion layer for memory patches.
          const armed = await setPending({
            kind: 'await-reflection',
            chatScope: 'private',
            createdAt: new Date().toISOString(),
            ttlMs: AWAIT_REFLECTION_TTL_MS,
          });
          if (armed.armed) {
            console.log('[zoe/scheduler] evening reflection sent + reflexion armed');
          } else {
            // doc 770 H2: don't clobber a live approval Zaal is mid-way through.
            console.log(
              `[zoe/scheduler] evening reflection sent, capture NOT armed — ${pendingKindLabel(
                armed.blockedBy!.kind,
              )} pending`,
            );
          }
        } catch (err) {
          await releaseFire('evening-reflect');
          console.error('[zoe/scheduler] evening reflection failed:', (err as Error).message);
        }
        }),
      { timezone: 'UTC' },
    ),
  );

  // Team digest — 13:00 UTC = 09:00 EDT / 08:00 EST, aligned to the 9:30 Iman
  // sync. Posts the shareable per-owner "what is each person on" digest (doc
  // 2201) and mirrors current priorities into Bonfire so the graph reflects live
  // state, not just doc stubs. Autonomous read+write across board AND bonfire.
  tasks.push(
    cron.schedule(
      '0 13 * * *',
      () =>
        runWithSendClass('digest', async () => {
        if (!(await claimFire('team-digest'))) return;
        try {
          const { digest, taskCount, mirrored } = await runTeamDigest({ mirrorToBonfire: true });
          if (taskCount > 0) {
            if (opts.routingDeps) {
              await sendToZaalRouted(opts.routingDeps, digest, { kind: 'status' });
            } else {
              await sendChunkedToTelegram(
                (cid, t, o) => opts.bot.api.sendMessage(cid, t, o as never),
                opts.zaalTgId,
                digest,
              );
            }
            console.log(`[zoe/scheduler] team digest sent (${taskCount} tasks, bonfire mirror=${mirrored})`);
          } else {
            console.log('[zoe/scheduler] team digest skipped - no open team tasks');
          }
        } catch (err) {
          await releaseFire('team-digest');
          console.error('[zoe/scheduler] team digest failed:', (err as Error).message);
        }
        }),
      { timezone: 'UTC' },
    ),
  );

  // Nightly recap — 02:00 UTC = 22:00 EDT, 21:00 EST (9pm EST, 8pm EDT).
  // Silent when nothing shipped (no send, no sentinel claim).
  tasks.push(
    cron.schedule(
      '0 2 * * *',
      () =>
        runWithSendClass('digest', async () => {
        if (!(await claimFire('nightly-recap'))) return;
        try {
          const recap = await generateNightlyRecap({ repoDir: opts.repoDir });
          if (!recap) {
            // Silent when nothing shipped — release the claim so logging is clean
            await releaseFire('nightly-recap');
            console.log('[zoe/scheduler] nightly recap: nothing shipped (silent)');
            return;
          }
          // Nightly recap is a status message
          if (opts.routingDeps) {
            await sendToZaalRouted(opts.routingDeps, recap, { kind: 'status' });
          } else {
            await sendChunkedToTelegram((cid, t, o) => opts.bot.api.sendMessage(cid, t, o as never), opts.zaalTgId, recap);
          }
          console.log('[zoe/scheduler] nightly recap sent');
        } catch (err) {
          await releaseFire('nightly-recap');
          console.error('[zoe/scheduler] nightly recap failed:', (err as Error).message);
        }
        }),
      { timezone: 'UTC' },
    ),
  );

  // Afferent digest — 02:30 UTC (30 min after nightly recap). Receipts -> memory bridge.
  // Turns the day's organism activity into ONE durable self-knowledge record.
  // Silent when nothing to digest (no send, no sentinel claim).
  tasks.push(
    cron.schedule(
      '30 2 * * *',
      async () => {
        if (!(await claimFire('afferent-digest'))) return;
        try {
          const result = await persistDailyDigest();
          if (result.status === 'silent') {
            // Silent when nothing to digest — release the claim so logging is clean
            await releaseFire('afferent-digest');
            console.log('[zoe/scheduler] afferent digest: nothing to digest (silent)');
            return;
          }
          if (result.status === 'error') {
            // Loud-fail: DB error or critical issue
            await releaseFire('afferent-digest');
            console.error('[zoe/scheduler] afferent digest failed:', result.message);
            return;
          }
          // Success: log the digest summary
          console.log(
            `[zoe/scheduler] afferent digest: ${result.receiptCount} receipts, bonfire=${result.bonfire ?? false}`,
          );
        } catch (err) {
          await releaseFire('afferent-digest');
          console.error('[zoe/scheduler] afferent digest error:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Daily note rollover — 00:00 America/New_York (EST/EDT midnight, not UTC).
  // Idempotent per (owner_id, note_date): creates today's note for each owner with
  // a yesterday note, copies unchecked items to the TOP, increments roll_count,
  // and runs automatic promotion (@mention + committed date -> real task rows).
  // Loud-fail on DB error (exits non-zero to page).
  tasks.push(
    cron.schedule(
      '0 0 * * *',
      async () => {
        if (!(await claimFire('daily-note-rollover'))) return;
        try {
          const result = await rolloverNotes();
          if (result.status === 'error') {
            // Loud-fail: rolloverNotes swallows its own exceptions and reports
            // the failure as a status, so this branch (not the catch) is what
            // actually fires on a DB outage. Release the claim so the day is not
            // recorded as rolled, and log at error level.
            await releaseFire('daily-note-rollover');
            console.error('[zoe/scheduler] daily note rollover failed:', result.summary);
            return;
          }
          if (result.status === 'silent') {
            await releaseFire('daily-note-rollover');
            console.log('[zoe/scheduler] daily note rollover: nothing to roll (silent)');
            return;
          }
          console.log(`[zoe/scheduler] daily note rollover: ${result.summary}`);
        } catch (err) {
          await releaseFire('daily-note-rollover');
          console.error('[zoe/scheduler] daily note rollover failed:', (err as Error).message);
        }
      },
      { timezone: 'America/New_York' },
    ),
  );

  // Clean-curator Telegram topic posting — 08:00 UTC daily (one hour before
  // morning brief). Posts curated digests to the ZAO group forum topics
  // (newsletter, github, artizen, recommendations, general). Disabled by default
  // (safe no-op) until all 5 topic thread IDs are configured.
  tasks.push(
    cron.schedule(
      '0 8 * * *',
      async () => {
        if (!(await claimFire('curator-tick'))) return;
        try {
          const zaoGroupId = Number(process.env.ZAO_GROUP_ID ?? 0);
          if (!zaoGroupId) {
            console.log('[zoe/scheduler] curator: ZAO_GROUP_ID not configured, skipping');
            await releaseFire('curator-tick');
            return;
          }

          const result = await runCuratorTick(
            // Braces, not a bare expression: the callback is typed Promise<void>
            // and sendMessage resolves to a TextMessage. Returning it happened to
            // work but did not typecheck, and the returned message was discarded
            // anyway - so discard it explicitly.
            async (chatId, text, sendOpts) => {
              if (sendOpts?.message_thread_id) {
                await opts.bot.api.sendMessage(chatId, text, {
                  message_thread_id: sendOpts.message_thread_id,
                });
                return;
              }
              await opts.bot.api.sendMessage(chatId, text);
            },
            zaoGroupId,
          );

          if (result.posted > 0) {
            console.log(`[zoe/scheduler] curator: ${result.posted} posted, ${result.skipped} skipped`);
          } else if (!result.enabled) {
            await releaseFire('curator-tick');
            console.log('[zoe/scheduler] curator: disabled (thread_ids not fully set)');
            return;
          }

          if (result.errors.length > 0) {
            console.warn('[zoe/scheduler] curator: errors:', result.errors);
          }
        } catch (err) {
          await releaseFire('curator-tick');
          console.error('[zoe/scheduler] curator tick failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // doc 796 Move 1 — reasoning-tick gate (the single proactive channel). Runs
  // hourly. Gathers candidate thoughts and speaks AT MOST the single best one,
  // only if it clears the interrupt threshold. Most ticks stay silent. NO daily
  // quota (Decision 1): the threshold + the unacked self-throttle inside
  // runReasoningTick are the sole control.
  //
  // The old hourly task-queue nudge is FOLDED IN here (Zaal 2026-06-04) as one
  // candidate among many, instead of its own unconditional cron — so it now
  // competes with commitment threads and must clear the bar. It carries its own
  // 4h cooldown (nudges.ts) so it stays occasional. Skips 09:00 / 01:00 UTC so
  // it never collides with the morning brief / evening reflection. Also flushes
  // any Bonfire emits queued while the graph was unreachable.
  tasks.push(
    cron.schedule(
      '0 * * * *',
      async () => {
        const hour = new Date().getUTCHours();
        if (hour === 9 || hour === 1) return; // dodge brief + reflect collisions

        try {
          await flushEmitQueue();
          // Same cadence, the other queue: every Bonfire writer that is not a
          // thread transition (priorities mirror, afferent digest). Reports what
          // it actually did, so a queue that never drains is visible rather than
          // quietly growing.
          const bf = await flushQueue();
          if (bf.sent || bf.kept || bf.dropped) {
            featureRan('bonfire-retry', `sent ${bf.sent}, kept ${bf.kept}, dropped ${bf.dropped}`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] emit-queue flush failed (nbd):', (err as Error).message);
        }

        // Fold any mail forwarded to the fleet's inboxes into standing context
        // (PII-scrubbed one-liners, deduped, per-brand namespaced). With no
        // ZOE_IDENTITIES_PATH configured this is exactly ZOE's own inbox as
        // before (loadIdentities returns just the default identity); with a fleet
        // registry it also ingests each brand's inbox into its own log (doc 2159).
        // Best-effort - a no-op when the keys are unset.
        try {
          const fleet = await ingestAllIdentities();
          const total = fleet.reduce((n, r) => n + (r.result?.ingested ?? 0), 0);
          if (total > 0) {
            const per = fleet
              .filter((r) => (r.result?.ingested ?? 0) > 0)
              .map((r) => `${r.brand}:${r.result?.ingested}`)
              .join(', ');
            console.log(`[zoe/scheduler] fleet-ingest: folded ${total} forwarded message(s) (${per})`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] fleet-ingest failed (nbd):', (err as Error).message);
        }

        // Reply to any @zoe comments left on board tasks (thezao.xyz/board).
        // Best-effort - a no-op when COWORK_TRACKER_URL/KEY are unset.
        try {
          const rep = await runTaskCommentReplies();
          if (rep.answered > 0) {
            console.log(`[zoe/scheduler] task-comment-replies: answered ${rep.answered}`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] task-comment-replies failed (nbd):', (err as Error).message);
        }

        // Ping people on Telegram when they're @mentioned in a board task
        // comment (thezao.xyz/board), so they see it without opening the board.
        // Best-effort - a no-op when the board or MENTION_NOTIFY_MAP is unset.
        try {
          const send = (chatId: number, text: string, o?: { threadId?: number }) =>
            opts.bot.api
              .sendMessage(chatId, text, o?.threadId ? { message_thread_id: o.threadId } : undefined)
              .then(() => undefined);
          const mn = await runMentionNotify(send, opts.zaalTgId);
          if (mn.notified > 0) {
            console.log(`[zoe/scheduler] mention-notify: pinged ${mn.notified}`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] mention-notify failed (nbd):', (err as Error).message);
        }

        // When a team member comments on a board task, ZOE posts "noted" + asks
        // Zaal on Telegram what to reply. The reply-bridge in index.ts posts his
        // answer back to the task. Best-effort - a no-op when board is unconfigured.
        try {
          const sendTg = async (chatId: number, text: string, o?: { replyToMessageId?: number }) => {
            const res = await opts.bot.api.sendMessage(chatId, text, o?.replyToMessageId ? { reply_parameters: { message_id: o.replyToMessageId } } : {});
            return res.message_id ?? null;
          };
          const ta = await runTaskTeammateAck(sendTg, opts.zaalTgId, fetch, opts.repoDir);
          if (ta.asked > 0) {
            console.log(`[zoe/scheduler] teammate-ack: asked ${ta.asked}`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] teammate-ack failed (nbd):', (err as Error).message);
        }

        // Doc 983 Rec #4: hourly backfill of any task created untagged by a
        // writer other than ZOE's write-path (board quick-add, meeting capture).
        // Best-effort - a no-op when the tracker is unconfigured.
        try {
          const r = await reconcileUntaggedTasks();
          if (r.ok && r.tagged > 0) {
            console.log(`[zoe/scheduler] auto-tag reconcile: tagged ${r.tagged}/${r.scanned}`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] auto-tag reconcile failed (nbd):', (err as Error).message);
        }

        // Auto-CLOSE the finished ones. The tagger above and this closer are the
        // two halves of the same hourly pass: eight writers could open a task and
        // nothing could finish one, so the board reached 474 open / 122 overdue
        // with every sampled doc-review pointing at an already-merged doc.
        //
        // Closes only on POSITIVE evidence (the doc is on main, the PR's merge
        // commit is on main) and caps the blast radius per run, so the worst a
        // bug can do is a reviewable handful rather than the whole board.
        try {
          const c = await autoCloseFinishedTasks(process.env.ZOE_REPO_DIR ?? '/home/zaal/zao-os');
          if (c.ok && c.closed > 0) {
            console.log(
              `[zoe/scheduler] auto-close: closed ${c.closed}/${c.scanned}` +
                (c.deferred > 0 ? ` (${c.deferred} deferred to next run)` : ''),
            );
            // Log each one. A close nobody can see is a close nobody can undo.
            for (const r of c.reasons) console.log(`[zoe/scheduler] auto-close: ${r}`);
          } else if (!c.ok && c.error) {
            console.warn(`[zoe/scheduler] auto-close skipped: ${c.error}`);
          }
          // Surfaced, never closed. These doc-review reminders were created when
          // their doc shipped, so "the doc is merged" was true from birth and
          // proves nothing - the queue needs one human decision, not a machine
          // deleting it under a proof that does not hold.
          if (c.ok && c.vacuousReminders > 0) {
            console.log(
              `[zoe/scheduler] auto-close: ${c.vacuousReminders} doc-review reminders left open ` +
                '(never actionable - needs one bulk decision from Zaal, not an auto-close)',
            );
          }
        } catch (err) {
          console.warn('[zoe/scheduler] auto-close failed (nbd):', (err as Error).message);
        }

        // Task #930: ping-lifecycle resolution. Hourly check for any teammate-ack
        // pings (pending replies) tied to board tasks and resolve (unpin + remove
        // the PendingReply) them when their task closes. Best-effort - a no-op
        // when the tracker is unconfigured.
        try {
          const result = await runPingLifecycleTick({
            readPending: readPendingReplies,
            removePending: removePendingReply,
            getTaskStatuses: getTaskStatusByIds,
            unpin: async (chatId, messageId) => {
              // Unpin via grammY API. Best-effort - swallowed by resolution routine.
              try {
                await opts.bot.api.unpinChatMessage(chatId, messageId);
              } catch {
                // silent best-effort
              }
            },
            chatId: opts.zaalTgId,
          });
          if (result.resolved > 0) {
            console.log(`[zoe/scheduler] ping-lifecycle: resolved ${result.resolved} ping(s)`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] ping-lifecycle tick failed (nbd):', (err as Error).message);
        }

        // Build the task-queue nudge as a gate candidate (folded in). Only when
        // nudges are enabled, the cooldown has elapsed, and the queue is non-empty.
        const extraCandidates = async (): Promise<Candidate[]> => {
          const cands: Candidate[] = [];
          // Event candidates (doc 859/860): ZOE leads - tagged pings when notable
          // things happen across Zaal's work ([STALE PR], ...). Threshold-gated.
          try {
            cands.push(...(await gatherEventCandidates()));
          } catch {
            // best-effort; events never block the tick
          }
          // Graph-staleness nudges (doc 859): cold watched fronts. Daily-gated.
          try {
            cands.push(...(await gatherGraphCandidates()));
          } catch {
            // best-effort
          }
          // Inactivity check-in: went quiet 4h+ during waking hours. Daily-gated.
          try {
            cands.push(...(await gatherInactivityCandidates()));
          } catch {
            // best-effort
          }
          // Calendar nudges: events starting within 2h from ~/.zao/private/gcal-*.json.
          try {
            cands.push(...(await gatherCalendarCandidates()));
          } catch {
            // best-effort
          }
          // Task-queue nudge (only when enabled + cooldown elapsed + queue non-empty).
          try {
            if (!(await nudgesEnabled())) return cands;
            if (!(await nudgeCooldownElapsed())) return cands;
            const nudge = await nextNudge();
            if (!nudge) return cands;
            // Score at the default threshold: it can fire when nothing outranks
            // it, but any due/overdue commitment thread (>=0.75) wins the tick.
            cands.push({ kind: 'task-nudge', tier: 'standard', score: 0.6, message: nudge });
          } catch {
            // ignore - return whatever events we gathered
          }
          return cands;
        };

        try {
          const decision = await runReasoningTick({ extraCandidates });
          if (!decision.speak || !decision.message) return;
          // Nudges and reasoning decisions are status messages
          if (opts.routingDeps) {
            await sendToZaalRouted(opts.routingDeps, decision.message, { kind: 'status' });
          } else {
            await opts.bot.api.sendMessage(opts.zaalTgId, decision.message);
          }
          if (decision.candidate) {
            await recordPush(decision.candidate);
            if (decision.threadId) await markNudged(decision.threadId);
            if (decision.candidate.kind === 'task-nudge') await markNudgeSent();
          }
          console.log(
            `[zoe/scheduler] reasoning tick spoke (${decision.reason}, kind=${decision.candidate?.kind ?? 'n/a'}, threshold=${decision.threshold})`,
          );
        } catch (err) {
          console.error('[zoe/scheduler] reasoning tick failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Gap 5 weekly learning loop — Sunday 18:00 UTC. Clusters the week's
  // dispatch telemetry and proposes worker learnings for Zaal to approve.
  tasks.push(
    cron.schedule(
      '0 18 * * 0',
      async () => {
        if (!(await claimFire('learn-cycle'))) return;
        try {
          const result = await runLearnCycle({
            context: {
              zaal_tg_id: opts.zaalTgId,
              workspace_dir: opts.repoDir,
              current_date: new Date().toISOString().slice(0, 10),
            },
          });
          if (result.proposals.length === 0) {
            console.log(`[zoe/scheduler] learn cycle: ${result.runsAnalyzed} runs, no proposals`);
            return;
          }
          const armed = await setPending({
            kind: 'learn',
            chatScope: 'private',
            createdAt: new Date().toISOString(),
            proposals: result.proposals,
          });
          if (!armed.armed) {
            // doc 770 H2: a live approval is waiting — defer rather than clobber.
            console.log(
              `[zoe/scheduler] learn cycle: deferring ${result.proposals.length} proposals — ${pendingKindLabel(
                armed.blockedBy!.kind,
              )} pending`,
            );
            return;
          }
          // Learning proposals are approval questions
          const proposalsMsg = renderLearnProposals(result.proposals);
          if (opts.routingDeps) {
            await sendToZaalRouted(opts.routingDeps, proposalsMsg, { kind: 'question' });
          } else {
            await opts.bot.api.sendMessage(opts.zaalTgId, proposalsMsg);
          }
          console.log(`[zoe/scheduler] learn cycle: ${result.proposals.length} proposals sent`);
        } catch (err) {
          await releaseFire('learn-cycle');
          console.error('[zoe/scheduler] learn cycle failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // (Removed 2026-07-26: the Phase-4 Devz-tip cron was a stub that fired every
  // 15 min and only logged "implementation pending" - dead weight. Bring it back
  // as a real feature if hourly Devz tips are ever wanted, not as a no-op timer.)

  // Watcher (doc 927) - daily dispatch-health supervisor. Reads the run
  // telemetry dispatch.ts records and pings Zaal ONLY on a cost / failure /
  // quality anomaly. Most days it logs 'clean' and stays silent.
  tasks.push(
    cron.schedule(
      '30 8 * * *',
      async () => {
        if (!(await claimFire('watcher'))) return;
        try {
          const alerts = [...(await runWatcherTick()), ...(await healFleet({ date: new Date().toISOString().slice(0, 10) }))];
          if (alerts.length) {
            // Watcher alerts are status messages
            const alertsMsg = renderWatcherAlerts(alerts);
            if (opts.routingDeps) {
              await sendToZaalRouted(opts.routingDeps, alertsMsg, { kind: 'status' });
            } else {
              await opts.bot.api.sendMessage(opts.zaalTgId, alertsMsg);
            }
            console.log('[zoe/scheduler] watcher: ' + alerts.length + ' alert(s) sent');
          } else {
            console.log('[zoe/scheduler] watcher: clean');
          }
        } catch (err) {
          await releaseFire('watcher');
          console.error('[zoe/scheduler] watcher failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Work-loop (doc 927) - autonomous research track. Every 2h, pull one
  // queued research topic and run it through decompose -> dispatch -> doc-PR.
  // Empty queue = silent. Research-only, daily-capped, file-locked.
  tasks.push(
    cron.schedule(
      '0 */2 * * *',
      async () => {
        try {
          if (shouldPauseAutonomousWork()) {
            console.log('[zoe/scheduler] work-loop tick skipped (cost hard-stop at 95%+)');
            return;
          }
          const rGid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
          const rThread = Number(process.env.ZAAL_BOTZ_RESEARCH_THREAD ?? 0);
          await runTickLeased('work-loop', loopLeasesEnabled(), 600, () => runWorkTick({
            sendToZaal: (t: string) => {
              // Work-loop messages are status messages
              if (opts.routingDeps) {
                return sendToZaalRouted(opts.routingDeps, t, { kind: 'status' });
              }
              return opts.bot.api.sendMessage(opts.zaalTgId, t);
            },
            sendToChat: (chatId: number, threadId: number | undefined, t: string) =>
              opts.bot.api.sendMessage(chatId, t, threadId ? { message_thread_id: threadId } : {}),
            defaultResearchTarget: rGid && rThread ? { chatId: rGid, threadId: rThread } : undefined,
            zaalTgId: opts.zaalTgId,
            repoDir: opts.repoDir,
            currentDate: new Date().toISOString().slice(0, 10),
          }));
        } catch (err) {
          console.error('[zoe/scheduler] work-loop tick failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Error remediation - every 10 min, turn a captured production error digest
  // (app_errors, status='new') into a routed fix + PR and report the outcome to
  // ZAALBOTS. Routes, does not ask (feedback_zoe_route_dont_ask). One error per
  // tick; the fix pipeline enforces the fleet daily cap. Silent when there is
  // nothing new or the group is not configured.
  tasks.push(
    cron.schedule(
      '*/10 * * * *',
      async () => {
        const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        if (!gid) return; // not configured
        if (shouldPauseAutonomousWork()) return; // cost hard-stop
        try {
          const deps = defaultRemediationDeps(
            (text: string) => opts.bot.api.sendMessage(gid, text).then(() => {}),
            opts.zaalTgId,
            gid,
          );
          const status = await runErrorRemediationTick(deps);
          if (status !== 'no new errors') {
            console.log(`[zoe/scheduler] error-remediation: ${status}`);
          }
        } catch (err) {
          console.error('[zoe/scheduler] error-remediation tick failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Repo-improver scout - every 3h, audit the next ZAO repo with a CHEAP
  // OpenRouter model (off the Claude cap), then ZOE reviews each proposed
  // finding with its own judgment, logs the decision (learning trail), and
  // routes approved fixes through the Hermes pipeline. Human gate stays only at
  // PR merge. Gated on the OpenRouter key + the group + the cost hard-stop.
  // When ZOE_REPO_IMPROVER_LEASES=true, runs through Heart lease layer to
  // prevent concurrent scouts. Default OFF (zero behavior change until flag flips).
  tasks.push(
    cron.schedule(
      '30 */3 * * *',
      async () => {
        const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        if (!gid) return; // not configured
        if (!process.env.OPENROUTER_API_KEY?.trim()) return; // scout needs the cheap model
        if (shouldPauseAutonomousWork()) return; // cost hard-stop
        // Chunk the send: audits routinely exceed Telegram's 4096-char limit and
        // were getting truncated mid-sentence (tg-chunk.ts). Never raw-send long text.
        try {
          await runRepoImproverScout(async (text: string) => {
            await sendChunkedToTelegram((cid, t) => opts.bot.api.sendMessage(cid, t), gid, text);
          });
        } catch (err) {
          console.error('[zoe/scheduler] repo-improver scout failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Heart fleet CANARY beat - every 10 min, a lease-guarded no-op through the
  // shared packages/heart-fleet layer against the live agent_runs table. The
  // module self-gates on ZOE_HEART_FLEET_CANARY (default OFF), so this is inert
  // until the env flips; when two instances ever race, the lease-held skip in
  // the logs is the success evidence. Doc 2139 rollout ladder step 2.
  tasks.push(
    cron.schedule(
      '*/10 * * * *',
      async () => {
        if (!heartCanaryEnabled()) return; // flag off = zero work, zero logs
        try {
          // Pass a send + target so the canary can exercise the transactional
          // outbox end-to-end when ZOE_OUTBOX_DEMO is also on (still no-op when
          // that flag is off). Target = the ZAAL BOTZ ops group (internal).
          const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
          await runHeartFleetCanary(undefined, {
            groupId: gid || undefined,
            send: gid
              ? (chatId, text) => opts.bot.api.sendMessage(chatId, text) as Promise<{ message_id?: number }>
              : undefined,
          });
        } catch (err) {
          console.error('[zoe/scheduler] heart canary beat failed:', (err as Error)?.message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Handoffs topic surfacer - every 10 min, post any NEW handoff-inbox items
  // (/handoff tracker rows) into the ZAAL BOTZ Handoffs topic. De-duped by a
  // last-seen marker. Silent when nothing new + when the topic is not configured.
  tasks.push(
    cron.schedule(
      '*/10 * * * *',
      async () => {
        const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        const thread = Number(process.env.ZAAL_BOTZ_HANDOFFS_THREAD ?? 0);
        if (!gid || !thread) return; // not configured
        try {
          const n = await surfaceNewHandoffs((text: string) =>
            opts.bot.api.sendMessage(gid, text, { message_thread_id: thread }),
          );
          if (n > 0) console.log(`[zoe/scheduler] surfaced ${n} handoff(s) to the Handoffs topic`);
        } catch (err) {
          console.warn('[zoe/scheduler] handoff surface failed (nbd):', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // ZAOstock cloud-loop approvals surfacer - every 10 min, post any NEW entries
  // from research/_meta/zaostock-pending-approvals.md (bettercallzaal/ZAOOS)
  // into a Telegram group. That file is the ZAOstock autonomous research
  // routine's approval queue - it runs in an isolated cloud sandbox with no
  // Telegram credentials, so it can only commit drafts/decisions to the file,
  // not push them. This is the other half of that bridge. Prefers a dedicated
  // ZAOSTOCK_TEAM_GROUP_ID (e.g. the actual ZAOstock team's own Telegram group,
  // once ZOE is added there) so this content lands where the team already is,
  // rather than mixed into the general ZAAL BOTZ ops firehose; falls back to
  // ZAAL_BOTZ_GROUP_ID if that's not configured yet. Silent when nothing new;
  // the file itself won't exist until the loop's first run.
  tasks.push(
    cron.schedule(
      '*/10 * * * *',
      async () => {
        const gid = Number(process.env.ZAOSTOCK_TEAM_GROUP_ID ?? process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        if (!gid) return; // not configured
        try {
          const n = await surfaceZaostockApprovals((text: string) => opts.bot.api.sendMessage(gid, text));
          if (n > 0) console.log(`[zoe/scheduler] surfaced ${n} ZAOstock approval-queue item(s)`);
        } catch (err) {
          console.warn('[zoe/scheduler] ZAOstock approvals surface failed (nbd):', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Orchestrator tick (doc TBD) - every 5 min, check for new button-question
  // answers in the ZAAL BOTZ Claude Code topic and post the next question
  // based on simple decision rules. DISABLED by default (ZOE_ORCHESTRATOR_ENABLED
  // env flag) so it never runs while a Claude Code terminal orchestrator is
  // active. Empty queue = silent. File-locked, daily-capped.
  // Nudge-ladder fast ping: every 2 min, re-ping Zaal for DUE unanswered questions
  // so the phase-1 burst hits the full 5-in-10-min. No-op unless ZOE_NUDGE_LADDER=1.
  tasks.push(
    cron.schedule('*/2 * * * *', async () => {
      const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
      if (!gid) return;
      try {
        await runNudgePing({ bot: opts.bot, groupId: gid, now: new Date() });
      } catch (err) {
        console.error('[zoe/scheduler] nudge ping failed:', (err as Error).message);
      }
    }),
  );

  tasks.push(
    cron.schedule(
      '*/5 * * * *',
      async () => {
        const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        if (!gid) return; // not configured
        try {
          if (shouldPauseAutonomousWork()) {
            console.log('[zoe/scheduler] orchestrator tick skipped (cost hard-stop at 95%+)');
            return;
          }
          await runTickLeased('orchestrator-tick', loopLeasesEnabled(), 600, () => runOrchestratorTick({
            bot: opts.bot,
            groupId: gid,
            zaalTgId: opts.zaalTgId,
            now: new Date(),
          }));
        } catch (err) {
          console.error('[zoe/scheduler] orchestrator tick failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Nudge surfacer - daily check for stale captures and overdue tasks. Posts
  // to ZAAL BOTZ General topic when items are nudge-worthy. De-duped via
  // last-seen date so Zaal gets nudged at most once per day. Silent when
  // nothing to nudge or when the group is not configured.
  tasks.push(
    cron.schedule(
      '30 6 * * *',
      async () => {
        const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        if (!gid) return; // not configured
        try {
          await surfaceNudges((text: string) => opts.bot.api.sendMessage(gid, text));
        } catch (err) {
          console.warn('[zoe/scheduler] nudge surface failed (nbd):', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Cost governance monitor - every 10 min, check spend thresholds (60/75/85/95%)
  // and fire alerts to Zaal when crossed. De-duped per day so each threshold fires
  // at most once per day. At 95%, autonomous work is already hard-stopped by the
  // wraps around runWorkTick + runOrchestratorTick.
  tasks.push(
    cron.schedule(
      '*/10 * * * *',
      async () => {
        try {
          for (const level of [60, 75, 85, 95]) {
            if (shouldFireAlert(level)) {
              const status = formatSpendStatus(false);
              const alert = `COST ALERT: Spend reached ${level}% of daily cap\n\n${status}`;
              // Cost alerts are status messages
              if (opts.routingDeps) {
                await sendToZaalRouted(opts.routingDeps, alert, { kind: 'status' }).catch((err: unknown) => {
                  console.warn('[zoe/scheduler] cost alert send failed:', err);
                });
              } else {
                await opts.bot.api.sendMessage(opts.zaalTgId, alert).catch((err: unknown) => {
                  console.warn('[zoe/scheduler] cost alert send failed:', err);
                });
              }
            }
          }
        } catch (err) {
          console.warn('[zoe/scheduler] cost monitoring failed (nbd):', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Post slate v1 - random 7 pings/day of social-post drafts (build / ecosystem /
  // event / personal). Owns its own state at ~/.zao/zoe/posts/. See posts/README.md.
  const postsScheduler = startPostsScheduler({
    bot: opts.bot,
    zaalTgId: opts.zaalTgId,
    repoDir: opts.repoDir,
  });

  console.log(`[zoe/scheduler] started ${tasks.length} cron tasks + posts scheduler (no quiet hours per Zaal feedback)`);

  return {
    stop: () => {
      for (const task of tasks) {
        task.stop();
      }
      postsScheduler.stop();
    },
  };
}
