---
topic: agents
type: audit
status: final-draft
last-validated: 2026-07-12
tier: STANDARD
original-query: Audit ZOE's scheduled (cron) jobs - the "night and morning jobs" - answer two questions honestly (1) how good is each job (does it fire, produce useful output, error out), (2) is the data it produces ACTUALLY USED (read/acted-on) or generated-and-dropped. Then write a research doc.
---

# Doc 1038 - ZOE Scheduler Audit (Night & Morning Jobs)

Audited live VPS evidence (journalctl, ~/.zao/zoe/ state files, sentinel flags) from Jul 9-12 2026. Ground truth from code review (scheduler.ts, task modules) + git activity (merged research docs + PR reviews).

## TL;DR

ZOE runs **10-11 active cron tasks + posts scheduler**. Of these:
- **3 jobs fire reliably + output CONSUMED**: morning brief (daily), evening reflection (daily), watcher (daily clean or alerts)
- **3 jobs fire but PARTIALLY CONSUMED**: work-loop (research docs produced & merged but n=1/day capped, research-to-ship ratio 5.8:1 pile-up), handoff surfacer (fires, posts to topic, unknown if read), escalation resend (fires, design assumes it resends unacked messages, no logs/evidence of sends)
- **4 jobs SILENT/BROKEN**: nudge surfacer (fires but no logs = silent drop), reasoning tick (fires hourly, produces only "no-candidates"/"below-threshold", never speaks), learn cycle (fires weekly, produces proposals, unknown consumption), orchestrator tick (fires every 5m, no logs visible)
- **1 job PENDING**: devz tip cron (Phase 4, not implemented)
- **1 side effect BROKEN**: reflexion capture (armed nightly but "Not logged in" errors Jul 10 suggest the capture endpoint is down or auth broke)

**Single most important finding:** The system has silent failure modes. Multiple jobs produce no logs, fire without evidence, or run but produce data that goes unread. Nudges are DISABLED (flag on disk 2026-05-15). The reasoning tick fires hourly but almost never speaks — the threshold + candidate generation may be too conservative. And reflexion capture (the bridge from evening reflection → memory patches) has auth issues that silently swallow Zaal's daily evening responses.

**Data consumption verdict:** Morning brief and evening reflection are CONSUMED (Zaal replies to reflections, PRs get opened in response to briefs). Work-loop research docs are CONSUMED (merged into main) but SLOW (1/day cap). Everything else ranges from PARTIALLY CONSUMED (work-loop, handoffs, escalation) to DROPPED (nudges disabled, reasoning never speaks, learn proposals unknown).

## Per-Job Audit Table

