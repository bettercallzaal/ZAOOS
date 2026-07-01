/**
 * fleet-health.ts - process/unit liveness for the watcher. The watcher.ts
 * checks dispatch cost/quality; this checks that the fleet is actually RUNNING.
 * This is the gap that let 3 Pi researchers sit dead unnoticed (2026-06-30):
 * nothing was watching liveness, only dispatch telemetry.
 *
 * Runs on the VPS inside ZOE, so it checks the VPS systemd --user units. The Pi
 * self-heals via its own start-fleet.sh keep-alive cron (fixed same day).
 */
import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';
import type { WatcherAlert } from './watcher';

const exec = promisify(execCb);

export const FLEET_UNITS = (
  process.env.ZOE_FLEET_UNITS || 'zoe-bot,zao-devz-stack,cowork-agent,farscout,zaostock-bot'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Returns true if the systemd --user unit is active. Injectable for tests. */
export type UnitChecker = (unit: string) => Promise<boolean>;

const defaultIsActive: UnitChecker = async (unit) => {
  try {
    const { stdout } = await exec(`systemctl --user is-active ${unit}`);
    return stdout.trim() === 'active';
  } catch {
    // `is-active` exits non-zero for inactive/failed units.
    return false;
  }
};

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
      active = false; // a checker that throws = treat as down (fail-safe)
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
