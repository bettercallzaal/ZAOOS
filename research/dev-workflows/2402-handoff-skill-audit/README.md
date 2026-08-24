---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "2319, 2092"
original-query: "can u help me improve my handoff skill lets auto research on it"
tier: STANDARD
---

# 2402 - There are two handoff systems and neither knows the other exists

> **Goal:** Improve the `/handoff` skill. Grounded first, per the rule that a
> capability is usually already built. It is - twice, incompatibly, and the rule
> that governs handoffs describes a skill that does something else.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **The skill and the vault-brief system are two systems, not one.** | `handoff-discipline.md` says one living brief per lane at `~/zao-vault/handoffs/<lane>.md`, **no dated copies**. The skill writes dated bundles to `.handoffs/session-<slug>/` and **never mentions the vault** - 0 occurrences in 378 lines. |
| 2 | **The rule's claim that the skill was upgraded is false.** | `handoff-discipline.md` says "per-terminal `/handoff` (the skill upgraded as the universal /end)". No such upgrade happened. The rule is loaded into every session and mis-describes the tool it names. |
| 3 | **Do NOT rewrite the skill. Reconcile the two, then cut.** | The skill's 9 phases are individually defensible and its delivery path is verified working. The problem is that it serves an architecture the estate replaced on 2026-08-18. |
| 4 | **The delivery chain WORKS - tested live end to end.** | The one part nobody should touch. Evidence below. |
| 5 | **Enforce the frontmatter contract in `zao-lane-boot`.** | 5 status values in use where 3 are specified, one unfilled template placeholder, one comment leaked into a value. All would fail a two-line check. |

## What is verified working, so nobody breaks it

Tested live on 2026-08-23, not read from documentation:

```
zao-tracker handoff "audit-probe-2026-08-23" "PROBE: ..."
  -> OK created handoff task 28ef3890-... (owner: Zaal, due: 2026-08-26)

row as stored:
  legacy_source  "handoff:audit-probe-2026-08-23"
  metadata.kind  "handoff"
  legacy_id      "9565"

bot/src/cockpit/adapters.ts:157
  isHandoff(t) => (t.legacy_source ?? '').startsWith('handoff:')   -> TRUE
```

**The chain is intact:** the skill's Phase 7.5 writes a row the cockpit correctly
classifies into its HANDOFFS lane. Probe task closed after verification.

Recording a near-miss, because it is the same failure this estate keeps having.
An intermediate query of `metadata->>'legacy_source'` returned `null` and a bug
report was three steps drafted before the discovery that **`legacy_source` is a
top-level COLUMN**, correctly set. The absence was in the place looked, not in
the system. `confirm-before-claiming-absence.md`, caught in the act.

## The finding: two systems, one estate

| | `/handoff` SKILL | `handoff-discipline.md` RULE |
|---|---|---|
| Adopted | earlier | **2026-08-18** (doc 2319, 36 decisions grilled) |
| Unit | a dated SESSION bundle | one living **LANE** brief |
| Location | `.handoffs/session-<slug>/` in-repo | `~/zao-vault/handoffs/<lane>.md` |
| Versioning | a new folder each time | **git history; explicitly "no dated copies"** |
| Shape | 5 sections A-E, 9 phases, 378 lines | 6-field frontmatter, ~56-line template |
| Delivery | ZOE cockpit inbox via Supabase | `zao-lane-boot` reads the vault |
| Knows the other exists | **no** - 0 mentions of the vault | claims the skill was upgraded to serve it |

Both work. They are simply not the same design, and the newer one supersedes the
older by date without anyone having retired or reconciled the older one.

**This is the estate's characteristic failure**, named independently by the
windows-desktop lane the same day: *"not missing knowledge - knowledge that stops
at one consumer."* Doc 2319 changed the architecture and updated the rule. It did
not reach the skill.

## Contract drift, measured against the live corpus

42 brief files in `~/zao-vault/handoffs/`. The contract specifies
`status: unconsumed | consumed | ready`. What is actually there:

```
  22  status: consumed
  10  status: ready
   2  status: unconsumed
   1  status: unconsumed   # receiver flips to consumed ON READ, then appends...
   1  status: ready-to-send
   1  status: open
```

Three defects, all mechanical, all currently silent:

1. **Two invented values** - `ready-to-send`, `open`. Neither is in the contract,
   and `zao-lane-boot --list` cannot classify them.
2. **A comment leaked into a value.** A YAML parser reads that status as the
   whole string including the `#` note.
