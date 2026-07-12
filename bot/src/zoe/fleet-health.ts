/**
 * fleet-health.ts - process/unit liveness + SELF-HEAL for the watcher.
 * watcher.ts checks dispatch cost/quality; this checks the fleet is RUNNING and
 * now auto-restarts what died (the agentic upgrade: detect -> heal, not just ping).
 *
 * Safe: restarts are capped per unit per day (crash-loop guard) and NEVER restart
 * zoe-bot itself (that would kill the process running this). Runs on the VPS.
 */
import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { WatcherAlert } from './watcher';

const exec = promisify(execCb);

export const FLEET_UNITS = (
  process.env.ZOE_FLEET_UNITS || 'zoe-bot,zao-devz-stack,cowork-agent,farscout,zaostock-bot'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Never auto-restart these (restarting zoe-bot from inside zoe-bot = suicide). */
export const NO_HEAL = new Set(['zoe-bot']);
const RESTART_CAP = Math.max(1, Number(process.env.ZOE_HEAL_CAP ?? 3));
const HEAL_COUNT = (): string =>
  join(process.env.ZOE_HOME || join(homedir(), '.zao', 'zoe'), 'heal-count.json');

export type UnitChecker = (unit: string) => Promise<boolean>;
export type UnitRestarter = (unit: string) => Promise<void>;

const defaultIsActive: UnitChecker = async (unit) => {
  try {
    const { stdout } = await exec(`systemctl --user is-active ${unit}`);
    return stdout.trim() === 'active';
  } catch {
    return false;
  }
};

const defaultRestart: UnitRestarter = async (unit) => {
  await exec(`systemctl --user restart ${unit}`);
};

/** Pure check: which expected units are down. */
export async function checkFleetLiveness(
  units: string[] = FLEET_UNITS,
  isActive: UnitChecker = defaultIsActive,
): Promise<WatcherAlert[]> {
  const down: string[] = [];
  for (const u of units) {
    let active = false;
    try {
      active = await isActive(u);
    } catch {
      active = false;
    }
    if (!active) down.push(u);
  }
  if (down.length === 0) return [];
  return [
    {
      level: 'warn',
      code: 'unit-down',
      message: `fleet unit(s) DOWN: ${down.join(', ')} - check systemctl --user`,
    },
  ];
}

async function readHealCount(date: string): Promise<Record<string, number>> {
  try {
    const c = JSON.parse(await fs.readFile(HEAL_COUNT(), 'utf8')) as {
      date: string;
      counts: Record<string, number>;
    };
    return c.date === date ? c.counts : {};
  } catch {
    return {};
  }
}

async function writeHealCount(date: string, counts: Record<string, number>): Promise<void> {
  await fs.mkdir(join(HEAL_COUNT(), '..'), { recursive: true });
  await fs.writeFile(HEAL_COUNT(), JSON.stringify({ date, counts }));
}

/**
 * Detect + heal: restart down units (once per tick, capped per day), re-check,
 * and report what healed / what stayed down. This is what makes the fleet
 * self-repairing instead of just self-reporting.
 */
export async function healFleet(opts: {
  date: string;
  units?: string[];
  isActive?: UnitChecker;
  restart?: UnitRestarter;
}): Promise<WatcherAlert[]> {
  const units = opts.units ?? FLEET_UNITS;
  const isActive = opts.isActive ?? defaultIsActive;
  const restart = opts.restart ?? defaultRestart;
  const counts = await readHealCount(opts.date);
  const alerts: WatcherAlert[] = [];
  let mutated = false;

  for (const u of units) {
    let active = false;
    try {
      active = await isActive(u);
    } catch {
      active = false;
    }
    if (active) continue;

    if (NO_HEAL.has(u)) {
      alerts.push({ level: 'warn', code: 'unit-down', message: `${u} DOWN (not auto-restarted - core unit)` });
      continue;
    }
    if ((counts[u] ?? 0) >= RESTART_CAP) {
      alerts.push({
        level: 'warn',
        code: 'unit-down',
        message: `${u} DOWN + hit restart cap (${RESTART_CAP}/day) - likely crash-looping, needs a look`,
      });
      continue;
    }

    counts[u] = (counts[u] ?? 0) + 1;
    mutated = true;
    try {
      await restart(u);
    } catch {
      /* fall through to the re-check */
    }
    let healed = false;
    try {
      healed = await isActive(u);
    } catch {
      healed = false;
    }
    alerts.push(
      healed
        ? { level: 'info', code: 'unit-healed', message: `${u} was down - auto-restarted, now active (heal ${counts[u]}/${RESTART_CAP})` }
        : { level: 'warn', code: 'unit-down', message: `${u} DOWN - restart attempt ${counts[u]} did not bring it up` },
    );
  }

  if (mutated) await writeHealCount(opts.date, counts);
  return alerts;
}

/**
 * Proactive fleet consensus: one-line summary of fleet state.
 * Returns "FLEET: N/M up (names)" or "FLEET: N/M up - [DOWN: names]" with counts.
 * Used in morning brief for at-a-glance fleet health.
 */
export async function fleetConsensus(
  units: string[] = FLEET_UNITS,
  isActive: UnitChecker = defaultIsActive,
): Promise<string> {
  const total = units.length;
  const down: string[] = [];

  for (const u of units) {
    let active = false;
    try {
      active = await isActive(u);
    } catch {
      active = false;
    }
    if (!active) down.push(u);
  }

  const up = total - down.length;
  if (down.length === 0) {
    return `FLEET: ${up}/${total} up (${units.join(', ')})`;
  }
  return `FLEET: ${up}/${total} up - DOWN: ${down.join(', ')}`;
}
