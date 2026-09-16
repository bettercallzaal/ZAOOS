---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-16
superseded-by:
related-docs: "2460, 2448, 2433, 2320, 2317, 606"
original-query: "Managing information with Obsidian as the single home for a solo founder plus an agent fleet - one person, twelve or more Claude Code lanes and three bots writing to one vault (~/zao-vault, git-backed, on a Mac, read by lanes on a VPS and a Raspberry Pi over git). Plugins/traps for a machine-written vault; how other people run Obsidian with agents writing into it in 2026; inbox/folding and rot-avoidance patterns; mobile read/answer patterns; what NOT to move into Obsidian and where search/sync degrade."
tier: STANDARD
---

# 2493 - Obsidian as the single home for a solo founder plus an agent fleet

> **Goal:** With a vault at 2,768 markdown files and 5.7G, written by 12+ Claude
> Code lanes and three bots and read over git by a VPS and a Pi, establish which
> Obsidian features help a mostly machine-written vault, how measured outside
> projects run the same pattern, the inbox/rot pattern this vault should extend
> to its actual capture door, the mobile answer, and the size/count line where
> Obsidian degrades.

Doc 2460 (2026-09-01, DEEP) already settled the plugin question at 860 files:
adopt Bases, skip Dataview and Canvas-as-data, skip Obsidian MCP servers for
now. That verdict is re-confirmed here at 3.2x the file count with three .base
files now live (`projects/Projects.base`, `people/People.base`,
`notes/types.base`) and zero community plugins installed
(`~/zao-vault/.obsidian/plugins` does not exist). This doc's new ground is the
fleet-scale, inbox, mobile and size-limit questions 2460 did not ask.

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **Extend rot detection to `inbox/` and `inbox/clips/`.** They are in neither of `rot-scan.py`'s two scopes. | Measured in `scripts/rot-scan.py`: `FOLDERS = ("people", "projects")` (dated `next`/`by`/`done`) and `CLAIM_FOLDERS = ("notes", "handoffs", "projects", "decisions", "people")` (inline `[re-check: date]`). `inbox/` - the one folder three bots and 12+ lanes actually write raw captures into - is in neither list. This is the exact failure mode doc 2448/2460's own community source and the `ai-second-brain-template` repo (below) both name: capture without a forced review clock is what makes an inbox a graveyard. |
| 2 | **KEEP Bases; do not add Dataview, Canvas-as-data, or any Obsidian MCP server.** | Unchanged from doc 2460's rule (nothing whose output exists only at render time is a source of truth) and doc 2433's MCP survey. `StevenStavrakis/obsidian-mcp` (MIT, 729 stars at last measurement) is still WATCH/adopt-later; Claude Code's own filesystem tools already give every one of the 12+ lanes full read/write on `~/zao-vault` over the same git the VPS and Pi already use, so an MCP server adds a process and a dependency for a capability that already exists. |
| 3 | **Do NOT put the Obsidian Git plugin on any phone.** The plugin's own maintainer documentation calls the mobile implementation "very unstable" and recommends a different tool - confirmed current 2026-08-03. | Neither iOS nor Android lets an app run the real git binary; the plugin falls back to `isomorphic-git`, a JS reimplementation with no SSH, no rebase, no submodules, no git-LFS, and a repo-size ceiling set by the phone's free RAM. Failure modes are crash-on-clone, buffer overflow, or hanging - all memory failures, not sync failures. [Source: stephanmiller.com, below] |
| 4 | **Keep the existing two mobile paths, and do not merge them.** Working Copy + an iPhone Shortcut is correct for **write-in** (already how `inbox/README.md` describes capture); the Telegram/card path (`zao-tracker` cards, `quick-grill`'s tap-to-answer batches of 4) is correct for **one-tap decisions**. Obsidian's own mobile app should stay a read/triage surface, not the sync engine. | This matches the measured community answer: git on mobile is a version-control tool, not a live sync tool (commits land minutes later, not instantly), and a native git client (GitSync, or paid Working Copy) should do the mobile git leg if one is wanted at all - Obsidian itself should not be asked to run git. |
| 5 | **Never move secrets into `~/zao-vault`; keep large media out of git.** Both are already correct here - confirm the pattern, do not build a new one. | Secrets already live in `~/.zao/private/*.env`, a directory outside the vault entirely. Media is already excluded: `images/` is **5.2G of the vault's 5.7G (91%) across 2,923 files** and is explicitly gitignored (`.gitignore`: "bulk image library - browsable in Obsidian, never in git"), with the curated subset tracked separately in the zao-brand repo and a catalogue note (`projects/image-catalogue.md`) pointing at where the real files live. The vault's own `.git` stays at 140M packed as a result. |

## Findings

### Finding 1 - What actually helps a machine-written vault, confirmed at 3.2x scale

Re-measured 2026-09-16 against doc 2460's 2026-09-01 baseline:

| Measure | 2026-09-01 (doc 2460) | 2026-09-16 (this doc) |
|---|---|---|
| Markdown files | 860 | **2,768** |
| `.base` files live | 0 (recommended, not yet built) | **3** (`projects/Projects.base`, `people/People.base`, `notes/types.base`) |
| Community plugins installed | 0 | **0** (`.obsidian/plugins` absent) |
| Vault size | not measured | **5.7G** (5.2G of it `images/`, gitignored) |

The rule holds unchanged: **nothing whose output exists only at render time is
a source of truth.** Bases passes (data lives in frontmatter, the `.base` file
is a saved filter, not a copy); Dataview and `dataviewjs` fail (results exist
only inside the app); Canvas fails (connections aren't stored on disk at all).
Properties/frontmatter remain the one structure both a human on iOS and a grep
from a VPS lane see identically. Full mechanism and the access table are in
doc 2460; nothing here overturns it.

### Finding 2 - How other measured builds run agents writing into Obsidian in 2026

Three concrete, currently-maintained examples (not vendor pages), fetched or
measured directly:

- **`ibrahimkobeissy/ai-second-brain-template`** (20 stars, pushed 2026-09-03,
  license CC BY-NC-SA 4.0 per the README - the GitHub API license field reads
  `NOASSERTION`, so the README is the source of truth here per this library's
  own licence rule). An ARA-structured vault (`00-inbox` -> `01-work` /
  `02-personal` -> `03-resources` -> `04-archive`) operated by Claude Code and
  Codex through slash-command skills: `/curate-bookmarks` ->
  `/synthesize-drafts` -> `/plan-to-kanban` -> execute -> **prune spent
  intermediates**. Its own README states the failure it is built against in one
  line: *"Most second brain setups rot: you capture endlessly and synthesize
  never."* Its dashboard is DataviewJS-driven and tracks staleness/dormancy -
  the same feature this vault's own rot-detection decision (2026-09-02) chose
  to build vault-native in frontmatter instead, for the dual-reader reason doc
  2460 gives.
- **`ssheld/agent-vault`** (2 stars, 22 open issues, pushed 2026-09-09, MIT).
  A template that gives each *code* repo a standard `agent-vault/` folder of
  plain markdown for shared context, handoffs, and open decisions, readable
  directly as an Obsidian vault - closer to this estate's per-lane
  `handoffs/status/*.md` pattern than to a single central vault, and its stated
  problem (repeated rediscovery of decisions, stale docs vs. implementation,
  agents silently making decisions that should stay owner-controlled) is
  exactly `AGENTS.md`'s own stated reason for `DECISIONS.md` and the
  `rot-detection-for-people-and-projects.md` decision.
- **`tuan3w/obsidian-vault-agent`** (39 stars, pushed 2026-03-30, MIT). A
  narrower Claude Code plugin that turns books/papers/YouTube into connected
  notes inside an existing vault - evidence that the write-path pattern (agent
  writes markdown + frontmatter directly into the vault, human reviews in the
  app) is the converged shape across unrelated projects, not a ZAO-specific
  choice.

None of the three run at this estate's scale (12+ lanes, 3 bots, git-replicated
to a VPS and a Pi); all three converge on the same two structural choices this
vault already made - plain markdown/frontmatter as the interchange format, and
a human triage step between agent capture and anything durable.

### Finding 3 - The inbox/fold pattern, and the gap in this vault's own rot scan

This vault already has the two halves of the pattern the field converges on:
a capture door (`inbox/`, `inbox/clips/` - **59 clip files**, `inbox/README.md`:
*"Nothing lives here long"*) and a fold destination
(`notes/folded-artifacts/` - **14 files**, each a synthesized artifact pulled
out of a longer capture). What is missing is the review clock connecting them.

`scripts/rot-scan.py` (measured 2026-09-16) implements exactly the decided
mechanism (`decisions/rot-detection-for-people-and-projects.md`, 2026-09-02:
red on a passed `by:`, amber on 7 days untouched, Telegram DM only on change)
but its two scopes are:

```
FOLDERS = ("people", "projects")
CLAIM_FOLDERS = ("notes", "handoffs", "projects", "decisions", "people")
```

`inbox/` is in neither. A 2022 Obsidian forum thread on this exact problem
converges on the same mechanism from the opposite direction - one user's fix
was to use the vault **root** as the inbox specifically because *"it had an
unintended side-effect which was to force myself to process my inbox, as my
vault looks really untidy"* [PARTIAL - forum thread read via API, 2022, dated;
mechanism cited, not the literal fix]. That is a manual version of the same
clock this vault already automated for `people/` and `projects/` - it has just
not been pointed at the folder three bots and 12+ lanes actually drop raw
material into.