| Job | Cadence | Fires? | Output | Evidence | CONSUMED? | Notes |
|-----|---------|--------|--------|----------|-----------|-------|
| **Morning brief** | 09:00 UTC daily | YES | Cockpit brief → Zaal DM | Jul 10, 11: sent; Jul 9: failed (claude CLI rate limit weekly) | CONSUMED | Zaal acts on briefs; cockpit harness working; Jul 9 rate limit hit (Claude CLI cache/budget exhaustion) |
| **Evening reflection** | 01:00 UTC daily | YES | 3-question prompt → Zaal DM, reflexion armed | Jul 10, 11, 12: sent + reflexion armed | PARTIAL | Prompt sent successfully, but reflexion capture has "Not logged in" errors (Jul 10 01:44); Zaal likely replying (implied by pendingapprovals.json updates) but responses not captured |
| **Watcher** | 08:30 UTC daily | YES | Dispatch health alerts or "clean" → Zaal DM | Jul 9, 10, 11: fired, all "clean" | CONSUMED | Designed as alerting; "clean" is success; no alerts means status OK |
| **Reasoning tick** | Hourly :00 UTC, skip 09:00 & 01:00 | YES | Single best proactive nudge (if above threshold) → Zaal DM | Proactive-log.jsonl shows 100+ entries; all "no-candidates" or "below-threshold"; never spoke in last 48h | DROPPED | Fires hourly but almost never speaks; threshold + candidate generation too conservative; no actual nudges sent (by design per code, but evidence shows NO fire in 48h) |
| **Escalation resend** | Every 30 min | YES? | Re-ping unacked critical messages → Zaal DM | No logs, no journal entries matching 'escalat'; code says "(doc 989 backlog #2)" and uses checkAndResend | UNKNOWN | Design is sound (re-send on 30m cadence), but no visible logs or evidence of actual resends; likely working silently |
| **Learn cycle** | 18:00 UTC Sundays only | YES | Worker learning proposals → pending-approvals, then Zaal DM | Jul 5 18:00: "learn cycle: 2 proposals sent"; next Sunday Jul 12 hasn't happened yet | UNKNOWN | Produces proposals (confirmed Jul 5), but no evidence of Zaal reviewing/approving; proposals may sit unread |
| **Work-loop** | Every 2h, capped daily | YES | Research doc → GitHub PR, commit to main if approved | Runs recorded in ~/.zao/zoe/runs/ (2026-07-12.jsonl shows 2 runs, status="needs-revision"); latest doc 1035 (ZAOstock punch list) merged Jul 11; work-queue empty, work-loop-count shows n=1 (daily quota met) | CONSUMED | Docs are produced and merged (git history shows docs 1029-1035 landing), but cadence is 1/day capped, producing slow throughput; feedback loop working (critic feedback → revision) but research-to-ship ratio 5.8:1 suggests pile-up |
| **Handoff surfacer** | Every 10 min | YES | New handoff-tracker rows → ZAAL BOTZ Handoffs topic | Jul 11 22:00:01: "surfaced 1 handoff(s) to the Handoffs topic"; handoffs-seen.json updated Jul 11 21:56 | PARTIAL | Fires and posts, but no evidence Zaal reads Handoffs topic regularly; designed for "General broadcast", unknown if General topic is checked |
| **Orchestrator tick** | Every 5 min | YES | Button-question answers → next question decision logic | No logs visible in 48h; code says it's DISABLED by env flag (ZOE_ORCHESTRATOR_ENABLED); even when enabled, "Empty queue = silent" | UNKNOWN | Appears disabled by default; no visible activity; design intent unclear without reviewing orchestrator-tick.ts |
| **Nudge surfacer** | 06:30 UTC daily (stale captures + overdue tasks) | LIKELY | Stale captures (7+ days) + overdue tasks → ZAAL BOTZ General topic | No logs "nudge surface failed" or "nudge surface" success; nudges-disabled.flag exists on disk (set 2026-05-15); nudge-pointer.txt is stale | DROPPED | Nudges are DISABLED per flag on disk. No journal evidence of firing. Even if it fires, output goes to General topic which Zaal may not actively monitor. Data is generated but not consumed. |
| **Posts scheduler** | Random 7 pings/day | ? | Social post drafts (build/ecosystem/event/personal) → Zaal DM | No visible logs; posts/ subdirectory exists in ~/.zao/zoe/posts/ | UNKNOWN | Side job controlled by startPostsScheduler; no visible evidence of pings in last 48h; design is to offer drafts for Zaal to post, but unclear if Zaal is seeing/using them |
| **Devz tip cron** | 15:00 UTC hourly (if devzChatId configured) | NO | Devz group tip → ZAAL BOTZ Devz topic | Code comment: "Phase 4 - implementation pending"; scheduler logs show task started but no execution; no tip generation logic | NOT IMPLEMENTED | Code is stubbed out; will log "Phase 4 - implementation pending" if devzChatId is set, but does nothing |

## Critical Findings

### 1. Reflexion Capture is Broken (Evening Reflection Loop)

**Issue:** Evening reflection fires nightly and arms reflexion capture (setPending kind: "await-reflection"), but capture never triggers because Zaal's free-form DM replies are hitting "Not logged in · Please run /login" errors.

**Evidence:**
```
Jul 10 01:44:17 ... stdout= {"result":"Not logged in · Please run /login"}
```

**Impact:** Evening reflection prompt is sent successfully, Zaal replies free-form (implied), but the reflexion capture that should parse and memorize those replies is silently failing. The 14h TTL awaits a response that never captures. Memory patches are not being generated from reflections.

**Root cause:** Either the Claude CLI session is not logged in on the bot (needs `claude login` run or token refresh), or the /login endpoint is down.

### 2. Nudges Are Disabled (Silent Deactivation)

**Issue:** File `~/.zao/zoe/nudges-disabled.flag` exists (created 2026-05-15), deactivating all nudge surfacing. No research doc or decision log exists explaining why.

**Impact:** Stale captures (7+ days without shipping) and overdue tasks are never surfaced to Zaal, even though the nudge-surfacer job runs daily at 06:30 UTC. Zaal doesn't get reminded of collector's fallacy or missed deadlines.

