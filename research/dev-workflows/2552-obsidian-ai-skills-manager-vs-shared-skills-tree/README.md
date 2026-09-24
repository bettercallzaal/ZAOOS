---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2514, 2475, 2550"
original-query: "/zao-research on https://www.reddit.com/r/claudeskills/s/4qeA3h8MI8 (relayed by the dotfiles seat for Zaal, 2026-09-24)"
tier: STANDARD
---

# 2552 - AI Skills Manager (Obsidian plugin) Against a Shared, Symlinked Skills Tree

> **Goal:** Decide whether the Obsidian plugin in the r/claudeskills post "I made an Obsidian plugin to organize Claude Code skills and other AI tools" belongs in this estate. Hold its claims against what the estate has measured about skills, not against how the post reads.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DO NOT install AI Skills Manager on this Mac, now or after 3 October, in its current form.** | Its enable/disable is a `renameSync` into a sibling `.skillmanager-disabled` folder, and its delete is `rmSync(path, { recursive: true, force: true })` (`src/itemToggle.ts`). Here `~/.claude/skills` is a symlink to `~/zaal-dotfiles/claude/skills`, the git working tree every lane on this Mac reads. So one click would move or recursively delete a tracked skill underneath every running session. The move leaves an untracked folder git cannot restore from, which is the failure mode of `.claude/rules/vanishing-dependencies.md`. |
| 2 | **It would also toggle the global rules file.** | Its README says Claude Code's `CLAUDE.md` is "scanned and toggled as one item". `~/.claude/CLAUDE.md` is a symlink to `~/zaal-dotfiles/claude/CLAUDE.md`, the file every session loads. Disabling it would move the estate's global rules out from under every lane. |
| 3 | **The problem it targets is real here, and already measured.** | Doc `dev-workflows/2514-skills-surface-routing-audit`: the router sees **428** skills, **365** have never been invoked, and **63** distinct skills were used across 11,293 transcripts. `everything-claude-code` supplies **183** of the 428, with **3** ever invoked. The "graveyard of folders" the post describes exists on this machine. |
| 4 | **The part worth having is read-only, and the estate already owns an instrument for it.** | The plugin's usage tab reads every transcript under `~/.claude/projects` to count invocations. Doc 2514 measured the same thing with this estate's own tooling. It already has an open follow-up on 2514's own Next Actions (re-scope `zao-skill-audit` to every source Orca reports, due 2026-09-26). Extending that costs less than adopting a five-day-old plugin. |
| 5 | **Defer everything past 3 October.** | Brandon Ducar to Zaal, 2026-09-24, verbatim: "No need to add another framework just for the sake of it, especially with your event coming up." Nothing here is actively bleeding: the 365 idle skills cost about 70 tokens each while idle (doc 2514). This doc is research now; any build waits. |

## What the thread actually says

Post: `1wogx5i` by u/notenerd, r/claudeskills, score 1. It is a tool announcement, not a claim about whether skills work. The plugin, "AI Skills Manager":
- scans the folders each tool uses (15 tools, plus `~/.agents/skills`)
- lets you browse, tag, favorite, enable/disable and symlink skills "without moving them entirely or making a duplicate copy"
- stores metadata as notes in the vault

All **20** retrieved comments were read. The post reports 0; the 20 come from Arctic Shift's archive. Most are thanks and "saving this". The substantive ones:

| Comment | Substance |
|---|---|
| u/mega_pr0xy | "Its cool but risky?" with a screenshot of Obsidian's risk label |
| u/notenerd (author), reply | The label "describes capabilities the plugin uses, not a finding it is malicious"; it "needs filesystem access, symlink support, and GitHub integration" |
| u/suppervisoka | Cites "Karpathy's wiki" having "issues around 500 notes". **UNVERIFIED** - no source given, not chased |
| u/college_hustle | Clips threads with the Obsidian web clipper and has "a skill to organize my clippings inbox" |

The thread's most useful line is the author's own. The plugin needs write access outside the vault, and that is exactly what makes it unsafe here, where "outside the vault" is a git tree shared by every session.

## The post's first claim, read against the code

The post says items are organized "without moving them entirely". The README says the opposite for enable/disable: toggling "physically moves it into (or out of) a sibling disabled folder". The source agrees with the README:

| Operation | Code (`src/itemToggle.ts`, repo HEAD 2026-09-24) | Effect on this estate |
|---|---|---|
| Disable | `mkdirSync(join(parentDir, ".skillmanager-disabled"))` then `renameSync(unit.path, target)` | Moves `~/zaal-dotfiles/claude/skills/<name>` into an untracked folder in the shared tree; git sees a deletion |
| Enable | the reverse move | Restores it, provided the untracked folder survived |
| Delete (non-plugin item) | `rmSync(unit.path, { recursive: true, force: true })` | Recursive delete of a tracked skill in the shared tree |
| Symlinked item | `unlinkSync` then `symlinkSync` with an absolute target | Rewrites a relative link as an absolute one - a diff in a tracked file |

The plugin is careful about the case it anticipated. It refuses to delete items that belong to a plugin, and it rewrites relative symlinks so they do not dangle. What it does not anticipate is a skills directory that is itself a symlink into a git repository shared by many live sessions. The author's comment says as much: "I'd especially appreciate feedback from people using tool setups I can't easily test myself".

## Held against the estate's measurements on skills

The seat asked where skills work here and where they do not. From the estate's own records:

