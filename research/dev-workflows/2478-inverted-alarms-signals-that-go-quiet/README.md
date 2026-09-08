---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-08
superseded-by:
related-docs: "2450, 2475, 2387, 2093, 2264"
original-query: "Write ZAO research doc 2478 on INVERTED ALARMS (a signal that goes quiet exactly when the thing it watches goes wrong - not merely blind, actively suppressed by the failure it should report), grounded in six instances measured 2026-09-07/08 (fleet-spend-guard.sh, the zao-research dedup grep, zao-wall.py --release, a pgrep self-match, a hub returning 200 with an empty array, and the lane-grill awk counter). Re-verify each instance still holds before publishing. Then audit every check, monitor, guard and health endpoint in the estate (~/bin locally and on the VPS, ZAOOS API health endpoints, GitHub Actions that detect rather than build) and classify each: LOUDER, QUIETER (inverted - fix), or CANNOT TELL. State two design rules: fail loudly when you cannot measure (emit UNKNOWN, never a default of healthy), and alarm on a floor with runway, not at zero."
tier: DEEP
---

# 2478 — Inverted Alarms: Signals That Go Quiet Exactly When They Should Shout

> **Goal:** Define the class, re-verify the six instances that surfaced it in one session, and audit every check, monitor, guard and health endpoint reachable from this estate for the same shape — then say honestly which of them are LOUDER, QUIETER, or unmeasured.

## Key Decisions

| # | Decision | Grounded in |
|---|---|---|
| 1 | **Ship `fleet-spend-guard.sh`'s already-written fix as-is; it is correct and live.** It now tracks the TANK (`total_credits - total_usage`) against a `$5` floor as well as the RATE (`usage_daily`), and both a failed rate-read and a failed balance-read are treated as `UNKNOWN`, never as healthy. | Read on the VPS today: `~/bin/fleet-spend-guard.sh`, mtime 2026-09-08 10:38. Balance recovered to `$9.869` (`total_credits=100`, `total_usage=90.131049664`) since the `-$0.12` measurement. |
| 2 | **Merge the still-open `fleet-spend-guard.sh.proposed` refinement: alert once per crossing, not every 20 minutes.** The live version re-sends the low-balance Telegram message on every run while the balance stays under floor; the proposed version adds a `$HOME/.zao/openrouter-balance.alerted` flag so it fires once and clears once the balance recovers. Both are correct on UNKNOWN; only the alert cadence differs. | Diff of `fleet-spend-guard.sh` vs `fleet-spend-guard.sh.proposed` on the VPS, both dated 2026-09-08. |
| 3 | **Fix `zao-wall.py --release`'s print statement — it still names the wrong destination today.** `set_lane(cid, None)` only deletes `metadata.lane`; it never touches `metadata.route`. A card whose route is `prep` (or anything but `agent`/`human`) lands back in the `unrouted` bucket, not `unclaimed` — but line 212 unconditionally prints `"released to unclaimed"`. Fix: have `--release` read the card's route after the patch and print the bucket it actually landed in. | `scripts/agents/zao-wall.py` lines 209-213, read today. Card `ef98e806` — the exact card the original session flagged — is still sitting under `route=prep` right now, confirmed via `zao-wall.py --json`. |
| 4 | **Give `estate-health.yml`'s ratchet a fifth severity: `crashed`, scored above `fail`.** Today a check that throws is caught by `runOne()` and converted to `{status:'skipped', findings:[]}` — zero findings means zero contribution to `summary.fail`, so a check that cannot run scores exactly as well as a check that ran clean. The PR comment does show a `SKIP` badge, but the numeric ratchet that actually blocks the merge cannot see it. | `tools/estate-control-plane/run-checks.ts` lines 45-56 and 106-114, read today. |
| 5 | **Do not build anything new for the "pgrep matches its own command line" class; there is nothing live to fix.** A fresh grep of every `pgrep`/`ps` invocation on the mac and the VPS today found none that search on a pattern their own invoking process would also match. The estate has already hardened the *adjacent* pgrep pitfall (POSIX pgrep excludes its own ancestor shell, so a naive check under-reports) — `lane-send` and `zao-sweep` both read `ps` instead of `pgrep -f` for exactly this reason. State the self-match risk as a standing design rule (below) rather than a patch. | `grep -rn pgrep ~/bin/ ` (mac) and over ssh on the VPS, today; `lane-send` lines 82-95. |
| 6 | **Adopt `loops-report.sh`'s delivery-check pattern as the estate default for every script that pushes a Telegram alert.** It reads the literal Telegram API response body for `"ok":true` rather than trusting `curl`'s exit code (`curl -s` without `-f` returns 0 on a 400/403). Three of the scripts audited below (`fleet-health.sh`, `fleet-spend-guard.sh`, `cost-of-pass-summary.sh --tg`) still trust the exit code alone. | `~/bin/loops-report.sh` on the VPS, read today, with its own comment: *"A delivery check that cannot fail is not a check."* |

