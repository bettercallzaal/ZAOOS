/**
 * Multi-agent orchestrator (doc 761 Phase 3) - wires registry -> softmax ranker -> guard
 * battery -> caster pipeline. This is the probabilistic, multi-agent replacement for the
 * single-agent caster trigger in index.ts.
 *
 * Flow per trigger:
 *   1. loadAgents()
 *   2. rankAgents() over the candidates, sampleAgent() to pick one (probabilistic)
 *   3. runGuards() for the picked agent (cooldown/budget/depth/dedup/closed/safety/schedule)
 *   4. if pass: wait the humanized delay, then runCasterPipeline() (which adds the human gate)
 *   5. record the action against the agent's runtime (cooldown + budget bookkeeping)
 *
 * Runtime state (last-action time, budget used, recent posts) is kept in-memory per process.
 * The budget window resets every BUDGET_WINDOW_MS.
 */
import type { Bot } from 'grammy';
import { loadAgents, type AgentSpec } from './registry';
import { rankAgents, sampleAgent, type RankInput } from './ranker';
import { runGuards, type GuardState } from './guards';
import { runCasterPipeline, type CasterTrigger } from '../caster';

const BUDGET_WINDOW_MS = 1000 * 60 * 60 * 24; // 24h

interface AgentRuntime {
  lastActionMs: number;
  actionsUsed: number;
  windowStartMs: number;
  recentPosts: string[];
}

const runtime = new Map<string, AgentRuntime>();

function getRuntime(agentId: string, nowMs: number): AgentRuntime {
  let r = runtime.get(agentId);
  if (!r) {
    r = { lastActionMs: -Infinity, actionsUsed: 0, windowStartMs: nowMs, recentPosts: [] };
    runtime.set(agentId, r);
  }
  if (nowMs - r.windowStartMs > BUDGET_WINDOW_MS) {
    r.actionsUsed = 0;
    r.windowStartMs = nowMs;
  }
  return r;
}

export interface OrchestrateTrigger {
  /** lowercased-able trigger text (the cast we're reacting to) */
  text: string;
  /** reply target */
  parent?: { fid: number; hash: `0x${string}` };
  threadDepth?: number;
  /** uniform samples for determinism in tests; default Math.random per call */
  rng?: () => number;
}

export interface OrchestrateOutcome {
  picked: string | null;
  fired: boolean;
  blockedBy?: string | null;
  detail: string;
}

function rankInputsFor(agents: AgentSpec[], nowMs: number, rng: () => number): RankInput[] {
  return agents.map((agent) => {
    const r = getRuntime(agent.agent_id, nowMs);
    return {
      agent,
      secondsSinceLastAction: isFinite(r.lastActionMs) ? (nowMs - r.lastActionMs) / 1000 : Infinity,
      actionsUsed: r.actionsUsed,
      noise: rng(),
    };
  });
}

/**
 * Decide + (maybe) fire one agent action for a trigger. Returns the outcome. The actual
 * publish still goes through the Telegram human-approval gate inside runCasterPipeline.
 */
export async function orchestrate(
  bot: Bot,
  zaalId: number,
  trigger: OrchestrateTrigger,
): Promise<OrchestrateOutcome> {
  const rng = trigger.rng ?? Math.random;
  const nowMs = Date.now();
  const agents = await loadAgents();
  const triggerText = trigger.text.toLowerCase();

  const ranked = rankAgents(rankInputsFor(agents, nowMs, rng), { triggerText });
  const choice = sampleAgent(ranked, rng());
  if (!choice) return { picked: null, fired: false, detail: 'no agents in registry' };

  const agent = choice.agent;
  const r = getRuntime(agent.agent_id, nowMs);

  const state: GuardState = {
    secondsSinceLastAction: isFinite(r.lastActionMs) ? (nowMs - r.lastActionMs) / 1000 : Infinity,
    actionsUsed: r.actionsUsed,
    threadDepth: trigger.threadDepth ?? 0,
    recentPosts: r.recentPosts,
    nowMs,
  };

  const guard = await runGuards(agent, trigger.text, state, { jitter: rng() });
  if (!guard.pass) {
    return { picked: agent.agent_id, fired: false, blockedBy: guard.blockedBy, detail: guard.detail };
  }

  // Humanized delay before acting (15-90s).
  await new Promise((res) => setTimeout(res, guard.delayMs));

  const casterTrigger: CasterTrigger = {
    agentId: agent.agent_id,
    persona: agent.persona_prompt,
    context: `Someone cast: "${trigger.text}". Draft a reply in your voice.`,
    parent: trigger.parent,
  };
  const result = await runCasterPipeline(bot, zaalId, casterTrigger);

  // Bookkeeping: count the action against cooldown/budget regardless of approval (it consumed
  // an action slot + a draft). recentPosts records the trigger for dedup.
  r.lastActionMs = nowMs;
  r.actionsUsed += 1;
  r.recentPosts.push(trigger.text.toLowerCase());
  if (r.recentPosts.length > 50) r.recentPosts.shift();

  return {
    picked: agent.agent_id,
    fired: result.status === 'awaiting_approval',
    detail: `${agent.agent_id}: ${result.status} (safety ${result.verdict.label})`,
  };
}
