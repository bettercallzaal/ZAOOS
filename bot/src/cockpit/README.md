# Personal Operator Cockpit (harness)

Zaal's daily operator loop as a Claude Agent SDK harness. WRAPS ZOE's existing
tracker (does not rebuild it) and adds the doc-983 gaps: a structured cockpit
brief, gated writes (owner-axis / archive), an artifact store, and (next) a
weekly stale review. Design: `research/agents/997` + `999`; gaps: doc 983.

## Why a harness (How I AI episode, doc 999)
A harness = specific context + specific actions + specific outcomes around the
model. Applied here:
- **Opinionated adapters, not generic tools** (`adapters.ts`) - pull only the
  tracker fields the cockpit needs, in the shape it needs.
- **Fixed output schema** (`types.ts` `CockpitBrief`) - defined in the harness,
  not the prompt.
- **Constraint flags** (`CockpitMode`: brief | triage | apply) - "read-only"
  enforced by the mode, not by asking the model nicely.
- **Artifact store** (`~/.zao/cockpit/brief-<date>.json`) - run evidence persists.

## Slices
- [x] **Slice 1 (this PR):** schema + opinionated adapters (read tracker,
  partition by owner-axis, top-3, stale, build gated proposals, apply-one) +
  read-only brief assembler/formatter + artifact store + unit tests. No SDK
  wiring yet, no live writes fired.
- [ ] **Slice 2:** Claude Agent SDK orchestration (`cockpit.ts`) - the loop that
  calls the adapters as tools, in brief/triage/apply modes.
- [ ] **Slice 3:** gated-write approval flow via Telegram (propose -> Zaal
  approves -> `applyWriteProposal`), + weekly stale review cadence.
- [ ] **Slice 4:** cron wiring (replace/augment ZOE's morning brief) + route to
  the ZAAL BOTS group.

## Files
- `types.ts` - CockpitBrief + WriteProposal + CockpitMode (the schema).
- `adapters.ts` - opinionated adapters; pure logic (topThree/needsYou/findStale/
  buildProposals) is exported separately for tests.
- `brief.ts` - assemble + format + persist the brief.
- `__tests__/cockpit.test.ts` - unit tests for the pure logic.

## Config (env, VPS bot/.env)
- `COWORK_TRACKER_URL` + `COWORK_TRACKER_KEY` - tracker read/write (already used by ZOE).
- `COCKPIT_HOME` - artifact store dir (default `~/.zao/cockpit`).

## Safety
Writes are GATED: `buildProposals` only PROPOSES; `applyWriteProposal` runs one
approved proposal at a time. Nothing writes without Zaal's approval (Slice 3).
