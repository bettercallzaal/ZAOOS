/**
 * Self-upgrade loop, stages 1 and 4 (research doc 2652, merged as ZAOOS #3862).
 *
 * Zaal shares a GitHub repo link in the ZOE DM. ZOE queues it as a `resource`
 * work item. The existing work loop runs it through the research worker with a
 * FIT CHECK brief: read the repo, read OUR live code, and say per capability
 * whether we EXTEND a named file, build NEW, or SKIP it, with evidence. The
 * output is a numbered research doc plus PR, the same as any work-loop item.
 *
 * Stage 2 (dedupe, doc 2652): before queueing, `resourceDecision` checks the
 * work queue and the research library. A repo already queued is not queued
 * twice; a repo a doc already covers is not re-run unless the message starts
 * with "recheck". The research path has had this guard since wasResearched;
 * the resource path skipped it until this change.
 *
 * Stage 3 (snapshot, doc 2652): with ZOE_SELF_UPGRADE_SNAPSHOT=1 the work loop
 * runs `zao-research-snapshot owner/repo` (zaal-dotfiles bin/, git-tracked)
 * before the fit check and hands its figures to the worker. It FAILS CLOSED:
 * if the tool or the vault clone it writes into is missing on this host, the
 * item parks with a message naming what is missing, and the fit check does not
 * run without it (Zaal, 2026-10-09 grill item 57).
 *
 * Not in this PR, on purpose:
 *   - the build stage (doc 2652 stage 5: Hermes coder with a declared write-set).
 *     Doc 2652's gate table routes changes to bot/src/hermes to Zaal, so that is
 *     its own PR once he rules.
 *   - any install (superpowers on the VPS is a pending Zaal decision).
 *
 * Gated by ZOE_SELF_UPGRADE=1 (default OFF). At most ZOE_SELF_UPGRADE_DAILY
 * resources run per day (default 2, doc 2652 Key Decision 8), inside the work
 * loop's own daily cap; one instance per resource via the work-loop lock.
 */
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

export function selfUpgradeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_SELF_UPGRADE === '1';
}

export const DEFAULT_SELF_UPGRADE_DAILY = 2;

export function selfUpgradeDailyCap(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.ZOE_SELF_UPGRADE_DAILY);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_SELF_UPGRADE_DAILY;
}

// ---------------------------------------------------------------------------
// Intake: which links are resources
// ---------------------------------------------------------------------------

export interface ResourceLink {
  /** Canonical repo URL, https://github.com/<owner>/<repo>. */
  url: string;
  owner: string;
  repo: string;
  /** Whatever Zaal typed around the link: his steer for the fit check. */
  note: string;
}

/** GitHub paths that are not repos. */
const NON_REPO_OWNERS = new Set([
  'orgs', 'settings', 'marketplace', 'features', 'topics', 'collections', 'sponsors', 'apps', 'login', 'notifications',
]);

const RECHECK_RE = /^\s*recheck\b[:\s]*/i;

