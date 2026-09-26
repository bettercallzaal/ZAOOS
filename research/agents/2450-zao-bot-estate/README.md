---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: 2292, 2360, 581, 726, 543, 2478, 2456
original-query: "other bots: what bots and automation agents exist across the ZAO estate today (GitHub bots, Telegram bots, CI, watchers, crons), what each does, which are alive vs dead, and which open-source bots we should adopt rather than hand-build"
tier: STANDARD
---

# 2450 — The ZAO Bot Estate, Measured

> **Goal:** Count every bot, cron, watcher and CI job actually running across the ZAO estate, say which are alive, and name the open-source projects worth adopting instead of the ones we hand-built.

**This is a Re-Research Mode pass over the 2026-08-31 doc.** Every claim below was re-measured between 20:00 and 20:25 EDT on 2026-09-25 (today, per the session clock) - nothing is carried over from the prior audit without a fresh command run against it. Where a Next Action shipped, superseded itself, or turned out to rest on a misdiagnosis, that is stated explicitly rather than silently rewritten.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt **healthchecks.io** as the dead-man's switch | **SUPERSEDED BY A HOMEGROWN BUILD - do not adopt it now** | healthchecks.io was never signed up for: no `hc-ping.com` reference exists anywhere in `~/bin`, `~/zaal-dotfiles`, `~/zao-vault` or `~/.zao` (checked 2026-09-25; grep confirmed working against a known string first). Instead, between 2026-09-10 and today the estate built `zao-job` (wraps every cron line, classifies the exit code, writes `~/.zao/jobs/<name>.json`), `~/.zao/beats/<name>` heartbeat files, and `zao-alert-route` (turns a new or cleared red into one delivered message, per `zao-vault/projects/agentic-infrastructure-plan-2026-09-10-7-alert-routing.md`, "Plan 7"). This is confirmed LIVE today - `~/.zao/selftest.log` at 20:20 EDT 2026-09-25 shows real `job:fleet-health`, `job:zao-drive-lock`, `job:zao-manifest-check` rows with classified exit codes. The gap this doc flagged as the #1 problem is closed, just not by the recommended vendor. |
| Replace Dependabot with **Renovate** | **NO, keep Dependabot** (unchanged) | Dependabot is still the only bot enabled (ZAOstock only) and it is still working - 18 ZAOstock PRs all-time, all handled correctly (see Findings). Renovate remains AGPL-3.0 (re-read from the raw `license` file today, byte-for-byte the same license body) and still adds nothing the estate needs. |
| **Auto-merge dependency PRs** | **NO. Still never.** | Branch protection on ZAODEVZ/ZAOstock `main` is **still 404 today** (`gh api repos/ZAODEVZ/ZAOstock/branches/main/protection`) - unchanged from 08-31, and the Next Action to turn it on (due 2026-08-31) is now **25 days overdue**. `delete_branch_on_merge` is still `false`, `allow_auto_merge` is still `false`. Nothing has closed this gap. |
| Adopt **n8n** for workflow glue | **NO** (unchanged) | Re-read `LICENSE` from the file today: still verbatim the Sustainable Use License ("Source code files that contain '.ee.' in their filename... are NOT licensed under the Sustainable Use License" requires an Enterprise License). API field still reports `NOASSERTION`. Searched for a fully-open-source n8n fork gaining traction (per this re-research's brief) - found none; only small unrelated forks and n8n's own already-MIT/Apache satellite repos (`n8n-io/n8n-hosting`, `n8n-io/localtunnel`, etc.), none of which is the core engine. No material movement. |
| Adopt **Activepieces** instead, if workflow glue is ever needed | **HOLD, not now** (unchanged) | MIT core confirmed unchanged today (24,730 stars, pushed 2026-09-25). Still nothing in the estate blocked on it. |
| Adopt **Uptime Kuma** for site monitoring | **NO, not yet** (unchanged) | ZAOstock's `uptime.yml` still exists and still runs. Kuma is now 91,825 stars (MIT, confirmed), still needs a host. |
| Consolidate the ZAODEVZ repos with **no CI at all** | **YES, but the backlog grew, not shrank** | ZAODEVZ is now 23 repos (was 20): 3 new since 08-31 (`iman-desk`, `ZAOartizen`, `ZAOresearch`). Two of the three shipped CI immediately; `iman-desk` didn't. Net: **13 of 23 repos have zero CI today**, up from 12 of 20. |

## The estate as measured, 2026-09-25

### GitHub-side bots

| Bot / job | Where | State, updated |
|---|---|---|
| **Dependabot** | ZAODEVZ/ZAOstock only | ALIVE. 18 PRs all-time (was 6 on 08-31). **Updated 2026-09-25: the "Dependabot's share will climb fast" prediction did NOT hold** - 25 of 8,053 all-time closed PRs across both owner accounts are Dependabot's (0.3%), and 0 of the most recent 100 closed PRs (sorted by update time) are Dependabot's. Human PRs still dominate completely. |
| `ci.yml` | ZAOstock, ZAOcowork, ZAOfractal, ZAOmemberz, ZAOscout, Zuke, **zabalgames (new)**, **ZAOartizen (new repo)** | ALIVE. **Updated:** zabalgames gained a `ci.yml` since 08-31 (previously only `kv-backup.yml`). |
| `uptime.yml` | ZAOstock | ALIVE, unchanged. |
| `auto-close.yml`, `check-paper-rewrites.yml` | ZAOcowork | ALIVE, unchanged. |
| `digest.yml` | ZAOscout | ALIVE, unchanged. |
| `migrate.yml` | ZAOmemberz | ALIVE, unchanged. |
| `juke-stale-rooms-cron.yml`, `schema-drift-check.yml`, `env-check.yml`, `debug-write-test.yml` | Zuke | ALIVE, unchanged. Still 5 workflows, still the most of any single repo. |
| `refresh-bounty-dashboard.yml`, `refresh-leaderboard.yml` | zpoidh | ALIVE, unchanged. |
| `kv-backup.yml` | zabalgames | ALIVE, unchanged. |
| **`telegram-capture.yml` (NEW)** | ZAOartizen | ALIVE. New repo, new automation: a Telegram-integrated capture workflow that did not exist on 08-31. |
| **`doc-collision-guard.yml`, `hygiene.yml`, `research-index.yml` (NEW)** | ZAOresearch | ALIVE. New repo. `doc-collision-guard.yml` is the exact guard the `zao-research` skill itself now depends on to refuse an unreserved doc number - it did not exist on 08-31. |
| *(none)* | 13 of 23 ZAODEVZ repos (`iman-desk`, `zaoonparagraph`, `IMan-Artizen`, `TheZAODEVZapp`, `thezao.com-iman-ui`, `theZAOZone`, `zlank-iman-version`, `ZAO101`, `ZAOpoker`, `zaonexus-iman-ui`, `compliance-zm`, `WWA-Onboarding-app`, `ZAOsribeBOT`) | **No CI at all.** Grew from 12 of 20 (08-31) to 13 of 23 (today) - net one more no-CI repo even after two of the three new repos shipped CI on arrival. |

**Updated 2026-09-25:** Authorship share is unchanged in shape - Dependabot still barely registers (see above). This directly contradicts the 08-31 line "Dependabot's share will climb fast," which was a prediction, not a finding, and it did not come true in the following 25 days.

### The mac: the cron/launchd estate has been rebuilt, not just grown

**Updated 2026-09-25: the 9-cron / 2-launchd picture is stale by design, not by drift.** A 2026-08-31 comment still visible in the crontab reads: *"MOVED TO launchd 2026-08-31: cron skips jobs missed while the mac sleeps, launchd runs them on wake."* Two jobs (`zao-fetch-healthcheck.sh`, `zao-notify.sh --drain`) moved out of cron into launchd plists on the same day this doc was first written. Since then the estate grew further:

- **18 active cron lines today** (was 9), covering `zao-vault-log`, `zao-spend`, `zao-guard`, `zao-lane-watch`, `zao-tick`, `zorca-lock-heartbeat`, `zao-sweep-tabs`, `zao-selftest`, `zao-lane-journal`, `zao-manifest-check`, `zao-grill-queue-drain`, `zao-drive-lock`, `zao-tap-digest` (twice daily), `zao-mirror-reconcile`, `zao-vault-toc`, `fleet-health`.
- **Almost every line is now wrapped in `zao-job <name> -- <command>`**, not a bare redirect. This is the mechanism that replaces the healthchecks.io recommendation - see Key Decisions and Finding 1.
- **9 `com.zao.*` launchd plists** exist today (`fetch-healthcheck`, `fleet-watch`, `lane-relay`, `lane-watch-all`, `morning`, `notify-drain`, `openrouter-preflight`, `tick` [`.pending`, not loaded], `zaostock-file-watch`), plus `zorca-bundle`. `launchctl list` shows most as loaded with PID `-` (last exit 0) except `lane-relay` (PID 1896) and `fleet-watch` (PID 12730), which are long-running.

This is a bigger, more instrumented estate than the one this doc audited in August, not a smaller or simpler one.

### The Pi (ansuz, 100.117.191.11) — ZOL

```
zol-reply.js      UP - exactly one live process (pid 63135)
zol-threads.js    UP
zol-learn-zaal.js UP
```

**Updated 2026-09-25: the "duplicate `zol-reply.js`" finding does not hold up under a clean process-tree read, and is very likely a misdiagnosis of tmux's own process-table behavior, not a live double-post risk.**

Today's process tree for `zol-reply.js`:

```
1416  (PPID 1, started Sep 13, 12+ days CPU time: 00:00:01)  tmux new-session -d -s zol cd ... && node zol-reply.js
  └─ 63133 (started Sep 16, sh -c "cd ~/zol/farcaster-agent && node zol-reply.js 2>&1 | tee -a ~/zol/reply.out")
       ├─ 63135 (node zol-reply.js, CPU time 00:02:00 over 9 days - the only process doing real work)
       └─ 63136 (tee -a reply.out)
```

Pid 1416 is `tmux`'s own session-holder for the `zol` session - it retains the *original launch command* as its argv (standard tmux/ps behavior), consumed one second of CPU across 12 days, and does no work. The real, live, single instance is pid 63135. **The exact same three-level shape (tmux-holder → `sh -c` → `node`) appears identically for `zol-threads.js` and `zol-learn-zaal.js`, the estate's other two ZOL bots**, which would not be true if 1416 were a second live copy of the bot rather than tmux's own bookkeeping. `pgrep -afc 'node zol-reply.js'` returns noisy counts (4-5) only because it also matches the SSH/Tailscale proxy process's own argv, which embeds the remote command string, and the interactive `pgrep` invocation's argv itself - both false positives, confirmed by re-running with `grep -v grep` and reading the full `ps -ef` listing directly.

**Conclusion: no duplicate exists today; the Next Action to "investigate and kill one" is closed as a misdiagnosis, not a fix.** (Caveat, stated per the "write down what you did not see" rule: this rules out a duplicate *today*; it cannot retroactively prove there was no transient double-start on 08-31 itself, since the pids that doc cited, 1985 and 394626, are both long gone and unverifiable now.)

### Other surfaces

| Surface | State, updated |
|---|---|
| Telegram `t.me/ZAOstockTeamBot` | Reachable, HTTP 200. Unchanged. |
| VPS 31.97.148.88 | **Updated 2026-09-25: reachable at the network level, still unmeasured for bot inventory.** `nc -z` succeeds on port 22 and SSH negotiates a real handshake ("Permission denied (publickey,password)"), which is materially different from 08-31's "connection refused/no key" - the host is up. We still hold no accepted credential for it, so **what runs on it remains UNMEASURED**, not "down" and not inventoried. |
| Tailnet | **Updated: 5 peers, but the membership looks different from 08-31's undocumented list.** This Mac, `ansuz` (idle), a Windows desktop `desktop-h2ov6da` (active), `iphone-15` (idle), and one peer not accounted for in the original picture: `srv1073120.tail3c1cd8.ts.net` (100.121.237.35), owned by a **different Tailscale account** (`failoften@`, not `zaalp99@`). It answers `tailscale ping` via relay `31.220.50.149`. This is NOT the 31.97.148.88 VPS (different address, no established link between the two). Not investigated further; flagged for Zaal since every other peer is `zaalp99@`. |
| `zao-selftest` | **Updated: no longer "8 of 8."** The tool has grown far past a bot-estate check - a run at 20:20 EDT today shows dozens of checks spanning disk space, retired-brand-name hygiene, tree/branch drift, job exit codes, and more, with multiple real FAILs (`gh-from-cron`: cron cannot reach GitHub, 401; `disk`: 12GB free; `job:fleet-health`, `job:zao-drive-lock`, `job:zao-manifest-check`: real findings, not blind). A clean single "X of Y passing" number for just this doc's narrow scope is **UNKNOWN from this run** - the tool's scope has broadened well beyond bots/crons/CI, which is itself evidence the estate keeps growing faster than any one snapshot. |

## Findings

### 1. The estate's real gap (unwatched bots) got closed - by a different tool than recommended

The 08-31 doc's #1 recommendation was healthchecks.io. **That recommendation was not followed - and does not need to be now.** Between 2026-09-10 (`agentic-infrastructure-plan-2026-09-10-7-alert-routing.md`, "Plan 7") and today, the estate built its own equivalent:

- `zao-job NAME -- COMMAND` wraps a cron line, classifies the exit code (`pass` / `finding` / `blind` / `cannot-run` / `killed` / `fail`), and writes `~/.zao/jobs/<name>.json` - solving exactly the problem its own docstring names: *"a job could fail every hour for a week and every surface would report it healthy, because it was running on schedule."*
- `~/.zao/beats/<name>` heartbeat files answer "did this run at all," separate from "did it succeed."
- `zao-alert-route` (Plan 7 slice 1) turns a new-or-cleared red into exactly one delivered message via `zao-notify.sh`, with a measured dedup rule built against 222 real FAIL lines rather than invented cases.
- `zao-selftest`'s `jobs-wrapped` check verifies every cron line is actually wrapped in `zao-job`, closing the loop this doc worried about ("nothing watches the watcher").

This is confirmed live, not aspirational: today's `~/.zao/selftest.log` shows real classified job rows (`job:fleet-health: finding...`, `job:zao-vault-log: blind: exit 2...`). **Doc 2478 (`dev-workflows/2478-inverted-alarms-signals-that-go-quiet`, last-validated 2026-09-08) still separately recommends healthchecks.io "or equivalent," due 2026-09-19 - also now overdue by 6 days, and also not shipped via that specific vendor.** Read together, both docs' literal ask (sign up for healthchecks.io) is unshipped, but the actual gap both were trying to close is closed by Plan 7. Recommendation for future re-research: stop carrying the healthchecks.io action forward; it is moot.

### 2. Bot PRs are still the current leading supply-chain malware vector - and the mitigation still hasn't shipped

Branch protection on ZAODEVZ/ZAOstock `main` is **still 404 today**, confirmed by the same command as 08-31: `gh api repos/ZAODEVZ/ZAOstock/branches/main/protection`. `delete_branch_on_merge` and `allow_auto_merge` are both still `false`. This Next Action was due 2026-08-31 and is now **25 days overdue** - the longest-overdue item in this doc.

The specific risk instance from 08-31 resolved without incident: PR #76 (14 grouped updates) and #74, #77, #78 were all read and merged the same day (2026-08-31, per `gh api .../pulls/N`), and #79/#80 were correctly closed rather than force-merged (see Finding 3). No known compromise resulted. That does not reduce the standing exposure - branch protection being off means any future bot PR (or a compromised human account) can still push straight to `main`.

### 3. CI caught real breakage, and one of the two failures shipped a real fix ahead of schedule

- **#79 (zod v4)**: closed unmerged on 2026-08-31 with a comment naming the exact break (`errorMap` renamed to `error`) and citing this doc by number. **Updated 2026-09-25: fixed and shipped.** A follow-up Dependabot PR, **#186 (zod 3.25.76 → 4.6.4), merged 2026-09-19** - 11 days before the 2026-09-30 due date. Verified directly in source: `repos/ZAODEVZ/ZAOstock/contents/src/app/api/musicians/rider/route.ts` line 46 today reads `error: 'Acknowledgement is required to submit the rider'` (not `errorMap`), and `package.json` now pins `"zod": "^4.6.5"`. An interim attempt (#111, zod 4.5.4) was also closed unmerged before #186 landed - the fix took two tries, but it landed.
- **#80 (typescript 7)**: closed 2026-08-31 with the correct stated reason (`typescript-eslint does not support TS 7.0`). **Updated: still blocked, unchanged.** `package.json` today pins `"typescript": "^5.6.0"` - no newer TS7 PR has been opened since. No re-check date was set on this one because it is genuinely upstream-blocked; the original verdict holds.

### 4. The GitHub licence field still lies, unchanged - re-confirmed against raw files, not the API

Re-read every LICENSE file directly today (never `gh api repos/X --jq .license`), per the doc's own Finding 4 and Hard Requirement 13:

- **n8n** - `LICENSE` is still the Sustainable Use License, byte-identical in substance to 08-31. API field: still `NOASSERTION`.
- **Activepieces** - `LICENSE` is still MIT core with `packages/ee/` and `packages/server/api/src/app/ee` carved out under a separate commercial license, byte-identical in substance. API field: still `NOASSERTION`.
- **Renovate** - re-confirmed AGPL-3.0 from the raw `license` file (note: this repo's license file is lowercase `license`, not `LICENSE`; the GitHub `/license` API endpoint resolves it correctly but reports `path: null`, worth knowing if scripting this check again).

No repo in this table changed license class since 08-31.

### 5. Dependabot's predicted growth did not happen

The 08-31 doc predicted "Dependabot's share will climb fast." **Updated 2026-09-25: it did not.** Measured today: 25 of 8,053 all-time closed PRs across both owner accounts (bettercallzaal + ZAODEVZ) are Dependabot-authored (0.3%), 18 of those on ZAOstock specifically (still the only repo with it enabled), and 0 of the most recent 100 closed PRs (by update time, across both accounts) are Dependabot's. Human-authored PRs remain effectively all of the estate's PR volume.

## Adoption candidates

Licence column is read from the LICENSE file, never the API field. Stars and push dates re-measured 2026-09-25.

| Project | Stars | Last push | Licence (from file) | Verdict, updated |
|---|---|---|---|---|
| [healthchecks/healthchecks](https://github.com/healthchecks/healthchecks) | 10,366 (was 10,294) | 2026-09-21 | BSD-3-Clause | **NOT ADOPTED, and no longer needed** - see Finding 1. The gap it would have closed is closed by the estate's own `zao-job`/beats/`zao-alert-route`. Leave in reserve only if that homegrown stack is ever abandoned. |
| [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) | 91,825 (was 90,792) | 2026-09-26 (most recent push in this table) | MIT | KEEP IN RESERVE, unchanged. `uptime.yml` still covers ZAOstock. |
| [renovatebot/renovate](https://github.com/renovatebot/renovate) | 22,592 (was 22,379) | 2026-09-25 | AGPL-3.0 | SKIP, unchanged. Dependabot still enabled and working; its share did not grow enough to strain (Finding 5). |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | 24,730 (was 24,144) | 2026-09-25 | MIT core, `packages/ee/` commercial | HOLD, unchanged. |
| [upptime/uptime-monitor](https://github.com/upptime/uptime-monitor) | 315 (was 312) | 2026-09-21 | MIT | SKIP, unchanged. |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | 205,984 (was 202,945) | 2026-09-25 | **Sustainable Use License — still not open source** | **REJECT on licence, unchanged.** Checked for a fully-open-source fork gaining ground; found none material. |

## Also See

- [Doc 2478](../../dev-workflows/2478-inverted-alarms-signals-that-go-quiet/) — Inverted Alarms; independently arrives at the same healthchecks.io recommendation on 2026-09-08 (also now overdue, also superseded in practice by Plan 7)
- [Doc 2456](../../agents/2456-orchestrator-practice/) — cites the dead-man's-switch pattern and SRE's "every page must be actionable" rule; conceptually related, does not supersede this doc
- [Doc 2292](../../security/2292-agent-guardrail-tools-landscape/) — agent guardrail tooling
- [Doc 2360](../../identity/2360-which-agent-gets-the-legal-body/) — which agent gets the legal body
- [Doc 581](../../identity/581-bonfire-graph-wipe-bot-hygiene/) — bot hygiene (581 is an ambiguous number across the library; this is the identity-folder doc, resolved via `zao-research-health --resolve`)
- [Doc 726](../../identity/726-bonfires-teaching-another-bot/) — teaching another bot (726 is also ambiguous; same resolution note)
- [Doc 543](../../identity/543-bonfires-bot-shipping-questions/) — bot shipping questions (543 is also ambiguous; same resolution note)
- `.claude/rules/silent-failure-guard.md` — green while broken
- ZAOOS#3056 — the founding four-instances-in-24-hours issue
- `zao-vault/projects/agentic-infrastructure-plan-2026-09-10-7-alert-routing.md` — "Plan 7," the homegrown mechanism that closed Finding 1's gap

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Turn on branch protection on ZAODEVZ/ZAOstock `main` so `gh api .../branches/main/protection` returns 200 instead of 404; still not done, 25 days overdue | @Zaal | Terminal, 4 commands | 2026-10-02 |
| Close PR #79 (zod v4) and #80 (typescript 7) with the failure reason in a comment | @Zaal | GitHub | **DONE - shipped 2026-08-31**, verified via PR comments |
| Merge #74, #76, #77, #78 after reading #76's 14 grouped updates | @Zaal | GitHub | **DONE - shipped 2026-08-31**, verified via `gh api .../pulls/N` merged_at |
| Create 11 healthchecks.io checks + hc-ping curls | @Zaal | Config | **wontfix - superseded by `zao-job`/beats/`zao-alert-route` (Plan 7), confirmed live 2026-09-25; do not carry forward** |
| Investigate the duplicate `zol-reply.js` on ansuz and kill one | @Zaal | Terminal | **wontfix - re-investigated 2026-09-25, no duplicate found; pid 1416 is tmux's session holder, not a second live process. Closed as a misdiagnosis.** |
| Get an accepted SSH credential for VPS 31.97.148.88 (it is reachable on port 22 today; only auth is missing) and record which bots run there | @Zaal | Terminal | 2026-10-05 |
| Fix `errorMap` to `error` at `src/app/api/musicians/rider/route.ts:44` so zod v4 can land | @Zaal | PR | **DONE - shipped via PR #186, merged 2026-09-19**, verified live in source |
| Identify the tailnet peer `srv1073120.tail3c1cd8.ts.net` (100.121.237.35, owned by account `failoften@`, not `zaalp99@`) - confirm whether it belongs on this tailnet at all | @Zaal | Terminal | 2026-10-02 |

## Sources

- [GitGuardian — Renovate and Dependabot: The New Malware Delivery System](https://blog.gitguardian.com/renovate-dependabot-the-new-malware-delivery-system/) — **[FULL, method: curl + HTML strip, re-read 2026-08-31, not re-fetched this pass since its claim is historical/dated and unchanged; incident list unaffected by time]**
- ZAODEVZ/ZAOstock branch protection — **[FULL, method: `gh api repos/ZAODEVZ/ZAOstock/branches/main/protection`, run 2026-09-25, returned 404]**
- ZAODEVZ/ZAOstock PRs #74, #76-#80, #111, #186 — **[FULL, method: `gh api repos/ZAODEVZ/ZAOstock/pulls/<N>` and `.../issues/<N>/timeline`, run 2026-09-25]**
- ZAODEVZ/ZAOstock `rider/route.ts` + `package.json` current source — **[FULL, method: `gh api repos/.../contents/<path>` + base64 decode of raw content, run 2026-09-25]**
- PR authorship share (8,053 total, 25 Dependabot) — **[FULL, method: `gh api search/issues` with `user:` qualifiers (not `org:`, which 404s on these two USER accounts), run 2026-09-25]**
- ansuz (100.117.191.11) process tree — **[FULL, method: `ssh zaal@100.117.191.11 'ps -ef' / 'tmux list-panes -a' / 'tmux list-sessions'`, run 2026-09-25]**
- VPS 31.97.148.88 — **[PARTIAL, method: `nc -z -v` (succeeded, port 22 open) + `ssh -o PreferredAuthentications=none` (got a real SSH auth-denied banner, proving the host is live); no credential exists to go further, so bot inventory on it is still FAILED/UNMEASURED]**
- Tailnet state — **[FULL, method: `tailscale status` + `tailscale ping`, run 2026-09-25]**
- `~/.zao/selftest.log` current tail — **[FULL, method: direct file read + a fresh `zao-selftest --quiet` run, 2026-09-25]**
- `zao-job` source — **[FULL, method: direct file read of `~/bin/zao-job`, 2026-09-25]**
- `zao-alert-route` source + Plan 7 doc — **[FULL, method: direct file read of `~/bin/zao-alert-route` and `~/zao-vault/projects/agentic-infrastructure-plan-2026-09-10-7-alert-routing.md`, 2026-09-25]**
- [healthchecks/healthchecks](https://github.com/healthchecks/healthchecks) — **[FULL, method: gh api + LICENSE file read, re-run 2026-09-25]** 10,366 stars, BSD-3-Clause.
- [n8n-io/n8n](https://github.com/n8n-io/n8n) — **[FULL, method: gh api + LICENSE.md file read, re-run 2026-09-25]** Sustainable Use License re-confirmed from file.
- [activepieces/activepieces](https://github.com/activepieces/activepieces) — **[FULL, method: gh api + LICENSE file read, re-run 2026-09-25]** MIT core, `packages/ee/` commercial, unchanged.
- [renovatebot/renovate](https://github.com/renovatebot/renovate) — **[FULL, method: `gh api repos/.../contents/license` (lowercase filename) raw content read, re-run 2026-09-25]** AGPL-3.0 confirmed from the licence body directly.
- [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) — **[FULL, method: gh api + LICENSE file read, re-run 2026-09-25]** MIT.
- [upptime/uptime-monitor](https://github.com/upptime/uptime-monitor) — **[FULL, method: gh api + LICENSE file read, re-run 2026-09-25]** MIT.
- ZAODEVZ workflow inventory — **[FULL, method: `gh api repos/ZAODEVZ/<repo>/contents/.github/workflows` across all 23 current repos, run 2026-09-25]**
- Local estate (cron/launchd) — **[FULL, method: `crontab -l`, `ls ~/Library/LaunchAgents`, `launchctl list`, run 2026-09-25]**
- `zao-research-index "bot estate"` / `"dead man's switch"` — **[FULL, method: FTS5 index search, run 2026-09-25]** No doc supersedes 2450; doc 2478 independently recommends the same superseded action.
- `~/bin/zao-tracker search` — **[FULL, method: tracker query, run 2026-09-25]** Surfaced the still-open tracker rows for the healthchecks.io action and doc 2478's parallel ask, both closed as wontfix in this pass.