### Finding 4 - Mobile: the measured 2026 state of Obsidian + git on a phone

Fetched in full (`stephanmiller.com/obsidian-git-sync-mobile/`, updated
2026-08-03): the Obsidian Git plugin's own documentation says the mobile
implementation is "very unstable" and recommends a different syncing service -
"the developer of the plugin telling you not to use his plugin." Mechanism:
iOS/Android block the real git binary, so the plugin substitutes
`isomorphic-git` (no SSH, no rebase, no submodules, no git-LFS, repo size
capped by the phone's free RAM), and the documented failure modes (crash on
clone/pull, buffer overflow, hangs) are all memory failures, not sync bugs. It
is also not real-time - commits land on a multi-minute timer, so a same-minute
edit on two devices can produce a merge conflict with no good mobile resolver.

The recommended stable pattern, if a native git leg on mobile is wanted at
all: a dedicated git client (GitSync - native Rust/`git2-rs` core, SSH support,
background sync, free; or Working Copy on iOS - mature, but its **free tier
cannot push**, only pull, so a paid unlock is required for a two-way mobile
leg) clones into a plain folder and Obsidian just points at that folder as a
vault. This estate's actual mobile path already avoids the trap by a different
route: `inbox/README.md` - Working Copy plus an iPhone Shortcut for
**write-in only**, and the Telegram/card path (`zao-tracker` cards surfaced
through `quick-grill`'s tap-to-answer batches of 4, per the skill's own
description) for **decisions**, never Obsidian's own mobile UI as the thing
that has to stay in sync in real time.

