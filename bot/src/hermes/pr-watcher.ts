import { runCmd } from './git';
import type { HermesNarrator } from './runner';

export interface WatchPullRequestInput {
  prNumber: number;
  runId: string;
  branchName: string;
  narrator?: HermesNarrator;
  /** Poll interval in ms. Default 30s. */
  pollIntervalMs?: number;
  /** Total watch window in minutes. Default 5. */
  maxPollMinutes?: number;
}

interface PrStatus {
  mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN' | null;
  mergeStateStatus: string | null;
  failingChecks: Array<{ name: string; conclusion: string; detailsUrl: string }>;
}

/**
 * Fire-and-forget watcher launched after openPullRequest(). Polls the PR for
 * 5 minutes after open and surfaces conflicts + CI failures to the Telegram
 * narrator so they don't sit in DIRTY/red state silently for hours
 * (PR #321 sat broken 13 hours before anyone noticed).
 *
 * Doesn't auto-resolve - alert only. Resolution = sprint 2.
 */
export async function watchPullRequest(input: WatchPullRequestInput): Promise<void> {
  const interval = input.pollIntervalMs ?? 30_000;
  const maxIterations = Math.ceil(((input.maxPollMinutes ?? 5) * 60_000) / interval);

  // Track what we've already alerted on so we don't spam Telegram each poll.
  const alerted = new Set<string>();

  for (let i = 0; i < maxIterations; i += 1) {
    await sleep(interval);

    const status = await fetchPrStatus(input.prNumber);
    if (!status) continue;

    if (status.mergeable === 'CONFLICTING' && !alerted.has('conflict')) {
      alerted.add('conflict');
      try {
        await input.narrator?.onCriticDone?.(
          input.runId,
          0,
          `PR #${input.prNumber} has merge conflicts with main. Rebase needed before merge. Branch: ${input.branchName}.`,
        );
      } catch {
        // narrator may have already wrapped up; don't crash the watcher
      }
    }

    for (const c of status.failingChecks) {
      const key = `check:${c.name}`;
      if (alerted.has(key)) continue;
      alerted.add(key);
      try {
        await input.narrator?.onCriticDone?.(
          input.runId,
          0,
          `PR #${input.prNumber} CI failure: ${c.name} (${c.conclusion}). Details: ${c.detailsUrl}`,
        );
      } catch {
        // ignore
      }
    }

    // Early exit: if mergeable AND all checks succeeded/skipped, watcher's done.
    if (
      status.mergeable === 'MERGEABLE' &&
      status.failingChecks.length === 0 &&
      i >= 1 // give CI at least one poll cycle to register checks
    ) {
      return;
    }
  }
}

async function fetchPrStatus(prNumber: number): Promise<PrStatus | null> {
  const r = await runCmd(
    'gh',
    [
      'pr',
      'view',
      String(prNumber),
      '--json',
      'mergeable,mergeStateStatus,statusCheckRollup',
    ],
    process.cwd(),
  );
  if (r.exitCode !== 0) {
    console.error(`[hermes/pr-watcher] gh pr view #${prNumber} failed: ${r.stderr.slice(0, 300)}`);
    return null;
  }
  try {
    const parsed = JSON.parse(r.stdout) as {
      mergeable?: string | null;
      mergeStateStatus?: string | null;
      statusCheckRollup?: Array<{
        name?: string;
        conclusion?: string;
        detailsUrl?: string;
        status?: string;
      }>;
    };
    const failingChecks = (parsed.statusCheckRollup ?? [])
      .filter((c) => c.conclusion === 'FAILURE' || c.conclusion === 'TIMED_OUT' || c.conclusion === 'CANCELLED')
      .map((c) => ({
        name: c.name ?? 'unknown',
        conclusion: c.conclusion ?? 'unknown',
        detailsUrl: c.detailsUrl ?? '',
      }));
    return {
      mergeable: (parsed.mergeable as PrStatus['mergeable']) ?? null,
      mergeStateStatus: parsed.mergeStateStatus ?? null,
      failingChecks,
    };
  } catch (err) {
    console.error(
      `[hermes/pr-watcher] failed to parse gh output: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
