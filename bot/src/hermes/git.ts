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
