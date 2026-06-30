---
topic: agents
type: design
status: research-complete
last-validated: 2026-06-30
related-docs: 601, 759, 899, 734
original-query: "Design the NEXT autonomous-loop architecture for Zaal's ZAO workflow. PUBLIC sources where relevant, cite, no fabrication, no emojis, no em dashes."
tier: DISPATCH
---

# 927 - Next-Generation Autonomous-Loop Architecture

> **Goal:** Replace the current single-threaded, time-based `/loop` with a server-side, event-driven, multi-track orchestrator that keeps the ZOE brain always running + mirrors Zaal's observed preference for ZOE to be the primary dispatcher (not a side agent). Design the loop itself as a stateful process, not a Mac session task.

## Headline Recommendation

**Migrate from Mac `/loop` skill (reactive time-based) to VPS-resident ZOE orchestrator (event-driven multi-track).** The loop becomes a persistent `zoe-loop` systemd unit on 31.97.148.88, running continuously with sub-processes for research, fleet-health, PR-babysitting, and outreach. Watcher + Critic act as in-process supervisors (no separate agents). Human gates remain on PRs to main, outbound posts, and on-chain spend. Deploy in 3 phases over 6-8 weeks.

---

## 1. Loop LOCATION: Mac skill vs VPS process

### Current state (today)
- `/loop` skill: Claude session on Mac that wakes on a cron schedule (~25min repeating)
- Checks ZOE Telegram health
- Dispatches a single research sub-agent if a task is fresh
- Commits docs, opens a PR, or holds
- Single-threaded: if research takes 60min, next health check is delayed 60min
- Questions to Zaal routed via ZOE Telegram

### Design options

| Option | Shape | Pros | Cons | Recommendation |
|--------|-------|------|------|-----------------|
| Keep Mac `/loop` | Single-threaded Claude session waking on schedule | No VPS load; Zaal can kill with ctrl-c | Fragile to Mac sleep/reboot; serial bottleneck; session timeout risk; can't parallelize | NO |
| Move to VPS as standalone process | `zoe-loop` as a Node.js script spawned by systemd | Always on; survives Mac disconnect; can use child processes for parallelism | Must implement process lifecycle ourselves (restart/monitor/log) | PARTIAL |
| Integrate loop INTO ZOE's orchestrator | Loop logic becomes the top-level `index.ts` dispatcher in `bot/src/zoe/` | ZOE becomes the brain (not a concierge); single source of truth; inherits all Hermes/Letta patterns | Bigger refactor; needs Bonfire wiring before it's safe; ZOE is already 2000+ LOC | RECOMMENDED |

**Recommendation:** Option 3 - Integrate the loop into ZOE so the orchestrator itself IS the autonomous loop. ZOE's current evening `reflect.ts` becomes the loop-check tick; the Telegram concierge becomes a synchronous read/write surface that feeds into the loop. This is what Zaal intuitively wants when he says "ZOE runs and orchestrates everything."

---

## 2. TRIGGER model: time-based vs event-driven vs hybrid

### Current trigger (time-based)
- `/loop` wakes every 25min on the Mac
- Checks if anything changed (task queue, fleet status)
- If yes, runs; if no, idles

### Event-driven signals to consider

| Event | Source | Latency | Value | Implementation |
|-------|--------|---------|-------|-----------------|
| Telegram message from Zaal | Telegram MCP hook | <5sec | High (direct request) | Already works via concierge |
| New task added | Telegram or `/zg` command | <10sec | High | Task queue subscriber in ZOE |
| Fleet alert (agent down, high cost) | VPS systemd/health monitor | <30sec | High (operational) | Webhook into ZOE from ecosystem-monitor |
| PR opened on main | GitHub webhook | <10sec | High (code review) | Add GitHub App webhook -> ZOE |
| Bonfire memory unlabeled | Bonfire API event | <60sec | Medium (research backlog) | Polling OK here |
| Research doc published | Research gate PR merged | <10sec | Medium (feedback loop) | Git hook -> ZOE |
| Scheduled (morning brief, evening reflect) | Cron | Daily/nightly | Medium | Keep existing scheduler in `scheduler.ts` |

### Recommended trigger model: Hybrid (event + scheduled)

- **Immediate (event-driven):** Telegram messages from Zaal, fleet alerts, PR opened, task created -> ZOE wakes and processes
- **Scheduled (cron):** Morning brief (5am EST), evening reflect (9pm EST), weekly learn cron (Sundays 11am EST)
- **Batching rule:** Queue incoming events; process once per 2-3 minutes to avoid thrashing on rapid-fire Telegram. Same rule applies for the Mac `/loop` currently.

