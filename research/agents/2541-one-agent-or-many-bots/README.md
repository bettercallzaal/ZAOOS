---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-23
superseded-by:
related-docs: 688, 460, 601, 800, 2155, 2540
original-query: "we can do zoe if we wanna have a bot thats laready mostly live and just stay working iwht one agent rather than splitting up and having to keep a bunhc up to date /zao-research how to best manage this"
tier: STANDARD
---

# 2541 - One agent or many bots: the estate already consolidated, then forked

> **Goal:** Answer whether to upgrade ZOE rather than the ZAOstock bot, by measuring what the bot fleet actually is on 2026-09-23 rather than what the registry says it is.

## Key Decisions

| # | Decision | Because |
|---|---|---|
| **1** | **The choice Zaal posed is nearly a false one. ZOE and the ZAOstock bot are THE SAME CODEBASE.** | `ZAOOS/bot/src/` holds `zoe/`, `devz/`, `hermes/`, `zai/`, `cockpit/`, `fleet-agent/` and `lib/`, with the ZAOstock bot at the same `src/` root. "Upgrade ZOE instead" and "upgrade the ZAOstock bot" are edits to one repo. |
| **2** | **BUT a second copy exists and it has DIVERGED. Fix that before adding any feature.** | `bettercallzaal/zaostock-bot` duplicates twelve filenames from `ZAOOS/bot/src/`. Measured by SHA-256: `index.ts` is **708 lines vs 361**, `group.ts` **89 vs 76**, `capture.ts` same length but a different hash, `supabase.ts` identical. |
| **3** | **DO NOT build a new capture bot. Add capture to the monorepo, behind a per-chat flag.** | The routing layer already exists - `group.ts` registers chats into `stock_bot_chats` with a `mode` column. What is missing is one insert on a message handler. |
| **4** | **The consolidation recommendation is 4 months old and was never executed. Treat "decide again" as the failure mode, not the fix.** | `dev-workflows/688` said it in May: *"Consolidate to one bot framework... 1 strong tool + 1 cheap async = beats 5 mediocre ones."* `agents/460` said *"USE Telegram-to-ZOE as default human entry."* Both stand; neither landed. |
| **5** | ~~RECONCILE THE RUNNING SNAPSHOT FIRST~~ **CORRECTED 2026-09-23 16:21 - ALREADY DONE. The registry is wrong, not the VPS.** | Probed over ssh rather than inferred: **`~/zaostock-bot` IS a git repo**, first commit `a83ec3e` reading *"source of truth was the VPS disk until 2026-09-09"*. And `~/zao-os` is on **`main`**, not the feature branch the registry names. Both were listed as open risks from 2026-06-08 - **107 days stale.** This doc cited the first as a live blocker an hour before the probe. |
| **6** | **Do not count repos to measure the fleet. Count running units.** | 19 repos match `bot`; 10 are archived. The registry names **6 bots** and **3 systemd units**. Repo count overstates the fleet by a factor of three. |

## CORRECTION, 2026-09-23 16:21 - two of this doc's premises were already fixed

**Decision 5 above said to reconcile the running snapshot first, citing `REGISTRY.md`'s
number-one risk. Both of that registry's oldest risks are already resolved**, and the
only reason this doc repeated them is that nobody had run `ssh` before writing it.

Probed directly:

- **`~/zaostock-bot` is a git repo.** First commit `a83ec3e`: *"zaostock-bot: first
  commit of the VPS working copy (ZAOstock Team Telegram Bot + devz), source of truth
  was the VPS disk until 2026-09-09."* So it was reconciled two weeks ago.
- **`~/zao-os` is on `main`**, not `claude/gifted-euler-bYhl7`.
- **Six services are running**, including `cowork-agent` whose unit description reads
  *"migrated from 187.77.3.104"* - so the cowork VPS the registry describes as a
  separate machine has also moved.

**What survives unchanged:** the fork between `bettercallzaal/zaostock-bot` and
`ZAOOS/bot/src` is measured by SHA-256 and is real. What does NOT survive is the claim
that the running code is untracked and unreproducible. **It is tracked. The drift is
between two git repos, not between git and a hand-patched directory** - which is a
smaller and more tractable problem than this doc first described.

