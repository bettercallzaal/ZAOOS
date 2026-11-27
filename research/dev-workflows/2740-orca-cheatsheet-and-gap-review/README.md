---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-11-21
superseded-by:
related-docs: "dev-workflows/2725-orca-fundamentals-tutorials, dev-workflows/2677-orca-best-practices-and-upgrades, dev-workflows/2581-orca-how-others-use-it, dev-workflows/2735-context-windows-and-compaction-for-lanes, agents/2704-lane-idle-sleep-and-wake"
original-query: "review orca /zao-research it, then review notion and make an orca cheatsheat or tips and tricks page and then review it with our current impleimenation of orca and tell me top fixes and how you would do them and stage them as prs (Zaal, orchestrator2 pane, 21 Nov 2026). Additions the same hour: build on the existing Notion pages and the vault Claude Code map; cover the mobile-scope pairing, one-way mail, nested lanes, Mac-path hooks on the desktop, the everything-claude-code hooks.json warning and idle compaction; one fix per PR, never merge."
tier: STANDARD
---

# 2740 - Orca on 21 Nov 2026: what changed since 1.4.242, a cheatsheet, and the top fixes for our setup

> **Goal:** Bring the Orca picture forward from [doc 2725](../2725-orca-fundamentals-tutorials/) (Orca 1.4.242, 31 Oct) to what runs on the Mac on 21 Nov (1.4.262, with 1.4.268 published), and rank the fixes our own setup needs, each with how to do it and how to undo it.

