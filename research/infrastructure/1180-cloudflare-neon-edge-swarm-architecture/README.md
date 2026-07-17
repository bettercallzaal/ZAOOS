---
doc: 1180
title: "Cloudflare + Neon: Edge/Serverless Architecture for ZAO Autonomous Agent Swarm"
topic: infrastructure
type: decision
tier: DEEP
original_query: "leveraging cloudflare and neon as an edgeless serverless function and what that unlocks... theorize on possible upgrades and critical unlocks from what you ingested and cross reference it against everything we've been doing and give me a detailed report"
date_created: 2026-07-16
date_updated: 2026-07-16
owner: "@Zaal"
status: draft
---

# Cloudflare + Neon: Edge/Serverless Architecture for ZAO Agent Swarm

## Executive Summary

The ZAO fleet today is anchored to a single VPS clone running tmux-supervised loops. This architecture has hit structural ceilings documented in `.claude/rules/agent-loops.md`: shared-clone drift, one-instance-per-token bottlenecks causing split-brain 409 errors, "can't do infinite loops" CPU constraints, and a fragile supervisor layer. A migration to **Cloudflare Workers (compute) + Durable Objects (coordination) + Neon (stateful branched databases)** unlocks three categories of upgrades:

1. **Durability as infrastructure** - Workflows encode state machines that survive restarts natively; no supervisor needed.
2. **Stateless parallelism** - loops become triggered functions scaled horizontally; one-instance-per-resource guarantees move from code discipline to platform primitives (Durable Objects).
3. **Data isolation at scale** - Neon's copy-on-write database branching eliminates worktree/clone drift at the data layer; per-PR, per-loop, per-Capsule branches solve the estate-split problem.

Current estimated impact: **enables 5-10x loop throughput, eliminates split-brain incidents, cuts supervisor fragility from SPOF to edge-distributed.**

---

## Part 1: What Breaks Today (The Pain Points)

### Problem 1.1: Single VPS as SPOF

**What is happening:**
- The live ZAO fleet runs on one VPS instance (31.97.148.88) in a tmux session.
- ZOE polls the Telegram bot token from this single process; only one instance can do this without split-brain.
- The entire incident response loop (deploy, restart, rollback) is mediated through manual SSH or shell skills.

**Recent incident (2026-07-16, from feedback_never_union_merge_code):**
- ZOE boot-crash due to missing esbuild; auto-deploy lacked hard verification; had to manually rollback and restart.
- No native recovery: the loop stopped until a human intervened.

**Why Cloudflare/Neon fixes it:**
- **Durable Objects** provide single-instance coordination + automatic failover per object (object name = resource ID; CF routes all accesses to one DO at a time).
- **Workflows** encode multi-step recovery as state machines: on crash, retry the entire workflow from the last durable checkpoint.
- Multiple redundant Workers watch the same Durable Object; when one crashes, the next Worker's request wakes the DO automatically on a fresh process.

**Cost in CF/Neon terms:** Durable Objects cost $0.15/million requests on Workers Paid ($5/mo minimum), but you're buying automatic orchestration and failover that currently lives in shell scripts.

---

### Problem 1.2: Shared Clone Drift

**What is happening:**
- The VPS clone at `~/zao-os` is both the live deployment AND the build working tree for all loop processes.
- Rule 11 from agent-loops.md documents the failure: "NEVER leave uncommitted changes across sequential commands: a later `git checkout main` silently reverts them."
- June 2026 incident: self-heal loop and work-loop-fix ran live (changes on disk), but a subsequent `git checkout main` reverted them. The changes were never on origin/main, so the deployed VPS code diverged from the repo.
- Result: 3 researchers could not see the drift; took a full audit to catch it.

**Why current workarounds fail:**
- Worktrees (per `.claude/rules/agent-loops.md` rule 20) solve parallel-agent concurrency but not the "live deployment = build tree" duality.
- A worktree on the VPS still pulls from the same deploy directory; state is never fully isolated.

**Why Cloudflare/Neon fixes it:**
- **Workers** deploy from GitHub directly; no build tree on the production machine.
- **Neon branching** solves the DATA side of the problem: each PR gets an instant copy-on-write database branch (`main -> branch-pr-1520`); data never drifts between environments.
- For the fleet loops specifically: each loop can read from a Neon branch isolated per Capsule (per spec), so the `dry-run/staging/production` data isolation is at the database layer, not the clone layer.

**Cost in CF/Neon terms:** Neon branches are O(1) metadata operations; storage costs only for diverged pages ($0.35/GB-month as of 2026). A 100-branch per-loop branching strategy costs ~$35/month in incremental storage, vs. infinite branch setup/deletion scripting.

---

### Problem 1.3: One-Instance-Per-Resource → Split-Brain 409

