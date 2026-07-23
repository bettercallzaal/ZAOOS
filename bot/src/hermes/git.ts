import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { HermesRepoTarget } from './types';

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
 * Repo profile = the configuration we need to clone, install, and pre-flight a
 * given repo target. Adding a new target means adding a profile entry below
 * (and a matching system-prompt context block in coder.ts).
 *
 * `installSubdirs`: extra directories that need their own `npm ci/install`
 * after the root install. ZAO OS has bot/ with its own lockfile; zaostock has
 * none today (single root package).
 */
export interface RepoProfile {
  target: HermesRepoTarget;
  url: string;
  defaultBranch: string;
  installSubdirs: string[];
}

const HERMES_REPO_PROFILES: Record<HermesRepoTarget, RepoProfile> = {
  zaoos: {
    target: 'zaoos',
    url: process.env.HERMES_REPO_URL ?? 'https://github.com/bettercallzaal/ZAOOS.git',
    defaultBranch: 'main',
    installSubdirs: ['bot'],
  },
  zaostock: {
    target: 'zaostock',
    url: process.env.HERMES_ZAOSTOCK_REPO_URL ?? 'https://github.com/bettercallzaal/zaostock.git',
    defaultBranch: 'main',
    installSubdirs: [],
  },
  zaocowork: {
    target: 'zaocowork',
    url: process.env.HERMES_ZAOCOWORK_REPO_URL ?? 'https://github.com/ZAODEVZ/ZAOcowork.git',
    defaultBranch: 'main',
    installSubdirs: [],
  },
};

export function getRepoProfile(target: HermesRepoTarget): RepoProfile {
  return HERMES_REPO_PROFILES[target];
}

/**
 * Clone the target repo into workdir as a fresh checkout from origin/main.
 * Default target is 'zaoos' (ZAO OS monorepo). Pass 'zaostock' to target the
 * standalone festival site - same pre-flight + safety guarantees.
 *
 * Authentication: relies on system git credentials (gh auth or SSH key).
 * The same gh auth must have push access to whichever repo is targeted.
 */
export async function cloneAndBranch(
  workdir: string,
  branchName: string,
  target: HermesRepoTarget = 'zaoos',
): Promise<void> {
  const profile = getRepoProfile(target);
  const clone = await runCmd('git', ['clone', '--depth', '50', '--branch', profile.defaultBranch, profile.url, workdir]);
  if (clone.exitCode !== 0) {
    throw new Error(`git clone failed (${target}): ${clone.stderr.slice(0, 400)}`);
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
    console.error(
      `[hermes/git] npm ${installCmd} returned exit ${install.exitCode}. Pre-flight may fail. stderr: ${install.stderr.slice(0, 300)}`,
    );
  }

  // Install deps in any extra subdirs the profile declares (e.g. ZAO OS bot/).
  for (const subdir of profile.installSubdirs) {
    const subPath = `${workdir}/${subdir}`;
    const subLockExists = await fs.access(`${subPath}/package-lock.json`).then(() => true).catch(() => false);
    const subPkgExists = await fs.access(`${subPath}/package.json`).then(() => true).catch(() => false);
    if (!subPkgExists) continue;
    const subCmd = subLockExists ? 'ci' : 'install';
    const subInstall = await runCmd(
      'npm',
      [subCmd, '--ignore-scripts', '--no-audit', '--no-fund', '--prefer-offline'],
      subPath,
    );
    if (subInstall.exitCode !== 0) {
      console.error(
        `[hermes/git] ${subdir} npm ${subCmd} returned exit ${subInstall.exitCode}. Pre-flight may fail. stderr: ${subInstall.stderr.slice(0, 300)}`,
      );
    }
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

  // Post-action assertion: a 0 exit code from `git push` does NOT guarantee the
  // ref actually landed on origin (a push hook, proxy, or branch-protection rule
  // can reject/rewrite the ref while the local command still reports success).
  // Re-read reality via ls-remote before returning - otherwise the caller opens a
  // PR against a branch that is not there and fails cryptically downstream.
  const head = await runCmd('git', ['rev-parse', 'HEAD'], workdir);
  const expectedSha = head.exitCode === 0 ? head.stdout.trim() : undefined;
  await verifyRemoteBranch(workdir, branchName, expectedSha);
}

/**
 * Pure assertion over `git ls-remote --heads origin <branch>` output. Confirms
 * the branch is present on origin and (when expectedSha is given) that its tip
 * matches the commit we pushed. Split out from verifyRemoteBranch so it is
 * unit-testable without a real git remote.
 * @throws if the branch is absent, or present at a different sha.
 */
export function assertRemoteBranchPresent(
  lsRemoteStdout: string,
  branch: string,
  expectedSha?: string,
): string {
  const line = lsRemoteStdout
    .trim()
    .split('\n')
    .find((l) => l.trimEnd().endsWith(`refs/heads/${branch}`));
  if (!line) {
    throw new Error(
      `post-push verify FAILED: branch '${branch}' is not on origin after a push that reported success. ` +
        `The push exit code was misleading - a push hook, proxy, or branch-protection rule likely rejected the ref. ` +
        `Aborting before a PR is opened against a non-existent branch.`,
    );
  }
  const remoteSha = line.split(/\s+/)[0] ?? '';
  if (expectedSha && remoteSha !== expectedSha) {
    throw new Error(
      `post-push verify FAILED: origin/${branch} is at ${remoteSha.slice(0, 8)} but the commit we just pushed is ${expectedSha.slice(0, 8)}. ` +
        `The remote ref does not match local HEAD - do not open a PR against a diverged branch.`,
    );
  }
  return remoteSha;
}

/**
 * Post-action assertion for a push: re-read origin via ls-remote and confirm the
 * branch (optionally at expectedSha) actually landed. See assertRemoteBranchPresent.
 */
export async function verifyRemoteBranch(
  workdir: string,
  branch: string,
  expectedSha?: string,
): Promise<string> {
  const ls = await runCmd('git', ['ls-remote', '--heads', 'origin', branch], workdir);
  if (ls.exitCode !== 0) {
    throw new Error(
      `post-push verify failed: git ls-remote errored for '${branch}': ${ls.stderr.slice(0, 300)}`,
    );
  }
  return assertRemoteBranchPresent(ls.stdout, branch, expectedSha);
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
