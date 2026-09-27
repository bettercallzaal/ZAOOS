---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-23
superseded-by:
related-docs: 2423, 2420, 2461, 2475, 2221, 2342
original-query: "can u review all of my terminals and determine how we should flow our lanes and lets do a /zao-research on our whole flow here"
tier: STANDARD
---

# 2540 - The lane estate, audited against itself

> **Goal:** Measure how work actually flows across 28 live sessions, 90 handoff briefs and 590 open cards, and say what the flow should be - from counts taken on 2026-09-23, not from the design documents.

## Key Decisions

Recommendations first. Every one is backed by a count in Findings.

| # | Decision | Because |
|---|---|---|
| **1** | **ENFORCE or DELETE `done.json`. Do not leave it optional.** | 12 of 90 briefs have one, and **1 of 66 items has ever been flipped to `done`**. 11 of the 12 lists have never been touched. A state contract with 1% adoption is not a contract. |
| **2** | **COLLAPSE the brief `status:` vocabulary to the two values `lane-init` defines.** | **17 distinct values** are in use across 90 briefs, and **13 briefs carry no `status:` field at all**. Nothing can route on a field with 17 values and a 14% null rate. |
| **3** | **DATE-STAMP `BLACKBOARD.md` CURRENT MISSION and fail a check when it ages past 72 hours.** | Read on 2026-09-23, it says the reveal "is Sunday 13 September, three days out". **That reveal was 10 days ago.** The live-state file is describing a future that is past. |
| **4** | **FIX `zao-lanes` before trusting any lane count, including this doc's.** | It reports **11 lanes while `ListAgents` reports 28 sessions**, and one row reads **"20719d ago"** - a Unix epoch-0 timestamp rendered as an age. The instrument that measures the fleet is itself producing a false measurement. |
| **5** | **When two lanes read the same artifact, they must exchange traces, not conclusions.** | Measured live this morning: two lanes read the same repo and reached opposite conclusions about whether a decision existed. Cognition's Principle 2 exactly, and the only reason it surfaced was a third lane relaying gossip. |
| **6** | **DROP `card_type` or populate it. It is 85% blank.** | **500 of 590** open cards have `card_type` unset. The column exists to route work to the right lane and it cannot route 85% of the board. |
| **7** | **DO NOT reduce the lane count. Throughput is not the problem.** | **571 PRs merged in 7 days** across 22 repos, roughly 82 a day. The estate ships. What it cannot do is agree with itself. |

## The one-sentence finding

**This estate's bottleneck is not capacity, it is that state lives in prose no tool can query, so every lane re-derives it and they disagree in ways nobody notices until a human is in the room.**

## Findings

### 1. The state mechanism is prescribed, documented, and unused

`lane-init` (`~/.claude/skills/lane-init/SKILL.md`, Step 3) requires every lane to ship a `<lane>.done.json` whose booleans are the completion contract. It cites Anthropic's measured reason: *"the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files."* A checklist in prose gets rewritten to match what happened; a JSON boolean does not.

Measured on 2026-09-23 in `~/zao-vault/handoffs/`:

| Metric | Count |
|---|---|
| `.md` briefs | 90 |
| briefs with a matching `.done.json` | **12** |
| briefs with **no** done-list | **78** |
| done-list items total | 66 |
| items ever flipped `true` | **1** |
| lists where nothing was ever flipped | **11 of 12** |

So the mechanism designed to stop a lane declaring victory is present on 13% of lanes and has recorded one completion in its lifetime. **This is not lanes lying about progress. It is lanes not using the file at all.**

The cheap read is "remind lanes to update it". That has been the standing instruction and it produced 1 of 66. The estate has already measured what honour-system rules achieve here - the `clipboard` skill records **3-40% compliance for honour-system rules against ~100% for structurally-enforced ones**. Either a hook refuses a lane's completion claim without a flipped item, or the file should go, because right now it is a contract everyone can point at and nobody executes.

