/**
 * send-budget.ts - one gate every outbound ZOE Telegram send passes through.
 *
 * THE MEASURED PROBLEM (August 2026)
 * ----------------------------------
 * ZOE sent 4,709 Telegram messages in August against 12 replies from Zaal -
 * 392 sends per reply. His reply rate fell 93% from April while ZOE's volume
 * rose 28x. ZOE did not lose him on quality; it lost him on VOLUME. A person
 * who gets 150 messages a day from a bot stops reading the bot, and then the
 * one message that actually needed him is buried in the same stream as the
 * 149 that did not.
 *
 * WHY A GATE AND NOT 50 CALL-SITE EDITS
 * ------------------------------------
 * Fourteen modules send to Telegram and there are ~50 raw `bot.api.sendMessage`
 * call sites across scheduler.ts, index.ts, orchestrator-tick.ts,
 * always-open-topics.ts, posts/buttons.ts and caster/. telegram-routing.ts
 * claims in its own header to centralize "ALL message sends", but only 15 of
 * those sites actually route through it - so a per-call-site cap would be
 * wrong the day someone adds the 51st send.
 *
 * This wraps `bot.api.sendMessage` ITSELF, once, at boot. Every send - present
 * and future, routed or raw - passes through by construction. There is no
 * bypass to forget.
 *
 * WHAT THE FULL CORPUS SAYS (9,627 messages, 151 days)
 * ----------------------------------------------------
 * The analysis lane measured reply rate by intent, and the answer is not
 * "send less of everything" - it is "send less of one specific thing":
 *
 *   ANSWER     18.8% of traffic, 17.6% reply rate
 *   ASK        51.6% of traffic,  0.58% reply rate
 *   BROADCAST  29.6% of traffic,  1.97% reply rate
 *
 * Answering earns a reply about 30x more often than asking, and asking is half
 * of everything ZOE sends. Eight scheduled message types - 1,116 messages over
 * 151 days - drew ZERO replies: watchdog restarts, recurring status reports,
 * build-candidate approvals, cost reports, bot activity logs, agent-bus
 * relays, event promos, and affirmation prose. Those are the cut, and they are
 * cut FIRST rather than at the cap.
 *
 * The one thing that must NOT be cut: failure and breakage notices are the
 * class Zaal reliably answers. Alarms pass the gate and they never queue.
 *
 * WHERE THIS GATE CAN AND CANNOT REACH (measured 2026-08-27)
 * ---------------------------------------------------------
 * The analysis lane's send-site labels (zorca/docs/zoe-send-site-labels.md)
 * carry a first-line matcher per zero-reply type. Every one of them was run
 * against this source tree. Fifteen matchers, two hits:
 *
 *   `Fleet health `   -> brief.ts, i.e. already inside the morning brief
 *   `Team tracker - ` -> team-tracker.ts, reachable only via the /team
 *                        command, so its single message in 151 days is an
 *                        ANSWER to something Zaal typed
 *
 * The other thirteen - `=== ZAO FLEET`, `FLEET OUTPUT - `, `Ecosystem watch - `,
 * `BUILD CANDIDATE #`, `ZOL followed `, the two affirmation texts,
 * `Cost-of-pass `, `BUS from `, `BUS coordinator `, `watchdog`,
 * `froze -> restarted`, `FLEET BRAIN DOWN` - appear NOWHERE in this tree.
 * Nine of the twelve zero-reply types have no emitter here at all.
 *
 * So this gate is the chokepoint FOR THIS PROCESS, and only for it. It wraps
 * the grammy Api instance the ZOE bot owns, which is the actual Telegram send
 * call for every send this process makes. It is not the estate's chokepoint:
 * a VPS cron that posts to the Bot API on its own never enters this process
 * and therefore never touches this budget. Catching those needs a shared
 * chokepoint keyed on the RECIPIENT (Zaal's chat id) rather than the sender -
 * see DONE.md.
 *
 * `noise` HAS NO CALL SITE IN THIS REPO, ON PURPOSE
 * ------------------------------------------------
 * The class, its reserve and its tests are here and correct, and nothing in
 * this tree is tagged with it. That is not an omission to tidy up: every
 * candidate was checked against a matcher and none of them emit the measured
 * text. An earlier pass DID tag three of them - agent-bus relays, cost alerts,
 * fleet self-heals - by reading a module name and deciding it looked right.
 * All three were wrong, and each would have silenced a working sender while
 * the measured traffic carried on arriving.
 *
 * Do not tag anything `noise` from a name, a module path, or a resemblance.
 * The bar is a first-line matcher from the labels file that this tree actually
 * emits. A wrong `noise` tag is strictly worse than no tag: it silences
 * something nobody has checked, and that silence looks exactly like the budget
 * working. An untagged type is merely capped, and stays visible.
 *
 * Named exception, from the labels file: `BUILD CANDIDATE #` approvals must be
 * budgeted at the escalation PRODUCER, never at build-candidate.ts. Capping
 * the button module would suppress the approval UI while the sends kept coming.
 *
 * THE SIX CLASSES
 * ---------------
 *   reply   a direct answer to something Zaal said. ALWAYS passes, and does
 *           NOT count. Solicited traffic is not the problem: 12 replies a
 *           month is not what buried him.
 *   alarm   a failure or breakage notice. ALWAYS passes, NEVER queues, and
 *           counts. This is the highest-reply-rate traffic ZOE sends; a budget
 *           that delays an alarm has optimised away its own best signal.
 *   gated   a needs-you / approval / decision card. ALWAYS passes, and DOES
 *           count - it is the traffic the budget is protecting, so it has to
 *           be visible in the number.
 *   status  ordinary notification. Capped. DROPPED past the cap.
 *   digest  brief / reflection / recap / team digest. Capped. DEFERRED past
 *           the cap into the next morning batch.
 *   noise   a type measured at zero replies over 151 days. Capped at a small
 *           RESERVE of the day's budget (ZOE_NOISE_SHARE, default 25%), so it
 *           is the first thing cut when the day gets busy rather than
 *           competing on equal terms with traffic he answers. Dropped past
 *           that reserve - never queued, because re-sending tomorrow what he
 *           ignored 1,116 times is not a saving.
 *
 * NOTHING IS SILENT. Every drop and every deferral is logged twice - a
 * console line for journald and a JSONL row for counting later. A budget that
 * quietly eats messages is a worse failure than the volume it fixes
 * (silent-failure-guard.md rule 6: a soft-fail must be LOUD).
 *
 * FAIL OPEN. If the state file cannot be read or written, the send goes
 * through and the error is logged. A broken budget file must never be able to
 * mute ZOE completely - the cost of a missed cap is one noisy day; the cost of
 * a mute is Zaal not hearing about a gated decision at all.
 *
 * DAY BOUNDARY is America/New_York, not UTC. Zaal wakes at 4:30am EST and the
 * morning brief fires 09:00 UTC (05:00 EDT). A UTC day boundary would reset
 * the budget at 8pm his time, mid-evening, which is not a day.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SendClass = 'reply' | 'alarm' | 'gated' | 'status' | 'digest' | 'noise';

export type SendOutcome = 'sent' | 'dropped' | 'deferred';

export interface SendDecision {
  outcome: SendOutcome;
  /** True when the send should actually reach Telegram. */
  allow: boolean;
  cls: SendClass;
  /** Counted sends BEFORE this one. */
  countBefore: number;
  /** Whether this send increments the daily counter. */
  counts: boolean;
  cap: number;
  /** Human-readable why, for the log. Never empty. */
  reason: string;
}