### Finding 5 - Size/count limits, and what should never be vault content

Obsidian forum measurements (both threads read in full via the Discourse JSON
API, dated 2020 and 2023 respectively - no fresher measured thread surfaced in
this search, flagged as staleness below): one user's stress test hung the
desktop app at 384K notes, and a prior test with ~281,000 flat text notes took
"several minutes" just to list a folder; a separate 2023 thread on
terabyte-scale vaults got the same community answer both times - Obsidian
indexes fine into the tens of thousands of markdown files, degrades on raw
file-listing/search speed as file count climbs past roughly 100K-300K, and
was never designed to index non-text bulk media by content (only as attached,
linked files). Nobody in either thread reported a hard version-numbered cap;
the degradation is gradual and hardware-dependent.

Measured against this vault directly: **2,768 markdown files is nowhere near
the range where either thread reports trouble** - this vault's real size
problem, if it has one, is `images/` (2,923 files, 5.2G, 91% of the vault),
and that is already solved correctly: gitignored, catalogued separately
(`projects/image-catalogue.md`), never asked to sync through git to the VPS or
Pi. The one thing this vault does that neither thread's failure mode touches:
secrets. They are not an Obsidian problem here because they were never put in
the vault - `~/.zao/private/*.env` sits outside `~/zao-vault` entirely, so
there is no gitignore rule standing between a secret and a commit; the secret
was never a vault file to begin with. **Never change that**: a vault this
information-dense, replicated to two more machines over git and read by three
bots, is the last place a credential should ever land, ignored-or-not.

## What NOT to move into Obsidian, in one table

| Category | Where it actually lives here | Why not the vault |
|---|---|---|
| Secrets, tokens, credentials | `~/.zao/private/*.env` | Never in a git-replicated, agent-read tree, regardless of gitignore |
| Bulk/raw images (2,923 files, 5.2G) | `~/zao-vault/images/`, gitignored | Media this large degrades git clone/push size on 3 machines for no search benefit; Obsidian was never built to index media by content |
| Curated brand marks | zao-brand repo | Has its own review/versioning home; duplicating it in the vault would desync two sources of truth |
| Recordings (`.m4a`/`.mp4`/`.wav`/`.mp3`) | `inbox/recordings/*`, gitignored | Same media-in-git problem; filed elsewhere once processed, per the existing `.gitignore` comment |
| Anything whose only source of truth is a render-time plugin output | N/A - by rule (Decision 2 / doc 2460) | Graph metadata, Canvas connections, Dataview/`dataviewjs` results exist nowhere on disk; an agent reading with `cat` or `grep` sees nothing |

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `inbox` and `inbox/clips` to `scripts/rot-scan.py`'s claim-mode scope (or a lighter dedicated age-check), so the vault's busiest agent-fill folder gets the same red/amber clock as `people/` and `projects/` - shipped when a re-run of `rot-scan.py` reports a non-zero claim count sourced from `inbox/` | zj (vault lane) | PR to zao-vault | 2026-09-23 |
| Confirm Working Copy's push tier (free vs. $35.99 Pro Unlock) for the existing iPhone Shortcut capture path, since the free tier is read/pull-only - shipped when `handoffs/status/` or `inbox/README.md` states which tier is installed | Zaal | Decision (quick-grill) | 2026-09-20 |
| Write the "no Obsidian Git plugin on mobile, ever" rule into `~/zao-vault/README.md` Conventions, citing today's measurement, so the pattern is not accidentally "fixed" into the unstable one later - shipped when the README section names GitSync/Working Copy as the only sanctioned mobile git path | zj (vault lane) | PR to zao-vault | 2026-09-23 |
| Re-verify the 353-distinct-tag collapse and the 11 `tag:`-singular migration doc 2460 already scheduled for 2026-09-15/08 - shipped when a vault-wide grep for `^tag:` returns zero and `file.hasTag("zaostock")` returns every ZAOstock note | Zaal | PR to zao-vault | 2026-09-23 |
| Re-check `StevenStavrakis/obsidian-mcp` only if concurrent-writer conflicts actually occur as lane count grows past today's fleet size (doc 2433's own stated trigger) - no action otherwise | zj (vault lane) | Watch, not a PR | wontfix (trigger-based, not dated) |

