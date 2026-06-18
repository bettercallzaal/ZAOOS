// ZOE daily LLM-call budget (doc 869 fix).
//
// ZOE's README + doc 604 state a "hard cap: 50 LLM calls/day (alert if
// exceeded)", but until now nothing counted — the alert never fired. This is
// the counter for the concierge turn path.
//
// Behaviour:
//   - In-process counter, resets at UTC midnight. (ZOE is a single long-lived
//     process per the systemd unit, so in-memory is sufficient; a restart
//     resets the count, which is acceptable for an alerting guard.)
//   - WARN once the cap is crossed — the documented "alert if exceeded".
//   - SOFT-BLOCK only when ZOE_CALL_CAP_ENFORCE=block is set, so the owner is
//     never silently locked out of his own assistant by default.

const DEFAULT_CAP = 50;

function cap(): number {
  const raw = Number(process.env.ZOE_DAILY_CALL_CAP ?? String(DEFAULT_CAP));
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CAP;
}

function enforceHardBlock(): boolean {
  return process.env.ZOE_CALL_CAP_ENFORCE === 'block';
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

interface BudgetState {
  day: string;
  count: number;
}

const state: BudgetState = { day: todayUtc(), count: 0 };

function rollDayIfNeeded(): void {
  const today = todayUtc();
  if (today !== state.day) {
    state.day = today;
    state.count = 0;
  }
}

export interface BudgetCheck {
  /** false only when past the cap AND hard-block enforcement is on. */
  allowed: boolean;
  /** true once this call is over the cap (the "alert if exceeded" signal). */
  warn: boolean;
  /** true exactly on the call that first crosses the cap (for a one-time notice). */
  justCrossed: boolean;
  /** calls recorded today (includes this one unless soft-blocked). */
  count: number;
  cap: number;
}

/**
 * Account for one ZOE LLM turn. Call once per turn, before the LLM call.
 * Records the call unless it is soft-blocked (in which case no call is made,
 * so it is not counted).
 */
export function checkAndRecordZoeCall(): BudgetCheck {
  rollDayIfNeeded();
  const limit = cap();
  const wouldBe = state.count + 1;
  const over = wouldBe > limit;

  if (over && enforceHardBlock()) {
    // soft-block: do not record, since no call will be made.
    return { allowed: false, warn: true, justCrossed: false, count: state.count, cap: limit };
  }

  state.count = wouldBe;
  return {
    allowed: true,
    warn: over,
    justCrossed: state.count === limit + 1,
    count: state.count,
    cap: limit,
  };
}

/** Current count without recording (for status/debug). */
export function zoeCallsToday(): { count: number; cap: number } {
  rollDayIfNeeded();
  return { count: state.count, cap: cap() };
}

/** Test helper: reset the in-process counter. */
export function _resetCallBudget(): void {
  state.day = todayUtc();
  state.count = 0;
}
