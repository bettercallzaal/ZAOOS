---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-01
superseded-by:
related-docs: "2460, 2317, 2320, 2318, 2365, 1054, 026"
original-query: "obsdidian plugins tooling tricks and tips for doing meoery with agents please"
tier: STANDARD
---

# 2448 - Obsidian Plugins and Tooling for Agent Memory

> **Goal:** Which Obsidian plugins and conventions actually improve an AGENT's memory (not a human's note-taking), and what ZAO should change in a vault that already has 831 markdown files but zero tags.

> ## AMENDED 2026-09-01 by doc 2460. Read this before the table below.
>
> **The decision stands - install no community plugins - and the reasoning
> below is right. The RULE as stated is a proxy that gets one case wrong in
> each direction.**
>
> "No community plugins" wrongly PERMITS **Canvas**, which is a core plugin
> whose connections are not stored on disk in any form an agent can read, and
> wrongly FORBIDS **Bases**, which is core and whose data lives in YAML
> frontmatter. The general form is: **nothing whose OUTPUT exists only at
> render time may be a source of truth.** The line is drawn by where data is
> stored, not by who shipped the code. Doc 2460 has the measured access table.
>
> **The tag finding below is WRONG and it drove this doc's top
> recommendation.** "831 markdown files and ZERO containing a `#tag`" was
> measured by grepping body text, which cannot see frontmatter tags - and
> frontmatter is where this vault puts them. Re-measured across 860 files on
> 2026-09-01: **139 files (16%) carry a frontmatter `tags:` property**, all in
> correct list form, and 70 (8%) carry a body `#tag`. The vault was never at
> zero.
>
> The real defect is the opposite of absence: **353 distinct tag values**
> against a README specifying four, averaging 2.5 files per tag, so most tags
> select nothing. 264 of them (75%) are used exactly once. The repair is nested
> tags rather than a purge, because `file.hasTag("a")` matches `#a/b`.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Obsidian community plugins for agent memory | **Install NONE. The answer has not changed since doc 2317, and this doc adds the reason: plugins are a rendering layer, and agents do not render.** | Dataview, Templater, Smart Connections and the rest execute inside the Obsidian app at view time. An agent reading the vault with `cat` and `grep` sees the query source, not its result. The one 2026 vault built specifically for agent memory (Verified Memory Vault, 2026-08-24) states it outright: "no community plugins, no vector database". Plugins that help a HUMAN read the vault are fine; none of them help the agent. |
| The highest-value missing convention | **TAGS. ZAO has 831 markdown files and ZERO containing a `#tag`** (measured 2026-08-30). | Phelps's central claim is that hierarchical tags (`#project/foo`, `#service/bar`, `#domain/finance`) give a vault a multi-dimensional taxonomy folders cannot express, and that because tags are plain text "a single search for lines starting with `#` gives you the full taxonomy of the vault in one call." That one call is the cheapest orientation an agent can make. ZAO cannot make it at all. |
| The second missing convention | **Link density. Only 143 of 831 files (17%) contain a `[[wikilink]]`** - 1,221 links total. | Wiki-links are what turns a folder of markdown into a graph an agent can traverse. At 17% coverage the graph is not connected enough to walk; most notes are islands reachable only by grep. The Claude Code memory format ZAO already uses supports `[[name]]` links and instructs the model to "link liberally" - that instruction is being followed in the memory directory and not in the vault. |
| Split-brain memory | **ZAO runs TWO memory stores that do not reference each other. Merge the INDEX, not the stores.** | The vault is 831 markdown files; the Claude Code file memory is 200 files across 59 project directories, and this project's own `MEMORY.md` is 3 lines. They overlap in purpose and share no links. Do not consolidate them - they have different lifecycles - but make each one's index name the other. |
| Verification | **ADOPT the self-checking pattern (rung 3, conventions not code): a memory health check that exits non-zero.** | Verified Memory Vault ships `tools/memory_check.py`, MIT-licensed, which scores memory 0-100 by counting protocol violations, dead wikilinks, bloat and inbox pressure, and returns an exit code a loop can act on. ZAO already has this shape in `zao-selftest` for tooling; it has nothing equivalent for memory. |
| Deletion guard | **ADOPT. This is the one that has already bitten ZAO four times.** | The same project ships `memory_guard.py`, a git pre-commit hook that refuses a commit deleting `MEMORY.md` - described as "the documented way agent memories die". ZAO lost four load-bearing untracked files in 24 hours on 2026-08-12 (ZAOOS#3056), and the global CLAUDE.md's "Retired - do not reference" section silently regressed once. |
| basic-memory (3,807 stars) | **DO NOT ADOPT as a dependency. AGPL-3.0, read from the LICENSE file.** | The most-established tool in this space by two orders of magnitude, pushed 2026-08-30, Python, 62 open issues. AGPL is a real constraint for anything ZAO ships publicly. Learn the pattern; do not link the code. |

## Findings

### 1. The plugin question, answered properly

Doc 2317 concluded "in-Obsidian AI plugins: SKIP" because they only run while Obsidian is open. That is correct but understates it. The deeper reason applies to **every** plugin, AI or not:

An Obsidian plugin is a rendering-time transform. Dataview turns a query block into a table when a human looks at the note. Templater expands a template when a human creates a note. An agent using file tools reads the raw markdown - it sees ` ```dataview ` and the query text, never the table. So a Dataview index of the vault is invisible to the agent that most needs an index.

The corollary is the useful part: **anything you want an agent to read must be materialised into the file.** A Dataview query is a view; a committed markdown table is memory. Where ZAO wants an agent-legible index, it must be generated and written to disk, not queried at view time.

This is why the one vault in the wild built explicitly for agent memory ships with **no plugins at all** and two Python scripts instead.

### 2. What ZAO's vault actually looks like as a graph (measured 2026-08-30)

| Property | Count | Note |
|---|---|---|
| Markdown files | 831 | of 1,286 tracked files, 349MB total |
| Files containing a `[[wikilink]]` | 143 (17%) | the graph is sparse |
| Total wikilinks | 1,221 | concentrated in the 17% |
| Files containing a `#tag` | **0** | the taxonomy does not exist |
| Files with YAML frontmatter | 531 (64%) | the strongest existing convention |
| `.obsidian/` present | yes | it is a real vault, not just a folder |

Frontmatter at 64% is the one convention ZAO already does well, and it is doing the work tags would otherwise do - but only for files that have it, and only for fields a reader knows to look for.

Claude Code's file memory is a separate store: **200 memory files across 59 project directories**. This project's `MEMORY.md` index is 3 lines. Doc 2365 previously measured the wider memory problem - 190 of 416 files unreachable from their index, and the binding constraint being BYTES (79% of a 25KB budget) rather than line count.

### 3. The four-skill pattern (Phelps, 2026-02-25)

Phelps builds the whole system out of Claude Code **skills**, not plugins - markdown procedures the agent follows. The design decisions worth stealing:

- **Flat structure, no folders.** All notes at the vault root; organisation via tags and links. A note can be `#architecture` and `#service/payments` and `#decision` at once, which a directory cannot express. ZAO's vault is strongly foldered (18 top-level dirs) and this is a genuine trade-off, not a clear win - see Contradictions.
- **Prefer links over duplication.** If a concept is explained elsewhere, link to it.
- **Daily notes are journals, not knowledge.** Append-only, carry open items forward, read the most recent ones at session start to orient. ZAO already does this in `daily/` and doc 2320 settled the convention.
- **Two kinds of content.** Notes the agent writes (architecture, patterns found in code) and notes the human writes (domain knowledge, why the code is the way it is). Phelps: an agent "can read every file in your repository. What it can't do is understand why the code is the way it is." The links between the two kinds are where the value sits.

Phelps is explicit that Obsidian is optional: "Everything we describe in this post works without Obsidian installed - the files are just markdown." Obsidian is the viewer that makes the graph visible to the human. That framing matters for ZAO, where the agent is the primary reader.

### 4. The self-checking vault (Verified Memory Vault, 2026-08-24)

Six days old at time of writing, and the most directly transferable thing found. Three folders (`00_Inbox`, `01_Daily`, `02_Templates`), one boot file, one `MEMORY.md`, and two dependency-free Python scripts.

`tools/memory_check.py` checks, by function name read from source: `check_memory_md`, `check_daily_notes`, `check_wikilinks` (dead links against a collected note set), `check_inbox` (pressure). It scores `max(0, 100 - (problems + provenance) * 20)` and returns an exit code.

Its three rules are the whole method:
1. **Capture, don't sort.** New notes land in the inbox; sorting happens in the daily note.
2. **Every session leaves a daily note.**
3. **Promote durable facts into `MEMORY.md`** - dated, one line, never rewritten.

ZAO already runs 1 and 2. Rule 3 is the gap, and it is the same gap as the missing tags: nothing in the vault distinguishes a durable fact from a day's narration.

The honest framing in its own README is worth quoting as a standard: "not a plugin collection (no community plugins, no vector database), not an autonomous system... and not a replacement for your code repository - it is memory about the work."

### 5. Licences, read from the LICENSE files (Hard Requirement 13)

| Project | Stars | Pushed | Licence, from the file | Verdict |
|---|---|---|---|---|
| `basicmachines-co/basic-memory` | 3,807 | 2026-08-30 | **AGPL-3.0** (`LICENSE`: "GNU AFFERO GENERAL PUBLIC LICENSE Version 3") | Learn from, do not depend on |
| `secondbrainstarter/verified-memory-vault` | 1 | 2026-08-26 | **CC BY 4.0** for vault content, **MIT** for `tools/` (`LICENSE.md`, dual) | Adoptable, both halves |
| `jgcosme/claude-obsidian-memory` | 1 | 2026-05-17 | **MIT** (`LICENSE`) | Adoptable, but 1 star and 3 months stale |
| `wienerdog-ai/wienerdog` | 14 | 2026-08-30 | **MIT** (`LICENSE`) | Active; memory + self-improving skills |

Note the licence file for Verified Memory Vault is `LICENSE.md`, not `LICENSE` - a plain `contents/LICENSE` fetch 404s and would have produced a false "unlicensed" reading. This is the second failure mode of Hard Requirement 13: not just a wrong API classifier, but a licence at a path you did not check.

### 6. Community signal is thin, and that is itself a finding

Hacker News via the keyless Algolia API returns 17 stories for "obsidian claude memory". The engagement is low: basic-memory's Show HN scored 4 points, "Obsidian-native memory for your Claude Code sessions" scored 1, wienerdog 9 points with 2 comments. Only basic-memory has meaningful adoption (3,807 stars) and it is a general knowledge-graph tool rather than an Obsidian-specific one.

Read honestly: **this is a pattern people write blog posts about and mostly do not ship as tools.** The blog posts are numerous (eight substantive ones surfaced, five from 2026) and the tooling is one project with real stars and a copyleft licence. That supports the conventions-not-frameworks conclusion doc 2317 already reached - the value is in the discipline, and the discipline is cheap to adopt directly.

## Contradictions, unresolved

**Flat versus foldered.** Phelps insists on a flat vault root with tags as the only organisation. ZAO's vault has 18 top-level directories and doc 2317 explicitly decided to "keep current dirs". These cannot both be optimal. The reconciliation this doc proposes - tags ON TOP of the existing folders - is a compromise neither source endorses, and it has a real cost: two overlapping taxonomies to keep consistent. Flagging rather than pretending consensus. A vault of 831 files with 18 directories is past the size where flattening is cheap.

## Also See

- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - the MCP servers, sync and structure decisions; this doc extends its plugin verdict with the rendering-layer reason
- [Doc 2320](../2320-logging-obsidian-capture-completeness/) - daily-note and capture conventions, and the `PROMOTE:` marker that rule 3 above needs
- [Doc 2365](../2365-agent-memory-management/) - the bytes-not-lines finding and the 190-of-416 unreachable-memories measurement
- [Doc 1054](../../agents/1054-multi-kb-memory-architecture-for-zoe.md) - multi-KB memory architecture for ZOE
- [Doc 026](../../agents/026-hindsight-agent-memory/) - agent memory foundations
- Tracker card 9073 (todo, no due date) - "Teach ZOE to learn new skills + leverage Obsidian second-brain"

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a `#tag` line to every file in `~/zao-vault/notes/` and `handoffs/` using the existing frontmatter `type` field as the seed, so `grep -rE '^#[a-z]' ~/zao-vault` returns a real taxonomy instead of nothing | @Zaal | Vault commit | 2026-09-08 |
| Port `memory_check.py` (MIT) into `~/bin/zao-memory-check` scoring the vault's dead wikilinks, undated MEMORY entries and inbox pressure, exiting non-zero - and wire it into `zao-selftest` | @Zaal | dotfiles PR | 2026-09-12 |
| Add the `memory_guard` pre-commit hook to `zao-vault` so a commit deleting `MEMORY.md` or `handoffs/` is refused - ZAOOS#3056 is four instances of exactly this failure | @Zaal | zao-vault PR | 2026-09-08 |
| Cross-reference the two memory stores: add one line to `~/.claude/projects/*/memory/MEMORY.md` naming `~/zao-vault`, and one line to the vault README naming the memory directories | @Zaal | Both repos | 2026-09-05 |
| Decide the flat-versus-foldered contradiction above - keep 18 directories and layer tags, or flatten `notes/` only as a trial | @Zaal | Decision, recorded in `decisions/` | 2026-09-15 |

## Sources

- [A Shared Memory for Claude Code - Steve Phelps, 2026-02-25](https://sphelps.substack.com/p/a-shared-memory-for-claude-code) - **[FULL, method: exa web_fetch]** the four-skill pattern, flat structure, tags-as-taxonomy, wiki-links-as-graph
- [Your AI Coding Agent Forgets Everything - Fix It With a Free Obsidian Vault, 2026-08-24](https://dev.to/secondbrainstarter/your-ai-coding-agent-forgets-everything-fix-it-with-a-free-obsidian-vault-1p0i) - **[FULL, method: exa web_fetch]** the three rules, the two scripts, the no-plugins position
- [secondbrainstarter/verified-memory-vault](https://github.com/secondbrainstarter/verified-memory-vault) - **[FULL, method: gh api - repo contents, LICENSE.md and tools/memory_check.py source read directly]** CC BY 4.0 + MIT dual licence, check function names
- [basicmachines-co/basic-memory](https://github.com/basicmachines-co/basic-memory) - **[FULL, method: gh api - LICENSE file read]** 3,807 stars, AGPL-3.0, pushed 2026-08-30
- [jgcosme/claude-obsidian-memory](https://github.com/jgcosme/claude-obsidian-memory) - **[FULL, method: gh api - LICENSE file read]** MIT, 1 star
- [wienerdog-ai/wienerdog](https://github.com/wienerdog-ai/wienerdog/) - **[FULL, method: gh api - LICENSE file read]** MIT, 14 stars
- [Hacker News search, "obsidian claude memory"](https://hn.algolia.com/api/v1/search?query=obsidian%20claude%20memory&tags=story) - **[FULL, method: keyless Algolia API]** community source, 17 stories, engagement measured
- [How I Give Claude Code a Persistent Brain in Obsidian - John Costa, 2026-06-17](https://jcosta.tech/writing/how-i-give-claude-code-a-persistent-brain-in-obsidian/) - **[PARTIAL - title and date from exa search index only; not re-fetched because doc 2320 already cites this author's architecture in depth]**
- ZAO's own surfaces - **[FULL, method: direct measurement on this machine 2026-08-30]** `~/zao-vault` (831 md files, 143 with wikilinks, 0 with tags, 531 with frontmatter, `.obsidian/` present) and `~/.claude/projects/*/memory/` (200 files across 59 project dirs)

**Reddit: not attempted.** Per doc 2282 and the skill's own note, reddit is fully walled from this machine and the durable fix is a credential Zaal has not yet created. Marking it unattempted rather than substituting search snippets.
