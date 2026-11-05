/**
 * Seat evaluator verdict parser (design note section 3, gap G2).
 *
 * Shape source: ~/.claude/skills/zao-evaluate/SKILL.md Step 2 and .claude/rules/agent-loops.md
 * rule 8. Line 1 reads `Seat evaluator verdict (...), head <FULL_SHA>: **CLEAN**`; a line
 * reading exactly `Reserved: none` and an `Evaluator-Session:` line follow.
 * UNVERIFIED: whether every real verdict carries Evaluator-Session; it is optional here.
 *
 * Spoof rules: the author comes from the API login field only. Body text never
 * confers authorship. The heading must be LINE 1 of the body (a pasted header
 * inside a longer comment or a code fence does not count) and must name the
 * full 40-char head. Bodies are data and are never executed or interpolated.
 */

import { isFullSha } from './merge-line';

export interface PrComment {
  id: string;
  login: string;
  createdAt: string; // ISO 8601
  body: string;
}

export type VerdictState = 'CLEAN' | 'NEEDS_WORK' | 'OTHER';

export interface SeatVerdict {
  commentId: string;
  login: string;
  createdAt: string;
  headSha: string;
  state: VerdictState;
  reservedNone: boolean;
  evaluatorSession: string | null;
}

const LINE1_RE = /^Seat evaluator verdict\b[^\n]*?\bhead ([0-9a-f]{40})\s*:\s*\*\*([A-Za-z_ -]+)\*\*/;

function stateOf(raw: string): VerdictState {
  const s = raw.trim().toUpperCase().replace(/[ -]/g, '_');
  if (s === 'CLEAN') return 'CLEAN';
  if (s === 'NEEDS_WORK') return 'NEEDS_WORK';
  return 'OTHER';
}

/** Parse one comment as a seat verdict, or null if it is not one in the strict shape. */
export function parseVerdict(c: PrComment): SeatVerdict | null {
  const body = c.body.replace(/\r\n/g, '\n');
  const first = body.split('\n', 1)[0] ?? '';
  const m = LINE1_RE.exec(first);
  if (!m) return null;
  if (!isFullSha(m[1])) return null;
  const session = /^Evaluator-Session:[ \t]*(\S+)[ \t]*$/m.exec(body);
  return {
    commentId: c.id,
    login: c.login,
    createdAt: c.createdAt,
    headSha: m[1],
    state: stateOf(m[2]),
    reservedNone: /^Reserved: none[ \t]*$/m.test(body),
    evaluatorSession: session ? session[1] : null,
  };
}

function newer(a: SeatVerdict, b: SeatVerdict): boolean {
  const ta = Date.parse(a.createdAt);
  const tb = Date.parse(b.createdAt);
  if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta > tb;
  return a.commentId.localeCompare(b.commentId, 'en', { numeric: true }) > 0;
}

/**
 * The newest eligible verdict for EXACTLY this head. A verdict for another
 * SHA, from a login not on the allowlist, or in the wrong shape is ignored.
 * An empty allowlist matches nobody (fail closed). A later NEEDS_WORK at the
 * same SHA beats an earlier CLEAN because the newest wins whatever its state.
 */
export function latestVerdictFor(
  comments: PrComment[],
  headSha: string,
  allowedLogins: readonly string[],
): SeatVerdict | null {
  if (!isFullSha(headSha)) return null;
  const allow = new Set(allowedLogins.map((l) => l.toLowerCase()).filter(Boolean));
  if (allow.size === 0) return null;
  let best: SeatVerdict | null = null;
  for (const c of comments) {
    if (!allow.has(c.login.toLowerCase())) continue;
    const v = parseVerdict(c);
    if (!v || v.headSha !== headSha) continue;
    if (!best || newer(v, best)) best = v;
  }
  return best;
}
