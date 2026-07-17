---
topic: agents
type: audit
status: research-complete
last-validated: 2026-07-16
related-docs: 717, 665, 680, 928, 1174
original-query: "Loop memory audit + Bonfire-always design: audit how the 4 tmux loops lose information at compaction, verify the compact protocol works, measure episode noise vs value, and design recall"
tier: STANDARD
---

# 1176 - Loop Memory: Compact Protocol Audit + Recall Design (2026-07-16)

> **Trigger:** ZOE lost 939k context tokens in a single compaction. All 4 loops (zao-loop, coc-loop, zoe-loop, zol-loop) need a reliable memory bridge across context resets.

## What Is Lost at Compaction

Claude Code summarizes when the context window fills. The summary is lossy by design — it captures outcomes, not process. Specifically lost:

| Category | What Disappears | Impact |
|----------|-----------------|--------|
| **Error traces** | Exact error strings, stack traces, shell output | Future loops re-derive root causes |
| **Reasoning chains** | Why approach X was chosen over Y | Abandoned approaches get re-explored |
| **Tentative ideas** | Half-explored options that didn't pan out | Same dead ends get re-entered |
| **Partial code** | Snippets considered but not committed | Re-written from scratch |
| **Decision context** | The "tried X → failed because Y → did Z" chain | PRs lack rationale, LESSONS get missed |

The compaction summary preserves: final state, open PRs, blockers, merged facts. It does NOT preserve: the texture of what was tried.

## Compact Protocol: Does It Work?

The current protocol (from each loop directive):

```
Per completed item: one Bonfire episode (what/decision/link).
Before /clear: session-summary episode + 3-line ## STATE.
Lessons → ## LESSONS.
```

**What works:**
- `## STATE` (3 lines) captures: what's done, what's pending, critical merge order. Survives compaction verbatim since it's in the directive file that restarts the loop.
- `## LESSONS` captures non-obvious patterns that git history would not preserve (e.g., "never use HOME as variable name in shell scripts").
- Per-item Bonfire episodes provide timestamped decision records that outlive any session.
- Board rows (Supabase) provide live status that the fleet can query.

**What's missing:**
- Episodes are **write-only** until an admin runs Bonfire labeling (recall returns `[]`). Loops can't programmatically query prior context yet. PRs #1559 and #1560 are building `loop-recall.sh` to bridge this.
- The `## STATE` 3-line limit is too compressed. Merge order, env blockers, and critical invariants all compete for the same 3 lines.
- No standard structure for Bonfire episode bodies — some are 300+ word blobs, some are one-liners. Dense bodies degrade auto-extraction quality.

## Episode Quality Analysis

Observed patterns from coc-loop and zao-loop episodes:

| Problem | Example | Fix |
|---------|---------|-----|
| **Too long** | 300-word og-extract episode covering 15 tests + 4 context bullets | One episode per decision, not per session item |
| **Conflated decisions** | "Fixed smoke test AND added streamLink AND marked 4 board tasks done" | Separate episodes per distinct outcome |
| **Missing "why it matters"** | "PR #41 opened" (no consequence stated) | Always end with: consequence of NOT having this |
| **No link to board** | Episode references code but not the board row | Include board task ID where applicable |

**Recommended episode body structure:**

```
On <DATE>, <who/what> <did what> in <project>. 
Context: <why this was needed>. 
Decision: <what was chosen and why alternatives were rejected>. 
Outcome: <PR link / doc link / board row>. 
Risk if missing: <what breaks without this>.
```

## Recall Design (When Loop-Recall Is Live)

PRs #1559 (`loop-recall.sh`) and #1560 (`loop-recall-cli`) add the read side. Once merged, the ideal recall flow at loop start:

```bash
# 1. Read directive STATE (already happens — it's in the directive file)
# 2. Query Bonfire for recent episodes from this project
loop-recall "coc7 archive upload" --limit 5
# 3. Cross-reference with board for in-progress tasks
# 4. Start work
```

Until recall is live, the compact protocol IS the memory system. The directive `## STATE` is the highest-bandwidth persistent store — it survives every compaction because it lives in a file that is re-read at every session start.

## Priority Upgrades (ordered)

| Upgrade | Effort | Value | Status |
|---------|--------|-------|--------|
| **Merge loop-recall PRs (#1559, #1560)** | Low (review) | High (unlocks read side) | Open PRs |
| **Bonfire admin runs /labeling/hybrid** | Zaal-gated | High (enables /delve) | Blocked on admin |
| **Expand `## STATE` from 3 lines to structured block** | Low (directive edit) | Medium (survives compaction) | Proposal below |
| **Standardize episode body format** | Low (convention) | Medium (better auto-extraction) | This doc |
| **Per-loop compact validator** | Medium (script) | Medium (enforces protocol) | Future |

## Proposed `## STATE` Expansion

Replace the 3-line limit with a structured block that CI can validate is present before `/clear`:

```markdown
## STATE (YYYY-MM-DD HH:MM UTC)
DONE: <comma-separated PR links or "nothing">
PENDING: <comma-separated PR links + merge order if relevant>
BLOCKERS: <Zaal-gated items; "none" if clear>
NEXT: <first item on the queue>
```

This is 4 lines instead of 3 but survives compaction with full fidelity.

## Next Actions

| Action | Owner | Type |
|--------|-------|------|
| Merge PR #1559 (loop-recall.sh read side) | Zaal | review |
| Merge PR #1560 (loop-recall-cli) | Zaal | review |
| Ask Zaal to run Bonfire /labeling/hybrid | coc-loop | ping |
| Each loop adopts the structured `## STATE` block | All loops | convention |
| Each loop uses the recommended episode body structure | All loops | convention |