### 2. The status field has 17 values and a 14% null rate

`lane-init` Step 5 defines exactly two: a brief lands `unconsumed` and the lane flips it to `consumed` **on read, not on boot**.

In practice, `grep -h "^status:" handoffs/*.md` returns **17 distinct values**, among them `active`, `consumed`, `current`, `handed-off`, `held`, `new`, `pending`, `ready`, `standing`, `superseded`, `surface-complete`, `unconsumed`, `unlabelled`, plus free-text like `complete - all 6 batches applied 2026-09-08; 366 of 366 routed; 0 cards closed`. A further **13 briefs have no `status:` line at all**.

Counts by the two canonical values: **16 `consumed`, 11 `unconsumed`**. That is 27 of 90 briefs using the defined vocabulary - **30%**.

The vocabulary did not drift because people were careless. It drifted because **the two defined values cannot express the real states**, which include "written but the lane never booted", "booted and abandoned", "superseded by a newer brief" and "standing, never completes". A vocabulary that cannot say what is true gets extended at the point of writing, silently, by whoever is writing.

### 3. The live-state file is describing a past future

`~/zao-vault/BLACKBOARD.md` is 783 lines and its header declares itself *"the live state of ZAO"*, with CURRENT MISSION hand-written by Zaal or the seat holding the orchestrator role.

Its CURRENT MISSION section, read 2026-09-23, contains:

> "the reveal is Sunday 13 September, three days out"

**The reveal was 10 days before this reading.** The paragraph is dated 2026-09-10 in its own text, so it is not undated - it is dated and stale, which is worse, because a reader who checks the stamp still gets a wrong picture of what is urgent.

The file itself is not neglected: it was committed as recently as 2026-09-22 (`b0652c39`) and its mtime is 06:20 today. **Sections below CURRENT MISSION are maintained by scripts** - `fleet-health.sh` rewrites ACTIVE AGENTS hourly, `inflight-row.py` owns WORK PACKETS, `build-needs-zaal.py` owns WAITING FOR ZAAL. The stale part is precisely the part with a **human writer and no staleness check**.

This is the estate's dominant mistake shape appearing in its own status board. `~/zao-vault/MISTAKES.md` records **23 entries under `surface-cannot-report-state`** - by a wide margin the most common shape, and one that has already graduated.

### 4. The fleet instrument disagrees with the fleet, and prints an impossible number

Two measurements taken within one minute on 2026-09-23:

| Source | Sessions reported |
|---|---|
| `ListAgents` (harness) | **28 peer sessions** |
| `~/bin/zao-lanes` | **11 lanes** |

`zao-lanes` also printed a row reading **`grill-20  20719d ago`**. 20,719 days is about 56.7 years; counted back from today it lands on the Unix epoch. **That is a zero timestamp rendered as an age**, which is the same false-measurement class the global `CLAUDE.md` rule was written for: *"A near-universal result from a new instrument is the instrument."*

The gap is partly explainable - `ListAgents` counts Remote Control and offline sessions that `zao-lanes` does not - but **neither tool states its denominator**, so a reader cannot tell a real count from a partial one. Doc `agents/2461-herdr-agent-runtime` already recorded that *"ZAO derives lane state by scraping terminal panes and got that wrong"*, and doc `agents/2420-zorca-gui-redesign` argued the dashboard should be an attention router rather than a status page. **Both findings stand and neither has been applied to `zao-lanes`.**

### 5. The board cannot route, because the routing column is blank

`zao-tracker types`, run 2026-09-23 with the denominator printed:

| card_type | open cards |
|---|---|
| unset | **500** |
| review | 39 |
| decision | 33 |
| record | 12 |
| hand | 3 |
| build | 3 |
| ask | **0** |
| **total open** | **590** |

Open by status: **389 todo, 194 in_progress, 7 blocked**.

`ask` at zero is the informative cell. The type exists for work that is a question to a person, and this estate's single most common blocking state is **waiting on one named human** - Aziz for a stream key since 2026-08-22, Holly for a certificate, Kenny for an uploader answer, Venus for a submission. **None of it is typed as an ask.** Not one card in 590.