**Implementation:** In `bot/src/zoe/index.ts`, replace the current "listen for one Telegram message then reply" with a state machine that:
1. Receives a Telegram message
2. Adds it to a queue if processing is underway
3. Spawns a `processQueue()` goroutine that wakes every 2-3min
4. Within `processQueue()`, calls the orchestrator with all pending events

---

## 3. MULTI-TRACK parallelism: structure without conflicts

### Current single-track problem
- If a research task runs 60min, PR babysitting is blocked 60min
- No concurrent work on independent domains (research + comms + fleet health)

### Proposed multi-track structure (without 409 conflicts learned this session)

```
ZOE Orchestrator (main process)
├── Track 1: Incoming requests (Telegram, fleet, GitHub)
│   └── Decompose -> Route -> Dispatch
├── Track 2: Research queue (long-running sub-agents)
│   └── Claim a task -> Dispatch `/zao-research` -> Monitor -> Integrate result
├── Track 3: Fleet health (read-only monitoring)
│   └── Poll VPS every 5min -> Aggregate status -> Decide if alert
├── Track 4: PR babysitting (watch for merges, post-fix follow-up)
│   └── Poll GitHub every 2min -> Trigger on merge -> Call Hermes if needed
└── Track 5: Bonfire memory refresh (low urgency)
    └── Poll unlabeled episodes -> Cluster -> Suggest labels

Resource guard per track:
- Research: only 1 active sub-agent per track (queue if blocked)
- Fleet: read-only, no conflicts
- PRs: gate on "no other PR modifying main right now"
- Bonfire: read-only, no conflicts
```

**The 409 conflict lesson:** Only Track 1 and Track 4 touch git/GitHub. Add a file-based lock `~/.zao/zoe-git.lock` (or use Supabase row lock on a "git-semaphore" table). When Track 1 needs to commit, it tries to acquire the lock; if held by Track 4, it queues and retries in 30sec. Same for Track 4.

**Cost guard:** Each track gets a weekly budget (sum across all tracks = $50/week). Track 2 (research) gets 60% (long sub-agents), Track 1 gets 20% (decomposer), others get 10% each.

---

## 4. WATCHER + CRITIC integration (Zaal's vision)

### What Zaal wants
- A persistent agent watching all sub-agents (progress, stalls, cost overruns)
- A critic that gates output before it ships/posts (research doc, PR, Telegram message)

### Current state
- Hermes has a critic.ts that scores code 0-100 before PRing
- ZOE has no equivalent for non-code output
- Gap 3 from doc 759 lists missing critics: research-critic, comms-critic, task-result-critic

### Recommended design: In-process supervisors (not separate agents)

Instead of spawning "WatcherAgent" and "CriticAgent" as separate sub-processes, make them first-class singletons in `bot/src/zoe/`:

**Watcher module** (`watcher.ts`):
- Maintains a heartbeat table in Supabase: `{ track_id, last_ping, status, current_task, cost_ytd, token_count }`
- Every 30sec, each track appends a ping
- On 5-min silence from a track, auto-escalates to Zaal via Telegram: "Research task 12 stalled for 5min, last log line was X"
- On cost overrun (track reaches 80% of budget), escalates to Zaal: "Track 2 research is at $30 of $35 budget this week, consider pausing?"

**Critic modules** (as system-prompt variants of the Hermes critic):
- `code-critic.ts` (already exists in Hermes as `critic.ts`)
- `research-critic.ts` - reads research-doc markdown, checks hard reqs 1-12 from `/zao-research`, scores 0-100, recommends changes
- `comms-critic.ts` - reads draft message/post, checks brand.md voice rules + no-unauthorized-commitments, scores 0-100
- `task-result-critic.ts` - reads "completed this task: [output]", checks if the goal is met, scores 0-100

Each critic returns `{ score, feedback, pass_threshold }`. If score < 70, the output is queued for revision (research: revise and resubmit; comms: draft flagged for Zaal approval; code: Hermes coder tries again).

**Gate rule:** No output ships without passing its corresponding critic, except:
- Telegram messages to Zaal (immediate, ungated; Zaal can ask for edits)
- Research docs (gated by research-critic; if <70, queued for revision before commit)
- Posts to social (gated by comms-critic; if <70, drafted for Zaal approval)
- Code (gated by Hermes code-critic; if <70, coder re-attempts)

---

## 5. SAFETY rails: what stays human-gated

### Current gates (solid, keep)
- PRs to main: gated by Hermes coder + critic (score 70+) + explicit approval via `/ship` or `y/n` prompt
- On-chain spend: no agent can spend tokens/sign txs; must route through ZOE -> ask Zaal -> execute only on approval
- Wallet keys: never agent-accessible (not in env; only at runtime for execution)

