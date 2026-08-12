/**
 * claude-health.ts - did a Claude call actually succeed, and when?
 *
 * ZOE's Max-plan OAuth token was revoked on 2026-08-08. Every Claude call 401'd
 * for four days and nothing surfaced it: the pinned brief kept showing a healthy
 * grill count because it had no idea Claude existed. Zaal found out because the
 * bot quietly stopped being useful.
 *
 * `checkClaudeAuth` in claude-cli.ts already existed and its docstring claimed
 * "Used by: bot/src/zoe/index.ts onBotStart hook". It had NO callers. The
 * healthcheck was built, documented as wired, and never wired - so this module
 * is the missing half: somewhere for an outcome to be recorded, and something
 * cheap for the brief to read.
 *
 * Two rules shape the whole design.
 *
 * SILENCE IS NOT EVIDENCE (`.claude/rules/state-claims.md`). Most scheduler ticks
 * never call Claude, so "no 401s lately" proves nothing at all. Health is
 * therefore only ever asserted from a POSITIVE recorded success. With no record
 * we report "not checked", never "ok".
 *
 * THE INDICATOR MUST REACH ZERO (`.claude/rules/noisy-signal-guard.md`). Only an
 * OBSERVED auth failure raises the alert, and the next recorded success clears
 * it. Staleness is reported as status, never as an alert - if the probe itself
 * stopped running, a stale-based alarm could never be cleared by anyone, and a
 * permanent warning is not a warning.
 *
 * Writes are best-effort and never throw. A health file that cannot be written
 * must not take down the call it was observing.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { ClaudeErrorKind } from './claude-cli';

/** Same convention as backlog-grill-state.json, which pinned-brief-runner reads directly. */
export const CLAUDE_HEALTH_PATH = join(homedir(), '.zao/zoe/claude-health.json');

export interface ClaudeHealth {
  /** ms epoch of the last call that came back clean. */
  lastOkMs: number | null;
  /** ms epoch of the last call that failed. */
  lastFailMs: number | null;
  /** Why it failed, from classifyClaudeError. Only 'auth' is treated as actionable. */
  lastFailKind: ClaudeErrorKind | null;
  lastFailHint: string | null;
}

const EMPTY: ClaudeHealth = { lastOkMs: null, lastFailMs: null, lastFailKind: null, lastFailHint: null };

/**
 * A success older than this stops counting as proof of health. The probe runs
 * hourly, so this is three missed probes - long enough not to flap, short
 * enough that a dead probe is visible the same morning.
 */
export const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

export async function readClaudeHealth(path: string = CLAUDE_HEALTH_PATH): Promise<ClaudeHealth> {
  try {
    const parsed = JSON.parse(await fs.readFile(path, 'utf8')) as Partial<ClaudeHealth>;
    return {
      lastOkMs: typeof parsed.lastOkMs === 'number' ? parsed.lastOkMs : null,
      lastFailMs: typeof parsed.lastFailMs === 'number' ? parsed.lastFailMs : null,
      lastFailKind: (parsed.lastFailKind as ClaudeErrorKind) ?? null,
      lastFailHint: typeof parsed.lastFailHint === 'string' ? parsed.lastFailHint : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

async function write(next: ClaudeHealth, path: string): Promise<void> {
  try {
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, JSON.stringify(next, null, 2), 'utf8');
  } catch {
    /* best effort - never break the call being observed */
  }
}

/** Record a clean Claude call. This is the ONLY thing that proves reachability. */
export async function recordClaudeOk(nowMs: number = Date.now(), path: string = CLAUDE_HEALTH_PATH): Promise<void> {
  const cur = await readClaudeHealth(path);
  await write({ ...cur, lastOkMs: nowMs }, path);
}

/** Record a failed Claude call, keeping why. */
export async function recordClaudeFailure(
  kind: ClaudeErrorKind,
  hint: string,
  nowMs: number = Date.now(),
  path: string = CLAUDE_HEALTH_PATH,
): Promise<void> {
  const cur = await readClaudeHealth(path);
  await write({ ...cur, lastFailMs: nowMs, lastFailKind: kind, lastFailHint: hint || null }, path);
}

function ago(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

/**
 * Turn a health record into the two things the brief can show. Pure, so the
 * whole decision is testable without a filesystem, a clock, or a live token.
 *
 * `alert` is for the needs-you list and is non-null ONLY when the most recent
 * observation was an auth failure. It clears itself on the next success.
 * `status` is the always-on line, and says "not checked" rather than "ok" when
 * nothing has been observed.
 */
export function claudeBriefLines(
  h: ClaudeHealth,
  nowMs: number,
  staleAfterMs: number = STALE_AFTER_MS,
): { alert: string | null; status: [string, string] } {
  const failing = h.lastFailMs !== null && (h.lastOkMs === null || h.lastFailMs > h.lastOkMs);

  if (failing && h.lastFailKind === 'auth') {
    return {
      alert: `ZOE cannot reach Claude - auth failed ${ago(nowMs - (h.lastFailMs as number))} ago. Run \`claude\` then /login on the host.`,
      status: ['claude', 'auth failed'],
    };
  }

  // A non-auth failure (rate limit, timeout) is real but usually self-clearing,
  // so it is reported without pulling Zaal in.
  if (failing) return { alert: null, status: ['claude', `${h.lastFailKind ?? 'error'}`] };

  if (h.lastOkMs === null) return { alert: null, status: ['claude', 'not checked'] };

  const age = nowMs - h.lastOkMs;
  if (age > staleAfterMs) return { alert: null, status: ['claude', `last ok ${ago(age)} ago`] };

  return { alert: null, status: ['claude', 'ok'] };
}