| Question | Measured | Source |
|---|---|---|
| Do installed skills get used? | 63 of 428 ever invoked; 183 from one plugin with 3 invoked | doc `dev-workflows/2514-skills-surface-routing-audit` |
| Does a skill's written procedure get followed? | Step 9 PR format 30 of 30 (**~100%**), because a template writes it. `zao-doc-next` 3.6%, tracker rows 6.9%, HR10 Next Actions 25% | doc `dev-workflows/2475-research-system-internal-audit`, line 25 |
| Do rules in always-loaded context change behaviour? | No. 2 of 2 graduated laws are `LAW NOT HOLDING`: 16 of 24 and 4 of 11 entries logged after graduation (`zao-mistake due`, 2026-09-24, 123 entries) | ZAOOS PR #3643 (doc 2550, unmerged at writing) |
| Do mechanical guards hold? | On their own surface, yes. In one day: two fabricated-SHA messages refused, a money figure in a card title refused, merges refused until context paths were cited, and a duplicate card returned UNKNOWN. The same fabricated-SHA shape escaped twice on surfaces without the guard. Guard refusals are not logged, so their record has no denominator. | doc 2550 as above |

The answer to "do skills work": **a skill works at the step a tool enforces, and is advisory everywhere else.** The `zao-research` skill is the sharpest example of both. Its PR-format step runs at ~100% and its Next Actions requirement at 25%. A manager plugin changes which skills are on disk. It does not change that ratio, because it touches files, not enforcement.

## Options

| Option | Cost | Risk here | Verdict |
|---|---|---|---|
| Install AI Skills Manager in `~/zao-vault` | about 15 minutes | Moves or recursive deletes in the shared dotfiles tree; toggles the global `CLAUDE.md`; a five-day-old, unreviewed plugin with a 441 KB committed bundle | **SKIP** |
| Install it read-only in a throwaway vault pointed at a *copy* of the skills tree, for its usage view | about 30 minutes | Low. It still reads every transcript under `~/.claude/projects` | Possible after 3 October; gains nothing over doc 2514's numbers |
| Extend `zao-skill-audit` (doc 2514's follow-up) to print never-invoked and ambiguous skills | already scheduled by 2514 | None - read-only, estate-owned | **USE**, on 2514's own schedule |
| Do nothing | 0 | 365 idle skills at about 70 tokens each while idle | Acceptable until after 3 October |

## Also See

- [Doc 2514 - skills surface routing audit](../2514-skills-surface-routing-audit/) - the 428 / 365 / 63 / 183 / 3 measurements
- [Doc 2475 - research system internal audit](../2475-research-system-internal-audit/) - the ~100% vs 3-40% compliance figures
- ZAOOS PR #3643 (doc 2550, carrying state across compactions and agents) - the law-versus-guard measurements
- `.claude/rules/vanishing-dependencies.md` - why an untracked folder inside a tracked tree is the worst case
- `.claude/rules/no-rm-rf.md` - recursive deletes are Zaal's, by hand

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Do not install AI Skills Manager against `~/.claude/skills` or `~/zao-vault`. Shipped: this doc merged; no `.obsidian/plugins/ai-skills-manager` directory in `~/zao-vault`. | @Zaal | Decision | 2026-09-25 |
| After ZAOstock, re-check the plugin once. Adopt it only if it has gained a read-only mode, or a refusal to act on a directory inside a git working tree. Shipped: a dated note on this doc's tracker card saying adopted or not. | @Zaal | Review | 2026-10-10 |
| Take the "which skills are idle or ambiguous" view from doc 2514's existing `zao-skill-audit` follow-up, not from a plugin. Shipped: that audit prints never-invoked and duplicate-name counts. | @Zaal (the zorca lane owns the 2514 row) | PR | 2026-09-26 (2514's own date; deferral past 2026-10-03 is acceptable) |

## Sources

- [r/claudeskills 1wogx5i - "I made an Obsidian plugin to organize Claude Code skills and other AI tools"](https://www.reddit.com/r/claudeskills/comments/1wogx5i/i_made_an_obsidian_plugin_to_organize_claude_code/) - [FULL, via `~/bin/zao-fetch-reddit.sh` (Arctic Shift, keyless); body plus all 20 archived comments. The share link `/s/4qeA3h8MI8` was resolved with `curl -sIL`. The post itself reports 0 comments; the archive holds 20.]
- [Obsidian community plugin registry, `community-plugins.json`](https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json) - [FULL, 8,005 entries; the `ai-skills-manager` entry reads "This plugin has not been manually reviewed by Obsidian staff."]
- [GitHub NoteNerdOfficial/ai-skills-manager](https://github.com/NoteNerdOfficial/ai-skills-manager) - [FULL: README, 11,058 bytes; `src/itemToggle.ts` and `src/claude-usage.ts` read from the API. Repo created 2026-09-19, 5 stars, MIT, releases 0.1.5-0.1.7 on 2026-09-23/24.]
- [Obsidian plugin page](https://community.obsidian.md/plugins/ai-skills-manager) - [PARTIAL - HTTP 200, but only fetched to confirm it is live; the content used comes from the registry and the repo]
- Estate: `readlink ~/.claude/skills ~/.claude/CLAUDE.md` (both into `~/zaal-dotfiles`); `~/zao-vault/.obsidian` present; 62 `SKILL.md` files under `~/.claude/skills` via `find -L` - [FULL, run 2026-09-24]
- ZAOOS docs 2514 and 2475, read from origin/main - [FULL]
