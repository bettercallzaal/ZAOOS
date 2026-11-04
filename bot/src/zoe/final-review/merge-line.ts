/**
 * Pinned merge line builder for the ZOE final reviewer (design note
 * notes/zoe-final-reviewer-design-2026-11-04.md, decision 184 option A).
 *
 * ZOE never runs a merge. After an owner tap it REPLIES this line as plain
 * text for Zaal or the merge lane to run. The line pins one head SHA, so a
 * push after the card makes the line fail zao-merge's own exact-head gate.
 *
 * Fail closed: anything that is not a 40-hex SHA or an owner/repo slug yields
 * null, never a best-effort line. Inputs are interpolated into a shell line
 * the owner will paste, so the shapes are validated, not escaped.
 */

const SHA_RE = /^[0-9a-f]{40}$/;
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function isFullSha(s: unknown): s is string {
  return typeof s === 'string' && SHA_RE.test(s);
}

export function isRepoSlug(s: unknown): s is string {
  return typeof s === 'string' && REPO_RE.test(s) && !s.includes('..');
}

/** `zao-merge OWNER/REPO N --head <sha>`, or null when any part is malformed. */
export function buildMergeLine(repo: string, number: number, headSha: string): string | null {
  if (!isRepoSlug(repo)) return null;
  if (!Number.isInteger(number) || number <= 0) return null;
  if (!isFullSha(headSha)) return null;
  return `zao-merge ${repo} ${number} --head ${headSha}`;
}