Asked for at DEEP. **This is STANDARD, and it says so:** the release notes and the local CLI were read in full for the parts cited, but no Reddit or Hacker News thread was fetched this run, and the upstream issues below were read as titles only. Orca is by Stably AI, MIT licence (LICENSE file read 21 Nov: "MIT License, Copyright (c) 2026 Lovecast Inc."), [github.com/stablyai/orca](https://github.com/stablyai/orca). The cheatsheet for Zaal is a Notion page, "Orca: cheatsheet and tips (Nov 21)", under The ZAO Documents; this doc is the copy of record for the findings.

## Key Decisions

| # | Decision | Evidence |
|---|---|---|
| 1 | **RE-PAIR the desktop with a browser-access link (Zaal, at the desktop).** The Mac is paired in mobile scope, so it can list and read desktop terminals and nothing else. | `orca worktree list --environment desktop` on 21 Nov returned "Method 'worktree.list' is not available to mobile clients". A Decisions row for the re-pair already exists. The link is a credential: it never goes in Notion, a doc, a PR or an agent's prompt. |
| 2 | **USE `--no-parent` on every lane worktree, not only briefed ones.** | `bin/zorca-lane-open:866` (zaal-dotfiles main) passes `--no-parent` only when `--briefed` is set. The plain `--worktree` path lets Orca parent the new row under the caller. On 21 Nov `orca worktree list --json` showed 3 numbered or named lanes, "(6) crm", "(1) finance" and "mercor", nested under "(0) orchestrator". Staged as a zaal-dotfiles PR. |
| 3 | **SET `"autoCompactWindow": 300000` in the tracked user settings.** This is decision 2 of [doc 2735](../2735-context-windows-and-compaction-for-lanes/), never opened as a PR. | `git show origin/main:claude/settings.json` in zaal-dotfiles has no `autoCompactWindow` key (grep count 0); the Claude Code docs give the key by name: "set `autoCompactWindow` in a settings file, such as `\"autoCompactWindow\": 200000`" (model-config.md, fetched raw 21 Nov). A lane woken from idle with no window set can run toward the roughly 967K default before it compacts. Staged as a PR for Zaal's merge. |
| 4 | **UNINSTALL the everything-claude-code plugin, then remove its leftovers (Zaal's yes first).** | It is installed at 1.10.0 and disabled. Its `hooks/hooks.json` carries `id` and `description` on all 26 hook groups (52 keys counted; Zaal sees the warning as 50 entries, the 2-entry difference is not explained). Tracked settings still hold 218 lines naming it, 208 of them `skillOverrides` set to off. A disabled plugin that still warns at every start is noise with no function. Not staged as a PR: removing the overrides before the plugin is gone would turn 208 skills back on if it were ever re-enabled. |
| 5 | **UPDATE Orca 1.4.262 to 1.4.268 (Zaal's yes first; it is an install).** | 1.4.263 to 1.4.268 carry worker and mail fixes that bear on our one-way mail: "a worker's final report wakes the agent that started it" (1.4.268). Upstream issue #43618, open, reports `worker_done` from a worker on a connected server "rejected as unknown dispatch (1.4.261)". Read the 1.4.263 known issue first: "Sleep workspace instead" can fail when another tab in the workspace runs a process. |
| 6 | **KEEP the vault inboxes as the cross-machine channel until decision 1 is done; do not build a second workaround.** | The local inbox on 21 Nov held 20 messages, every one between Mac terminals. Desktop-to-Mac mail is refused under the mobile-scope pairing (Zaal's report; not reproducible from the Mac side without sending). |
| 7 | **SKIP Orca Bots, plugins that run code, Workspace Cleanup rules and automatic updates for now.** | Bots are Beta (1.4.265) and connect Slack and Gmail, which is outbound. Code plugins "run with full access to your computer" (1.4.245 notes). Cleanup "may delete matching workspaces within seconds of confirmation" and deleted chats "cannot be recovered" (1.4.259, 1.4.262); deletion is Zaal's. `orca workspace cleanup preview` on 21 Nov: "No cleanup rule is on for any project here". |
| 8 | **Doc 2677 decision 6 is out of date: Orca can now switch Claude accounts.** | `orca --help` at 1.4.262 lists `orca account select --agent claude --account <id|email|system>`; 1.4.262 notes: "busy Claude terminal sessions resume on the selected account". A switch restarts panes, so it stays Zaal's call. |

## What changed since doc 2725 (31 Oct to 21 Nov)

| Measure | 2725, 31 Oct | 21 Nov | Source |
|---|---|---|---|
| Installed | 1.4.242 | 1.4.262 (published 17 Nov) | `orca --version` |
| Newest release | 1.4.245 | 1.4.268 (21 Nov 03:50 UTC); 22 desktop releases since 1.4.245 | `gh api repos/stablyai/orca/releases` |
| Repo | 111,707 stars, 7,060 forks | 131,688 stars, 8,380 forks, 9,004 open issues | `gh api repos/stablyai/orca` |
| Workspaces listed | 173 | 81 (48 completed, 26 in-progress, 4 in-review, 3 todo) | `orca worktree list --json --limit 1000` |
| Rows with a comment | 105 | 20 | same |
| Rows with a parent | not counted | 6 | same |
| Automations | 2, both enabled | 3, all disabled | `orca automations list --json` |
| Saved remote runtimes | 0 | 1, "desktop", mobile scope | `orca environment list`, and the refusal quoted in decision 1 |
| Plugins | none | 2 official theme packs, data only | `orca plugin list` |

The drop from 173 to 81 workspaces was not traced; hidden projects and archived rows are two candidate causes and neither was checked.

## Findings: what is new and worth knowing

| Area | What shipped (version) | Use for us |
|---|---|---|
| Orchestration | "Orchestrator V3": coordinators end their turn and wake when workers report (1.4.246). Workers can start workers, default depth 4 (1.4.251). Worker notifications are filtered out during a run (1.4.246). | Our lanes coordinate by vault and relay. V3 is the first version worth a trial, on one bounded job, after the re-pair. |
| Mail | Mail waits for a draft you are typing (1.4.251). Final report wakes the starter (1.4.268). | Explains mail that seems late: it is held while a draft sits in the composer. |
| Remote | Workspaces can nest under parents on other machines (1.4.252). Pairing codes are single use and expire: QR 10 minutes, link 60 minutes (1.4.252, 1.4.254). `orca serve` refuses public addresses by default (1.4.254). | A leaked old pairing link is dead once used, but a live access link is still a credential. |
| Accounts | Name saved Claude accounts, see their plan, switch from phone or CLI (1.4.258, 1.4.262). | Replaces the manual login switch. Restarts panes. |
| Chat or CLI | Chat UI left Experimental; each agent opens as Chat or CLI (1.4.246). `/btw` side question and `/fork` (1.4.254). Rewind, plan mode (1.4.252). | Our lanes are CLI terminals and the tools read terminal screens. Chat tabs are invisible to `orca terminal read`, so lanes stay CLI. |
| Sidebar | Hide a project while its agents keep running (1.4.259). Mute a workspace's notifications (1.4.262). Sleeping workspaces stay asleep after relaunch (1.4.262). Experimental workspace cards (1.4.261). | Hide, do not remove, the repo roots that clutter the board. |
| Cleanup | Workspace Cleanup rules, off by default (1.4.259); can also delete chats of deleted workspaces (1.4.262). | Preview only. Rules stay off. |
| Terminals | Running terminal limit per computer (1.4.245). Paste into a starting terminal waits for the shell, up to 64 KB (1.4.257). Panes remember their folder across restarts (1.4.262). | The paste fix removes one cause of dropped first prompts. |
| Browser | Chrome extensions, password vault, Memory Saver frees pages after 4 hours (1.4.243, 1.4.250, 1.4.261). Unresolved chat workspace refuses untargeted browser commands (1.4.264). | Pass `--worktree` or `--page` on browser commands run from scripts. |
| Setup | `orca.yaml` approvals count as trust for later versions of a repo's setup steps (1.4.262). Folder workspaces run setup scripts (1.4.257). | The `orca.yaml` action open since doc 2581 is still open; no `orca.yaml` on ZAOOS main. |
| Updates | Optional update delay of 1 to 30 days (1.4.248); automatic updates, off by default (1.4.265). | Keep manual. A 3-day delay is a reasonable later setting. |

## Our setup against it: the six known problems

| Problem | What was measured on the Mac, 21 Nov | Fix | Owner |
|---|---|---|---|
| Mobile-scope pairing | Desktop worktree list refused with the message in decision 1; desktop terminal list works. | Browser-access link made at the desktop, Mac reconnected. | Zaal, at the desktop |
| One-way mail | 20 inbox messages, all Mac to Mac. | Follows from the re-pair. Until then the vault inbox files carry cross-machine orders. | none until the re-pair |
| Nested lanes | 5 rows under "(0) orchestrator": griller and merger (helpers, intended) and crm, finance, mercor (lanes, not intended). | Tool: decision 2. Existing rows: `orca worktree set --worktree <row> --no-parent`, one row at a time, reversible with `--parent-worktree`. | PR staged; un-nesting is a Decisions row |
| Mac-path hooks on the desktop | Tracked `claude/settings.json` on zaal-dotfiles main holds 0 absolute Mac home paths and 38 `$HOME` references. So the paths are not in the tracked settings file. The desktop's own live file could not be read from the Mac. | UNKNOWN from this side. The desktop dotfiles cutover row already covers it; the check belongs to the desktop lane: count absolute Mac paths in the file the desktop panes load. | desktop lane |
| Plugin hooks.json warning | Decision 4. | Uninstall, then a settings PR. | Zaal's yes |
| Idle compaction | No fleet window is set (decision 3). `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=90` is set and, per doc 2735, is not the control. | Decision 3. | PR staged |

## Contradictions and limits

- Zaal counts 50 entries in the plugin warning; the file holds 26 groups and 52 flagged keys. Not reconciled.
- "Desktop-to-Mac mail is refused" is Zaal's report. It was not reproduced, because reproducing it means sending mail from the desktop.
- Release notes are the vendor's own account. Nothing in the findings table was tested on this Mac unless a row says measured.
- The tracked settings file is not the file the Mac panes load (the vault's Claude Code map, 21 Nov, found the panes read an untracked profile copy). A merged settings PR changes nothing live until that drift is resolved.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Re-pair the desktop with a browser-access link (shipped = `orca worktree list --environment desktop` returns rows) | Zaal | His step, existing Decisions row | his next desktop sitting |
| Merge or reject the `zorca-lane-open` no-parent PR | Zaal | PR | 2026-11-24 |
| Merge or reject the `autoCompactWindow` settings PR | Zaal | PR, settings | 2026-11-24 |
| Answer: un-nest crm, finance and mercor from the orchestrator row | Zaal | Decisions row | 2026-11-24 |
| Answer: uninstall everything-claude-code, then the leftovers PR | Zaal | Decisions row | 2026-11-24 |
| Answer: update Orca to 1.4.268 | Zaal | Decisions row | 2026-11-24 |
| Desktop lane counts absolute Mac paths in the settings file the desktop panes load | desktop coordinator | Measurement | after the cutover row is answered |
| Re-validate this doc after the Orca update | orchestrator | Re-research | 2026-12-21 |

## Also See

- [Doc 2725](../2725-orca-fundamentals-tutorials/) - the seven tutorials this extends
- [Doc 2677](../2677-orca-best-practices-and-upgrades/) - the October upgrade list; its decision 6 is superseded by decision 8 here
- [Doc 2735](../2735-context-windows-and-compaction-for-lanes/) - why 300k
- [Doc 2704](../../agents/2704-lane-idle-sleep-and-wake/) - lane sleep and wake

## Sources

Primary, this Mac, 21 Nov 2026, Orca 1.4.262, read-only:

- `orca --help` (full), `orca skills list`, `orca status`, `orca host list`, `orca environment list`, `orca worktree list --json`, `orca worktree ps --json`, `orca terminal list --json`, `orca automations list --json`, `orca plugin list`, `orca search --index-status`, `orca workspace cleanup preview`, `orca orchestration inbox --json`, `orca skills update --all --dry-run` **[FULL - read-only, output redacted before display]**
- zaal-dotfiles `origin/main`: `bin/zorca-lane-open` (header, argument parser and the create call), `bin/zorca-lane-open-test` (the parent assertions), `claude/settings.json` (key counts) **[PARTIAL - the cited parts]**
- The plugin's `hooks/hooks.json`, counted by script **[FULL for the count]**

Upstream:

- [Orca releases v1.4.243 to v1.4.268](https://github.com/stablyai/orca/releases), 25 desktop releases, via `gh api` **[PARTIAL - the summary, highlights, compatibility and known-issue sections of each were read in full; the itemised change lists were not]**
- [stablyai/orca](https://github.com/stablyai/orca) repo counts via `gh api` **[FULL]**; LICENSE file **[FULL]**
- Upstream issues [#43618](https://github.com/stablyai/orca/issues/43618), [#42236](https://github.com/stablyai/orca/issues/42236), [#42534](https://github.com/stablyai/orca/issues/42534), [#26066](https://github.com/stablyai/orca/issues/26066), found by `gh api search/issues` **[PARTIAL - titles, state and dates only; bodies and comments not read]**
- [Claude Code docs, model configuration](https://code.claude.com/docs/en/model-config.md), fetched raw with curl **[PARTIAL - the auto-compact section]**

ZAO records read: the Notion pages "Claude Code on the Mac: how it works (Nov 21)", "Orca sidebar review, 20 Nov" and "Orca cleanup list, 20 Nov", the Decisions for zaal table (searched, not read row by row), and the vault's Claude Code map note of 21 Nov **[FULL for the three pages and the note]**.

Not done: Reddit, Hacker News and X were not searched this run, which is why the tier is STANDARD. The Orca docs site was not re-fetched; doc 2677 read it on 14 Oct.
