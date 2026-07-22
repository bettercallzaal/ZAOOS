# Doc 1660: Executive Cortex v1 MVP

## Status
APPROVED + IMPLEMENTED. MVP landed 2026-07-22.

## What is the Executive Cortex?

The Cortex is **the thinking layer** of ZAO's autonomous system. It THINKS (analyzes priorities, dependencies, blockers) and RECOMMENDS (emits DecisionReceipts). It NEVER executes work, never holds execution state, never modifies Spine or Grid data - it reads only.

### Core principle: Recommendations, not execution

The Spine (control-plane, agent_runs + receipts) is the execution authority. The Cortex is purely advisory. When the Cortex says "Task X is most important," it's a DecisionReceipt (an immutable recommendation) - what happens next is ZOE's decision.

This boundary is non-negotiable in the design.

---

## V1 Scope (MVP - shipped)

### The five strategic questions the Cortex answers:

1. **"What's the most important thing right now?"**
   - Analyzes goal alignment, blocking dependencies, urgency, context quality, human signals.
   - Returns the top 1 task + reasoning + confidence + recommended action.

2. **"What are the top 5 priorities?"**
   - Ranked list of 5 highest-value tasks + scores.

3. **"What's blocking progress?"**
   - External dependencies, tasks waiting for approval, stalled work.
   - Critical path analysis + recommended unblocking actions.

4. **"What can be delayed?"**
   - Low-priority tasks that don't block critical path.
   - Lets Zaal refocus effort without cascading damage.

5. **"What can be parallelized?"**
   - Independent ready/in_progress tasks with no blocking edges.
   - Enables faster throughput via concurrent execution.

(Bonus: "What needs approval?" - tasks ready to start but gated on sign-off.)

### No Spine yet?

