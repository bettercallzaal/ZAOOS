---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-07
superseded-by:
related-docs: 2411, 2471, 2472, 2255, 2276, 2113
original-query: "Let's keep clearing, pruning, and just overall editing the whole reboot and this and everything we're doing, agenda stack, a whole systematic. Audit As deep as we can, we need to look at everything. We're the orchestrator. We need to be better and more capable... Let's look through our connectors. Let's look through our files. Let's go and find how we can make the agenda stack for the zao, Wave Warz, all these brands"
tier: STANDARD
---

# 2473 — The orchestrator's own capability audit: what we carry, what we call

> **Goal:** Measure every capability surface the estate loads - skills,
> connectors, briefs, cards, notes - against how often it is actually used. The
> answer is consistent across all four: **we carry far more than we call, and the
> things we mandate loudest are the things we call least.**

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Disable the six MCP servers with zero calls.** `serena`, `Linear`, `Notion`, `memory`, `sequential-thinking`, `TravExp` | Measured across **5,805 transcripts**: 4,049 MCP calls total, **zero** to any of these six. `serena`'s tool names appear **127,732 times** in transcript context and were never once invoked |
| 2 | **Stop mandating `context7` first in `/zao-research`.** Replace with what the runs actually use | 3 calls all-time, last **2026-08-04**. The skill has told 122 research runs to reach for it first. Third instance of a dead mandate after doc 2411 |
| 3 | **Prune the 52 never-invoked skills to a keep-list, don't delete blind** | 82 on disk, 54 used, **52 never invoked**, ~**220,684 tokens** of context cost that has never returned anything. But zero calls is not a verdict - age separates a dead skill from a new one |
| 4 | **Close or claim the 18 lane briefs with real open work and no session** | 76 briefs, **13 live lanes**, 64 briefs with no lane. Around 18 of those are `ready`/`unconsumed` - real work nobody holds |
| 5 | **The agenda stack is not missing, it is unreadable.** Fix `bucket()` first | 569 open cards. **286 match no brand at all** and **362 sit in no view**. You cannot prioritise across brands until the board can show them |
| 6 | **`zao-wall.py` is not on `$PATH`.** The tool the board runs on cannot be run by name | Doc 2471's finding again, on the tool that answers "what work exists" |

## Connectors: 22 in use, 6 dead, and one very expensive ghost

Measured 2026-09-07 by parsing `tool_use` blocks out of every transcript in
`~/.claude/projects` - **5,805 files, 4,049 MCP calls**.

| Server | Calls | Last used |
|---|---:|---|
| `claude-in-chrome` | **2,321** | 2026-09-07 |
| `supabase-cowork` | 889 | 2026-09-06 |
| `gdocs` | 154 | 2026-09-07 |
| `exa` | 144 | 2026-09-02 |
| `supabase` | 94 | 2026-09-07 |
| `Canva` | 76 | 2026-09-07 |
| `paragraph` | 67 | 2026-08-19 |
| `Google_Calendar` | 65 | 2026-08-29 |
| `Gmail` | 61 | 2026-09-07 |
| `hyperagent` | 52 | 2026-08-20 |
| `Google_Drive` | 40 | 2026-09-07 |
| `dune` | 31 | 2026-09-05 |
| `playwright` | 21 | 2026-09-07 |
| `github` | 12 | 2026-09-02 |
| `Calendly` | 6 | 2026-08-28 |
| `grep`, `context7` | 3 each | 2026-08-28 / **2026-08-04** |
| `blockscout` | 3 | 2026-08-21 |
| `Slack`, `Dropbox`, `Descript` | 2 each | 2026-08-20/28 |
| `Expedia` | 1 | 2026-08-07 |
| **`serena`** | **0** | never |
| **`Linear`** | **0** | never |
| **`Notion`** | **0** | never |
| **`memory`** | **0** | never |
| **`sequential-thinking`** | **0** | never |
| **`TravExp`** | **0** | never |

**One connector is 57% of all MCP usage.** `claude-in-chrome` at 2,321 calls does
more than every other server combined. That is worth knowing before anyone
proposes replacing it.

### The serena ghost, and why it is the sharpest finding here

`mcp__serena__*` appears **127,732 times across 3,269 transcripts** and has been
invoked **zero** times.

Its server instructions are not shy about it either:

> "You have access to semantic coding tools upon which you rely heavily for all
> your work... You avoid reading entire files unless it is absolutely necessary,
> instead relying on intelligent step-by-step acquisition of information."

