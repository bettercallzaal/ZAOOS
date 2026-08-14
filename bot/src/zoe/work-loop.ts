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
import { acquireTickLock, releaseTickLock } from './tick-lock';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { DecompositionPlan } from './decompose';
import { dispatchPlan } from './dispatch';
import { commitResearchDoc } from './research-doc';
import { emitReceipt } from './receipts';
import { callClaudeCli } from '../hermes/claude-cli';
import { verifyReplanResearch } from './verify-replan';
import { parkWork, resumeWork } from './work-park';
import type { ZoeContext } from './types';
import { featureRan } from './feature-ran';

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
  /** Where to report the result. When set (e.g. a request from the Research
   * topic), the completion lands there instead of Zaal's DM. */
  replyTarget?: { chatId: number; threadId?: number };
}

export interface WorkTickDeps {
  sendToZaal: (text: string) => Promise<unknown>;
  /** Send to a specific chat/topic (used to report a research result back to
   * the topic it was requested from). Falls back to sendToZaal if absent. */
  sendToChat?: (chatId: number, threadId: number | undefined, text: string) => Promise<unknown>;
  /** Where autonomous research (no explicit reply target) reports - the Research
   * topic. When set + sendToChat present, all research lands there not the DM. */
  defaultResearchTarget?: { chatId: number; threadId: number };
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

export async function enqueueWork(
  input: string,
  replyTarget?: { chatId: number; threadId?: number },
): Promise<WorkItem> {
  const q = await readQueue();
  const item: WorkItem = {
    id: 'wk-' + Date.now().toString(36),
    kind: 'research',
    input: input.trim(),
    addedTs: new Date().toISOString(),
    ...(replyTarget ? { replyTarget } : {}),
  };
  q.push(item);
  await writeQueue(q);
  return item;
}

/** Report a work item's result: its own reply target > the default Research
 * topic > Zaal's DM. */
function reportFor(item: WorkItem, deps: WorkTickDeps): (text: string) => Promise<unknown> {
  if (item.replyTarget && deps.sendToChat) {
    const { chatId, threadId } = item.replyTarget;
    return (text: string) => deps.sendToChat!(chatId, threadId, text);
  }
  if (deps.defaultResearchTarget && deps.sendToChat) {
    const { chatId, threadId } = deps.defaultResearchTarget;
    return (text: string) => deps.sendToChat!(chatId, threadId, text);
  }
  return deps.sendToZaal;
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

// Lock acquisition moved to tick-lock.ts. The version that lived here was
// stat-then-write, which is check-then-act: two overlapping ticks could both see
// a free lock and both proceed. tick-lock uses an atomic exclusive create, so
// exactly one caller ever wins - which is what agent-loops rule 9 (one instance
// per resource) actually requires.
async function acquireLock(): Promise<boolean> {
  const r = await acquireTickLock(LOCK(), { staleMs: LOCK_STALE_MS });
  if (!r.acquired && r.reason === 'held') {
    const held = r.heldForMs !== undefined ? ` (held ${Math.round(r.heldForMs / 1000)}s)` : '';
    console.log(`[zoe/work-loop] another tick holds the lock${held} - skipping`);
  }
  return r.acquired;
}

async function releaseLock(): Promise<void> {
  await releaseTickLock(LOCK());
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
    // Captured from the research-doc hook so the receipt can point at the PR (R1b).
    let evidenceUrl: string | null = null;
    const ctx: ZoeContext = {
      zaal_tg_id: deps.zaalTgId,
      workspace_dir: deps.repoDir,
      current_date: deps.currentDate,
    };
    // The work-queue is explicitly a RESEARCH queue, so force a single
    // research-worker task rather than letting decompose reclassify a legit
    // research topic as multi-step build and bounce it (doc 928 fix).
    const plan: DecompositionPlan = {
      goal_summary: item.input,
      subtasks: [
        {
          id: 'st-1',
          title: item.input.slice(0, 90),
          worker: 'research-worker',
          depends_on: [],
          parallel_with: [],
          approval_gate_before_next: false,
          estimated_cost_class: 'medium',
        },
      ],
      execution_plan: 'Single research-worker pass, committed as a numbered doc + PR.',
      ambiguities: [],
    };

    await reportFor(item, deps)(
      `Work-loop: researching "${item.input.slice(0, 80)}" (${q.length} queued)`,
    ).catch(() => {});

    try {
      // A single research-worker pass that returns its output (used for the
      // first pass AND for verify-replan retries).
      const runResearch = async (goal: string): Promise<string> => {
        let out = '';
        const rp: DecompositionPlan = {
          ...plan,
          goal_summary: goal,
          subtasks: [{ ...plan.subtasks[0], title: goal.slice(0, 90) }],
        };
        await dispatchPlan({
          goal,
          plan: rp,
          context: ctx,
          chatId: deps.zaalTgId,
          zaalTgId: deps.zaalTgId,
          hooks: {
            onSubtaskDone: async (st, r) => {
              if (st.worker === 'research-worker' && r.status === 'completed' && r.output) out = r.output;
            },
          },
        });
        return out;
      };

      const firstOutput = await runResearch(item.input);
      // The receipt used to say 'success' unconditionally, including when
      // research returned nothing and when the doc failed to commit. It now
      // reports what actually happened (doc 2272).
      let resultType: 'success' | 'error' = 'success';
      if (firstOutput.trim()) {
        // Verify the result answers the goal; on a graded-incomplete verdict,
        // re-research (bounded) with the missing aspects fed back. Only commit
        // the accepted/best output - no more silently-partial research docs.
        const judge = async (prompt: string): Promise<string> => {
          const r = await callClaudeCli({
            model: 'haiku',
            prompt,
            cwd: ctx.workspace_dir,
            // NOTE: do NOT pass `bare: true` here. `--bare` skips config
            // auto-discovery, which is where the CLI's OAuth login lives - so
            // bare returns "Not logged in", the judge always throws, and
            // verify-replan silently fail-opens (rubber-stamps every result
            // instead of verifying). Proven via A/B on the VPS 2026-08-05;
            // see feedback_no_bare_with_oauth. Keep the judge authenticated.
            maxBudgetUsd: 0.15,
            timeoutMs: 120000,
          });
          return r.text;
        };
        const { output: finalOutput, retries } = await verifyReplanResearch(item.input, firstOutput, {
          research: runResearch,
          judge,
          log: (m) => console.log(`[zoe/work-loop] ${m}`),
        });
        const doc = await commitResearchDoc({ question: item.input, findings: finalOutput });
        if (doc.ok) evidenceUrl = doc.prUrl ?? null;
        await reportFor(item, deps)(
          doc.ok
            ? `Work-loop done: doc ${doc.num}${retries ? ` (verified, ${retries} replan${retries > 1 ? 's' : ''})` : ' (verified)'} -> ${doc.prUrl}`
            : `Work-loop: doc save failed - ${doc.error}`,
        ).catch(() => {});
        if (!doc.ok) {
          // Research that SUCCEEDED and merely failed to land was previously
          // discarded exactly like research that never ran. Keep the output.
          await parkWork(item, 'doc-failed', {
            stage: 'commit',
            error: doc.error ? String(doc.error) : 'doc save failed',
            output: finalOutput,
          });
          resultType = 'error';
        }
      } else {
        // THE SILENT PATH. reportFor lives inside the branch above, so an empty
        // research result used to send nothing anywhere, delete the item, charge
        // it against the daily cap, and emit a 'success' receipt. Park it, say so.
        await parkWork(item, 'empty-output', { stage: 'research' });
        resultType = 'error';
        await reportFor(item, deps)(
          `Work-loop: "${item.input.slice(0, 60)}" produced no research output - parked, not lost. Ask ZOE for parked work.`,
        ).catch(() => {});
      }
      await writeQueue((await readQueue()).filter((x) => x.id !== item.id));
      await bumpToday(deps.currentDate);
      // A tick reached the end of an item. resultType distinguishes a committed
      // doc from a parked failure - both are 'it ran', only one is 'it worked'.
      featureRan('work-loop', resultType);
      // Receipt so the afferent digest (R1) sees the work-loop's output, not just
      // repo-improver. Best-effort - never let a receipt failure break the tick.
      await emitReceipt({
        agentIdentity: 'zoe',
        capability: 'research',
        tool: 'work-loop',
        action: 'work_tick',
        resultType,
        // Without the item id the receipt trail can say a tick failed but never
        // WHICH topic - the gap doc 2272 names.
        inputDigest: item.id,
        evidenceUrl,
        approvalClass: 'auto',
      }).catch(() => {});
    } catch (e) {
      const errMsg = (e as Error)?.message ?? String(e);
      console.error('[zoe/work-loop] tick failed:', errMsg);
      await emitReceipt({
        agentIdentity: 'zoe',
        capability: 'research',
        tool: 'work-loop',
        action: 'work_tick',
        resultType: 'error',
        inputDigest: item.id,
        approvalClass: 'auto',
      }).catch(() => {});
      await reportFor(item, deps)(
        `Work-loop error: failed to process "${item.input.slice(0, 60)}..." - ${errMsg.slice(0, 120)}`,
      ).catch(() => {});
      // Park BEFORE dequeuing. The comment below is still right - retrying a
      // deterministic failure would burn DAILY_CAP forever - but dequeuing is
      // not the same as deleting, and this used to do both (doc 2272).
      await parkWork(item, 'error', { stage: 'unknown', error: errMsg });
      // Remove from queue even on error to avoid infinite retry loop
      await writeQueue((await readQueue()).filter((x) => x.id !== item.id));
    }
  } finally {
    await releaseLock();
  }
}

/**
 * Put a parked item back on the queue. **Operator-initiated only.**
 *
 * Nothing in this file calls it - not runWorkTick, not a drain, not boot. That
 * is the property that keeps parking safe rather than a retry storm, and
 * `work-park.test.ts` asserts it by reading this file as source.
 */
export async function resumeParkedWork(id: string, answer?: string): Promise<WorkItem | null> {
  const item = await resumeWork(id, answer);
  if (!item) return null;
  const q = await readQueue();
  if (q.some((x) => x.id === item.id)) return item; // already queued, do not duplicate
  q.push(item);
  await writeQueue(q);
  return item;
}