**Recorded rather than silently edited**, because the cause is the shape this session
logged three times in one hour: an inconvenient access assumed out of reach. The VPS was
never probed; one `ssh` disproved the premise and also revealed 107 days of stale
registry rows.

## The one-sentence finding

**This estate did not fail to consolidate - it consolidated, then forked, and nobody noticed, so the cost Zaal is trying to avoid is a cost he is already paying.**

## Findings

### 1. What the fleet actually is, measured 2026-09-23 15:58-16:00

| Measure | Count | Method |
|---|---|---|
| Repos matching `bot` across both owners | **19** | `gh repo list` on bettercallzaal (159 repos) and ZAODEVZ (23) |
| Of those, archived | **10** | `isArchived` |
| Bots named in `bot/REGISTRY.md` | **6** | ZOE, Hermes, ZAO Devz, ZAOstock, Bonfire, DeepMeeting |
| systemd units on the bots VPS | **3** | `zoe-bot`, `zao-devz-stack`, `zaostock-bot` (+ `zao-fleet-agent` staged and disabled) |
| Identities in `bot/identities.json` | **2** | ZOE (The ZAO) and `zabalgamez-agent` (ZABAL Games) |

**The repo count is the misleading one.** Nine unarchived bot repos exist, but four have not been pushed since 2026-08-25 and one (`ZAODEVZ/ZAOsribeBOT`) not since 2026-05-29 - 117 days. **Only three were touched in the last week**: `zao-fractal-bot` (09-22), `zaostock-bot` (09-21), `ZAOpaperzBOT` (09-21).

One naming fault worth a minute: **`bettercallzaal/zao-fractal-bot-archive` is NOT flagged archived.** A repo named archive that is not archived will be read wrongly by the next person who greps.

### 2. ZOE and the ZAOstock bot are the same codebase, and that answers the question asked

`ZAOOS/bot/src/` contains, as sibling directories: **`zoe/`, `devz/`, `hermes/`, `zai/`, `cockpit/`, `fleet-agent/`, `lib/`, `__tests__/`** - plus eighteen `.ts` files at the `src/` root which are the ZAOstock bot (`actions.ts`, `activity.ts`, `auth.ts`, `capture.ts`, `group.ts`, `index.ts`, `llm.ts`, `ops.ts`, `schedule.ts`, `status.ts`, `supabase.ts`, and seven more).

`REGISTRY.md` confirms the mapping: ZOE is `bot/src/zoe/` on `@zaoclaw_bot`; ZAOstock is *"`bot/src/index.ts` (root)"* on `@ZAOstockTeamBot`.

**So "stay working with one agent rather than splitting up" describes something that already exists at the code level.** They share `bot/src/lib/`, one `package.json`, one test suite.

**The decommission list shows this was a deliberate, completed decision**, not an accident. It records a **10-bot branded fleet - one bot per brand - whose code was deleted on 2026-06-17**, with `bot/src/teams/` removed entirely. **The estate already killed a branded-bot-per-brand architecture once**, so "one agent rather than splitting up" is a principle it has already adopted and paid for. Two of the brands on that list are retired partners and are not named here.

### 3. The fork, which is the actual problem

`bettercallzaal/zaostock-bot` is a **private, separate repo**, last pushed 2026-09-21, whose root carries twelve of the same filenames as `ZAOOS/bot/src/`.

Compared by SHA-256 on 2026-09-23 16:00:

| File | ZAOOS/bot/src | standalone repo | Verdict |
|---|---|---|---|
| `index.ts` | 708 lines | **361 lines** | **DIVERGED** |
| `group.ts` | 89 lines | **76 lines** | **DIVERGED** |
| `capture.ts` | 90 lines | 90 lines | **DIVERGED** - same length, different hash |
| `supabase.ts` | 16 lines | 16 lines | identical |

`capture.ts` is the instructive row. **Same line count, different content.** A drift that a line-count check or a casual glance would both pass.

**And there is probably a third copy.** The registry says the ZAOstock unit runs *"from `~/zaostock-bot` snapshot"* and separately flags that directory as **not a git repo**, hand-patched. So the code in `ZAOOS/bot/src`, the code in `bettercallzaal/zaostock-bot`, and the code actually serving `@ZAOstockTeamBot` are three artifacts with **no mechanism keeping them equal**.

**This is exactly the maintenance cost Zaal named - "having to keep a bunch up to date" - and it is already being paid, invisibly.**

