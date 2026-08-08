# Noisy-Signal Guard - a check that always fires is a check nobody reads

Established 2026-08-07 after hitting the same failure FOUR times in one session,
in four different disguises. `silent-failure-guard.md` covers a system that
reports success while doing nothing. This is its mirror: a system that reports
failure so often that the real failure hides inside the noise.

Both end the same way - a human stops reading the output.

## The four instances (all real, all the same day)

1. **35 false-positive `public` route labels.** The surface-map detector knew two
   auth guards and dumped everything else into `public`. The four highest-risk
   routes it flagged were all correctly guarded. A flag that fires 35 times gets
   ignored on the one that matters.
2. **A review flag that could never reach zero.** After fixing the real leaks,
   three correctly-public routes stayed flagged forever. Permanent non-zero is
   indistinguishable from broken, so `@public-reviewed` was added specifically so
   the count CAN reach zero.
3. **183 typecheck errors on a healthy repo.** `bot/node_modules` was empty on
   this machine, so 143 of them were phantom. That trained me to measure "no NEW
   errors" instead of "no errors" - and three real bugs in live source sat inside
   the noise for who knows how long, including a listener leak.
4. **A CONTRA loop over a four-note vault** would have invented collisions and
   taught its reader to skip its output. Not shipped, for exactly this reason.

## The rule (behavior-changing)

**A signal must be able to reach zero, and must not fire on the expected case.**
Before shipping any check, flag, count, or alert, answer both:

1. **Can it reach zero?** If there is a legitimate state that keeps it non-zero
   forever, the check is a permanent alarm - which is no alarm. Give it a way to
   be cleared: an explicit acknowledgement marker (`@public-reviewed`), an
   allowlist, or a narrower rule. An acknowledgement asserts *a human looked*, not
   *this is safe*.
2. **Does it fire on the normal case?** Measure the actual firing rate against
   real data before trusting it. Four false positives in a row is not bad luck, it
   is a broken instrument. Fix the instrument before acting on its output.

**And when a check is loud, do not adapt to it - fix it.** The tell that you have
already adapted is measuring a DELTA instead of an ABSOLUTE: "no new errors", "no
new warnings", "same failures as main". Those are legitimate only when you have
also established what the baseline IS and why. Otherwise the baseline is where the
real problems live.

## Before trusting any local check

- **Are the dependencies actually installed?** An empty `node_modules` produces
  hundreds of confident, entirely fake errors. Verify the toolchain resolves
  before believing anything it says (`ls node_modules | wc -l`, not just "the
  command ran").
- **Does CI agree?** CI installs cleanly from a lockfile. If CI is green and local
  is red, the environment is the bug - not the repo. Check CI before diagnosing
  the codebase.
- **Is the baseline you are diffing against current?** A baseline captured before
  an intervening merge will show phantom deltas. Re-measure against the CURRENT
  target, not a stale file.

## Guards

- This does NOT argue for fewer checks. It argues for checks that mean something
  when they fire. A quiet, accurate check beats a loud, approximate one.
- A check that legitimately has findings is not noise - noise is a check whose
  findings are mostly wrong, or that can never be resolved.
- Reporting "clean" honestly is a success, not a wasted run
  (`anti-fabrication.md` rule 4: grade to the lowest severity the evidence
  supports).

## Source

2026-08-07, four instances in one session: the surface-map detector (PR #2950),
the review flag that could not reach zero (#2953), the 183-phantom-error
typecheck that hid three real bugs (#2963), and the CONTRA loop deliberately not
scheduled (doc 2247). Sibling: `silent-failure-guard.md` (green while broken -
this is red while fine). See also `anti-fabrication.md`, `loop-evals.md`.
