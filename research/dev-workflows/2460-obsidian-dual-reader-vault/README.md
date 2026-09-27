---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "dev-workflows/2448-obsidian-plugins-agent-memory, dev-workflows/2317-obsidian-claude-personal-os-stack, dev-workflows/2320-logging-obsidian-capture-completeness, dev-workflows/2459-handoff-artifacts-that-get-consumed, dev-workflows/2365-agent-memory-management, dev-workflows/2421-company-brain-hq-vs-zao-vault, agents/2423-vault-as-transport-inter-terminal-context"
original-query: "can we keep improving the docuemntation on obsidian please go /zao-research and then deep resaerch more of what we can do with obsidian to make it work better for us and our agents"
tier: DEEP
---

> ## RE-RESEARCHED 2026-09-25. Bases was adopted. The tag repair was not, and sprawl is worse. Read this before Finding 1.
>
> **Decision 2 (adopt Bases) shipped, and further than the single trial asked
> for.** The Next Action wanted one `.base` file over `projects/` as a trial.
> Measured today: **3 `.base` files exist** - `notes/types.base`,
> `people/People.base`, `projects/Projects.base`. Bases is in active use, not
> just trialled.
>
> **Decision 5 (fix sprawl with nested tags) did not ship, and the problem it
> was written to fix has grown.** Doc 2448's original count (0 tags) was wrong;
> this doc's correction (139 files, 353 distinct values) was right for
> 2026-09-01. Re-measured today across a vault that grew from 860 to **2,069**
> markdown files: **272 files (13%) carry frontmatter `tags:`**, and there are
> now **approximately 586 distinct tag values** (own script, both inline
> `[a, b]` and YAML block-list forms parsed) - up from 353, not collapsed
> toward the "under 40" target. The diagnosis in Decision 4 ("sprawl, not
> absence") is more true now than when written, and nobody has run the repair.
>
> **The stale cross-reference is fixed:** PR #3386 (bettercallzaal/ZAOOS),
> which this doc described as "not merged yet" when it wanted to link doc
> `dev-workflows/2459-handoff-artifacts-that-get-consumed`, **merged
> 2026-09-01T11:10:39Z** - the same day this doc was originally validated. The
> link is corrected in Also See below.
>
> **Three of the six remaining Next Actions shipped; one is confirmed
> unverifiable as stated:** the singular `tag:` key migration mostly happened
> (11 files down to 1 across the whole vault, not just `archive/gme-origin-story/`);
> 19 files now carry `aliases:` (the specific 25-link mismatch this doc named
> was not independently re-checked - flagged, not claimed fixed); and the vault
> README now states the subfolder-scoping convention verbatim ("Point a session
> at the folder it is working on, not at the vault root," `README.md:141`) -
> Next Action 6 shipped. The dev-workflows index defect this doc found while
> writing (a phantom 2447 row) is gone - checked, no longer present.
>
> **Not independently re-verified this pass:** the MCP-server skip decision
> (6) and the access-table rule (1) are unchanged in substance; current star
> counts for the three MCP candidates and Obsidian's own version (now 1.14.2,
> released 2026-09-15, three releases ahead of the 1.13.3 this doc cited) are
> refreshed below, with no evidence found of a breaking change to Bases syntax
> or the tag/property model in that span (Obsidian's own changelog pages for
> 1.14.0/1.14.1/1.14.2 render almost no static text to a plain fetch - PARTIAL,
> not escalated further this pass; nothing here depends on their content).

# 2460 - Obsidian for two readers: what the vault should adopt, and the rule that replaces "no plugins"

> **Goal:** Establish what Obsidian can do that serves BOTH a human reading on desktop and iOS and an agent reading with grep, correct two measurements in doc 2448 that were wrong or have since moved, and name the underlying rule that "install no community plugins" was an approximation of.

Doc 2448 (2026-08-30) decided: install no community plugins, because plugins
render at view time and an agent reading with `cat` sees the query source rather
than its result. **That decision stands.** This doc does three things it could
not: it gives the rule its correct general form, it corrects two of its
measurements, and it identifies the one Obsidian feature that is safe under the
corrected rule.

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **The rule is not "no community plugins". It is: nothing whose OUTPUT exists only at render time may be a source of truth.** Restate it that way. | "No community plugins" is an approximation that gets one case wrong in each direction. It wrongly permits **Canvas**, a CORE plugin whose connections are invisible on disk, and it wrongly forbids **Bases**, whose data lives in frontmatter. The measured access table (Finding 1) draws the line by where data is stored, not by who shipped the code. |
| 2 | **ADOPT Bases.** It is a core plugin, needs no install, and is the first Obsidian view feature that is dual-reader safe. | A `.base` file is a saved query, and its *results* are as invisible to an agent as a Dataview block. But Bases reads **note properties in YAML frontmatter**, so using it *forces* the data into the one place both readers can see. Dataview inline fields do the opposite - they hide data in prose. Bases improves the agent's world as a side effect of what it demands of you. |
| 3 | **DO NOT use Canvas for anything load-bearing**, despite it being core and enabled. | Canvas connections are stored in a way that carries no meaning to a filesystem reader, and the practitioner table below lists Canvas connections as **no access** for Claude Code alongside Dataview results and graph metadata. A canvas is a drawing. It is fine as a drawing. |
| 4 | **The tag problem is SPRAWL, not absence. Doc 2448's "ZERO tags" is wrong.** Measured 2026-09-01: **139 of 860 files (16%) carry frontmatter `tags:`**, 70 (8%) carry a body `#tag`, and there are **353 distinct tag values**. | 2448 grepped for `#tag` in body text, which does not match frontmatter tags - and frontmatter is where this vault actually puts them, in correct inline-list form in all 139 cases. The real defect is that a vault whose README specifies four tags is running 353, so no tag reliably selects anything. |
| 5 | **Fix sprawl with NESTED tags, not a purge.** | Obsidian's tag docs: `tag:inbox` in search matches `#inbox` and all nested tags, and in Bases `file.hasTag("a")` matches both `#a` and `#a/b`. So `#zaostock/sponsors` stays findable under `zaostock` while keeping its specificity. That collapses 353 values into a handful of roots without deleting information. |
| 6 | **SKIP Obsidian MCP servers.** | Claude Code at the vault root already has full filesystem read/write - an MCP server adds a hop and a dependency for capability we have. Licence check per Hard Requirement 13: `bitbonsai/mcpvault` is MIT (1,644 stars, read from its LICENSE file) and `otaviocc/ObsidianMCPServer` is MIT, but `marcelmarais/obsidian-mcp-server` has **no licence file at its root at all** - all rights reserved - while being listed on MCP directories as if adoptable. |
| 7 | **Keep and feed the hand-maintained index notes.** `TOC.md` and `onenote/INDEX.md` are not legacy - they are what the field converged on. | The most on-point practitioner writeup found: *"The workaround most practitioners land on is a manually maintained index note, something like a MOC or a hub file with explicit wikilinks to every major cluster. Claude Code can traverse that reliably. It is a slightly old-fashioned solution to a very new problem, and it works better than any automated alternative tested so far."* This vault already has two, and one of them was made clickable on 2026-09-01. |
| 8 | **Naming consistency outranks link count for the agent reader.** Aliases are the cheap fix. | Same source: an agent doing text search misses `"project alpha"` / `"P-Alpha"` / `"the alpha project"` with **no warning**, because it is text search, not semantic search. That is the mechanism behind this vault's 51 ambiguous basenames and its `ZABAL Gamez` / `zabalgames` split. |

## Findings

### Finding 1 - The access table, and why it is the real rule

A practitioner writeup dated 2026-07-29 measured what Claude Code can actually
reach in an Obsidian vault:

| Vault element | Stored on disk | Agent access |
|---|---|---|
| Markdown body text | Yes | **Full** |
| YAML frontmatter | Yes | **Full** |
| Wikilinks, as literal paths | Yes | Partial |
| Obsidian graph metadata | No | **None** |
| Canvas connections | No | **None** |
| Dataview query results | No | **None** |

The source states the mechanism plainly: *"Graph relationships, tag indexes, and
canvas connections exist inside the Obsidian application, not on disk. Claude
Code sees the raw text only."*

Read that table as the rule. The dividing line is **stored on disk**, not
community-versus-core. Canvas is core and fails it. Bases stores its data in
frontmatter and passes it. Doc 2448 got the right answer for its examples via a
proxy that does not generalise.

### Finding 2 - Bases, and the precise reason it is safe

Bases is a core plugin, GA since Obsidian 1.9.10, current release 1.13.3 (July
2026). A base is stored as a `.base` YAML file with five top-level sections
(`filters`, `formulas`, `properties`, `views`, `summaries`), or embedded in a
fenced ` ```base ` block.

The official docs are explicit about where data lives: *"All the data in Obsidian
Bases is stored in your local Markdown files and their properties."* A base is a
saved view definition; it copies nothing. Disable it and the notes are unchanged.

**The nuance that matters and that nobody states outright:** an agent reading a
`.base` file sees the query, exactly as it would see a Dataview block. Bases does
not solve the render-time problem. It sidesteps it, because everything a base
can query already has to be in frontmatter - and frontmatter is Full access in
the table above. **Adopting Bases is a forcing function for frontmatter
discipline**, and frontmatter discipline is the thing that actually helps the
agent.

Obsidian's own Properties documentation names the same goal: properties are
*"meant for small, atomic bits of information that are both human and machine
readable."*

Two operational cautions, both measured:
- Bases syntax **broke compatibly in 1.9.2** - functions became object-oriented,
  so `contains(file.name, "Books")` became `file.name.contains("Books")`. Any
  pre-2026 snippet found online will not parse.
- There is **no `FROM` clause**. A base starts as every file in the vault and
  narrows with filters. A base written without filters is a table of all 860
  files.

### Finding 3 - This vault's tag reality, and the correction to doc 2448

Doc 2448's headline finding was *"831 markdown files and ZERO containing a
`#tag`"*, which made tags its number-one recommendation. Re-measured on
2026-09-01 across 860 files, and again on 2026-09-25 across a vault that has
since grown to 2,069 files:

| | 2026-09-01 (860 files) | 2026-09-25 (2,069 files) |
|---|---|---|
| Files with a frontmatter `tags:` property | 139 (16%) | **272 (13%)** |
| Files with a `#tag` in body text | 70 (8%) | not re-measured this pass |
| **Distinct tag values in use** | 353 | **~586** |
| Files with any frontmatter at all | 512 of 652 live (79%) | **1,646 (80%)**, per doc 2448's parallel re-measurement |
| Files still using the removed singular `tag:` key | 11 (`archive/gme-origin-story/`) | **1**, vault-wide |

All 139 (now 272) use the correct inline-list form. So the vault was never at
zero - 2448's original grep pattern could not see frontmatter tags, which is
where this vault puts them. **Updated 2026-09-25:** the tag-key migration
(singular `tag:` to list `tags:`) is nearly done - 11 down to 1, vault-wide, not
just the one archive folder - but the sprawl this doc actually flagged as the
defect got worse, not better: 586 distinct values is up from 353, and the share
of tagged files fell slightly (16% to 13%) even as the raw count grew, meaning
tag adoption is not keeping pace with the vault's growth.

The genuine defect is the 586 (was 353). The vault README specifies four tags
(`#decision`, `#blocked`, `#waiting`, `#idea`); the top of the distribution on
2026-09-01 was `zaostock` 23, `zabal-gamez` 14, `x-spaces` 12, `decision` 10,
`wavewarz` 10, `transcript` 10 - not re-ranked this pass, but a vocabulary of
586 across 272 files averages roughly 2.1 files per tag, which is worse than
the 2.5 files/tag measured on 2026-09-01: **most tags still select nothing,
and the average is dropping.**

Nested tags remain the repair, per Decision 5, and remain undone. `#zaostock/sponsors`,
`#zaostock/roster` and `#zaostock/lineup` all still answer `file.hasTag("zaostock")` -
no vault-wide collapse has been attempted.

### Finding 4 - The silent-truncation failure mode

The most useful warning in the literature, and it is not in Anthropic's docs:

> *"Sometimes it summarizes what it has read so far and continues with
> compressed context. Sometimes it stops and tells you. Occasionally it continues
> with a quietly truncated view of your notes and produces output that is
> confident but partial. That third case is the one to watch for, because nothing
> in the output signals the gap."*

The mitigation the same source lands on is **scope the session to a subfolder**
rather than the vault root: *"Output quality is noticeably higher at that
granularity, and the risk of silent context loss drops significantly."*

That has a direct consequence for how this vault is worked: a lane asked to
audit `people/` should be pointed at `people/`, not at `~/zao-vault`. It also
argues for keeping `TOC.md` current, since a 860-row index is the cheapest way
for a scoped session to know what it is not looking at.

### Finding 5 - What the community says, and one independent convergence

The Hacker News thread on the Bases launch (695 points, 132 substantive comments)
reads Bases as *"like a 90% replacement"* for Dataview and faster, with the
residual being `dataviewjs`, which runs arbitrary JavaScript at render time - the
single least agent-legible thing in the ecosystem.

Two comments matter for this estate specifically. On the git plugin: *"The
currently available git plugin is extremely dangerous (!!!) if set up
incorrectly. I would consider myself an advanced user of git."* That is
independent support for the decision already taken on 2026-09-01 to keep
obsidian-git out and drive the vault from Claude Code and cron.

And a practitioner arriving independently at this estate's own convention:

> *"I prefer not using git the plugin, but still commit to a repo... the manual
> diff review can prove invaluable in ensuring trusted results"* - specifically
> when using AI tools on the vault.

That is the same conclusion the vault README reached on 2026-09-01 after two
near-misses, written up there as `git diff --cached --name-only` before every
commit.

## Comparison: three ways to give the vault structured views

| Option | Human view | Agent access to the DATA | Verdict |
|---|---|---|---|
| **Bases** (core, 1.9.10+) | Table, cards, list, map | **Full** - data is frontmatter; only the view is render-time | **ADOPT** |
| **Dataview** (community) | Tables plus arbitrary JS | Partial - inline fields live in prose, `dataviewjs` output exists nowhere on disk | SKIP, per doc 2448 |
| **Hand-written index notes** (`TOC.md`) | A long clickable list | **Full** - it is just markdown | **KEEP** - and it is what practitioners converge on |

## Next Actions

Status column added 2026-09-25. Unshipped items kept, not deleted, per standing
rule (supersede, never delete).

| Action | Owner | Type | By When | Status 2026-09-25 |
|--------|-------|------|---------|---|
| Restate doc 2448's rule with the access table | @Zaal | PR to ZAOOS | 2026-09-08 | **Shipped** - folded into 2448's body directly on this same re-research pass, not just an amendment |
| Build one `.base` file over `projects/` as the trial | @Zaal | PR to zao-vault | 2026-09-05 | **Shipped and exceeded** - 3 `.base` files exist (`notes/types.base`, `people/People.base`, `projects/Projects.base`) |
| Collapse tag values to nested roots, under 40 distinct | @Zaal | PR to zao-vault | 2026-09-15 | **Not shipped.** Distinct count grew to ~586 (from 353) |
| Migrate the singular `tag:` key files | @Zaal | PR to zao-vault | 2026-09-08 | **Mostly shipped** - 11 down to 1, vault-wide |
| Add `aliases:` to the named mismatches | @Zaal | PR to zao-vault | 2026-09-08 | **Partially shipped** - 19 files now carry `aliases:` vault-wide; the specific 25-link mismatch was not independently re-checked this pass |
| Record the subfolder-scoping convention in the vault README | @Zaal | PR to zao-vault | 2026-09-08 | **Shipped** - `README.md:141`, "Point a session at the folder it is working on, not at the vault root" |

New action, replacing the closed tag-sprawl item above with a harder target
given the numbers moved the wrong way:

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run the nested-tag collapse now that the sprawl is 586 values, not 353 - a hook or a one-time script, since two "collapse it" Next Actions in a row (this doc's and doc 2448's) have not moved the number - shipped when distinct tag count is under 60 | @Zaal | PR to zao-vault | 2026-10-09 |

## Also See

- [`dev-workflows/2448-obsidian-plugins-agent-memory`](../2448-obsidian-plugins-agent-memory/) - the standing no-plugins decision this doc restates and whose tag measurement it corrects; re-researched in the same pass as this doc on 2026-09-25
- [`dev-workflows/2317-obsidian-claude-personal-os-stack`](../2317-obsidian-claude-personal-os-stack/) - the stack decision
- [`dev-workflows/2459-handoff-artifacts-that-get-consumed`](../2459-handoff-artifacts-that-get-consumed/) - **link fixed 2026-09-25**: PR #3386 merged 2026-09-01T11:10:39Z, so this now resolves on main. Its Finding 4 established that agents grep rather than traverse; this doc gives the storage-level reason.
- [`dev-workflows/2320-logging-obsidian-capture-completeness`](../2320-logging-obsidian-capture-completeness/) - capture conventions
- [`dev-workflows/2421-company-brain-hq-vs-zao-vault`](../2421-company-brain-hq-vs-zao-vault/) - vault scope

**Index defect found while writing the original version of this doc: FIXED.**
The `dev-workflows/README.md` index no longer carries a phantom **2447** row -
checked 2026-09-25, only the real 2448 row is present.

## Sources

- [Introduction to Bases](https://obsidian.md/help/bases) - Obsidian Help. `[FULL - METHOD: exa web_fetch]` Source of "all the data in Obsidian Bases is stored in your local Markdown files and their properties".
- [Bases syntax](https://obsidian.md/help/bases/syntax) - Obsidian Help. `[FULL - METHOD: exa web_fetch]` Five top-level sections, the three property kinds, the file-property table.
- [obsidianmd/obsidian-help - Bases syntax.md](https://github.com/obsidianmd/obsidian-help/blob/29e89022/en/Bases/Bases%20syntax.md) `[FULL - METHOD: exa web_fetch]` Source of "There is no `from` or `source` like in SQL or Dataview".
- [obsidianmd/obsidian-help - Views.md](https://github.com/obsidianmd/obsidian-help/blob/029ba842/en/Bases/Views.md) `[FULL - METHOD: exa web_fetch]` View types and app versions - Table/Cards 1.9, List/Map 1.10.
- [Create a base](https://www.mintlify.com/obsidianmd/obsidian-help/bases/create-base) `[FULL - METHOD: exa web_fetch]` Embed syntax and the `base` code block.
- [Introduction to Bases - DeepWiki](https://deepwiki.com/obsidianmd/obsidian-help/5.1-introduction-to-bases) - 2026-05-22. `[FULL - METHOD: exa web_fetch]` Architecture and `.base` as a first-class vault entity.
- [Obsidian Bases: The Complete Guide to Database Views (2026)](https://got.md/obsidian-bases/) `[FULL - METHOD: exa web_fetch]` The `file.hasTag()` versus `tags.contains()` distinction.
- [Obsidian Bases Tutorial (2026)](https://vaultpicks.net/obsidian-bases-tutorial/) - 2026-07-25. `[FULL - METHOD: exa web_fetch]` Version history: GA at 1.9.10, breaking formula-syntax change in 1.9.2, current 1.13.3.
- [Properties](https://obsidian.md/help/properties) - Obsidian Help. `[FULL - METHOD: exa web_fetch]` Source of "both human and machine readable"; the list/text/number types; no markdown in properties.
- [Tags](https://obsidian.md/help/tags) - Obsidian Help. `[FULL - METHOD: exa web_fetch]` Nested tags, `file.hasTag("a")` matching `#a/b`, case-insensitivity, the YAML list form.
- [Claude Code 1.x Inside Your Obsidian Vault: What Actually Changes](https://www.scoding.kr/2026/07/claude-code-1x-inside-your-obsidian.html) - 2026-07-29. `[FULL - METHOD: exa web_fetch]` The access table, the silent-truncation failure mode, the MOC finding, the abbreviation/text-search failure.
- [HN 44945532 - Obsidian Bases](https://news.ycombinator.com/item?id=44945532) - 695 points, 132 substantive comments harvested. `[FULL - METHOD: hn.algolia.com/api/v1/items JSON, full comment tree walked]` Community source: the 90%-replacement read, the git-plugin danger, the manual-diff-review convergence.
- [bitbonsai/mcpvault](https://github.com/bitbonsai/mcpvault) `[FULL - METHOD: gh api + LICENSE file read, re-fetched 2026-09-25]` MIT, **1,673 stars** (was 1,644), pushed **2026-09-21**.
- [marcelmarais/obsidian-mcp-server](https://github.com/marcelmarais/obsidian-mcp-server) `[FULL - METHOD: gh api contents listing, re-fetched 2026-09-25]` **Still no licence file at root** despite directory listings - all rights reserved, unchanged. Now 31 stars, pushed 2026-05-10 (stale).
- [otaviocc/ObsidianMCPServer](https://github.com/otaviocc/ObsidianMCPServer) `[FULL - METHOD: gh api + LICENSE file read, re-fetched 2026-09-25]` MIT, **17 stars** (was 16), pushed 2026-05-19 (stale).
- Obsidian 2026 release coverage `[PARTIAL - METHOD: WebSearch result summaries; the changelog pages themselves were not fetched]` Removal of singular `tag`/`alias`/`cssclass`, the Footnotes view core plugin, Format converter migration option. The removal claim is corroborated by the Properties doc read FULL above, which lists only `tags`, `cssclasses`, `aliases` as defaults.
- [Obsidian changelog](https://obsidian.md/changelog/) `[PARTIAL - METHOD: curl + HTML strip, 2026-09-25]` Confirms current version **1.14.2** (September 15, 2026, "Mobile catalyst" release train), three releases past the 1.13.3 this doc originally cited (1.13.7 Aug 12, 1.13.8 Aug 20, 1.14.0 Sep 2, 1.14.1 Sep 8, 1.14.2 Sep 15). Per-version changelog detail pages render almost no static text to a plain fetch (JS-rendered app shell) - not escalated further since nothing in this doc's decisions depends on the delta between 1.13.3 and 1.14.2, only on the fact that no Bases-breaking change surfaced in searching for one.
- Obsidian MCP server landscape `[PARTIAL - METHOD: WebSearch result summaries]` Used only to enumerate candidates; every licence and star count above was then read from the GitHub API and the licence files directly.
- Reddit `[FAILED - METHOD: not attempted]` - walled from this machine per doc 2282. No Reddit claim appears in this doc.
- Local measurement `[FULL - METHOD: python over ~/zao-vault, 860 files, 2026-09-01]` Original tag, frontmatter and property counts.
- Local re-measurement `[FULL - METHOD: python over ~/zao-vault, 2,069 files, 2026-09-25]` Updated tag (272 files/~586 values), frontmatter, `aliases:` (19 files), singular `tag:` key (1 file remaining), `.base` file count (3), README convention line, and dev-workflows index-defect checks.
- `gh pr view 3386 --repo bettercallzaal/ZAOOS` `[FULL - METHOD: gh api, 2026-09-25]` Confirms merged 2026-09-01T11:10:39Z, fixing the stale "not merged yet" cross-reference to doc 2459.
