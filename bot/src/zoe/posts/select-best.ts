// Post slate v4 - "one best draft" selector (build: surface ONE best, not 30).
//
// Old behavior (v3, doc 796 Decision 2): drafts stacked silently into a backlog
// up to MAX_QUEUED_DRAFTS (30) and Zaal paged through them one-at-a-time via
// /drafts (FIFO). The felt experience was "ZOE dumped a queue of 30 on me."
//
// New behavior: when drafts are surfaced (daily notice OR /drafts), ZOE judges
// the whole backlog and surfaces the SINGLE best draft, then clears the rest.
// One decision for Zaal - POST/REGEN/SKIP on the strongest candidate - instead
// of a backlog to triage. Stale drafts (>24h) are dropped before judging so the
// pick is always from fresh info.

import { callClaudeCli } from '../../hermes/claude-cli';
import type { QueuedDraft } from './drafts-queue';

/** Drafts older than this are stale - dropped before judging. */
export const FRESH_WINDOW_MS = 24 * 60 * 60_000;

export interface BestPick {
  best: QueuedDraft;
  /** every draft that was NOT chosen (stale + losing candidates) - caller archives these */
  dropped: QueuedDraft[];
  /** how many fresh candidates the judge actually compared */
  considered: number;
  via: 'llm' | 'heuristic' | 'only-candidate';
}

/** Keep only drafts created within FRESH_WINDOW_MS of now. */
export function freshDrafts(drafts: QueuedDraft[], nowMs: number = Date.now()): QueuedDraft[] {
  return drafts.filter((d) => nowMs - new Date(d.createdAt).getTime() <= FRESH_WINDOW_MS);
}

/**
 * Heuristic tiebreak when the LLM judge is unavailable or returns garbage.
 * Prefers a draft that names a concrete number (PR/bounty/count - the voice
 * rules require "one specific number, name, or place"), then most recent.
 */
export function heuristicBest(pool: QueuedDraft[]): QueuedDraft {
  const hasNumber = (t: string): boolean => /\d/.test(t);
  const scored = [...pool].sort((a, b) => {
    const an = hasNumber(a.text) ? 1 : 0;
    const bn = hasNumber(b.text) ? 1 : 0;
    if (an !== bn) return bn - an;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return scored[0];
}

function buildJudgePrompt(pool: QueuedDraft[]): string {
  const numbered = pool
    .map((d, i) => `[${i + 1}] (${d.category}) ${d.text}`)
    .join('\n\n');
  return `You are picking the SINGLE best social post to publish right now from these candidate drafts. They were drafted across the day for Zaal's Year-of-the-ZABAL voice (Firefly -> Farcaster + X).

Pick the ONE that is: most specific (names a real artifact, number, person, or place), freshest/most relevant, and cleanest on voice. Reject vague, generic, or LLM-tell drafts.

CANDIDATES:
${numbered}

Output ONLY the number of the single best candidate (e.g. "3"). No other text.`;
}

function parseChoice(raw: string, max: number): number | null {
  const m = raw.match(/\d+/);
  if (!m) return null;
  const n = Number(m[0]);
  if (!Number.isInteger(n) || n < 1 || n > max) return null;
  return n;
}

export interface PickBestOptions {
  cwd: string;
  model?: 'sonnet' | 'haiku' | 'opus';
  nowMs?: number;
}

/**
 * Select the single best draft from the backlog. Returns null only when the
 * backlog is empty. The chosen draft is `best`; every other draft (stale +
 * losing candidates) is in `dropped` so the caller can archive/clear them.
 */
export async function pickBestDraft(
  drafts: QueuedDraft[],
  opts: PickBestOptions,
): Promise<BestPick | null> {
  if (drafts.length === 0) return null;
  const nowMs = opts.nowMs ?? Date.now();

  // Prefer fresh drafts; if everything is stale, judge them all rather than
  // surfacing nothing.
  const fresh = freshDrafts(drafts, nowMs);
  const pool = fresh.length > 0 ? fresh : drafts;
  const droppedFor = (chosen: QueuedDraft): QueuedDraft[] =>
    drafts.filter((d) => d.id !== chosen.id);

  if (pool.length === 1) {
    return { best: pool[0], dropped: droppedFor(pool[0]), considered: 1, via: 'only-candidate' };
  }

  try {
    const result = await callClaudeCli({
      model: opts.model ?? 'haiku',
      prompt: buildJudgePrompt(pool),
      cwd: opts.cwd,
      permissionMode: 'default',
      bare: false,
    });
    const choice = parseChoice(result.text ?? '', pool.length);
    if (choice !== null) {
      const best = pool[choice - 1];
      return { best, dropped: droppedFor(best), considered: pool.length, via: 'llm' };
    }
  } catch {
    // fall through to heuristic
  }

  const best = heuristicBest(pool);
  return { best, dropped: droppedFor(best), considered: pool.length, via: 'heuristic' };
}