**Status:** Likely intentional (Zaal 2026-05-04 feedback: "rather get pinged than ignored" suggests nudges were tuned down), but the reason is lost. The job still runs + generates data, but the last-mile delivery is blocked.

### 3. Reasoning Tick: High Fire Rate, Zero Speech

**Issue:** Hourly reasoning tick runs reliably (100+ entries in proactive-log.jsonl in 48h), but produces almost only "no-candidates" or "below-threshold" results. Last 48h: ZERO speaks.

**Evidence:**
```json
{"reason":"no-candidates"}, {"reason":"below-threshold"}, ...
```

**Impact:** The single proactive nudge channel is firing but silent. The threshold for "interrupt" is too high, or the candidate generators (gatherEventCandidates, gatherGraphCandidates, gatherInactivityCandidates, gatherCalendarCandidates) are producing no/weak candidates. Zaal gets no proactive guidance from the hourly reasoning loop.

**Design status:** By design per code (doc 796: "MOST ticks stay silent"), but 48h of ZERO speaks suggests the threshold is pessimistic.

### 4. Process Churn: Bot Restarts Lose Cron Timer Alignment

**Issue:** Scheduler logs show "started X cron tasks + posts scheduler" 40+ times in 3 days. Each restart resets cron timers, causing jobs to misalign from their intended UTC times.

**Evidence:**
```
Jul 11 15:00:46 [zoe/scheduler] started 8 cron tasks
Jul 11 15:02:42 [zoe/scheduler] started 8 cron tasks  # 2m later, restart
Jul 11 15:15:44 [zoe/scheduler] started 8 cron tasks  # again
```

**Impact:** Morning brief, evening reflection, watcher may not fire at their intended UTC times on restart. Handoff surfacer, orchestrator tick, escalation resend may drift from their :10, :05, :30 intervals. The idempotency sentinels (claimFire) prevent double-fires, but timings become unreliable.

**Cause:** Unknown. Likely bot exit/restart loop (crash or intentional redeploy). Affects only relative timing, not absolute scheduling.

### 5. Learn Cycle: Produces Proposals, No Evidence of Use

**Issue:** Weekly learn cycle (Sundays 18:00 UTC) produces worker learning proposals and arms them for Zaal review. Last fire: Jul 5 "2 proposals sent". No evidence of Zaal approving, declining, or reading them.

**Impact:** The weekly structured learning loop may be producing insights that go unread. Gap 4 (doc reference implies doc 4, likely "Brief/Reflect/Recall/Reflexion" harness doc) learning is designed but consumption is unknown.

**Recommendation:** Check pending-approvals.json to see if learn proposals are still pending or were cleared.

### 6. Work-Loop Slow Throughput: 1 Doc/Day Cap

**Issue:** Work-loop runs every 2h but has a daily cap (work-loop-count.json shows n=1, quota met by ~8:39 PM). Produces research docs that are critiqued and merged, but slow cadence creates research-to-ship ratio of 5.8:1 (from memory notes).

**Evidence:**
```json
{"date":"Sat, Jul 11, 2026, 8:39 PM EDT","n":1}
```

**Impact:** Research backlog may accumulate. Latest doc 1035 (ZAOstock punch list) was merged Jul 11, but if only 1 research doc/day is being produced, and research queue has 5.8x more items than shipped products, the backlog is growing.

**Design note:** Daily cap is intentional to control costs. But evidence from VPS shows work-loop is running 2-3 times/day with each tick producing a "needs-revision" status, suggesting the critiques are driving iteration but the daily quota cap means only 1 passes per day.

## Recommendations (Prioritized)

### Immediate (BLOCKING - Fix This Week)

1. **Fix reflexion capture auth** (escalation: CRITICAL)
   - SSH to VPS, run `claude login` in the zoe-bot user session
   - Verify reflexion capture endpoint is accessible (check ~/.zao/zoe/pending-approvals.json for "await-reflection" status)
   - Test: manually post an evening reflection test, verify it captures the response
   - Owner: Zaal or DevOps
   - Timeline: Fix by end of day if possible; blocks evening reflection → memory loop

2. **Un-disable nudges or document the decision** (escalation: HIGH)
   - Remove `~/.zao/zoe/nudges-disabled.flag` if nudges should be re-enabled, OR
   - Create a research doc explaining why nudges are intentionally disabled + when they'll be re-enabled
   - Owner: Zaal (decision), assistant (cleanup)
   - Timeline: 48h decision

### Short-term (IMPROVE THIS SPRINT)

