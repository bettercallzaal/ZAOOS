import { runCmd } from './git';

export interface OpenedPR {
  number: number;
  url: string;
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
  return { number, url };
}
