/**
 * Scheduler — proactive nudges on cron.
 *
 * No quiet hours per Zaal feedback 2026-05-04 ("rather get pinged than ignored").
 *
 * Triggers:
 *   05:00 EST (09:00 UTC daily)  — morning brief
 *   21:00 EST (01:00 UTC daily)  — evening reflection
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
import { generateEveningReflection } from './reflect';
import { ZOE_PATHS } from './memory';
import { nextNudge, nudgesEnabled } from './nudges';
import { startPostsScheduler } from './posts';
import { setPending } from './approvals';

/** await-reflection waits overnight for Zaal's reply, so a 14h TTL not 30m. */
const AWAIT_REFLECTION_TTL_MS = 14 * 60 * 60 * 1000;

const SENTINEL_DIR = join(ZOE_PATHS.home, 'sentinels');

async function alreadyFired(trigger: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const sentinel = join(SENTINEL_DIR, `${trigger}-${today}.flag`);
  try {
    await fs.access(sentinel);
    return true;
  } catch {
    return false;
  }
}

async function markFired(trigger: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await fs.mkdir(SENTINEL_DIR, { recursive: true });
  const sentinel = join(SENTINEL_DIR, `${trigger}-${today}.flag`);
  await fs.writeFile(sentinel, new Date().toISOString(), 'utf8');
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
        if (await alreadyFired('morning-brief')) return;
        try {
          const brief = await generateMorningBrief({ repoDir: opts.repoDir });
          await opts.bot.api.sendMessage(opts.zaalTgId, brief);
          await markFired('morning-brief');
          console.log('[zoe/scheduler] morning brief sent');
        } catch (err) {
          console.error('[zoe/scheduler] morning brief failed:', (err as Error).message);
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
        if (await alreadyFired('evening-reflect')) return;
        try {
          const prompt = await generateEveningReflection({ repoDir: opts.repoDir });
          await opts.bot.api.sendMessage(opts.zaalTgId, prompt);
          await markFired('evening-reflect');
          // Arm reflexion (Gap 4): Zaal's next free-form DM is captured as the
          // reflection answer and fed to the reflexion layer for memory patches.
          await setPending({
            kind: 'await-reflection',
            chatScope: 'private',
            createdAt: new Date().toISOString(),
            ttlMs: AWAIT_REFLECTION_TTL_MS,
          });
          console.log('[zoe/scheduler] evening reflection sent + reflexion armed');
        } catch (err) {
          console.error('[zoe/scheduler] evening reflection failed:', (err as Error).message);
        }
      },
      { timezone: 'UTC' },
    ),
  );

  // Hourly forward nudge - surfaces the real next move from the task queue.
  // Per doc 648: a generic "be productive" cron does not work; the nudge has
  // to name the actual next thing. Skips the 09:00 / 01:00 UTC slots so it
  // never overlaps morning brief / evening reflect. Self-disables if Zaal
  // sends "stop nudges" (handled in index.ts). Sends nothing on an empty
  // queue - an empty ping is worse than no ping.
  tasks.push(
    cron.schedule(
      '0 * * * *',
      async () => {
        const hour = new Date().getUTCHours();
        if (hour === 9 || hour === 1) return; // dodge brief + reflect collisions
        try {
          if (!(await nudgesEnabled())) {
            return;
          }
          const nudge = await nextNudge();
          if (!nudge) return; // empty queue - skip
          await opts.bot.api.sendMessage(opts.zaalTgId, nudge);
          console.log(`[zoe/scheduler] hourly nudge sent (hour=${hour})`);
        } catch (err) {
          console.error('[zoe/scheduler] hourly nudge failed:', (err as Error).message);
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