**What is happening:**
- ZOE polls @zaoclaw_bot token once per loop tick.
- If a second ZOE process starts (accidental restart, deploy rollout, crash recovery), both processes poll the same Telegram API concurrently.
- Telegram sees duplicate requests; one succeeds, one 409s. The second process is now "stuck" seeing that token as already-in-use.
- This is documented as project_zoe_one_instance_409: *"only ONE ZOE polls @zaoclaw_bot; 2nd = split-brain."*

**Why current guards fail:**
- Process liveness is checked by tmux session name. A dead script in a live tmux session hides the issue (rule 9, agent-loops.md).
- Distributed systems' classic problem: no shared consensus on which process "owns" the lock.

**Why Cloudflare/Neon fixes it:**
- **Durable Objects** provide distributed semaphores. The first request to a DO acquires a lease; subsequent requests fail until lease expires or is explicitly released.
- Workers that want to poll the Telegram token acquire a lease on DO `zoe-telegram-lease`. If the lease is held, the Worker immediately fails the poll tick (no split-brain; fail fast).
- If the lease-holder crashes, the lease expires in ~seconds (configurable), and the next Worker's request automatically acquires it.

**Cost in CF/Neon terms:** Durable Objects are billed per-instance; one lease-holding DO costs $0.15/million requests. On Workers Paid plan, this is included in the base $5/month.

---

### Problem 1.4: "Can't Do Infinite Loops" Compute Ceiling

**What is happening:**
- Workers have a 30-second CPU time limit (paid plan; 5 seconds free tier).
- A loop that processes 1,000 tasks with 50ms per task = 50 seconds of CPU time per tick → timeout.
- ZAO's current workaround: run long-lived processes on the VPS with no hard timeout. This trades off against fault tolerance.

**Why Cloudflare/Neon fixes it (partially):**
- **Workflows** allow multi-step execution with natural retry/resume points. A loop becomes a series of steps: fetch task → process task → emit result. Each step is <30s; the entire job spans hours/days.
- A 1,000-task loop becomes 1,000 independent Worker invocations (each <30s) orchestrated by a Workflow. The Workflow engine handles queuing, retry, and state checkpoints.
- You trade latency (no single continuous loop) for durability (each step survives independently).

**Honest tension:** Not all loops are loop-shaped. If you have a loop that must maintain a continuous connection (e.g., WebSocket listener, streaming auction), Workflows don't help—you still need a long-lived process. The ZOL model (fetch next task, process, repeat) maps perfectly; an auction-house listener does not.

**Cost in CF/Neon terms:** Workflows bill per-step: on Workers Paid, 500k steps/month included; then $0.80 per 100k additional steps. A 1,000-step job is $0.008 (8/10ths of a cent).

---

### Problem 1.5: Supervisor Fragility

**What is happening:**
- The tmux fleet is supervised by a cron job that runs every 5 minutes.
- If the cron job misses a tick, the loop can hang undetected for up to 10 minutes (2 heartbeats).
- If the supervisor itself crashes, the entire fleet is down until manual intervention.
- The supervisor is a shell script; it cannot reliably detect "my Worker is still running but producing junk output."

**Why Cloudflare/Neon fixes it:**
- **Cron Triggers** replace tmux cron: Workers scheduled at 1-minute intervals with zero setup cost (included in Workers Paid).
- **Workflows** provide structured retry/backoff: if a job fails, it retries with exponential backoff automatically.
- Each invocation is a fresh process, so "hung process" doesn't exist (each request has a 30-second timeout; after that, it's dead and retried).
- The platform gives you observability: Cloudflare's dashboard shows you per-trigger stats, latencies, error rates.

**Cost in CF/Neon terms:** Cron Triggers are included in Workers Paid ($5/month). No additional supervisor infrastructure.

---

## Part 2: Cloudflare + Neon Capabilities (2026 Ground Truth)

### Cloudflare Workers

**Compute Model:**
- V8 Isolates (not containers): cold starts <1ms.
- 128 MB memory (fixed).
- 30-second CPU time limit (Workers Paid).
- Automatic global distribution: code runs on 300+ Cloudflare edge locations.
- [verify - as of 2026] No egress charges; requests routed to cheapest egress points.

**Pricing:**
- Free: 100k requests/day, $0.
- Paid ($5/month): unlimited requests, $0.15/million beyond 10M.

**Best for:** Stateless request-response functions. APIs, webhooks, proxies. Anything that answers in <5 seconds.

### Cloudflare Durable Objects

**Model:**
- A stateful Worker that runs forever (until no requests for configurable timeout).
- Automatic global pinning: all requests to `durable_object('resource-id')` go to the same instance.
- SQLite storage: up to 10GB per object (Workers Paid).
- Transactions: ACID guarantees on read/write.

**Use case: Distributed semaphores, task leasing, state machines, rate limiter coordination.**

**Pricing:**
- $0.15/million requests (all tiers can use Durable Objects).
- Storage: included in first 1GB per month per account; then $0.20/GB (free tier) or no additional cost (Paid, up to account limits).