### 4. The recommendation is four months old and did not land

| Doc | Date | What it said |
|---|---|---|
| `dev-workflows/688-vibecoding-economics-tooling` | 2026-05 | *"ZAO has 5+ Telegram bots... Consolidate to one bot framework + lightweight dispatch layer... 1 strong tool + 1 cheap async = beats 5 mediocre ones."* |
| `agents/460-zao-agentic-stack-end-to-end-design` | - | *"USE Telegram-to-ZOE as default human entry. Claude Code direct only when Zaal is already at a keyboard editing code."* |

**Both are still the right answer. Neither produced a consolidated runtime.** What they produced was a consolidated *repo* - which is real progress and is why item 2 above is a fix rather than a rebuild.

**The lesson for this doc is about itself:** a third document recommending consolidation is the least valuable thing that could come out of this question. The bottleneck is not the decision.

### 5. The registry is 107 days stale, and it is the file that routes people

`bot/REGISTRY.md` reads `_Last updated: 2026-06-08_`. Its own header says *"Mirrors CLAUDE.md 'Primary Surfaces'; **update both together.**"*

Its three named gaps, unverified since June and each still plausible:
1. The untracked `~/zaostock-bot` snapshot (decision 5 above).
2. *"VPS runs a feature branch"* - `~/zao-os` tracking `claude/gifted-euler-bYhl7` rather than `main`.
3. Hermes needs a `hermes=` token in `COWORK_BOT_TOKENS`.

**None was re-measured for this doc.** Doing so needs VPS access this seat does not have, and guessing would be worse than saying so. This is the same shape `agents/2540` found across the estate: the script-maintained surfaces stay current and the hand-maintained ones go stale silently.

### 6. What the outside literature says, and where it applies

Walden Yan's *Don't Build Multi-Agents* (Cognition, 2025-06-12), read as raw text: **"Share context, and share full agent traces, not just individual messages"** and **"Actions carry implicit decisions, and conflicting decisions carry bad results."**

**That argument is about runtime agents decomposing one task, not about repo layout, and the difference matters here.** ZOE, Hermes, Devz and ZAOstock do not decompose a shared task - they serve different groups with different jobs. Yan's failure mode does not obviously apply.

**Where it does apply is narrower and real:** when two of those bots write the same Supabase tables, they are taking actions on shared state with implicit assumptions neither states. `REGISTRY.md` records that they share `hermes_runs`, the CRM, and `bot_heartbeats`/`bot_events`/`bot_commands`, with **"no central dispatcher."** That is the surface where "conflicting decisions carry bad results" earns its keep - not in whether they live in one repo.

## Comparison: four ways to answer Zaal's question

| Option | Cost | Buys | Verdict |
|---|---|---|---|
| **Upgrade the standalone `zaostock-bot` repo** | Low today | A working capture feature | **REJECT.** Deepens a fork that has already diverged on three of four sampled files. |
| **Upgrade ZOE specifically** | Low | Same feature, in `bot/src/zoe/` | **REJECT as framed.** ZOE is a concierge for Zaal; group capture belongs to whichever bot is in the group, and that is the ZAOstock bot - which is in the same repo anyway. |
| **Build capture in `ZAOOS/bot/src`, behind a per-chat flag** | One day | The feature, in the tree everything else shares | **ADOPT.** Decision 3. |
| **Reconcile the fork and the snapshot first, then build** | One to two days extra | The feature lands somewhere it will not silently rot | **ADOPT, and do it first.** Decision 5. |

## What I could NOT establish

- **Which copy is actually serving `@ZAOstockTeamBot` right now.** The registry says an untracked directory on the VPS. I have no VPS access and did not guess.
- **Whether the three registry gaps are still open.** Unverified since 2026-06-08.
- **Why the fork exists.** There may be a good reason - a deploy constraint, a secrets boundary, a spinout plan. `REGISTRY.md` does say ZAOstock is *"**graduating** with ZAOstock spinout"*, which would be a legitimate reason to separate. **If so, the fork is a plan rather than an accident, and the fix is to finish it deliberately rather than to merge it back.** Nobody has written down which.
- **Whether ZOE duplicates what a capture feature would do.** ZOE already relays to Zaal, and Iman routed around its message-passing by posting everything twice for five days.
- **Any cost figure.** Doc 688 cited a $80-to-$25 saving from its source; nothing in that range was re-measured here.

