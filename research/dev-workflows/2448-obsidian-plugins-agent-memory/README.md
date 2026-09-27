---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "dev-workflows/2460-obsidian-dual-reader-vault, dev-workflows/2317-obsidian-claude-personal-os-stack, dev-workflows/2320-logging-obsidian-capture-completeness, agents/2318-elizaos-memory-vs-zao-corpus-agent, dev-workflows/2365-agent-memory-management, agents/1054-multi-kb-memory-architecture-for-zoe.md, agents/026-hindsight-agent-memory"
original-query: "obsdidian plugins tooling tricks and tips for doing meoery with agents please"
tier: STANDARD
---

# 2448 - Obsidian Plugins and Tooling for Agent Memory

> **Goal:** Which Obsidian plugins and conventions actually improve an AGENT's memory (not a human's note-taking), and what ZAO should change in a vault that has grown to 2,069 markdown files with a tag taxonomy that sprawls rather than one that is missing.

## Corrected by doc `dev-workflows/2460-obsidian-dual-reader-vault` on 2026-09-01

The original 2026-08-30 version of this doc concluded "install no community
plugins" from an ad hoc reading of examples, and separately claimed the vault
had zero tags. Doc `dev-workflows/2460-obsidian-dual-reader-vault` corrected
both, and this re-research (2026-09-25) folds that correction into the body
below rather than keeping it as a bolted-on amendment, because both parts of
the correction have held up under a fresh re-measurement.

1. **The rule was restated, not just qualified.** "No community plugins" is a
   proxy. The real rule, which this doc now states directly: **nothing whose
   OUTPUT exists only at render time may be a source of truth.** That wrongly
   permits Canvas (core, but its connections live nowhere on disk an agent can
   read) and wrongly forbids Bases (core, and its data lives in YAML
   frontmatter - see Decision 1 and Finding 1).
2. **The tag finding was wrong in direction, not just in number.** The original
   grep looked for a body `#tag` and found none, so it reported absence. That
   pattern cannot see frontmatter tags, which is where this vault actually puts
   them. The real defect was always sprawl: many tag values, each covering
   almost nothing.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Obsidian community plugins for agent memory | **Install NONE, restated as: nothing whose output exists only at render time may be a source of truth.** | Dataview, Templater, Smart Connections and the rest execute inside the Obsidian app at view time; an agent reading with `cat`/`grep` sees the query source, never the rendered result. Canvas is core and fails the same test (its connections are not stored on disk in any agent-readable form). Bases is core and passes it (data lives in frontmatter - Decision 2). The one 2026 vault built specifically for agent memory (Verified Memory Vault) states it outright: "no community plugins, no vector database". |
| Bases (core plugin) | **ADOPT - already shipped.** Measured 2026-09-25: **3 `.base` files exist** in the vault (`notes/types.base`, `people/People.base`, `projects/Projects.base`), where doc 2460's Next Action asked for one as a trial. | A `.base` file is a saved query over frontmatter properties; disabling Bases changes nothing on disk. Using it *forces* data into frontmatter, which is Full access for an agent per doc 2460's access table. This is the one Obsidian view feature verified dual-reader-safe. |
| The tag taxonomy | **SPRAWL, and it got WORSE, not better, since the 2026-09-01 correction.** Measured 2026-09-25 across 2,069 markdown files (up from 860 on 2026-09-01, up from 831 on 2026-08-30): **272 files (13%) carry a frontmatter `tags:` property** (up from 139/16% of a smaller vault), and **586 distinct tag values are in use** (up from 353). Doc 2460's Next Action to collapse this "to nested roots... under 40" was not executed. | A vocabulary of 586 across 272 tagged files means most tags still select almost nothing. The repair doc 2460 specified - nested tags (`#zaostock/sponsors` still answers `file.hasTag("zaostock")`) rather than a purge - remains correct and remains undone. |
| Link density | **Grew in absolute terms, roughly flat as a share.** Measured 2026-09-25: 395 of 2,069 files (19%) contain a `[[wikilink]]`, 5,949 wikilinks total - versus 143 of 831 (17%) and 1,221 links measured 2026-08-30. The vault more than doubled in size and the link share barely moved. | Wiki-links are what turns markdown into a graph an agent could traverse, but doc `dev-workflows/2459-handoff-artifacts-that-get-consumed` (Finding 4, merged 2026-09-01) found agents grep rather than traverse links anyway - so this metric matters far more for the human reader on desktop/iOS than for the agent. Treat it as a human-navigation number, not an agent-legibility one (see Also See). |
| Split-brain memory | **ZAO still runs TWO memory stores that mostly do not reference each other.** The vault is now 2,069 markdown files; Claude Code's file memory is **336 files across 67 project directories** (up from 200/59); this project's own `MEMORY.md` is 26 lines (up from 3). Neither Next Action to cross-link the two indexes was shipped. | Same conclusion as 2026-08-30: merge the INDEX, not the stores - they have different lifecycles. This item is unchanged and still open. |
| Verification (memory health check) | **STILL NOT ADOPTED.** `~/bin/zao-memory-check` does not exist (checked 2026-09-25). | The Next Action to port `tools/memory_check.py` (MIT, from Verified Memory Vault) was not shipped in the 25 days since. ZAO's `zao-selftest` shape for tooling has no memory-health analogue yet. |
| Deletion guard | **STILL NOT ADOPTED.** No pre-commit hook exists in `~/zao-vault/.git/hooks/` beyond the stock samples (checked 2026-09-25). | The Next Action to add a `memory_guard`-style pre-commit hook refusing deletion of `MEMORY.md`/`handoffs/` was not shipped. This is the one item this doc still calls the highest-value gap, since it is the only defense against a repeat of ZAOOS#3056 (four load-bearing untracked files lost in 24 hours) or the CLAUDE.md "Retired" section's one-time regression (both cited in the original version of this doc). |
| basic-memory | **DO NOT ADOPT as a dependency - unchanged, re-verified.** Re-fetched 2026-09-25: **4,041 stars** (up from 3,807), pushed **2026-09-24** (still actively maintained), licence still **AGPL-3.0** read from the LICENSE file. | AGPL remains a real constraint for anything ZAO ships publicly. Still the pattern to learn from, not the code to link. |