/** Per-class policy. The whole behaviour of the gate is this table. */
interface ClassPolicy {
  /** Passes even when the cap is spent. */
  alwaysPasses: boolean;
  /** Increments the daily counter. */
  counts: boolean;
  /** What happens when the cap is spent and it does not always pass. */
  overflow: 'dropped' | 'deferred';
}

const POLICY: Record<SendClass, ClassPolicy> = {
  reply: { alwaysPasses: true, counts: false, overflow: 'dropped' },
  // An alarm always passes AND never queues - both halves matter. Deferring a
  // breakage notice to the morning batch is the same as losing it.
  alarm: { alwaysPasses: true, counts: true, overflow: 'dropped' },
  gated: { alwaysPasses: true, counts: true, overflow: 'dropped' },
  status: { alwaysPasses: false, counts: true, overflow: 'dropped' },
  digest: { alwaysPasses: false, counts: true, overflow: 'deferred' },
  noise: { alwaysPasses: false, counts: true, overflow: 'dropped' },
};

export const DEFAULT_DAILY_SEND_CAP = 20;

/** Runaway guard on the deferred queue: a broken cron must not grow it forever. */
export const MAX_DEFERRED = 200;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Daily cap. `ZOE_DAILY_SEND_CAP`; falls back to 20 on unset/garbage/<=0. */
export function dailySendCap(): number {
  const raw = Number(process.env.ZOE_DAILY_SEND_CAP);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_DAILY_SEND_CAP;
}

