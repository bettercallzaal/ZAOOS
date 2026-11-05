/**
 * Typed PR snapshot reader (design note gap G1). READ-ONLY: `gh pr view` and
 * `gh api` GETs, always with an explicit repo. The runner is injected so tests
 * never touch the network; the default runner shells `gh` and is only built
 * when a caller asks for it.
 *
 * Fail closed: any read error, unparsable JSON, truncated list (files, check
 * runs) or head mismatch yields null, never a partial snapshot.
 */

import { execFile } from 'node:child_process';
import { isFullSha, isRepoSlug } from './merge-line';
import type { PrComment } from './verdict';

export interface CiCheck {
  name: string;
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | ... | null
}

export interface PrSnapshot {
  repo: string;
  number: number;
  state: string; // OPEN | CLOSED | MERGED
  isDraft: boolean;
  headSha: string;
  baseRef: string;
  labels: string[];
  files: string[];
  comments: PrComment[];
  /** Check runs for headSha. Empty means none exist, which gates treat as not ready. */
  checks: CiCheck[];
}

export interface GhResult {
  code: number;
  stdout: string;
}
export type GhRunner = (args: string[]) => Promise<GhResult>;

export const defaultGhRunner: GhRunner = (args) =>
  new Promise((resolve) => {
    execFile('gh', args, { maxBuffer: 8 * 1024 * 1024, timeout: 30_000 }, (err, stdout) => {
      const code = err ? (typeof (err as NodeJS.ErrnoException).code === 'number' ? ((err as NodeJS.ErrnoException).code as unknown as number) : 1) : 0;
      resolve({ code, stdout: String(stdout ?? '') });
    });
  });

interface RawPr {
  number?: number;
  state?: string;
  isDraft?: boolean;
  headRefOid?: string;
  baseRefName?: string;
  labels?: Array<{ name?: string }>;
  files?: Array<{ path?: string }>;
  changedFiles?: number;
  comments?: Array<{ id?: string; author?: { login?: string } | null; createdAt?: string; body?: string }>;
}

interface RawChecks {
  total_count?: number;
  check_runs?: Array<{ name?: string; status?: string; conclusion?: string | null; head_sha?: string }>;
}

function parseJson<T>(r: GhResult): T | null {
  if (r.code !== 0 || !r.stdout.trim()) return null;
  try {
    return JSON.parse(r.stdout) as T;
  } catch {
    return null;
  }
}

export async function readSnapshot(repo: string, number: number, run: GhRunner): Promise<PrSnapshot | null> {
  if (!isRepoSlug(repo) || !Number.isInteger(number) || number <= 0) return null;
  const pr = parseJson<RawPr>(
    await run([
      'pr', 'view', String(number), '-R', repo, '--json',
      'number,state,isDraft,headRefOid,baseRefName,labels,files,changedFiles,comments',
    ]).catch(() => ({ code: 1, stdout: '' })),
  );
  if (!pr || pr.number !== number || !isFullSha(pr.headRefOid)) return null;
  const headSha = pr.headRefOid;
  const files = (pr.files ?? []).map((f) => f.path ?? '');
  // gh caps `files` at 100. A shorter list than the true count cannot prove "no reserved path".
  if (typeof pr.changedFiles !== 'number' || files.length < pr.changedFiles || files.some((f) => !f)) return null;

  const raw = parseJson<RawChecks>(
    await run(['api', `repos/${repo}/commits/${headSha}/check-runs?per_page=100`]).catch(() => ({ code: 1, stdout: '' })),
  );
  if (!raw || !Array.isArray(raw.check_runs)) return null;
  if (typeof raw.total_count !== 'number' || raw.check_runs.length < raw.total_count) return null;
  // Every run must belong to the exact head; a run for any other SHA means the read is not trustworthy.
  if (raw.check_runs.some((c) => c.head_sha !== headSha)) return null;

  return {
    repo,
    number,
    state: String(pr.state ?? ''),
    isDraft: pr.isDraft === true,
    headSha,
    baseRef: String(pr.baseRefName ?? ''),
    labels: (pr.labels ?? []).map((l) => l.name ?? '').filter(Boolean),
    files,
    comments: (pr.comments ?? []).map((c) => ({
      id: String(c.id ?? ''),
      login: c.author?.login ?? '',
      createdAt: c.createdAt ?? '',
      body: c.body ?? '',
    })),
    checks: raw.check_runs.map((c) => ({
      name: c.name ?? '',
      status: c.status ?? '',
      conclusion: c.conclusion ?? null,
    })),
  };
}