The `in_progress` column is the other hazard. Six AV cards audited on 2026-09-23 all carried `in_progress` and **none were in motion**; three came back UNMEASURED - searched, no evidence either way. **`in_progress` currently means "somebody once intended to", not "somebody is".**

### 6. Throughput is high. Agreement is the scarce resource.

| Metric | Count | Window |
|---|---|---|
| PRs merged, both owners | **571** (floor; search API puts it near 580) | 7 days |
| repos receiving merges | 22 | 7 days |
| merges per day | ~82 | 7 days |
| clipboard clips emitted | **83** | 2026-09-22, one day |
| clips all time in vault | 403 | - |
| decision files | 83, of which **30 are grills** | - |

Top repos by 7-day merges: `ZAOOS` 102, `zaal-dotfiles` 101, `ZAOstock` 93, `wwtracker` 89, `finance-hq` 46, `zaoonparagraph` 33, `poidhz` 20.

**Nothing here looks like a capacity problem.** The `per_page=100` cap means the three biggest repos were undercounted by the loop; a `search/issues` spot check corrected `zaal-dotfiles` 100 to 101, `ZAOOS` 97 to 102, `ZAOstock` 89 to 93, so the true total is near 580 rather than 571. **Stated because a floor reported as a count is the shape this doc is about.**

### 7. The failure that matters, caught live while writing this doc

At 06:14 on 2026-09-23 the dotfiles seat presented Zaal with a four-option decision on which relay carries the 3 Oct stream. The options were built on `STREAMING-BACKEND.md` in `Build-Africa-DAO/baraza-tv` being the settled backend decision.

At 06:17 the baraza lane reported, via a third lane, that it was never a decision. Verified directly at 06:18:

- line 3 of that file reads **"Status: Decision proposed, not yet committed. See 'Open questions' before wiring."**
- `gh api repos/Build-Africa-DAO/baraza-tv/commits?path=STREAMING-BACKEND.md` returns **exactly one commit**, `73c2e481`, 2026-06-15, message beginning **"docs(streaming): propose"**.

**Two lanes read the same file and reached opposite conclusions about whether a decision existed.** The correction arrived three minutes after a human had already been asked to choose, and it arrived by relay, not by any mechanism.

This is Cognition's Principle 2 verbatim: *"Actions carry implicit decisions, and conflicting decisions carry bad results."* The seat's implicit decision - that a proposal is a decision - was never stated, so it could not be checked.

### 8. Where the outside literature applies to us, and where it does not

Walden Yan's *Don't Build Multi-Agents* (Cognition, 2025-06-12) argues two principles and says **"you should by default rule out any agent architectures that don't abide by them"**:

1. **Share context, and share full agent traces, not just individual messages.**
2. **Actions carry implicit decisions, and conflicting decisions carry bad results.**

**Taken literally this condemns our estate, and taken literally it would be wrong to apply.** Yan's failure case is *one task* decomposed into subtasks - the Flappy Bird clone whose background comes back as Super Mario. Our lanes are not a decomposition. `finance-hq`, `poidhz`, `wwtracker` and `zaostock` own different repos, different domains and different clocks, and a single-threaded agent over 22 repos and 590 cards is not available at this size.

**The principle transfers exactly where the domains overlap.** When two lanes touch the same artifact - the same repo file, the same tracker card, the same person - they are decomposing one task whether or not anyone designed it that way, and section 7 is what that costs. Our lanes exchange **conclusions** through the vault and through relay messages. They do not exchange **traces**. Doc `agents/2423-vault-as-transport-inter-terminal-context` already reached the related conclusion from the other direction: *the vault is memory, not a message bus.*

The honest synthesis: **keep the lanes, and make overlap detectable.** Two lanes reading the same file is the event worth catching, and nothing catches it today.

## Comparison: three ways to fix agreement

