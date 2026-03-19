# Dependency Audit — ZAO OS

**Date:** 2026-03-19
**Tool:** npm audit
**Total vulnerabilities:** 5 (4 moderate, 1 high)

## Summary

| Severity | Count | Packages |
|----------|-------|----------|
| Critical | 0 | — |
| High | 1 | socket.io-parser |
| Moderate | 4 | next (×4 advisories), file-type (×2) |
| Low | 0 | — |

## Detailed Findings

### HIGH: socket.io-parser 4.0.0 - 4.2.5

**Advisory:** [GHSA-677m-j7p3-52f9](https://github.com/advisories/GHSA-677m-j7p3-52f9)
**Issue:** socket.io allows an unbounded number of binary attachments
**Impact:** DoS via memory exhaustion
**Fix:** `npm audit fix` (update socket.io-parser)
**Risk to ZAO OS:** Low — socket.io-parser is a transitive dependency, not directly used by the application. No WebSocket server is implemented.

### MODERATE: next 10.0.0 - 16.1.6 (4 advisories)

1. **GHSA-mq59-m269-xvcx** — null origin can bypass Server Actions CSRF checks
   - **Risk:** Medium — ZAO OS doesn't use Server Actions (uses Route Handlers)
   - **Fix:** Update to next@16.2.0

2. **GHSA-jcc7-9wpm-mj36** — null origin can bypass dev HMR websocket CSRF checks
   - **Risk:** Low — only affects development mode
   - **Fix:** Update to next@16.2.0

3. **GHSA-3x4c-7xq6-9pq8** — unbounded next/image disk cache growth
   - **Risk:** Medium — with `hostname: '**'`, attackers could fill disk with cached images
   - **Fix:** Update to next@16.2.0 + restrict image hostnames

4. **GHSA-h27x-g6w4-24gq** — unbounded postponed resume buffering can lead to DoS
   - **Risk:** Low — requires PPR (Partial Prerendering) which is not enabled
   - **Fix:** Update to next@16.2.0

5. **GHSA-ggv3-7p47-pfv8** — HTTP request smuggling in rewrites
   - **Risk:** Low — ZAO OS does not use Next.js rewrites
   - **Fix:** Update to next@16.2.0

### MODERATE: file-type 13.0.0 - 21.3.1 (2 advisories)

1. **GHSA-5v7r-6r5c-r473** — infinite loop in ASF parser on malformed input
   - **Risk:** Low — file-type is a transitive dependency via @nestjs/common
   - **Fix:** `npm audit fix`

2. **GHSA-j47w-4g3g-c36v** — ZIP decompression bomb DoS
   - **Risk:** Low — transitive dependency, not directly used
   - **Fix:** `npm audit fix`

## Recommendations

1. **Update next to 16.2.0** — fixes all 4 Next.js advisories. Requires `npm audit fix --force` (outside stated dependency range).
2. **Run `npm audit fix`** — fixes socket.io-parser and file-type without breaking changes.
3. **Restrict next/image hostnames** — reduces exposure to disk cache exhaustion advisory.