3. **An unfilled template placeholder** - one brief carries `written: YYYY-MM-DD`
   literally. It was created from the template and never completed, and nothing
   noticed.

Ages: 8 briefs from 08-17, 7 from 08-18, 10 from 08-20, 6 from 08-21, and **2
from today**. Against 6 live tmux lanes. The 10 `ready` briefs are by design -
the rule calls them "the menu of attack sessions". The 22 `consumed` ones are
less clear, and nothing distinguishes a consumed-and-finished lane from a
consumed-and-abandoned one.

## Where the skill is heavier than its job

378 lines, 9 phases (0-8), producing a 5-section bundle with four delivery
mechanisms: repo file, Supabase inbox, Bonfire episode, clipboard.

The rule's model is smaller: one file, one command to boot it, git for history.

Not an argument that the skill is wrong - the phases exist because real failures
motivated them, and the cloud-receiver rule at line 306 (commit the bundle when
the receiver has no local filesystem) is a genuine insight that the vault model
gets for free by being a git repo.

It is an argument that **the two should not both run**. A session that ends with
`/handoff` produces a dated bundle in one place; a session that ends by updating
its vault brief produces a living document in another; and `zao-lane-boot` only
reads the second.

## What to actually change

Ordered by value per unit of risk. **None of it touches the verified delivery
chain.**

1. **Decide which unit is canonical: the lane brief or the session bundle.** The
   estate has already voted by building `zao-lane-boot` around the brief. Making
   that explicit costs one sentence and removes a standing contradiction.
2. **Point the skill at the vault.** Its Phase 4 should update
   `~/zao-vault/handoffs/<lane>.md` in place, keeping the A-E synthesis as the
   brief's body. Delivery via `zao-tracker handoff` stays - it works.
3. **Validate the frontmatter in `zao-lane-boot`.** Reject or flag an unknown
   status, an unfilled placeholder, and a value containing `#`. Two lines, and
   it makes all three current defects impossible.
4. **Correct `handoff-discipline.md`'s claim** that the skill was upgraded, or
   do the upgrade. Right now a rule loaded into every session is wrong about its
   own tooling - the same shape as the `thread-discipline.md` TOOL STATUS block
   corrected earlier today.
5. **Add a decay signal.** A brief whose `written` date is older than its lane's
   last activity is stale. The desktop lane's formulation applies: emit a
   timestamp, let the reader judge freshness. `written` already exists; nothing
   reads it as an age.

## What NOT to do

- **Do not rewrite the skill from scratch.** Nine phases encode nine remembered
  failures. Losing them to gain tidiness is a bad trade.
- **Do not add a third system.** That is how there came to be two.
- **Do not touch Phase 7.5.** Verified working today; the only part of either
  system with an end-to-end test behind it.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide canonical unit: lane brief vs session bundle | @Zaal | Decision | 2026-08-26 |
| Add frontmatter validation to `zao-lane-boot` (unknown status, unfilled placeholder, `#` in value) | @Zaal (Claude) | PR to dotfiles | 2026-08-27 |
| Point skill Phase 4 at `~/zao-vault/handoffs/<lane>.md`, keep Phase 7.5 unchanged | @Zaal (Claude) | Skill PR | 2026-08-29 |
| Correct the "skill upgraded as the universal /end" claim in `handoff-discipline.md` | @Zaal (Claude) | Rule PR | 2026-08-27 |
| Fix the three live defects: 2 invented statuses, 1 leaked comment, 1 `YYYY-MM-DD` | @Zaal (Claude) | Vault commit | 2026-08-26 |

## Sources

- [FULL - read on disk 2026-08-23] `~/.claude/skills/handoff/SKILL.md`, 378 lines, phases 0-8. Grep for `zao-vault`: **0 matches**.
- [FULL - read on disk] `.claude/rules/handoff-discipline.md` - the 2026-08-18 contract, including the "skill upgraded as the universal /end" claim.
- [FULL - measured 2026-08-23] 42 files in `~/zao-vault/handoffs/`; status and `written`-date distributions counted directly.
- [FULL - executed live 2026-08-23] `zao-tracker handoff` end-to-end, row inspected in Postgres, probe closed. The delivery-chain verification.
- [FULL - read on disk] `bot/src/cockpit/adapters.ts:155-167` - `isHandoff` / `partitionHandoffs`.
- [FULL] Cross-session exchange with the windows-desktop lane, 2026-08-23, source of the "knowledge that stops at one consumer" framing used above.
- Doc 2319 (the handoff workflow audit that produced the current rule) and doc 2092 (the `lane_handoffs` table that was designed and never built).