/** Default share of the day's cap that measured-zero-reply traffic may use. */
export const DEFAULT_NOISE_SHARE = 0.25;

/**
 * Share of the cap available to the `noise` class. `ZOE_NOISE_SHARE`, a
 * fraction in (0, 1]; falls back to 0.25 on unset/garbage/out-of-range.
 */
export function noiseShare(): number {
  const raw = Number(process.env.ZOE_NOISE_SHARE);
  return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : DEFAULT_NOISE_SHARE;
}

/**
 * The cap that actually applies to one class. Only `noise` differs: it gets a
 * reserve rather than the whole budget, which is what "cut first" means in
 * code - it runs out early instead of racing traffic Zaal answers.
 */
export function effectiveCap(cls: SendClass, cap: number): number {
  return cls === 'noise' ? Math.floor(cap * noiseShare()) : cap;
}

/** The gate enforces by default. `ZOE_SEND_BUDGET=off` disables it entirely. */
export function sendBudgetEnabled(): boolean {
  return (process.env.ZOE_SEND_BUDGET ?? '').toLowerCase() !== 'off';
}

function zoeHome(): string {
  return process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
}

const stateFile = () => join(zoeHome(), 'send-budget.json');
const deferredFile = () => join(zoeHome(), 'send-deferred.jsonl');
const logFile = () => join(zoeHome(), 'send-budget-log.jsonl');

/** YYYY-MM-DD in Zaal's timezone. See the header on why not UTC. */
export function easternDay(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is what we want as a sort-safe key.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now);
}

// ---------------------------------------------------------------------------
// Pure decision core (no IO - this is the part the tests pin)
// ---------------------------------------------------------------------------

/**
 * Decide what happens to a send, given how many counted sends have already
 * gone out today. Pure: same inputs, same answer, no clock, no disk.
 */
export function decide(cls: SendClass, countedToday: number, cap: number): SendDecision {
  const policy = POLICY[cls];
  // `noise` runs out of budget early by design; every other class sees the
  // whole cap. Report the effective number so the log says what really bound.
  const limit = effectiveCap(cls, cap);
  const capSpent = countedToday >= limit;

  if (policy.alwaysPasses) {
    return {
      outcome: 'sent',
      allow: true,
      cls,
      countBefore: countedToday,
      counts: policy.counts,
      cap: limit,
      reason: capSpent
        ? `${cls} always passes (over cap ${countedToday}/${limit})`
        : `${cls} always passes (${countedToday}/${limit})`,
    };
  }

  if (!capSpent) {
    return {
      outcome: 'sent',
      allow: true,
      cls,
      countBefore: countedToday,
      counts: policy.counts,
      cap: limit,
      reason: `under cap (${countedToday}/${limit}${cls === 'noise' ? ' noise reserve' : ''})`,
    };
  }

  return {
    outcome: policy.overflow,
    allow: false,
    cls,
    countBefore: countedToday,
    counts: false, // a send that never left does not spend budget
    cap: limit,
    reason:
      policy.overflow === 'deferred'
        ? `cap spent (${countedToday}/${limit}) - queued for the next morning batch`
        : `${cls === 'noise' ? 'noise reserve' : 'cap'} spent (${countedToday}/${limit}) - dropped`,
  };
}