## Findings

### 1. The plugin question, restated in its general form

An Obsidian plugin is a rendering-time transform. Dataview turns a query block
into a table when a human looks at the note; an agent using file tools reads
the raw markdown and sees the query text, never the table. Canvas is the same
failure wearing a core-plugin costume: its connections are stored in a form
invisible to a filesystem reader (confirmed independently in doc 2460's
practitioner access table). Bases is the mirror case: it is core, its views are
just as render-time-only as Dataview's, but everything a Base can filter on
*must already be frontmatter*, which is Full access. Adopting Bases is a
forcing function for the frontmatter discipline that actually helps the agent,
which is why doc 2460 recommended it and why it is confirmed shipped below.

**Anything you want an agent to read must be materialised into the file.** A
Dataview query or a Base view is a lens; a committed markdown table or
frontmatter property is memory.

### 2. What ZAO's vault looks like as a graph - then and now

| Property | 2026-08-30 (831 files) | 2026-09-01 (860 files) | 2026-09-25 (2,069 files) |
|---|---|---|---|
| Markdown files | 831 | 860 | **2,069** |
| Files with a `[[wikilink]]` | 143 (17%) | - | **395 (19%)** |
| Total wikilinks | 1,221 | - | **5,949** |
| Files with frontmatter `tags:` | 0 (grep artifact - see correction) | 139 (16%) | **272 (13%)** |
| Distinct tag values | - | 353 | **586** |
| Files with any YAML frontmatter | 531 (64%) | 512/652 live (79%) | **1,646 (80%)** |
| `.base` files present | n/a | 0 | **3** |
| `.obsidian/` present | yes | yes | yes |

The vault has grown 2.5x in four weeks. Frontmatter coverage held steady at a
high share (~80%), which remains the one convention ZAO does reliably well.
Tag coverage as a *share* fell slightly (16% -> 13%) even as the raw count grew,
and the sprawl (586 distinct values across 272 files) is worse in absolute
terms than the 353-value sprawl doc 2460 flagged as the real defect three weeks
ago. **Nobody has yet run the nested-tag collapse doc 2460 specified.**

Claude Code's file memory is a separate store, also growing: **336 memory
files across 67 project directories** (was 200/59). This project's own
`MEMORY.md` index is now 26 lines (was 3) - it has itself become memory of the
kind Rule 3 below asks for, which is a small piece of good news the split-brain
problem does not otherwise have.

### 3. The four-skill pattern (Phelps, 2026-02-25) - unchanged, re-checked live

Phelps's post (`sphelps.substack.com/p/a-shared-memory-for-claude-code`) still
resolves and reads the same as when first fetched: flat vault root, tags and
links as the only organisation, daily notes as journals not knowledge, and a
distinction between agent-written notes and human-written domain knowledge.
ZAO's vault remains strongly foldered (still well over a dozen top-level
directories) and doc 2317 still stands on "keep current dirs" - the
flat-versus-foldered contradiction below is unresolved, now with 2.5x more
files sitting inside it.