## The class, defined

A **signal that goes quiet exactly when the thing it watches goes wrong.** Not merely blind — a blind monitor just doesn't look. This is a monitor that looks, reads a real number, and reports that number as evidence of health, when the same failure that broke the watched thing is the reason the number looks good. Silence (or a green light) reads as health. It is worse than no monitor at all, because a missing monitor prompts someone to ask "how do we know this is fine?" — this kind produces a false answer to that exact question.

## The six instances, re-verified 2026-09-08

All six were measured and verified in the 2026-09-07/08 session that spawned this doc. Re-checked today, in order:

### 1. `fleet-spend-guard.sh` — FIXED since measurement (was QUIETER, now LOUDER)

**Original measurement:** it read `usage_daily` from `GET https://openrouter.ai/api/v1/key` against a `$5/day` cap. At the same instant, the OpenRouter account balance was **`-$0.12` (overdrawn)** while `usage_daily` read **`$0.0113` — 0.2% of the cap**, reporting perfectly healthy. Mechanism: an empty account means nothing can run; nothing running means `usage_daily` falls; a falling `usage_daily` reads as calmer. The emptier the tank, the quieter the alarm. A second defect compounded it: the curl pipeline printed `-1` on any read failure, and `-1 >= 0` is false, so the guard's own `d>=0 and d>cap` test took the *under-cap* branch on a failed read — an unreachable API didn't just read as healthy, it **un-paused the fleet and announced a false recovery** ("Fleet spend back under cap").

**Today:** already fixed and live (`~/bin/fleet-spend-guard.sh` on the VPS, mtime 2026-09-08 10:38, well ahead of when this doc started). It now checks both the RATE (`usage_daily` vs `$5/day` cap) and the TANK (`total_credits - total_usage` vs a `$5` floor). A failed read on either metric sets the guard's own reported state to `UNKNOWN`, sends a Telegram alert saying so explicitly, and **never lifts the pause flag on a failed read** — defect 2 above is closed. Balance today: `total_credits=100`, `total_usage=90.131049664`, **balance `$9.869`** — recovered well above the `$5` floor. A second version, `fleet-spend-guard.sh.proposed` (mtime 11:01, newer than the live file), adds an alert-dedup flag so the low-balance message fires once per crossing instead of every 20-minute tick; it is not yet installed. See Key Decision 2.

### 2. The zao-research dedup grep — FIXED (doc 2475)

`grep -ri "<kw>" research/*/README.md` was one level deep and matched **22 files of 2,313** — the 22 topic index pages, never a single actual doc. Every "no existing research found" this skill ever returned was a search of 22 files; measured in full in [`dev-workflows/2475-research-system-internal-audit`](../2475-research-system-internal-audit/). **Still fixed today:** `zao-research-index` is FTS5 over the whole corpus and answered every query in this doc's own Step 2 dedup check in well under a second.

### 3. `zao-wall.py --release` reporting the wrong destination — STILL BROKEN

