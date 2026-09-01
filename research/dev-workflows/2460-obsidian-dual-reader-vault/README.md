---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-01
superseded-by:
related-docs: "2448, 2317, 2320, 2459, 2365, 2421, 2423"
original-query: "can we keep improving the docuemntation on obsidian please go /zao-research and then deep resaerch more of what we can do with obsidian to make it work better for us and our agents"
tier: DEEP
---

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
`#tag`"*, which made tags its number-one recommendation. Re-measured today across
860 files:

| | Count | Share |
|---|---|---|
| Files with a frontmatter `tags:` property | **139** | 16% |
| Files with a `#tag` in body text | 70 | 8% |
| **Distinct tag values in use** | **353** | - |
| Files with any frontmatter at all | 512 of 652 live | 79% |

All 139 use the correct inline-list form. So the vault was never at zero - 2448's
grep pattern could not see frontmatter tags, which is where this vault puts them.

The genuine defect is the 353. The vault README specifies four tags
(`#decision`, `#blocked`, `#waiting`, `#idea`); the top of the actual
distribution is `zaostock` 23, `zabal-gamez` 14, `x-spaces` 12, `decision` 10,
`wavewarz` 10, `transcript` 10. A vocabulary of 353 across 139 files averages
2.5 files per tag, which means **most tags select nothing**. A tag that returns
one note is a filename with extra steps.

Nested tags are the repair, per Decision 5. `#zaostock/sponsors`,
`#zaostock/roster` and `#zaostock/lineup` all answer `file.hasTag("zaostock")`.

**Also found: 11 files still use the removed singular `tag:` key** (all under
`archive/gme-origin-story/`). Obsidian removed `tag`, `alias` and `cssclass` in
favour of the list-valued `tags`, `aliases`, `cssclasses`, and ships a Format
converter option to migrate them. Those 11 are currently invisible to every tag
query.

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

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Restate doc 2448's rule as "nothing whose output exists only at render time is a source of truth", with the access table - shipped when 2448 carries the amendment and names Canvas as failing it | @Zaal | PR to ZAOOS | 2026-09-08 |
| Build one `.base` file over `projects/` filtered on `status` and `type`, as the trial - shipped when it renders on desktop AND the phone, and `git status` shows one new `.base` file and no note bodies changed | @Zaal | PR to zao-vault | 2026-09-05 |
| Collapse the 353 tag values to nested roots under the four standard tags plus `zaostock`, `zabal-gamez`, `wavewarz` - shipped when distinct tag count is under 40 and `file.hasTag("zaostock")` returns every ZAOstock note | @Zaal | PR to zao-vault | 2026-09-15 |
| Migrate the 11 files still using the removed singular `tag:` key under `archive/gme-origin-story/` - shipped when a vault-wide grep for `^tag:` returns zero | @Zaal | PR to zao-vault | 2026-09-08 |
| Add `aliases:` to the notes behind the ZABAL Gamez / Brandon / Coop mismatches (25 links) - shipped when those links resolve with no file renamed | @Zaal | PR to zao-vault | 2026-09-08 |
| Record in the vault README that a lane auditing one folder is pointed AT that folder, not the vault root, citing the silent-truncation finding - shipped when the Conventions section says so | @Zaal | PR to zao-vault | 2026-09-08 |

## Also See

- [Doc 2448](../2448-obsidian-plugins-agent-memory/) - the standing no-plugins decision this doc restates and whose tag measurement it corrects
- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - the stack decision
- **Doc 2459** - handoff artifacts that get consumed. Its Finding 4 established that agents grep rather than traverse; this doc gives the storage-level reason. **Not linked because it is not merged yet** - it is in ZAOOS PR #3386, so `../2459-*/` does not resolve on main today. Link it when that PR lands.
- [Doc 2320](../2320-logging-obsidian-capture-completeness/) - capture conventions
- [Doc 2421](../2421-company-brain-hq-vs-zao-vault/) - vault scope

**Index defect found while writing this:** the `dev-workflows/README.md` index
row for **2447** links to `./2447-obsidian-plugins-agent-memory/`, a directory
that does not exist. 2447 and 2448 carry identical titles and summaries in the
index; only 2448 is real.

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
- [bitbonsai/mcpvault](https://github.com/bitbonsai/mcpvault) `[FULL - METHOD: gh api + LICENSE file read, not the API licence field]` MIT, 1,644 stars, pushed 2026-08-31.
- [marcelmarais/obsidian-mcp-server](https://github.com/marcelmarais/obsidian-mcp-server) `[FULL - METHOD: gh api contents listing]` **No licence file at root** - all rights reserved despite directory listings.
- [otaviocc/ObsidianMCPServer](https://github.com/otaviocc/ObsidianMCPServer) `[FULL - METHOD: gh api + LICENSE file read]` MIT, 16 stars.
- Obsidian 2026 release coverage `[PARTIAL - METHOD: WebSearch result summaries; the changelog pages themselves were not fetched]` Removal of singular `tag`/`alias`/`cssclass`, the Footnotes view core plugin, Format converter migration option. The removal claim is corroborated by the Properties doc read FULL above, which lists only `tags`, `cssclasses`, `aliases` as defaults.
- Obsidian MCP server landscape `[PARTIAL - METHOD: WebSearch result summaries]` Used only to enumerate candidates; every licence and star count above was then read from the GitHub API and the licence files directly.
- Reddit `[FAILED - METHOD: not attempted]` - walled from this machine per doc 2282. No Reddit claim appears in this doc.
- Local measurement `[FULL - METHOD: python over ~/zao-vault, 860 files, 2026-09-01]` All tag, frontmatter and property counts.
