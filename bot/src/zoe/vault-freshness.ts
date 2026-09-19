/**
 * vault-freshness - ZOE reads a COPY of the vault, and a copy goes stale silently.
 *
 * WHY THIS EXISTS. Measured 2026-09-17: ZOE's vault copy on the VPS was 64 commits
 * behind origin/main, last moved at 07:52 UTC, with no cron and no timer refreshing
 * it. The 20:00 digest would have reported that morning's state as the evening's. A
 * stale message from a bot reads as quiet, not as broken, so nobody would have
 * noticed. Zaal ruled the fix the same day (zao-vault
 * decisions/grill-2026-09-17-seat-evening.md): pull before every read, and print the
 * copy's age at the top of each digest so staleness is visible in the one place he
 * reads.
 *
 * Two jobs:
 *   refreshVault()       fetch, then fast-forward ONLY. It never resets, never
 *                        stashes, never checks anything out. A copy that is dirty or
 *                        ahead is somebody's work, so it is reported and left alone.
 *   vaultFreshnessLine() the sentence for the top of a message.
 *
 * Three states, never two. UNKNOWN is what you get when origin could not be reached:
 * the copy may be current or may be a week old, and this code cannot tell which, so
 * it must not say FRESH. A digest that cannot measure its own age says so.
 */
import { execFile } from 'node:child_process';

export type VaultFreshnessState = 'FRESH' | 'STALE' | 'UNKNOWN';

export interface VaultFreshness {
  state: VaultFreshnessState;
  /** Commits behind origin/main AFTER the refresh attempt. null when it could not be measured. */
  behind: number | null;
  /** Commits on this copy that origin/main does not have. */
  ahead: number | null;
  /** Tracked files with uncommitted changes. Untracked files do not block a fast-forward. */
  dirty: boolean | null;
  /** Commits this call fast-forwarded. */
  pulled: number;
  /** Committer date of HEAD after the attempt. */
  headCommittedAt: Date | null;
  /** Why it is not FRESH. Empty when FRESH. */
  reason: string;
}

const GIT_TIMEOUT_MS = 20_000;

function git(dir: string, args: string[]): Promise<{ ok: boolean; out: string; err: string }> {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['-C', dir, ...args],
      // GIT_TERMINAL_PROMPT=0: a credential prompt must fail, not hang a digest forever.
      { timeout: GIT_TIMEOUT_MS, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
      (error, stdout, stderr) => {
        resolve({ ok: !error, out: String(stdout).trim(), err: String(stderr).trim() });
      },
    );
  });
}

async function headDate(dir: string): Promise<Date | null> {
  const r = await git(dir, ['log', '-1', '--format=%cI']);
  if (!r.ok || !r.out) return null;
  const d = new Date(r.out);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function aheadBehind(dir: string, upstream: string): Promise<{ ahead: number; behind: number } | null> {
  const r = await git(dir, ['rev-list', '--left-right', '--count', `HEAD...${upstream}`]);
  if (!r.ok) return null;
  const parts = r.out.split(/\s+/).map((n) => Number.parseInt(n, 10));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return { ahead: parts[0], behind: parts[1] };
}

/**
 * Bring the vault copy up to date if, and only if, that is a pure fast-forward.
 * Never throws: a digest must still go out when git does not work, it just has to
 * say that it could not check.
 */
export async function refreshVault(dir: string, upstream = 'origin/main'): Promise<VaultFreshness> {
  const unknown = (reason: string, extra: Partial<VaultFreshness> = {}): VaultFreshness => ({
    state: 'UNKNOWN', behind: null, ahead: null, dirty: null, pulled: 0, headCommittedAt: null, reason, ...extra,
  });

  const inside = await git(dir, ['rev-parse', '--is-inside-work-tree']);
  if (!inside.ok || inside.out !== 'true') return unknown('not a git checkout');

  const remote = upstream.split('/')[0];
  const fetched = await git(dir, ['fetch', '--quiet', remote]);
  const head = await headDate(dir);
  if (!fetched.ok) {
    // We still know what we HAVE. We do not know how far behind it is, and a stale
    // remote-tracking ref would answer "0 behind" with complete confidence.
    return unknown('could not reach origin', { headCommittedAt: head });
  }

  const status = await git(dir, ['status', '--porcelain', '--untracked-files=no']);
  const dirty = status.ok ? status.out.length > 0 : null;
  const before = await aheadBehind(dir, upstream);
  if (!before || dirty === null) return unknown('could not read the state of the copy', { headCommittedAt: head });

  let pulled = 0;
  if (before.behind > 0 && before.ahead === 0 && !dirty) {
    const merged = await git(dir, ['merge', '--ff-only', '--quiet', upstream]);
    if (merged.ok) pulled = before.behind;
  }

  const after = (await aheadBehind(dir, upstream)) ?? before;
  const headAfter = await headDate(dir);
  if (after.behind === 0) {
    return { state: 'FRESH', behind: 0, ahead: after.ahead, dirty, pulled, headCommittedAt: headAfter, reason: '' };
  }
  const reason = dirty
    ? 'the copy has uncommitted changes, so it was not moved'
    : after.ahead > 0
      ? 'the copy has commits origin does not, so it was not moved'
      : 'the fast-forward did not apply';
  return { state: 'STALE', behind: after.behind, ahead: after.ahead, dirty, pulled, headCommittedAt: headAfter, reason };
}

function stamp(d: Date | null): string {
  if (!d) return 'an unknown time';
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/**
 * The sentence for the top of a message. Plain text on purpose: no markdown
 * characters, so it cannot break a Telegram parse_mode.
 */
export function vaultFreshnessLine(f: VaultFreshness): string {
  if (f.state === 'FRESH') {
    return f.pulled > 0
      ? `vault copy: current, pulled ${f.pulled} new commit${f.pulled === 1 ? '' : 's'} just now`
      : 'vault copy: current';
  }
  if (f.state === 'STALE') {
    const n = f.behind ?? 0;
    return `vault copy: ${n} commit${n === 1 ? '' : 's'} BEHIND, newest here is ${stamp(f.headCommittedAt)}. What follows may be out of date: ${f.reason}.`;
  }
  return `vault copy: age UNKNOWN, ${f.reason}. Newest commit here is ${stamp(f.headCommittedAt)}. What follows may be out of date.`;
}
