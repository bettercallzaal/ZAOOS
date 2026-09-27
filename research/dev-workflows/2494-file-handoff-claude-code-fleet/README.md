---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "2493, 2460, 2448"
original-query: "we need a better way to copy and paste files so you know where they are - then, on the seat's first answer (a ~/Drop folder symlinked into the vault with a launchd watcher that messages the seat): ehh the drop isn't the best method, research this. How should a solo founder hand a file (photo, screenshot, PDF, CSV) to Claude Code and a fleet of Claude Code lanes in Orca terminals, so the receiving session knows the path without hunting ~/Downloads, and the file ends up somewhere durable the vault or the right repo can reference?"
tier: STANDARD
---

# 2494 - File handoff to Claude Code and a fleet of Orca lanes

> **Goal:** Ground the seat's rejected "~/Drop + launchd watcher" proposal in what
> Claude Code's own file-input paths actually do, what this vault already built
> for this exact problem, and what ZOE already runs live for Telegram photos -
> then recommend one Mac path and one phone path with the exact gesture, what
> the receiving session gets told, and where the file lives after.

## Updated 2026-09-25 - the central claim is wrong now, lead with it

The original doc's Key Decision 5 called the VPS-to-vault gap "the one real gap
worth building" and Next Action #4 asked someone to close it by 2026-09-25.
**It was closed nine days ago, not today.** `bot/src/zoe/inbound-media.ts`
(new file, merged 2026-09-17 in PR #3541, title: "ingest inbound media to
vault at `inbox/-/` with pre-commit screening") now runs on every inbound
Telegram photo/document ZOE receives, before the reply the user sees:

1. Screens the caption and (for text/JSON/CSV) the file body for secret
   patterns (private key headers, `ghp_`/`sk-`/`sk-ant-` tokens, a generic
   `api_key=`/`secret_key=`/`bearer` pattern) and for un-allowlisted PII via
   the same `containsPii()` the outbound path already used - **fail-closed**:
   a hit blocks the save entirely, nothing is written and nothing is
   committed.
2. Saves the clean file into `<vault>/inbox/-/<timestamp>-<sanitized-name>`
   (not the plain `inbox/` root the old doc assumed - the actual landing
   folder is `inbox/-/`), with an optional Markdown sidecar carrying
   `captured`/`source: "telegram-zoe"`/`caption` frontmatter when a caption
   was sent.
3. Commits **only** the new file(s) - `git add <exact path>`, never
   `git add .` - after fetching and fast-forward-merging `origin/main` first,
   and pushes. The reply the user sees names the vault path and the short
   commit SHA.

So both halves of the original Key Decision 5 gap are closed by the same
commit: the file now lands inside the git-synced vault (reachable by any Mac
lane that pulls), and the "no PII/secret screen on inbound" flag from the
original Findings (`pii.ts` scans only outward-writing paths) is also fixed -
`containsPii` is now called on the inbound leg too.

**What is NOT yet confirmed: that this code has ever fired for real.** `git
log --all --grep="inbound media"` in `~/zao-vault` returns nothing, and
`inbox/-/` does not exist in the local vault checkout or on `origin/main`
(checked both). The feature is merged and live in the bot's source, but no
photo or document has produced a matching commit as of this pass - so "built"
is confirmed, "used" is UNKNOWN. Zaal has not been asked whether the bot
process on the VPS was restarted to pick up PR #3541; that is the one open
question left on this thread.

Also updated: the `~/Drop`/`inbox/drops` duplicate-door problem (Key Decision
2 originally) is **half-fixed**. The `~/Drop` symlink itself is gone (`ls -la
~/Drop` -> no such file). But `inbox/drops/2026-09-16-michael-anderson/`
still exists on disk with the same two files, byte-identical (MD5-matched)
to copies that now also sit at `inbox/2026-09-16-michael-anderson/` (10
minutes newer). The files were **copied**, not moved, and the `inbox/drops/`
subfolder itself was never deleted - so there remain two copies of the same
2 files and the second capture door `inbox/README.md` calls "being retired"
is still physically present. `inbox/README.md` itself was updated as asked
(see Findings).

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **SKIP the launchd watcher. Still not built, and now moot.** No plist anywhere on this Mac references `inbox/drops` or `~/Drop` (re-measured 2026-09-25: same two false-positive matches on "watch"/"drop" as before, `com.zao.zaostock-file-watch.plist` and Steam's cleanup agent). Unchanged from the original finding. |
| 2 | **Finish retiring the second capture door.** `~/Drop` symlink is gone (done). `inbox/drops/2026-09-16-michael-anderson/` was copied into `inbox/` but never deleted - duplicate content still sits in the folder `inbox/README.md` says is "being retired." Delete `inbox/drops/` entirely now that the copy exists at the top level. |
| 3 | **USE explicit "tell the lane" over "watch and push" - unchanged and now doubly proven.** `bin/lane-send` (re-read 2026-09-25, now 38,843 bytes, last touched 2026-09-19 - grew a second guard against sending Enter into an interactive menu since the original pass) still types a literal message into a live Orca/tmux pane. ZOE's inbound-media path is a second, independent proof of the same "act now, tell in the same turn" shape, this time writing straight to the git vault instead of a VPS-local folder. |
| 4 | **Large binaries still must not land as unscreened git blobs at the capture door - now enforced in code for the Telegram leg, not yet for the Mac leg.** `inbox/-/*` gets screened and committed by `inbound-media.ts`; a file dropped straight into `inbox/<dated-name>/` by hand (the Mac path this doc recommends) still has no equivalent secret/PII screen before a human commits it. That asymmetry is new information, not in the original doc. |
| 5 | **CLOSED, not open: the VPS-to-vault gap.** Superseded - see the lead section above. `bot/src/zoe/inbound-media.ts`, merged 2026-09-17 (PR #3541), does exactly what the original Next Action #4 asked, nine days ahead of its own 2026-09-25 due date. Production use is UNKNOWN (no matching vault commits found); the code path is confirmed. |

## Findings

### What Claude Code itself supports (re-fetched 2026-09-25, FULL, unchanged)

`code.claude.com/docs/en/common-workflows`, re-fetched via `curl` + HTML
strip (the app is a JS-rendered docs site; the embedded page JSON was read
directly, not a WebFetch summary):
- **Drag-and-drop** a file into the Claude Code window - still documented,
  same wording.
- **Paste an image**: the page's exact current text is "Copy an image and
  paste it into the CLI with `Ctrl+V`, or with `Alt+V` on Windows and WSL" -
  it does not itself say "Cmd+V"; the original doc's "(Cmd+V is the Mac
  equivalent)" was a reasonable gloss, not a quote, and is corrected here to
  the page's own words.
- **Give a path directly**: "Provide an image path to Claude, for example
  'Analyze this image: /path/to/your/image.png'" - unchanged, still a
  first-class method.
- **`@file` mentions**: "You can reference multiple files in a single
  message (for example, '@file1.js and @file2.js')" - unchanged.
- **`--add-dir`** (`code.claude.com/docs/en/cli-reference`, re-fetched):
  "Add additional working directories for Claude to read and edit files...
  Validates that each path exists as a directory... To persist these
  directories across sessions, set `permissions.additionalDirectories` in
  settings" - unchanged from the original finding.

**Measured on this Mac, this session**: a paste still lands at
`~/.claude/image-cache/<session-id>/`, confirmed by this fork's own
scratchpad path - still per-session, not a fleet handoff surface. Unchanged.

**Orca is still UNMEASURED for drag-and-drop onto a terminal pane**,
re-checked directly (`orca --help`, `orca terminal --help`, both run
2026-09-25): `orca terminal send` still takes only `--text` (plus
`--enter`/`--interrupt`/`--wait-submit`); the only `--files <path,...>` flag
in the whole CLI still belongs to the browser-automation `upload` command
(uploading into a web page's file input), not to any terminal command. No
change since 2026-09-16.

### What this vault already built (doc 2493, re-verified 2026-09-25)

- `inbox/README.md` (re-read in full today) now explicitly states: **"This
  is the ONLY capture door,"** names doc 2494 as the reason three doors
  existed, says `inbox/drops/` is being retired by Zaal's own call at "grill
  2026-09-17," and carries the line this doc's Next Actions asked for:
  "After a file lands, run `lane-send <lane> "<path>"` (or DM the relevant
  lane) so the receiving session is told about it, rather than left to
  notice on its own." **This shipped.**
- `scripts/rot-scan.py`, re-read directly (not assumed): still exactly
  `FOLDERS = ("people", "projects")` and `CLAIM_FOLDERS = ("notes",
  "handoffs", "projects", "decisions", "people")`. `inbox/` and
  `inbox/clips/` are still absent from both scopes. **This has not shipped**,
  contrary to `inbox/README.md`'s framing of the door as settled - the review
  clock doc 2493 and this doc both flagged is still missing.

### What ZOE runs live for Telegram files - re-read at the current line numbers

The handler moved: it is now at `bot/src/zoe/index.ts:2421-2500` (was cited
as 2166-2216 in the original doc; the file grew in between). Re-read in
full, 2026-09-25. The shape is unchanged (Zaal-DM-only via `isFromZaal`,
downloads via `downloadTelegramFile` to `ZOE_PATHS.home/inbox` first) but a
new step was inserted after the download and before the reply:

```
savedPath = await downloadTelegramFile(token, fileId, join(ZOE_PATHS.home, 'inbox'), preferName);
...
const mediaResult = await processInboundMedia({ filename, mimeType, buffer, caption });
if (mediaResult.savedPath) {
  savedPath = join(vaultDir, mediaResult.savedPath);   // now points at ~/zao-vault/inbox/-/...
  vaultMediaSaved = true;
}
...
await ctx.reply(`Got the ${label}${vaultNote} - ...`)   // vaultNote names the vault-relative path
```

`processInboundMedia` (new module, `bot/src/zoe/inbound-media.ts`, 359
lines, read in full) is the screen-save-commit-push pipeline described in
the lead section. Its own docstring states the invariant this doc's original
Key Decision 4 asked for in prose: "Never runs `git add .`... fails loudly on
conflict."

### `lane-send` - re-confirmed, grown a second guard

`~/zaal-dotfiles/bin/lane-send`, re-read in full 2026-09-25 (38,843 bytes,
last modified 2026-09-19, three days after the original doc). Still types a
literal message into a live Orca/tmux pane with the bare-Enter guard the
original doc measured (218 `tmux send-keys ... Enter` calls in one log, 161
bare). New since the original pass: a second guard refuses to send a bare
`Enter` into a live interactive menu (matches patterns like "Enter to
select", "Do you want to proceed") after Zaal's own instruction, "NEVER
SELECT AN OPTION." Not central to this doc's question, noted for accuracy
since the file's content changed since the original citation.

### Alternatives - unchanged from the original doc

Re-checked, no material change: watched drop folder (SKIP), Shortcuts Share
Sheet -> `inbox/` -> `lane-send` (USE, unchanged), iCloud/Syncthing (SKIP,
Syncthing still not found on this Mac), Telegram-as-inbox (USE, and its one
flagged gap is now closed - see lead section), local HTTP upload page /
filesystem MCP server (SKIP, unchanged reasoning).

## Recommendation (three lines, updated)

1. **Mac / fleet path, unchanged:** save or move the file into
   `~/zao-vault/inbox/<dated-name>/` - not `inbox/drops/`, which still exists
   as a duplicate and should be deleted - then run `lane-send <lane> "file at
   inbox/<dated-name>/<filename> - read it"`.
2. **Phone path, unchanged:** Working Copy + iPhone Shortcut into `inbox/`
   for the vault/fleet; Telegram DM to ZOE for anything meant for ZOE
   specifically - and as of 2026-09-17, a Telegram send to ZOE now ALSO
   reaches the vault (and therefore the fleet) automatically, screened and
   committed, with no further hop required.
3. **Nothing left to build on the VPS-to-vault leg** - it shipped. What is
   left: (a) delete the duplicate `inbox/drops/` folder, (b) add `inbox/` and
   `inbox/clips/` to `scripts/rot-scan.py`'s scope (still open, shared with
   doc 2493's own Next Actions), (c) confirm with Zaal whether the bot
   process was restarted to pick up PR #3541 and whether any real inbound
   media has used it yet (UNKNOWN from this machine).

## Constraints checked against

- **Never delete:** `inbox/README.md`'s "a lane... moves the item out" is
  still a move within the vault's own git history, not a deletion; the
  Next Action to delete `inbox/drops/` below is deleting a *duplicate*
  already copied elsewhere, not the only copy of anything.
- **Secrets never through this path:** now enforced in code for the Telegram
  leg (`screenInboundMedia`, fail-closed) - this closes the flag the original
  doc raised. The Mac-manual-drop leg still has no equivalent screen; flagged
  as new information in Key Decision 4.
- **`images/` is gitignored and roughly 91% of vault size:** unchanged,
  matches doc 2493's figure; not re-measured byte-for-byte this pass since
  no vault content changed on that axis.
- **Told, not hunted:** every recommended path still ends in an explicit path
  in a message (`lane-send` or ZOE's reply text, which now also names the
  vault path and commit SHA).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Delete the duplicate `inbox/drops/2026-09-16-michael-anderson/` folder now that its contents are copied to `inbox/2026-09-16-michael-anderson/` (confirmed byte-identical via MD5); shipped = `ls ~/zao-vault/inbox/drops` returns nothing | @Zaal | File op | 2026-10-02 |
| Add `inbox/` and `inbox/clips/` to `scripts/rot-scan.py`'s scope (still not shipped as of 2026-09-25, tracked jointly with doc 2493's identical open action) | zj (vault lane) | PR to zao-vault | 2026-10-02 |
| ~~Extend ZOE's photo/document handler to commit a copy into the vault~~ SHIPPED 2026-09-17, PR #3541, `bot/src/zoe/inbound-media.ts` | - | - | done |
| Confirm the bot process was restarted after PR #3541 merged, and that at least one real inbound photo/document has produced a matching `inbox: inbound media (...)` commit in `~/zao-vault`; shipped = `git log --all --grep="inbound media"` in the vault returns a real commit | @Zaal | Manual check | 2026-10-02 |
| Add the same secret/PII screen `inbound-media.ts` runs for the Telegram leg to the Mac manual-drop leg (a pre-commit hook or a lane-run check on anything landing in `inbox/<dated-name>/` before it is git-added), since that leg still has none | zj (vault lane) | PR to zao-vault | 2026-10-09 |
| Do not install a launchd watcher for `inbox/drops` or `~/Drop` | @Zaal | Decision | wontfix |

## Also See

- [Doc 2493](../2493-obsidian-vault-agent-fleet-2026-09/) - the vault-side half of this question; shares the still-open `rot-scan.py` inbox-scope action with this doc.
- [Doc 2460](../) - Obsidian plugin baseline this estate already settled.

## Sources

- [Claude Code - Common workflows, "Work with images" / "Reference files and directories"](https://code.claude.com/docs/en/common-workflows) - `[FULL - METHOD: curl + HTML strip, re-fetched 2026-09-25; page JSON payload read directly, "Ctrl+V"/"Alt+V" wording confirmed verbatim]`
- [Claude Code - CLI reference, `--add-dir`](https://code.claude.com/docs/en/cli-reference) - `[FULL - METHOD: curl + HTML strip, re-fetched 2026-09-25, unchanged]`
- `orca --help`, `orca terminal --help` - `[FULL - METHOD: run locally 2026-09-25, unchanged conclusion]`
- `~/.claude/image-cache/<session-id>/` - `[FULL - METHOD: measured locally 2026-09-25, this session's own scratchpad, unchanged]`
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/index.ts` (handler now at lines 2421-2500) - `[FULL - METHOD: local read, 2026-09-25]`
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/inbound-media.ts` (new file, 359 lines) - `[FULL - METHOD: local read, 2026-09-25]`
- `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/zoe/pii.ts` (`containsPii` export, now imported by both the outbound and inbound paths) - `[FULL - METHOD: local read, 2026-09-25]`
- `git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" log --follow -- bot/src/zoe/inbound-media.ts` (first commit `5073311`, 2026-09-17, PR #3541) - `[FULL - METHOD: local git log]`
- `git -C ~/zao-vault log --all --grep="inbound media"`, `git ls-tree -r origin/main --name-only | grep '^inbox/-/'` - both empty - `[FULL - METHOD: local git log/ls-tree, 2026-09-25; establishes "shipped, use UNKNOWN" not "shipped and used"]`
- `~/zao-vault/inbox/README.md` (current text, "This is the ONLY capture door") - `[FULL - METHOD: local read, 2026-09-25]`
- `~/zao-vault/scripts/rot-scan.py` (`FOLDERS`/`CLAIM_FOLDERS` lines) - `[FULL - METHOD: local read/grep, 2026-09-25, unchanged from original]`
- `~/zaal-dotfiles/bin/lane-send` - `[FULL - METHOD: local read, 2026-09-25; file grew a menu-Enter guard since 2026-09-16, noted]`
- `~/Drop`, `~/zao-vault/inbox/drops/`, `~/zao-vault/inbox/2026-09-16-michael-anderson/` - `[FULL - METHOD: ls/find/md5 measured locally, 2026-09-25]`
- [Doc 2493 - Obsidian as the single home for a solo founder plus an agent fleet](../2493-obsidian-vault-agent-fleet-2026-09/README.md) - `[FULL - METHOD: local read, re-checked 2026-09-25 for the shared rot-scan.py action]`
- [convenientlymike/fleet](https://github.com/convenientlymike/fleet) - `[FULL - METHOD: gh api repos/convenientlymike/fleet, escalated 2026-09-25 from the original WebSearch-only PARTIAL: 1 star, not archived, pushed 2026-09-12T13:49:40Z; LICENSE file read directly (not the API classifier field, per Hard Requirement 13) confirms MIT]`
- [OpenMOSS/claude-codex-handoff](https://github.com/OpenMOSS/claude-codex-handoff) - `[FULL - METHOD: gh api repos/OpenMOSS/claude-codex-handoff, escalated 2026-09-25: 40 stars, not archived, pushed 2026-07-04T03:47:47Z; LICENSE file read directly confirms MIT]`

**Unverified / flagged:** whether the bot process on the VPS was restarted
after PR #3541 merged, and whether any real Telegram photo/document has ever
produced an `inbox: inbound media (...)` commit, is UNKNOWN from this
machine - the vault's own git history has no such commit as of 2026-09-25.
Whether Syncthing or Hazel is installed anywhere in this estate was checked
only on this Mac (neither found this pass either); not checked on the VPS or
Pi.
