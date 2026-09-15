/**
 * provider-health.ts - deterministic state machine with hysteresis for LLM providers.
 *
 * Wraps stochastic provider calls in an explicit lifecycle:
 *   HEALTHY -> DEGRADED -> SUSPECT -> UNAVAILABLE -> RECOVERING -> HEALTHY
 *
 * RATIONALE & INDUSTRY BEST PRACTICE (2026):
 * 1. Deterministic state machines wrapping stochastic LLMs:
 *    When a provider fails (rate limit, outage, 500), cascading calls through
 *    dead providers introduces multi-second latency on every user interaction.
 * 2. Hysteresis prevents flapping:
 *    A single transient glitch should not permanently disable a provider, and a
 *    single lucky response during an ongoing outage should not immediately flood
 *    an unstable provider with high volume.
 * 3. Fast-trip for auth/quota errors:
 *    HTTP 401 (invalid/revoked token) or 402 (insufficient credits) are persistent,
 *    not transient. Retrying them 3 times wastes time. They trip directly to
 *    UNAVAILABLE.
 * 4. Exponential backoff cooldown for canary probing:
 *    Once UNAVAILABLE, a provider enters a cooldown. When the cooldown expires,
 *    it enters RECOVERING, allowing a single canary attempt. If the canary
 *    fails, cooldown doubles. If the canary succeeds consecutively (threshold
 *    hysteresis), it restores to HEALTHY.
 */

export type ProviderHealthState =
  | "HEALTHY"
  | "DEGRADED"
  | "SUSPECT"
  | "UNAVAILABLE"
  | "RECOVERING";

export interface ProviderHealthRecord {
  provider: string;
  state: ProviderHealthState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureAtMs: number | null;
  lastSuccessAtMs: number | null;
  lastFailureError: string | null;
  stateChangedAtMs: number;
  currentCooldownMs: number;
}

export interface ProviderHealthConfig {
  /** Failures to transition HEALTHY -> DEGRADED (default: 1) */
  degradedThreshold: number;
  /** Failures to transition DEGRADED -> SUSPECT (default: 2) */
  suspectThreshold: number;
  /** Failures to transition SUSPECT -> UNAVAILABLE (default: 3) */
  unavailableThreshold: number;
  /** Successes in RECOVERING needed to restore to HEALTHY (default: 2) */
  recoverySuccessThreshold: number;
  /** Base cooldown before canary allowed in RECOVERING (default: 60_000ms) */
  baseCooldownMs: number;
  /** Max cooldown cap (default: 300_000ms = 5m) */
  maxCooldownMs: number;
}

export const DEFAULT_CONFIG: ProviderHealthConfig = {
  degradedThreshold: 1,
  suspectThreshold: 2,
  unavailableThreshold: 3,
  recoverySuccessThreshold: 2,
  baseCooldownMs: 60_000,
  maxCooldownMs: 300_000,
};

/**
 * Creates an initial clean health record for a provider.
 */
export function createInitialRecord(provider: string, nowMs: number = Date.now(), baseCooldownMs: number = DEFAULT_CONFIG.baseCooldownMs): ProviderHealthRecord {
  return {
    provider,
    state: "HEALTHY",
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    totalFailures: 0,
    totalSuccesses: 0,
    lastFailureAtMs: null,
    lastSuccessAtMs: null,
    lastFailureError: null,
    stateChangedAtMs: nowMs,
    currentCooldownMs: baseCooldownMs,
  };
}

/**
 * Detects whether an error represents a fatal, non-transient condition
 * such as revoked authentication, invalid credentials, or quota exhaustion.
 */
export function isFatalProviderError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  // \b, not includes(). A bare substring test for "401"/"402" fires on any error
  // string that happens to contain those digits, and provider errors are full of
  // digits: "prompt is 1402 tokens", "request req_a402f timed out", "model
  // qwen3-401b unavailable", "timed out after 1401ms" - all four measured
  // tripping on 2026-09-15. A fatal trip skips DEGRADED and SUSPECT and takes the
  // provider out of the ladder for a full cooldown, so a false positive here is
  // the most expensive mistake this module can make: it removes a HEALTHY
  // provider on one unlucky error message, which is the exact flapping the
  // hysteresis in this file exists to prevent.
  const httpCode = /\b(401|402)\b/.test(msg);
  return (
    httpCode ||
    msg.includes("unauthorized") ||
    msg.includes("insufficient credits") ||
    msg.includes("out of credits") ||
    msg.includes("invalid api key") ||
    msg.includes("quota exceeded")
  );
}

/**
 * Pure transition on successful provider call.
 */