| Approach | What it costs | What it buys | Verdict |
|---|---|---|---|
| **Collapse to fewer lanes** | Loses domain separation; one context window over 22 repos and 590 cards | Cognition-compliant by construction | **REJECT.** 571 merges a week is not a workload one context survives. |
| **Keep lanes, share full traces** | Every lane reads every other lane's transcript; context cost scales with lane count squared | Full Principle 1 compliance | **REJECT.** 28 sessions makes this arithmetically impossible. |
| **Keep lanes, detect overlap and force a trace exchange only there** | One index of which lane touched which artifact, and a check that fires on collision | Catches section 7's failure at the moment it happens rather than by relay | **ADOPT.** The overlap is rare; the cost of missing it is a human deciding on a false premise. |

## The flow, stated

What the estate should do, in the order a piece of work moves:

1. **A card is typed when it is created.** `decision`, `hand`, `ask`, `review`, `build` or `record`. An `ask` names the human and the date they were asked. Untyped cards do not route, and 500 of them do not route today.
2. **A brief is written only after measuring**, carries `unconsumed`, and ships with a `done.json` whose items are observable things that exist when done.
3. **A lane flips `consumed` on read** and appends what the brief got wrong under Gaps found. That note is the only feedback this system has.
4. **A lane's completion claim is a flipped boolean, not a sentence.** Nothing else counts.
5. **When a lane touches an artifact another lane touched, both get told.** This is the new mechanism and the only one this doc asks to build.
6. **A gate - money, public, outbound, on-chain, identity - stops at Zaal.** This already works: on 2026-09-23 the poidhz lane refused to cast a bounty on a relayed instruction, writing *"'ask poidhz to do this' relayed through a lane is not his authorization for that act"*. **That is the estate's healthiest measured behaviour and nothing in this doc should weaken it.**
7. **A measurement that could not be taken prints UNKNOWN**, never 0 and never "clean". `zao-assert` exists for this and the rule is in the global `CLAUDE.md`.

## What I could not establish

- **Whether the 78 briefs without a done-list ever completed.** No mechanism records it. Absence of a done-list is not evidence of abandonment, and this doc does not claim it is.
- **Why `zao-lanes` sees 11 of 28.** The Remote Control and offline difference explains part of it. I did not read the script and cannot say the remainder is accounted for.
- **Whether the 500 untyped cards are untyped because typing is new or because nobody types.** `zao-tracker type` sets one card at a time; whether a backfill was ever attempted is unmeasured.
- **The real distribution of brief staleness against lane activity.** 62 briefs untouched over 7 days and 34 over 14 days is a file-mtime measurement. A standing lane with a stable brief looks identical to an abandoned one.
- **Whether any of this is felt as a problem by the lanes themselves.** This is a count of artifacts, not a survey of lanes. Nobody was asked.

## Also See

- [agents/2423-vault-as-transport-inter-terminal-context](../2423-vault-as-transport-inter-terminal-context/) - the vault is memory, not a message bus
- [agents/2420-zorca-gui-redesign](../2420-zorca-gui-redesign/) - the dashboard is an attention router, not a status page
- [agents/2461-herdr-agent-runtime](../2461-herdr-agent-runtime/) - ZAO derives lane state by scraping panes and got it wrong
- [agents/2342-tmux-bridge-lanes-workflow](../2342-tmux-bridge-lanes-workflow/) - the lane transport layer
- [dev-workflows/2475-research-system-internal-audit](../../dev-workflows/2475-research-system-internal-audit/) - the same audit-yourself method applied to research
- [dev-workflows/2221-agentic-mac-landscape](../../dev-workflows/2221-agentic-mac-landscape/) - how others run agentic Macs

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add a PreToolUse hook refusing a lane completion claim when its `done.json` has zero flipped items; ship with the 12 existing lists | @Zaal | PR to zaal-dotfiles | 2026-10-10 |
| Collapse brief `status:` to `unconsumed`/`consumed` and add a guard rejecting any other value in `~/zao-vault/handoffs/*.md` | @Zaal | PR to zao-vault | 2026-10-10 |
| Add a date stamp and 72-hour staleness check to `BLACKBOARD.md` CURRENT MISSION; check fails loudly rather than rewriting | @Zaal | PR to zao-vault | 2026-10-06 |
| Fix `zao-lanes` to print its denominator and to never render a zero timestamp as an age | @Zaal | PR to zaal-dotfiles | 2026-10-06 |
| Backfill `card_type` on the 39 `review` and 33 `decision` cards' neighbours; type every new card at creation | @Zaal | Tracker | 2026-10-17 |
| Build the artifact-overlap index: record which lane touched which repo path, and notify both on collision | @Zaal | PR to zaal-dotfiles | 2026-10-24 |
| Re-run every count in this doc and record the delta | @Zaal | Research re-validation | 2026-10-23 |

