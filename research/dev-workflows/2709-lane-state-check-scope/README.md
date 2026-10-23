---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "dev-workflows/2706-claims-check-enforcer-scope (ZAOOS #4157, unmerged)"
original-query: "Of ZAOOS issues #4152 to #4155, pick the first that has no PR and no claimed lane ... Scope it the same way as #4151: research and spec only, as a doc PR with the hold label. (messenger-69 relay, 23 Oct 2026; #4151's scope: the narrowest mechanism per rule, what it would catch, and false-positive risk, measured)"
tier: QUICK
---

# 2709 - Scoping a lane-state check for issue #4152: the narrowest mechanism per rule

> **Goal:** Issue #4152 groups six rules with no enforcer (idle-lane-audit, session-boundaries, thread-discipline, workflow-discipline, recap-followthrough, capture-quality) and proposes one check over each lane's state and outputs. Measure where each rule is breached today, and name the narrowest mechanism per rule. Nothing is built and no rule file is edited (lane-quality owns them).

## Key Decisions

| # | Decision | Why (measured 2026-10-23) |
|---|---|---|
| 1 | **SKIP one "lane-state check"; measure state, not the MISTAKES log.** | The October MISTAKES log (142 entries, vault origin/main 2137c6a5) shortlists 0 to 3 entries per rule. These rules are breached silently, so nobody logs them; the log cannot measure them. The state checks below find breaches the log does not. |
| 2 | **capture-quality: make `--why` and `--done-when` required in the pipelines that create cards**, starting with the two sources measured missing them. | Of the 30 most recent cards (ids 10527 to 10556, `zao-tracker show`), 21 carry both WHY and DONE WHEN, 6 WHY only, 3 neither. All 9 incomplete cards come from pipelines: 5 from `handoff:` sources and 4 from `research-doc` (doc Next Actions) sources. The rule's own line 3 says a card without them is never "the default a pipeline produced". |
| 3 | **workflow-discipline rule 4 (commit as Zaal): a pre-commit identity check in the zao-vault repo**, refusing an author email other than the one the rule names, with the `+` alias allowed if Zaal says so. | October commits (committer date from 2026-10-01T00:00Z), pinned: ZAOOS at e8686493 387 of 387 and zaal-dotfiles at 80ad9575 241 of 241 by the rule's address; zao-vault at ee775ed8 3,866 of 3,893. The 27 others are 21 by a plus-alias of the same address (a radar job), 4 by `root@` a Windows desktop host and 2 by a role address. The 4 `root@` commits are the bot-identity case the rule exists for. (A first count, with a local-time date boundary and an unpinned vault, read 384 and 3,610 of 3,636; the evaluator's paginated count gave 387.) |
| 4 | **idle-lane-audit: a one-line marker the audit writes, counted by a script.** The audit ends with a status line beginning `IDLE-AUDIT:`; `zao-status-append` already stamps it; a weekly count names lanes with none. | 13 of the 131 lane status files at vault ee775ed8 mention an idle audit (`git grep -liE 'audited, nothing missing|idle(-lane)? audit'`). An unpinned read earlier the same day gave 6; the seat's standing rule that every lane with an empty queue writes its idle audit went out in between. Without a fixed marker the rule can only be counted by a phrase grep like this one. |
| 5 | **recap-followthrough: a template check on new vault `meetings/*.md`** that refuses a note with no follow-through block (who owes what, to whom, by when), the same way the docs CI checks frontmatter. | 4 of the 13 October meeting notes at vault ee775ed8 carry a follow-through block (grep for "follow-through", "who owes", "owes ... by"). |
| 6 | **session-boundaries and thread-discipline: no new mechanism.** | Every peer session in today's ListAgents listing carried a name, and the status line already shows `unnamed` in amber. Thread drops show up only in conversation, which no tool reads; the rule's own guard (TaskCreate) is the mechanism. Revisit if an instance is logged against #4152. |

## What already enforces part of this

| Tool | What it does | Rule it partly covers |
|---|---|---|
| ZOE `splitCapturesByQuality` (`bot/src/zoe/team-tracker.ts`) | holds a phone capture with no why or who and asks one button question | capture-quality, phone end only |
| `zao-tracker` create `--why` / `--done-when` | accepts the fields; does not require them | capture-quality, optional |
| status line (`zao-statusline`) | shows `unnamed` in amber for a session with no name | session-boundaries |
| `zao-status-append` | stamps every status entry with the clock | idle-lane-audit, once a marker exists |

Checked and not covering these rules: `zao-recap` (an end-of-turn summary hook, not meeting follow-through) and `zao-follow-audit` (the GitHub follow graph).

## Next Actions

| Action | Owner | Type | Gate |
|---|---|---|---|
| Require `--why` and `--done-when` in the handoff and research-doc card writers | a lane | dotfiles PR | merge-lane |
| zao-vault pre-commit author check, after Zaal says whether the `+radar` alias is allowed | a lane | vault PR | hook: Zaal's merge |
| `IDLE-AUDIT:` marker in idle-lane-audit.md, plus a weekly count | lane-quality (rule owner) | rule PR + script | merge-lane |
| Follow-through block check on new `meetings/*.md` | a lane | vault CI PR | merge-lane |
| Comment on #4152 linking this doc | quidli | issue comment | none |

## Sources

- ZAOOS issue #4152 [FULL, `gh issue view`]
- Vault `MISTAKES.md` at origin/main 2137c6a5, 142 October entries [FULL, `git show`]
- `zao-tracker show` for cards 10527 to 10556, read 2026-10-23 before 16:45Z [FULL, read-only, 30 of 30 exited 0]
- `git log <sha> --since='2026-10-01T00:00:00Z' --format=%ae` at ZAOOS e8686493 (tip 2026-10-22T22:27:30Z), zaal-dotfiles 80ad9575, zao-vault ee775ed8 [FULL]
- Vault `handoffs/status/*.md` (131 files) and `meetings/*2026-10*` (13 notes) at vault ee775ed8 [FULL, `git grep` and `git show`]
- `bin/zao-recap`, `bin/zao-follow-audit` headers; `bot/src/zoe/team-tracker.ts` line 249 [FULL, read]
- Sibling check: `zao-sibling #4152 'issue 4152'` (run from the #730 branch) found only ZAOOS #4156, the rules-lint PR that cites all six groups; no PR or lane building #4152.