### Proposed new gates
- **Outbound messages to third parties:** No agent can DM/email/Telegram anyone but Zaal. Flag any draft that names a recipient outside the Zaal/ZAO inner circle; route to Zaal for approval before send.
- **Irreversible deletions:** No agent can delete code, docs, or data without Zaal approval. Equivalent: "git reset --hard" or "DROP TABLE" require human confirmation.
- **Bonfire episodes:** Research-critic gates these before POST. If <70, queued.

### What CAN be autonomous (no gate required)
- Research doc drafting + Bonfire POST (gated by research-critic, not Zaal)
- Internal memo/capture notes to Zaal (unmoderated Telegram to Zaal; he reads async)
- Fleet health checks + alerts (read-only, informational)
- PR review + inline comments (gated by comms-critic + Hermes critic, inform Zaal via Telegram but don't block the comment)
- Local git commits to branches (gated by code-critic + Hermes, inform Zaal, PRs still require human)

### The bootstrap trust model
Treat the first 2 weeks of server-side loop like a probation: Zaal watches the Supabase audit log (`zoe_audit_trail`) to see what decisions the watcher + critics are making. If any gate is silently skipped or a decision looks wrong, add it to `human.md` as a corrective fact ("Don't do X without asking me"). Over time, ZOE learns the implicit guardrails.

---

## 6. MIGRATION: 3-phase path from Mac `/loop` to server-side orchestrator

### Phase 1: Wiring (Week 1-2)
**Goal:** VPS ZOE can dispatch multi-track work; Mac `/loop` still active as safety net.

1. **Define Track 2-5 dispatcher** (`bot/src/zoe/dispatcher.ts`): given an event (Telegram message, fleet alert, PR opened), decide which track(s) should wake
2. **Stub Track 2 (research):** Create research-queue table in Supabase with `{ task_id, status, dispatched_at, result_url }`. When ZOE sees "research X," insert into queue and stub a `Track2Worker` that polls it.
3. **Stub Track 3 (fleet):** Wire ecosystem-monitor digest to send a Telegram message to ZOE Telegram group every 30min (status snapshot). ZOE parses and escalates if DOWN.
4. **Stub Track 4 (PRs):** Add GitHub webhook receiver to ZOE. On PR opened, log to Supabase. On PR merged, log + trigger post-merge Hermes check.
5. **Add file lock:** Create `~/.zao/zoe-git.lock` pattern for Track 1 and Track 4 to serialize git operations.

**Test:** Run VPS ZOE and Mac `/loop` in parallel for 1 week. Observe: do multi-track events dispatch correctly? Do locks prevent conflicts?

### Phase 2: Safety rails (Week 3-4)
**Goal:** Implement watcher + critic modules so output is gated.

1. **Watcher** (`bot/src/zoe/watcher.ts`): create heartbeat table, add pings from each track, implement 5-min-silence escalation + cost-overrun alert.
2. **Research-critic** (`bot/src/zoe/critics/research-critic.ts`): read research doc markdown, check hard reqs 1-12, return score + feedback. Gate Bonfire POSTs on score >= 70.
3. **Comms-critic** (`bot/src/zoe/critics/comms-critic.ts`): read draft message, check brand voice + safety rules, return score. Flag <70 for Zaal approval.
4. **Task-result-critic** (`bot/src/zoe/critics/task-result-critic.ts`): read task output, check goal-met, return pass/fail.
5. **Audit log** (Supabase table `zoe_audit_trail`): every critic decision, watcher alert, lock contention, and cost-check logged. Zaal reviews daily.

**Test:** Submit a research task via Telegram, watch it flow: decompose -> dispatch -> Track 2 -> research-critic -> queue for revision if <70 -> Zaal approval for POST -> Bonfire.

### Phase 3: Cutover + learning (Week 5-6)
**Goal:** Mac `/loop` stands down; VPS ZOE is primary orchestrator. Reflexion + learning loops activate.

1. **Decommission Mac `/loop`:** Disable the skill schedule. Keep the code in git for emergency rollback, but don't activate.
2. **Bonfire labeling unblock:** Verify Bonfire admin flow is working (episodes auto-label via research-critic). If not, escalate to Bonfire team (doc 899 known blocker).
3. **Reflexion loop** (`bot/src/zoe/reflexion.ts`): activate evening reflection. On Zaal's replies, auto-update human.md if facts change. Ask for approval before writing.
4. **Weekly learn** (`bot/src/zoe/learn.ts`): clustering of Hermes runs + critic feedback. Identify top 3 failure modes, propose patches to coder prompt.
5. **Load test:** Run vPS ZOE for 1 week under realistic load (2-3 research tasks/day, 4-5 PRs/week, daily fleet checks). Monitor Supabase usage, Claude API costs, systemd resource footprint.

**Rollback:** If VPS ZOE crashes or becomes unreliable, instantly re-enable Mac `/loop` via the skill. The two are designed to coexist during Phase 1-2 cutover.

---

## 7. Cost discipline & resource budgets

Adopt the Hermes `FLEET_DAILY_USD_CAP` pattern (doc 734, currently $20/day).

**Proposed weekly budgets:**

| Track | Budget | Rationale |
|-------|--------|-----------|
| Track 1 (decompose/route) | $10/week | Sonnet-class work, bounded prompts |
| Track 2 (research) | $30/week | Long sub-agent chains, Opus on strategy |
| Track 3 (fleet) | $3/week | Read-only, lightweight LLM parse |
| Track 4 (PR watch) | $5/week | Hermes already self-caps; this is overflow |
| Track 5 (Bonfire refresh) | $2/week | Batch polling, no real-time requirement |
| **Total** | **$50/week** | ~$200/month; sustainable for 1-person lab |

**Enforcement:** Each track has a `CurrentWeekCost` stored in Supabase `zoe_tracks` table. Before dispatching work, check remaining budget. If track is at 90%, escalate to Zaal. If at 100%, queue the task.

---

## 8. Observability & tuning knobs

### Metrics to expose in Supabase

- `zoe_tracks` table: track_id, last_ping, status, current_task, cost_ytd, token_count, avg_latency_ms
- `zoe_audit_trail` table: timestamp, event_type (critic-gate, watcher-alert, lock-contention, cost-check), event_data JSON, actor
- `zoe_critic_scores` table: timestamp, input_type (code/research/comms/task), score, feedback, approved_by_zaal, applied_at

### Tuning knobs (config in `.env` or Supabase)

```
ZOE_TRACK_POLL_INTERVAL_MS=120000       # How often each track wakes
ZOE_WATCHER_SILENCE_THRESHOLD_MS=300000 # 5 min before escalating
ZOE_CRITIC_PASS_THRESHOLD=70            # Score to pass a critic gate
ZOE_BATCH_SIZE_PER_TRACK=3              # Max concurrent tasks per track
ZOE_COST_WEEKLY_CAP_USD=50              # Total weekly cap
ZOE_COST_TRACK_ALLOCATION_PCT="1:6:1:1:0.4"  # Tracks 1-5 split
```

**Weekly review:** Zaal reads the Supabase dashboard and tunes knobs if needed. Example: "research tasks are taking too long because I'm setting the critic threshold too high; lower to 65."

---

## Timeline & Blockers

| Phase | When | Blocker |
|-------|------|---------|
| Phase 1 (Wiring) | 2026-07-07 to 2026-07-14 | None (can ship in parallel with Phase 2) |
| Phase 2 (Safety rails) | 2026-07-14 to 2026-07-28 | Bonfire admin unblock (known issue in doc 899) |
| Phase 3 (Cutover) | 2026-07-28 to 2026-08-04 | Reflexion + learn testing (can defer to post-cutover tuning) |
| **Go-live** | **2026-08-04** | All 3 phases shipped, 1-week load test green |

---

## Next Actions

| Action | Owner | Effort | Priority |
|--------|-------|--------|----------|
| Approve migration strategy (this doc) | @Zaal | - | Blocking |
| Design Track 2-5 dispatcher logic | @Claude | medium | High |
| Create Supabase schema (heartbeat, audit, cost tables) | @Claude | small | High |
| Implement Phase 1 wiring (dispatcher + queues + locks) | @Claude | medium-large | High |
| Review with Zaal: cost budgets + gate rules | @Zaal | - | High |
| Bonfire admin: unblock labeling flow | @Zaal + Bonfire | - | Blocking for Phase 2 |
| Implement Phase 2 critics (research, comms, task-result) | @Claude | medium | Medium |
| Load test + tune Phase 3 before cutover | @Claude + @Zaal | medium | Medium |

---

## Sources

- [FULL] Doc 759 - ZOE orchestrator gap analysis (decompose, dispatch, critics, reflexion, learn)
- [FULL] Doc 899 - ZOE agent-fleet audit (confirms ZOE orchestrator is built; gaps are wiring/experience)
- [FULL] `bot/src/zoe/index.ts` + `reflect.ts` + `concierge.ts` - current ZOE loop structure
- [FULL] `bot/src/hermes/runner.ts` + `critic.ts` - orchestrator + critic pattern (model for multi-track)
- [FULL] `bot/src/zoe/scheduler.ts` - existing cron trigger pattern (to extend for Phase 1)
- [PARTIAL] Anthropic "Building Effective Agents" essay - event-driven dispatch + orchestrator-worker pattern
- [PARTIAL - unverified, directional] Solo-operator fleet research (doc 899 external scan) - confirms orchestrator + 3-4 specialists, cost caps as standard pattern
- Memory: project_zoe_orchestrator_locked.md, project_zoe_soul_architecture.md, feedback_validate_bot_changes_with_boot.md (systemd + boot-verify lessons)
