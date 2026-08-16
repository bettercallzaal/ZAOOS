---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-08-16
superseded-by:
related-docs: "2264, 2282, 2284, 2288, 2161, 836, 826"
original-query: "Let's research more of what this infra can do - all four layers: the always-on estate, the Claude Code harness, the CI/automation harness, and the ICM/context layer"
tier: DEEP
---

# 2291 - What this infrastructure can actually do, measured

> **Goal:** Across four layers - the always-on estate, the Claude Code harness, the CI/automation harness, and the ICM context layer - find the capability we already own and are not using. Measured 2026-08-16, not inferred.

## The three findings that matter

| # | Finding | The number |
|---|---|---|
| 1 | **The VPS spends about half its machine keeping warm a brain that nothing calls.** Ollama has averaged **104% CPU and 25.6% RAM for 18.9 days** on a 2-core box, held resident by a keepwarm cron - while the fleet that would use it reads `NO_CREDITS` and falls back to the Claude cap. | load **3.71** then **2.06** on 2 cores; Pi load **0.09** on 4 |
| 2 | **Nothing verifies main-as-merged, and it takes three settings to explain why.** Each looks fine alone. | `strict: false` + GITHUB_TOKEN merges + no merge queue |
| 3 | **The canonical context layer is dark and nothing noticed.** useicm.com unreachable all session while other hosts answer normally. | **HTTP 000** on 23/23 boxes; github + zaostock.com **200** |

Everything below is the evidence for those, plus what each layer can do that we are not asking of it.

---

## A. The always-on estate - the capacity is inverted

Doc 2264 (2026-08-11) recommended moving a Claude lane to the VPS as migration step 5. **That recommendation was wrong, and this is the correction.**

| | VPS `srv1537940` | Pi `ansuz` |
|---|---|---|
| cores | 2 | **4** |
| load (1m) | **3.71** - ~1.85x oversubscribed | **0.09** - idle |
| RAM | 7G (4G free) | 3G (2G free) |
| disk free | 19G of 96G | **43G of 59G** |
| tailscale | **MISSING** | **1.102.2** |
| ollama | 0.18.3, **4 models** | **0.30.8**, 0 models loaded |
| ffmpeg | **MISSING** | present |
| docker | 29.4.1 | 29.6.1 |
| node | v20.20.2 | v20.20.2 |

**The Pi is the underused box, not the VPS.** It has twice the cores, more free disk, a newer Ollama, ffmpeg, and it is already on the tailnet - the exact thing the VPS still lacks five days after doc 2264 flagged it as blocking finding #1. Meanwhile the VPS is running 8 services and 22 cron entries at nearly 2x its core count.

### Where the VPS load actually comes from

The load is not ZAO work. `ps` on the VPS attributes it:

```
%CPU %MEM  ELAPSED  COMMAND
 104  25.6  1633957  ollama          <- 18.9 days, averaging >1 of 2 cores
 2.4   2.2      575  node
 2.3   0.3   501821  monarx-agent
```

`ollama runner` is resident with **qwen2.5:3b** (3.1B, Q4_K_M, ~2.07 GB) loaded, and a `ollama-keepwarm.sh` cron re-warms it every 5 minutes. So roughly **half the box, continuously for nineteen days, is dedicated to keeping a model hot** - and per doc 2264 the fleet that would call it reads `NO_CREDITS` and falls back onto the Claude weekly cap instead.

**We are paying for the cheap tier twice and using it zero times:** once in VPS capacity to keep it warm, once in Claude cap because nothing routes to it.

This also reconciles the estate docs rather than contradicting them. Doc 2282 found **17 of 20 VPS tmux sessions are idle `bash -l` shells** - correct, and consistent: the sessions are not the load, the keepwarm is. Doc 2284 concluded Oracle should not be the Ollama box and "the Mac keeps this job" - also consistent, and the measurement here explains why the VPS cannot quietly take it either.

### The real gap: the cheap-AI tier has no always-on home

Put the three boxes together and the uncomfortable conclusion is that none of them is a good host for local inference:

- **VPS** - has the four models (`qwen2.5:3b`, `qwen2.5-coder:7b`, `qwen2.5:7b`, `llama3.1:8b`) but only 2 cores and 7 GB, and is already spending half of itself on one 3B model.
- **Pi** - idle with 4 cores, but **3 GB RAM and 0 models loaded**. Fine for a 3B, not for the 7-8B models worth switching to.
- **Mac** - has the capability, and is the machine doc 2264 exists to stop depending on.

So `claude-usage.md`'s cost ladder has a rung with no durable machine under it. That is a bigger finding than any single box's load, and it is the thing to decide rather than to optimise around.

### Two smaller openings

1. **Media work has an always-on candidate.** ffmpeg is present on the Pi and **missing on the VPS**. Transcription and clip work currently pinned to the Mac (`~/.zao/diarization-models`, the Craig workflow) could run on the box that is doing nothing - and the Pi is on the tailnet already.
2. **Node is v20.20.2 on both boxes** while the bot's own CI targets node 22 (`.github/workflows/ci.yml`, `node-version: 22`). What CI verifies is not what the machines run. Doc 2288 is the sibling finding here: ~122 ZAO-authored files, including `zoe-autodeploy.sh` and `ollama-keepwarm.sh`, exist on exactly one host.