## Also See

- [dev-workflows/688-vibecoding-economics-tooling](../../dev-workflows/688-vibecoding-economics-tooling/) - the 2026-05 consolidation recommendation
- [agents/460-zao-agentic-stack-end-to-end-design](../460-zao-agentic-stack-end-to-end-design/) - Telegram-to-ZOE as the dispatch entry point
- [agents/2540-lane-flow-estate-audit](../2540-lane-flow-estate-audit/) - the same stale-hand-maintained-surface pattern across the lane estate
- `bot/REGISTRY.md` and `bot/identities.json` in ZAOOS - the live fleet registry
- `~/zao-vault/handoffs/zaostock-bot-context.md` - the capture brief this doc reframes

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Answer in one line whether the `zaostock-bot` fork is a deliberate spinout or an accident - everything below branches on it | @Zaal | Decision | 2026-09-26 |
| Reconcile `~/zaostock-bot` on the VPS to a real git checkout, so the running code is reproducible | @Zaal | PR + VPS | 2026-10-10 |
| Diff `bettercallzaal/zaostock-bot` against `ZAOOS/bot/src` in full and record every divergence, so the merge-or-keep decision is made on evidence | @Zaal | Doc | 2026-10-10 |
| Add `capture_enabled` to `stock_bot_chats`, defaulting false, with the refusal shipped before the feature | @Zaal | PR to ZAOOS | 2026-10-06 |
| Ship passive message capture for enabled chats only, in `ZAOOS/bot/src` | @Zaal | PR to ZAOOS | 2026-10-13 |
| Re-stamp `bot/REGISTRY.md` after re-measuring its three open gaps on the VPS | @Zaal | PR to ZAOOS | 2026-10-06 |
| Archive `zao-fractal-bot-archive` so its name and its state agree | @Zaal | GitHub setting | 2026-10-06 |
| Re-run every count in this doc and record the delta | @Zaal | Research re-validation | 2026-10-23 |

## Sources

Internal, all measured 2026-09-23 between 15:57 and 16:01 on this Mac:

- `gh repo list` across bettercallzaal (159 repos) and ZAODEVZ (23) - 19 matching `bot`, 10 archived, with push dates. `[FULL]` method: `gh repo list --json`
- `ZAOOS/bot/REGISTRY.md` - 6 bots, 3 systemd units, the decommission list, three named gaps, `_Last updated: 2026-06-08_`. `[FULL]` method: direct read
- `ZAOOS/bot/identities.json` - 2 identities, and an explicit comment that secret values never live there. `[FULL]` method: python json parse
- `ZAOOS/bot/src/` directory listing - the sibling agent dirs and 18 root `.ts` files. `[FULL]` method: `ls`
- `bettercallzaal/zaostock-bot` contents and four files compared by SHA-256 and line count against their ZAOOS twins. `[FULL]` method: `gh api contents` + `base64 -d` + `shasum -a 256`
- `bettercallzaal/zaostock-bot/README.md` - the v1 command list and the explicit "What v1 does NOT do (yet)". `[FULL]` method: `gh api contents`
- `gh search code "zaoclaw"` - located ZOE in ZAOOS rather than in any repo named for it. `[FULL]` method: `gh search code`
- `zao-research-index` over 2,240 docs, then direct reads of docs 688 and 460. `[FULL]` method: FTS5 index + `grep -n -A` on the doc files

External:

- [Don't Build Multi-Agents - Walden Yan, Cognition, 2025-06-12](https://cognition.ai/blog/dont-build-multi-agents) - `[FULL]` method: `curl` + HTML strip, 11,378 chars of raw text read earlier this session, HTTP 200. Both principles quoted verbatim from that text. [HN: 123 points, 89 comments](https://news.ycombinator.com/item?id=45096962)
- [Hacker News Algolia API](https://hn.algolia.com/api/v1/search) - community source, keyless. `[PARTIAL - thin result]` method: `curl -sG`, HTTP 200. **Searches for monorepo-versus-polyrepo drift and fork-maintenance discussions returned nothing above the points threshold**, so the outside-evidence base for decision 2 is this estate's own measurement rather than community consensus. Stated rather than padded.
