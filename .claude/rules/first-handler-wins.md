# First-Handler-Wins - when two handlers read the same input, the first to claim it wins silently

The input-side twin of `silent-failure-guard.md`: the swallowing path succeeds, so nothing reports a problem and debugging starts in the innocent module. The four 2026-08-08 incidents: `research/dev-workflows/2649-rules-history/archive/first-handler-wins.md`.

**When more than one handler can match the same input, the routing must be explicit, ordered, and observable.**

1. **Specific before generic, and say so in a comment.** The generic pattern must EXCLUDE the specific vocabulary (e.g. `build:`), not merely sit after it.
2. **A handler that RETURNS owns the input - guard it at the gate**, on the branch and again inside the function it calls.
3. **"Handled" must name WHAT it handled.** Record the id of the thing answered (`replyTo`) or surfaced; never infer handled-ness from authorship, presence, or timing.
4. **Announce the claim.** The consuming handler logs once (`featureRan`), so "ran and declined" is distinguishable from "never reached".
5. **A regression test uses the VERBATIM input that failed**, not a paraphrase.

Before adding any handler that reads free-form input, ask: what else reads this input, and which of us runs first? When a feature "does nothing" with no error, start by proving it was ever REACHED. Separate handlers are fine; unordered, unguarded, silent ones are not. Ordering alone is not a fix - it needs an exclusion.
