---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-16
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

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **SKIP the launchd watcher. It is not even built yet.** No plist anywhere on this Mac references `inbox/drops` or `~/Drop` (measured: only `com.zao.zaostock-file-watch.plist` and Steam's cleanup agent match "watch"/"drop" in `~/Library/LaunchAgents`). The "with a launchd watcher that messages the seat" framing describes a plan, not a running mechanism. |
| 2 | **Don't keep two capture doors.** `~/zao-vault/inbox/` already exists, is endorsed by doc 2493 (Decision 4, today), and already receives phone photos via Working Copy + an iPhone Shortcut. `~/Drop` (a symlink to `inbox/drops`, created today 18:11, same session that proposed it) duplicates it. One real test item already sits there - `inbox/drops/2026-09-16-michael-anderson/` (`IMG_4987.png` 5.05MB, `DSC_0567-2.jpeg` 3.93MB) - fold it into `inbox/` and retire the second door. |
| 3 | **USE explicit "tell the lane" over "watch and push."** Claude Code lanes are pull-when-told: `bin/lane-send` already types a literal message into a live Orca/tmux pane with guards against a bare-Enter shell-injection hole. ZOE's own live Telegram-photo handler proves the same pattern end to end - it does not wait to be asked, it downloads then hands the path in the same turn (`index.ts:2192`: `"[Zaal sent an image, saved at ${savedPath}. Use the Read tool to view it...]"`). A watcher is a second, unproven way to do what one already-working script does. |
| 4 | **Do not commit raw phone photos as git blobs.** `inbox/drops/.../*.png` is NOT gitignored (checked with `git check-ignore -v`, no match) while `images/` is - and `images/` is 5.2G of the vault's 5.7G, 91.2% (matches doc 2493's 91% figure exactly). Whatever inbox convention wins, large binaries must land in the gitignored `images/` (or stay un-added) after triage, never get committed from the capture door itself. |
| 5 | **The Telegram/ZOE path is real today but VPS-local, not fleet-visible.** `bot/src/zoe/index.ts:2167` (`bot.on(['message:photo','message:document'])`, Zaal-DM-only via `isFromZaal`) already downloads to `${ZOE_PATHS.home}/inbox` and tells ZOE the exact path. But `ZOE_PATHS.home` is on the VPS the bot runs on (per the `coworkvps` skill), and the vault's `images/` is gitignored - so a photo ZOE receives never automatically reaches a Mac Orca lane. This is the one real gap worth building. |

## Findings

### What Claude Code itself supports (fetched, FULL)

`code.claude.com/docs/en/common-workflows`, "Work with images" and "Reference
files and directories" sections (fetched in full 2026-09-16):
- **Drag-and-drop** a file into the Claude Code window inserts it.
- **Paste an image** with `Ctrl+V` (`Cmd+V` is the Mac equivalent; Windows/WSL
  use `Alt+V`).
- **Give a path directly**: "Provide an image path to Claude. E.g., 'Analyze
  this image: /path/to/your/image.png'" - the doc names this as a first-class
  method, not a fallback.
- **`@file` mentions** include a file's full content inline; `@dir` shows a
  listing, not contents; `@server:resource` reaches MCP resources.
- **`--add-dir`** (`code.claude.com/docs/en/cli-reference`, fetched in full):
  "Add additional working directories for Claude to read and edit files,"
  validated to exist, not persisted across sessions unless set in
  `permissions.additionalDirectories`.

**Measured on this Mac**: a `Cmd+V` paste lands at
`~/.claude/image-cache/<session-id>/<N>.png` - confirmed from this very
session's own scratchpad directory name (`5a21f459-...`), which holds
`21.png` through `27.png`, `rw-------`, 55KB-724KB. **The path is per-session
and per-sequence, not stable or reusable by another session** - a second lane
has no way to guess it and the directory does not survive past that
conversation's cache. This rules out image-cache as a fleet handoff surface;
it is fine for "I am the same session that pasted it," nothing more.

**Orca specifically is UNMEASURED for drag-and-drop.** `orca --help` and
`orca terminal --help` (both run locally, FULL) show `orca terminal send
--text` is text-only; the CLI's only `--files <path,...>` flag belongs to the
browser-automation commands (upload into a web page via drag/click), not to
`terminal send`. No `orca` doc or `--help` output describes what happens if a
file is dropped onto an Orca terminal pane specifically - not found in
`orca --help`, `orca agent-context`, or `~/.orca`.

### What this vault already built for exactly this problem (doc 2493, read FULL, dated today)

`research/dev-workflows/2493-obsidian-vault-agent-fleet-2026-09/README.md`
already answers most of this question for the *vault* half:
- `inbox/README.md`: "iPhone Shortcut commits photos/notes here via Working
  Copy. A lane... transcribes, routes..., sets `routed:` frontmatter, and
  moves the item out. Nothing lives here long." - this is the phone path,
  already live, and doc 2493's Decision 4 says keep it as-is.
