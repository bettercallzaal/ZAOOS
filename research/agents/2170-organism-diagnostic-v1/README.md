# Doc 2170 - ZAO Organism Diagnostic v1

**Date:** 2026-07-31
**Trigger:** Brandon's "ZAO Organism Diagnostic v1" (forwarded by Zaal). A full systems-health assessment, not a memory check. Objective: find where information, execution, or coordination breaks down, and name the smallest change that restores coherent behavior.
**Method:** Two read-only census agents (memory store; execution/Heart/loop/claim layers) + live DB queries + code reads + VPS process checks, plus hard evidence gathered live this session (the holds-destruction bug, board synthetic-due audit). Every metric below traces to a command; unmeasurable items are marked UNKNOWN. Nothing invented (per `anti-fabrication.md`).
**Related:** [[project_brandon_organism_directives]], [[project_brandon_two_plane_architecture]] (Heart), [[project_dreamnet_trust_layer]], doc 2169 (daily-note capture spec), doc 2093 (silent-failure sweep), doc 2105 (measurements-as-evidence).

---

## THE ONE-LINE DIAGNOSIS

**The organism acts far faster than it records that it acted.** Efferent output is strong (150 PRs created / 145 merged in the last 7 days, 19 live loops, DreamNet Spore Phase-3 conformant). The afferent/reflexive return path is nearly dead (14 total receipts - all from one loop, none since 2026-07-28; `effect_intents` table 0 rows; no claims table; no receipt->memory bridge; 21 board closes vs 145 merges; 1 memory commit in 7 days). The information flow

`Observation -> Memory -> Retrieval -> Context -> Reasoning -> Execution -> Receipt -> Claim -> Memory`

flows cleanly Observation -> Execution, then **breaks at Execution -> Receipt (18 of 19 loops emit no receipt) and again at Receipt -> Claim -> Memory (not built).** The loop never closes back to Memory, so each cycle re-derives context from grep instead of remembering. Every other symptom (stale board, orphaned memory index, vanished holds) is a facet of this: **the organism does not write down what it did.**

---

## PHASE 1 - MEMORY INTEGRITY (metrics)

| Metric | Value | Evidence |
|---|---|---|
| Total memory files | 377 (.md) | `ls *.md \| wc -l` in zaal-dotfiles/claude/memory/zaoos/ |
| By type | user 2 / feedback 41 / project 91 / reference 0 / **untyped 244 (65%)** | frontmatter `type:` grep |
| MEMORY.md (loaded index) | 17,136 bytes, 78 lines | `wc` |
| Files formally linked in index | ~45 of 377 (**~88% orphaned from the index**) | `comm -23` all-vs-indexed |
| Broken index rows | 0 (all linked files exist) | `comm -13` - clean |
| Dangling `[[wikilinks]]` | **92 of 214 (43%)** point to non-existent memories | link-target vs `name:` check; e.g. `[[883]]`, `[[Doc 612]]`, `[[agent-loops]]` |
| Wikilink density | 0.9/file avg (sparse) | grep |
| Stale (>90d unmodified) | 108 files | `find -mtime +90` |
| Memory write velocity | **~1 commit / 7 days** | `git log --since=7d -- memory/` |
| Retired-brand drift | LOW (tombstoned, held) | grep magnetiq/songjam - historical only |
| Retrieval precision | Index = ~1.9% of store bytes, 12% of files | 17KB / 893KB |

**Read:** the store is large and growing shadow-wise (377 files) but the *loaded* surface is tiny and incomplete, so grounding is grep-luck, not indexed recall. And it barely grows on write (1 commit/7d) despite 145 PRs merged - self-knowledge is not being written.

## PHASE 2 + 7 - AGENT STATE / DREAMLOOP CENSUS

**19 loops live** (bot/src/zoe/scheduler.ts:108-911), all bounded/gated (empty-queue = silent, spend gate `shouldPauseAutonomousWork()` hard-stops at 95%):

