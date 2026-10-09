# Noisy-Signal Guard - a check that always fires is a check nobody reads

Mirror of `silent-failure-guard.md`: red while fine. The four 2026-08-07 instances: `research/dev-workflows/2649-rules-history/archive/noisy-signal-guard.md`.

**A signal must be able to reach zero, and must not fire on the expected case.** Before shipping any check, flag, count, or alert:

1. **Can it reach zero?** If a legitimate state keeps it non-zero forever, give it a way to be cleared: an acknowledgement marker (`@public-reviewed` - asserts a human looked, not that it is safe), an allowlist, or a narrower rule.
2. **Does it fire on the normal case?** Measure the firing rate against real data before trusting it. Repeated false positives = a broken instrument; fix it before acting on its output.

**When a check is loud, fix it - do not adapt to it.** Measuring a DELTA ("no new errors", "same failures as main") is legitimate only once you have established what the baseline is and why.

Before trusting any local check: are the dependencies installed (`ls node_modules | wc -l`)? Does CI agree (green CI + red local = the environment is the bug)? Is the baseline current?

Guards: this argues for checks that mean something, not fewer checks. Reporting "clean" honestly is a success.