Every session is told it relies heavily on a toolset it has never once called.
That text, plus ~25 tool definitions, is loaded into context every time.

**This is the exact shape doc 2411 measured** for `mcp__grep__searchGitHub` -
mandated by a skill step, called zero times in 377 transcripts over 30 days. It
is now three instances (`grep`, `context7`, `serena`), which makes it a pattern
rather than an oversight, and the pattern has a name worth keeping:

> **A mandate is not adoption.** Writing "use X first" into a skill produces
> zero calls to X and a step everyone silently skips. Measure the call, not the
> instruction.

**A correction on method, because it nearly produced a wrong number here.** A
first pass at "which servers are unused" grepped with a glob zsh rejected, so
`grep` never ran and every server came back `0`. A zero from a command that
errored is not a zero. The counts above come from parsing `tool_use` blocks in
JSON, and the 127,732 figure comes from a separate string count - two different
questions, deliberately not conflated.

## Skills: 82 carried, 52 never called, 220,684 tokens

From `zao-skill-audit`, run 2026-09-07 against 522 transcripts:

```
82 skills on disk, 522 transcripts scanned
54 used, 52 never invoked
context cost: ~343,865 tokens total, ~220,684 of it never invoked
```

**64% of the skill context has never returned anything.**

The used half is concentrated, and the concentration is the useful part:

| Skill | Calls | Last used |
|---|---:|---|
| `zao-research` | 122 | 2026-09-07 |
| `handoff` | 43 | 2026-09-06 |
| `clipboard` | 34 | 2026-09-07 |
| `quick-grill` | 32 | 2026-09-07 |
| `meeting` | 22 | 2026-08-31 |
| `browse` | 17 | 2026-09-05 |
| `socials` | 12 | 2026-09-05 |
| `agentic-issue` | 12 | 2026-09-01 |

Eight skills carry the estate. The rest is tail.

**Do not delete on the zero alone** - the audit's own footer says it, and it is
right: "A skill added this week and a skill dead for six months both read zero -
the age column is what separates them." The cut list is zero calls **and** age
over 60 days: `21st` (131d), `find-skills` (131d), `ask-gpt` (131d),
`reddit-fetch` (131d), `guard`/`freeze`/`unfreeze`/`careful` (171d),
`bandz-research` (169d), `supabase-postgres-best-practices` (131d),
`claude-creativity` (77d), `design` (105d). Two have **no `SKILL.md` at all**
(`.gstack`, `learned`) and are broken rather than unused.

## Files: 807 notes, 76 briefs, 13 lanes

| Surface | Count |
|---|---:|
| Vault notes (excl. archive) | 807 |
| Archived notes | 208 |
| Lane briefs in `handoffs/` | 76 |
| Status files | 12 |
| **Live tmux lanes** | **13** |
| **Briefs with no live lane** | **64** |
| Notes with no `next:` | **78 of 112** |

Sixty-four briefs describe lanes that do not exist. Most are documents rather
than lanes - `needs-zaal`, `VOCABULARY`, `README`, the four `GRILL-*` files,
`TEMPLATE` - and those are fine where they are.

**But roughly 18 are genuine lane briefs, marked `ready` or `unconsumed`,
describing real open work nobody holds:** `baraza-desktop-specs`, `cowork`,
`crm-lane-2026-08-26`, `crush-taps`, `desktop-45g`, `fractaldata`,
`ignite-radio`, `meetings-backlog`, `meetings-craig`, `onchain`, `pi-research`,
`transcribe`, `wavewarz` (distinct from `wwtracker`), `zao-identity`, `zaoos`,
`zaoos-infra`, `zaoresearch`, `zoe`.

Each is either work somebody should be doing or a brief that should be closed.
Leaving them at `ready` forever is the third option and it is the one currently
selected.

## The agenda stack, measured

569 open cards, matched to brands by keyword:

| Brand | Cards | P1 | needs-Zaal |
|---|---:|---:|---:|
| Infra / agents | 52 | 10 | 2 |
| **WaveWarZ** | 40 | 5 | 3 |
| The ZAO / site | 39 | **14** | 1 |
| **ZAOstock** | 31 | 6 | **7** |
| ZOE / ZOL | 29 | 4 | 1 |
| Sparkz / Zoostr | 29 | 1 | 2 |
| Artizen | 20 | 1 | 6 |
| Newsletter / content | 11 | 2 | 1 |
| COC Concertz | 10 | 1 | 3 |
| Fractal | 8 | 4 | 2 |
| ZABAL Gamez | 8 | 1 | 0 |
| poidh | 6 | 1 | 0 |

