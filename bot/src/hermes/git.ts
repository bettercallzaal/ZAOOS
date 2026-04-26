import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface GitRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function runCmd(cmd: string, args: string[], cwd?: string, env?: NodeJS.ProcessEnv): Promise<GitRunResult> {
  // Augment PATH so binaries installed under ~/.local/bin (gh, claude, uv,
  // serena, etc.) resolve when this process runs under systemd which strips
  // user-specific shell PATH augmentations.
  const augmentedEnv: NodeJS.ProcessEnv = { ...(env ?? process.env) };
  const home = augmentedEnv.HOME ?? process.env.HOME ?? '/home/zaal';
  const localBin = `${home}/.local/bin`;
  if (!augmentedEnv.PATH || !augmentedEnv.PATH.split(':').includes(localBin)) {
    augmentedEnv.PATH = `${localBin}:${augmentedEnv.PATH ?? '/usr/local/bin:/usr/bin:/bin'}`;
  }

  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: augmentedEnv });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    // Critical: spawn emits 'error' on ENOENT (binary not found). Without a
    // handler the event throws and crashes the parent process - we saw this
    // happen on the first /fix run (gh missing from systemd PATH took the
    // whole zao-devz-stack process down).
    child.on('error', (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      resolve({ stdout, stderr: stderr + `\n[spawn-error] ${msg}`, exitCode: -1 });
    });
    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? -1 });
    });
  });
}

export async function makeWorkdir(runId: string): Promise<string> {
  const base = join(tmpdir(), `hermes-${runId}`);
  await fs.mkdir(base, { recursive: true });
  return base;
}

export async function cleanupWorkdir(workdir: string): Promise<void> {
  try {
    await fs.rm(workdir, { recursive: true, force: true });
  } catch (err) {
    console.error(`[hermes] cleanup failed for ${workdir}`, err);
  }
}

/**
 * Clone the ZAO OS repo into workdir as a fresh checkout from origin/main.
 * Uses HERMES_REPO_URL env (or falls back to bettercallzaal/ZAOOS over https).
 * Authentication: relies on system git credentials (gh auth or SSH key).
 */
export async function cloneAndBranch(
  workdir: string,
  branchName: string,
): Promise<void> {
  const repoUrl = process.env.HERMES_REPO_URL ?? 'https://github.com/bettercallzaal/ZAOOS.git';
  const clone = await runCmd('git', ['clone', '--depth', '50', '--branch', 'main', repoUrl, workdir]);
  if (clone.exitCode !== 0) {
    throw new Error(`git clone failed: ${clone.stderr.slice(0, 400)}`);
  }
  const checkout = await runCmd('git', ['checkout', '-b', branchName], workdir);
  if (checkout.exitCode !== 0) {
    throw new Error(`git checkout -b failed: ${checkout.stderr.slice(0, 400)}`);
  }

  // Install deps so pre-flight typecheck + lint can run (tsc/biome live in
  // node_modules/.bin). --ignore-scripts blocks postinstall supply-chain
  // attacks (Shai-Hulud/Axios pattern). Use npm ci if package-lock exists,
  // npm install otherwise. ~30-60s but only once per /fix run.
  const lockExists = await fs
    .access(`${workdir}/package-lock.json`)
    .then(() => true)
    .catch(() => false);
  const installCmd = lockExists ? 'ci' : 'install';
  const install = await runCmd(
    'npm',
    [installCmd, '--ignore-scripts', '--no-audit', '--no-fund', '--prefer-offline'],
    workdir,
  );
  if (install.exitCode !== 0) {
    // Don't hard-fail; pre-flight will surface specific errors. Some hermes runs
    // might not need typecheck (e.g. doc-only changes). Log + continue.
    console.error(
      `[hermes/git] npm ${installCmd} returned exit ${install.exitCode}. Pre-flight may fail. stderr: ${install.stderr.slice(0, 300)}`,
    );
  }

  // Install pre-commit hook to reject any commit that contains conflict markers.
  // Standard practice (AWS samples, AutoGPT #12469). Fresh /tmp clone has no
  // hooks by default; we bake one in.
  const hookPath = `${workdir}/.git/hooks/pre-commit`;
  const hookBody = `#!/usr/bin/env bash
# Hermes pre-commit guard - reject conflict markers
if git diff --cached -U0 | grep -E "^\\+(<<<<<<< |=======|>>>>>>> )" >/dev/null; then
  echo "[hermes/pre-commit] BLOCKED: commit contains unresolved conflict markers" >&2
  exit 1
fi
exit 0
`;
  try {
    await fs.writeFile(hookPath, hookBody, { mode: 0o755 });
  } catch (err) {
    console.error(`[hermes/git] pre-commit hook install failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function commitAndPush(
  workdir: string,
  branchName: string,
  message: string,
): Promise<void> {
  const cfgName = await runCmd('git', ['config', 'user.name', process.env.HERMES_GIT_USER_NAME ?? 'Hermes Bot'], workdir);
  if (cfgName.exitCode !== 0) throw new Error(`git config user.name failed: ${cfgName.stderr}`);
  const cfgEmail = await runCmd(
    'git',
    ['config', 'user.email', process.env.HERMES_GIT_USER_EMAIL ?? 'hermes@thezao.com'],
    workdir,
  );
  if (cfgEmail.exitCode !== 0) throw new Error(`git config user.email failed: ${cfgEmail.stderr}`);

  const add = await runCmd('git', ['add', '-A'], workdir);
  if (add.exitCode !== 0) throw new Error(`git add failed: ${add.stderr}`);

  const commit = await runCmd('git', ['commit', '-m', message], workdir);
  if (commit.exitCode !== 0) throw new Error(`git commit failed: ${commit.stderr.slice(0, 400)}`);

  // Re-fetch + rebase against latest main BEFORE push. Catches mid-run
  // divergence where another PR landed while Coder was working. Branch is
  // brand-new with our single commit, so rebase is safe.
  const fetch = await runCmd('git', ['fetch', 'origin', 'main'], workdir);
  if (fetch.exitCode !== 0) {
    console.error(`[hermes/git] pre-push fetch warning: ${fetch.stderr.slice(0, 200)}`);
  } else {
    const rebase = await runCmd('git', ['rebase', 'origin/main'], workdir);
    if (rebase.exitCode !== 0) {
      // Abort the rebase to leave the branch in a consistent state, then fail loud.
      await runCmd('git', ['rebase', '--abort'], workdir);
      throw new Error(
        `git rebase origin/main failed: ${rebase.stderr.slice(0, 400) || rebase.stdout.slice(0, 400)}. Likely a real conflict between this run's diff and a recently-landed PR.`,
      );
    }
  }

  const push = await runCmd('git', ['push', '-u', 'origin', branchName], workdir);
  if (push.exitCode !== 0) throw new Error(`git push failed: ${push.stderr.slice(0, 400)}`);
}

export async function diffAgainstMain(workdir: string): Promise<string> {
  const diff = await runCmd('git', ['diff', 'origin/main', '--stat'], workdir);
  return diff.stdout;
}

export async function listChangedFiles(workdir: string): Promise<string[]> {
  const r = await runCmd('git', ['diff', 'origin/main', '--name-only'], workdir);
  if (r.exitCode !== 0) return [];
  return r.stdout
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}
