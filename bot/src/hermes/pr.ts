import { runCmd } from './git';

export interface OpenedPR {
  number: number;
  url: string;
}

/**
 * Open a PR via gh CLI from the current workdir checkout.
 * Returns the PR number + URL.
 */
export async function openPullRequest(opts: {
  workdir: string;
  title: string;
  body: string;
  base?: string;
}): Promise<OpenedPR> {
  const base = opts.base ?? 'main';
  const r = await runCmd(
    'gh',
    ['pr', 'create', '--base', base, '--title', opts.title, '--body', opts.body],
    opts.workdir,
  );
  if (r.exitCode !== 0) {
    throw new Error(`gh pr create failed: ${r.stderr.slice(0, 400) || r.stdout.slice(0, 400)}`);
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