morning-brief (09:00), grill (hourly), escalation-resend (30m), evening-reflection (01:00), nightly-recap (02:00), curator (08:00), reasoning-tick (hourly), learn-cycle (Sun 18:00), watcher (08:30), work-loop (2h), error-remediation (10m), repo-improver-scout (3h), heart-canary (10m, flag OFF), handoffs-surface (10m), zaostock-approvals (10m), orchestrator-tick (5m), nudge-surface (06:30), cost-governance (10m), posts-scheduler (~7/day).

**Live on VPS** (`ssh vps ps`, 2026-07-31 19:03): ZOE main (index.ts, uptime ~1.5h), server.js, AO lifecycle-worker, cheap-loops (zoe + ww). One poller instance - no split-brain observed.

**Loops that produce a durable trace:** 1 of 19 (repo-improver-scout emits receipts). **The other 18 act with no receipt** - their work is invisible to the organism's own record. This is the DreamLoop-level version of the one-line diagnosis: loops finish work but not evidence.

## PHASE 4 - HEART (leases / fencing / recovery)

- Primitives extracted to `packages/heart-fleet/src/`: `HeartFleet` (lease coord), `SupabaseLeaseStore`, `executeWithLease` (acquire->heartbeat->release), `DurableEffectLedger` (transactional outbox), `sendOnce` (dedup by effect_key), `reconcileOutbox` (orphan recovery), `LivenessReclaimer` (reclaim dead-instance leases). Stable, tested.
- **Flag: OFF.** `ZOE_HEART_FLEET_CANARY` default false (heart-canary.ts:42-43); no prod override. `ZOE_OUTBOX_DEMO` also off.
- **First real consumer: none.** Only the canary (a flag-gated no-op) touches the lease layer. `effect_intents` migration applied (table exists) but **0 rows** - the outbox is deployed but unreachable.
- **Verdict:** execution authority is built but dormant. "Does execution authority match runtime state?" - No: authority is inert while 19 loops execute ungoverned (individually gated, but not lease-fenced).

## PHASE 8 - CLAIM FACTORY (Observation->Evidence->Receipt->Claim->Memory)

```
Observation  repo-improver scout runs (3h), finds a smell        OK
   -> Evidence  OpenRouter audit produces findings                OK
   -> Receipt   emitReceipt() -> receipts table                   OK (14 rows, ALL this one loop, latest 2026-07-28)
   -> Claim     no claims table exists                            BREAK
   -> Memory    Bonfire queue exists but NOT wired to receipts    BREAK
```

- `receipts`: 14 rows, 100% `tool='repo-improver-scout'`, none since 2026-07-28 (3 days silent).
- `effect_intents`: 0 rows (outbox never populated - only writer is the OFF canary).
- `agent_runs`: 14 rows, all completed, **none leased / none in flight**.
- **Chain breaks after Receipt.** Receipt -> Claim -> Memory is not implemented. So even the one loop that emits receipts never turns them into durable memory.

## PHASE 3 - CORTEX (decision quality)

- Decisions get made and executed (145 merges/wk). But the Cortex **reprioritizes on fiction**: the daily top-3 on 2026-07-31 ranked on `due` dates that were 52% synthetic backfill (`due_backfilled_at`), and all 5 ranked items were synthetic - the ranking axis was pure noise (doc 2105 incident 9).
- Decision follow-through is high where a loop owns it (work-loop -> PR). Decision *durability* is low: decisions routed onto relay holds get destroyed (Phase - Bloodstream).
- Net: reasoning is capable but grounds on an unreliable board and a lossy coordination channel.

## PHASE 5 - MEMORY GROUNDING (replay test)

"Would the organism remember this without being reminded?" Applied to this week's work: **mostly no.** 145 PRs merged; the memory store gained ~1 commit. The board recorded 21 closes. The Eliances/Dan Shinder ask sat invisible in a comment for 12 days. Recall depends on a human re-surfacing it or a lucky grep. Retrieval latency for indexed items is fine; retrieval *coverage* is the failure (88% orphaned).

## PHASE 6 - OPEN-SYSTEM ANALYSIS (Schaller)