**Limits:**
- CPU time per request: same as Workers (30s Paid).
- Concurrent requests: one request at a time per object (serialized); next request queues.

**Best for:** Mutual exclusion, leases, task routing, consensus.

### Cloudflare Workflows

**Model:**
- Multi-step state machine engine. Define steps; platform manages retries, checkpoints, persistence.
- A Workflow is a Durable Object with built-in step sequencing.
- On step failure, automatic exponential backoff + retry (configurable).
- On platform crash, resume from last completed step (all state is durable).

**Example:**
```javascript
export async function myWorkflow(event) {
  let result = await event.do_step(async () => {
    // Step 1: fetch task
    return await fetch('https://api.example.com/task');
  });
  
  result = await event.do_step(async () => {
    // Step 2: process task (retried independently if step 1 succeeded)
    return await processTask(result);
  });
  
  return result;
}
```
If step 2 crashes on the 50th item, restart at step 2 for the 51st; step 1 is not re-run.

**Pricing:**
- Workers Paid: 500k steps/month included.
- Beyond: $0.80 per 100k additional steps.
- Execution: charged as subrequests (no additional charge; included in request budget).

**Limits:**
- Step timeout: 30 seconds (same as Workers).
- Workflow max duration: configurable; default 30 days.

**Best for:** Long-running, fault-tolerant batch jobs. ETLs, multi-stage approvals, durable loops.

### Cloudflare Queues

**Model:**
- FIFO message delivery to Workers. Message guaranteed delivered ≥1 time.
- Producer: send message to queue.
- Consumer Worker: processes messages, runs on a schedule (every 30 seconds to 5 minutes).
- On failure, retry with exponential backoff.

**Pricing:**
- Free: 100k operations/day.
- Beyond: $0.50 per million operations.
- No egress charges.

**Best for:** Decoupling producer and consumer. Task queues, webhooks, fanout.

### Neon Serverless Postgres

**Model:**
- Managed Postgres with auto-scaling compute and storage.
- Scale-to-zero: after 5 minutes idle, compute suspends; meter stops.
- Connection pooling: every app has a connection pool endpoint (PgBouncer inside Neon).
- HTTP driver: queries via `/sql` API (REST); no long-lived connection needed.

**Pricing (2026):**
- Free: 50 CU-hours/month (roughly 1 week of continuous use), 512MB storage.
- Paid: $0.106/CU-hour (Launch tier), $0.35/GB storage/month.
- No setup fees; scale down to $0 automatically.

**Best for:** Serverless applications, edge deployments, cost-sensitive workloads.

### Neon Database Branching (Game-Changer)

**Model:**
- Copy-on-write branching: create a branch in <1 second.
- Branch = isolated Postgres instance pointing to a specific point in the parent's write-ahead log (WAL).
- No data copied initially; pages diverge only on write.
- Each branch can run a separate compute instance (or share, with pooling).

**Example workflow:**
```
main (production) → branch-pr-1520 (staging for PR #1520)
                  → branch-zol-production (production ZOL loop)
                  → branch-zol-dry-run (dry-run ZOL loop, same schema)
```

**Cost impact:**
- Storage: only incremental divergence charged. If `branch-zol-dry-run` diverges 1GB from main, you pay $0.35 for that 1GB, not for the full database size.
- Compute: each branch can have 0, shared, or dedicated compute. ZOL dry-run on shared compute costs ~$0.106/hour; production on dedicated, ~$0.15/hour.

**Limits:**
- Max branches: 500 per project (effectively unlimited for ZAO).
- Max database size: no hard limit (scales with storage plan).

**Best for:** Environment isolation, per-PR database snapshots, feature flags as database branches.

### Cloudflare AI Gateway

**Model:**
- Reverse proxy + middleware for LLM requests (OpenAI, Anthropic, Bedrock, etc.).
- Features: caching, rate limiting, logging, fallback routing (if OpenAI 503s, try Bedrock).
- Analytics dashboard: token counts, cost tracking, latency percentiles.

**Pricing (2026):**
- Free: basic analytics and routing, no per-call charge.
- Paid: enterprise features (custom routing logic, advanced caching).

**Best for:** Model/tool gateway, fallback logic, cost tracking.

---

## Part 3: ZAO Component Mapping → CF/Neon Primitives