## Sources

Internal measurement, all taken 2026-09-23 between 06:14 and 06:36 on this Mac:

- `~/zao-vault/handoffs/` - 90 briefs, 12 done-lists, 66 items, 1 flipped. `[FULL]` method: `ls`, `grep`, `wc`, and a python pass over every `*.done.json`
- `~/zao-vault/BLACKBOARD.md` - 783 lines, CURRENT MISSION stale by 10 days, last commit `b0652c39`. `[FULL]` method: `sed`, `git log`
- `~/zao-vault/MISTAKES.md` - shape counts, `surface-cannot-report-state` 23. `[FULL]` method: `grep -oE` with a control
- `~/bin/zao-tracker list|types` - 389 todo, 194 in_progress, 7 blocked, 500 of 590 untyped. `[FULL]` method: the tool's own denominator-printing mode
- `~/bin/zao-lanes` - 11 lanes, one epoch-0 timestamp. `[FULL]` method: direct invocation
- `ListAgents` - 28 peer sessions. `[FULL]` method: harness tool
- `gh api repos/*/pulls?state=closed` across 22 repos, plus `search/issues` spot check. `[FULL]` method: `gh api`
- `Build-Africa-DAO/baraza-tv` `STREAMING-BACKEND.md` and its commit list. `[FULL]` method: `gh api contents` + `gh api commits`, private repo, read with an authenticated `gh`

External:

- [Don't Build Multi-Agents - Walden Yan, Cognition, 2025-06-12](https://cognition.ai/blog/dont-build-multi-agents) - `[FULL]` method: `curl` + HTML strip, 11,378 chars of raw text read, HTTP 200. Principles quoted verbatim from that text, not paraphrased. [HN: 123 points, 89 comments](https://news.ycombinator.com/item?id=45096962)
- [Effective harnesses for long-running agents - Anthropic, 2025-11-26](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - `[PARTIAL - quoted at second hand]` method: not fetched this run. The initializer argument and the JSON-over-Markdown finding are quoted as `lane-init` relays them, and are marked as such in Findings 1 rather than presented as a direct read. [HN: 125 points, 37 comments](https://news.ycombinator.com/item?id=46081704)
- [Context Engineering for Agents - Lance Martin, 2025-06-23](https://rlancemartin.github.io/2025/06/23/context_engineering/) - `[PARTIAL - listing only]` method: HN Algolia API returned title, URL and score; the article body was not fetched. Cited for the existence of the discussion, no claim drawn from its contents. [HN: 117 points, 35 comments](https://news.ycombinator.com/item?id=44432596)
- Hacker News Algolia API - community source for all three above. `[FULL]` method: `curl -sG` against `hn.algolia.com/api/v1/search`, keyless, HTTP 200, 32,691 bytes

**Two sources are PARTIAL and stayed PARTIAL.** The Anthropic harness piece is load-bearing for Finding 1 and is quoted at second hand through `lane-init`; a future revision should fetch it directly. Saying so is cheaper than the alternative this doc spent 2,000 words describing.
