---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-10-04
superseded-by:
related-docs: "2582, 2584, 2459, 2276, 2118, 429"
original-query: "Zaal, context lane pane, Sun 4 Oct 01:1x, verbatim: 'Research Pre-compact and context and anything around skills'"
tier: STANDARD
---

# 2585 - Pre-compact, context and skills: what actually survives a compaction on this Mac, and what the skill listing costs

> **Goal:** Measure how compaction, the `/precompact` skill and the skills estate behave on this Mac over the last 14 days, read Claude Code's own documentation on what survives a compaction and how the skill listing is budgeted, and say what to adopt, keep or skip.

Written by the context lane. Every local number comes from a command run on 2026-10-04 between 01:1x and 02:0x EDT against `~/.claude/projects/*/*.jsonl` (166 transcripts touched in 14 days), `~/.claude/skills/`, `~/.claude/settings.json` (read only, nothing changed) and the vault. Every quote comes from a raw-text fetch of the page named in Sources.

## Key Decisions

| # | Decision | Evidence | Confidence | Owner, by when |
|---|---|---|---|---|
| 1 | **`/precompact` covers about a quarter of compactions, so it cannot be the mechanism that preserves memory. ADOPT the documented one: a `SessionStart` hook matched to the `compact` source that re-injects the lane's resume block.** | 85 compactions in 14 days across 17 sessions: 50 manual, 35 auto. Preceded by `/precompact` (Skill call or typed) in the same segment: 18 of 50 manual, 5 of 35 auto, 23 of 85 overall, 27 percent. Both `SessionStart` entries in settings carry no matcher. Claude Code docs: context a hook added earlier is "Summarized with the rest of the conversation"; a `SessionStart` hook that matches `compact` is the listed way to re-inject | A | Dotfiles lane, 2026-10-10. A hook is a permission surface: Zaal's tap, the lane proposes the diff |
| 2 | **The status file is the right place for memory and the wrong shape for re-reading: keep a resume block under 5,000 tokens at the TOP of it.** After a compaction Claude Code re-reads at most five files, most recently modified first, and "a file over 5,000 tokens comes back as a path reference without its content". | 30 of 56 `handoffs/status/*.md` are over 20,000 bytes; median 21,895 bytes; largest `zj.md` 518,020 bytes; this lane's own is 42,269 bytes. `zao-status-append` appends at the bottom, so the newest state is the part that never comes back | A | Dotfiles lane (zao-status-append and /precompact), 2026-10-10 |
| 3 | **Eight local skills lose their tail after any compaction. Move the rules that must hold to the top, then split.** Invoked skill bodies are "re-injected, capped at 5,000 tokens per skill and 25,000 tokens total; oldest dropped first", and "truncation keeps the start of the file". | Over 20,000 chars: meeting 69,236; zao-research 49,249; design-review 44,141; review 26,702; autoresearch 26,506; gstack 26,400; browse 21,872; handoff 21,309. `zao-research` keeps its Hard Requirements table at the bottom, so a research run after a compaction has lost it. Doc 2459 KD3 already asked for the handoff split | A | Dotfiles lane, 2026-10-12, starting with zao-research and handoff |
| 4 | **The skill listing costs about 7,500 tokens in every session, and most of it buys nothing.** 355 entries, 50 with a description, 305 name-only; 238 of the 355 are from one plugin whose skills were called 2 times in 14 days. | Listing in this session: 30,052 chars. `skillOverrides` in settings holds 208 entries, all `off`, all everything-claude-code, yet this session still lists 238 of that plugin's names. Whether `off` leaves the name in the listing, or this session predates the override, is NOT established here | B | Zaal, one command: run `/skill-doctor` and `/context` in a fresh session and read the Skills row |
| 5 | **44 of 65 local skills were not invoked once in 14 days; run `/skill-doctor` before retiring anything.** It is the vendor's own instrument for exactly this and it reports cost next to use. | 242 Skill-tool calls across 33 distinct skills; top five are zao-research 54, five-minute-grill 33, handoff 26, precompact 21, quick-grill 16. Only 6 of 65 local skills were typed as a slash command. Four have no description on disk (learned, spawn, synced, tclip); doc 2276 KD1 marked `learned` for retirement on 2026-08-14 and it is still there | B | Zaal runs it; Dotfiles acts on the report, 2026-10-12. Per the never-delete rule: archive, do not remove |
| 6 | **Compactions here happen at a median of 839,434 tokens, deep inside the range where recall has already degraded. KEEP the 1M window, ADD a focus line to every manual compact.** `/compact <what to keep>` is free and 50 of 85 compactions were manual with the instruction left empty by default. | preTokens n=85: median 839,434, max 967,402, min 98,120. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=90`. Docs: "The summary keeps what you choose instead of what the automatic pass guesses is important"; a PreCompact hook receives `custom_instructions`, null when nothing is passed | B | /precompact skill text: emit the `/compact focus ...` line as its last output. Dotfiles, 2026-10-10 |
| 7 | **SKIP building a memory service, a vector store or a "context manager" lane.** The documented survivors are files: root CLAUDE.md, unscoped rules, auto memory and the plan are re-injected from disk. Put what must survive in those and keep them small. | `~/.claude/CLAUDE.md` 131 lines, 11,161 bytes; auto memory `MEMORY.md` 44 lines, 9,431 bytes against the 200-line or 25KB load limit; vault `AGENTS.md` 705 lines, 83,925 bytes on origin, where the docs say "files over 200 lines consume more context and may reduce adherence" | A | No build. AGENTS.md split is a separate card, vault lane |

## One live defect found on the way

`~/zao-vault/AGENTS.md` in the shared clone is **0 bytes**, modified and uncommitted since 1 Oct 12:12 (`ls -la`, `git status --porcelain -- AGENTS.md` prints ` M AGENTS.md`). Origin holds 83,925 bytes. Any session whose working directory is the shared clone, and Antigravity through its `~/.gemini/AGENTS.md` symlink, has been loading an empty rules file for three days. This is the forward risk `~/.claude/CLAUDE.md` describes for the dotfiles tree, on a different tree. Reported to the seat; not fixed here, because the vault lane owns the clone and the reconcile (card 10208) has not run.

## What survives a compaction (Claude Code docs, quoted)

| Mechanism | After compaction |
|---|---|
| System prompt and output style | Both still apply |
| Project-root CLAUDE.md and unscoped rules | Re-injected from disk |
| Auto memory | Re-injected from disk |
| The plan written in plan mode | Re-injected from disk |
| Rules with `paths:` frontmatter, nested CLAUDE.md | Reloaded only when a matching file is read again |
| Files Claude read or edited | Up to five re-read, most recently modified first; over 5,000 tokens returns as a path only |
| Invoked skill bodies | Re-injected, capped at 5,000 tokens per skill and 25,000 total, oldest dropped first |
| Context that hooks added earlier | Summarized with the rest of the conversation |
| SessionStart hooks matching `compact` | The documented way to re-inject context |

Two hook facts from the same docs: "Claude Code discards a PreCompact hook's `systemMessage` and `continue` fields", so a PreCompact hook can write to disk and cannot speak to the model; and a PostCompact hook receives `compact_summary`, the text of the summary itself, which nothing here saves today.

## Measured on this Mac, 14 days to 2026-10-04

| Measure | Value | Command |
|---|---|---|
| Transcripts touched | 166 | mtime filter on `~/.claude/projects/*/*.jsonl` |
| Compactions | 85 in 17 sessions; 50 manual, 35 auto | `subtype: compact_boundary`, `compactMetadata.trigger` |
| Tokens at compaction | median 839,434; min 98,120; max 967,402 | `compactMetadata.preTokens` |
| Preceded by /precompact | 18 of 50 manual, 5 of 35 auto | Skill call or `<command-name>/precompact` earlier in the segment |
| HANDOFF-READY stamps in status files | 264 in 39 of 56 files; 256 with a real minute | grep over `handoffs/status/*.md` |
| Pre-compact sections in status files | 78 | heading grep |
| Precompact hook bundles on disk | 29 directories | find under `~/.handoffs`, `~/.zao/handoffs` |
| Local skills | 65; 61 with a description (22,220 chars); bodies 695,625 chars | walk of `~/.claude/skills/*/` |
| Skill listing in a live session | 30,052 chars; 355 entries; 50 described | this session's own transcript |
| Skill-tool calls | 242 across 33 skills | `tool_use` name `Skill` |
| Hooks configured | PreCompact 1 (`zao-cc-bundle.sh precompact`), PostCompact 1, SessionStart 6 with no matcher | `~/.claude/settings.json`, read only |

Stated limits: the precompact detector reads one segment back from each boundary, so a `/precompact` run in an earlier segment of the same session is not counted; and 85 compactions against 29 bundle directories is not a failure count, because the bundles span all time and directories are per day and lane.

## Outside practice

- **Anthropic, Agent Skills post:** the name and description are "the first level of progressive disclosure: it provides just enough information for Claude to know when each skill should be used without loading all of it into context", and "the amount of context that can be bundled into a skill is effectively unbounded". True before a compaction; after one, the cap above applies, which the post does not mention.
- **Claude Code skills docs:** "Every skill in the skill listing adds to your context on every turn, whether or not Claude ever uses it." The budget "scales at 1% of the model's context window"; on overflow descriptions are dropped "starting with the skills you invoke least". Description plus `when_to_use` is truncated at 1,536 characters. Controls: `disable-model-invocation: true` in frontmatter, `skillOverrides` in settings, `/skill-doctor`, `/doctor`, `/context`.
- **HN 45607117 (816 points, 427 comments, 2025-10-16):** the dissent matches the measurement. "The capability of the system to use the right skill is limited by the little blurb you give"; "the more skills you have, the worse they're going to be ... just use slash commands". Here, 6 skills are typed and 305 listed without a blurb.
- **HN 45619537 (738 points, 370 comments, 2025-10-17):** "Skills are about context management - providing context on demand." That is the correct frame for this estate: the skills that earn their listing cost are the five that get used daily.

## Compared with what ZAO already wrote

- **Doc 2118 (2026-07-29)** concluded that ZAO "already handles" long sessions. On the 27 percent measured here it does not; that doc predates the 1M window and should be marked superseded by this one on that point.
- **Doc 2459 KD2 and KD3 (2026-09-25):** enforce the 200-line brief cap with a hook; split `handoff/skill.md`. Both still open, both made more urgent by the 5,000-token caps.
- **Doc 2276 (2026-08-14):** four retirements named; at least `learned/` is still on disk.
- **Docs 2582 and 2584:** the census and the idle measurement. This doc is their third leg: 2582 says measure the surface, 2584 says close idle panes, and closing a pane safely depends on KD1 and KD2 here.

## Also See

- [agents/2582 - how agent context improves](../../agents/2582-agent-context-improves/)
- [dev-workflows/2584 - idle vs working time](../2584-idle-vs-working-time/)
- [dev-workflows/2459 - handoff artifacts that get consumed](../2459-handoff-artifacts-that-get-consumed/)
- [dev-workflows/2276 - the skills estate](../2276-skills-estate-audit/)
- [dev-workflows/2118 - long-session context management](../2118-long-session-context-management/)
- [dev-workflows/429 - Claude Code skills deep dive](../429-claude-code-skills-deep-dive/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Propose the `SessionStart` hook with matcher `compact` that prints the lane's resume block; shipped when a compaction in a test lane shows the block in the first turn after it. Zaal applies the settings change | Dotfiles lane (zj) | Dotfiles PR plus Zaal's tap | 2026-10-10 |
| `zao-status-append` and `/precompact` keep a resume block of at most 5,000 tokens at the top of the status file; shipped when `head -c 20000` of a status file contains the newest HANDOFF-READY stamp | Dotfiles lane (zj) | Dotfiles PR | 2026-10-10 |
| Move the Hard Requirements of `zao-research` and the stamp rules of `handoff` into the first 5,000 tokens; shipped when both files' first 20,000 chars contain them | Dotfiles lane (zj) | Dotfiles PR | 2026-10-12 |
| Run `/skill-doctor` and `/context` in a fresh session and paste both into the tracker card; shipped when the card holds the Skills row and the never-invoked list | Zaal | Hand | 2026-10-07 |
| Restore the shared clone's `AGENTS.md` from origin as part of the 10208 reconcile; shipped when `wc -c ~/zao-vault/AGENTS.md` is not 0 | vault lane | Reconcile | 2026-10-05 |
| Save `compact_summary` from the existing PostCompact hook next to the precompact bundle; shipped when a bundle directory holds the summary text | Dotfiles lane (zj) | Dotfiles PR | 2026-10-12 |

## Sources

All fetched 2026-10-04 as raw text with curl, or run locally. No sentence above is quoted from a model summary.

- [Claude Code docs: Skills](https://code.claude.com/docs/en/skills.md) [FULL, 104,078 bytes of markdown; listing budget, 1,536-char cap, re-attach caps, /skill-doctor]
- [Claude Code docs: Context window, "What survives compaction"](https://code.claude.com/docs/en/context-window.md) [FULL, 60,500 bytes]
- [Claude Code docs: Hooks](https://code.claude.com/docs/en/hooks.md) [FULL, 249,939 bytes; PreCompact and PostCompact input fields]
- [Claude Code docs: Memory](https://code.claude.com/docs/en/memory.md) [FULL, 50,587 bytes; 200-line and 25KB limits, what survives]
- [Claude Code docs: Costs](https://code.claude.com/docs/en/costs.md) [FULL, 41,198 bytes; custom compaction instructions]
- [Anthropic: Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) [FULL, HTML stripped to 9,777 chars]
- [HN 45607117: Claude Skills](https://news.ycombinator.com/item?id=45607117) [PARTIAL, Algolia items API, first 40 of 101 top-level comments read]
- [HN 45619537: Claude Skills are awesome, maybe a bigger deal than MCP](https://news.ycombinator.com/item?id=45619537) [PARTIAL, Algolia items API, first 40 of 73 top-level comments read]
- Local: `~/.claude/projects/*/*.jsonl` (166 files), `~/.claude/skills/` (65 directories), `~/.claude/settings.json` (read only), `zao-vault/handoffs/status/*.md` (56 files), `~/.claude/skills/precompact/SKILL.md` (130 lines, built 2026-09-21) [FULL, run]