## Also See

- [Doc 2460](../2460-obsidian-dual-reader-vault/) - the plugin rule and access table this doc re-confirms at 3.2x scale
- [Doc 2448](../2448-obsidian-plugins-agent-memory/) - the original no-community-plugins decision, amended by 2460
- [Doc 2433](../2433-mcp-connectors-together/) - `obsidian-mcp` WATCH/adopt-later verdict
- [Doc 2320](../2320-logging-obsidian-capture-completeness/) - capture conventions this doc's inbox finding extends
- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - the two-surface (Obsidian + Claude) stack decision
- `~/zao-vault/decisions/rot-detection-for-people-and-projects.md` - the mechanism Finding 3 extends to `inbox/`

## Sources

- [Obsidian Git plugin sync in 2026: what actually works on mobile](https://www.stephanmiller.com/obsidian-git-sync-mobile/) - Stephan Miller, updated 2026-08-03. `[FULL - METHOD: curl + HTML strip]`
- [ibrahimkobeissy/ai-second-brain-template](https://github.com/ibrahimkobeissy/ai-second-brain-template) - README + `gh api` stars/license/pushed_at. `[FULL - METHOD: gh api + README fetch]`
- [ssheld/agent-vault](https://github.com/ssheld/agent-vault) - README + `gh api` stars/license/pushed_at/open_issues. `[FULL - METHOD: gh api + raw README fetch]`
- [tuan3w/obsidian-vault-agent](https://github.com/tuan3w/obsidian-vault-agent) - `gh api` stars/license/pushed_at. `[PARTIAL - METHOD: gh api metadata only, README not fetched - description drawn from repo name/topic and HN listing title]`
- [Maximum Number of Notes in Vault - Obsidian Forum](https://forum.obsidian.md/t/maximum-number-of-notes-in-vault/1509) - thread opened 2020-06-09. `[FULL - METHOD: Discourse JSON API via curl; dated 2020, flagged as staleness]`
- [Terabyte size, million notes vaults? How scalable is Obsidian? - Obsidian Forum](https://forum.obsidian.md/t/terabyte-size-million-notes-vaults-how-scalable-is-obsidian/66674) - thread opened 2023-09-05. `[FULL - METHOD: Discourse JSON API via curl; dated 2023, flagged as staleness]`
- [Trying to come up with/understand how to create an Inbox system - Obsidian Forum](https://forum.obsidian.md/t/trying-to-come-up-with-understand-how-to-create-an-inbox-system/42321) - thread opened 2022-08-25. `[PARTIAL - METHOD: Discourse JSON API via curl, first 5 posts read; dated 2022, mechanism cited not literal fix]`
- Hacker News search (`hn.algolia.com`) for "obsidian AI agent vault" - 10 results surveyed 2026-09-16 for candidate GitHub examples (`nex-crm/wuphf` at 260pts/114 comments checked and excluded - the linked repo has since been repurposed to an unrelated bot product, confirmed via `gh api`). `[FULL - METHOD: Algolia API, keyless]`
- `~/zao-vault/scripts/rot-scan.py`, `~/zao-vault/.gitignore`, `~/zao-vault/AGENTS.md`, `~/zao-vault/decisions/rot-detection-for-people-and-projects.md`, `~/zao-vault/inbox/README.md`, `du`/`find`/`git count-objects` on `~/zao-vault` - all measured directly, 2026-09-16. `[FULL - direct filesystem/git measurement]`
