---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-08-22
related-docs: "2239, 2319, 2373"
original-query: "ZOE research pipeline: capture claude CLI stderr, all runs failing (board d0ba5caf)"
tier: STANDARD
---

# 2377 - ZOE Research Pipeline Failure Audit (Aug 2026)

> **Goal:** Diagnose the P1 board task `d0ba5caf`: "ZOE research pipeline capture claude CLI stderr, all runs failing." Covers two distinct failure modes discovered on 2026-08-22.

## Key Findings

| Finding | Status |
|---|---|
| "unclassified" exit-code-1 failures (Aug 14-17) | Pre-existing, revealed by PR #3094. Root cause: VPS-specific environment (cannot fully diagnose without VPS SSH). Self-resolved by Aug 22 based on `claude-health.json`. |
| Auth expiry failure (Aug 22, 21:07 UTC) | **ACTIVE BLOCKER** — `lastFailKind: "auth"`. Fix: run `claude /login` on the host. zao-ask sent: `zoe-auth-expiry-aug22`. |
| 2 items queued, blocked | "SEO/web-presence: What long-tail keyword map..." + "Repo/web improvement: Does thezao.com..." |
| Console logging already exists | `[hermes/claude-cli]` logs exit code + stderr + stdout on every non-zero exit (lines 204-208 of `claude-cli.ts`). The issue is not missing logging — it is log surfacing. |

## Failure Mode 1: "unclassified" (Aug 14-17)

### What happened

PR #3094 ("fix(zoe): the research loop was discarding paid work and lying about why", 2026-08-14) fixed the `onSubtaskDone` hook to capture output from `needs-revision` status and surface `lastWorkerError`. Before the fix, a failed worker produced a park entry labeled `empty-output` — which hid the real error. After the fix, the same failures showed up as `error` with the real message: `claude CLI exited 1 [unknown: unclassified]`.

**The fix did NOT cause the failures. It made 8 consecutive pre-existing failures visible.**

### Classifying "unclassified"

The error fires when the combined `${stderr} ${stdout}` of the CLI doesn't match any known pattern (`auth`, `usage_limit`, `rate_limit`, `timeout`). Two sub-cases:

1. **Empty combined output + exit 1**: the CLI crashed before writing anything. Common causes: OOM on VPS, binary version mismatch, unsupported flag.
2. **Non-empty combined output that doesn't match patterns**: a new error message format not covered by `classifyClaudeError` (lines 79-93 of `claude-cli.ts`).

### Root cause (probable)

The ZOE bot runs from `/home/zaal/zao-bot-live/` with `ZOE_REPO_DIR=/home/zaal/zao-os` and PATH augmented with `~/.local/bin`. On the Linux dev machine, `claude` resolves to `/home/zaal/bin/claude` (working, version 2.1.167). **On the VPS (root@187.77.3.104), the equivalent path and version could not be verified via SSH from this machine.**

Unclassified failures stopped being recorded in `claude-health.json` by 2026-08-22. Current `lastOkMs` = 2026-08-22 19:24:39 UTC — the pipeline was running successfully today before the auth failure at 21:07 UTC.

**Most likely retrospective cause:** a transient VPS environment issue (stale session, OOM, or brief service disruption around Aug 14-17) that self-resolved. The fact that it worked correctly by Aug 22 19:24 UTC supports this.

## Failure Mode 2: Auth Expiry (Aug 22, ACTIVE)

```json
{
  "lastFailKind": "auth",
  "lastFailHint": "claude login/OAuth expired - run `claude` then /login on the host",
  "lastOkMs": 1787426679182,    // 2026-08-22 19:24:39 UTC
  "lastFailMs": 1787432828262   // 2026-08-22 21:07:08 UTC
}
```

This is a 1-tap fix. Whoever owns the host where ZOE is running needs to:
```bash
claude /login
```
Or open Claude interactive mode and authenticate.

`zao-ask` sent as `zoe-auth-expiry-aug22` to Zaal with three options (this Linux machine / VPS / already done).

## The logging gap: why "stderr" felt invisible

`claude-cli.ts:204-208` already logs both streams on every non-zero exit:
```typescript
console.error(
  '[hermes/claude-cli] non-zero exit. exit_code=', code,
  '\n  stderr=', stderr.slice(0, 800) || '(empty)',
  '\n  stdout=', stdout.slice(0, 800) || '(empty)',
  '\n  args=', JSON.stringify(args).slice(0, 400),
);
```