**Three things this exposes.**

**286 cards - 50% - match no brand at all.** Either their titles are too vague to
route (many are "Inbox action: ..." with the substance in a body the wall does
not return) or they belong to something with no brand yet. A card nobody can
route is a card nobody works.

**"The ZAO / site" carries 14 P1s, the most of any brand**, while ZAOstock - 26
days out with a live event - carries 6. Whether that is correct is Zaal's call,
but it is not what the estate's attention has looked like today.

**Two brands have lanes and almost no cards** (ZABAL Gamez 8, poidh 6) while
**two have cards and thin lane coverage** (Sparkz/Zoostr 29 cards, Artizen 20
with 6 needing Zaal). Artizen is the sharpest mismatch: 20 open cards, 6 of them
Zaal-gated, and no lane at all.

## What to fix first, in order

1. **`zao-wall.py`'s fourth bucket.** 362 of 569 cards are invisible. Every other
   prioritisation question is unanswerable until this lands. Still unassigned.
2. **Put `zao-wall.py` on `$PATH`.** It is the board's own tool and cannot be run
   by name - doc 2471's finding, on the most load-bearing script in the estate.
3. **Turn off the six dead connectors** and re-measure the context saving.
4. **Cut the 12 skills that are zero-call and over 60 days old**, archive with a
   reason, keep the rest.
5. **Triage the 18 orphan lane briefs** - claim, merge into an existing lane, or
   close with a reason.
6. **Give Artizen a lane or fold it into an existing one.** 20 cards, 6 gated,
   zero owners.

## Also see

- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) — thirty tools, six used. The first instance of the dead-mandate pattern
- [Doc 2471](../../dev-workflows/2471-zao-lane-workflow-audit/) — a merged PR does not reach the machine
- [Doc 2472](../../dev-workflows/2472-claude-setup-open-source/) — the permission surfaces and the open-source path
- [Doc 2255](../../dev-workflows/2255-claude-code-builtin-tools-audit/) — what we hand-rolled that already existed
- [Doc 2276](../../dev-workflows/2276-skills-estate-audit/) — the skills estate: four broken, three duplicated

## Next actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Give `zao-wall.py` a fourth bucket so no card is dropped — shipped when `--json` counts sum to `open` | @Zaal (obsidian lane) | PR | 2026-09-12 |
| Copy `zao-wall.py` into `~/bin` — shipped when `which zao-wall.py` answers | @Zaal (seat) | Install | 2026-09-09 |
| Disable `serena`, `Linear`, `Notion`, `memory`, `sequential-thinking`, `TravExp` — shipped when a fresh session's tool list no longer carries them | @Zaal | Config | 2026-09-10 |
| Replace the `context7`-first mandate in `/zao-research` step 4 with the tools its 122 runs actually use — shipped when the skill text names them | @Zaal (seat drafts) | Skill edit | 2026-09-11 |
| Archive the 12 zero-call skills older than 60 days, each with an archive-reason line — shipped when `zao-skill-audit` reports under 70 on disk | @Zaal (obsidian lane) | Cleanup | 2026-09-14 |
| Triage the 18 orphan lane briefs to claimed / merged / closed — shipped when no brief is `ready` or `unconsumed` without a live lane or a closing note | @Zaal (seat) | Cleanup | 2026-09-14 |
| Decide whether Artizen gets its own lane — shipped when its 20 cards have an owner recorded on the board | @Zaal | Decision | 2026-09-12 |

## Sources

- `~/.claude/projects/*/*.jsonl` — **[FULL]** 5,805 transcripts parsed for `tool_use` blocks 2026-09-07. The MCP call counts, the 4,049 total and every zero
- `zao-skill-audit` — **[FULL]** run 2026-09-07 15:54, 522 transcripts. The 82/54/52 split and the token figures are its output, not a recount
- `zao-wall.py` against a live Supabase fetch — **[FULL]** 569 open cards, bucketed and brand-matched 2026-09-07
- `~/zao-vault/handoffs/`, `scripts/rot-scan.py --dry-run` — **[FULL]** counted on disk 2026-09-07
- `serena` MCP server instructions — **[FULL]** read verbatim from this session's own system context
- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) — **[FULL]** read on disk; the prior instance this doc extends to three
