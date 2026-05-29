/**
 * Caster pipeline (doc 761, Phase 2) under ZOE.
 *
 * Pipeline: draftCast (OpenRouter) -> safetyCheck (Klearu PRE) -> Telegram approval (human
 * gate) -> publishCast (sign -> write endpoint) -> optional Klearu POST.
 *
 * The human-approval gate is mandatory and stack-independent: every drafted cast/reply goes to
 * the lead in Telegram for y/n before submitMessage. Reads/likes auto-allow; casts/replies and
 * all onchain $ZABAL actions require approval (doc 761).
 *
 * Integration: call attachCaster(bot, { zaalId }) once at boot to register the approval
 * callback handler. The event stream (or a manual trigger) calls runCasterPipeline(...).
 */
import { Bot, Context, InlineKeyboard } from 'grammy';
import { checkCast, type SafetyVerdict } from '../safety/klearu';
import { draftCast } from './reason';
import { publishCast } from '../farcaster/write';

export interface CasterTrigger {
  /** which registry agent is acting */
  agentId: string;
  /** agent persona / system prompt */
  persona: string;
  /** the context the agent is reacting to (cast text, thread, topic prompt) */
  context: string;
  /** reply target, if this is a reply rather than a top-level cast */
  parent?: { fid: number; hash: `0x${string}` };
  /** local image paths to safety-check (if the draft attaches media) */
  imagePaths?: string[];
  /** optional model override */
  model?: string;
}

interface PendingCast {
  trigger: CasterTrigger;
  draftText: string;
  verdict: SafetyVerdict;
  createdAt: number;
}

const pending = new Map<string, PendingCast>();
const PENDING_TTL_MS = 1000 * 60 * 30; // 30 min

function newId(): string {
  // No Math.random in some sandboxes; this runs in the live bot process where it is fine.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function gcPending(): void {
  const now = Date.now();
  for (const [id, p] of pending) {
    if (now - p.createdAt > PENDING_TTL_MS) pending.delete(id);
  }
}

/**
 * Run the draft + safety stages and send the draft to Zaal for approval. Does NOT publish -
 * publishing happens on the approve callback.
 */
export async function runCasterPipeline(
  bot: Bot,
  zaalId: number,
  trigger: CasterTrigger,
): Promise<{ status: 'awaiting_approval' | 'blocked'; id?: string; verdict: SafetyVerdict }> {
  gcPending();

  const draft = await draftCast({
    persona: trigger.persona,
    context: trigger.context,
    model: trigger.model,
  });

  const verdict = await checkCast({ text: draft.text, imagePaths: trigger.imagePaths });

  if (!verdict.safe) {
    // Blocked by Klearu PRE gate. Notify Zaal; do not offer to publish.
    await bot.api.sendMessage(
      zaalId,
      `[caster:${trigger.agentId}] draft BLOCKED by safety gate (${verdict.label}, ${verdict.reason}).\n\n` +
        `Draft was:\n${draft.text}`,
    );
    return { status: 'blocked', verdict };
  }

  const id = newId();
  pending.set(id, { trigger, draftText: draft.text, verdict, createdAt: Date.now() });

  const kind = trigger.parent ? 'reply' : 'cast';
  const kb = new InlineKeyboard()
    .text('Approve', `cast-approve:${id}`)
    .text('Reject', `cast-reject:${id}`)
    .text('Regen', `cast-regen:${id}`);

  await bot.api.sendMessage(
    zaalId,
    `[caster:${trigger.agentId}] proposed ${kind} (model ${draft.model}, safety ${verdict.label}):\n\n` +
      `${draft.text}\n\n(${draft.text.length}/320 chars)`,
    { reply_markup: kb },
  );

  return { status: 'awaiting_approval', id, verdict };
}

/** Register the approval callback handler. Call once at boot. */
export function attachCaster(bot: Bot, opts: { zaalId: number }): void {
  bot.callbackQuery(/^cast-(approve|reject|regen):(.+)$/, async (ctx: Context) => {
    if (ctx.from?.id !== opts.zaalId) {
      await ctx.answerCallbackQuery('not authorized');
      return;
    }
    const m = ctx.callbackQuery?.data?.match(/^cast-(approve|reject|regen):(.+)$/);
    if (!m) return;
    const action = m[1];
    const id = m[2];
    const entry = pending.get(id);
    if (!entry) {
      await ctx.answerCallbackQuery('expired or already handled');
      return;
    }

    if (action === 'reject') {
      pending.delete(id);
      await ctx.answerCallbackQuery('rejected');
      await ctx.editMessageText(`[caster:${entry.trigger.agentId}] REJECTED.\n\n${entry.draftText}`);
      return;
    }

    if (action === 'regen') {
      await ctx.answerCallbackQuery('regenerating...');
      pending.delete(id);
      // Re-run from draft. Reuses the same trigger context.
      const res = await runCasterPipeline(bot, opts.zaalId, entry.trigger);
      await ctx.editMessageText(
        res.status === 'blocked'
          ? `[caster:${entry.trigger.agentId}] regen BLOCKED by safety gate.`
          : `[caster:${entry.trigger.agentId}] regenerated - see new draft below.`,
      );
      return;
    }

    // approve -> publish
    await ctx.answerCallbackQuery('publishing...');
    try {
      const result = await publishCast({ text: entry.draftText, parent: entry.trigger.parent });
      pending.delete(id);
      await ctx.editMessageText(
        `[caster:${entry.trigger.agentId}] PUBLISHED.\nhash: ${result.hash}\nfid: ${result.fid}\n\n${entry.draftText}`,
      );
    } catch (e) {
      await ctx.editMessageText(
        `[caster:${entry.trigger.agentId}] publish FAILED: ${e instanceof Error ? e.message : e}\n\n` +
          `Draft kept. Try Regen or fix the write endpoint.\n\n${entry.draftText}`,
      );
    }
  });
}