const REPO_RE = /https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})(?:[/?#]\S*)?/i;

/**
 * The first github.com repo link in a message, or null. A link into a repo
 * (tree, blob, issues) still names the repo; it is canonicalised to the root.
 */
export function parseResourceLink(text: string): ResourceLink | null {
  const m = REPO_RE.exec(text);
  if (!m) return null;
  const owner = m[1];
  const repo = m[2].replace(/\.git$/i, '');
  if (NON_REPO_OWNERS.has(owner.toLowerCase()) || !repo || repo === '.' || repo === '..') return null;
  const note = text.replace(m[0], ' ').replace(RECHECK_RE, '').replace(/\s+/g, ' ').trim();
  return { url: `https://github.com/${owner}/${repo}`, owner, repo, note };
}

/**
 * The DM gate, tested without importing index.ts (agent-loops rule 21): claim
 * only when the flag is on, no pending answer is armed, no "Add a why" reply
 * is expected, and the text carries a repo link. Flag off: null for every
 * input, so a pasted GitHub link takes the path it took before.
 */
export function claimResourceLink(
  text: string,
  state: { pendingArmed: boolean; whyArmed: boolean },
  env: NodeJS.ProcessEnv = process.env,
): ResourceLink | null {
  if (!selfUpgradeEnabled(env) || state.pendingArmed || state.whyArmed) return null;
  return parseResourceLink(text);
}

/** True when Zaal asked for a fresh fit check on a repo a doc already covers. */
export function isRecheck(text: string): boolean {
  return RECHECK_RE.test(text);
}

// ---------------------------------------------------------------------------
// Stage 2: dedupe against the work queue and the research library
// ---------------------------------------------------------------------------

/** Matches a link to this repo in any form: root, tree, blob, issues, .git. */
export function repoMentionTest(link: ResourceLink): (content: string) => boolean {
  const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`github\\.com/${esc(link.owner)}/${esc(link.repo)}(?:\\.git)?(?![A-Za-z0-9_-]|\\.[A-Za-z0-9])`, 'i');
  return (content: string) => re.test(content);
}

export type ResourceDecision =
  | { kind: 'queue' }
  | { kind: 'queued' }
  | { kind: 'researched'; docs: string[] };

/**
 * What the DM intake does with a resource link. Queue first: an item already
 * waiting would run the same fit check twice, and "recheck" does not override
 * that. Then the library: a doc that already names the repo is pointed at
 * instead of re-run, unless `recheck` is set.
 */
export function resourceDecision(
  link: ResourceLink,
  state: { queuedInputs: string[]; docs: string[]; recheck: boolean },
): ResourceDecision {
  const key = link.url.toLowerCase();
  if (state.queuedInputs.some((input) => parseResourceLink(input)?.url.toLowerCase() === key)) return { kind: 'queued' };
  if (!state.recheck && state.docs.length > 0) return { kind: 'researched', docs: state.docs };
  return { kind: 'queue' };
}

/** What a queued resource item's input looks like: the repo URL, then the steer. */
export function resourceInput(link: ResourceLink): string {
  return link.note ? `${link.url} ${link.note}` : link.url;
}

// ---------------------------------------------------------------------------
// Stage 4: the fit-check brief handed to the research worker
// ---------------------------------------------------------------------------

/**
 * The research goal for a resource item. The worker stays read-only; its job
 * is a verdict per capability against LIVE code, not a summary of the repo.
 * Doc 2652's process note is why "origin/main, not a local copy" is spelled
 * out: a stale clone produced a confident wrong absence the day it was written.
 */
export function buildFitCheckGoal(input: string, snapshot?: string): string {
  const link = parseResourceLink(input);
  const target = link ? link.url : input;
  const steer = link?.note ? `\nZAAL'S STEER: ${link.note}\n` : '';
  const snap = snapshot
    ? `\nSNAPSHOT (zao-research-snapshot, taken by ZOE just now; quote these figures, do not re-derive them):\n${snapshot}\n`
    : '';
  return `SELF-UPGRADE FIT CHECK for ${target}
${steer}${snap}
Goal: decide what ZOE (bot/src/zoe in bettercallzaal/ZAOOS) should take from this repo, grounded in OUR live code.

Do, in order:
1. Read the repo itself: README, the LICENSE FILE (gh api repos/<owner>/<repo>/contents/LICENSE, never the API licence field), stars, last push, and the files that implement what the README claims.
2. List the repo's capabilities that could matter to ZOE (at most 8).
3. For each, search OUR code before judging: gh search code "<term>" --owner=bettercallzaal --owner=ZAODEVZ, and read the matching files at origin/main (gh api, not a local clone). Search synonyms, not only the name.
4. Give one verdict per capability: EXTEND <exact file we already have>, NEW (nothing of ours does it; say what you searched), or SKIP (why).

REAL FETCHES ONLY. Every claim cites a file:line or a URL you fetched in this run; anything you could not fetch is marked UNVERIFIED. Do not write or change any code. Nothing outbound.

Output must include, in this order:
## Fit check
| Capability | Verdict (EXTEND <file> / NEW / SKIP) | Evidence (file:line or URL) |
## Credit
Repo, author, licence as read from the LICENSE file, and what we would take.
## Proposed build
For EXTEND/NEW rows only: the files a build would touch (its write-set) and the flag it would sit behind (default OFF). Changes to bot/src/hermes are listed as "needs Zaal's ruling" per doc 2652's gate table.`;
}

/** The research doc's question line for a resource item. */
export function resourceDocQuestion(input: string): string {
  const link = parseResourceLink(input);
  return `Self-upgrade fit check: ${link ? `${link.owner}/${link.repo}` : input.slice(0, 80)}`;
}

// ---------------------------------------------------------------------------
// The daily resource cap (inside the work loop's own cap)
// ---------------------------------------------------------------------------

function counterFile(): string {
  // Same home as work-loop.ts's queue and counter.
  return join(process.env.ZOE_HOME || join(homedir(), '.zao', 'zoe'), 'self-upgrade-count.json');
}

export async function resourcesRunToday(date: string): Promise<number> {
  try {
    const c = JSON.parse(await fs.readFile(counterFile(), 'utf8')) as { date: string; n: number };
    return c.date === date ? c.n : 0;
  } catch {
    return 0;
  }
}

export async function bumpResourcesToday(date: string): Promise<void> {
  const n = (await resourcesRunToday(date)) + 1;
  await fs.mkdir(join(counterFile(), '..'), { recursive: true });
  await fs.writeFile(counterFile(), JSON.stringify({ date, n }));
}

/**
 * Which queued item the tick should run. Research items always qualify; a
 * resource item qualifies only while today's resource cap has room. A capped
 * resource stays queued for tomorrow and does NOT block research behind it.
 * Returns -1 when nothing can run.
 */
export function pickRunnable(kinds: Array<'research' | 'resource'>, resourcesToday: number, cap: number): number {
  return kinds.findIndex((k) => k !== 'resource' || resourcesToday < cap);
}

// ---------------------------------------------------------------------------
// Stage 3: the snapshot, taken before the fit check
// ---------------------------------------------------------------------------

export function selfUpgradeSnapshotEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_SELF_UPGRADE_SNAPSHOT === '1';
}