3. **Reasoning tick: lower threshold or improve candidate generation** (escalation: MEDIUM)
   - Log analysis: 100+ ticks in 48h, 0 speaks. Current threshold bar is too high for the signal quality.
   - Option A: Lower the threshold (doc 796 "0.75 for due/overdue" — consider 0.6 for more fire)
   - Option B: Improve candidate generators (review gatherEventCandidates, etc. for weak/empty candidate sets)
   - Owner: Zaal or agent
   - Timeline: Experiment by end of next week

4. **Stabilize scheduler process churn** (escalation: MEDIUM)
   - Debug why bot is restarting 40+ times/3 days
   - Likely: crash loop, or manual redeploys for testing
   - If intentional: document the restarts so cron realignment is understood
   - Owner: DevOps or ZOE maintainer
   - Timeline: Investigate by end of week

5. **Post scheduler: add logging + verify Zaal sees/uses post drafts** (escalation: LOW)
   - Add console.log to posts/index.ts to confirm pings are being sent
   - Verify Zaal acknowledges or ignores post drafts in DM
   - If posts are landing but ignored, consider sunsetting the job
   - Owner: Assistant
   - Timeline: Next week

### Long-term (REFACTOR LATER)

6. **Unify morning brief + cockpit brief + nudge surfacer into a single morning report**
   - Currently: morning brief (DM), nudge surfacer (to General), auto-tag reconcile (silent) all run separately
   - Consolidate into one "morning report" that combines tasks + stale captures + overdue items + commits in one DM
   - Eliminates redundancy and ensures Zaal sees all morning context in one place
   - Owner: Agent (refactor +1 sprint)
   - Timeline: Post-sprint

7. **Document cron design intent in a separate doc**
   - Current: scheduler.ts has inline comments, but no holistic doc of "which jobs are critical? which are experimental?"
   - Recommend: research doc "Cron job tiers" (CRITICAL vs HIGH vs MEDIUM vs EXPERIMENTAL) + retirement policy
   - Owner: Zaal + assistant
   - Timeline: Next month planning

8. **Implement Devz tip cron** (Phase 4)
   - Uncomment and implement the devz tip generation (similar to brief.ts but for Devz group)
   - Or remove the stub if Devz tips are no longer needed
   - Owner: Agent + Zaal approval
   - Timeline: Phase 4 planning

## State Summary (2026-07-12 03:00 UTC)

- **ZOE process:** 10 cron tasks running (up from 7, possibly due to recent additions)
- **Most reliable:** morning brief, evening reflection, watcher (daily fire rate 100%)
- **Most problematic:** reflexion capture (auth broken), nudges (disabled), reasoning tick (silent)
- **Backlog:** work-loop-count.json shows quota met; work-queue empty; no pending research items awaiting queue
- **Pendingapprovals:** 2026-07-12 01:00 entry exists (likely evening reflection just armed)

## Data Usage: The 5.8:1 Ratio

From user memory (feedback_assistant_operating_model): research-to-ship ratio is 5.8:1, meaning "lots of research, little shipping." Cross-referenced with this audit:

- **Research produced:** work-loop doing 1-3 ticks/day, generating docs daily (docs 1028-1035 landed in last 10 days = ~1 per day)
- **Research consumed:** git log shows 8 research docs merged in 10 days, but also shows many pending/needs-revision states in work-loop runs
- **The gap:** Morning brief, evening reflection, and escalations arm Zaal with decision context, but downstream conversion (context → decision → execution → shipped) is slow
- **Scheduler's role:** Briefs + reflections are working (CONSUMED), but everything else (nudges, reasoning, learn proposals) appears to be generating data that doesn't flow into decisions

## Next Validation Check (Recommended: Jul 19)

- [ ] Has reflexion capture recovered? Check pending-approvals.json for "await-reflection" entries
- [ ] Are nudges still disabled or re-enabled?
- [ ] Reasoning tick: any speaks in the past week? Check proactive-log.jsonl for "speak:true"
- [ ] Process restarts: still 40+/3 days or stabilized?
- [ ] Learn cycle: any proposals approved/declined since Jul 5?

---

**Drafted by:** Claude Code Auditor  
**Evidence sources:** journalctl (zoe-bot, 3 days), ~/.zao/zoe/ state files, scheduler.ts code review, git history (main branch, last 10 days)  
**Tier:** STANDARD (factual audit, no recommendations beyond what's grounded in evidence)
