---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-22
related-docs: "2092, 2317, 2318, 2373, 2374"
original-query: "can we improve our handoffs from project to project and claude code sessions to claude code session and device to device lets audit our workflow and find places for improvement (+ 9 grill rounds, 36 decisions)"
tier: STANDARD
---

# 2319 - Handoff Workflow Audit: sessions, projects, devices

> **Goal:** Audit every handoff surface in the ZAO operating stack, name the failures with evidence, and record the 36-decision redesign Zaal locked on 2026-08-18.

## Key Decisions (all Zaal, 2026-08-18, via 9 grill rounds)

| Area | Decision |
|---|---|
| Home | One living brief per lane at `zao-vault/handoffs/<lane>.md` - git history is the version layer; ALL projects share the one dir (`repo:` field). Old `~/.zao/handoffs` dated files migrated (13 living, 24 archived with reasons). |
| Contract | Full template (frontmatter + mission / priorities / tap stack / cautions / links / summary tail), soft cap 200 lines. |
| Trigger | Written by 75% context (rule) + PreCompact hook emergency-dumps a minimal brief if none exists (`scripts/hooks/precompact-handoff-guard.sh`). |
| Consumption | Receiver flips `consumed` ON READ + appends a gaps-found note (quality loop). |
| Boot | `zao-lane-boot` (zaal-dotfiles): per-machine one-command wave; `--list` = restart debt at a glance. Shipped + tested. |
| Lifecycle | Lane idle >1 day: hand off, merge back, close; `status: ready` briefs form the READY LIST of instantly-openable attack sessions. |
| Rhythm | Morning: phone daily note -> boot wave -> grill (top 2 picked at wake from what Zaal said the night before). Evening: per-terminal `/handoff`-as-/end, not a global end-day. |
| Devices | `machine:` field; each box boots only its briefs; VPS/Pi join post-disk-fix; phone = Working Copy read+write. |
| Boundaries | Message = transport, handoff = succession, board = tasks, Bonfire = knowledge. Codified in `handoff-discipline.md` rule 7. |
| Cross-lane | `IN-FLIGHT.md` shared map (claimed doc numbers, branches) - answers the two doc-number collisions of 2026-08-18. |
| People | `handoffs/people/<name>.md` briefs, TG-pasted by Zaal; stakeholder-reply after every meeting. Iman: vault read invite (his tap prepped). |
| Capture door | Post-OneNote physical capture: iPhone Shortcut -> Working Copy -> `zao-vault/inbox/`; organizer routes. |
| Phone | Bigger than ZOE-as-phone-UI: dedicated ideation block on phone-as-hop-in-anywhere (board card, feeds doc 2314 fleet interface). Each lane also gets a ZAAL BOTZ TG topic so the phone can drive terminals. |
| Metrics | PRIMARY: waiting% (Zaal: "if it had 50% time waiting we couldve done it in half the time"). Plus closed loops/wk, taps per closed loop, capture-to-routed latency, restart debt hours. |
| Human-only core | Relationships + outreach voice, and creative final cut - never delegated. (Money/on-chain + prod merges stay gated by existing rules but were NOT declared forever-human.) |
| Verification | Failure drill after build (kill a lane, recover from brief), then relay-stack decommission audit. |
| Security block | Prepped brief + `zao-rotate` jump command; board card due today (~45 min, estimate at Zaal's explicit request). |

## The audit: what existed, what failed

### Surfaces inventoried (2026-08-18, all verified directly)
1. `~/.zao/handoffs/` - 37 dated files, machine-local, no status field, needs Zaal's tap per restart. The de-facto system.
2. `research/_handoffs/` in ZAOOS - 3 files, stale since May. Dead surface.
3. `/handoff` skill - session-bundle compressor to Bonfire/tracker; solid bones, wrong landing path now.
4. `lane_handoffs` Supabase table (doc 2092 decision, 2026-07-27) - **NEVER BUILT.** Direct query of the cowork project found no such table, yet agent-loops rule 36 cites it as the record surface. Decision-vs-reality drift, now corrected by `handoff-discipline.md`.
5. Relay stack: `lane-send` (with its own executed-into-shell scar), `lane-relay-daemon`, `zao-relay`, `relay-autopull` (was silently failing on every prompt until vanishing-dependencies caught it).
6. ECC session summaries - auto-saved, machine-local, not connected to briefs (now embedded as the summary tail).
7. Bonfire, board, memory files - healthy, but were absorbing succession content that belongs in briefs.

### Failures with evidence (all within 5 days)
- wavewarz lane hit 90% context and died WITHOUT writing its handoff (fleet assessment 2026-08-17) - no trigger existed.
- 5 lanes sat stopped for days with unconsumed handoffs - restart debt invisible until hand-counted.
- Two scratchpad artifacts died with their sessions (ruleset.json, newsletter-craft-research.md) despite an explicit COPY-FIRST warning in a handoff.
- Two doc-number collisions in ONE day (2315 Dunford vs ElizaOS; the 2314 near-miss) - lanes blind to each other's claims.
- Composer wedge (#3112) eats typed directives - transport and record were the same fragile channel.
- Handoffs unreadable from the Windows box, VPS, Pi, or phone - single-machine files.

## What shipped with this doc (same day)
- Vault migration complete: `zao-vault/handoffs/` (13 living briefs, archive with reasons, TEMPLATE, IN-FLIGHT, people/, inbox/, security-rotation brief) - pushed.
- `zao-lane-boot` + `zao-rotate` in zaal-dotfiles - committed, pushed, `--list` verified against the live fleet.
- `handoff-discipline.md` rule + PreCompact guard hook (this PR).
- 6 board cards: security block (today), phone ideation, waiting% aggregator, lane lifecycle + TG topics, failure drill, Iman invite.

## Also See
- [Doc 2092](../2092-lane-handoff-coordination/) - the unbuilt table this supersedes
- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - vault-as-hub research the home decision rests on
- [Doc 2318](../../agents/2318-elizaos-memory-vs-zao-corpus-agent/) - the organizer that will tend inbox/ + routing

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge this PR (rule + hook + doc) | @Zaal | merge | 2026-08-19 |
| Run `zao-rotate` security block | @Zaal | 45-min block | 2026-08-18 |
| Upgrade /handoff skill: vault landing path + summary tail + /end semantics (zaal-dotfiles PR) | @Claude(zaoos-infra lane) | skill PR | 2026-08-20 |
| zj: brief age + status column | @Claude(any lane) | dotfiles PR | 2026-08-21 |
| Update agent-loops rule 36 wording (lane_handoffs -> vault briefs) | @Claude(zaoos-infra lane) | PR | 2026-08-20 |
| iPhone capture Shortcut -> Working Copy -> inbox/ | @Zaal + lane doc | setup | 2026-08-23 |
| Failure drill, then relay decommission audit | @Claude(any lane) | drill + doc | 2026-08-24 |

## 2026-08-22 Review Notes

- **Proven value since shipping:** The IN-FLIGHT.md cross-lane collision system caught 3 doc-number collisions in one session (2026-08-22) — docs 1659/2273/2282 renamed to 2370/2371/2372 via PR #3251. The system works.
- **Doc 2373 (ZAO Mistakes Log, 2026-08-22):** documents production failures; several of them (Silent-Failure pattern ×4) correlate directly with the "merged ≠ running" finding in this audit. The two docs are complementary.
- **Neynar / Farcaster operator crisis (doc 2374, 2026-08-17):** The operator handoff is a scenario the handoff system was explicitly designed for — platform handoffs with visible restart debt. ZOL (ZOE's Farcaster output lane) depends on Neynar and is the first continuity concern. A `handoffs/zol-neynar-continuity.md` brief is the recommended pre-emptive action.
- **Security rotation block (zao-rotate):** was due 2026-08-18. `~/zao-vault/handoffs/security-rotation.md` was NOT found on this Linux machine as of 2026-08-22; the block is still pending. Board card 9417 (P1) is open.

## Sources
- Direct inventory: `ls ~/.zao/handoffs` (37 files), `research/_handoffs/` (3), cowork Supabase information_schema query (lane_handoffs absent), `~/bin/lane-send` header (executed-into-shell scar), doc 2092 full read - [FULL, local reads + live query 2026-08-18]
- Failure evidence: 2026-08-18 zaoos-infra founding handoff (fleet assessment), vanishing-dependencies.md (relay-autopull), issue #3112 (composer wedge) - [FULL, repo files]
- Zaal's decisions: 9 AskUserQuestion rounds this session, answers quoted verbatim where load-bearing - [FULL, primary]
