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
import { claudeBriefLines, readClaudeHealth } from '../hermes/claude-health';
import { DRIP_DEFAULT } from './backlog-grill';
import { outstandingCount, type BacklogGrillState } from './backlog-grill-runner';
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

/**
 * How many grill cards are sent-but-unanswered. Reads the grill's own state.
 *
 * The count MUST be the grill's own `outstandingCount`, not a re-derivation.
 * A task answered "work" or "skip" keeps its `asked` mark (stamped
 * `requeuedAt`) and has its `answered` mark DELETED, so "asked minus answered"
 * counts every requeue as an outstanding card. Since a requeue is never
 * un-asked until it is answered a second time, that number only ever climbs -
 * it crosses the cap on its own and then pins a permanent, false
 * "Grill stuck at 20" in the one place the brief promises to be correct.
 * The grill's own docstring warns about exactly this arithmetic.
 */
export async function grillDepth(): Promise<number | null> {
  try {
    const raw = await fs.readFile(join(homedir(), '.zao/zoe/backlog-grill-state.json'), 'utf8');
    const d = JSON.parse(raw) as Partial<BacklogGrillState>;
    return outstandingCount({
      asked: d.asked ?? {},
      answered: d.answered ?? {},
      activeTaskId: null,
      lastSentMs: null,
    });
  } catch {
    return null;
  }
}

const REPO = 'bettercallzaal/ZAOOS';

export async function gatherBrief(now: Date = new Date()): Promise<BriefInput> {
  const [prsRaw, ciRaw, depth, health] = await Promise.all([
    sh(`gh api 'repos/${REPO}/pulls?state=open&per_page=100' --jq 'length'`),
    sh(`gh api 'repos/${REPO}/actions/runs?branch=main&per_page=1' --jq '.workflow_runs[0].conclusion // ""'`),
    grillDepth(),
    // A file read, same cost class as the grill state. The brief must never call
    // Claude itself - it runs every 5 minutes forever.
    readClaudeHealth(),
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
    // The cap comes from the grill's own config, so the brief can never claim
    // "at cap" at a number the drip does not actually stop at.
    const cap = DRIP_DEFAULT.maxOutstanding;
    running.push(['grill queue', depth >= cap ? `${depth} (at cap)` : String(depth)]);
    if (depth >= cap) needsYou.push(`Grill stuck at ${cap} - answer any card to restart it`);
  }

  // Claude reachability. The whole point is that this line exists at all: when the
  // OAuth token was revoked on 2026-08-08 the brief had nothing to say about Claude,
  // so four days of total failure looked exactly like four days of working fine.
  // `claudeBriefLines` only claims health from a recorded success, and only alerts
  // on an observed auth failure - so it can reach zero when the token is fixed.
  const claude = claudeBriefLines(health, now.getTime());
  running.push(claude.status);
  if (claude.alert) needsYou.push(claude.alert);

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
