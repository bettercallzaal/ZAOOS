/**
 * feature-ran.ts - let a feature say, once, that it actually executed.
 *
 * THE PROBLEM (measured 2026-08-08)
 * --------------------------------
 * Eight features shipped this week. Asked "which of them have run in
 * production?", seven days of journald could not answer, because five of the
 * eight (dm-build-session, build-intent, live-status, tick-lock, bus-bridge)
 * contain no logging statement at all, and the other three
 * (guardrails, memory-git, mission-control) speak only from inside a catch.
 *
 * So silence meant "no errors", never "it ran" - and a flag reading ON in
 * zoe-liveness told us the code was REACHABLE, not that it had been reached.
 * That gap is the whole of "merged is not running", and it is why a week of
 * work could not be tested.
 *
 * WHY ONCE PER PROCESS, AND NOT PER CALL
 * -------------------------------------
 * tick-lock runs every tick; a line per call would produce thousands a day and
 * become the noise nobody greps (noisy-signal-guard: a check that always fires
 * is a check nobody reads). One line the FIRST time a feature executes after a
 * boot answers the only question actually being asked - "is this thing alive?" -
 * and leaves the log quiet enough to read.
 *
 * The result is a single decisive grep:
 *   journalctl --user -u zoe-bot.service | grep '\[zoe/ran\]'
 * which lists exactly which features have executed since the bot started.
 */

/** Features that have already announced themselves this process. */
const announced = new Set<string>();

/**
 * Record that `feature` executed. Only the first call per process prints.
 *
 * Call this on the SUCCESS path, at the point where the feature has actually
 * done its work - not at import time, which would only prove the module was
 * loaded (the same mistake as a flag that proves reachability).
 */
export function featureRan(feature: string, detail?: string): void {
  if (announced.has(feature)) return;
  announced.add(feature);
  try {
    console.log(`[zoe/ran] ${feature}${detail ? ` - ${detail}` : ''}`);
  } catch {
    // Observability must never break the feature it observes. If stdout is
    // gone (a closed pipe, a detached service), the feature carries on - we
    // lose a log line, not the work. The flag is already set, so a broken
    // stdout costs one announcement, not a retry storm.
  }
}

/** Which features have announced themselves. For tests and selftests. */
export function announcedFeatures(): string[] {
  return [...announced].sort();
}

/** Test-only: forget what has been announced. */
export function resetAnnouncedForTest(): void {
  announced.clear();
}