- Doc 2493's own gap (Finding 3): `scripts/rot-scan.py`'s two scopes
  (`FOLDERS = ("people","projects")`, `CLAIM_FOLDERS` adds `notes`,
  `handoffs`, `decisions`) do not include `inbox/` - the one folder three bots
  and 12+ lanes actually drop raw captures into has no review clock. That gap
  applies equally to whatever inbox convention this doc recommends.
- Doc 2493 surveyed three currently-maintained agent-vault projects
  (`ibrahimkobeissy/ai-second-brain-template`, `ssheld/agent-vault`,
  `tuan3w/obsidian-vault-agent`, all fetched FULL by that doc) - all three
  converge on plain markdown/files in a known folder plus a human/agent
  review step, none use a filesystem watcher to push notifications.

### What ZOE already runs live for Telegram files (read FULL, local code)

`bot/src/zoe/index.ts:2166-2216` is a working, shipped implementation of the
"tell, don't make them hunt" pattern for the *phone-to-agent* leg:

```
bot.on(['message:photo', 'message:document'], async (ctx) => {
  if (ctx.chat.type !== 'private' || !isFromZaal(ctx)) return;
  ...
  savedPath = await downloadTelegramFile(token, fileId, join(ZOE_PATHS.home, 'inbox'), preferName);
  ...
  const turnText = `...[Zaal sent an image, saved at ${savedPath}. Use the Read tool to view it, then respond...]`;
```

This is the cleanest existing proof of the whole pattern the topic asks for:
download once, then hand the exact path in the same message, gated to Zaal's
own DM. Its limits, both measured, not assumed: (a) it writes to
`ZOE_PATHS.home` on the VPS, not the git-synced vault, so a Mac lane cannot
see it without a further hop; (b) `bot/src/zoe/pii.ts` scans only
*outward*-writing paths (Bonfire, recap, committed artifacts) - the inbound
photo/document handler runs no secret or PII screen at all, which matters for
the estate's "secrets never through this path" rule.

### `lane-send` is the existing "tell the lane" mechanism for the Mac fleet

`~/zaal-dotfiles/bin/lane-send` (read FULL) types a literal message into a
live Orca or tmux Claude Code pane, with a documented safety history: 218
measured `tmux send-keys ... Enter` calls in one log, 161 of them a bare
`Enter` that bypasses every guard this script has, including submitting text
the human deliberately left unsent. This is the tool that closes the "the
seat must be told the path" requirement for a *fleet*, not a single session -
it already exists and needs no new build.

### Alternatives, one line each

| # | Option | Verdict for this estate |
|---|---|---|
| 1 | Watched drop folder (Folder Actions / launchd WatchPaths / Hazel) | SKIP the watcher. Not installed, not needed - `lane-send` already delivers a told path without a daemon, a pre-existing-directory gotcha, or ThrottleInterval tuning (all three bit the sibling `com.zao.zaostock-file-watch.plist` build, read FULL locally). KEEP a folder, but the existing `inbox/`, not a new one. |
| 2 | Shortcuts Share Sheet -> dated vault folder -> lane-send/Telegram | USE this. Half of it (Working Copy + iPhone Shortcut -> `inbox/`) is already live per doc 2493. The only new piece is the habit of following it with an explicit `lane-send <lane> "check inbox/<dated-folder>/"`. |
| 3 | iCloud Drive / Syncthing shared Mac+phone folder | SKIP as primary. The vault's own git already plays this role Mac<->VPS<->Pi (doc 2493); Syncthing is not installed here (not found in any launchd/brew search this session) and a second live-sync layer duplicates git's job with different conflict semantics. |
| 4 | Telegram as the inbox (ZOE) | USE for the phone-first "artist texted him" case - ALREADY LIVE (`index.ts:2167`). Gap: lands on the VPS, not the vault. Closing that gap is this doc's one real build (Next Actions #4). |
| 5 | Local HTTP upload page / MCP filesystem server | SKIP. A `file://` page cannot write to disk - the artifact-authoring rules governing this very session confirm a local page needs a server to persist anything, so the "smallest server" is a new daemon, strictly more moving parts than #2 for no new capability. No filesystem MCP server is configured in this session's MCP list (checked against the configured/failed server list) - would still need the same "where do I look" convention as #2. |
| 6 | What other agent-fleet repos do | Doc 2493's three FULL-fetched examples converge on files-in-a-known-folder plus a review step, not a watcher-push model; `convenientlymike/fleet` and `OpenMOSS/claude-codex-handoff` (found via WebSearch this session, title/URL only - **PARTIAL, not fetched, not escalated because they are corroborating signal only, not load-bearing for any number or quote in this doc**) describe msg/inbox mailbox files between agents, the same shape. |

## Recommendation (three lines)