export function transitionOnSuccess(
  record: ProviderHealthRecord,
  nowMs: number = Date.now(),
  config: ProviderHealthConfig = DEFAULT_CONFIG,
): ProviderHealthRecord {
  const totalSuccesses = record.totalSuccesses + 1;
  const consecutiveSuccesses = record.consecutiveSuccesses + 1;
  const consecutiveFailures = 0;

  // If in RECOVERING, apply hysteresis: require recoverySuccessThreshold consecutive successes
  if (record.state === "RECOVERING") {
    if (consecutiveSuccesses >= config.recoverySuccessThreshold) {
      return {
        ...record,
        state: "HEALTHY",
        totalSuccesses,
        consecutiveSuccesses,
        consecutiveFailures,
        lastSuccessAtMs: nowMs,
        stateChangedAtMs: nowMs,
        currentCooldownMs: config.baseCooldownMs,
      };
    }
    return {
      ...record,
      totalSuccesses,
      consecutiveSuccesses,
      consecutiveFailures,
      lastSuccessAtMs: nowMs,
    };
  }

  // If currently DEGRADED or SUSPECT, a single clean call restores to HEALTHY
  if (record.state === "DEGRADED" || record.state === "SUSPECT") {
    return {
      ...record,
      state: "HEALTHY",
      totalSuccesses,
      consecutiveSuccesses,
      consecutiveFailures,
      lastSuccessAtMs: nowMs,
      stateChangedAtMs: nowMs,
      currentCooldownMs: config.baseCooldownMs,
    };
  }

  // UNAVAILABLE. A success arriving here is an in-flight call that resolved after
  // the trip, or a probe during cooldown - NOT proof the outage is over. Sending
  // it straight to HEALTHY was the hole in the hysteresis: it skipped RECOVERING
  // and the recoverySuccessThreshold entirely, so one lucky response during an
  // ongoing outage restored full traffic immediately, which is precisely the
  // flapping this module is named for. It enters RECOVERING instead and still has
  // to earn HEALTHY the same way every other recovery does.
  if (record.state === "UNAVAILABLE") {
    if (consecutiveSuccesses >= config.recoverySuccessThreshold) {
      return {
        ...record,
        state: "HEALTHY",
        totalSuccesses,
        consecutiveSuccesses,
        consecutiveFailures,
        lastSuccessAtMs: nowMs,
        stateChangedAtMs: nowMs,
        currentCooldownMs: config.baseCooldownMs,
      };
    }
    return {
      ...record,
      state: "RECOVERING",
      totalSuccesses,
      consecutiveSuccesses,
      consecutiveFailures,
      lastSuccessAtMs: nowMs,
      stateChangedAtMs: nowMs,
    };
  }

  // Already HEALTHY.
  return {
    ...record,
    state: record.state,
    totalSuccesses,
    consecutiveSuccesses,
    consecutiveFailures,
    lastSuccessAtMs: nowMs,
    stateChangedAtMs: record.stateChangedAtMs,
    currentCooldownMs: record.currentCooldownMs,
  };
}

/**
 * Pure transition on failed provider call.
 */
export function transitionOnFailure(
  record: ProviderHealthRecord,
  error: unknown,
  nowMs: number = Date.now(),
  config: ProviderHealthConfig = DEFAULT_CONFIG,
): ProviderHealthRecord {
  const errMsg = error instanceof Error ? error.message : String(error);
  const totalFailures = record.totalFailures + 1;
  const consecutiveFailures = record.consecutiveFailures + 1;
  const consecutiveSuccesses = 0;
  const fatal = isFatalProviderError(error);

  // Fatal auth/quota error immediately trips to UNAVAILABLE
  if (fatal) {
    const isAlreadyUnavailable = record.state === "UNAVAILABLE" || record.state === "RECOVERING";
    return {
      ...record,
      state: "UNAVAILABLE",
      totalFailures,
      consecutiveFailures,
      consecutiveSuccesses,
      lastFailureAtMs: nowMs,
      lastFailureError: errMsg,
      stateChangedAtMs: nowMs,
      currentCooldownMs: isAlreadyUnavailable
        ? Math.min(record.currentCooldownMs * 2, config.maxCooldownMs)
        : config.baseCooldownMs,
    };
  }

  // Failure while in RECOVERING immediately trips back to UNAVAILABLE with exponential cooldown backoff
  if (record.state === "RECOVERING") {
    return {
      ...record,
      state: "UNAVAILABLE",
      totalFailures,
      consecutiveFailures,
      consecutiveSuccesses,
      lastFailureAtMs: nowMs,
      lastFailureError: errMsg,
      stateChangedAtMs: nowMs,
      currentCooldownMs: Math.min(record.currentCooldownMs * 2, config.maxCooldownMs),
    };
  }

  // If already UNAVAILABLE, update failure stats and back off
  if (record.state === "UNAVAILABLE") {
    return {
      ...record,
      totalFailures,
      consecutiveFailures,
      consecutiveSuccesses,
      lastFailureAtMs: nowMs,
      lastFailureError: errMsg,
      currentCooldownMs: Math.min(record.currentCooldownMs * 2, config.maxCooldownMs),
    };
  }

  // Threshold-based transitions: HEALTHY -> DEGRADED -> SUSPECT -> UNAVAILABLE
  let nextState: ProviderHealthState = record.state;
  if (consecutiveFailures >= config.unavailableThreshold) {
    nextState = "UNAVAILABLE";
  } else if (consecutiveFailures >= config.suspectThreshold) {
    nextState = "SUSPECT";
  } else if (consecutiveFailures >= config.degradedThreshold) {
    nextState = "DEGRADED";
  }

  const stateChanged = nextState !== record.state;
  return {
    ...record,
    state: nextState,
    totalFailures,
    consecutiveFailures,
    consecutiveSuccesses,
    lastFailureAtMs: nowMs,
    lastFailureError: errMsg,
    stateChangedAtMs: stateChanged ? nowMs : record.stateChangedAtMs,
    currentCooldownMs: nextState === "UNAVAILABLE" ? config.baseCooldownMs : record.currentCooldownMs,
  };
}

