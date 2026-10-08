/**
 * terminals-digest.ts - tell Zaal how every terminal is doing, from his DM.
 *
 * Zaal, 2026-10-07 (vault decisions item 50): "Zoe first priority have it share
 * with me how all termiansl are doing". ZOE runs on the VPS and cannot see Orca
 * on the Mac. The orchestrator seat already keeps one page current for exactly
 * this: zao-vault notes/orca-terminals-latest.md, with Waiting on Zaal, Running
 * now and Terminals tables. That page is the bridge; this module reads it and
 * sends the short version, wants-from-you first.
 *
 * WHY origin/main AND NOT THE FILE ON DISK. The VPS vault checkout was 2,512
 * commits behind on 2026-10-07 with a modified BLACKBOARD.md, so it cannot be
 * fast-forwarded and its working tree is weeks old. `git fetch` moves only the
 * remote ref, never the working tree, and `git show origin/main:<path>` reads
 * the current page from that ref. If the fetch fails the last ref is read and
 * the message says the vault could not be reached, never that the page is fresh.
 *
 * Off unless ZOE_TERMINALS_DIGEST=1. The scheduled send also needs
 * ZOE_TERMINALS_DIGEST_CRON and is held while Zaal has the grill stopped;
 * /terminals answers when asked, paused or not.
 */

import { execFile } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isGrillPaused } from './grill-pause';

export const PAGE_PATH = 'notes/orca-terminals-latest.md';
const MAX_LEN = 3800;

export function terminalsDigestEnabled(): boolean {
  return process.env.ZOE_TERMINALS_DIGEST === '1';
}

export interface TerminalsPage {
  stamp: string | null;
  waiting: { id: string; item: string }[];
  running: { id: string; item: string; who: string }[];
  terminals: { tab: string; role: string; next: string }[];
}

function cellsOf(line: string): string[] {
  return line.split('|').slice(1, -1).map((c) => c.replace(/\*\*/g, '').trim());
}

function tableRows(section: string): string[][] {
  return section
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .slice(2) // header + separator
    .map(cellsOf)
    .filter((c) => c.length > 1 && !/^-+$/.test(c[0]));
}

/** Pure. Reads the three tables the seat keeps, by heading. */
export function parseTerminalsPage(md: string): TerminalsPage {
  const stamp = md.match(/Stamp:\s*([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(?: [A-Z]{2,4})?)/)?.[1] ?? null;
  const sections = md.split(/^## /m).slice(1);
  const find = (re: RegExp) => sections.find((s) => re.test(s.split('\n')[0])) ?? '';
  return {
    stamp,
    waiting: tableRows(find(/^Waiting on Zaal/i)).map((c) => ({ id: c[0], item: c[1] ?? '' })),
    running: tableRows(find(/^Running now/i)).map((c) => ({ id: c[0], item: c[1] ?? '', who: c[2] ?? '' })),
    terminals: tableRows(find(/^Terminals/i)).map((c) => ({ tab: c[0], role: c[2] ?? '', next: c[3] ?? '' })),
  };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 3)}...` : s);

/** Pure. Wants-from-you first, then the active terminals, then counts. */
export function formatTerminalsDigest(p: TerminalsPage, opts: { fetched: boolean }): string {
  if (!p.waiting.length && !p.terminals.length) {
    return 'Terminals: could not read the terminals page in the vault (no Waiting on Zaal or Terminals table found). Nothing to report until the seat writes it.';
  }
  const head = [`Terminals - seat page stamped ${p.stamp ?? 'with no stamp'}`];
  if (!opts.fetched) head.push('Could not reach the vault; this is the last copy the VPS had.');
  const wants = p.waiting.length
    ? [`Wants from you (${p.waiting.length}):`, ...p.waiting.map((w) => `${w.id} ${clip(w.item, 140)}`)]
    : ['Wants from you: nothing listed.'];
  const active = p.terminals.filter((t) => /^ACTIVE/i.test(t.role));
  const act = active.length ? ['Active:', ...active.map((t) => `${t.tab}: ${clip(t.next, 80)}`)] : ['Active: none listed.'];
  const run = p.running.length ? [`Running: ${p.running.map((r) => `${r.id} ${clip(r.item, 60)}`).join('; ')}`] : [];
  const roles = new Map<string, number>();
  for (const t of p.terminals) {
    const k = /^ACTIVE/i.test(t.role) ? 'active' : /^NEXT/i.test(t.role) ? 'next' : /^side$/i.test(t.role) ? 'side' : /^LATER/i.test(t.role) ? 'later' : 'other';
    roles.set(k, (roles.get(k) ?? 0) + 1);
  }
  const count = [`${p.terminals.length} terminals: ${['active', 'next', 'side', 'later', 'other'].filter((k) => roles.get(k)).map((k) => `${roles.get(k)} ${k}`).join(', ')}`];
  const parts = [head.join('\n'), wants.join('\n'), act.join('\n'), [...run, ...count].join('\n')];
  let text = parts.join('\n\n');
  // Over one Telegram message: drop wants lines from the end, and say so.
  while (text.length > MAX_LEN && wants.length > 2) {
    wants.splice(wants.length - 1, 1);
    parts[1] = [...wants, `(more on the vault page: ${PAGE_PATH})`].join('\n');
    text = parts.join('\n\n');
  }
  return text.slice(0, MAX_LEN);
}

export type GitRun = (args: string[]) => Promise<string>;

function gitIn(dir: string): GitRun {
  return (args) =>
    new Promise((resolve, reject) => {
      execFile('git', ['-C', dir, ...args], { timeout: 20_000, maxBuffer: 2_000_000 }, (err, stdout) =>
        err ? reject(err) : resolve(stdout),
      );
    });
}

/** Fetch, then read the page from origin/main. A failed fetch reads the last ref and says so. */
export async function readTerminalsPage(dir: string, run: GitRun = gitIn(dir)): Promise<{ text: string; fetched: boolean }> {
  let fetched = true;
  try {
    await run(['fetch', '-q', 'origin', 'main']);
  } catch (error: unknown) {
    fetched = false;
    console.warn('[zoe/terminals] vault fetch failed, reading the last ref:', (error as Error)?.message);
  }
  const text = await run(['show', `origin/main:${PAGE_PATH}`]);
  return { text, fetched };
}

export function vaultDir(): string {
  return process.env.VAULT_DIR ?? join(homedir(), 'zao-vault');
}

/** Send the digest once. 'paused' only for the scheduled send; /terminals always answers. */
export async function sendTerminalsDigest(deps: {
  send: (text: string) => Promise<unknown>;
  scheduled: boolean;
  read?: () => Promise<{ text: string; fetched: boolean }>;
}): Promise<'off' | 'paused' | 'sent' | 'failed'> {
  if (!terminalsDigestEnabled()) return 'off';
  if (deps.scheduled && (await isGrillPaused())) return 'paused';
  let page: { text: string; fetched: boolean };
  try {
    page = await (deps.read ?? (() => readTerminalsPage(vaultDir())))();
  } catch (error: unknown) {
    console.error('[zoe/terminals] could not read the page:', (error as Error)?.message);
    await deps.send(`Terminals: could not read ${PAGE_PATH} from the vault on the VPS. ${(error as Error)?.message?.slice(0, 160) ?? ''}`);
    return 'failed';
  }
  await deps.send(formatTerminalsDigest(parseTerminalsPage(page.text), { fetched: page.fetched }));
  return 'sent';
}