**Not measured:** the Windows desktop. Doc 2264 found it on the tailnet with port 22 closed; nothing in this audit changes that, and it remains the largest untapped box in the estate if OpenSSH is ever installed.

---

## B. The Claude Code harness - dense where it is wired, blind where it is not

Configured today:

- **Hooks, project scope:** PreToolUse (4 matcher groups), PostToolUse (2), SessionStart (1), Stop (1), Notification (1)
- **Hooks, user scope:** SessionStart, UserPromptSubmit, Notification, Stop, PreToolUse (2), PostToolUse (3)
- **Skills:** 70 user + 57 project = **127**
- **Also on:** `remoteControlAtStartup`, `statusLine`, `voiceEnabled`, `agentPushNotifEnabled`
- **Mac cron:** 6 active lines

This is a well-wired harness, and the PreToolUse hooks are doing real work - two of them caught mistakes during this very audit (a `$?`-after-pipeline read, and a PII scan on a staged diff). That is the harness paying for itself.

**What it can do that we are not asking:**

1. **`Monitor` is unused, and it is the right tool for exactly the problem this lane keeps hitting.** It streams events from a long-running command as notifications. Every CI-watching, PR-watching, and "did the nightly job fire" question in this lane has been answered by polling by hand. A persistent monitor on the workflow-run feed would have surfaced the four missing main runs the day they happened rather than days later.
2. **No self-service session rename.** Established 2026-08-14 and unchanged: `/rename` is a built-in CLI command with no tool and no file hook (`~/.zao/session-names/` exists and is empty). The live-status half of the naming convention depends on Zaal typing it, which is how a status goes stale. See [[feedback_two_name_layers]].
3. **127 skills is past the point where discovery is free.** No audit here of which are dead; that is its own task, and doc 154 is the reference.

---

## C. The CI harness - the fix works, and it revealed a second hole

**First, the good news: the doc 2264 / PR #3069 fix is validated in production.** The scheduled CI run fired **2026-08-15T07:09 UTC on main and succeeded** - the first ever scheduled run, doing exactly what it was added to do.

**And it is still needed, daily.** Current main `6a134ea8` has **0 workflow runs**. Auto-merged commits continue to land unverified; the schedule is now the safety net rather than the fix.

**The second hole, found in this audit:** branch protection on main requires

```
Lint & Typecheck, Test, Bot Tests      strict: false
```

Two problems in one line.

- **`strict: false` means a branch need not be up to date with main before merging.** A PR can go green against a base from hours ago and merge into a main that has moved. This is the *protection-layer* half of the inherited-green problem - doc 2264 found the GITHUB_TOKEN half, and this is the other one.
- **`Build` is not a required check.** It runs in CI (gated on `needs`), but nothing blocks a merge on it.

**Three settings, each defensible alone, that together mean nothing ever checks main-as-merged:**

1. `strict: false` - the PR was never tested against current main
2. auto-merge via `GITHUB_TOKEN` - no CI on the resulting main commit
3. no merge queue - nothing tests the merge result either

**GitHub's merge queue is the product answer to exactly this** - it builds and tests the prospective merge result before landing it, which closes all three at once. `allow_auto_merge` is already true; the queue is not in use.

Also found: a repository ruleset named **"Block Saftey 1"** exists and is **disabled** (spelling as-is in the config). Someone built a guard and turned it off, or never turned it on. Worth a decision either way - a disabled ruleset is a control that reads as present and does nothing.

---

## D. The ICM context layer - I could not measure it, and that is the finding

**The measurement failed and I am reporting it as failed.** Both sweeps of all 23 registry boxes returned **HTTP 000** - a connection failure, not an empty body, not a 404. Meanwhile `api.github.com` and `zaostock.com` returned **200** from the same shell seconds later, and DNS resolved in under 2 ms.

I nearly reported "all 23 ZAO boxes are empty." That would have been spectacularly wrong: I successfully fetched `zaostock` at **854 bytes** on 2026-08-13, three days ago. A check that reports everything empty is a broken instrument, not a discovery (`noisy-signal-guard.md`).

What I cannot tell from here: whether useicm.com is down, or whether this machine is blocked. The first request of the first sweep already returned 000, which argues against self-inflicted rate limiting, but I did not prove it either way.

**The real finding is the one underneath.** `icm-grounding.md` makes these boxes the canonical upstream that every agent and terminal reads to avoid working from stale copy. That upstream has been unreachable from this machine for an entire working session, and **nothing anywhere reported it.** There is no health check on the context layer - no probe, no alert, no fallback to the repo copies in `research/identity/icm-boxes/`.

So the capability question for this layer is not "what else can boxes do" but "what happens when they are gone", and today's answer is: agents silently lose their grounding and carry on.

---

## The cross-cutting shape

Three layers, one pattern: **each has a control that looks present and does nothing.**

