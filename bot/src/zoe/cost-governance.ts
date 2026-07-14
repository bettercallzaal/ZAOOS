/**
 * cost-governance.ts - ZOE spend management guardrails (doc 1081 capability).
 *
 * Ensures autonomous spend stays within configured daily cap via:
 *   - Threshold alerts at 60%, 75%, 85% (Telegram, de-duped per day)
 *   - Hard-stop at 95% (pauses autonomous/background work only, never blocks Zaal's direct requests)
 *   - /budget command for spend status
 *   - Env-based cap (ZOE_DAILY_BUDGET_USD) with sensible default
 *
 * Reuses the existing cost-ledger (todaySummary) for spend tracking.
 * Does not change call-budget.ts behavior (which is separate call-count tracking).
 *
 * All messaging is fail-safe: errors never block ZOE operations.
 */

import { todaySummary, type ModelRollup } from './cost-ledger';

const DEFAULT_DAILY_CAP_USD = 10.0;

export interface SpendStatus {
  todayUsd: number;
  capUsd: number;
  percentUsed: number;
  remaining: number;
  isAtThreshold: boolean;
  thresholdLevelPercent: number | null;
  isHardStopped: boolean;
}

interface AlertState {
  day: string;
  firedAt: { [level: number]: boolean };
}

const alertState: AlertState = { day: today(), firedAt: {} };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyCap(): number {
  const raw = process.env.ZOE_DAILY_BUDGET_USD;
  if (!raw) return DEFAULT_DAILY_CAP_USD;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : DEFAULT_DAILY_CAP_USD;
}

function rollDayIfNeeded(): void {
  const currentDay = today();
  if (currentDay !== alertState.day) {
    alertState.day = currentDay;
    alertState.firedAt = {};
  }
}

/**
 * Compute current spend status. Uses cost-ledger's todaySummary for ground truth.
 */
export function getSpendStatus(): SpendStatus {
  rollDayIfNeeded();
  const cap = dailyCap();
  const summary = todaySummary();
  const spent = summary.reduce((sum, row) => sum + row.costUsd, 0);
  const pct = cap > 0 ? (spent / cap) * 100 : 0;

  // Determine which threshold (if any) has been crossed.
  const thresholds = [60, 75, 85, 95];
  let thresholdLevelPercent: number | null = null;
  for (const level of thresholds) {
    if (pct >= level) {
      thresholdLevelPercent = level;
    }
  }

  return {
    todayUsd: spent,
    capUsd: cap,
    percentUsed: pct,
    remaining: Math.max(0, cap - spent),
    isAtThreshold: thresholdLevelPercent !== null && thresholdLevelPercent < 95,
    thresholdLevelPercent,
    isHardStopped: pct >= 95,
  };
}

/**
 * Check if we should fire an alert for the given threshold level.
 * Returns true if this is the first time TODAY we've crossed that level.
 * De-duped by day: once we fire a 75% alert today, we won't fire it again today
 * even if spend fluctuates.
 */
export function shouldFireAlert(levelPercent: number): boolean {
  rollDayIfNeeded();
  if (alertState.firedAt[levelPercent]) return false;
  const status = getSpendStatus();
  if (status.percentUsed >= levelPercent) {
    alertState.firedAt[levelPercent] = true;
    return true;
  }
  return false;
}

/**
 * Check if autonomous (non-Zaal) work should be paused.
 * At 95%+ of cap, only Zaal's direct requests proceed;
 * background tasks (research batching, hourly nudges, etc.) pause.
 * Returns true to PAUSE autonomous work.
 */
export function shouldPauseAutonomousWork(): boolean {
  const status = getSpendStatus();
  return status.isHardStopped;
}

/**
 * Format spend status for human display (Telegram message).
 * Used by /budget command and threshold alerts.
 */
export function formatSpendStatus(detailed = false): string {
  const status = getSpendStatus();
  const pct = status.percentUsed.toFixed(1);
  const main = [
    `ZOE daily budget: $${status.todayUsd.toFixed(4)} / $${status.capUsd.toFixed(2)} (${pct}%)`,
    `Remaining: $${status.remaining.toFixed(4)}`,
  ];

  if (status.isHardStopped) {
    main.push('STATUS: Hard stop active (95%+ reached) - autonomous work paused');
  } else if (status.isAtThreshold) {
    main.push(`STATUS: Threshold alert (${status.thresholdLevelPercent}% reached)`);
  } else {
    main.push('STATUS: Within budget');
  }

  if (detailed) {
    const summary = todaySummary();
    if (summary.length > 0) {
      main.push('\nBreakdown by model:');
      for (const row of summary) {
        const modelShort = row.model.length > 20 ? row.model.slice(0, 17) + '...' : row.model;
        main.push(`  ${modelShort}: ${row.calls} calls, $${row.costUsd.toFixed(4)}`);
      }
    }
  }

  return main.join('\n');
}

/**
 * Test helper: reset alert state for today.
 */
export function _resetAlertState(): void {
  alertState.day = today();
  alertState.firedAt = {};
}
