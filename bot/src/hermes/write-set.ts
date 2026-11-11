/**
 * write-set.ts - a Hermes build may change only the files it declared.
 *
 * THE GAP (doc 2652, 2026-10-09): the self-upgrade build stage is specified as
 * "Hermes coder with a declared write-set", and self-upgrade.ts asks the model
 * to list each build's write-set. But nothing in the runner enforced one: a
 * coder told "only touch X" could edit anything not on HERMES_FORBIDDEN_PATHS,
 * and the PR would open. A prompt is a request; this is the check.
 *
 * HOW: a caller passes `writeSet` to dispatchHermesRun. After each coder
 * attempt, and again right before the push, the runner lists every path the
 * work tree changed, tracked AND untracked, and any path outside the set fails
 * the attempt: the tree is reset and the coder is told which files were out of
 * bounds. No push happens with an out-of-set file.
 *
 * Untracked files count because commitAndPush runs `git add -A`, so a new file
 * ships, while listChangedFiles (`git diff origin/main --name-only`) does not
 * see a file that was never added.
 *
 * Entries: an exact repo-relative file path, or a directory ending in "/" that
 * covers everything under it. Absolute paths and ".." are refused. An EMPTY
 * set is refused too (it would mean "change nothing", which no build wants and
 * which is more likely a caller bug). No `writeSet` at all = today's behavior.
 */

import { runCmd } from './git';

export class WriteSetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WriteSetError';
  }
}

/** Clean and check a declared write-set. Throws WriteSetError on a bad entry. */
export function normalizeWriteSet(entries: string[]): string[] {
  if (entries.length === 0) throw new WriteSetError('write-set is empty');
  const out: string[] = [];
  for (const raw of entries) {
    const e = raw.trim().replace(/^\.\//, '');
    if (!e) throw new WriteSetError('write-set has a blank entry');
    if (e.startsWith('/') || /^[A-Za-z]:[\\/]/.test(e)) throw new WriteSetError(`write-set entry is absolute: ${raw}`);
    if (e.split(/[\\/]/).includes('..')) throw new WriteSetError(`write-set entry climbs out with "..": ${raw}`);
    if (/[*?[\]]/.test(e)) throw new WriteSetError(`write-set entry is a glob, name files or a dir/ instead: ${raw}`);
    out.push(e);
  }
  return out;
}

/** True when `path` is an entry, or under an entry that ends in "/". */
export function inWriteSet(path: string, set: string[]): boolean {
  const p = path.replace(/^\.\//, '');
  return set.some((e) => (e.endsWith('/') ? p.startsWith(e) : p === e));
}

/** The changed paths that are NOT covered by the write-set. */
export function outsideWriteSet(paths: string[], set: string[]): string[] {
  return paths.filter((p) => !inWriteSet(p, set));
}

/** The line the coder is given, so it knows the bounds before it starts. */
export function writeSetBrief(set: string[]): string {
  return [
    'WRITE-SET (enforced): you may change ONLY these paths. A directory ending in "/" covers everything under it.',
    ...set.map((e) => `- ${e}`),
    'Any change outside this list fails the attempt and is thrown away. If the fix needs another file, say so in the rationale instead of editing it.',
  ].join('\n');
}

/**
 * Every path the work tree changed against origin/main: tracked edits and
 * deletes plus untracked new files (respecting .gitignore). Throws when git
 * fails, so the caller fails closed instead of reading an error as "nothing
 * changed".
 */
export async function listTouchedFiles(workdir: string): Promise<string[]> {
  // --no-renames: a move lists BOTH its source (deleted) and destination; with
  // rename detection only the destination printed, so moving an out-of-set
  // file to an in-set path hid the out-of-set side. -z: NUL-separated and
  // unquoted, and names are NOT trimmed, because "a.ts " is a different file
  // from "a.ts" (both found in the #4295 seat review, 2026-11-10).
  const tracked = await runCmd('git', ['diff', 'origin/main', '--name-only', '--no-renames', '-z'], workdir);
  if (tracked.exitCode !== 0) throw new WriteSetError(`git diff failed: ${tracked.stderr.slice(0, 200)}`);
  const untracked = await runCmd('git', ['ls-files', '--others', '--exclude-standard', '-z'], workdir);
  if (untracked.exitCode !== 0) throw new WriteSetError(`git ls-files failed: ${untracked.stderr.slice(0, 200)}`);
  const all = `${tracked.stdout}\0${untracked.stdout}`.split('\0').filter((s) => s.length > 0);
  return [...new Set(all)];
}
