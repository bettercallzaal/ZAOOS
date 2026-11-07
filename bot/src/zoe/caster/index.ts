/**
 * Caster pipeline (doc 761, Phase 2) under ZOE.
 *
 * Pipeline: draftCast (OpenRouter) -> safetyCheck (Klearu PRE) -> Telegram card to Zaal ->
 * on "Ready to post", the draft is handed back to him as text to post himself.
 *
 * ZOE does not post to Farcaster (ruling 305, 2026-11-07). The card used to publish on Approve,
 * through FFX or publishCast (sign -> paid write endpoint). It no longer calls either: the
 * approve tap edits the card into the final text plus, for a reply, the cast to reply to, and
 * Zaal posts it from his own account. publishCast itself refuses (farcaster/write.ts), so no
 * other path can post either.
 *
 * Integration: call attachCaster(bot, { zaalId }) once at boot to register the approval
 * callback handler. The event stream (or a manual trigger) calls runCasterPipeline(...).
 */
import { Bot, Context, InlineKeyboard } from 'grammy';
import { checkCast, type SafetyVerdict } from '../safety/klearu';
import { draftCast } from './reason';
import { FARCASTER_WRITE_REFUSED } from '../farcaster/write';
import { featureRan } from '../feature-ran';
import { wasSendBlocked } from '../send-budget';

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
): Promise<{ status: 'awaiting_approval' | 'blocked' | 'undelivered'; id?: string; verdict: SafetyVerdict }> {
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
    .text('Ready to post', `cast-approve:${id}`)
    .text('Reject', `cast-reject:${id}`)
    .text('Regen', `cast-regen:${id}`);

  const sent = await bot.api.sendMessage(
    zaalId,
    `[caster:${trigger.agentId}] proposed ${kind} (model ${draft.model}, safety ${verdict.label}):\n\n` +
      `${draft.text}\n\n(${draft.text.length}/320 chars)`,
    { reply_markup: kb },
  );

  // The send budget wraps bot.api.sendMessage at boot and a blocked send
  // RESOLVES, so this looked delivered. The approval card is the only way this
  // draft can ever be published, so a blocked one left a pending cast nobody
  // was shown (until the 30-minute TTL swept it) while the caller recorded the
  // trigger as handled and would not offer it again. Drop the pending entry and
  // say what happened.
  if (wasSendBlocked(sent)) {
    pending.delete(id);
    return { status: 'undelivered', verdict };
  }

  return { status: 'awaiting_approval', id, verdict };
}

/** The card text after "Ready to post": the draft, ready for Zaal to post himself. */
export function handOffText(entry: Pick<PendingCast, 'trigger' | 'draftText'>): string {
  const where = entry.trigger.parent
    ? `Reply to cast ${entry.trigger.parent.hash} (fid ${entry.trigger.parent.fid}).`
    : 'A new cast.';
  return (
    `[caster:${entry.trigger.agentId}] ready for you to post. ${FARCASTER_WRITE_REFUSED}\n` +
    `${where}\n\n${entry.draftText}`
  );
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

    // approve -> hand the draft to Zaal. Never publish (ruling 305): no FFX call, no
    // publishCast. The final text is what he copies into Farcaster himself.
    pending.delete(id);
    await ctx.answerCallbackQuery('draft ready');
    featureRan('caster-draft-handed-off', entry.trigger.agentId);
    await ctx.editMessageText(handOffText(entry));
  });
}
