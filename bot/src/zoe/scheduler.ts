/**
 * Scheduler — proactive nudges on cron.
 *
 * No quiet hours per Zaal feedback 2026-05-04 ("rather get pinged than ignored").
 *
 * Triggers:
 *   02:30 EST (06:30 UTC daily)  — stale capture + overdue task nudge (General topic)
 *   05:00 EST (09:00 UTC daily)  — morning brief
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
import { ZOE_PATHS } from './memory';
import { nextNudge, nudgesEnabled, nudgeCooldownElapsed, markNudgeSent } from './nudges';
import { startPostsScheduler } from './posts';
import { setPending, pendingKindLabel } from './approvals';
import { runLearnCycle, renderLearnProposals } from './learn';
import { runWatcherTick, renderWatcherAlerts } from './watcher';
import { healFleet } from './fleet-health';
import { runWorkTick } from './work-loop';
import { surfaceNewHandoffs } from './handoffs-surface';
import { surfaceZaostockApprovals } from './zaostock-approvals-surface';
import { runOrchestratorTick } from './orchestrator-tick';
import { surfaceNudges } from './nudge';
import { runReasoningTick, recordPush, type Candidate } from './proactive';
import { gatherEventCandidates, gatherGraphCandidates, gatherInactivityCandidates, gatherCalendarCandidates } from './events';
import { markNudged } from './threads';
import { flushEmitQueue } from './thread-memory';
import { checkAndResend, readLastUserReplyAt } from './escalation';
import { reconcileUntaggedTasks } from './team-tracker';
import { ingestInbox } from './inbox-ingest';

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

export interface SchedulerOptions {
  bot: Bot;
  zaalTgId: number;
  repoDir: string;
  devzChatId?: number;
  devzTopicId?: number;
}

export function startScheduler(opts: SchedulerOptions): { stop: () => void } {
  const tasks: ScheduledTask[] = [];

  // Morning brief — 09:00 UTC = 05:00 EDT, 04:00 EST. We anchor to UTC; Zaal in EST/EDT.
  // Cron: '0 9 * * *' → 09:00 UTC daily.
  tasks.push(
    cron.schedule(
      '0 9 * * *',
      async () => {
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
          await opts.bot.api.sendMessage(opts.zaalTgId, brief);
          console.log('[zoe/scheduler] morning brief sent (cockpit)');
        } catch (err) {
          await releaseFire('morning-brief');
          console.error('[zoe/scheduler] morning brief failed:', (err as Error).message);
        }
      },
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
      async () => {
        if (!(await claimFire('evening-reflect'))) return;
        try {
          const prompt = await generateEveningReflection({ repoDir: opts.repoDir });
          await opts.bot.api.sendMessage(opts.zaalTgId, prompt);
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
      },
      { timezone: 'UTC' },
    ),
  );

  // Nightly recap — 02:00 UTC = 22:00 EDT, 21:00 EST (9pm EST, 8pm EDT).
  // Silent when nothing shipped (no send, no sentinel claim).
  tasks.push(
    cron.schedule(
      '0 2 * * *',
      async () => {
        if (!(await claimFire('nightly-recap'))) return;
        try {
          const recap = await generateNightlyRecap({ repoDir: opts.repoDir });
          if (!recap) {
            // Silent when nothing shipped — release the claim so logging is clean
            await releaseFire('nightly-recap');
            console.log('[zoe/scheduler] nightly recap: nothing shipped (silent)');
            return;
          }
          await opts.bot.api.sendMessage(opts.zaalTgId, recap);
          console.log('[zoe/scheduler] nightly recap sent');
        } catch (err) {
          await releaseFire('nightly-recap');
          console.error('[zoe/scheduler] nightly recap failed:', (err as Error).message);
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
        } catch (err) {
          console.warn('[zoe/scheduler] emit-queue flush failed (nbd):', (err as Error).message);
        }

        // Fold any mail Zaal forwarded to zoe-zao@agentmail.to into ZOE's
        // standing context (PII-scrubbed one-liners, deduped). Best-effort -
        // a no-op when AGENTMAIL_API_KEY is unset.
        try {
          const ing = await ingestInbox();
          if (ing.ingested > 0) {
            console.log(`[zoe/scheduler] inbox-ingest: folded ${ing.ingested} forwarded message(s)`);
          }
        } catch (err) {
          console.warn('[zoe/scheduler] inbox-ingest failed (nbd):', (err as Error).message);
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
          await opts.bot.api.sendMessage(opts.zaalTgId, decision.message);
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
          await opts.bot.api.sendMessage(opts.zaalTgId, renderLearnProposals(result.proposals));
          console.log(`[zoe/scheduler] learn cycle: ${result.proposals.length} proposals sent`);
        } catch (err) {
          await releaseFire('learn-cycle');
          console.error('[zoe/scheduler] learn cycle failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Phase 4 - hourly Devz tip cron (group target). Stays gated on devzChatId.
  if (opts.devzChatId) {
    tasks.push(
      cron.schedule(
        '15 * * * *',
        async () => {
          // TODO Phase 4 - generate tip via Claude CLI similar to brief.ts but tip-flavored
          console.log('[zoe/scheduler] devz tip cron fired (Phase 4 - implementation pending)');
        },
        { timezone: 'UTC' },
      ),
    );
  }

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
            await opts.bot.api.sendMessage(opts.zaalTgId, renderWatcherAlerts(alerts));
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
          const rGid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
          const rThread = Number(process.env.ZAAL_BOTZ_RESEARCH_THREAD ?? 0);
          await runWorkTick({
            sendToZaal: (t: string) => opts.bot.api.sendMessage(opts.zaalTgId, t),
            sendToChat: (chatId: number, threadId: number | undefined, t: string) =>
              opts.bot.api.sendMessage(chatId, t, threadId ? { message_thread_id: threadId } : {}),
            defaultResearchTarget: rGid && rThread ? { chatId: rGid, threadId: rThread } : undefined,
            zaalTgId: opts.zaalTgId,
            repoDir: opts.repoDir,
            currentDate: new Date().toISOString().slice(0, 10),
          });
        } catch (err) {
          console.error('[zoe/scheduler] work-loop tick failed:', (err as Error).message);
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
  tasks.push(
    cron.schedule(
      '*/5 * * * *',
      async () => {
        const gid = Number(process.env.ZAAL_BOTZ_GROUP_ID ?? 0);
        if (!gid) return; // not configured
        try {
          await runOrchestratorTick({
            bot: opts.bot,
            groupId: gid,
            zaalTgId: opts.zaalTgId,
            now: new Date(),
          });
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
