/**
 * Mention listener (ZOL): wires the Farcaster event stream to the approval-gated
 * caster pipeline. When @zolbot (FARCASTER_BOT_FID) is mentioned, this turns the
 * incoming cast into a reply CasterTrigger and runs runCasterPipeline - which
 * drafts (with ZABAL Bonfire memory, doc 891/PR #957), safety-checks, and sends
 * the draft to the lead in Telegram for y/n BEFORE anything is published.
 *
 * Nothing is posted autonomously: the human-approval gate in runCasterPipeline
 * stands. This module only connects "a mention arrived" -> "draft a reply for
 * approval". Start it once at boot: startMentionListener(bot, { zaalId, persona }).
 */
import type { Bot } from 'grammy';
import { subscribeToCasts, type IncomingCast } from '../farcaster/event-stream';
import { runCasterPipeline, type CasterTrigger } from './index';

export interface MentionListenerOpts {
  /** Telegram id of the lead who approves drafts. */
  zaalId: number;
  /** ZOL persona / system prompt (from the persona block). */
  persona: string;
  /** registry agent id; defaults to 'zol'. */
  agentId?: string;
  /** optional model override for drafting. */
  model?: string;
}

/** Pure: map an incoming mention into a reply trigger for the caster pipeline. */
export function mentionToTrigger(cast: IncomingCast, opts: MentionListenerOpts): CasterTrigger {
  return {
    agentId: opts.agentId ?? 'zol',
    persona: opts.persona,
    context: cast.text,
    parent: { fid: cast.fid, hash: cast.hash },
    model: opts.model,
  };
}

/**
 * Subscribe to mentions and draft an approval-gated reply for each. Returns an
 * unsubscribe function. Errors in a single reply never tear down the stream.
 */
export async function startMentionListener(bot: Bot, opts: MentionListenerOpts): Promise<() => void> {
  return subscribeToCasts(async (cast) => {
    try {
      await runCasterPipeline(bot, opts.zaalId, mentionToTrigger(cast, opts));
    } catch (e) {
      console.error('[caster/mention-listener] reply pipeline failed:', (e as Error).message);
    }
  });
}