export const SNAPSHOT_BIN = 'zao-research-snapshot';
const SNAPSHOT_TIMEOUT_MS = 120_000;
/** The worker prompt carries the snapshot; one repo's output is ~15 lines. */
const SNAPSHOT_MAX_CHARS = 3000;

export type SnapshotResult = { ok: true; text: string } | { ok: false; reason: string };

/**
 * Where the tool would run from: every PATH entry, then ~/bin. The systemd
 * user unit's PATH does not normally include ~/bin, which is where the
 * dotfiles bin lands, so it is searched explicitly rather than assumed.
 */
export function snapshotBinCandidates(env: NodeJS.ProcessEnv = process.env, home: string = homedir()): string[] {
  const dirs = (env.PATH ?? '').split(delimiter).filter(Boolean);
  const bin = join(home, 'bin');
  if (!dirs.includes(bin)) dirs.push(bin);
  return dirs.map((d) => join(d, SNAPSHOT_BIN));
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    await fs.access(path, 1 /* X_OK */);
    return (await fs.stat(path)).isFile();
  } catch {
    return false;
  }
}

/**
 * Run the snapshot for one repo. Never throws; a failure says what failed.
 *
 * The vault check comes first and is why this is fail-closed rather than
 * best-effort: the tool appends to ~/zao-vault/projects/*.csv, and with no
 * clone there it would create a fresh directory nobody reads, report success,
 * and every snapshot would fall on the floor (the grill-queue.ts lesson).
 */
export async function takeResourceSnapshot(
  link: ResourceLink,
  env: NodeJS.ProcessEnv = process.env,
  home: string = homedir(),
): Promise<SnapshotResult> {
  const vault = join(home, 'zao-vault');
  try {
    await fs.stat(join(vault, '.git'));
  } catch {
    return { ok: false, reason: `no vault clone at ${vault} (the snapshot writes projects/research-snapshots.csv there)` };
  }
  const candidates = snapshotBinCandidates(env, home);
  let bin: string | null = null;
  for (const c of candidates) {
    if (await isExecutable(c)) {
      bin = c;
      break;
    }
  }
  if (!bin) {
    const dirs = candidates.map((c) => c.slice(0, -SNAPSHOT_BIN.length - 1));
    return { ok: false, reason: `${SNAPSHOT_BIN} is not on this host (searched ${dirs.join(', ')})` };
  }
  const found = bin;
  return new Promise((resolve) => {
    execFile(
      found,
      [`${link.owner}/${link.repo}`],
      { timeout: SNAPSHOT_TIMEOUT_MS, env: { ...env, HOME: home }, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const why = String(stderr || err.message).trim().split('\n').slice(-3).join(' | ');
          resolve({ ok: false, reason: `${SNAPSHOT_BIN} failed: ${why.slice(0, 300)}` });
          return;
        }
        const text = String(stdout).trim();
        if (!text) {
          resolve({ ok: false, reason: `${SNAPSHOT_BIN} printed nothing for ${link.owner}/${link.repo}` });
          return;
        }
        resolve({ ok: true, text: text.slice(0, SNAPSHOT_MAX_CHARS) });
      },
    );
  });
}
