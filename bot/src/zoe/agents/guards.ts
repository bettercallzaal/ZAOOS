/**
 * Pre-LLM guard battery (doc 761 Phase 3, design from doc 318).
 *
 * Runs BEFORE the reasoning/draft step to cheaply reject actions that should not fire, so we
 * do not burn tokens (or post junk) on them. Ordered cheapest-first; the first failing guard
 * short-circuits. Klearu (the only network/subprocess guard) runs last.
 *
 * Guards:
 *   1. alive schedule    - is the agent within its active hours/days?
 *   2. cooldown (>=90s)  - enough time since the agent last acted?
 *   3. budget            - activity_budget for the window not exhausted?
 *   4. thread depth      - not replying deeper than thread_max_depth?
 *   5. semantic dedup    - not near-duplicate of a recent post?
 *   6. conversation-closed - trigger isn't a conversation closer (thanks/bye/gg)?
 *   7. memory presence   - (soft) decayed relevance available? informational, not a hard block
 *   8. Klearu safety     - PRE classification gate
 * Plus a 15-90s humanized delay returned for the caller to apply before posting.
 */
import type { AgentSpec } from './registry';
import { checkText, type SafetyVerdict } from '../safety/klearu';

export interface GuardState {
  /** seconds since this agent last acted (Infinity if never) */
  secondsSinceLastAction: number;
  /** actions used this budget window */
  actionsUsed: number;
  /** depth of the thread we'd be replying into (0 = top-level cast) */
  threadDepth: number;
  /** recent posts by this agent (for dedup) - lowercased text */
  recentPosts: string[];
  /** current time in ms (Date.now() in the live process) */
  nowMs: number;
}

export interface GuardResult {
  pass: boolean;
  blockedBy: string | null;
  detail: string;
  /** humanized delay to apply before posting if pass=true (ms) */
  delayMs: number;
  /** Klearu verdict when the safety guard ran */
  safety?: SafetyVerdict;
}

const CONVERSATION_CLOSERS = ['thanks', 'thank you', 'ty', 'bye', 'gg', 'gn', 'cya', 'cool, thanks'];

function isAlive(agent: AgentSpec, nowMs: number): boolean {
  const d = new Date(nowMs);
  const [start, end] = agent.schedule.active_hours_utc;
  const days = agent.schedule.active_days;
  if (days && days.length > 0 && !days.includes(d.getUTCDay())) return false;
  if (start === end) return true; // always alive
  const h = d.getUTCHours();
  return start < end ? h >= start && h < end : h >= start || h < end; // handle wrap
}

/** Token-overlap similarity 0..1 between two short texts. */
function overlap(a: string, b: string): number {
  const A = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.min(A.size, B.size);
}

/** Deterministic-friendly humanized delay in [15s, 90s]. `jitter` in [0,1). */
export function humanizedDelayMs(jitter: number): number {
  return Math.round((15 + jitter * 75) * 1000);
}

/**
 * Run the guard battery. `triggerText` is the inbound context; `dedupThreshold` (default 0.8)
 * is the max allowed overlap with a recent post. `jitter` seeds the humanized delay.
 */
export async function runGuards(
  agent: AgentSpec,
  triggerText: string,
  state: GuardState,
  opts: { dedupThreshold?: number; jitter: number },
): Promise<GuardResult> {
  const delayMs = humanizedDelayMs(opts.jitter);
  const fail = (blockedBy: string, detail: string): GuardResult => ({
    pass: false,
    blockedBy,
    detail,
    delayMs,
  });

  // 1. alive schedule
  if (!isAlive(agent, state.nowMs)) return fail('schedule', 'agent not within active hours/days');

  // 2. cooldown (>=90s floor enforced in registry.coerce)
  if (state.secondsSinceLastAction < agent.cooldown_seconds) {
    return fail('cooldown', `${state.secondsSinceLastAction}s < ${agent.cooldown_seconds}s cooldown`);
  }

  // 3. budget
  if (state.actionsUsed >= agent.activity_budget) {
    return fail('budget', `activity_budget ${agent.activity_budget} exhausted`);
  }

  // 4. thread depth
  if (state.threadDepth > agent.thread_max_depth) {
    return fail('thread_depth', `depth ${state.threadDepth} > max ${agent.thread_max_depth}`);
  }

  // 5. semantic dedup
  const threshold = opts.dedupThreshold ?? 0.8;
  const maxSim = state.recentPosts.reduce((m, p) => Math.max(m, overlap(triggerText, p)), 0);
  if (maxSim >= threshold) {
    return fail('dedup', `near-duplicate of recent post (overlap ${maxSim.toFixed(2)})`);
  }

  // 6. conversation-closed
  const lower = triggerText.toLowerCase().trim();
  if (CONVERSATION_CLOSERS.some((c) => lower === c || lower.endsWith(` ${c}`) || lower.startsWith(`${c} `))) {
    return fail('conversation_closed', 'trigger looks like a conversation closer');
  }

  // 7. memory presence is informational only (handled by decay.ts at context-assembly) - no block.

  // 8. Klearu safety PRE gate
  const safety = await checkText(triggerText);
  if (!safety.safe) {
    return { pass: false, blockedBy: 'klearu', detail: `${safety.label}: ${safety.reason}`, delayMs, safety };
  }

  return { pass: true, blockedBy: null, detail: 'all guards passed', delayMs, safety };
}