`--release ef98e806` printed `"released to unclaimed: ef98e806"`; the card actually landed in `UNROUTED/prep`, a bucket no view showed at the time. **Re-verified today, still present.** `set_lane()` (`scripts/agents/zao-wall.py` line 137-138) only pops `metadata.lane`; it never sets or clears `metadata.route`. The print statement at line 212 is unconditional. Live proof: `zao-wall.py --json` today shows `ef98e806-b6f9-4388-ad50-7de76aa7da8b` ("Teach ZOL to create a tokenless empire...") still sitting under `unrouted.prep`, exactly where the original measurement found it — the exact card, still stuck, days later.

What *has* changed: the general visibility bug (no `unrouted` bucket existed at all, so 362 of 569 open cards — 63% — were invisible from every view) was fixed 2026-09-07, per the `bucket()` docstring. That fix is a different code path from `--release`'s print statement and did not touch it. Today's live counts: `open=581, on_wall=84, unclaimed=157, needs_zaal=328, unrouted=12` (`none: 11, prep: 1` — the one being `ef98e806` itself). The backlog this class of bug fed has been worked down; the bug that mislabels where a released card goes has not been touched.

### 4. A `pgrep` matching its own command line — class confirmed, no live instance found today

Described as: a health check that `pgrep -f`s a pattern that also appears in its own invoking command line always finds itself, never (or always, depending on framing) the process it means to check. This is a real and common shell-scripting failure mode. A fresh, estate-wide grep today (`~/bin/*` on the mac, `~/bin/*.sh` and `*.py` on the VPS) found no script currently doing this — the only two `pgrep` users left are `watchdog.sh` (VPS, uses distinct patterns per bot specifically to avoid one bot's process string colliding with another's, per its own comment) and `zj`/`lane-send` (mac, both use `pgrep -P <pid>` for parent-child walks, immune to string self-match). The *adjacent* pgrep pitfall — POSIX `pgrep`/`pkill` never report the invoking process **or its parent shell** — was hit for real and is already fixed: `lane-send` documents (lines 82-95) that a naive `pgrep -f` under-reported a lane's live children because the lane's own pane shell is an ancestor pgrep cannot see, and switched to reading `ps` instead. Same family of instrument blind-spot near self/ancestry, opposite direction (misses a real child vs. falsely matches a stray). Recorded here as a standing design rule rather than a specific fix, per Key Decision 5.

### 5. A hub answering HTTP 200 with an empty array — the spec was wrong, the shipped code was already right

`hub.pinata.cloud/v1/castsByMention` answers **HTTP 200** with `{"messages":[],"nextPageToken":"..."}` — forever, for a FID that has real mentions. Measured against it: `haatz.quilibrium.com` (also 200) returned 13 real mention messages for the same window, and `hub-api.neynar.com` returned 402 (keyed). Implementing the spec's recommended endpoint verbatim gives 200s forever, zero mentions, and the conclusion "ZOL has no mentions" — the same silent-empty shape that produced ZOL's 114 fabricated casts, where a swallowed error was indistinguishable from a quiet source. **Verified today via [`farcaster/2387-zol-mention-polling-snapchain-spec`](../../farcaster/2387-zol-mention-polling-snapchain-spec/):** the correction is already merged into that doc (commit `07a33a47`, 2026-09-07). The shipped code, `zol-reply.js`, was never wrong — it already uses `haatz.quilibrium.com` plus keyed Neynar, having dropped pinata as stale in commit `d64b6c5` before the spec doc was even written. Only the *documentation's* recommended endpoint was wrong; the endpoint path and response shape it describes are otherwise correct.

### 6. The lane-grill counter (`zao-status-refresh`) — FIXED same night, in production

