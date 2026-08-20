---
topic: infrastructure
type: incident-postmortem
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: "2291, 2288, 2282, 2284, 2264"
original-query: "wall cards c1313d6f (fix VPS CPU spikes - 10 cheap-loop instances, load 10.46 on 2 cores, zero files written in 3 days) and d59c2cb9 (web-improve.service FAILED - root-cause, fix or decommission)"
tier: DEEP
---

# 2349 - The VPS loops burn two cores to produce nothing, and the reason is in their own error text

> **Goal:** Diagnose why 8-10 `cheap-loop.sh` instances hold a 2-core VPS at load ~11 while writing zero files, design the stagger/cap, and root-cause `web-improve.service`. Both cards are PR-only: every mutating command is listed for Zaal, none was run.

## The finding in one line

**Both model providers are down, the health probe does not detect it, and the loops retry forever.** The work never starts, so nothing is written; the retrying is the CPU load.

## Card c1313d6f - measured 2026-08-20

| Fact | Value |
|---|---|
| Load | **10.77 / 12.27 / 11.50** on **2 cores** (metawall measured 10.46 at 17:27) |
| Uptime | 15 weeks 6 days (~111 days) |
| `cheap-loop.sh` processes | **23**, across 8 named loops (bcz, maine, poidh, ww, wwafrica, zabal, zoe, zoostr) |
| Files written under `/home/zaal` in 3 days | **5,156** - and every one is probe exhaust, see below |
| `loop-provider.log` | **909,455 lines**, of which **345,593 contain "fail"** |
| Free RAM | **177 Mi** of 7.8 Gi |
| Ollama models resident | **1** (`qwen2.5:3b`) |
| `~/.zao/fleet-brain.state` | **`NO_CREDITS`** |

### The mechanism, with the evidence for each step

**1. OpenRouter has no credits.** `fleet-brain.state` reads `NO_CREDITS`. Doc 2264 measured the account at `total_credits: 60, total_usage: 60.21` on 2026-08-11 - overdrawn, and nine days later still is.

**2. The health probe reports it as available anyway.** The tail of `loop-provider.log`:

```
[2026-08-20 13:35:19] Probe complete: best=openrouter available=[ openrouter ollama]
[2026-08-20 13:35:20] wwafrica: loop wwafrica pinned to openrouter (per-loop override)
```

The probe checks reachability, not spendability. So it elects a provider that cannot serve a request, and the loops route there. This is `silent-failure-guard.md` rule 7 exactly: a health check that does not assert the capability it claims to prove.

**3. The local fallback cannot load a model either.** `cheap-loop.sh` documents its own failure mode at line 46:

> `ollama TIMED OUT after 120s loading $OLLAMA_MODEL. The service is UP - it answers /api/tags - but cannot load a model. Almost always RAM: check 'free -h', this VPS had 407MB free with ollama already holding 25%.`

**Free RAM is now 177 Mi - less than half the figure the script names as the failure threshold.** Ollama holds one 3B model and cannot admit another; doc 2291 measured that process averaging **104% CPU and 25.6% RAM over 18.9 days**, kept resident by an `ollama-keepwarm.sh` cron every 5 minutes.

**4. Codex and Claude health checks also fail.** Same log tail: `codex check failed`, `claude health check failed`. Every rung of the ladder in `claude-usage.md` is down at once.

**5. So each loop spins.** Probe -> elect a dead provider -> call -> fail (or hang to a 120s timeout) -> retry. 23 processes doing that on 2 cores is the load. 345,593 failure lines is the receipt. The loops never get past the model call to the part that writes anything.

## The correction that sharpened this - the 5,156 files are the probe, not the work

The first pass of this doc reported **0 files written in 3 days**, taken from metawall's `find`. metawall then corrected it: `find` reports **5,156** files, all under `~/.claude/projects/*.jsonl` and `.claude.json` backups - and read that as "the loops are running Claude sessions yet producing no repo output".

**Measured, it is neither.** Opening the largest transcript written in the last 24 hours:

```
file:  ~/.claude/projects/-home-zaal/ebb56cc3-...jsonl   (37 KB)
lines: 9
first user message:  "reply OK"
entry types: {queue-operation: 2, user: 1, attachment: 3, assistant: 1, last-prompt: 2}
```

**That is a health check, not a work session.** Nine lines. The 37 KB is system-prompt and attachment boilerplate; the entire exchange is `reply OK` and a reply. The three largest recent transcripts are all *exactly* 37 KB, which is what identical boilerplate with no real work looks like.

**419 such transcripts in 3 days, 132 in the last 24 hours** - roughly one every eleven minutes, per loop.

So the corrected finding is worse than either version:

- Not "produces nothing" (files exist).
- Not "runs Claude sessions that produce nothing" (no work session is ever started).
- **The fleet spawns a full Claude Code session - system prompt, attachments, the lot - every few minutes, purely to ask "reply OK", and then elects a provider that 402s.** The probe is the workload. The transcripts are its exhaust.

A liveness check that costs a whole agent session is not a cheap check. This is `noisy-signal-guard.md` from the other side: not a check that always fires, but a check that costs more than the thing it protects.

## OpenRouter, measured directly

metawall asked whether OpenRouter returns empty. It does not - it returns a clean, correct error that the callers are swallowing.

```
GET /api/v1/credits   ->  {"total_credits":70,"total_usage":70.207061849}
POST /api/v1/chat/completions  ->  HTTP 402
   {"error":{"message":"Insufficient credits. Add more using ...","code":402,
     "metadata":{"limit_source":"openrouter_credits", ...}}}
```

Three things follow:

1. **The key is valid.** A 402 is a billing rejection *after* successful authentication; an invalid key returns 401. So this is money, not credentials.
2. **Overdrawn by $0.21**, and the ceiling moved: doc 2264 measured `60 / 60.21` on 2026-08-11. It now reads `70 / 70.21`. **Someone added $10 in the interim and it is already spent.** A top-up without fixing the burn buys about a week.
3. **`zao-daily-tip.log` reports this as "no tip returned (openrouter empty)".** It is not empty - it is a 402 with an explanatory message and a remedy link. The script discards a precise error and substitutes a vague one, which is why nobody chased it. Same failure family as the probe: `silent-failure-guard.md`.

One detail worth acting on: the 402 body suggests *"lower max_tokens / prompt size to fit your remaining balance."* The loop directives are enormous - the `ww` loop's prompt is several thousand words carried on the process command line. Large prompts on every retry is part of what burned $70.

### Why this looked like a CPU problem and is not

The instinct is to cap concurrency. Concurrency is real - 23 processes against 2 cores and a single 3B model would contend even in the happy path - but **capping it would only make the loops fail more slowly.** Nothing is being computed. The fix has to start with the providers.

## The design: fix in this order, not the reverse

**Order matters. Steps 1-2 make the loops work; step 3 keeps them from doing this again.**

### 1. Restore a working provider (root cause)

Either top up OpenRouter, or make the local path viable by freeing RAM. Right now neither is available and the loops cannot succeed no matter how they are scheduled.

### 2. Make the probe assert spendability, not reachability

The probe must not elect a provider it has not proven can serve a request. For OpenRouter that means checking the credits endpoint (or treating a `NO_CREDITS` fleet-brain state as disqualifying) before marking it `available`. A probe that says `available` while `fleet-brain.state` says `NO_CREDITS` on the same box is the defect that turned an outage into a 909,455-line spin.

### 3. Cap, stagger, and back off

- **Cap concurrency to 1 against local Ollama.** 2 cores, one resident 3B model, 177 Mi free - there is no second slot. A lockfile (`flock`) around the model call is enough.
- **Stagger loop starts.** Offset each loop by a few minutes so probes and calls do not align.
- **Exponential backoff on repeated failure, with a stop.** `agent-loops.md` rule 5 already says empty-queue means zero spend, and `agent-spend.md` says two consecutive no-change ticks means stop rather than lengthen. Neither is being honoured: this loop set has failed continuously for at least three days without backing off. A loop that has failed N times in a row should sleep long, and after M should stop and page rather than retry.
- **Drop the 120s Ollama timeout** when RAM is known-short; failing in 10s costs a twelfth as much CPU per attempt.
- **Rotate `loop-provider.log`.** 909,455 lines on a box with 19 G free (doc 2291) is its own slow problem, and it is what made this diagnosable - so rotate it, do not delete it.

