---
topic: business
type: audit
status: research-complete
last-validated: 2026-08-17
superseded-by:
related-docs: 2251, 2179, 2278, 2290
original-query: "Spark entries - ~/.zao/private/2026-08-16-unfinished-audit-sparkz.md lists 13 Spark candidates from the unfinished-work audit. Verify each against live repos (state-claims.md: name the source), write the doc, PR it."
tier: STANDARD
---

# 2302 - The 13 Spark candidates, verified against what actually exists

> **Goal:** Check every candidate on the 2026-08-16 sheet against live repos and docs so Zaal picks from verified state, not from memory. Publishing to Sparkz stays his tap.

## The finding that reorders the list

**Candidate 13 (Zoostr) is not a candidate - it is already committed.** The `sparkz` ICM box states: *"V1 proves ONE loop: Zoostr (ZABAL x Boostr) as a Creator Capsule"* and *"First spark: Zoostr."* The sheet listed it as an idea to gauge demand; the platform's own canonical description has already designated it the launch Spark. Whatever goes up first, the box says it is this.

## All 13, verified

Every verdict names its source. "Exists" means code or doc on disk/remote read this run; "idea-only" means no artifact found in the places searched.

| # | Candidate | Verdict | Source, named |
|---|---|---|---|
| 1 | Battles-as-judging | **Drafted, not in research/** | `~/.zao/drafts/2026-08-15-wavewarz-finals-battle-design.md` exists (plus finals-json-fill and finals-dates-ask siblings). Nothing under `research/wavewarz` or `research/zabal` matches - the design has not graduated to a doc. 3 open questions per the audit sheet |
| 2 | Zlank/Sparkz launchpad-of-launchpads | **Repo live, public** | `gh api repos/bettercallzaal/zlank`: public, *"No-code Farcaster Snap builder. Stack blocks, hit Deploy"*, pushed 2026-07-23. A Spark would be positioning, not building |
| 3 | Brand-stable token | **Idea-only, NOT ours** | No artifact anywhere searched. Jordan + Adrian's idea per the sheet - **needs their OK before any Spark** (`credit-attribution.md`) |
| 4 | Tokenless-first event Empire | **Pattern live in production** | `gh api repos/ZAODEVZ/ZAOstock`: public, pushed **today** (2026-08-17T13:26Z). The ZAOstock hub-and-leaderboard IS the proof case, running |
| 5 | Points-not-tokens IRL onboarding | **Idea-only, NOT ours** | No artifact found. Jordan's framing per the sheet - same OK-first rule as #3 |
| 6 | Cross-chain artist value ledger | **Attribution verified, build NOT independently verified** | Pascaline appears in `research/business/2158` (relationship map) and `2179` (creator organism stack). The sheet says she BUILT it as a ZABAL entry; her submission itself was not reachable this run - the claim rests on the sheet, and her name stays on it |
| 7 | Relay-grill | **Built and on disk** | `~/bin/zao-ask`, `zao-ask-check`, `zao-ask-dm`, `lane-relay-daemon` all present. Ran live 2026-08-16 (10 grades through it, per the sheet). A Spark would be packaging, not building |
| 8 | Surprise-drop reward rail | **Pattern-only, deliberately** | No code found; the sheet frames it as the legally-clean pattern itself. Jordan's framing - OK-first applies |
| 9 | Ticketing on Unlock | **Base doc exists, build parked** | `research/music/273-web3-streaming-features-tipping-gating-tickets/` on disk; the audit sheet parks the build to next week, in the ZAO estate not Audos |
| 10 | Ambient voice capture | **Thesis doc merged, build awaiting yes/no** | `research/technology/2278-ambient-voice-agent-interface/` on main; the `zao-listen` daemon decision is still open with Zaal |
| 11 | Convo datasets for AI artists (MCP) | **Idea-only** | Braindump-born; no artifact found. Reference `web3voyager.com` noted on the sheet, unfetched |
| 12 | Community-as-game | **Idea-only, overlaps #4** | No artifact. Its substance (achievements + points end-to-end) is largely what the ZAOstock Empire pattern already does - a Spark should say what is NEW beyond #4 |
| 13 | Zoostr | **ALREADY THE COMMITTED FIRST SPARK** | `research/identity/icm-boxes/sparkz.llm.txt`: "First spark: Zoostr." Repo `bettercallzaal/sparkz` public, pushed 2026-08-10 |

## What this changes about the pick

- **Strongest and cheapest to post:** #13 is already canon; #2, #4, #7 are backed by live, public, running artifacts - those Sparks are announcements of things that exist, which is the credible kind.
- **Blocked on consent, not work:** #3, #5, #8 are Jordan's (and Adrian's) ideas. The sheet already says so; this doc confirms no ZAO artifact exists that would muddy authorship. **Ask before posting** - a Spark of someone else's idea without their OK is the exact thing `credit-attribution.md` bans.
- **One attribution to nail down:** #6 - Pascaline's build is asserted by the sheet but was not independently verifiable this run. Verify her entry before a Spark points backers at it.
- **One graduation overdue:** #1's finals battle design is three drafts deep in `~/.zao/drafts` with a live clock (finals are imminent) - it should become a numbered doc regardless of whether it becomes a Spark.

## Findings

1. **Zoostr is already committed as the first Spark** in the platform's own canonical box - the sheet under-stated it.
2. **Four candidates are backed by live artifacts** (zlank, ZAOstock, relay-grill, doc 2278); six are idea-only; three carry someone else's authorship and need consent first.
3. **The finals battle design is the only candidate with a deadline**, and it lives in drafts, not research.
4. **Nothing on the sheet required correction** - its credits (Jordan x3, Pascaline x1) all held up, which is worth saying about a hand-compiled list.

## Also See

- [Doc 2251](../2251-sparkz-rebrand-and-modular-architecture/) - the Sparkz architecture
- [Doc 2179](../2179-creator-organism-stack-sparkz/) - the creator organism stack, where Pascaline appears
- [Doc 2278](../../technology/2278-ambient-voice-agent-interface/) - candidate 10's thesis
- [Doc 2290](../../wavewarz/2290-wavewarz-investor-analytics/) - the WaveWarZ numbers behind candidate 1's proof case

## Next Actions

| Action | Owner | Type | By When |
|--------|---|---|---|
| Pick which Sparks go up (menu above; #13 is already canon, #2/#4/#7 are the credible-now tier) | @Zaal | Gated post | 2026-08-19 |
| Ask Jordan (and Adrian) for OK on #3/#5/#8 before any post | @Zaal | Gated outbound | 2026-08-19 |
| Verify Pascaline's cross-chain ledger entry before a Spark cites it | @Zaal | Manual | 2026-08-19 |
| Graduate the finals battle design from drafts to a numbered doc - it has the only live clock | @Zaal | Merge | 2026-08-18 |

## Sources

- `~/.zao/private/2026-08-16-unfinished-audit-sparkz.md` - **[FULL]** read from disk, 63 lines, all 13 candidates.
- `gh api` on `bettercallzaal/zlank`, `ZAODEVZ/ZAOstock`, `bettercallzaal/sparkz` - **[FULL]** visibility, push dates, descriptions verbatim.
- `research/identity/icm-boxes/sparkz.llm.txt` - **[FULL]** the "First spark: Zoostr" designation, read from the repo mirror. Caveat from doc 2286: authored boxes have drifted from live; this claim is from the repo source.
- `~/bin/` listing + `~/.zao/drafts/` listing - **[FULL]** relay-grill binaries and the three finals drafts confirmed present.
- `research/` greps for battles-as-judging, Pascaline, zoostr - **[FULL]** method stated inline where a search came back empty.
- Pascaline's actual ZABAL submission - **[FAILED]** not reachable this run; her build status rests on the sheet and is flagged, not asserted.
- `web3voyager.com` - **[FAILED]** not fetched; noted as the sheet's reference only.

## Credit

Candidates 3, 5, 8 are **Jordan Oram**'s framings (3 with **Adrian**); 6 is **Pascaline**'s build; 13 was pitched to **Jordan Oram + cashlessman**. The sheet's own credit lines held up under verification and are preserved here. Sparkz itself: `bettercallzaal/sparkz`, public, OSS-first.
