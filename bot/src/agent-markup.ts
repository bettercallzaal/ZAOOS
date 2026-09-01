/**
 * Strip agent-internal markup before anything reaches a human.
 *
 * WHY THIS EXISTS
 * On 2026-05-13 the bot posted a raw `<think>` block into the Telegram
 * #marketing channel as the message body. It sat there as the channel preview
 * for three and a half months and was found on 2026-09-01 only because someone
 * scrolled past the sidebar. Nothing errored: Telegram accepted the send and
 * returned 200, so every automated check stayed green. ZAOOS#3383.
 *
 * The regex to prevent it ALREADY EXISTED in this repo, at
 * `src/actions.ts` inside `stripCodeFences`, with a comment naming Minimax M2.7
 * as the model that wraps output this way. But it only ran on the path that
 * parses JSON out of a model reply. The path that sends a plain-text reply to a
 * human never got it.
 *
 * That is the actual root cause, and it is structural rather than a typo: the
 * boundary had to be remembered separately by each caller, so it was missed by
 * the one caller that mattered. This module exists so the strip lives in ONE
 * place, wired into the outbound API transformer in `src/index.ts`, and every
 * future send inherits it without anyone having to remember.
 *
 * DO NOT call this per-handler. It is applied at egress. Adding it at a call
 * site as well is harmless but is the pattern that caused the bug.
 */

/** Tags reasoning models wrap their scratchpad in. Matched case-insensitively. */
const MARKUP_TAGS = ['think', 'thinking', 'scratchpad', 'reasoning', 'reflection'] as const;

const TAG_GROUP = MARKUP_TAGS.join('|');

/** A complete block: opener through its matching closer. */
const PAIRED = new RegExp(`<(${TAG_GROUP})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, 'gi');

/**
 * An opener with no closer. A truncated or cut-off stream produces this, and the
 * paired pattern above will not match it, so everything from the opener onward
 * is scratchpad and is dropped.
 */
const UNCLOSED = new RegExp(`<(${TAG_GROUP})\\b[^>]*>[\\s\\S]*$`, 'i');

/** A stray closer left behind by an upstream partial strip. */
const ORPHAN_CLOSER = new RegExp(`<\\/(${TAG_GROUP})\\s*>`, 'gi');

export class AgentMarkupOnlyError extends Error {
  constructor(readonly original: string) {
    super(
      'Refusing to send: the message body was entirely agent-internal markup, so ' +
        'there is nothing left after stripping it. This means the model returned ' +
        'only scratchpad. Failing loudly rather than posting either the raw ' +
        'reasoning or an empty message. See ZAOOS#3383.',
    );
    this.name = 'AgentMarkupOnlyError';
  }
}

/** True if the text carries any agent-internal markup at all. */
export function containsAgentMarkup(text: string): boolean {
  return new RegExp(`<\\/?(${TAG_GROUP})\\b`, 'i').test(text);
}

/**
 * Remove agent-internal markup from text bound for a human.
 *
 * Returns the cleaned text. Throws AgentMarkupOnlyError when stripping leaves
 * nothing, because both alternatives are wrong: sending an empty string is
 * confusing, and falling back to the original sends the exact thing this
 * function exists to remove.
 */
export function stripAgentMarkup(text: string): string {
  const cleaned = text
    .replace(PAIRED, '')
    .replace(UNCLOSED, '')
    .replace(ORPHAN_CLOSER, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length === 0 && text.trim().length > 0) {
    throw new AgentMarkupOnlyError(text);
  }
  return cleaned;
}

/**
 * Same, but never throws. For the outbound transformer, where a thrown error
 * would fail a send that might be carrying something a human is waiting on.
 * Returns null when the body was entirely markup, so the caller decides.
 */
export function stripAgentMarkupSafe(text: string): string | null {
  try {
    return stripAgentMarkup(text);
  } catch {
    return null;
  }
}