1. **Mac / fleet path:** save or move the file into `~/zao-vault/inbox/<dated-name>/` (Finder "Move to," a Shortcuts action, or a lane's own write) - not `~/Drop`/`inbox/drops`, which duplicates it - then run `lane-send <lane> "file at inbox/<dated-name>/<filename> - read it"`; the lane gets the exact path in its own turn, the same shape ZOE already uses.
2. **Phone path:** keep the existing Working Copy + iPhone Shortcut Share-Sheet action into `inbox/` for anything meant for the vault/fleet (already built, doc 2493 Decision 4); for anything meant for ZOE specifically, the Telegram DM to ZOE (`index.ts:2167`) already works today with no changes.
3. **Build nothing new for the Mac.** The only real gap is VPS-to-vault: teach ZOE's existing photo/document handler to also commit a copy into `~/zao-vault/inbox/` (with the `images/`-not-git pattern respected) when a file should reach the fleet, not just ZOE.

## Constraints checked against

- **Never delete:** `inbox/README.md`'s "a lane... moves the item out" is a
  move within the vault's own git history, not a deletion; large binaries stay
  un-committed until triaged into the gitignored `images/`, never removed
  outright.
- **Secrets never through this path:** the vault's `.gitignore` already blocks
  `.env`, `*.pem`, `*.key`, `.zao/`; ZOE's inbound media handler has **no**
  equivalent screen (`pii.ts` covers outbound only) - flagged, not fixed here.
- **`images/` is gitignored and 91% of vault size:** confirmed exactly -
  5.2G of 5.7G measured today.
- **Told, not hunted:** every recommended path ends in an explicit path in a
  message (`lane-send` or ZOE's `turnText`), never a location the receiving
  session has to search `~/Downloads` for.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Move `inbox/drops/2026-09-16-michael-anderson/*` into `inbox/`, delete the `inbox/drops` subfolder and repoint or remove the `~/Drop` symlink so there is one capture door | @Zaal | PR to zao-vault | 2026-09-18 |
| Do not install a launchd watcher for `inbox/drops` or `~/Drop` | @Zaal | Decision | wontfix |
| Add one line to `inbox/README.md`: after a file lands, run `lane-send <lane> "<path>"` (or DM the relevant lane) so the receiving session is told, not left to notice | @Zaal | PR to zao-vault | 2026-09-19 |
| Extend ZOE's photo/document handler (`index.ts:2167`) to also git-commit a copy into `~/zao-vault/inbox/` (respecting the `images/`-gitignore pattern) when a file should reach the Mac fleet | @Zaal | PR to bot repo | 2026-09-25 |
| Add `inbox/` and `inbox/clips/` to `scripts/rot-scan.py`'s scopes so dropped files get a review clock (already decided in doc 2493, not yet shipped as of 2026-09-16) | @Zaal | PR to zao-vault | 2026-09-20 |

## Also See

- [Doc 2493](../2493-obsidian-vault-agent-fleet-2026-09/) - the vault-side half of this question, already answered; this doc adds the Claude-Code/Orca-fleet half and the ZOE Telegram mechanism.
- [Doc 2460](../) - Obsidian plugin baseline this estate already settled.

## Sources

- [Claude Code - Common workflows, "Work with images" / "Reference files and directories"](https://code.claude.com/docs/en/common-workflows) - FULL, fetched 2026-09-16.
- [Claude Code - CLI reference, `--add-dir`](https://code.claude.com/docs/en/cli-reference) - FULL, fetched 2026-09-16.
- `orca --help`, `orca terminal --help`, `orca agent-context` - FULL, run locally 2026-09-16.
- `~/.claude/image-cache/<session-id>/` directory listing - FULL, measured locally 2026-09-16.
- `bot/src/zoe/index.ts` (photo/document handler, lines 2166-2216) - FULL, read locally 2026-09-16.
- `bot/src/zoe/pii.ts` - FULL, read locally 2026-09-16.
- `~/zaal-dotfiles/bin/lane-send` - FULL, read locally 2026-09-16.
- [Doc 2493 - Obsidian as the single home for a solo founder plus an agent fleet](../2493-obsidian-vault-agent-fleet-2026-09/README.md) - FULL, read locally 2026-09-16 (dated same day; carries its own FULL-fetched sources on `ai-second-brain-template`, `agent-vault`, `obsidian-vault-agent`, and the mobile-git article).
- [convenientlymike/fleet](https://github.com/convenientlymike/fleet) - PARTIAL (WebSearch title/URL only, not fetched; corroborating signal, not load-bearing).
- [OpenMOSS/claude-codex-handoff](https://github.com/OpenMOSS/claude-codex-handoff) - PARTIAL (WebSearch title/URL only, not fetched; corroborating signal, not load-bearing).

**Unverified / flagged:** the topic's premise that a launchd watcher already
exists for `~/Drop` was not found anywhere on this Mac - treated as a plan,
not a fact, per Key Decision 1. Whether Syncthing or Hazel is installed
anywhere in this estate was checked only on this Mac (neither found); not
checked on the VPS or Pi.
