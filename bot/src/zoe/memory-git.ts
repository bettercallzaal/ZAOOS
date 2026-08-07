/**
 * memory-git.ts - commit-per-edit versioning for ZOE's memory files.
 *
 * TS port of scripts/agents/zoe-memory-git.py (#2925), the #1 adopt from the
 * ZOE-vs-toolkits audit (doc 2235): memory at ~/.zao/zoe/*.md had no version
 * history - no what-changed/when/why, no rollback. This wraps memory writes in git
 * commits (git IS the backend - native platform feature, no new dependency).
 *
 * FLAG-GATED + best-effort: only active when ZOE_MEMORY_GIT=1 (default OFF = exact
 * current behavior). A git failure NEVER breaks the memory write - the write already
 * happened; versioning is an audit layer. Failures log loudly (silent-failure-guard
 * rule 6: soft-fail must be loud, never silent).
 *
 * Pattern credit: letta-ai/letta (Apache-2.0) - versioned memory blocks.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const execFileAsync = promisify(execFile);

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');

/** Versioning is opt-in: absent/other values = current behavior, zero git calls. */
export function memoryGitEnabled(): boolean {
  return process.env.ZOE_MEMORY_GIT === '1';
}

async function git(args: string[], dir: string = ZOE_HOME): Promise<string> {
  const { stdout } = await execFileAsync('git', ['-C', dir, ...args]);
  return stdout.trim();
}

/** git init the memory dir on first use (idempotent). Never touches file contents. */
export async function ensureMemoryRepo(dir: string = ZOE_HOME): Promise<void> {
  if (!existsSync(join(dir, '.git'))) {
    await git(['init', '-q'], dir);
    // local identity so commits work even with no global git config on the box
    await git(['config', 'user.email', 'zoe@thezao.com'], dir).catch(() => undefined);
    await git(['config', 'user.name', 'ZOE memory'], dir).catch(() => undefined);
  }
}

/**
 * Commit an already-written memory file with (reason, author). Returns the short sha,
 * '' when nothing changed (idempotent no-op writes create no empty commit), or null
 * when versioning is disabled or git failed (the write itself is unaffected).
 */
export async function commitMemoryWrite(
  file: string,
  reason: string,
  author = 'zoe',
): Promise<string | null> {
  if (!memoryGitEnabled()) return null;
  try {
    await ensureMemoryRepo();
    await git(['add', file]);
    // nothing staged (identical content) -> honest no-op
    try {
      await git(['diff', '--cached', '--quiet', '--', file]);
      return ''; // exit 0 = no staged change
    } catch {
      // non-zero exit = there IS a staged change; commit it
    }
    await git([
      'commit', '-q',
      '-m', `memory: ${file} - ${reason}\n\nAuthor: ${author}`,
      '--author', `${author} <${author}@thezao.com>`,
    ]);
    return await git(['rev-parse', '--short', 'HEAD']);
  } catch (error: unknown) {
    // LOUD soft-fail: versioning must never break a memory write, but a silent
    // versioning outage is silent data loss of the audit trail.
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[memory-git] commit failed for ${file} (write itself is fine): ${msg}`);
    return null;
  }
}

export interface MemoryCommit {
  sha: string;
  date: string;
  reason: string;
}

/** What changed, when, why - newest first. Empty when unversioned/disabled. */
export async function memoryHistory(file: string): Promise<MemoryCommit[]> {
  if (!existsSync(join(ZOE_HOME, '.git'))) return [];
  try {
    const out = await git(['log', '--format=%h\x1f%ad\x1f%s', '--date=short', '--', file]);
    return out
      .split('\n')
      .filter((l) => l.includes('\x1f'))
      .map((l) => {
        const [sha, date, subject] = l.split('\x1f');
        const reason = subject.includes(' - ') ? subject.split(' - ').slice(1).join(' - ') : subject;
        return { sha, date, reason };
      });
  } catch {
    return [];
  }
}

/** The why-changed traversal: just the reasons, newest first. */
export async function memoryWhy(file: string): Promise<string[]> {
  return (await memoryHistory(file)).map((c) => c.reason);
}

/**
 * Restore a memory file to a prior commit's version, recorded as a NEW commit -
 * never rewrites history (no-rm-rf-adjacent principle: history is append-only).
 */
export async function rollbackMemory(
  file: string,
  ref: string,
  author = 'zoe',
): Promise<string | null> {
  if (!memoryGitEnabled()) return null;
  try {
    await ensureMemoryRepo();
    await git(['checkout', ref, '--', file]);
    await git(['add', file]);
    try {
      await git(['diff', '--cached', '--quiet', '--', file]);
      return ''; // already at that version
    } catch {
      // staged change exists - commit the rollback
    }
    await git([
      'commit', '-q',
      '-m', `memory: ${file} - rollback to ${ref}\n\nAuthor: ${author}`,
      '--author', `${author} <${author}@thezao.com>`,
    ]);
    return await git(['rev-parse', '--short', 'HEAD']);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[memory-git] rollback failed for ${file}: ${msg}`);
    return null;
  }
}
