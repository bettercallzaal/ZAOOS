/**
 * One place that decides how an inbound cast becomes a drafted reply.
 *
 * Before this file, index.ts sent every matching cast straight to
 * runCasterPipeline. That path has the human approval gate and the Klearu
 * check, and nothing else: no cooldown, no daily budget, no thread-depth limit,
 * no duplicate check. So a burst of mentions became a burst of drafts.
 *
 * The guard battery for exactly that already exists (agents/guards.ts) and so
 * does the function that runs it before the pipeline (agents/orchestrate.ts).
 * Nothing live called either. This file is the missing call, behind a flag.
 *
 * ZOE_CASTER_GUARDS, DEFAULT OFF. Only the exact string "true" turns it on.
 *   off: runCasterPipeline directly, exactly as before.
 *   on:  orchestrate(), which picks an agent from the registry, runs the guard
 *        battery (schedule, cooldown, budget, thread depth, dedup, conversation
 *        closed, Klearu), waits a humanized delay, and only then calls the
 *        same pipeline. The Telegram approval gate is unchanged in both modes.
 *
 * Turning it on needs at least one agent in the registry: with none,
 * orchestrate drafts nothing ("no agents in registry").
 */
import type { Bot } from 'grammy';
import { orchestrate } from '../agents/orchestrate';
import { featureRan } from '../feature-ran';
import { runCasterPipeline } from './index';

export interface InboundCast {
  fid: number;
  hash: `0x${string}`;
  text: string;
}

export function casterGuardsEnabled(): boolean {
  return process.env.ZOE_CASTER_GUARDS === 'true';
}

export type CastTriggerOutcome =
  | { mode: 'direct'; status: 'awaiting_approval' | 'blocked' | 'undelivered' }
  | { mode: 'guarded'; fired: boolean; blockedBy: string | null; detail: string };

/** Handle one inbound cast. Rejects if the pipeline rejects; the caller logs it. */
export async function handleCastTrigger(
  bot: Bot,
  zaalId: number,
  cast: InboundCast,
  persona: string,
): Promise<CastTriggerOutcome> {
  const parent = { fid: cast.fid, hash: cast.hash };

  if (!casterGuardsEnabled()) {
    const res = await runCasterPipeline(bot, zaalId, {
      agentId: 'caster',
      persona,
      context: `Someone cast (fid ${cast.fid}): "${cast.text}". Draft a reply.`,
      parent,
    });
    return { mode: 'direct', status: res.status };
  }

  featureRan('caster-guards', `fid ${cast.fid}`);
  const out = await orchestrate(bot, zaalId, { text: cast.text, parent });
  if (!out.fired) {
    console.log(`[zoe/caster] guarded trigger not fired: ${out.blockedBy ?? 'n/a'} - ${out.detail}`);
  }
  return { mode: 'guarded', fired: out.fired, blockedBy: out.blockedBy ?? null, detail: out.detail };
}