The Spine (agent_runs, receipts tables in PR #2074) is not live in main (as of 2026-07-22). The Cortex is built to read from those tables when they land, but for now:

- `context-aggregator.ts` marks Spine data as `pending` (follows the Grids' PendingSource pattern).
- The Cortex works with goals + work_dependencies fully functional.
- When Spine lands, uncomment the fetch calls in `context-aggregator.ts`.

---

## Architecture

### Type System (types.ts)

All types are fully specified, no `any`:

- **Goal**: mission/objective/task hierarchy + status + confidence + audit trail.
- **PriorityScore**: component breakdown (goalAlignment, blockingOthers, urgency, contextQuality, humanSignal) + total + reasoning + confidence.
- **WorkDependencyEdge**: directed edge (from -> to, kind: blocks/context/approval).
- **TaskDAG**: nodes, edges, topological order, cycles, critical path.
- **DecisionReceipt**: immutable recommendation (id, createdAt, decisionKind, answer, reasoning, confidence, inputsSnapshotId).
- **ContextSnapshot**: reconstructable state from Spine + Grids (goals, dag, reputation grid, spine runs, completeness, pending sources).
- **BottleneckReport**: blockers, waiting tasks, stalled work, critical path, recommendations.

### Pure Functions (priority-engine.ts)

All scoring is **pure**: no I/O, no side effects, fully testable.

**Weights** (sum to 1.0):
- Goal alignment (0.25): how well does this serve the mission?
- Blocking others (0.25): are we holding up critical path?
- Urgency (0.25): is it time-sensitive?
- Context quality (0.10): do we know enough to start?
- Human signal (0.15): what does Zaal say?

**Human signals** (conservative):
- If notes contain "urgent", "asap", "critical", "priority", "blocker", "do today", "emergency" -> boost to 0.9.
- Long notes (>100 chars) -> mild boost (0.5).
- Otherwise -> 0 (no signal).

**Exports**:
- `scoreGoalPriority(goal, allGoals, edges)` -> PriorityScore
- `rankGoalsByPriority(goals, edges)` -> sorted array
- `explainRanking(scoreA, scoreB, nameA, nameB)` -> prose explanation

### Dependency Resolver (work-dependency-resolver.ts)

**Pure graph analysis**:

- **Topological sort** (Kahn's algorithm): execution order if all deps satisfied.
- **Cycle detection** (DFS): returns list of cycles; acyclic if empty.
- **Critical path** (longest-path algorithm): the bottleneck - minimum time to complete all work.

**Blocked/waiting analysis**:

- `findBlockedTasks(goals, edges)`: tasks with unmet 'blocks' edges or explicit 'blocked' status.
- `findWaitingForApproval(goals, edges)`: 'ready' tasks with 'approval' edges.
- `findParallelizableTasks(goals, edges)`: pairs of independent tasks (no edge between them).
- `estimateCompletionImpact(goalId, goals, edges)`: how many downstream tasks would unblock if this one completed?

**Exports**:
- `buildTaskDAG(goals, edges)` -> TaskDAG (full analysis).

### Context Aggregator (context-aggregator.ts)

Assembles the strategic context snapshot by reading Grids + Spine (read-only). Follows the Grids' PendingSource pattern: all data marked as sourced or pending, never fabricated.

**Data sources**:
- Goals (always local).
- Reputation Grid (fetches from /api/grids/reputation; pending until Grids stable).
- Spine runs (fetches agent_runs from PR #2074; pending until live).

**Completeness score** (0-1):
- Always sourced: goals (1.0).
- If Reputation Grid available: +0.3.
- If Spine runs available: +0.3.
- If >50% of goals have high confidence (>0.7): +0.4.

**Validation**:
- Warns if completeness < 0.3 (major data gap).
- Warns if goals have no dependencies (isolated work).
- Warns if cycles detected (impossible to execute).

**Exports**:
- `assembleContextSnapshot(goals, dag)` -> ContextSnapshot.
- `summarizeMissingData(snapshot)` -> prose explanation of gaps.
- `validateSnapshot(snapshot)` -> array of warnings.

### Decision Engine (decision-engine.ts)

Orchestrates the pure functions + I/O to answer executive questions. Returns immutable DecisionReceipts.

**Decision functions** (async, read-only):
- `decideMostImportantNow(goals, edges)` -> DecisionReceipt (top 1 task).
- `decideTop5Priorities(goals, edges)` -> DecisionReceipt (ranked list).
- `decideWhatIsBlocking(goals, edges)` -> DecisionReceipt (BottleneckReport).
- `decideWhatCanBeDelayed(goals, edges)` -> DecisionReceipt (low-priority list).
- `decideWhatNeedsApproval(goals, edges)` -> DecisionReceipt (approval-gated tasks).
- `decideWhatCanParallelize(goals, edges)` -> DecisionReceipt (independent tasks).

**Flow for each decision**:
1. Snapshot the context (goals, Spine, Grids).
2. Analyze (score, rank, find blockers, etc.).
3. Emit DecisionReceipt (id, createdAt, decisionKind, answer, reasoning, confidence, inputsSnapshotId).

### API Route (src/app/api/cortex/route.ts)

Session-gated endpoint matching the Grids pattern.

**GET /api/cortex?decision=<kind>**
- Returns a welcome message + available decisions.
- (Future: will fetch goals from a goals table and return the decision directly.)

**POST /api/cortex?decision=<kind>**
- Request body: `{ goals: Goal[], edges: WorkDependencyEdge[] }`.
- Response: `{ success: true, data: DecisionReceipt }`.

All routes check `getSessionData()` and return 401 if not authenticated.

---

## Runtime Diagram

```
Client (ZOE/Admin)
   |
   v
GET/POST /api/cortex?decision=most_important_now
   |
   +-> Session check (401 if not authenticated)
   |
   +-> POST body: { goals, edges }
   |
   +-> decision-engine.decideMostImportantNow()
   |   |
   |   +-> context-aggregator.assembleContextSnapshot()
   |   |   |
   |   |   +-> Fetch Reputation Grid (/api/grids/reputation)
   |   |   +-> Fetch Spine runs (agent_runs table)
   |   |   +-> Compute completeness
   |   |   +-> Return ContextSnapshot
   |   |
   |   +-> work-dependency-resolver.buildTaskDAG()
   |   |   |
   |   |   +-> Topological sort
   |   |   +-> Cycle detection
   |   |   +-> Critical path analysis
   |   |   +-> Return TaskDAG
   |   |
   |   +-> priority-engine.rankGoalsByPriority()
   |   |   |
   |   |   +-> Score each ready/in-progress goal
   |   |   +-> Rank by total score
   |   |   +-> Return ranked array
   |   |
   |   +-> Select top goal, estimate impact
   |   +-> Emit DecisionReceipt (id, reasoning, confidence, etc.)
   |
   v
200 OK: DecisionReceipt
```

---

## Integration Points

### 1. Spine (control-plane, PR #2074)

When the Spine tables land:
- Uncomment the `fetch agent_runs` call in `context-aggregator.ts`.
- The Cortex can then read active runs and recent completions for real-time context.
- DecisionReceipts will reference Spine receipts for audit trail (if desired).

### 2. Grids (Reputation, Creator, Event, Sponsor, Battle)

The Cortex calls `/api/grids/reputation` to fetch member profiles. Once all grids are stable:
- Member context (trust scores, win rates, collaborations) can inform decision-making.
- E.g., prioritize onboarding high-trust new members (high reputation).
- E.g., deprioritize tasks that need unknown/low-trust members.

### 3. ZOE (orchestrator)

ZOE can call the Cortex's decision functions to:
- Plan work (top 5 priorities).
- Identify blockers (what_is_blocking) and trigger unblocking actions.
- Find parallelizable work and dispatch to multiple agents.
- Log decisions (decision_receipts table) for learning/auditing.

### 4. Goals table (schema in migration 1411)

For the MVP, goals are passed in request bodies. Once a goals table exists:
- GET /api/cortex/health -> fetch goals from DB, analyze, return summary.
- GET /api/cortex?decision=most_important_now -> fetch goals, decide, return receipt.

---

## Database Schema (Migration 1411 - GATED)

Three tables:

1. **goals**: id, kind, parent_id, title, status, percentComplete, confidence, notes, timestamps, creator.
   - Indices: parent_id, status, kind, created_at.
   - RLS: all members read; admins write.

2. **work_dependencies**: id, from_goal_id, to_goal_id, kind (blocks/context/approval), reason, timestamps.
   - Constraints: no self-loops, unique edges.
   - Indices: from_goal_id, to_goal_id, kind.
   - RLS: all members read; admins write.

3. **decision_receipts**: id, decision_kind, answer (JSONB), reasoning, confidence, inputs_snapshot_id, created_at, created_by, goals_context_ids.
   - Indices: decision_kind, created_at, confidence.
   - RLS: all members read; insert restricted to service role (ZOE writes via backend).

---

## Testing

**Unit tests** (vitest, co-located):

- `priority-engine.test.ts`: score, rank, explain reasoning.
  - High in-progress + blocks others = high score.
  - Completed goals = 0 urgency.
  - Human urgency signals boost score.
  - Backlog with low confidence = low score.
  - Ranking correctness.
  - Explanation generation.

- `work-dependency-resolver.test.ts`: topological sort, cycles, critical path, blocked/waiting/parallelizable tasks.
  - Simple chain -> correct topological order.
  - Cycles detected -> no topological order.
  - Critical path computed correctly.
  - Blocked tasks identified.
  - Waiting for approval identified.
  - Parallelizable pairs found.
  - Completion impact estimated.

All tests pass:
```bash
cd /tmp/wt-cortex
npm run typecheck   # 0 errors in src/lib/cortex
npx vitest run src/lib/cortex/__tests__
npm run lint:biome src/lib/cortex
```

---

## Verification Results

**TypeScript**: `npm run typecheck` - PASS (0 errors).
- No `any` in cortex code.
- All types explicit.

**Tests**: `npx vitest run src/lib/cortex/__tests__` - PASS (all suites green).

**Linting**: `npm run lint:biome src/lib/cortex` - PASS (clean).

---

## Future Extensions (deferred from MVP)

### Learning Loop
- Query decision_receipts to compare "what the Cortex recommended" vs "what actually happened."
- Identify recurring missed calls (e.g., always underestimating urgency of approval-gated work).
- Adjust weights dynamically (e.g., boost humanSignal weight if Zaal corrections follow a pattern).

### Budget Awareness
- Add cost/effort estimates to goals (days, tokens, $).
- Include "cost" as a component in priority scoring.
- Recommend work that maximizes value-per-cost.

### Simulation
- "What if we complete task X?" -> simulate the DAG, compute new blockers, new critical path.
- Let Zaal explore scenarios before committing to a plan.

### Multi-Organism Support
- The Cortex currently assumes one mission/objective hierarchy.
- Future: support multiple concurrent organisms (ZAI, ZOL, ZOE, etc.) with separate hierarchies.
- Cortex can prioritize *across* organisms (e.g., ZOE's work vs ZOL's work).

### Confidence Feedback
- If Cortex confidence is <0.5, flag for Zaal to provide more context.
- Learning loop: more context -> higher confidence -> better decisions.

---

## Self-Critique: Why MVP, Not Full Design?

The original design included:
- Full learning loop (compare recommendations vs reality).
- Budget awareness (cost, effort, tokens).
- Simulation engine (scenario exploration).
- Multi-organism support.
- Cascading confidence updates.

We deferred these because:

1. **Grounding first**: The MVP establishes the core (pure scoring, DAG analysis, decision receipts) without external dependencies (full Spine, Goals table, learning loop).
2. **Fast feedback**: Ship MVP now, iterate with Zaal's feedback before adding learning/budgeting complexity.
3. **No sunk cost in speculation**: Once real goals + Spine data exists, we'll know what the Cortex actually needs. Overbuilding now wastes tokens.
4. **Learning loop requires history**: Can't learn patterns until the Cortex has made 50+ recommendations and has ground truth (what happened vs what was recommended). MVP gets us there.

The MVP is complete, type-safe, testable, and gated. It answers the 5 core questions. The rest follows once we have data.

---

## Boundary (non-negotiable)

The Cortex is ADVISORY ONLY:
- Reads: goals, work_dependencies, Spine (agent_runs, receipts), Grids (reputation).
- Writes: decision_receipts (append-only log).
- Never: modifies goals, executes work, holds execution state, overrides human decisions.

If a DecisionReceipt is wrong, the fix is not to re-run the Cortex with different weights - the fix is to provide more context (e.g., Zaal adds notes "actually, this task is blocked by external dep X"). The Cortex learns from that context, not from predicting the future.

---

## Files

- **src/lib/cortex/types.ts**: All type definitions.
- **src/lib/cortex/priority-engine.ts**: Pure scoring functions.
- **src/lib/cortex/work-dependency-resolver.ts**: Pure graph analysis.
- **src/lib/cortex/context-aggregator.ts**: I/O (reads Grids, Spine).
- **src/lib/cortex/decision-engine.ts**: Orchestration (answers questions).
- **src/app/api/cortex/route.ts**: Session-gated API.
- **src/lib/cortex/__tests__/priority-engine.test.ts**: Priority scoring tests.
- **src/lib/cortex/__tests__/work-dependency-resolver.test.ts**: DAG tests.
- **scripts/1411-executive-cortex-v1.sql**: Gated migration (not yet applied).

---

## Next Steps (post-MVP)

1. **Zaal approves + lands schema** (merge migration 1411 PR).
2. **Build goals table interface** (CRUD endpoint for admins).
3. **Wire up Spine** (uncomment fetch calls when PR #2074 merges).
4. **Test with real goals** (Zaal creates first goals, Cortex scores them).
5. **Learning loop** (analyze decision_receipts vs reality).

---

## PR & Session

- **PR**: #<to-be-assigned> (Executive Cortex v1 MVP).
- **Branch**: ws/executive-cortex-v1.
- **Committed**: 2026-07-22.
- **Co-Author**: Claude Code.
- **Verification**: typecheck + tests + linting all green.
