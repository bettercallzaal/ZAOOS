/**
 * dm-build-pending.ts - the PURE half of the DM build buttons.
 *
 * Split from dm-build-buttons.ts for the reason topic-router.ts states for
 * itself: keep the decision logic free of bot/api imports so it stays
 * unit-testable. Concretely, anything importing grammy cannot be loaded by this
 * repo's vitest setup - button-bar.test.ts is one of the suite's long-standing
 * failures for exactly that reason. So the keyboards (trivial, grammy) live next
 * door and everything with a decision in it lives here.
 *
 * WHY ANY OF THIS EXISTS. detectBuildIntent is deliberately stingy: a false
 * positive spins the coder on an offhand remark. But "stingy" was implemented as
 * "silently fall through to conversation", so every near-miss cost Zaal a full
 * retype with a `build:` prefix. With a keyboard, an unsure classifier can just
 * ASK - and a near-miss becomes one tap. That keeps the false-positive
 * protection while deleting its cost.
 *
 * Telegram caps callback_data at 64 bytes, so the pending task text lives in the
 * map below and the button carries only a short key.
 */

/** Pending near-miss tasks, keyed by a short id the callback can carry. */
const pending = new Map<string, { task: string; at: number }>();
const PENDING_TTL_MS = 30 * 60 * 1000;
let seq = 0;

/** Store a declined-but-plausible message and return its button key. */
export function stashPending(task: string): string {
  // Sweep first: a key nobody tapped in 30 minutes is abandoned, and an
  // unbounded map in a long-lived bot is a slow leak.
  const now = Date.now();
  for (const [k, v] of pending) if (now - v.at > PENDING_TTL_MS) pending.delete(k);

  seq = (seq + 1) % 100000;
  const key = `${now.toString(36)}${seq.toString(36)}`;
  pending.set(key, { task, at: now });
  return key;
}

/** Take a stashed task. Returns undefined if it expired or was already used -
 *  a double-tap must not start two builds. */
export function takePending(key: string): string | undefined {
  const hit = pending.get(key);
  if (!hit) return undefined;
  pending.delete(key);
  if (Date.now() - hit.at > PENDING_TTL_MS) return undefined;
  return hit.task;
}

/**
 * Should we offer the near-miss prompt for a message the classifier declined?
 *
 * Only when it plausibly describes work. Offering buttons on "gm" would be worse
 * than useless - it is the same crying-wolf failure as a flag that fires on
 * nothing, just wearing a keyboard.
 */
export function worthOffering(message: string, declineReason: string): boolean {
  const text = (message || '').trim();
  if (text.length < 20) return false;

  // These declines are DEFINITE - the message was a question, a status report,
  // or about something that is not software. Asking anyway would be noise.
  const definite = ['is a question', 'not software', 'question or status', 'no code verb'];
  if (definite.some((d) => declineReason.includes(d))) return false;

  // What is left is genuinely borderline: a code verb with no matching noun, or
  // something just under the length bar. Those are worth one tap.
  return true;
}

/** Test seam only. */
export function __resetPending(): void {
  pending.clear();
  seq = 0;
}

export function __pendingSize(): number {
  return pending.size;
}