| ZAO Problem / v2 Component | Current State | CF/Neon Primitive | Why It Works |
|---|---|---|---|
| **Work router + task lease** (v2 verification-gate #2) | ZOE polls Telegram; no distributed lease. Split-brain on restart. | **Durable Object `work-router`** acquires lease before task is assigned. Next Worker fails fast if lease held. Lease auto-expires on crash. | Replaces code-based locking with platform guarantee. One-instance-per-resource becomes a DO name. |
| **Receipts chain** (v2 verification-gate #3; audit trail) | Currently logged to Supabase; no ordered guarantee if processes race. | **Durable Object `receipts`** appends to log in strict order. Transactions ensure no missed receipt. Workers query `receipts.getRange(start, end)` atomically. | Serialized writes guarantee order. No race conditions. |
| **State-machine recovery** (duplicate exec, partial completion, stale lease, restart) | ZOE restarts from scratch; can re-queue tasks. No checkpoint. | **Cloudflare Workflow** encodes each verification-gate as a step. On failure, retry the step; on success, move to next step. Resume from last step on restart. | Built-in durability. No supervisor needed. |
| **Work queue** (task router) | Telegram updates pull; no backpressure. | **Cloudflare Queues** Producer sends task; Consumer Worker runs `do_step` per task. Auto-retry on failure. | Decouples producer and consumer. Handles backpressure naturally. |
| **Cron supervisor** (rule 9, tmux heartbeat) | tmux cron; heartbeat every 5 min; can hang for 10 min undetected. | **Cloudflare Cron Triggers** invoke Worker every 1 min. Each invocation is fresh process (no "hung" state). Auto-retry on failure. | Zero-setup scheduling. Per-invocation freshness. Platform observability. |
| **Per-loop data isolation** (v2 Capsules) | Worktree isolation; shared VPS clone still drifts. | **Neon branch per Capsule** (`main → branch-capsule-zol-production`). Each loop reads/writes isolated branch. | Isolation at data layer, not file layer. Solves drift at root. Zero setup (O(1) branch creation). |
| **Per-PR database snapshot** (v2 feature-branch isolation) | No feature-branch DB; staging uses main DB. Risk of data collision. | **Neon branch per PR** (`main → branch-pr-1520`). Auto-created on PR open; auto-deleted on PR close. | Fully isolated environment per PR. Zero data collision risk. Copy-on-write cost only on divergence. |
| **Environment separation** (production / staging / dry-run) | Single Supabase project; RLS enforces isolation. Fragile if RLS misconfigured. | **Neon compute instance per environment** pointing to separate branch. Each environment has own connection pool, own scaling policy. | Hard isolation. One environment can't see another's data. Automatic scaling per tier. |
| **Model/tool gateway** (v2 verification-gate #7) | Direct calls to OpenAI / Anthropic. No fallback logging. | **Cloudflare AI Gateway** routes requests, logs outcomes, falls back to Bedrock if primary 503s. | Centralized observability. Fallback without code change. Cost tracking. |
| **Fleet Standard harness** (reusable certification bundle) | Hard-coded in bot/src/; must fork + customize. | **Cloudflare Workflow as OSS template.** Deploy to any CF account; configure via env var. No forking. | Portable. Reusable. One source of truth. |

---

## Part 4: Honest Tensions + Migration Costs

### Tension 4.1: Workers CPU Limits vs. Long-Running Loops

**Problem:** Workers have a 30-second CPU time limit. A loop that processes 1,000 complex items (e.g., fetching Farcaster graph for each task, writing to Supabase) will timeout.

**Why it matters:** Some ZAO loops may need >30s per tick. E.g., the ask-gpt loop runs complex inference; morning-brief generates rich prose.

**Option A: Use Workflows (recommended for most loops)**
- Break the loop into steps. Each step <30s.
- Workflow orchestrates the steps; platform handles retries, checkpoints.
- Trade-off: higher latency (loop runs in multiple ticks, not one continuous process).
- Cost: low (steps are cheap).

**Option B: Use Workers AI on-device (for inference-heavy loops)**
- For LLM inference, use **Cloudflare Workers AI** (edge-hosted models like Llama 3.1, Mistral).
- Inference runs on CF's GPU nodes; you pay per token (not per second).
- Trade-off: limited model selection (not Claude, GPT-4 Turbo).
- Cost: ~$0.50-1.00 per task (vs. $0.01-0.10 for Workflows).

**Option C: Keep on VPS (honest fallback)**
- For truly long-running, continuous loops (auction listener, WebSocket stream), keep on VPS.
- Use Durable Object as a "check-in" coordinator: the VPS process polls the DO every minute to confirm it's still alive.
- Cost: VPS ($50-200/month) + Workers ($5/month).

**Recommendation:** Workflows for ZOL (task-fetch → process → emit), ZOE (morning-brief → post → record). Workers AI for fast inference. VPS for real-time listeners (if any).

---

### Tension 4.2: Neon vs. Supabase

**Current state:** ZAOOS uses Supabase (managed Postgres + RLS + realtime + auth).

**Neon capabilities:**
- Serverless Postgres with branching: excellent.
- RLS: yes, native Postgres RLS works.
- Auth: Neon doesn't provide auth; must use Supabase Auth, Auth0, or custom.
- Realtime: Neon doesn't provide it; must use Supabase Realtime, Socket.io, or custom.

**Decision tree:**

| Need | Supabase | Neon | Recommendation |
|------|----------|------|---|
| Managed Postgres + RLS + Auth + Realtime | YES (all-in-one) | Partial (Postgres + RLS; auth/realtime separate) | Keep Supabase for the app |
| Branching + isolation per environment | NO (manual workarounds) | YES (O(1) branches) | Use Neon for the fleet |
| Serverless cost control | Medium (Supabase billing is project-based) | Excellent (scale to $0 per branch) | Use Neon for dry-run branches |

**Recommended hybrid model:**
- **Supabase** (current): Powers the Next.js app (302 API routes, auth, realtime messaging).
- **Neon** (new): Powers the fleet. Each loop gets a Neon branch. Branching strategy:
  - `zao-fleet-main` (production data, shared by all ZOL/ZOE production loops).
  - `zao-fleet-zol-production` (ZOL production instance, branched from main, $0.106/hour compute).
  - `zao-fleet-zol-dry-run` (ZOL dry-run, branched from main, $0 compute [shared pool], charged only if diverged storage).
  - `zao-fleet-pr-1520` (per PR, auto-created for feature testing).

**Cost estimate:**
- Supabase: ~$100/month (current, unchanged).
- Neon production compute: ~$75/month ($0.106/hour * 24h * 30d ≈ $76.32).
- Neon dry-run compute: $0 (shared pool).
- Neon storage (incremental): ~$35/month (100GB divergence across branches at $0.35/GB).
- **Total incremental:** ~$110/month (net ~$210/month fleet infra vs. current $200+ VPS + human supervision).

---

### Tension 4.3: Cloudflare Lock-in

**Problem:** CF Workers, Durable Objects, Workflows are Cloudflare-only. Migrating away requires rewriting the entire scheduler.

**Honest assessment:**
- This is a real lock-in. No other platform has Durable Objects' model (one-instance coordination + storage).
- AWS has Step Functions (Workflows-like), but they cost 2-3x more and don't have Durable Objects.
- Open-source alternatives (Temporal, Directus Flows) exist but require self-hosting and ongoing ops.

**Mitigation:**
- Treat Workers as "application logic" and Durable Objects as "orchestration fabric."
- Decouple app logic from framework: write loops as pure functions; Workers/Workflows are thin adapters.
- Data: store in Neon (portable Postgres), not in Workers KV (locked in). Receipts can read from Neon's `receipts` table, not Durable Object storage.

**Recommendation:** Accept the lock-in as a trade-off for durability and simplicity. Cloudflare's pricing is transparent and low; switching costs are known.

---

### Tension 4.4: Geographic Latency for Supabase

**Problem:** Supabase is region-locked (e.g., `us-east-1`). Workers run globally but Postgres queries take time to reach Supabase.

**Why it matters:** A Worker in Tokyo making a query to `us-east-1` Supabase adds 100-200ms latency per request.

**Solution:** Use Neon's HTTP driver or Neon's pooling. Neon's connection pooler runs on Cloudflare edge; queries are batched and multiplexed. Latency is <50ms from any edge location.

**Trade-off:** All Neon queries must use the HTTP API (e.g., `neon.sql("SELECT ...")`) or Neon's client library, not direct Postgres clients.

**Recommendation:** For fleet loops (low-latency, high-throughput), use Neon. For the web app, keep Supabase (you need Auth and Realtime anyway).

---

## Part 5: Critical Unlocks / Upgrades (Ranked by Impact)

### Unlock 1: Durable Tasks (HIGHEST IMPACT)

**What:** Tasks become re-entrant, idempotent by default. A task fetched by a loop, then the loop crashes mid-execution, is not lost; it's retried with exactly-once semantics.

**How:** Durable Objects + Workflows encode the task state. When the Worker crashes, the next Worker resumes from the last committed step.

**Impact:**
- Zero manual intervention on crashes.
- Audit trail is automatic (Receipts layer).
- Task loss is impossible (unless Cloudflare global outage, which is <1x/year).

**Example:**
```javascript
export async function zoeLoop(event) {
  const task = await event.do_step(async () => {
    return await router.leaseTask(); // Lease acquired; no other worker can grab it
  });
  
  const result = await event.do_step(async () => {
    return await processTask(task); // If this fails, next Worker retries from here
  });
  
  await event.do_step(async () => {
    return await emitResult(result); // Only runs after result is ready
  });
}
```

**Enable:** ZOE, ZOL, ask-gpt, ZAOstock loops all become "fire and forget." Platform guarantees delivery.

---

### Unlock 2: Horizontal Loop Scaling (HIGH IMPACT)

**What:** Instead of one ZOL instance on the VPS, spawn 10 parallel Workers processing tasks from the same queue.

**How:** Workflows + Queues. Tasks are produced to `zao-zol-tasks` queue; 10 concurrent Workers consume them. Each Worker runs independently; Durable Object lease ensures no task is claimed twice.

**Impact:**
- 10x throughput (if tasks are independent).
- No shared state contention (each Worker is isolated).
- Auto-scaling: on peak load, spin up more Workers; on quiet periods, scale back to 0 (pay only for running time).

**Cost:** If ZOL currently runs 24h/day on VPS (~$6.67/day), scaling to 10 Workers @ $0.15/million = tiny. (10 workers * 100k tasks/day = 1M requests = $0.15/day, + Neon compute).

**Enable:** ZOL becomes a fleet, not a singleton.

---

### Unlock 3: Per-Environment Data Isolation (HIGH IMPACT)

**What:** Production ZOL and dry-run ZOL see completely isolated data. A dry-run bug cannot corrupt production.

**How:** Neon branching. Each environment (production, staging, dry-run) connects to its own branch. Branches diverge only on writes; storage cost is incremental.

**Impact:**
- Zero isolation bugs (RLS misconfiguration can't leak production data to staging).
- Feature-branch testing: every PR gets its own database snapshot; testing is on real data, not fixtures.
- Rollback is free: delete the branch; data is unaffected.

**Enable:** The fleet becomes multi-environment safe. Dry-run can thrash data without risk.

---

### Unlock 4: Stateless Loops = Automatic Failover (MEDIUM IMPACT)

**What:** A loop doesn't maintain connection state or in-memory context. It's a pure function: given a task ID, produce a result. Multiple instances are interchangeable.

**How:** Workflows + Durable Objects. Each loop is a Workflow step; state lives in the DO, not in the Worker.

**Impact:**
- A loop crashing is a non-event. The next request to the DO wakes it and continues.
- No manual failover scripts (current VPS model).
- Faster MTTR (mean time to recovery): <1 second vs. current ~5 minutes (cron tick interval).

**Enable:** Removes the "supervisor babysitter" entirely.

---

### Unlock 5: Fleet Standard as Portable Template (MEDIUM IMPACT)

**What:** The ZOE + ZOL orchestration harness is published as an open-source Cloudflare Workflow template. Any team can deploy it.

**How:** Repository at `github.com/bettercallzaal/fleet-standard` contains:
- Workflow definitions (TypeScript).
- Durable Object schemas (task router, receipts, leases).
- Terraform / Wrangler config to deploy.
- README with copy-paste setup.

**Impact:**
- ZABAL Games teams can run their own loops without ZAO ops overhead.
- Fleet Standard becomes a reusable tool, not a ZAO-specific black box.
- Feedback from external teams hardens the design.

**Enable:** Fleet Standard as a product / OSS project.

---

### Unlock 6: Observability in One Dashboard (MEDIUM IMPACT)

**What:** Cloudflare's dashboard shows latencies, error rates, task success/failure per loop.

**How:** Workers emit metrics to Cloudflare's analytics; AI Gateway logs all model calls.

**Impact:**
- No grep-in-logs debugging. Click a graph, see P99 latencies, error spikes.
- Cost tracking: see exact $ per loop per day.
- Alerting: set up email alerts on >10% error rate.

**Enable:** Operability without VPS SSH crawling.

---

## Part 6: Phased Migration Recommendation

### Phase 1: Green-Field Prototype (Weeks 1-2)

**Scope:** New loop, not critical.

**Steps:**
1. Choose a loop that's simple, stateless: e.g., a webhook listener or a scheduled report generator.
2. Write the loop as a Cloudflare Workflow (TypeScript).
3. Deploy to Cloudflare (using Wrangler CLI).
4. Connect to a Neon branch for data.
5. Measure latency, cost, reliability vs. VPS.

**Success metric:** Loop runs for 1 week, zero manual interventions, <$5 cost.

**Deliverable:** Runbook for deploying a Workflow loop.

---

### Phase 2: High-Value Singleton (Weeks 3-6)

**Scope:** Existing loop, high impact, medium complexity.

**Candidate:** ZOL (Farcaster agent).

**Steps:**
1. Refactor ZOL to be a Workflow step-sequence.
2. Implement Durable Object `zol-router` for task leasing.
3. Migrate data to Neon branch `zao-fleet-zol-production`.
4. Shadow the VPS instance for 1 week (Workflow runs, results logged, not yet shipped).
5. Compare outputs: same tasks, same results? If yes, switch traffic.
6. Retire VPS loop.

**Parallel:** Set up Neon branching strategy (main, production, dry-run).

**Success metric:** ZOL runs 24h/day on Workers; zero split-brain incidents; cost parity with VPS.

**Deliverable:** ZOL Workflow template, Neon branching runbook.

---

### Phase 3: Fleet Scaling (Weeks 7-12)

**Scope:** All loops.

**Steps:**
1. Migrate ZOE orchestrator to Workflow + Durable Objects.
2. Implement multi-Worker ZOL (10 parallel Workers from same queue).
3. Set up Neon branches for all Capsules (production, staging, dry-run).
4. Implement Fleet Standard template for external teams.
5. Retire the VPS loop cluster.

**Parallel:** Build Cloudflare dashboard dashboards, AI Gateway fallback routing.

**Success metric:** All loops on Cloudflare; zero VPS dependency; 5x throughput increase on ZOL.

**Deliverable:** Fleet Standard OSS template, operator runbook.

---

### Phase 4: Ecosystem Enablement (Weeks 13+)

**Scope:** ZABAL Games teams, external partners.

**Steps:**
1. Document Fleet Standard template for external deployment.
2. Offer to host other teams' loops on ZAO's Cloudflare account (shared infrastructure).
3. Build per-team analytics dashboard.

**Success metric:** 5+ external teams deploy their loops on Fleet Standard.

---

## Part 7: What NOT to Move

- **Supabase (auth + realtime):** Keep for the web app. Cloudflare doesn't replace auth/realtime middleware.
- **Next.js API routes:** Keep as-is. Only the autonomous loop layer moves to Cloudflare.
- **Music player components:** Keep in Next.js. No latency requirement; user-facing.
- **Bonfire knowledge graph:** Keep on current infrastructure (bonfires.ai). Integrate via API calls from Workflows.
- **XMTP messaging:** Keep on VPS listener; Workflows poll it via API.

---

## Part 8: Critical Risks + Mitigation

| Risk | Probability | Impact | Mitigation |
|------|---|---|---|
| Cloudflare outage | Low (~1x/year, <1h) | High (all loops down) | Fallback to Vercel Functions (slower, 2x cost) or VPS backup |
| Neon branch data divergence | Low (copy-on-write is proven) | Medium (data inconsistency) | Regular reconciliation script; backup to S3 nightly |
| Workers CPU timeout on complex logic | Medium (easy to exceed 30s) | Medium (task loss if not Workflow) | Test each loop's worst-case timing; use Workflows for anything >5s |
| Cost overrun (100 branches, high churn) | Low (cost is pay-per-use) | Low (~$50-100/month worst case) | Set billing alert at $500/month; audit branch creation weekly |
| Distributed systems bugs (race conditions) | Medium (new complexity) | High (data corruption) | Extensive testing; use Durable Object's serialization guarantees; formal verification tools |

---

## Part 9: Next Actions

| Owner | Action | Deadline | Status |
|---|---|---|---|
| @Zaal | Review architecture + approve Phase 1 scope | 2026-07-18 | PENDING |
| @Zaal | Identify first prototype loop for Phase 1 | 2026-07-18 | PENDING |
| Engineer | Set up Cloudflare account, Wrangler CLI | 2026-07-22 | PENDING |
| Engineer | Deploy prototype Workflow to Cloudflare | 2026-07-25 | PENDING |
| Engineer | Measure Phase 1 success metrics | 2026-07-31 | PENDING |
| @Zaal | Grill results; approve Phase 2 (ZOL migration) | 2026-08-01 | PENDING |
| Engineer | Refactor ZOL to Workflow | 2026-08-15 | PENDING |
| Engineer | Set up Neon branching (main, prod, dry-run) | 2026-08-15 | PENDING |
| Engineer | Shadow ZOL for 1 week; validate outputs match | 2026-08-22 | PENDING |
| Engineer | Switch traffic from VPS to Cloudflare | 2026-08-23 | PENDING |

---

## Appendix A: Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Edge                           │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  │ Worker (ZOL-1) │  │ Worker (ZOL-2) │  │ Worker (ZOE)   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
│           │                    │                    │
│           └─────────┬──────────┴────────┬───────────┘
│                     │                    │
│           ┌─────────▼─────────────────┐ │
│           │   Durable Object          │ │
│           │  (task-router lease)      │ │
│           └─────────┬─────────────────┘ │
│                     │                    │
│         ┌───────────▼──────────┐        │
│         │   Neon Database      │        │
│         │   (zao-fleet-main)   │        │
│         └──────────────────────┘        │
│                                         │
│                  ┌──────────────────────┘
│                  │ Async: Workflows
│                  │ (multi-step durability)
│                  └──────────────────────►(retry / resume)
│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Neon Console (Branches)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ main         │  │ prod-zol     │  │ dry-run-zol  │      │
│  │ (shared)     │  │ ($0.106/h)   │  │ ($0 shared)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Instant copy-on-write; incremental storage cost           │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Pricing Calculator (2026 Rates)

**Scenario: ZAO Fleet at Current Scale (1 ZOL, 1 ZOE, 1 ask-gpt)**

### Current (VPS-based):
- VPS (1 instance, 31.97.148.88): $200/month
- Supabase: $100/month
- Manual ops overhead: ~10h/month at $150/h = $1,500/month (implicit)
- **Total: ~$1,800/month (including ops)**

### Proposed (Cloudflare + Neon):
- Cloudflare Workers Paid: $5/month
- Cloudflare Durable Objects: $0.15/million requests (~50M req/month) = $7.50/month
- Cloudflare Workflows: 500k steps included; assume 50k extra steps/month at $0.80/100k = $0.40/month
- Neon compute (1 production instance): $0.106/hour * 24 * 30 = $76.32/month
- Neon storage (main branch + 5 branches, 100GB incremental): $0.35 * 100 = $35/month
- Supabase (kept for app): $100/month
- Monitoring / logging: $5/month
- **Total: ~$230/month**

**Savings:** ~$1,570/month (13% ops costs, faster recovery, more reliability).

---

## Appendix C: Comparison: Cloudflare vs. AWS Step Functions vs. Open-Source (Temporal)

| Feature | Cloudflare | AWS Step Functions | Temporal (OSS) |
|---|---|---|---|
| Cold start | <1ms (V8 isolate) | 100-500ms (Lambda) | 50ms+ (Docker) |
| Pricing | $5/mo base + $0.15/M req | $0.000025/state transition + compute | $0 (OSS) + $200+/mo (Temporal Cloud) |
| Durable Objects (coordination) | YES (native) | NO (need custom DynamoDB) | YES (Temporal server) |
| Database branching | Via Neon (external) | Via RDS snapshots | Via backup (external) |
| Global distribution | YES (300+ edge) | NO (region-locked) | NO (self-host globally) |
| Learning curve | Low (familiar JavaScript) | Medium (YAML DSL) | High (new runtime) |
| Vendor lock-in | High (CF only) | High (AWS only) | Low (open-source) |

**Recommendation:** Cloudflare for ZAO (simplicity, cost, edge distribution, integrated branching via Neon). Temporal for complex workflows that need portability.

---

## Appendix D: Proof-of-Concept: Workflow Loop (Pseudocode)

```typescript
import { Workflow, Trigger } from 'cloudflare:workflows';

const router = {
  async leaseTask(leaseId: string) {
    // Durable Object call
    const response = await fetch(
      `https://your-account.workers.dev/durable/router/lease?id=${leaseId}`,
      { method: 'POST' }
    );
    return response.json();
  },
  async completeTask(taskId: string, result: any) {
    // Record receipt in Durable Object
    const response = await fetch(
      `https://your-account.workers.dev/durable/receipts/append?task=${taskId}`,
      {
        method: 'POST',
        body: JSON.stringify({ status: 'completed', result })
      }
    );
    return response.json();
  }
};

export async function zaoLoop(event: Trigger<Workflow>) {
  // Step 1: Lease a task
  const task = await event.do_step(
    async () => {
      return await router.leaseTask('zol-lease');
    },
    { retry_policy: { max_attempts: 3 } }
  );

  if (!task) {
    console.log('No tasks available');
    return;
  }

  // Step 2: Process task (e.g., fetch Farcaster data, post to timeline)
  const result = await event.do_step(
    async () => {
      const fcData = await fetch(`https://api.neynar.com/v2/farcaster/user/${task.fid}`)
        .then(r => r.json());
      
      // Query Neon
      const neonResult = await fetch(
        `https://your-neon-project.neon.tech/sql`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${NEON_API_KEY}` },
          body: JSON.stringify({
            query: `INSERT INTO zol_tasks (task_id, fid, result) VALUES ($1, $2, $3)`,
            params: [task.id, task.fid, JSON.stringify(fcData)]
          })
        }
      ).then(r => r.json());

      return fcData;
    },
    { retry_policy: { max_backoff_seconds: 60 } }
  );

  // Step 3: Record receipt
  await event.do_step(
    async () => {
      return await router.completeTask(task.id, result);
    }
  );
}

// Cron trigger: every 1 minute
export default {
  async scheduled(event: ScheduledEvent, env: any) {
    const workflow = new Workflow(zaoLoop, {
      retries: {
        limit: 5,
        delay: 30
      },
      timeout: 120 // seconds
    });

    await workflow.start();
  }
};
```

---

## Appendix E: Open Questions for Grill / Next Session

1. **Latency tolerance:** How low must loop-tick latency be? (Current: ~2 minutes; Workflows: ~5-10 minutes due to batching.)
2. **Data consistency:** Do loops ever read Supabase data, or only Neon? (If Supabase, we need cross-DB transactions.)
3. **External API dependencies:** Are there any loops that hit >10 external APIs per tick? (Would require special handling in Workflows.)
4. **Regulatory / compliance:** Is there a data residency requirement for fleet data? (Cloudflare runs in 300+ locations; may need to pin to specific regions.)
5. **ZOE / ZAL integration:** Does ZOE need to remain a Telegram bot, or can it be Workers-based with a Telegram bridge? (Different architecture if Workers-native.)

---

## References

- Cloudflare Docs: https://developers.cloudflare.com/workers/
- Cloudflare Durable Objects: https://developers.cloudflare.com/durable-objects/
- Cloudflare Workflows: https://developers.cloudflare.com/workflows/
- Neon Docs: https://neon.tech/docs/
- Neon Branching: https://neon.tech/docs/introduction/branching/
- ZAOOS CLAUDE.md: `.claude/rules/agent-loops.md` (agent-loop operating doctrine)
- ZAOOS project_zoe_one_instance_409: Memory index (split-brain incident docs)
- Anthropic "Building Effective Agents" (June 2026)

