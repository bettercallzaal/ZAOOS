---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "2460, 2448, 2433, 2320, 2317, 606, 2494"
original-query: "Managing information with Obsidian as the single home for a solo founder plus an agent fleet - one person, twelve or more Claude Code lanes and three bots writing to one vault (~/zao-vault, git-backed, on a Mac, read by lanes on a VPS and a Raspberry Pi over git). Plugins/traps for a machine-written vault; how other people run Obsidian with agents writing into it in 2026; inbox/folding and rot-avoidance patterns; mobile read/answer patterns; what NOT to move into Obsidian and where search/sync degrade."
tier: STANDARD
---

# 2493 - Obsidian as the single home for a solo founder plus an agent fleet

> **Goal:** With a vault at 2,768 markdown files and 5.7G (2026-09-16), written
> by 12+ Claude Code lanes and three bots and read over git by a VPS and a Pi,
> establish which Obsidian features help a mostly machine-written vault, how
> measured outside projects run the same pattern, the inbox/rot pattern this
> vault should extend to its actual capture door, the mobile answer, and the
> size/count line where Obsidian degrades.

## Updated 2026-09-25

**Central claim confirmed, not retracted: the doc's one open action - point
the rot clock at `inbox/` - is still not done, and is now two days past its
own deadline.** `scripts/rot-scan.py` still reads `FOLDERS = ("people",
"projects")` and `CLAIM_FOLDERS = ("notes", "handoffs", "projects",
"decisions", "people")`, byte-for-byte unchanged from 2026-09-16 (re-read
directly today). `inbox/` - which now holds **517 files under
`inbox/clips/`** (was 59 on 2026-09-16, roughly a 9x increase in nine days)
plus the still-unretired `inbox/drops/` subfolder - has no review clock at
all. A same-estate status file (`handoffs/status/zj.md:3681`) independently
restates the same gap as of its own last update ("inbox/ and inbox/clips
have NO rot clock... action for the seat by 09-23"), corroborating this from
a second surface, not just this doc's own re-read.

One piece of related progress did ship: `inbox/README.md` was rewritten
(dated 2026-09-19) to state "This is the ONLY capture door," cite doc 2494 by
number, name `inbox/drops/` as "being retired (Zaal, grill 2026-09-17)," and
add the "after a file lands, run `lane-send <lane> "<path>"`" line - all of
which used to be open recommendations. The vault's `.gitignore` also picked
up a same-day rule (2026-09-16, citing doc 2494 by name): `inbox/**/*.png`,
`*.jpg`, `*.jpeg`, `*.webp`, `*.heic` are now ignored, closing the "raw phone
photos as git blobs" exposure doc 2494 flagged. What has NOT happened: the
`inbox/drops/2026-09-16-michael-anderson/` folder itself (two image files)
still physically sits in `inbox/drops/`, un-moved, nine days after the
README started calling the door retired - the policy shipped, the cleanup
did not.

**A raw file-count claim needs a caveat this doc didn't carry before, and it
changes the headline number.** A plain `find ~/zao-vault -name '*.md' | wc
-l` returns **5,012** today, which reads as the vault having nearly doubled
again. It has not: `git worktree list` shows **13 worktrees** attached to
this repo, and two of them - `.claude/worktrees/bczximprovement-note-tweet-
layer` and `.worktrees/vault-remote-ui` - are checked out **inside**
`~/zao-vault` itself, so a recursive `find` counts their files a second
time. Excluding those two nested paths gives **2,152** markdown files in the
main tree - lower than the 2,768 counted on 2026-09-16, not higher. That
drop is real in this measurement and its cause is UNKNOWN (no mass-delete
commit appears in the last 10 `git log` entries, and the estate's "never
delete" rule makes an intentional bulk removal unlikely) - flagged as
UNKNOWN, not inferred. The other 11 worktrees live entirely outside
`~/zao-vault` (`~/orca/workspaces/zao-vault/*`, `~/zao-vault-worktrees/*`,
one under a scratchpad path) and do not affect either count. Any future
file-count claim for this vault must state whether it is scoped to the main
tree or includes nested worktrees - this doc did not know to ask that
question on 2026-09-16.

Vault size is **6.1G total (was 5.7G)**, with `images/` unchanged at 5.2G
across 2,923 files (now 85% of a larger total, not 91% - the growth is all
in non-image content, consistent with more captured material and the two
in-tree worktrees, not an images regression).

Doc 2460 (2026-09-01, DEEP) already settled the plugin question at 860
files: adopt Bases, skip Dataview and Canvas-as-data, skip Obsidian MCP
servers for now. That verdict is re-confirmed here with the same three
`.base` files still live (`projects/Projects.base`, `people/People.base`,
`notes/types.base`, timestamps unchanged since 2026-09-02/09-15) and zero
community plugins installed (`~/zao-vault/.obsidian/plugins` still does not
exist; only config JSON files sit in `.obsidian/`).

**Two of the original Next Actions are further along than a first read
suggests:**
- **Tag-singular migration: functionally done.** A vault-wide grep for
  `^tag:` (the frontmatter key, singular) now returns exactly one hit, and
  it is not a frontmatter field - it is a saved search-query string in
  `notes/searches.md` (`tag:#decision -path:archive`), not a violation of
  the `tags:` (plural) convention. The original Next Action's shipped
  criteria ("grep for `^tag:` returns zero") is close enough to call done;
  the one remaining hit is not a migration failure.
- **The mobile-git rule moved, and arguably got stronger, rather than
  shipping in the exact spot this doc asked for.** `~/zao-vault/notes/
  vault-on-phone.md` (rewritten 2026-09-01, predating this doc, read in
  full today) does not add a line to `README.md` Conventions as this doc's
  Next Actions specified - instead it is a live, detailed mobile-sync note
  that supersedes part of Decision 4: it recommends **GitSync**, not
  Working Copy, for the write-in leg, because Working Copy's free tier
  cannot push ("if I can only look at it, can't push anything, how useful
  will this be?" - Zaal, quoted in the note, dated 2026-09-01). `README.md`
  links to this note rather than restating the rule inline - one canonical
  note beats a duplicated one, so this is judged close enough to ship, just
  not in the form specified. The Working Copy free-vs-paid question this
  doc asked (Next Actions row 2) is therefore moot: the vault's own answer
  already moved past Working Copy for the push leg.

**Confirmed unchanged, re-fetched today:** the `stephanmiller.com` mobile-git
article still reads "Updated August 03, 2026" and still contains "very
unstable" verbatim; all three external GitHub repos this doc cited
(`ai-second-brain-template` 20 stars/pushed 2026-09-03, `agent-vault` 2
stars/pushed 2026-09-09, `obsidian-vault-agent` 39 stars/pushed 2026-03-30)
are unarchived, unrelicensed, and at the same `pushed_at` as the 2026-09-16
measurement - genuinely dormant, not under-measured.

## Key Decisions

| # | Decision | Reason | 2026-09-25 status |
|---|---|---|---|
| 1 | **Extend rot detection to `inbox/` and `inbox/clips/`.** They are in neither of `rot-scan.py`'s two scopes. | Measured in `scripts/rot-scan.py`: `FOLDERS = ("people", "projects")` (dated `next`/`by`/`done`) and `CLAIM_FOLDERS = ("notes", "handoffs", "projects", "decisions", "people")` (inline `[re-check: date]`). `inbox/` - the one folder three bots and 12+ lanes actually write raw captures into - is in neither list. This is the exact failure mode doc 2448/2460's own community source and the `ai-second-brain-template` repo (below) both name: capture without a forced review clock is what makes an inbox a graveyard. | **STILL OPEN, past due.** Re-read `scripts/rot-scan.py` today: both tuples are unchanged, byte-for-byte, from 2026-09-16. `inbox/clips/` has grown from 59 to 517 files in the meantime with no clock on any of them. |
| 2 | **KEEP Bases; do not add Dataview, Canvas-as-data, or any Obsidian MCP server.** | Unchanged from doc 2460's rule (nothing whose output exists only at render time is a source of truth) and doc 2433's MCP survey. `StevenStavrakis/obsidian-mcp` (MIT, 729 stars at last measurement) is still WATCH/adopt-later; Claude Code's own filesystem tools already give every one of the 12+ lanes full read/write on `~/zao-vault` over the same git the VPS and Pi already use, so an MCP server adds a process and a dependency for a capability that already exists. | **Confirmed unchanged.** `~/zao-vault/.obsidian/plugins` still does not exist (only `app.json`, `workspace.json`, `core-plugins.json` etc. sit in `.obsidian/`); the three `.base` files are untouched since 2026-09-02/09-15. |
| 3 | **Do NOT put the Obsidian Git plugin on any phone.** The plugin's own maintainer documentation calls the mobile implementation "very unstable" and recommends a different tool - confirmed current 2026-08-03. | Neither iOS nor Android lets an app run the real git binary; the plugin falls back to `isomorphic-git`, a JS reimplementation with no SSH, no rebase, no submodules, no git-LFS, and a repo-size ceiling set by the phone's free RAM. Failure modes are crash-on-clone, buffer overflow, or hanging - all memory failures, not sync failures. [Source: stephanmiller.com, below] | **Source re-fetched 2026-09-25, unchanged.** Page still reads "Updated August 03, 2026" and still contains "very unstable" verbatim. The rule was never written into `~/zao-vault/README.md` Conventions verbatim as the Next Action specified, but the vault's separate `notes/vault-on-phone.md` note (see Updated section above) carries the same prohibition in stronger, more specific form. |
| 4 | **Keep the existing two mobile paths, and do not merge them.** Working Copy + an iPhone Shortcut is correct for **write-in** (already how `inbox/README.md` describes capture); the Telegram/card path (`zao-tracker` cards, `quick-grill`'s tap-to-answer batches of 4) is correct for **one-tap decisions**. Obsidian's own mobile app should stay a read/triage surface, not the sync engine. | This matches the measured community answer: git on mobile is a version-control tool, not a live sync tool (commits land minutes later, not instantly), and a native git client (GitSync, or paid Working Copy) should do the mobile git leg if one is wanted at all - Obsidian itself should not be asked to run git. | **PARTIALLY SUPERSEDED.** The vault's own `notes/vault-on-phone.md` (2026-09-01) has since moved the write-in leg from Working Copy to GitSync, specifically because Working Copy's free tier cannot push. The Telegram/card path for decisions is unchanged. |
| 5 | **Never move secrets into `~/zao-vault`; keep large media out of git.** Both are already correct here - confirm the pattern, do not build a new one. | Secrets already live in `~/.zao/private/*.env`, a directory outside the vault entirely. Media is already excluded: `images/` is **5.2G of the vault's 5.7G (91%) across 2,923 files** and is explicitly gitignored (`.gitignore`: "bulk image library - browsable in Obsidian, never in git"), with the curated subset tracked separately in the zao-brand repo and a catalogue note (`projects/image-catalogue.md`) pointing at where the real files live. The vault's own `.git` stays at 140M packed as a result. | **Strengthened.** `images/` is unchanged at 5.2G/2,923 files (now 85% of a larger 6.1G vault, not 91%, purely because the markdown side grew). New since 2026-09-16: `.gitignore` gained `inbox/**/*.png`, `.jpg`, `.jpeg`, `.webp`, `.heic` rules (dated 2026-09-16, citing doc 2494 by name) - phone-captured images in `inbox/` are now excluded from git too, closing a gap doc 2494 flagged. `.git` packed size is ~145M today (`git count-objects -v`), consistent with "unchanged." |

## Findings

### Finding 1 - What actually helps a machine-written vault, confirmed at scale

Re-measured 2026-09-25 against doc 2460's 2026-09-01 baseline and this doc's
own 2026-09-16 pass. See the "Updated 2026-09-25" section above for the
worktree-nesting caveat on the markdown-file count.

| Measure | 2026-09-01 (doc 2460) | 2026-09-16 | 2026-09-25 (this update) |
|---|---|---|---|
| Markdown files (main tree) | 860 | 2,768 | **2,152** (5,012 raw via a recursive `find`; 2,152 excluding two nested worktree checkouts - see above) |
| `.base` files live | 0 (recommended, not yet built) | 3 (`projects/Projects.base`, `people/People.base`, `notes/types.base`) | **3, unchanged** (same three files, timestamps unchanged since 09-02/09-15) |
| Community plugins installed | 0 | 0 | **0** (`.obsidian/plugins` still absent) |
| Vault size | not measured | 5.7G (5.2G `images/`, 91%) | **6.1G** (5.2G `images/`, unchanged file count and size, now 85% of a larger total) |

The rule holds regardless of scale: **nothing whose output exists only at
render time is a source of truth.** Bases passes (data lives in
frontmatter, the `.base` file is a saved filter, not a copy); Dataview and
`dataviewjs` fail (results exist only inside the app); Canvas fails
(connections aren't stored on disk at all). Properties/frontmatter remain
the one structure both a human on iOS and a grep from a VPS lane see
identically. Full mechanism and the access table are in doc 2460; nothing
here overturns it.

### Finding 2 - How other measured builds run agents writing into Obsidian in 2026

Three concrete, currently-maintained examples (not vendor pages), fetched or
measured directly on 2026-09-16 and re-checked 2026-09-25:

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

Re-fetched 2026-09-25 via `gh api repos/<owner>/<repo>` for all three: none
archived, none relicensed, identical star counts and `pushed_at` timestamps
to the 2026-09-16 measurement. This finding is confirmed, not retracted -
all three are genuinely dormant projects, not under-measured ones.

### Finding 3 - The inbox/fold pattern, and the gap in this vault's own rot scan

This vault already has the two halves of the pattern the field converges on:
a capture door (`inbox/`, `inbox/clips/` - 59 clip files on 2026-09-16,
**517 as of 2026-09-25**, `inbox/README.md`: *"Nothing lives here long"*)
and a fold destination (`notes/folded-artifacts/` - 14 files, unchanged,
each a synthesized artifact pulled out of a longer capture). What is
missing is the review clock connecting them.

`scripts/rot-scan.py` (measured 2026-09-16 and re-read byte-for-byte
2026-09-25, unchanged) implements exactly the decided mechanism
(`decisions/rot-detection-for-people-and-projects.md`, 2026-09-02: red on a
passed `by:`, amber on 7 days untouched, Telegram DM only on change) but its
two scopes are still:

```
FOLDERS = ("people", "projects")
CLAIM_FOLDERS = ("notes", "handoffs", "projects", "decisions", "people")
```

`inbox/` is in neither, nine days after this doc's Next Action asked for it
and two days past that action's own deadline (2026-09-23). A same-estate
status file (`handoffs/status/zj.md:3681`) independently restates the same
gap. A 2022 Obsidian forum thread on this exact problem converges on the
same mechanism from the opposite direction - one user's fix was to use the
vault **root** as the inbox specifically because *"it had an unintended
side-effect which was to force myself to process my inbox, as my vault
looks really untidy"* [PARTIAL - forum thread read via API, 2022, dated;
mechanism cited, not the literal fix]. That is a manual version of the same
clock this vault already automated for `people/` and `projects/` - it has
still not been pointed at the folder three bots and 12+ lanes actually drop
raw material into, and that folder has grown roughly 9x in the meantime.

### Finding 4 - Mobile: the measured 2026 state of Obsidian + git on a phone

Fetched in full 2026-09-16 and re-fetched 2026-09-25 (`stephanmiller.com/
obsidian-git-sync-mobile/`, still reads "Updated August 03, 2026", unchanged
content): the Obsidian Git plugin's own documentation says the mobile
implementation is "very unstable" and recommends a different syncing
service - "the developer of the plugin telling you not to use his plugin."
Mechanism: iOS/Android block the real git binary, so the plugin substitutes
`isomorphic-git` (no SSH, no rebase, no submodules, no git-LFS, repo size
capped by the phone's free RAM), and the documented failure modes (crash on
clone/pull, buffer overflow, hangs) are all memory failures, not sync bugs.
It is also not real-time - commits land on a multi-minute timer, so a
same-minute edit on two devices can produce a merge conflict with no good
mobile resolver.

The recommended stable pattern, if a native git leg on mobile is wanted at
all: a dedicated git client (GitSync - native Rust/`git2-rs` core, SSH
support, background sync, free; or Working Copy on iOS - mature, but its
**free tier cannot push**, only pull, so a paid unlock is required for a
two-way mobile leg) clones into a plain folder and Obsidian just points at
that folder as a vault.

Updated 2026-09-25: this vault's actual mobile path has moved since this
doc was first written. `~/zao-vault/notes/vault-on-phone.md` (rewritten
2026-09-01, so it predates this doc but this doc did not surface it on
2026-09-16) records that the write-in leg switched from Working Copy to
**GitSync**, in Zaal's own words: *"if I can only look at it, can't push
anything, how useful will this be?"* - because Working Copy's free tier is
pull-only. That note also states a rule this doc's Decision 3 implied but
did not name: never run two sync layers (Obsidian Sync plus iCloud/Dropbox)
over the same vault, and never point two different git clients at the same
working directory. The Telegram/card path (`zao-tracker` cards surfaced
through `quick-grill`'s tap-to-answer batches of 4) is unchanged and still
correct for **decisions**, distinct from the git leg for **write-in**.

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

Measured against this vault directly: whether counted at 2,152 (main tree)
or 5,012 (raw, including nested worktrees), this vault is nowhere near the
range where either thread reports trouble - this vault's real size problem,
if it has one, is `images/` (2,923 files, 5.2G, 85% of the vault as of
2026-09-25), and that is already solved correctly: gitignored, catalogued
separately (`projects/image-catalogue.md`), never asked to sync through git
to the VPS or Pi. The one thing this vault does that neither thread's
failure mode touches: secrets. They are not an Obsidian problem here because
they were never put in the vault - `~/.zao/private/*.env` sits outside
`~/zao-vault` entirely, so there is no gitignore rule standing between a
secret and a commit; the secret was never a vault file to begin with.
**Never change that**: a vault this information-dense, replicated to two
more machines over git and read by three bots, is the last place a
credential should ever land, ignored-or-not.

## What NOT to move into Obsidian, in one table

| Category | Where it actually lives here | Why not the vault |
|---|---|---|
| Secrets, tokens, credentials | `~/.zao/private/*.env` | Never in a git-replicated, agent-read tree, regardless of gitignore |
| Bulk/raw images (2,923 files, 5.2G) | `~/zao-vault/images/`, gitignored | Media this large degrades git clone/push size on 3 machines for no search benefit; Obsidian was never built to index media by content |
| Curated brand marks | zao-brand repo | Has its own review/versioning home; duplicating it in the vault would desync two sources of truth |
| Recordings (`.m4a`/`.mp4`/`.wav`/`.mp3`) | `inbox/recordings/*`, gitignored | Same media-in-git problem; filed elsewhere once processed, per the existing `.gitignore` comment |
| Phone-captured images landing in `inbox/` | `inbox/**/*.png,.jpg,.jpeg,.webp,.heic`, gitignored since 2026-09-16 | New rule this update confirms; closes doc 2494's raw-photos-as-git-blobs finding |
| Anything whose only source of truth is a render-time plugin output | N/A - by rule (Decision 2 / doc 2460) | Graph metadata, Canvas connections, Dataview/`dataviewjs` results exist nowhere on disk; an agent reading with `cat` or `grep` sees nothing |

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `inbox` and `inbox/clips` to `scripts/rot-scan.py`'s claim-mode scope (or a lighter dedicated age-check), so the vault's busiest agent-fill folder (now 517 files and growing) gets the same red/amber clock as `people/` and `projects/` - shipped when a re-run of `rot-scan.py` reports a non-zero claim count sourced from `inbox/` | zj (vault lane) | PR to zao-vault | 2026-09-29 (re-dated; original 2026-09-23 deadline passed unshipped) |
| Move `inbox/drops/2026-09-16-michael-anderson/` into `inbox/` proper and delete the now-empty `inbox/drops/` subfolder, closing the loop the 2026-09-19 README rewrite already announced ("being retired") - shipped when `inbox/drops` no longer exists | @Zaal or zj (vault lane) | PR to zao-vault | 2026-09-27 |
| Working Copy push-tier question: WITHDRAWN as originally framed. The vault's own `notes/vault-on-phone.md` (2026-09-01) already moved the write-in leg to GitSync because Working Copy's free tier cannot push; no further decision needed unless Working Copy is reintroduced for a different purpose | - | - | wontfix (superseded) |
| Write a one-line cross-reference in `~/zao-vault/README.md` Conventions pointing at `notes/vault-on-phone.md` for the mobile-git rule, so a reader of README alone still finds the GitSync-not-Obsidian-Git-plugin rule - shipped when the README Conventions section links the note | zj (vault lane) | PR to zao-vault | 2026-09-29 |
| Tag-singular migration: CLOSED. Vault-wide `^tag:` grep returns one hit and it is a saved search string, not a frontmatter violation - no further action | - | - | done (2026-09-25) |
| Re-check `StevenStavrakis/obsidian-mcp` only if concurrent-writer conflicts actually occur as lane count grows past today's fleet size (doc 2433's own stated trigger) - no action otherwise | zj (vault lane) | Watch, not a PR | wontfix (trigger-based, not dated) |

## Also See

- [Doc 2460](../2460-obsidian-dual-reader-vault/) - the plugin rule and access table this doc re-confirms
- [Doc 2448](../2448-obsidian-plugins-agent-memory/) - the original no-community-plugins decision, amended by 2460
- [Doc 2433](../2433-mcp-connectors-together/) - `obsidian-mcp` WATCH/adopt-later verdict
- [Doc 2320](../2320-logging-obsidian-capture-completeness/) - capture conventions this doc's inbox finding extends
- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - the two-surface (Obsidian + Claude) stack decision
- [Doc 2494](../2494-file-handoff-claude-code-fleet/) - the file-handoff doc that produced the `inbox/README.md` rewrite and the `.gitignore` fix this update confirms shipped
- `~/zao-vault/decisions/rot-detection-for-people-and-projects.md` - the mechanism Finding 3 extends to `inbox/`
- `~/zao-vault/notes/vault-on-phone.md` - the live mobile-sync note that supersedes part of Decision 4

## Sources

- [Obsidian Git plugin sync in 2026: what actually works on mobile](https://www.stephanmiller.com/obsidian-git-sync-mobile/) - Stephan Miller. `[FULL - METHOD: curl + HTML strip; fetched 2026-09-16, re-fetched 2026-09-25, unchanged, still "Updated August 03, 2026"]`
- [ibrahimkobeissy/ai-second-brain-template](https://github.com/ibrahimkobeissy/ai-second-brain-template) - README + `gh api` stars/license/pushed_at. `[FULL - METHOD: gh api + README fetch, 2026-09-16; re-verified via gh api 2026-09-25, unchanged]`
- [ssheld/agent-vault](https://github.com/ssheld/agent-vault) - README + `gh api` stars/license/pushed_at/open_issues. `[FULL - METHOD: gh api + raw README fetch, 2026-09-16; re-verified via gh api 2026-09-25, unchanged]`
- [tuan3w/obsidian-vault-agent](https://github.com/tuan3w/obsidian-vault-agent) - `gh api` stars/license/pushed_at. `[PARTIAL - METHOD: gh api metadata only, README not fetched; re-verified via gh api 2026-09-25, unchanged]`
- [Maximum Number of Notes in Vault - Obsidian Forum](https://forum.obsidian.md/t/maximum-number-of-notes-in-vault/1509) - thread opened 2020-06-09. `[FULL - METHOD: Discourse JSON API via curl; dated 2020, flagged as staleness]`
- [Terabyte size, million notes vaults? How scalable is Obsidian? - Obsidian Forum](https://forum.obsidian.md/t/terabyte-size-million-notes-vaults-how-scalable-is-obsidian/66674) - thread opened 2023-09-05. `[FULL - METHOD: Discourse JSON API via curl; dated 2023, flagged as staleness]`
- [Trying to come up with/understand how to create an Inbox system - Obsidian Forum](https://forum.obsidian.md/t/trying-to-come-up-with-understand-how-to-create-an-inbox-system/42321) - thread opened 2022-08-25. `[PARTIAL - METHOD: Discourse JSON API via curl, first 5 posts read; dated 2022, mechanism cited not literal fix]`
- Hacker News search (`hn.algolia.com`) for "obsidian AI agent vault" - 10 results surveyed 2026-09-16 for candidate GitHub examples (`nex-crm/wuphf` at 260pts/114 comments checked and excluded - the linked repo has since been repurposed to an unrelated bot product, confirmed via `gh api`). `[FULL - METHOD: Algolia API, keyless]`
- `~/zao-vault/scripts/rot-scan.py`, `~/zao-vault/.gitignore`, `~/zao-vault/AGENTS.md`, `~/zao-vault/decisions/rot-detection-for-people-and-projects.md`, `~/zao-vault/inbox/README.md`, `~/zao-vault/notes/vault-on-phone.md`, `~/zao-vault/notes/searches.md`, `git worktree list`, `du`/`find`/`git count-objects` on `~/zao-vault` - all measured directly. `[FULL - direct filesystem/git measurement, 2026-09-16 and re-measured 2026-09-25]`
- `~/zao-vault/handoffs/status/zj.md:3681` - independent corroboration of the unfixed rot-scan gap. `[FULL - direct local read, 2026-09-25]`