// ---------------------------------------------------------------------------
// Day state (counter), persisted so a restart cannot reset the cap
// ---------------------------------------------------------------------------

interface BudgetState {
  day: string;
  counted: number;
}

let cached: BudgetState | null = null;

async function readState(now: Date): Promise<BudgetState> {
  const today = easternDay(now);
  if (cached && cached.day === today) return cached;
  try {
    const raw = await fs.readFile(stateFile(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<BudgetState>;
    if (parsed.day === today && typeof parsed.counted === 'number' && parsed.counted >= 0) {
      cached = { day: today, counted: parsed.counted };
      return cached;
    }
  } catch {
    // Missing or corrupt file is the normal first-run case, not an incident.
    // A new day also lands here via the day mismatch above.
  }
  cached = { day: today, counted: 0 };
  return cached;
}

async function writeState(state: BudgetState): Promise<void> {
  try {
    await fs.mkdir(zoeHome(), { recursive: true });
    await fs.writeFile(stateFile(), JSON.stringify(state), 'utf8');
  } catch (err) {
    // Fail open, loudly. The in-memory counter still holds for this process.
    console.warn('[zoe/send-budget] could not persist counter:', (err as Error).message);
  }
}

/** How many counted sends have gone out today. For /budget-style status. */
export async function sendsToday(now: Date = new Date()): Promise<number> {
  return (await readState(now)).counted;
}

/** Test-only: forget the in-memory counter so a fresh ZOE_HOME is honoured. */
export function resetSendBudgetForTest(): void {
  cached = null;
}

// ---------------------------------------------------------------------------
// The log - a drop or a deferral is never silent
// ---------------------------------------------------------------------------

export interface SendLogRow {
  at: string;
  outcome: SendOutcome;
  cls: SendClass;
  chatId: number;
  countBefore: number;
  cap: number;
  reason: string;
  /** First 120 chars, so the log is greppable without becoming a transcript. */
  preview: string;
}

async function logDecision(row: SendLogRow): Promise<void> {
  // journald first: this is the line a human greps when ZOE goes quiet.
  console.warn(
    `[zoe/send-budget] ${row.outcome} ${row.cls} -> chat ${row.chatId}: ${row.reason} | ${row.preview}`,
  );
  try {
    await fs.mkdir(zoeHome(), { recursive: true });
    await fs.appendFile(logFile(), `${JSON.stringify(row)}\n`, 'utf8');
  } catch (err) {
    console.warn('[zoe/send-budget] could not append send log:', (err as Error).message);
  }
}

/** Read the decision log (newest last). For selftests and a /sends command. */
export async function readSendLog(): Promise<SendLogRow[]> {
  try {
    const raw = await fs.readFile(logFile(), 'utf8');
    return raw
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as SendLogRow);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// The deferred queue - briefs/digests/reflections wait for the morning
// ---------------------------------------------------------------------------

export interface DeferredSend {
  at: string;
  cls: SendClass;
  chatId: number;
  text: string;
}

async function deferSend(entry: DeferredSend): Promise<void> {
  try {
    await fs.mkdir(zoeHome(), { recursive: true });
    const existing = await readDeferred();
    const next = [...existing, entry];
    // Keep the newest MAX_DEFERRED. An overflowing queue is itself a finding,
    // so say how many were dropped rather than trimming quietly.
    if (next.length > MAX_DEFERRED) {
      const lost = next.length - MAX_DEFERRED;
      console.warn(
        `[zoe/send-budget] deferred queue over ${MAX_DEFERRED} - dropped ${lost} oldest entries`,
      );
    }
    const kept = next.slice(-MAX_DEFERRED);
    await fs.writeFile(deferredFile(), kept.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  } catch (err) {
    console.warn('[zoe/send-budget] could not queue deferred send:', (err as Error).message);
  }
}

/** Everything currently waiting for the next morning batch. Non-destructive. */
export async function readDeferred(): Promise<DeferredSend[]> {
  try {
    const raw = await fs.readFile(deferredFile(), 'utf8');
    return raw
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as DeferredSend);
  } catch {
    return [];
  }
}

/**
 * Take everything waiting and clear the queue. The morning-brief job calls this
 * and sends the result as ONE message - the whole point is that yesterday's
 * deferred digests arrive as a single batch, not as the drip that caused this.
 */
export async function drainDeferred(): Promise<DeferredSend[]> {
  const entries = await readDeferred();
  if (entries.length === 0) return [];
  try {
    await fs.writeFile(deferredFile(), '', 'utf8');
  } catch (err) {
    console.warn('[zoe/send-budget] could not clear deferred queue:', (err as Error).message);
  }
  return entries;
}

/** Render drained entries as one batched message body. */
export function renderDeferredBatch(entries: DeferredSend[]): string {
  const head = `Held back yesterday (${entries.length} ${entries.length === 1 ? 'item' : 'items'}, over the daily send cap):`;
  const body = entries
    .map((e) => {
      const time = e.at.slice(11, 16);
      return `- [${time} ${e.cls}] ${e.text}`;
    })
    .join('\n\n');
  return `${head}\n\n${body}`;
}

// ---------------------------------------------------------------------------
// Class context - how a send says which class it is
// ---------------------------------------------------------------------------

const classStore = new AsyncLocalStorage<SendClass>();

/**
 * Run `fn` with every Telegram send inside it classed as `cls`.
 *
 * Used at three coarse points rather than at 50 call sites: the grammy
 * middleware (everything sent while handling an inbound update is a `reply`),
 * the digest-shaped cron jobs, and the gated/approval surfaces.
 */
export function runWithSendClass<T>(cls: SendClass, fn: () => T): T {
  return classStore.run(cls, fn);
}

/** The class in effect right now, or undefined outside any context. */
export function currentSendClass(): SendClass | undefined {
  return classStore.getStore();
}

const VALID: readonly SendClass[] = ['reply', 'alarm', 'gated', 'status', 'digest', 'noise'];

/**
 * Resolve the class for one send. Precedence:
 *   1. an explicit `zoeSendClass` on the send options (a single call site
 *      that knows better than its surrounding job)
 *   2. the enclosing runWithSendClass context
 *   3. 'status' - the safe default, because an untagged autonomous send is
 *      exactly the kind of traffic the cap exists to bound.
 */
export function resolveSendClass(opts?: Record<string, unknown>): SendClass {
  const hint = opts?.zoeSendClass;
  if (typeof hint === 'string' && (VALID as readonly string[]).includes(hint)) {
    return hint as SendClass;
  }
  return currentSendClass() ?? 'status';
}

/** Options minus our private hint, so Telegram never sees it. */
export function stripSendClass(opts?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!opts || !('zoeSendClass' in opts)) return opts;
  const { zoeSendClass: _drop, ...rest } = opts;
  return rest;
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

/** What a blocked send returns in place of a Telegram Message. */
export interface BlockedSendResult {
  message_id: 0;
  zoeSendBudget: SendOutcome;
}

function blockedResult(outcome: SendOutcome): BlockedSendResult {
  return { message_id: 0, zoeSendBudget: outcome };
}

/**
 * True when a send RESOLVED without reaching Telegram because this gate dropped
 * or deferred it.
 *
 * A blocked send deliberately does not throw, so `try/catch` cannot see it and
 * the resolved value is a non-null object - which means the ordinary
 * "did the send work" test, `result != null`, now answers YES for a message
 * that was never delivered. Any caller that writes durable state on the
 * strength of a send (a dedup marker, a cursor, a pinned message id) MUST check
 * this before recording delivery, or the gate turns a capped send into silent
 * data loss.
 */
export function wasSendBlocked(result: unknown): boolean {
  return (
    typeof result === 'object' &&
    result !== null &&
    typeof (result as { zoeSendBudget?: unknown }).zoeSendBudget === 'string'
  );
}

/** Thrown by `assertSendDelivered` when the gate blocked the send. */
export class SendBlockedError extends Error {
  readonly outcome: SendOutcome;
  constructor(outcome: SendOutcome) {
    super(`send budget ${outcome} - the message never reached Telegram`);
    this.name = 'SendBlockedError';
    this.outcome = outcome;
  }
}

/**
 * Pass a delivered send through; THROW when the gate blocked it.
 *
 * For the large class of callers whose failure branch is already correct - a
 * `catch` that logs and leaves the item unmarked so the next tick retries - the
 * only thing missing is that a blocked send never enters that branch, because
 * it resolves. Wrapping the send in this turns the gate's silent block into the
 * failure those callers already handle, instead of a success they record
 * durably for a message nobody received.
 *
 * Use it at the adapter that hands a send function to such a caller. Callers
 * that want to branch rather than throw should use `wasSendBlocked` directly.
 */
export function assertSendDelivered<T>(result: T): T {
  if (wasSendBlocked(result)) {
    throw new SendBlockedError((result as { zoeSendBudget: SendOutcome }).zoeSendBudget);
  }
  return result;
}

export type RawSend = (chatId: number, text: string, opts?: Record<string, unknown>) => Promise<unknown>;

/**
 * Wrap a raw send with the budget. The returned function has the same shape,
 * so it can be dropped in anywhere `bot.api.sendMessage` was used.
 *
 * A blocked send resolves (it never throws and never rejects) with
 * `{ message_id: 0, zoeSendBudget }` - callers that read `message_id` to arm
 * reply context get a falsy id rather than a crash.
 */
export function gateSend(raw: RawSend, now: () => Date = () => new Date()): RawSend {
  // Arity is preserved for plain sends: some grammy call sites (and the tests
  // that inject a fake send) treat a trailing undefined options arg as a
  // different call. Same guard tg-chunk.ts carries, for the same reason.
  const passThrough = (chatId: number, text: string, clean?: Record<string, unknown>) =>
    clean === undefined ? raw(chatId, text) : raw(chatId, text, clean);

  return async (chatId, text, opts) => {
    const clean = stripSendClass(opts);
    if (!sendBudgetEnabled()) return passThrough(chatId, text, clean);

    let decision: SendDecision;
    let state: BudgetState;
    try {
      const at = now();
      state = await readState(at);
      decision = decide(resolveSendClass(opts), state.counted, dailySendCap());
    } catch (err) {
      // Fail OPEN, loudly. Never let a broken budget mute ZOE.
      console.warn('[zoe/send-budget] gate failed open:', (err as Error).message);
      return passThrough(chatId, text, clean);
    }

    const at = now().toISOString();

    if (!decision.allow) {
      if (decision.outcome === 'deferred') {
        await deferSend({ at, cls: decision.cls, chatId, text });
      }
      await logDecision({
        at,
        outcome: decision.outcome,
        cls: decision.cls,
        chatId,
        countBefore: decision.countBefore,
        cap: decision.cap,
        reason: decision.reason,
        preview: text.slice(0, 120),
      });
      return blockedResult(decision.outcome);
    }

    const result = await passThrough(chatId, text, clean);
    if (decision.counts) {
      cached = { day: state.day, counted: state.counted + 1 };
      await writeState(cached);
    }
    return result;
  };
}

/**
 * Install the gate on a live grammy bot, in place. Call once, at boot, before
 * any handler or cron is registered.
 *
 * Wrapping `bot.api.sendMessage` rather than each caller is deliberate: it is
 * the one thing every path already goes through, so a send added tomorrow is
 * budgeted without anyone remembering to budget it.
 */
export function installSendBudget(bot: { api: { sendMessage: RawSend } }): void {
  const raw = bot.api.sendMessage.bind(bot.api) as RawSend;
  const gated = gateSend(raw);
  bot.api.sendMessage = ((chatId: number, text: string, opts?: Record<string, unknown>) =>
    gated(chatId, text, opts)) as typeof bot.api.sendMessage;
}