`awk 'END {print n+0}'` prints `0` whether it read fifteen status files and found no open questions, or read zero files because the directory moved. **Verified today:** [zaal-dotfiles commit `bfea3a1`](https://github.com/bettercallzaal/zaal-dotfiles) (PR #116, merged 2026-09-08 06:40) counts files before counting matches and emits nothing — skipping the segment — unless at least one file was actually read. The commit message names its own near-miss: shipped once, silently reverted out of the live `~/bin` symlink target by a `git checkout main` minutes later, and only caught because the segment read `0` when the true count was `115` — a second, adjacent instance of "green (or blank) while broken" in the same 20 minutes.

## Two design rules, earned tonight

**Fail loudly when you cannot measure.** An unreadable value must never fall through to "healthy." Emit `UNKNOWN` (or skip the segment, or `CANNOT ASSESS`) — never a default that reads as a clean bill of health. `zao-loop-health` (VPS) already states this as policy in its own docstring: *"If the output directory is missing, or no loop has ever produced anything, that is reported as CANNOT ASSESS — never as healthy."* `fleet-spend-guard.sh`'s live fix and `zao-lane-watch-all`'s `WATCH DIED` / `WATCH DEGRADED` states follow the same rule. `estate-health.yml`'s ratchet (Key Decision 4) does not yet.

**Alarm on a floor with runway, not at zero.** The fixed spend guard uses a `$5` floor rather than `$0`, so the alarm fires while there is still room to act — today's `-$0.12` would have fired days earlier had the floor existed then. A threshold at the failure point itself is not an alarm; it is a post-mortem.

## The audit

For every check, monitor, guard and health endpoint reached in this pass: **if the thing it watches failed right now, would this get LOUDER or QUIETER?** 27 checks audited across five surfaces (mac, VPS, ZAOOS API, ZAOOS GitHub Actions, ZAOstock GitHub Actions). Totals: **18 LOUDER, 6 QUIETER, 3 CANNOT TELL.**

### Local mac (`~/bin`) — all 6 LOUDER

| Check | Verdict | Why |
|---|---|---|
| `zao-lane-watch` | LOUDER | Line 126: explicitly prints `CANNOT SEE LANES - not reporting all-clear` rather than defaulting to a clean bill of health when it cannot enumerate lanes. |
| `zao-lane-health` | LOUDER | `trust_map()` returns `None` (not `{}`) on any read failure, with the comment *"a check that cannot run is not a pass."* A missing trust key is treated as untrusted, not trusted. |
| `zao-status-refresh` (lane-grill segment) | LOUDER | Fixed today (instance 6 above): counts files first, skips the segment on zero files rather than printing `0`. |
| `zao-sweep` | LOUDER | `live_lanes()` explicitly filters out `"no live claude"`/`"not a lane"` responses rather than assuming every tmux session is a real lane; relies on `lane-send`'s already-fixed `ps`-based check. |
| `zao-lane-watch-all` | LOUDER | Falls back from `zao-lanes --json` to raw `tmux list-sessions` on failure rather than returning `[]` (which the code comments explicitly say "would read as 'no lanes'"); top-level exception handler prints `WATCH DIED` and exits 1 rather than exiting clean. |
| `zao-research-health` | LOUDER (mostly) | Its purpose is exactly this audit's meta-tool: reports collisions and citation-ranked staleness rather than silently passing. One minor internal `except Exception: pass` in its citation-counting loop (line 88) under-counts on a single unreadable file — low-stakes, not one of its headline verdicts. |

### VPS crontab + `~/bin` — 10 audited: 3 LOUDER, 4 QUIETER, 2 CANNOT TELL, 1 fixed-today (counted separately above)

Current crontab (`crontab -l`, read today) has 15 active lines plus 4 explicitly paused (`loops-keepalive-failover.sh`, `ollama-keepwarm.sh`, `fleet-brain-check.sh`, `loop-watchdog.py` — all commented `#[paused 2026-08-23 fleet audit: ...]`, not evaluated here since they do not run).

| Check | Verdict | Why |
|---|---|---|
| `fleet-spend-guard.sh` | **LOUDER** (fixed today) | See instance 1. |
| `fleet-health.sh` | **QUIETER** | Sends a Telegram message unconditionally via bare `curl -s ... >/dev/null`; never checks the response body. If `systemctl --user is-active` itself errors, or the Telegram POST is rejected (bad token, rate limit), nothing distinguishes that from a normal successful run — no distinct signal exists for "this check didn't run" versus "everything reported active." |
| `disk-guard.sh` | LOUDER | Checks disk% *before and after* running the real cleanup (`disk-hygiene.sh`), and only escalates to `zao-status` if usage is still `>=90%` after the full cleanup — genuinely earns its silence, per its own header, which documents fixing exactly this class of bug on 2026-07-31 (previously alerted "still 90% after cleanup" forever because `git worktree prune` alone never freed the disk). |
| `disk-hygiene.sh` | CANNOT TELL | Each cleanup step (`docker builder prune`, `npm cache clean`, `apt-get clean`, `journalctl --vacuum-time`) is logged only on success via `&&`; a failing step is invisible in its own log. Functionally mitigated because `disk-guard.sh` re-measures disk% independently afterward regardless of which sub-steps ran — the system-level alarm stays loud even if this tool's internal log does not. |
| `zao-loop-health` | LOUDER | Exemplary: distinguishes `PRODUCING` / `STALLED` / `NEVER PRODUCED` / `CANNOT ASSESS`, and explicitly refuses to report clean when `tmux` returns nothing or the output directory has never existed. |
| `stall-tripwire.py` | CANNOT TELL | The script itself fails reasonably loud internally (`"no tracker creds"` + `exit 1` if Supabase env vars are missing), but its crontab line is `0 13 * * * STALL_DAYS=3 $HOME/bin/stall-tripwire.py >/dev/null 2>&1` — both stdout and stderr are discarded, and per [`agents/2450-zao-bot-estate`](../../agents/2450-zao-bot-estate/), nothing watches cron exit codes on this box. A crash today would be silent to Zaal even though the script "failed loud" in the only sense that reaches nobody. |
| `provider-health.sh` | **QUIETER** | Explicit comment: `# Exit 0 always (no-op if all fail)`. If `claude`, `codex`, `openrouter` and `ollama` all fail their checks simultaneously, the script still exits 0 and writes `BEST_PROVIDER=none` to the state file — a total outage of every provider is not distinguishable, by exit code, from a normal successful probe. Safe only if every consumer explicitly checks for the string `none`; a consumer trusting the exit code alone would not notice a full outage. |
| `loops-report.sh` | LOUDER | See Key Decision 6 — the estate's own reference example for "verify delivery, don't trust the transport." |
| `cost-of-pass-summary.sh` | **QUIETER** | `[ -f "$LEDGER" ] || { echo "no ledger yet"; exit 0; }`, and the crontab line discards all output (`>/dev/null 2>&1`). If the process that writes the ledger silently stops writing (a broken `loop-agent.sh` cost-logging call, say), a day with zero real logging is indistinguishable from a day with zero real spend. |
| `fleet` (dashboard) | CANNOT TELL | Pull-only, not an autonomous alarm, but its "SPEND today: \$X / \$5 cap" line reads the same ledger as `cost-of-pass-summary.sh` above — if that ledger silently stops updating, `fleet` would keep showing a low, calm spend number. |

### ZAOOS API health endpoints — 3 audited: 2 LOUDER, 1 QUIETER

| Endpoint | Verdict | Why |
|---|---|---|
| `GET /api/cron/health-snapshot` | LOUDER | Propagates the Supabase insert error as a `500` with the message in the body; auth failure is a clean `401`. No soft-fail path. |
| `GET /api/agents/health` | LOUDER | Pre-flight checks (Privy, wallet IDs, 0x key, Supabase `agent_config`, cron secret, Farcaster signer) each set `ok:false` with a specific `detail` string on failure; the summary is `allOk = passing === total`, so any single failed check flips the whole response to `not_ready`. |
| `GET /api/bots/status` | **QUIETER** | Proxies the cowork board's `/api/v1/bots`. A non-2xx response correctly returns `502` with an `error` field (LOUDER). But if the upstream answers `200` with a body where `data.bots` is not an array (malformed, truncated, or a shape change upstream), the route falls back to `bots: []` **with no `error` field and the default `200` status** — a live-but-broken upstream and a legitimately empty bot fleet render identically to the `/overview` Bots tab. |

### GitHub Actions in ZAOOS — 6 audited: 4 LOUDER, 2 QUIETER

| Workflow | Verdict | Why |
|---|---|---|
| `doc-collision-guard.yml` | LOUDER | Fails closed by design: a `git diff`/`git ls-tree` error aborts the job (`\|\| { echo "::error..."; exit 1; }`) rather than being read as "nothing to check" on empty output — its own header documents exactly why, citing a prior guard (docs-automerge.yml's collision check) that only ever *declined to auto-merge* on a collision rather than failing the PR, and never actually stopped one from landing (30 -> 169 collisions between 2026-05-18 and 2026-07-20). |
| `docs-automerge.yml` (PR classifier) | LOUDER | Uses `--paginate` on the PR-files endpoint specifically because the non-paginated call silently truncates at 100 files, and asserts `seen == changed_files`, holding the PR for review on any mismatch rather than merging off a partial file list. |
| `ci.yml` | LOUDER (overall) | Added a daily schedule + `workflow_dispatch` specifically because GitHub does not run `push` workflows for commits made with the automatic `GITHUB_TOKEN` — meaning every bot-merged commit from `docs-automerge.yml` previously landed on `main` with **zero** CI runs between it and the next human-triggered one (measured 2026-08-12: PRs #3059/#3062/#3064/#3066 merged with zero runs, while a red commit, `f90e3ce`, sat undetected). The one documented carve-out, `continue-on-error: true` on the changed-files lint step, is a deliberate low-severity exception — typecheck, test, bot-test and build remain hard gates. |
| `estate-health.yml` — sweep job | LOUDER | An uncaught exception in `run-checks.ts`'s own `main()` (as opposed to an individual check) hits the top-level `.catch` and calls `process.exit(2)`, failing the step and the job — visibly red in Actions. |
| `estate-health.yml` — PR guardrail ratchet | **QUIETER** | See Key Decision 4. `runOne()` converts any individual check's exception into `{status:'skipped', findings:[]}`. `scoreAndSummarize` only counts `findings`, so a crashed check contributes zero to `summary.fail` — identical, numerically, to a check that ran and found nothing wrong. The ratchet (`summary.fail > maxFails`) cannot see the difference, even though the PR comment does render a `SKIP` badge for a human who reads it closely. Supersedes the `estate-health.yml` finding in [`security/2093-silent-failure-sweep`](../../security/2093-silent-failure-sweep/) (finding 6, "/tmp file writes not verified"), which described an earlier version of this workflow before it was rewritten into the current control-plane form; that specific concern no longer applies to the file that exists today. |
| `research-index.yml` (CI-owned backfill) | **QUIETER** | The commit-back step ends `git push \|\| echo "::warning::index backfill could not push (branch protection?) - nightly backfill will catch it"` — a push failure (a changed branch-protection rule, an auth problem) degrades to a warning and the job still exits `0`/green. A silently-stopped backfill and a genuinely-complete index render identically in the Actions tab. |

### ZAOstock / wavewarz — 2 audited: 2 LOUDER; no API health endpoint exists to audit

Added after the first pass above disclosed this as an open gap. `ZAODEVZ/ZAOstock` is the only WaveWarZ-family repo with any GitHub Actions at all — `bettercallzaal/wwbase`, `wavewarzapp` and `wavewarz-overlay` each return a 404 on `.github/workflows`, confirmed today, not assumed. ZAOstock's own `src/app/api/` has no `health` or `status`-named route (`admin`, `apply`, `artist-profile`, `cron/deactivate-inactive`, `cypher`, `events`, `musicians`, `suggestions`, `team` — checked by listing, not guessed), so there is no `/api/*health*` endpoint in this family to classify.

| Workflow | Verdict | Why |
|---|---|---|
| [`uptime.yml`](https://github.com/ZAODEVZ/ZAOstock/blob/main/.github/workflows/uptime.yml) | LOUDER (exemplar) | Written explicitly against this exact failure class — its own header: *"A wrong-but-reachable database answers 200 with an empty array. That is the exact shape of the failure this is meant to catch, so an empty roster counts as down."* Asserts `/api/events` returns HTTP 200 **and** a non-empty `events` array; on failure it opens a de-duplicated GitHub issue (checks for an existing open one by title before filing another) rather than re-notifying every 10 minutes. States its own limits in the same file rather than implying more coverage than it has: best-effort cron, GitHub disables a quiet scheduled workflow after 60 days of no commits, and an opened issue is "not a pager." |
| [`ci.yml`](https://github.com/ZAODEVZ/ZAOstock/blob/main/.github/workflows/ci.yml) | LOUDER | Plain `typecheck` / `lint` / `test` / `build` gate on every PR and push to `main`, no `\|\| true` anywhere in the file. |

This closes the scope gap named in the original pass; no residual CANNOT TELL remains for ZAOstock/wavewarz as a result.

## Also See

- [`agents/2450-zao-bot-estate`](../../agents/2450-zao-bot-estate/) — the bot/cron inventory this audit builds on; its top recommendation (adopt `healthchecks.io` as a dead-man's switch on all 9 mac crons) is the structural fix for the "nothing watches cron exit codes" gap found in `stall-tripwire.py` and `cost-of-pass-summary.sh` above.
- [`dev-workflows/2475-research-system-internal-audit`](../2475-research-system-internal-audit/) — full measurement of instance 2 (the dedup grep).
- [`farcaster/2387-zol-mention-polling-snapchain-spec`](../../farcaster/2387-zol-mention-polling-snapchain-spec/) — full measurement of instance 5 (the hub 200-with-empty-array correction).
- [`security/2093-silent-failure-sweep`](../../security/2093-silent-failure-sweep/) — prior ZAOOS silent-failure sweep (2026-07-27); the `estate-health.yml` finding there is superseded by this doc's Key Decision 4 (the workflow was rewritten since).
- [`infrastructure/2264-mac-offline-always-on-migration`](../../infrastructure/2264-mac-offline-always-on-migration/) — an earlier OpenRouter overdraw measurement (`-$0.21`), same class as instance 1, different date.
- `.claude/rules/silent-failure-guard.md` — the durable rule this whole family of finding feeds.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Install `fleet-spend-guard.sh.proposed`'s alert-dedup flag over the current live VPS script — shipped when the low-balance Telegram message fires once per crossing instead of every 20 minutes | Zaal | Config (VPS `~/bin`) | 2026-09-12 |
| Fix `zao-wall.py --release` to report the bucket the card actually lands in (read `route` after the patch, print `unclaimed` / `unrouted:<route>` accordingly) — shipped when running `--release` on a `route=prep` card prints "released to unrouted (prep)" and `ef98e806` no longer sits under `route=prep` after a real release | Zaal | PR to ZAOOS | 2026-09-12 |
| Add a `crashed` severity to `tools/estate-control-plane/run-checks.ts`'s `runOne()`, scored at or above `fail`, so a thrown check trips the PR ratchet instead of scoring as clean — shipped when a check deliberately made to throw fails a test PR's ratchet | Zaal | PR to ZAOOS | 2026-09-15 |
| Change `research-index.yml`'s backfill-commit step from `git push \|\| echo "::warning..."` to a hard failure, or add a separate scheduled check that compares the index against disk and fails loud on drift — shipped when a simulated push failure (e.g. temporary branch protection) fails the workflow run instead of warning | Zaal | PR to ZAOOS | 2026-09-15 |
| Point `fleet-health.sh` and `cost-of-pass-summary.sh --tg` at the same "check the Telegram response body" pattern `loops-report.sh` already uses — shipped when both scripts' code contains the `"ok":true` check instead of a bare `curl -s ... >/dev/null` | Zaal | Config (VPS `~/bin`) | 2026-09-15 |
| Adopt `healthchecks.io` (or equivalent) as a dead-man's switch on the 9 mac crons and the active VPS crontab lines that pipe to `/dev/null`, per doc 2450's recommendation, starting with `stall-tripwire.py` and `cost-of-pass-summary.sh` — shipped when deliberately killing one of those two produces an email within its expected window | Zaal | Config | 2026-09-19 |

## Sources

- `~/bin/fleet-spend-guard.sh`, `fleet-spend-guard.sh.proposed`, `fleet-spend-guard.sh.bak-2026-09-08-zj` on VPS `31.97.148.88` (user `zaal`) — [FULL, read over ssh, 2026-09-08] — live diff of the fixed vs. proposed vs. pre-fix script.
- `curl https://openrouter.ai/api/v1/key` and `.../v1/credits`, run from the VPS with the live `OPENROUTER_API_KEY`, 2026-09-08 11:05 EDT — [FULL] — `usage_daily=0`, `balance=$9.869`.
- `crontab -l` and `ls ~/bin` on the VPS, 2026-09-08 — [FULL, read over ssh].
- `~/bin/disk-guard.sh`, `fleet-health.sh`, `zao-loop-health`, `stall-tripwire.py`, `provider-health.sh`, `loops-report.sh`, `cost-of-pass-summary.sh`, `fleet`, `bus-poll-run.sh`, `disk-hygiene.sh` on the VPS — [FULL, read over ssh, 2026-09-08].
- `/Users/zaalpanthaki/Documents/ZAO OS V1/scripts/agents/zao-wall.py` (lines 115-220) — [FULL, read on disk, 2026-09-08].
- `zao-wall.py --json` (read-only) run against the live cowork board Supabase, 2026-09-08 — [FULL] — `open=581, on_wall=84, unclaimed=157, needs_zaal=328, unrouted=12`.
- `/Users/zaalpanthaki/bin/zao-lane-watch`, `zao-lane-health`, `zao-lane-watch-all`, `zao-research-health`, `zao-sweep`, `zao-status-refresh`, `lane-send`, `zj` — [FULL, read on disk, 2026-09-08].
- `git show bfea3a1` in `~/zaal-dotfiles` (PR #116) — [FULL, read on disk].
- `/Users/zaalpanthaki/Documents/ZAO OS V1/src/app/api/{cron/health-snapshot,agents/health,bots/status}/route.ts` — [FULL, read on disk, 2026-09-08].
- `/Users/zaalpanthaki/Documents/ZAO OS V1/.github/workflows/{doc-collision-guard,docs-automerge,estate-health,ci,research-index}.yml` — [FULL, read on disk, 2026-09-08].
- `/Users/zaalpanthaki/Documents/ZAO OS V1/tools/estate-control-plane/run-checks.ts` — [FULL, read on disk, 2026-09-08].
- [`dev-workflows/2475-research-system-internal-audit`](../2475-research-system-internal-audit/README.md) — [FULL, read on disk].
- [`farcaster/2387-zol-mention-polling-snapchain-spec`](../../farcaster/2387-zol-mention-polling-snapchain-spec/README.md), including commit `07a33a47` — [FULL, read on disk].
- [`agents/2450-zao-bot-estate`](../../agents/2450-zao-bot-estate/README.md) — [FULL, read on disk].
- [`security/2093-silent-failure-sweep`](../../security/2093-silent-failure-sweep/README.md) — [FULL, read on disk].
- `zao-research-index` dedup queries for "inverted alarm", "fleet-spend-guard", "pgrep self match", "silent-failure-guard rule", run 2026-09-08 — [FULL, executed].
- [`ZAODEVZ/ZAOstock` — `.github/workflows/uptime.yml`](https://github.com/ZAODEVZ/ZAOstock/blob/main/.github/workflows/uptime.yml) and [`ci.yml`](https://github.com/ZAODEVZ/ZAOstock/blob/main/.github/workflows/ci.yml) — [FULL, method: `gh api repos/.../contents/... --jq .content | base64 -d`, 2026-09-08]. `gh api repos/bettercallzaal/{wwbase,wavewarzapp,wavewarz-overlay}/contents/.github/workflows` (all 404, confirmed absent) and `gh api repos/ZAODEVZ/ZAOstock/contents/src/app/api` (listed, no health/status route) — [FULL, executed 2026-09-08].
