/**
 * pinned-brief-runner.ts - gather real state and keep the pinned brief current.
 *
 * The render lives in pinned-brief.ts (pure, fully tested). This is the impure
 * half: it asks the box what is true and hands the result over.
 *
 * Every source here is CHEAP and LOCAL to the VPS - a file read and one `gh`
 * call. Nothing here may become slow enough to matter, because it runs on a
 * timer forever. If a source fails, its line is OMITTED rather than guessed:
 * a brief that invents "main green" while CI is red is worse than a brief that
 * says nothing about CI (anti-fabrication.md rule 5).
 */
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { renderPinnedBrief, syncPinnedBrief, type BriefInput, type PinDeps, type PinResult } from './pinned-brief';

const run = promisify(exec);

/** Anything slower than this is not worth a pinned brief being late for. */
const CMD_TIMEOUT_MS = 8000;

async function sh(cmd: string): Promise<string | null> {
  try {
    const { stdout } = await run(cmd, { timeout: CMD_TIMEOUT_MS });
    return stdout.trim();
  } catch {
    return null; // omitted, never guessed
  }
}

/** How many grill cards are sent-but-unanswered. Reads the grill's own state. */
export async function grillDepth(): Promise<number | null> {
  try {
    const raw = await fs.readFile(join(homedir(), '.zao/zoe/backlog-grill-state.json'), 'utf8');
    const d = JSON.parse(raw) as { asked?: Record<string, unknown>; answered?: Record<string, unknown> };
    const asked = Object.keys(d.asked ?? {});
    const answered = new Set(Object.keys(d.answered ?? {}));
    return asked.filter((id) => !answered.has(id)).length;
  } catch {
    return null;
  }
}

const REPO = 'bettercallzaal/ZAOOS';

export async function gatherBrief(now: Date = new Date()): Promise<BriefInput> {
  const [prsRaw, ciRaw, depth] = await Promise.all([
    sh(`gh api 'repos/${REPO}/pulls?state=open&per_page=100' --jq 'length'`),
    sh(`gh api 'repos/${REPO}/actions/runs?branch=main&per_page=1' --jq '.workflow_runs[0].conclusion // ""'`),
    grillDepth(),
  ]);

  const needsYou: string[] = [];
  const running: Array<[string, string]> = [['ZOE', 'up']];

  if (prsRaw !== null && /^\d+$/.test(prsRaw)) {
    const n = Number(prsRaw);
    running.push(['open PRs', String(n)]);
    if (n >= 5) needsYou.push(`${n} PRs open - review or merge`);
  }

  if (ciRaw) {
    running.push(['main', ciRaw === 'success' ? 'green' : ciRaw]);
    if (ciRaw !== 'success') needsYou.push(`main is ${ciRaw} - CI needs a look`);
  }

  if (depth !== null) {
    running.push(['grill queue', depth >= 20 ? `${depth} (at cap)` : String(depth)]);
    if (depth >= 20) needsYou.push('Grill stuck at 20 - answer any card to restart it');
  }

  const updatedLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  return { needsYou, running, changed: [], updatedLabel: `${updatedLabel} ET` };
}

export interface BriefTickDeps extends Omit<PinDeps, 'statePath'> {
  statePath?: string;
  /** Injected in tests so the gather step stays offline. */
  gather?: (now?: Date) => Promise<BriefInput>;
}

export async function runPinnedBriefTick(deps: BriefTickDeps): Promise<PinResult> {
  const input = await (deps.gather ?? gatherBrief)();
  return syncPinnedBrief(renderPinnedBrief(input), deps);
}
