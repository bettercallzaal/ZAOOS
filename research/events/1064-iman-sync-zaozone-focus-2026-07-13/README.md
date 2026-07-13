---
topic: events
type: incident-postmortem
status: research-complete
last-validated: 2026-07-13
related-docs:
original-query: "/meeting craig-rInoEEab0Sra-mix.wav - Iman working sync, board cleanup + refocus"
tier: STANDARD
---

# 1064 - Iman Sync: ZaoZone Refocus + Board Cleanup (2026-07-13)

> **Goal:** Capture the decision that refocused Iman onto one thing - owning the ZAO Zone as the front-end for the co-working board - and the workflow cleanup that produced it.

**Date:** 2026-07-13
**Duration:** ~18 min
**Attendees:** Zaal, Iman
**Platform:** Discord / Craig
**Project:** ZAO Devz / general
Full transcript: [transcript.md](transcript.md)

## Headline

Iman's focus collapsed from a scattered task pool to ONE thing: **own the [ZAO Zone](https://github.com/ZAODEVZ/theZAOZone) and turn it into the front-end for the [co-working board](https://thezao.xyz/board).** The board had auto-assigned Iman a firehose of PR-test / doc-review chores across every domain (the pr-test-task pipeline defaults owner to Iman); Zaal cleared almost all of them off live in this sync.

## Decisions

| # | Decision | Owner |
|---|----------|-------|
| 1 | Iman owns the [ZAO Zone](https://github.com/ZAODEVZ/theZAOZone); it becomes the front-end for the [co-working board](https://thezao.xyz/board). Ideal end state: only Zaal + Iman on the raw board, everyone else enters through the ZaoZone. | Iman |
| 2 | ZaoZone home = choose-your-path: a 2x2 grid with two axes (e.g. decentralization x entrepreneurship), all ZAO projects plotted on the XY, pick your corner. | Iman |
| 3 | Three types of people can join; Jose logs in and sees his ZaoZone tasks pulled from the board. Only builders get the raw board. | Both |
| 4 | Onboarding = a ZAO course: vibe-coding instructions + ZAO instructions + integrate [ZAOlingo](https://github.com/bettercallzaal/zaolingo). | Both |
| 5 | No duplicate repos - the [Zlank](https://github.com/bettercallzaal/zlank) templates went to a new GitHub; consolidate into the existing repo + delete the copy. Going forward, update the existing repo, never fork. | Zaal |
| 6 | Daily-tasks process: each person gets a daily task; Iman logs all active to-dos + links into its comments as "working on this today". | Both |

## Actions

| Action | Owner | File / Link |
|--------|-------|-------------|
| Build the ZaoZone MVP - choose-your-path front-end for co-working | Iman | [task 857](https://thezao.xyz/board?task=857) - repo [ZAODEVZ/theZAOZone](https://github.com/ZAODEVZ/theZAOZone) |
| Log all active to-dos into the daily task's comments (with links) | Iman | [task 858](https://thezao.xyz/board?task=858) |
| Create the comms account; (optional) Anthropic Courses 101 | Iman | - |
| Consolidate the Zlank templates repo + delete the duplicate | Zaal | [bettercallzaal/zlank](https://github.com/bettercallzaal/zlank) |
| Build the per-person daily-view (one button per person) | Zaal | [board](https://thezao.xyz/board) |
| Finish the POIDH bounty-deadline calendar (in progress, ASAP; talk to August re: Boyd) | Zaal | - |
| WaveWarZ content week; [ZABAL Games](https://zabalgames.com) content that leads with WaveWarZ | Zaal | [zabalgames.com](https://zabalgames.com) |
| Build "view board as any person" (Zaal view) | Zaal | [board](https://thezao.xyz/board) |

## Also See

- [[project_iman_role]] memory - updated with this ZaoZone refocus.
- [[feedback_task_clarity_links]] - the "clear goal + GitHub file link" rule this sync produced.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship the ZaoZone MVP front-end (choose-your-path home, board-backed tasks) | Iman | PR to ZAODEVZ/theZAOZone | 2026-07-20 |
| Fix the pr-test-task generator so it stops auto-assigning to Iman | Zaal (via ZOE) | PR to ZAOOS | 2026-07-16 |
| Build the "view board as any person" Zaal-view | Zaal (via ZOE) | PR to ZAODEVZ/ZAOcowork | 2026-07-18 |

## Sources

- Meeting recording `craig-rInoEEab0Sra-mix.wav` (local transcription, mlx-whisper) `[FULL]` - transcript in [transcript.md](transcript.md).
