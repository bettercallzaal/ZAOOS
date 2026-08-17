/**
 * pinned-brief.ts - ONE pinned Telegram message that is always the current state.
 *
 * WHY THIS EXISTS. Zaal (2026-08-09): "can we stop making artifacts, they just
 * get lost, i havent really looked at a single one, if it not a quick glance
 * its hard to get to it."
 *
 * The measured pattern across every surface we have built: he answers what
 * ARRIVES (11 of 14 grill cards) and ignores what he must NAVIGATE to (hosted
 * pages, the cockpit, research docs - all near zero). So the fix is not a better
 * page. It is a surface that costs nothing to reach.
 *
 * A pinned message is the only "page" in Telegram: it sits at the top of the
 * chat behind one tap, it is always in the same place, and it never scrolls
 * away behind tool output. The Bot API confirms a bot may pin in a private chat
 * with no admin rights: "In private chats and channel direct messages chats, all
 * non-service messages can be pinned."
 *
 * NOT mission-control.ts. That module renders the step-journal - a severity
 * ranked feed of what agents are DOING. This renders what he asked for instead:
 * what needs him, what is running, and what changed. Outcomes, not process.
 *
 * Content rules (brand.md + the DreamNet standard, scaled down):
 *   - NEEDS YOU first, because it is the only block that requires action.
 *   - Every needs-you line says what to DO, not what is broken.
 *   - No PR numbers, no diffs, no mechanism. He asked for results, not method.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { featureRan } from './feature-ran';

/** Telegram's hard cap is 4096. Leave headroom so a long line can never 400. */
const RENDER_BUDGET = 3800;

/** Where the pinned message id lives, so we EDIT rather than re-send forever.
 *  Same directory the backlog grill uses for its state. */
export const PIN_STATE_PATH = join(homedir(), '.zao/zoe/pinned-brief.json');

export interface PinState {
  messageId: number;
  /** Hash of the last rendered text, so an unchanged brief skips the edit. */
  lastText: string;
}

export interface BriefInput {
  /** Things only Zaal can clear. Each line is an instruction, not a complaint. */
  needsYou: string[];
  /** Live fleet state: short label -> short value. */
  running: Array<[string, string]>;
  /** What changed since the last brief, in plain language. */
  changed: string[];
  /** Rendered into the footer so a stale pin is visibly stale. */
  updatedLabel: string;
}

/**
 * Render the pinned text. Deterministic and pure - the tests pin this exactly,
 * because the whole value of the surface is that it looks the same every time
 * and he can find the one line he needs without reading.
 */
export function renderPinnedBrief(input: BriefInput): string {
  const blocks: string[] = [];

  if (input.needsYou.length > 0) {
    const lines = input.needsYou.map((l) => `  ${l}`);
    blocks.push([`NEEDS YOU (${input.needsYou.length})`, ...lines].join('\n'));
  } else {
    blocks.push('NEEDS YOU\n  nothing - you are clear');
  }

  if (input.running.length > 0) {
    const width = Math.max(...input.running.map(([k]) => k.length));
    const lines = input.running.map(([k, v]) => `  ${k.padEnd(width)}  ${v}`);
    blocks.push(['RUNNING', ...lines].join('\n'));
  }

  if (input.changed.length > 0) {
    blocks.push(['CHANGED', ...input.changed.map((l) => `  ${l}`)].join('\n'));
  }

  blocks.push(`updated ${input.updatedLabel}`);

  let text = blocks.join('\n\n');
  if (text.length > RENDER_BUDGET) {
    // Drop CHANGED before anything else: NEEDS YOU and RUNNING are actionable,
    // history is not. Truncating the actionable half to preserve history would
    // be exactly backwards.
    const trimmed = [blocks[0], blocks[1], blocks[blocks.length - 1]].filter(Boolean);
    text = trimmed.join('\n\n');
  }
  return text.length <= 4096 ? text : `${text.slice(0, 4090)}\n...`;
}

export async function readPinState(path: string = PIN_STATE_PATH): Promise<PinState | null> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PinState>;
    if (typeof parsed.messageId === 'number') {
      return { messageId: parsed.messageId, lastText: typeof parsed.lastText === 'string' ? parsed.lastText : '' };
    }
  } catch {
    // no state yet, or corrupt - either way we send a fresh pin
  }
  return null;
}

export async function writePinState(state: PinState, path: string = PIN_STATE_PATH): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, JSON.stringify(state), 'utf8');
}

export interface PinDeps {
  sendMessage: (text: string) => Promise<{ message_id: number }>;
  pinMessage: (messageId: number) => Promise<unknown>;
  editMessage: (messageId: number, text: string) => Promise<unknown>;
  statePath?: string;
}

export type PinResult =
  | { action: 'pinned'; messageId: number }
  | { action: 'edited'; messageId: number }
  | { action: 'unchanged'; messageId: number }
  | { action: 'failed'; reason: string };

/**
 * Pin once, then edit that same message forever.
 *
 * Three cases, in order of how often they happen:
 *   unchanged - the text is identical, so skip the API call entirely. Telegram
 *               rejects a no-op edit with "message is not modified" anyway, and
 *               a pointless edit re-marks the message as changed on his phone.
 *   edited    - normal path.
 *   pinned    - first run, or the message was deleted and the edit 400'd. We
 *               re-send and re-pin rather than going silent, because a brief
 *               that quietly stops updating is worse than no brief: it shows
 *               stale state as if it were current.
 *
 * When skipPin is true (2026-08-17), existing messages are edited in place but
 * NEW messages are not pinned - grill pin takes precedence over brief pin.
 */
export async function syncPinnedBrief(text: string, deps: PinDeps, skipPin = false): Promise<PinResult> {
  const statePath = deps.statePath ?? PIN_STATE_PATH;
  const existing = await readPinState(statePath);

  if (existing && existing.lastText === text) {
    featureRan('pinned-brief', 'unchanged');
    return { action: 'unchanged', messageId: existing.messageId };
  }

  if (existing) {
    try {
      await deps.editMessage(existing.messageId, text);
      await writePinState({ messageId: existing.messageId, lastText: text }, statePath);
      featureRan('pinned-brief', `edited ${existing.messageId}`);
      return { action: 'edited', messageId: existing.messageId };
    } catch (error: unknown) {
      // Fall through to a fresh pin. The usual cause is Zaal deleting or
      // unpinning the message, which should heal itself, not stop the feature.
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[zoe/pinned-brief] edit failed, re-pinning: ${msg}`);
    }
  }

  try {
    const sent = await deps.sendMessage(text);
    if (!skipPin) {
      try {
        await deps.pinMessage(sent.message_id);
      } catch (error: unknown) {
        // The message exists and is readable even unpinned - degraded, not broken,
        // so say so loudly and keep the id rather than throwing the brief away.
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[zoe/pinned-brief] sent but pin failed: ${msg}`);
      }
    }
    await writePinState({ messageId: sent.message_id, lastText: text }, statePath);
    featureRan('pinned-brief', skipPin ? `sent ${sent.message_id} (no pin)` : `pinned ${sent.message_id}`);
    return { action: 'pinned', messageId: sent.message_id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[zoe/pinned-brief] send failed: ${msg}`);
    return { action: 'failed', reason: msg };
  }
}