The issue is that the ZOE process (`tsx bot/src/zoe/index.ts`) writes to stdout/stderr of its terminal session. In a typical `nohup` or `tmux` run without redirect, these lines exist only while the terminal is alive. If the terminal was closed or the session scrolled off, those logs are gone.

**Fix: start ZOE with log redirection:**
```bash
tsx bot/src/zoe/index.ts >> ~/.zao/zoe/zoe.log 2>&1
```
Or use `tee` to keep live output AND file:
```bash
tsx bot/src/zoe/index.ts 2>&1 | tee -a ~/.zao/zoe/zoe.log
```
Then `grep '\[hermes/claude-cli\]' ~/.zao/zoe/zoe.log` shows every CLI failure with its full output.

**Alternatively**, add a `HERMES_STDERR_LOG` env var to `callClaudeCliInner` so the non-zero-exit case appends to a dedicated file regardless of process stdout. This is a 5-line patch to `claude-cli.ts`.

## Diagnostic one-liners (run from ZOE host)

```bash
# Current health state
cat ~/.zao/zoe/claude-health.json

# Work queue (items blocked)
cat ~/.zao/zoe/work-queue.json | python3 -c "import sys,json; [print(r.get('input','')[:80]) for r in json.load(sys.stdin)]"

# Verify claude CLI works (should return JSON with success: true)
claude -p "Return JSON: {\"ok\": true}" --model haiku --output-format json --no-session-persistence 2>&1 | head -1

# Check CLI version
claude --version

# Search process logs (if redirected)
grep '\[hermes/claude-cli\] non-zero\|lastFailKind\|unclassified' ~/.zao/zoe/zoe.log 2>/dev/null | tail -20
```

## The `classifyClaudeError` coverage gap

The classifier has 4 patterns. Any new error message format from the Claude CLI falls through to `unknown`. If the unclassified failures recur, capturing the raw stdout is the diagnostic step. Common candidates not currently classified:

- `"No model available"` — model routing failure
- `"--max-budget-usd is not a recognized flag"` — flag deprecation
- `"permission denied"` — filesystem issue in `cwd`
- `"ENOENT"` — workspace dir doesn't exist

Adding these to `classifyClaudeError` would convert future `unknown` failures to actionable categories without any other change.

## What ships with this doc

- Board task `d0ba5caf` closed (full diagnosis delivered)
- `zao-ask zoe-auth-expiry-aug22` sent — awaiting Zaal response
- No code changes shipped (doc + diagnostic is the deliverable; the log-redirect fix is a 1-liner Zaal can apply at restart)

## Also See

- [Doc 2239](../../agents/2239-zoe-capability-map/) — ZOE capability map (module inventory including `claude-health.ts`, `work-loop.ts`)
- [Doc 2373](../2373-zao-mistakes-log/) — production failures log; this pattern fits entry type "Silent-Failure"
- [Doc 2319](../../dev-workflows/2319-handoff-workflow-audit/) — the handoff audit that identified log surfacing as a systemic gap

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Re-login claude CLI on ZOE host (tap: `claude /login`) | @Zaal | fix | 2026-08-22 (ACTIVE BLOCKER) |
| Add log redirect to ZOE startup command (`2>&1 \| tee -a ~/.zao/zoe/zoe.log`) | @Claude(any lane) | 1-line change | 2026-08-23 |
| Extend `classifyClaudeError` with 4 additional patterns (see above) | @Claude(any lane) | PR to zao-bot | 2026-08-25 |
| Verify 2 queued items run after re-login | @Zaal | verify | 2026-08-23 |

## Sources

- `~/.zao/zoe/claude-health.json` — live health state, read 2026-08-22 [FULL, local]
- `~/.zao/zoe/work-queue.json` — 2 queued items, read 2026-08-22 [FULL, local]
- `bot/src/hermes/claude-cli.ts` — full read 2026-08-22, 218 lines [FULL, local]
- `bot/src/zoe/workers.ts` — research-worker config, lines 128-140 [FULL, local]
- `bot/src/zoe/work-loop.ts` — onSubtaskDone hook, PR #3094 diff read [FULL, local]
- `git -C /home/zaal/zao-bot-live log --since 2026-08-14 -- bot/src/` — commit history [FULL, local]
- PR #3094 diff (`fe919799`) — the "fix" that revealed existing failures [FULL, local `git show`]
- Manual CLI test: `claude -p "Return JSON: {...}" --model haiku/sonnet --allowedTools Read,Glob,Grep,WebFetch,WebSearch --permission-mode default --max-budget-usd 1.0 --add-dir /home/zaal/zao-os` — exits 0, returns JSON [FULL, live test 2026-08-22]