- CI has a `push: [main]` trigger that cannot fire for the merges we actually do.
- Branch protection has required checks that never see the merge result.
- ICM has a canonical upstream with no liveness check, so its absence is indistinguishable from its silence.
- And a ruleset literally named for safety sits disabled.

That is the same failure `silent-failure-guard.md` was written for, appearing at four different altitudes. The estate finding is the odd one out and the cheapest to act on: we are paying for a saturated box and an idle one, and the idle one is better connected.

## Also See

- [Doc 2264](../2264-mac-offline-always-on-migration/) - the estate inventory this corrects on capacity, and whose CI finding this extends
- [Doc 2282](../2282-fleet-output-audit/) - 17 of 20 VPS sessions are idle `bash -l`; consistent with the keepwarm being the load, not the sessions
- [Doc 2284](../2284-oracle-always-free-vps-capacity/) - concluded Oracle is not the Ollama box and the Mac keeps the job; this audit measures why the VPS cannot quietly take it either
- [Doc 2288](../2288-code-with-no-home/) - `ollama-keepwarm.sh` is among the ~122 files that exist on exactly one host
- [Doc 2161](../../identity/2161-zao-brand-audit/) - the ICM box audit
- [Doc 836](../836-zaoos-repo-estate-census/), [Doc 826](../826-zao-infrastructure-estate-map/) - prior estate maps
- `.claude/rules/silent-failure-guard.md`, `noisy-signal-guard.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm whether useicm.com is down or we are blocked - curl one box from the VPS and the Pi; done when the answer is written into this doc | @Zaal | Diagnosis | 2026-08-17 |
| Add a liveness probe on one ICM box to the existing estate-health workflow; done when a dark context layer opens an alert instead of passing silently | @Zaal | PR | 2026-08-21 |
| Flip branch protection to `strict: true` on main; done when a stale-base PR is blocked until updated | @Zaal | Setting | 2026-08-18 |
| Add `Build` to main's required checks; done when protection lists four contexts, not three | @Zaal | Setting | 2026-08-18 |
| Decide the "Block Saftey 1" ruleset - enable it or delete it; done when no disabled ruleset remains | @Zaal | Decision | 2026-08-20 |
| Evaluate GitHub merge queue as the single fix for all three inherited-green causes; done when a decision is recorded here | @Zaal | Decision | 2026-08-24 |
| **Decide USE or STOP on the VPS Ollama.** Either route the cheap loops at it, or stop the keepwarm cron and reclaim ~1 core and 1.8GB. Today we pay for it and call it zero times; done when either `fleet-brain.state` stops reading NO_CREDITS, or `ollama-keepwarm` is out of crontab | @Zaal | Decision + PR | 2026-08-20 |
| Decide where the cheap-AI tier actually lives, given that no always-on box can host a 7-8B model (VPS 2 cores/7GB and already busy, Pi 3GB, Mac not always-on); done when the ladder in `claude-usage.md` names a machine per rung | @Zaal | Decision | 2026-08-24 |
| Re-target doc 2264 migration step 5 from the VPS to the Pi, and install tailscale on the VPS; done when `tailscale status` lists srv1537940 | @Zaal | Ops | 2026-08-19 |
| Arm a persistent `Monitor` on the workflow-run feed so missing main CI surfaces same-day; done when a missing run produces a notification | @Zaal | Config | 2026-08-21 |

## Sources

All measured 2026-08-16 unless noted. Commands run directly against the named machines.

- VPS `srv1537940` over ssh: `nproc`, `free -g`, `df -h`, `/proc/loadavg`, runtime `--version` probes, `curl 127.0.0.1:11434/api/tags` [FULL]
- Pi `ansuz` over ssh: same command set [FULL]
- `gh api repos/bettercallzaal/ZAOOS/branches/main/protection` [FULL] - required contexts, `strict`, `enforce_admins`, reviews
- `gh api .../rulesets` [FULL] - "Block Saftey 1", disabled
- `gh api .../actions/runs?event=schedule` [FULL] - the 2026-08-15T07:09 run
- `gh api .../actions/runs?head_sha=<current main>` [FULL] - 0 runs
- `gh api repos/bettercallzaal/ZAOOS/pulls/3069` [FULL] - merged
- `~/.claude/settings.json` and `.claude/settings.json` hook/key inventory; `ls` of both skills directories [FULL]
- `~/.zao/private/icm-registry.json` - 23 boxes enumerated [FULL]
- **useicm.com llm.txt endpoints, all 23 boxes, two independent sweeps [FAILED - HTTP 000, connection failure].** Control requests to `api.github.com` and `zaostock.com` returned 200 from the same shell, so this is specific to that host. Population and drift figures are therefore NOT reported. The one verified data point stands from 2026-08-13: `zaostock` returned 854 bytes.
- Doc 2264 for the prior estate baseline; not re-derived here [FULL, prior]

**Community sources: none, deliberately.** Every question in this audit is about our own machines and our own repository settings, where the ground truth is a command away. `confirm-before-claiming-absence.md` argues for spending verification effort on the cheapest and most certain thing to check, which is exactly this.