/**
 * Checks if a provider is eligible to receive a call.
 * Handles automatic transition from UNAVAILABLE to RECOVERING when cooldown has elapsed.
 */
export function checkProviderLiveness(
  record: ProviderHealthRecord,
  nowMs: number = Date.now(),
): { isAvailable: boolean; effectiveRecord: ProviderHealthRecord } {
  if (record.state === "HEALTHY" || record.state === "DEGRADED" || record.state === "SUSPECT") {
    return { isAvailable: true, effectiveRecord: record };
  }

  if (record.state === "RECOVERING") {
    return { isAvailable: true, effectiveRecord: record };
  }

  // record.state === "UNAVAILABLE"
  const elapsed = nowMs - record.stateChangedAtMs;
  if (elapsed >= record.currentCooldownMs) {
    // Cooldown elapsed: transition to RECOVERING to allow canary
    const recoveringRecord: ProviderHealthRecord = {
      ...record,
      state: "RECOVERING",
      consecutiveSuccesses: 0,
      stateChangedAtMs: nowMs,
    };
    return { isAvailable: true, effectiveRecord: recoveringRecord };
  }

  // Still within cooldown window
  return { isAvailable: false, effectiveRecord: record };
}

// ---------------------------------------------------------------------------
// In-Memory Global Health Registry
// ---------------------------------------------------------------------------

const providerRegistry = new Map<string, ProviderHealthRecord>();

/**
 * Get or initialize the health record for a provider.
 */
export function getProviderHealth(provider: string, nowMs: number = Date.now()): ProviderHealthRecord {
  const existing = providerRegistry.get(provider);
  if (!existing) {
    const fresh = createInitialRecord(provider, nowMs);
    providerRegistry.set(provider, fresh);
    return fresh;
  }
  const { effectiveRecord } = checkProviderLiveness(existing, nowMs);
  if (effectiveRecord !== existing) {
    providerRegistry.set(provider, effectiveRecord);
  }
  return effectiveRecord;
}

/**
 * Record a successful call to a provider.
 */
export function recordProviderSuccess(
  provider: string,
  nowMs: number = Date.now(),
  config: ProviderHealthConfig = DEFAULT_CONFIG,
): ProviderHealthRecord {
  const cur = getProviderHealth(provider, nowMs);
  const next = transitionOnSuccess(cur, nowMs, config);
  providerRegistry.set(provider, next);
  return next;
}

/**
 * Record a failed call to a provider.
 */
export function recordProviderFailure(
  provider: string,
  error: unknown,
  nowMs: number = Date.now(),
  config: ProviderHealthConfig = DEFAULT_CONFIG,
): ProviderHealthRecord {
  const cur = getProviderHealth(provider, nowMs);
  const next = transitionOnFailure(cur, error, nowMs, config);
  providerRegistry.set(provider, next);
  return next;
}

/**
 * Check if a provider is currently available for routing.
 */
export function isProviderAvailableForCall(provider: string, nowMs: number = Date.now()): boolean {
  const record = getProviderHealth(provider, nowMs);
  return record.state !== "UNAVAILABLE";
}

/**
 * Filter and sort providers: available providers come first;
 * unavailable providers with remaining cooldown are deprioritized or excluded.
 *
 * Guard: If ALL providers are UNAVAILABLE, returns all providers anyway as
 * a last-resort attempt (prevents total fleet deadlock).
 */
export function prioritizeProviders(providers: string[], nowMs: number = Date.now()): string[] {
  const available: string[] = [];
  const unavailable: string[] = [];

  for (const p of providers) {
    if (isProviderAvailableForCall(p, nowMs)) {
      available.push(p);
    } else {
      unavailable.push(p);
    }
  }

  // If at least one is available, route only through available
  if (available.length > 0) {
    return available;
  }

  // All providers are unavailable: return all as last-resort fallback
  return providers;
}

/**
 * Reset health records (used in tests or administrative resets).
 */
export function resetProviderHealth(provider?: string): void {
  if (provider) {
    providerRegistry.delete(provider);
  } else {
    providerRegistry.clear();
  }
}

/**
 * Return a snapshot of all provider health records.
 */
export function getAllProviderHealth(nowMs: number = Date.now()): Record<string, ProviderHealthRecord> {
  const result: Record<string, ProviderHealthRecord> = {};
  for (const [key] of providerRegistry) {
    result[key] = getProviderHealth(key, nowMs);
  }
  return result;
}
