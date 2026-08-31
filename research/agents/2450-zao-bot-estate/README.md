---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-31
superseded-by:
related-docs: 2292, 2360, 581, 726, 543
original-query: "other bots: what bots and automation agents exist across the ZAO estate today (GitHub bots, Telegram bots, CI, watchers, crons), what each does, which are alive vs dead, and which open-source bots we should adopt rather than hand-build"
tier: STANDARD
---

# 2450 — The ZAO Bot Estate, Measured

> **Goal:** Count every bot, cron, watcher and CI job actually running across the ZAO estate on 31 August 2026, say which are alive, and name the open-source projects worth adopting instead of the ones we hand-built.

Every number here came from a command run on 2026-08-31 between 08:55 and 09:20 EDT. Nothing is carried over from a prior audit.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt **healthchecks** as a dead-man's switch for all 9 mac crons | **YES, this is the top recommendation** | The estate's documented recurring failure is a load-bearing job dying silently while everything reports success (ZAOOS#3056, four instances in 24h). All 9 crons currently fail into a log file nobody reads. BSD-3-Clause, 10,294 stars, pushed today. |
| Replace Dependabot with **Renovate** | **NO, keep Dependabot** | Dependabot was enabled today and is working. Renovate is more configurable but AGPL-3.0 and a heavier install; nothing in the estate needs what it adds. Revisit only if grouping rules become limiting. |
| **Auto-merge dependency PRs** | **NO. Never.** | Bot PRs carry implicit trust and are the current leading supply-chain malware vector (see Findings). Branch protection is still OFF on ZAOstock, measured 404 today. |
| Adopt **n8n** for workflow glue | **NO** | Not open source. Its LICENSE.md is a Sustainable Use License restricting hosting and commercial use. The GitHub API reports `NOASSERTION`, which is why the licence must be read from the file. |
| Adopt **Activepieces** instead, if workflow glue is ever needed | **HOLD, not now** | MIT core with a commercial `packages/ee/` carve-out, so the core is adoptable. But nothing in the estate is blocked on visual workflow building today. |
| Adopt **Uptime Kuma** for site monitoring | **NO, not yet** | ZAOstock already has `uptime.yml` running in Actions and it works. Kuma is MIT and excellent, but it needs a host to run on and would replace something that is not broken. |
| Consolidate the 12 ZAODEVZ repos with **no CI at all** | **YES, but as one batch later** | 12 of 20 ZAODEVZ repos have no workflows. Most are dormant. Not urgent; do it when one of them next gets touched. |

## The estate as measured, 31 August 2026

### GitHub-side bots

| Bot / job | Where | State |
|---|---|---|
| **Dependabot** | ZAODEVZ/ZAOstock only | **ALIVE, enabled today** by PR #72. Opened 6 PRs within 90 minutes (#74, #76-#80). |
| `ci.yml` | ZAOstock, ZAOcowork, ZAOfractal, ZAOmemberz, ZAOscout, Zuke | ALIVE. typecheck, lint, test, build. |
| `uptime.yml` | ZAOstock | ALIVE. Hand-rolled uptime check. |
| `auto-close.yml`, `check-paper-rewrites.yml` | ZAOcowork | ALIVE |
| `digest.yml` | ZAOscout | ALIVE |
| `migrate.yml` | ZAOmemberz | ALIVE |
| `juke-stale-rooms-cron.yml`, `schema-drift-check.yml`, `env-check.yml`, `debug-write-test.yml` | Zuke | ALIVE. Zuke has 5 workflows, the most of any repo. |
| `refresh-bounty-dashboard.yml`, `refresh-leaderboard.yml` | zpoidh | ALIVE |
| `kv-backup.yml` | zabalgames | ALIVE |
| *(none)* | 12 of 20 ZAODEVZ repos | **No CI at all** |

Authorship of the last 100 closed PRs across both owner accounts: **98 bettercallzaal, 1 dependabot[bot], 1 ZAODEVZ**. The estate is, as of today, almost entirely human-authored. Dependabot's share will climb fast.

### The mac: 9 cron jobs

```
0  9 * * 1   zao-fetch-healthcheck.sh      weekly, Monday 09:00
17 *  * * *  zao-vault-log                 hourly
17 *  * * *  zao-spend --ledger --hours 1  hourly
27 *  * * *  zao-guard tick                hourly
45 *  * * *  zao-selftest --quiet          hourly
25 *  * * *  zao-sweep-tabs --apply        hourly
*/20 * * * * zao-lane-watch                every 20 min
*/5  * * * * zao-tick                      every 5 min
5  7 * * *   zao-notify.sh --drain         daily 07:05
```

Plus two launchd agents, both `loaded`: `com.zao.lane-relay`, `com.zao.zorca-bundle`.

**Every one of these nine redirects into a log file under `~/.zao/`.** None of them alerts on failure. `zao-selftest` is the partial exception: it reports 8/8 passing today, but it is itself a cron with the same silent-death property, and nothing watches the watcher.

### The Pi (ansuz, 100.117.191.11) — ZOL

```
zol-reply.js      UP
zol-threads.js    UP
zol-learn-zaal.js UP
```

**Finding: `zol-reply.js` appears twice** — pid 1985 (inside the `zol` tmux session) and pid 394626 (a separate `sh -c` parent). Two live copies of a Farcaster reply bot is a double-post risk. Not investigated further today; flagged in Next Actions.

### Other surfaces

| Surface | State |
|---|---|
| Telegram `t.me/ZAOstockTeamBot` | Reachable, HTTP 200 |
| VPS 31.97.148.88 | **UNMEASURED** — refused BatchMode SSH from this machine. Not "down"; not verified either. |
| Tailnet | 5 peers, ansuz active |
| `zao-selftest` | 8 of 8 checks passing |

## Findings

### 1. The estate's real gap is not missing bots, it is unwatched ones

There are 9 crons, 2 launchd agents, 3 node processes on the Pi and 16 GitHub workflows running right now. That is not too few automations. The gap is that **failure is invisible in all 11 of the local ones.** A cron that stops firing produces exactly the same output as a cron that fires and finds nothing to do: silence in a log.

This is a documented, repeated failure shape, not a hypothetical. ZAOOS#3056 records the same bug diagnosed four separate times in 24 hours on 2026-08-12: `zao-vault-log` untracked and vanished with its hourly cron dead while it had been writing "nothing merged" for four days through 158 merged PRs; `zao-cc-state.sh` removed by a branch checkout; `relay-autopull.sh` failing on every prompt typed for an unknown length of time; `quick-grill` gone from disk. One shape, four instances, zero recognition.

**A dead-man's switch fixes exactly this class**, and it is a solved, adoptable problem — see the table below.

### 2. Bot PRs are the current leading supply-chain malware vector

GitGuardian, March 2026: *"Dependabot and Renovate pull requests carry an implicit trust that human-authored pull requests do not. They are routine, expected, and often waved through without scrutiny."*

The named 2025-2026 incidents in that piece: `tj-actions/changed-files` (March 2025, CI secret dumping), Salesloft Drift OAuth theft (August 2025), Shai-Hulud wormed npm attack (September and November 2025), and in March 2026 both the `trivy-action`/LiteLLM campaign and the Axios package compromise.

This lands on ZAOstock **today**, not theoretically. Dependabot was enabled this morning and immediately opened PR #76 bundling **14 package updates into a single pull request** — precisely the shape that gets waved through. Meanwhile branch protection on `main` returns 404 (measured 09:00 today) and `delete_branch_on_merge` is `false`.

The mitigation is not to turn Dependabot off. It is: protect the branch, never enable auto-merge on dependency PRs, and read what is in a group PR before merging it.

### 3. CI already catches real breakage, which is the argument for keeping it strict

Of the 6 Dependabot PRs opened today, 4 are green and 2 fail, and **both failures are real**:

- **#79, zod 3.25.76 to 4.4.3** breaks the build at `src/app/api/musicians/rider/route.ts:44` — zod v4 renamed the `errorMap` option to `error`, producing `error TS2769: No overload matches this call`. This needs a code change, not a version bump.
- **#80, typescript 5.9.3 to 7.0.2** fails lint with `typescript-eslint does not support TS 7.0`. Blocked upstream; nothing to do but wait.

Both would have been silent breakage if bumped by hand. The `check` job doing typecheck, lint, test and build is the thing that caught them.

### 4. The GitHub licence field lied on two of six candidates

`gh api repos/X --jq .license` returned `NOASSERTION` for both n8n and Activepieces. Reading the LICENSE files:

- **n8n** — LICENSE.md is a Sustainable Use License: *"Portions of this software are licensed as follows... Source code files that contain '.ee.' in their filename"* are separately licensed. This is source-available, **not open source**, and restricts hosting. Not adoptable on our terms.
- **Activepieces** — MIT core, with `packages/ee/` and `packages/server/api/src/app/ee` under a commercial licence. The core **is** adoptable.

Same API field, same `NOASSERTION` value, two materially different answers. This is the third recorded instance of that field being wrong (see Hard Requirement 13 in the research skill).

## Adoption candidates

Licence column is read from the LICENSE file, never the API field. Stars and push dates measured 2026-08-31.

| Project | Stars | Last push | Licence (from file) | Verdict |
|---|---|---|---|---|
| [healthchecks/healthchecks](https://github.com/healthchecks/healthchecks) | 10,294 | 2026-08-31 | BSD-3-Clause | **ADOPT.** Cron dead-man's switch. Each job curls a URL on success; no ping in the window means an alert. Exactly the missing piece. |
| [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) | 90,792 | 2026-08-31 | MIT | KEEP IN RESERVE. Excellent, but `uptime.yml` already covers ZAOstock and Kuma needs a host. |
| [renovatebot/renovate](https://github.com/renovatebot/renovate) | 22,379 | 2026-08-31 | AGPL-3.0 | SKIP. Dependabot is enabled and working. AGPL is fine for tool use, but nothing here needs Renovate's extra configurability. |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | 24,144 | 2026-08-31 | MIT core, `packages/ee/` commercial | HOLD. Adoptable core, but no current need. |
| [upptime/uptime-monitor](https://github.com/upptime/uptime-monitor) | 312 | 2026-08-27 | MIT | SKIP. Small project, and it does what `uptime.yml` already does. |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | 202,945 | 2026-08-31 | **Sustainable Use License — not open source** | **REJECT on licence.** |

### Why healthchecks specifically

It is the smallest possible change that closes the biggest gap. Adding a dead-man's switch to a cron is one line appended to the existing command:

```
45 * * * * ~/bin/zao-selftest --quiet >> ~/.zao/selftest.log 2>&1 && curl -fsS -m 10 --retry 3 https://hc-ping.com/<uuid> > /dev/null
```

The job keeps doing what it does. If it stops running, stops succeeding, or the machine is off, no ping arrives inside the window and healthchecks emails. It requires no change to any of the 9 scripts, and the hosted free tier covers 20 checks, which is more than the 11 local jobs need. Self-hosting is available under BSD-3 if the hosted tier is ever unwanted.

## Also See

- [Doc 2292](../../security/2292-agent-guardrail-tools-landscape/) — agent guardrail tooling
- [Doc 2360](../../identity/2360-which-agent-gets-the-legal-body/) — which agent gets the legal body
- [Doc 581](../../identity/581-bonfire-graph-wipe-bot-hygiene/) — bot hygiene
- [Doc 726](../../identity/726-bonfires-teaching-another-bot/) — teaching another bot
- [Doc 543](../../identity/543-bonfires-bot-shipping-questions/) — bot shipping questions
- `.claude/rules/silent-failure-guard.md` — green while broken
- ZAOOS#3056 — the founding four-instances-in-24-hours issue

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Turn on branch protection + Dependabot alerts on ZAODEVZ/ZAOstock so `main` cannot take an unreviewed bot merge; `gh api .../branches/main/protection` returns 200 instead of 404 | @Zaal | Terminal, 4 commands | 2026-08-31 |
| Close PR #79 (zod v4) and #80 (typescript 7) with the failure reason in a comment; both are red for real causes | @Zaal | GitHub | 2026-08-31 |
| Merge #74, #76, #77, #78 after reading what is inside #76's 14 grouped updates | @Zaal | GitHub | 2026-08-31 |
| Create 11 healthchecks.io checks (9 crons + 2 launchd agents) and append `&& curl hc-ping.com/<uuid>` to each crontab line; verified when deliberately stopping `zao-tick` produces an email | @Zaal | Config | 2026-09-07 |
| Investigate the duplicate `zol-reply.js` on ansuz (pids 1985 and 394626) and kill one; verified when `pgrep -fc zol-reply` returns 1 | @Zaal | Terminal | 2026-09-07 |
| Re-measure VPS 31.97.148.88 from a machine whose key it accepts, and record which bots run there; this doc says UNMEASURED, not down | @Zaal | Terminal | 2026-09-07 |
| Fix `errorMap` to `error` at `src/app/api/musicians/rider/route.ts:44` so zod v4 can land; verified when a re-opened Dependabot zod PR goes green | @Zaal | PR | 2026-09-30 |

## Sources

- [GitGuardian — Renovate and Dependabot: The New Malware Delivery System](https://blog.gitguardian.com/renovate-dependabot-the-new-malware-delivery-system/) — **[FULL, method: curl + HTML strip, 12,611 chars raw]** March 2026. The implicit-trust argument and the 2025-2026 incident list are quoted from raw text.
- [Hacker News search, "renovate dependabot"](https://hn.algolia.com/api/v1/search?query=renovate%20dependabot&tags=story) — **[FULL, method: keyless Algolia JSON API]** Community signal: the GitGuardian piece at [item 47751395](https://news.ycombinator.com/item?id=47751395), plus 108-point [Fossabot](https://news.ycombinator.com/item?id=45439721) on AI review of breaking-change bot PRs.
- [healthchecks/healthchecks](https://github.com/healthchecks/healthchecks) — **[FULL, method: gh api + LICENSE file read]** 10,294 stars, BSD-3-Clause.
- [n8n-io/n8n](https://github.com/n8n-io/n8n) — **[FULL, method: gh api + LICENSE.md file read]** Sustainable Use License confirmed from file after API returned `NOASSERTION`.
- [activepieces/activepieces](https://github.com/activepieces/activepieces) — **[FULL, method: gh api + LICENSE file read]** MIT core, `packages/ee/` commercial.
- [renovatebot/renovate](https://github.com/renovatebot/renovate) — **[FULL, method: `gh api repos/.../license`]** AGPL-3.0 confirmed from the licence body, not the field alone.
- [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) — **[FULL, method: gh api + LICENSE file read]** MIT.
- ZAODEVZ workflow inventory — **[FULL, method: `gh api repos/ZAODEVZ/<repo>/contents/.github/workflows` across all 20 repos]**
- Local estate — **[FULL, method: `crontab -l`, `ls ~/Library/LaunchAgents`, `launchctl list`, `ssh zaal@ansuz pgrep -af`, `~/bin/zao-selftest`]**
- VPS 31.97.148.88 — **[FAILED, method: `ssh -o BatchMode=yes root@31.97.148.88`, connection refused/no key from this machine]** Recorded as UNMEASURED rather than estimated.