### 4. The self-checking vault (Verified Memory Vault) - now stale, not just young

At original writing (2026-08-24) this was six days old and the most directly
transferable find. Re-fetched 2026-09-25: `secondbrainstarter/verified-memory-vault`
has **2 stars** (was 1) and was **last pushed 2026-08-26** - no commits in the
29 days since. Its own README warns against exactly this pattern in other
repos ("indistinguishable from a thriving one if the star count is all you
quote" - the general lesson from `zao-research-snapshot`'s design). The method
(`memory_check.py`'s three rules: capture-don't-sort, daily note every session,
promote durable facts into `MEMORY.md`) is still sound and still worth porting
as a pattern; the repo itself should now be read as dormant rather than as an
actively-maintained dependency, reinforcing the original "learn from, do not
link" posture rather than changing it.

### 5. Licences, re-read from the LICENSE files (Hard Requirement 13)

| Project | Stars (2026-08-30) | Stars (2026-09-25) | Pushed (2026-09-25) | Licence, from the file | Verdict |
|---|---|---|---|---|---|
| `basicmachines-co/basic-memory` | 3,807 | **4,041** | **2026-09-24** | **AGPL-3.0** (`LICENSE`) | Learn from, do not depend on - unchanged |
| `secondbrainstarter/verified-memory-vault` | 1 | **2** | **2026-08-26** (stale 29 days) | CC BY 4.0 (vault) / MIT (`tools/`), `LICENSE.md` | Pattern still adoptable; repo itself now dormant |
| `jgcosme/claude-obsidian-memory` | 1 | not re-fetched this pass | - | MIT | Unchanged verdict; low-signal, not re-verified |
| `wienerdog-ai/wienerdog` | 14 | not re-fetched this pass | - | MIT | Unchanged verdict; not re-verified |

### 6. Community signal, re-checked - still thin, nothing material since 2026-09-01

A fresh HN Algolia query for "obsidian claude memory" today (2026-09-25)
returns the same shape as before: low-engagement Show HNs (wienerdog at 9
points is still the high-water mark in this niche) and nothing dated after
2026-09-01 that changes the picture. **No new tool or post in this space was
found in the 25 days since last-validated.** The original conclusion holds:
this is a pattern people write about more than they ship as tools, and the
value is in the discipline (materialise everything an agent needs into a
file), not in adopting a framework.

## Contradictions, unresolved

**Flat versus foldered**, unchanged from the original doc, now at a larger
scale: Phelps insists on a flat vault root with tags as the only organisation;
ZAO's vault has grown to 2,069 files across well over a dozen top-level
directories, and doc 2317 still says "keep current dirs". Flagging rather than
pretending consensus - a vault this size is further past the point where
flattening is cheap than it was a month ago, not closer to it.

## Also See

- [`dev-workflows/2460-obsidian-dual-reader-vault`](../2460-obsidian-dual-reader-vault/) - the correction this doc now folds in (access table, Bases, tag sprawl), and the DEEP-tier companion re-researched alongside this doc on 2026-09-25
- [`dev-workflows/2317-obsidian-claude-personal-os-stack`](../2317-obsidian-claude-personal-os-stack/) - the MCP servers, sync and structure decisions this doc's rendering-layer reason extends
- [`dev-workflows/2320-logging-obsidian-capture-completeness`](../2320-logging-obsidian-capture-completeness/) - daily-note and capture conventions, and the `PROMOTE:` marker Rule 3 needs
- [`dev-workflows/2365-agent-memory-management`](../2365-agent-memory-management/) - the bytes-not-lines finding and the unreachable-memories measurement
- [`dev-workflows/2459-handoff-artifacts-that-get-consumed`](../2459-handoff-artifacts-that-get-consumed/) - Finding 4 there ("agents grep rather than traverse links") is why this doc treats wikilink density as a human-navigation metric, not an agent-legibility one
- [`agents/2318-elizaos-memory-vs-zao-corpus-agent`](../../agents/2318-elizaos-memory-vs-zao-corpus-agent/) - adjacent memory-architecture comparison
- [`agents/1054-multi-kb-memory-architecture-for-zoe.md`](../../agents/1054-multi-kb-memory-architecture-for-zoe.md) - multi-KB memory architecture for ZOE
- [`agents/026-hindsight-agent-memory`](../../agents/026-hindsight-agent-memory/) - agent memory foundations
- Tracker card 9073 (todo, no due date) - "Teach ZOE to learn new skills + leverage Obsidian second-brain"

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Collapse the now-586 tag values to nested roots under a handful of top tags (doc 2460's repair, still undone and now a larger sprawl than when specified) - shipped when a vault-wide distinct-tag count is under 60 | @Zaal | Vault commit | 2026-10-03 |
| Port `memory_check.py` (MIT) into `~/bin/zao-memory-check` scoring dead wikilinks, undated MEMORY entries and inbox pressure, exiting non-zero, wired into `zao-selftest` - still not shipped since first specified 2026-08-30 | @Zaal | dotfiles PR | 2026-10-03 |
| Add a `memory_guard`-style pre-commit hook to `zao-vault` refusing a commit that deletes `MEMORY.md` or `handoffs/` files - still not shipped; this is the one item most likely to prevent a repeat of ZAOOS#3056 | @Zaal | zao-vault PR | 2026-10-03 |
| Cross-reference the two memory stores: name `~/zao-vault` from `~/.claude/projects/*/memory/MEMORY.md`, and name the memory directories from the vault README - still not shipped | @Zaal | Both repos | 2026-10-03 |
| Decide the flat-versus-foldered contradiction - keep the current directory count and layer tags, or flatten `notes/` only as a trial - unresolved for 25+ days | @Zaal | Decision, recorded in `decisions/` | 2026-10-10 |

## Sources

- [A Shared Memory for Claude Code - Steve Phelps, 2026-02-25](https://sphelps.substack.com/p/a-shared-memory-for-claude-code) - **[FULL, method: exa web_fetch, re-verified live 2026-09-25]** the four-skill pattern, flat structure, tags-as-taxonomy, wiki-links-as-graph
- [Your AI Coding Agent Forgets Everything - Fix It With a Free Obsidian Vault, 2026-08-24](https://dev.to/secondbrainstarter/your-ai-coding-agent-forgets-everything-fix-it-with-a-free-obsidian-vault-1p0i) - **[FULL, method: exa web_fetch]** the three rules, the two scripts, the no-plugins position
- [secondbrainstarter/verified-memory-vault](https://github.com/secondbrainstarter/verified-memory-vault) - **[FULL, method: gh api, re-fetched 2026-09-25]** now 2 stars, last pushed 2026-08-26 (29 days stale) - CC BY 4.0 + MIT dual licence, function names read from source
- [basicmachines-co/basic-memory](https://github.com/basicmachines-co/basic-memory) - **[FULL, method: gh api, re-fetched 2026-09-25]** now 4,041 stars, pushed 2026-09-24, AGPL-3.0 read from `LICENSE`
- [jgcosme/claude-obsidian-memory](https://github.com/jgcosme/claude-obsidian-memory) - **[FULL, method: gh api - LICENSE file read, from original 2026-08-30 pass; not re-fetched, low material change expected at 1 star]** MIT
- [wienerdog-ai/wienerdog](https://github.com/wienerdog-ai/wienerdog/) - **[FULL, method: gh api - LICENSE file read, from original 2026-08-30 pass; not re-fetched]** MIT, 14 stars
- [Hacker News search, "obsidian claude memory"](https://hn.algolia.com/api/v1/search?query=obsidian%20claude%20memory&tags=story) - **[FULL, method: keyless Algolia API, re-run 2026-09-25]** 18 stories total (was 17); nothing dated after 2026-09-01 changes the picture
- [How I Give Claude Code a Persistent Brain in Obsidian - John Costa, 2026-06-17](https://jcosta.tech/writing/how-i-give-claude-code-a-persistent-brain-in-obsidian/) - **[PARTIAL - title and date from exa search index only; not re-fetched, doc 2320 already cites this author's architecture in depth]**
- ZAO's own surfaces - **[FULL, method: direct measurement on this machine 2026-09-25]** `~/zao-vault`: 2,069 md files, 395 with wikilinks (19%), 5,949 total wikilinks, 272 with frontmatter tags (13%), 586 distinct tag values, 1,646 with any frontmatter (80%), 3 `.base` files; `~/.claude/projects/*/memory/`: 336 files across 67 project dirs; `~/bin/zao-memory-check` and a `memory_guard` pre-commit hook both confirmed absent
- Doc `dev-workflows/2460-obsidian-dual-reader-vault` - **[FULL, method: file read]** source of the render-time-output rule, the access table, and the original tag-sprawl correction this doc now carries in its body

**Reddit: not attempted.** Per doc 2282 and the skill's own note, reddit is fully walled from this machine and the durable fix is a credential Zaal has not yet created. Marking it unattempted rather than substituting search snippets.