### 4. Reconsider the keepwarm

`ollama-keepwarm.sh` pins ~25% of RAM and about a core to keep a model hot for callers who are currently failing before they reach it. Doc 2291 raised this as a USE-or-STOP decision and it is still open. In the current state it is pure cost.

## Commands for Zaal - NONE of these were run

Everything below mutates a live box, which is Zaal's tap per the card. Listed exactly.

**Look before acting:**

```bash
ssh vps 'uptime; free -h; pgrep -af cheap-loop.sh | wc -l'
ssh vps 'tail -20 ~/.zao/loop-provider.log'
ssh vps 'cat ~/.zao/fleet-brain.state'
```

**Stop the spinning loops** (they are tmux/nohup shells, not systemd units - `pkill` by pattern is the handle):

```bash
# Dry run first - see exactly what would be signalled:
ssh vps 'pgrep -af "cheap-loop.sh"'
# Then stop them:
ssh vps 'pkill -f "cheap-loop.sh"'
```

**Stop the keepwarm cron** (edit, do not delete the file):

```bash
ssh vps 'crontab -l | grep -n ollama-keepwarm'   # find the line
ssh vps 'crontab -e'                              # comment that line out
```

**Free the RAM Ollama is holding, if you want the local path back:**

```bash
ssh vps 'systemctl --user stop ollama || sudo systemctl stop ollama'
ssh vps 'free -h'
```

**Rotate the log without losing it:**

```bash
ssh vps 'cp ~/.zao/loop-provider.log ~/.zao/loop-provider.log.2026-08-20 && : > ~/.zao/loop-provider.log'
```

> **Not proposed:** deleting any file, loop, or unit. `no-rm-rf.md` - deletion is Zaal's, and nothing here needs it.

## Card d59c2cb9 - web-improve.service

```
Active: failed (Result: exit-code) since Sat 2026-06-27 14:32:48 UTC; 1 month 23 days ago
Main PID: 869563 (code=exited, status=1/FAILURE)
CPU: 7.516s
Loaded: /home/zaal/.config/systemd/user/web-improve.service; static
```

**Root cause cannot be recovered from logs.** `journalctl --user -u web-improve` returns `-- No entries --`, with `Warning: some journal files were not opened due to insufficient permissions`. The unit failed nearly two months ago and its journal has rotated away. I am not going to invent a cause for a `status=1` with no output.

What can be said honestly:

- It is **not contributing to the CPU problem** - failed means not running, and lifetime CPU was 7.5 seconds.
- It has been dead **1 month 23 days and nobody noticed**, which is the same silent-failure pattern as the CI gap in doc 2291 and the ICM outage. Nothing watches unit health.
- The unit is **`static`** - no `[Install]` section - so it is not enabled at boot and cannot be `disable`d in the usual sense. It only ever ran when something invoked it.

**Recommendation: decommission.** Two months dead with zero noticed impact is the evidence. `project_web_improver` exists in memory but bettercallzaal.com has not depended on this since June. If Zaal wants it back, the honest path is to run it once by hand and read the failure fresh, because the original is gone.

```bash
# Reset the failed state so it stops showing red:
ssh vps 'systemctl --user reset-failed web-improve'

# OR run it once by hand to capture a live failure before deciding:
ssh vps 'systemctl --user start web-improve; sleep 20; systemctl --user status web-improve --no-pager'
```

## A constraint worth recording

**`~/bin` on the VPS is a git repo with no remote** (doc 2288), so `cheap-loop.sh` cannot be fixed by pull request from here - the design above is a specification, not a diff. That is itself the finding doc 2288 raised: the scripts running the fleet live on exactly one host, unbacked. Fixing the loops properly means giving that repo a remote first.

## Also See

