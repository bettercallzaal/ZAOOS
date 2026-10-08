import { runCmd, verifyRemoteBranch } from './git';

export interface OpenedPR {
  number: number;
  url: string;
  /** True only when ZOE_FIX_PR_LABEL is set and gh applied it. */
  labelled: boolean;
}

/**
 * The review label for ZOE's fix PRs, or null (ZOE_FIX_PR_LABEL, default unset).
 *
 * Zaal, 2026-10-07: ZOE's overnight fixes go through the same path as every
 * other PR - the estate's reviewer finds them, the dotfiles merge terminal
 * merges on a CLEAN verdict. ZOE opens; it never merges, deploys or sets a flag
 * (pr-review-label.test.ts reads this pipeline's source for those calls).
 * The label must already exist in the target repo; gh refuses an unknown one,
 * and that refusal is logged, never allowed to lose the PR. Only plain label
 * characters are accepted, so the value cannot become a gh flag.
 */
export function fixPrLabel(): string | null {
  const v = process.env.ZOE_FIX_PR_LABEL?.trim();
  return v && /^[A-Za-z0-9][A-Za-z0-9 :._-]{0,49}$/.test(v) ? v : null;
}

/**
 * Open a PR via gh CLI from the current workdir checkout.
 * Returns the PR number + URL.
 *
 * IMPORTANT: pass --head explicitly. gh's auto-detection of the current
 * branch's pushed-to-remote state has been flaky in production - even when
 * the branch is on origin (verified via gh api repos/.../branches), gh may
 * still report "you must first push the current branch to a remote".
 * Passing --head bypasses that check.
 */
export async function openPullRequest(opts: {
  workdir: string;
  branchName: string;
  title: string;
  body: string;
  base?: string;
}): Promise<OpenedPR> {
  const base = opts.base ?? 'main';

  // Belt-and-suspenders: re-push to make sure remote is in sync before gh runs.
  // If the branch tip already matches, this is a no-op.
  await runCmd('git', ['push', '-u', 'origin', opts.branchName], opts.workdir);

  // Post-action assertion: confirm the ref is actually on origin before gh opens
  // a PR against it. gh's own remote-state detection is flaky (see the note
  // above), so assert reality via ls-remote rather than trust the push exit code.
  await verifyRemoteBranch(opts.workdir, opts.branchName);

  const r = await runCmd(
    'gh',
    [
      'pr',
      'create',
      '--base', base,
      '--head', opts.branchName,
      '--title', opts.title,
      '--body', opts.body,
    ],
    opts.workdir,
  );
  if (r.exitCode !== 0) {
    throw new Error(
      `gh pr create failed (exit ${r.exitCode}). stderr: ${r.stderr.slice(0, 600) || '(empty)'} stdout: ${r.stdout.slice(0, 200)}`,
    );
  }
  // gh prints the PR URL on the last line.
  const url = r.stdout.trim().split('\n').pop() ?? '';
  const m = url.match(/\/pull\/(\d+)/);
  const number = m ? Number(m[1]) : 0;
  if (!number) {
    throw new Error(`gh pr create succeeded but no PR number parsed from: ${r.stdout}`);
  }
  const label = fixPrLabel();
  let labelled = false;
  if (label) {
    const l = await runCmd('gh', ['pr', 'edit', String(number), '--add-label', label], opts.workdir);
    labelled = l.exitCode === 0;
    if (!labelled) console.warn(`[hermes/pr] PR #${number} opened but label "${label}" not applied: ${l.stderr.slice(0, 200)}`);
  }
  return { number, url, labelled };
}
