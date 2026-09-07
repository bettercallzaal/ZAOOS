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
| 1 | **Disable the six near-dead MCP servers.** `Linear`, `Notion`, `memory`, `sequential-thinking`, `TravExp` are at **zero**; `serena` is at **8** | Measured across **7,359 transcripts**: 4,269 MCP calls total. Between them these six carry **458,171 tool-name mentions in context for 8 calls**. `claude-in-chrome` does 2,415 calls on 156,062 mentions - the dead six cost **2.9x the context of the server doing 57% of the work** |
| 2 | **Stop mandating `context7` first in `/zao-research`.** Replace with what the runs actually use | 3 calls all-time, last **2026-08-04**. The skill has told 122 research runs to reach for it first. Third instance of a dead mandate after doc 2411 |
| 3 | **Prune the 52 never-invoked skills to a keep-list, don't delete blind** | 82 on disk, 54 used, **52 never invoked**, ~**220,684 tokens** of context cost that has never returned anything. But zero calls is not a verdict - age separates a dead skill from a new one |
| 4 | **Close or claim the 18 lane briefs with real open work and no session** | 76 briefs, **13 live lanes**, 64 briefs with no lane. Around 18 of those are `ready`/`unconsumed` - real work nobody holds |
| 5 | **The agenda stack is not missing, it is unreadable.** Fix `bucket()` first | 569 open cards. **286 match no brand at all** and **362 sit in no view**. You cannot prioritise across brands until the board can show them |
| 6 | **`zao-wall.py` is not on `$PATH`.** The tool the board runs on cannot be run by name | Doc 2471's finding again, on the tool that answers "what work exists" |

## Connectors: 22 in use, 6 near-dead, and 458,171 mentions for 8 calls

Measured 2026-09-07 by parsing `tool_use` blocks out of every transcript in
`~/.claude/projects` - **7,359 files, 4,269 MCP calls**.

**Read the correction at the end of this section before quoting any zero here.**
The first pass walked only 5,805 files and reported six zeros. One of them was
not a zero.

| Server | Calls | Last used |
|---|---:|---|
| `claude-in-chrome` | **2,415** | 2026-09-07 |
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
| **`serena`** | **8** | rare |
| **`Linear`** | **0** | never |
| **`Notion`** | **0** | never |
| **`memory`** | **0** | never |
| **`sequential-thinking`** | **0** | never |
| **`TravExp`** | **0** | never |

**One connector is 57% of all MCP usage.** `claude-in-chrome` at 2,415 calls does
more than every other server combined. That is worth knowing before anyone
proposes replacing it.

### The context-to-call ratio, which is the finding

The six servers below are carried in every session's context and almost never
called. Mentions are how many times their tool names appear across the
transcript corpus; calls are actual `tool_use` invocations.

| Server | Name-mentions | Calls | Mentions per call |
|---|---:|---:|---:|
| `serena` | 127,732 | **8** | ~15,967 |
| `memory` | 123,585 | **0** | — |
| `Linear` | 114,355 | **0** | — |
| `Notion` | 72,534 | **0** | — |
| `sequential-thinking` | 13,787 | **0** | — |
| `TravExp` | 6,178 | **0** | — |
| **Six total** | **458,171** | **8** | — |
| `claude-in-chrome`, for scale | 156,062 | **2,415** | ~65 |

**The six near-dead servers cost roughly 2.9x the context footprint of the one
server that does 57% of all the work.**

`serena` is the one worth reading twice. Its server instructions say:

> "You have access to semantic coding tools upon which you rely heavily for all
> your work... You avoid reading entire files unless it is absolutely necessary,
> instead relying on intelligent step-by-step acquisition of information."

Eight calls. Every session is told it relies heavily on a toolset it reaches for
roughly once per thousand transcripts.

**This is the shape doc 2411 measured** for `mcp__grep__searchGitHub` - mandated
by a skill step, called zero times in 377 transcripts. It is now three instances
(`grep`, `context7`, `serena`), which makes it a pattern with a name:

> **A mandate is not adoption.** Writing "use X first" into a skill produces
> near-zero calls to X and a step everyone silently skips. Measure the call, not
> the instruction.

### CORRECTION, same day: one of the six zeros was not a zero

The first version of this document said `serena` had been invoked **zero** times
and called it a ghost. **It has 8 calls.**

The error was a denominator. `glob('*/*.jsonl')` matched **5,805** files at one
directory depth; `find . -name '*.jsonl'` matches **7,359** - there are 1,318
files at depth 4 and 236 at depth 6 that the first scan never walked. All eight
`serena` calls live in those deeper files, and the corpus total moves from 4,049
calls to 4,269.

**A zero has to be complete to mean anything**, and this one was measured over
79% of the corpus while being reported as if over all of it. The five remaining
zeros were re-checked across all 7,359 files and hold.

That makes two method failures in one audit, both in the same direction - a
scan that silently under-covered, reported as a confident zero. The first was a
glob zsh rejected so `grep` never ran. **The rule both point at: when a finding
is an absence, prove the search covered everything before you publish the
absence.**

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
| Disable `Linear`, `Notion`, `memory`, `sequential-thinking`, `TravExp` (all at zero) and decide on `serena` (8 calls, 127,732 mentions) — shipped when a fresh session's tool list no longer carries the five | @Zaal | Config | 2026-09-10 |
| Replace the `context7`-first mandate in `/zao-research` step 4 with the tools its 122 runs actually use — shipped when the skill text names them | @Zaal (seat drafts) | Skill edit | 2026-09-11 |
| Archive the 12 zero-call skills older than 60 days, each with an archive-reason line — shipped when `zao-skill-audit` reports under 70 on disk | @Zaal (obsidian lane) | Cleanup | 2026-09-14 |
| Triage the 18 orphan lane briefs to claimed / merged / closed — shipped when no brief is `ready` or `unconsumed` without a live lane or a closing note | @Zaal (seat) | Cleanup | 2026-09-14 |
| Decide whether Artizen gets its own lane — shipped when its 20 cards have an owner recorded on the board | @Zaal | Decision | 2026-09-12 |

## Sources

- `~/.claude/projects` — **[FULL]** all **7,359** `.jsonl` transcripts walked with `os.walk` and parsed for `tool_use` blocks 2026-09-07. The MCP call counts, the 4,269 total and the five surviving zeros. A first pass used `glob('*/*.jsonl')`, covered only 5,805, and produced a sixth zero that was wrong - see the correction in the connectors section
- `zao-skill-audit` — **[FULL]** run 2026-09-07 15:54, 522 transcripts. The 82/54/52 split and the token figures are its output, not a recount
- `zao-wall.py` against a live Supabase fetch — **[FULL]** 569 open cards, bucketed and brand-matched 2026-09-07
- `~/zao-vault/handoffs/`, `scripts/rot-scan.py --dry-run` — **[FULL]** counted on disk 2026-09-07
- `serena` MCP server instructions — **[FULL]** read verbatim from this session's own system context
- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) — **[FULL]** read on disk; the prior instance this doc extends to three
