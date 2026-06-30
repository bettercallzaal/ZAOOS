/**
 * work-loop.ts - the autonomous WORK track (the genuine doc 927 gap).
 *
 * ZOE pulls queued research topics and runs them through the EXISTING
 * decompose -> dispatch -> commitResearchDoc pipeline WITHOUT a DM, then pings
 * Zaal with the doc PR. This is what the Mac /loop did manually; now ZOE does it
 * server-side.
 *
 * Safe by design:
 *  - research-only (the safety-rail autonomous-allowed work; multi-step / code
 *    plans are bounced back to Zaal for dispatch).
 *  - one item per tick, file-locked so only one runs at a time (the one-instance
 *    lesson from the 409 split-brain).
 *  - daily cap (ZOE_WORKLOOP_DAILY, default 6) so a big queue can't runaway-spend.
 *  - empty queue = no work = no spend. The queue starts empty.
 *  - PRs land for Zaal to merge - merge stays the human gate.
 *  - the watcher (watcher.ts) independently flags cost/quality anomalies.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { decomposeGoal } from './decompose';
import { dispatchPlan } from './dispatch';
import { commitResearchDoc } from './research-doc';
import type { ZoeContext } from './types';

const dir = (): string => process.env.ZOE_HOME || join(homedir(), '.zao', 'zoe');
const QUEUE = (): string => join(dir(), 'work-queue.json');
const LOCK = (): string => join(dir(), 'work-loop.lock');
const COUNTER = (): string => join(dir(), 'work-loop-count.json');
const LOCK_STALE_MS = 30 * 60 * 1000;
const DAILY_CAP = Math.max(1, Number(process.env.ZOE_WORKLOOP_DAILY ?? 6));

export interface WorkItem {
  id: string;
  kind: 'research';
  input: string;
  addedTs: string;
}

export interface WorkTickDeps {
  sendToZaal: (text: string) => Promise<unknown>;
  zaalTgId: number;
  repoDir: string;
  currentDate: string;
}

async function readQueue(): Promise<WorkItem[]> {
  try {
    return JSON.parse(await fs.readFile(QUEUE(), 'utf8')) as WorkItem[];
  } catch {
    return [];
  }
}

async function writeQueue(q: WorkItem[]): Promise<void> {
  await fs.mkdir(dir(), { recursive: true });
  await fs.writeFile(QUEUE(), JSON.stringify(q, null, 2));
}

export async function enqueueWork(input: string): Promise<WorkItem> {
  const q = await readQueue();
  const item: WorkItem = {
    id: 'wk-' + Date.now().toString(36),
    kind: 'research',
    input: input.trim(),
    addedTs: new Date().toISOString(),
  };
  q.push(item);
  await writeQueue(q);
  return item;
}

export async function queueDepth(): Promise<number> {
  return (await readQueue()).length;
}

async function countToday(date: string): Promise<number> {
  try {
    const c = JSON.parse(await fs.readFile(COUNTER(), 'utf8')) as { date: string; n: number };
    return c.date === date ? c.n : 0;
  } catch {
    return 0;
  }
}

async function bumpToday(date: string): Promise<void> {
  const n = (await countToday(date)) + 1;
  await fs.mkdir(dir(), { recursive: true });
  await fs.writeFile(COUNTER(), JSON.stringify({ date, n }));
}

async function acquireLock(): Promise<boolean> {
  const st = await fs.stat(LOCK()).catch(() => null);
  if (st && Date.now() - st.mtimeMs < LOCK_STALE_MS) return false;
  await fs.mkdir(dir(), { recursive: true });
  await fs.writeFile(LOCK(), String(Date.now()));
  return true;
}

async function releaseLock(): Promise<void> {
  try {
    await fs.unlink(LOCK());
  } catch {
    /* best-effort */
  }
}

/** Run one queued research item through the existing pipeline. Safe to call on a cron. */
export async function runWorkTick(deps: WorkTickDeps): Promise<void> {
  const q = await readQueue();
  if (q.length === 0) return; // empty = nothing to do, no spend

  const done = await countToday(deps.currentDate);
  if (done >= DAILY_CAP) {
    console.log(`[zoe/work-loop] daily cap ${DAILY_CAP} reached (${q.length} still queued)`);
    return;
  }

  if (!(await acquireLock())) {
    console.log('[zoe/work-loop] another run in progress, skip');
    return;
  }

  try {
    const item = q[0];
    const ctx: ZoeContext = {
      zaal_tg_id: deps.zaalTgId,
      workspace_dir: deps.repoDir,
      current_date: deps.currentDate,
    };
    const res = await decomposeGoal({ goal: item.input, context: ctx });
    const plan = res.plan;
    const isResearch =
      plan.subtasks.length === 1 && plan.subtasks[0].worker === 'research-worker';

    if (!isResearch) {
      await deps
        .sendToZaal(
          `Work-loop skipped "${item.input.slice(0, 60)}" - not a single research task; dispatch it yourself when ready.`,
        )
        .catch(() => {});
      await writeQueue((await readQueue()).filter((x) => x.id !== item.id));
      return;
    }

    await deps
      .sendToZaal(`Work-loop: researching "${item.input.slice(0, 80)}" (${q.length} queued)`)
      .catch(() => {});

    await dispatchPlan({
      goal: item.input,
      plan,
      context: ctx,
      chatId: deps.zaalTgId,
      zaalTgId: deps.zaalTgId,
      hooks: {
        onSubtaskDone: async (st, r) => {
          if (st.worker === 'research-worker' && r.status === 'completed' && r.output) {
            const doc = await commitResearchDoc({ question: item.input, findings: r.output });
            await deps
              .sendToZaal(
                doc.ok
                  ? `Work-loop done: doc ${doc.num} -> ${doc.prUrl}`
                  : `Work-loop: doc save failed - ${doc.error}`,
              )
              .catch(() => {});
          }
        },
      },
    });

    await writeQueue((await readQueue()).filter((x) => x.id !== item.id));
    await bumpToday(deps.currentDate);
  } catch (e) {
    console.error('[zoe/work-loop] tick failed:', (e as Error).message);
  } finally {
    await releaseLock();
  }
}