- [Doc 2291](../2291-infra-capability-audit/) - the baseline: load 3.71, ollama 104% CPU / 25.6% RAM over 18.9 days, USE-or-STOP still open
- [Doc 2288](../2288-code-with-no-home/) - VPS `~/bin` has no remote
- [Doc 2282](../2282-fleet-output-audit/) - judged loops by what they WROTE; same lens, same answer
- [Doc 2264](../2264-mac-offline-always-on-migration/) - OpenRouter overdrawn on 2026-08-11
- `.claude/rules/silent-failure-guard.md` rule 7, `agent-loops.md` rule 5, `agent-spend.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide the provider: top up OpenRouter, or free RAM for local Ollama. Loops cannot succeed until one exists; done when a loop writes a file | @Zaal | Decision + spend | 2026-08-21 |
| Stop the spinning loops with the `pkill` above; done when `pgrep -af cheap-loop.sh` returns nothing | @Zaal | Ops tap | 2026-08-21 |
| Make the provider probe assert spendability - a `NO_CREDITS` fleet-brain state must disqualify OpenRouter; done when the probe stops electing it | @Zaal | Fix on VPS | 2026-08-24 |
| Give VPS `~/bin` a git remote so these scripts can be fixed by PR; done when `git -C ~/bin remote -v` shows one | @Zaal | Ops | 2026-08-24 |
| Add `flock` cap of 1 + stagger + backoff-with-stop to `cheap-loop.sh`; done when 8 loops never run 2 concurrent model calls | @Zaal | Fix on VPS | 2026-08-26 |
| Rotate `loop-provider.log` (909k lines); done when the live file is under 10k lines and the old one is preserved | @Zaal | Ops | 2026-08-21 |
| Make the liveness probe cheap - a health check must not spawn a full Claude session to ask "reply OK"; done when 24h produces far fewer than 132 probe transcripts | @Zaal | Fix on VPS | 2026-08-26 |
| Stop `zao-daily-tip.sh` reporting a 402 as "openrouter empty" - surface the real status; done when the log names the HTTP code | @Zaal | Fix on VPS | 2026-08-24 |
| Shrink the loop directives (the `ww` prompt is thousands of words on the command line, re-sent every retry); done when a directive is a file reference, not an argv payload | @Zaal | Fix on VPS | 2026-08-28 |
| Close out `web-improve.service` - `reset-failed` to decommission, or run once by hand to capture a fresh failure; done when it is not showing failed | @Zaal | Decision | 2026-08-22 |
| Settle the doc-2291 keepwarm USE-or-STOP; done when either loops call Ollama, or the cron is commented out | @Zaal | Decision | 2026-08-22 |

## Sources

All measured 2026-08-20 over ssh to the VPS. Nothing mutating was run.

- `uptime`, `/proc/loadavg`, `nproc`, `free -h` [FULL]
- `pgrep -af cheap-loop.sh` - 23 processes, 8 named loops [FULL]
- `~/.zao/loop-provider.log` - `wc -l` 909,455; failure tally 345,593; tail showing the probe electing openrouter [FULL]
- `~/.zao/fleet-brain.state` - `NO_CREDITS` [FULL]
- `curl 127.0.0.1:11434/api/ps` - one resident model, `qwen2.5:3b` [FULL]
- `grep -n` of `~/bin/cheap-loop.sh` - provider selection, the 120s timeout, and the self-documented RAM failure at line 46 [FULL]
- `systemctl --user status web-improve` + `journalctl --user -u web-improve` [PARTIAL - status FULL, **journal empty**: `-- No entries --` plus a permissions warning. Root cause is unrecoverable and is reported as such rather than guessed.]
- `git -C ~/bin remote -v` on the VPS - no remote, corroborating doc 2288 [FULL]
- `curl /api/v1/credits` and a real `POST /chat/completions` from the VPS [FULL] - 70/70.207 and HTTP 402 Insufficient credits; key valid (402 not 401)
- Largest 24h transcript opened and parsed: 9 lines, first user message `reply OK` [FULL] - the probe-exhaust finding
- `find ~/.claude/projects -name '*.jsonl' -newermt` [FULL] - 132 in 24h, 419 in 3 days
- metawall's 17:27 measurement (load 10.46, 10 loops, 0 files in 3 days) taken as given per the card and consistent with mine [PRIOR]