| Signal | Reading |
|---|---|
| Useful-work ratio | HIGH on execution (96.7% PR merge rate, 2 open backlog) |
| Verification density | LOW at the record layer (1/19 loops emit receipts) |
| Memory churn | LOW (1 write/7d) - under-writing, not thrashing |
| Observation frequency | HIGH (19 loops, watcher, error-remediation every 10m) |
| Interruption/replanning | Moderate; the synthetic-due daily forced a retraction (wasted a cycle) |
| Zeno risk | LOW-MODERATE - loops are bounded/gated; the risk is not over-observing, it is under-recording |

**Conclusion:** excessive observation/replanning is NOT the bottleneck. The bottleneck is that execution outruns recording. The organism is not stuck planning; it is failing to remember.

---

## PHASE 9 - ORGANISM HEALTH SCORES

Scored /10 with confidence + the evidence + the fix. Scores reflect "is information flowing correctly through this organ", not raw activity.

| Organ | Score | Conf | Evidence | Known issue | Repair |
|---|---|---|---|---|---|
| **Eyes** (observation) | 7 | High | 19 loops, watcher, error-remediation/10m | Observes far more than it records | Wire observations to receipts |
| **Execution / DreamLoops** | 7 | High | 150 PRs/wk, bounded+gated | Only 1/19 loops emit a durable trace | Every loop emits a receipt |
| **Federation** (DreamNet) | 7 | Med | Spore Phase-3 47/47 conformant (PR #2704), first conformant node | Not yet multi-node in prod | Continue; low urgency |
| **Cortex** (planning) | 5 | Med | Decisions ship; but ranked on 52% synthetic dues | Grounds on a fiction board | Doc 2169 (roll-count replaces synthetic dues) |
| **Spine** (event log) | 4 | High | agent_runs+receipts exist but 14 rows total | Almost nothing logged | Loops write agent_runs+receipts |
| **Memory** | 3 | High | 88% orphaned index, 43% dangling links, 1 write/7d | Retrieval = grep-luck; barely written | Receipt->memory bridge + index rebuild |
| **Claim Factory** | 3 | High | Obs->Receipt works for 1 loop; Claim/Memory unbuilt | Chain dead after Receipt | Build Receipt->Claim->Memory bridge |
| **Heart** (leases) | 3 | High | Extracted+tested, flag OFF, 0 real consumers, effect_intents=0 | Authority dormant; execution ungoverned | Flip canary ON, give it one real consumer |
| **Bloodstream** (relay) | 2 | High | relay-bridge.ts:142 whole-object PATCH **deletes metadata.holds every write** | Active data loss of coordination signals | Use relay_hub_merge RPC (below) |
| **Brain** (whole) | 4 | Med | Strong limbs, broken reflex arc | Acts without remembering | Close the afferent loop |

The shape: **Eyes/Execution/Federation ~7; Memory/Claim/Heart/Bloodstream 2-3.** The organism senses and acts well; it does not remember or coordinate durably.

---

## PHASE 10 - ROOT CAUSE ANALYSIS (top 5, ranked by impact)

1. **The afferent loop is unbuilt: Execution -> Receipt -> Claim -> Memory does not close.** (Impact: highest.) Evidence: 145 merges vs 14 receipts vs 1 memory write; 18/19 loops emit nothing; no claims table; receipts never become memory. Organs: Memory, Claim Factory, Spine, Cortex. Repair complexity: MEDIUM (a receipt->memory bridge + make loops emit receipts). Benefit: the organism starts remembering its own work; every downstream symptom eases.

2. **Bloodstream destroys coordination signals.** (Impact: high, cheapest.) Evidence: relay-bridge.ts:142 replaces the whole `metadata` object, wiping `holds` on every ZOE relay write (confirmed live this session; cowork lost 4 Zaal-gated decisions twice). Organs: Bloodstream, Cortex. Complexity: LOW (one function -> use the existing `relay_hub_merge` RPC). Benefit: gated decisions stop vanishing.

3. **The board is 52% fiction.** (Impact: high.) Evidence: 146/283 dues are `due_backfilled_at` synthetic; capture 28.3/day vs close 3.4/day; 100 untriaged captures; asks hide in comments. Organs: Cortex, Memory. Complexity: MEDIUM (doc 2169 daily-note + roll-count already speced). Benefit: planning grounds on truth, not a generated field.

4. **Memory index is 88% orphaned + write velocity stalled.** (Impact: medium-high.) Evidence: 45/377 indexed, 43% dangling links, 1 write/7d. Organs: Memory, Retrieval, Grounding. Complexity: MEDIUM (auto-index high-signal files; write memory from receipts - overlaps #1). Benefit: retrieval becomes indexed, not lucky.

5. **Heart is inert.** (Impact: medium, structural.) Evidence: flag OFF, 0 consumers, effect_intents=0. Organs: Heart, execution integrity. Complexity: LOW-MEDIUM (flip canary, give one loop a lease). Benefit: execution becomes fenced/at-most-once; the built safety layer starts protecting.

**Note the unification:** #1, #3, #4 are the same disease (work is not written down) seen at three layers (receipt, board, memory). #2 is an active leak on the same theme (a signal that IS written gets erased). #5 is the governance layer for the same work, dormant.

---

## DELIVERABLE - REPAIR PLAN (sequenced, smallest-first)

- **R0 (stop the bleed, ~1 function, gated deploy):** Fix `relay-bridge.ts` `saveHubRelays` to call `rpc/relay_hub_merge` with `{p_patch:{relays:...}}` instead of the whole-object PATCH. Holds stop vanishing. PR -> Zaal gates the bot redeploy. (Root cause #2.)
- **R1 (close the afferent loop - THE keystone):** (a) every PR-producing loop calls `emitReceipt()` on finish; (b) one `receipts -> memory` bridge writes a nightly claim/digest (and a Bonfire episode) from the day's receipts. Turns 145 invisible PRs/wk into durable self-knowledge. (Root causes #1, #4.)
- **R2 (ground the Cortex on truth):** ship doc 2169 (daily-note capture + roll-count replacing synthetic dues; auto-promotion). (Root cause #3.)
- **R3 (index rebuild):** auto-generate MEMORY.md high-signal rows from the store + prune/merge the 108 stale + 92 dangling-link files. (Root cause #4.)
- **R4 (turn the Heart on):** flip the canary ON, give one real loop (e.g. work-loop or error-remediation) an `executeWithLease` wrapper so execution is fenced. (Root cause #5.)

Sequencing rationale: R0 first (active loss, cheapest), then R1 (keystone - the thing that "restores coherent behavior"), then R2/R3 (the board+memory truth layers R1 feeds), then R4 (governance). R0, R2, R3 are largely already speced or one-function; R1 is the real build.

## DELIVERABLE - HIGHEST-LEVERAGE NEXT FIX

Two answers, because "stop the bleed" and "restore coherence" are different sizes:

- **Smallest change, immediate:** **R0 - the relay `holds` fix.** One function, stops the organism from deleting its own coordination signals on every write. Do this first regardless.
- **Smallest change that restores COHERENT behavior (the real answer to Brandon's prompt):** **R1a - make every loop emit a receipt, then bridge receipts -> a nightly memory write.** This is the single missing link that closes `Execution -> Receipt -> Memory`. Once the organism records what it does, the board, the memory index, and the Cortex all start grounding on real self-knowledge instead of re-deriving from grep. It is the keystone because every other organ's weakness (Memory 3, Claim 3, Spine 4, Cortex 5) is downstream of "work never became a durable record."

The organism's problem is not that it can't think or act. It is that it has no proprioception - it cannot feel what it already did. Give it that one sense and the rest of the body starts coordinating.

---

## Anti-fabrication statement

Metrics from: live DB queries (receipts=14, effect_intents=0, agent_runs=14, board open=345, completed-7d=21), code reads (scheduler.ts, heart-canary.ts, relay-bridge.ts:142, receipts.ts, repo-improver-io.ts), VPS `ps`/`crontab`, `gh pr list` (150 created / 145 merged / 7d), and the memory-store census (377 files, 45 indexed, 92 dangling links, 1 commit/7d). Every score cites its evidence. Unmeasured items (exact duplicate-memory count, per-loop decision-abandonment rate) are left qualitative rather than guessed. The holds-destruction bug and the board synthetic-due audit were confirmed live this session. This doc is a diagnosis, not a set of applied fixes - R0-R4 are proposed, not shipped.
