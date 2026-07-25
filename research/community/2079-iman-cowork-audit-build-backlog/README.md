---
topic: community
type: audit
status: research-complete
last-validated: 2026-07-25
superseded-by:
related-docs: 857, 858, 1200
original-query: "grab these things from Iman as suggestions and include all of this in the build and /zao-research on all this (source: two coworking-audit PDFs of the Iman/Zaal WhatsApp + Telegram threads, 2026-07-09 to 2026-07-23). PII-redacted to product/feature/bug items only."
tier: STANDARD
---

# 2079 - Iman Coworking-Audit Build Backlog

> **Goal:** Pull only the product/feature/bug suggestions out of the Iman/Zaal coworking-audit threads and turn them into a ranked, ownable build backlog for the cowork board + ZAO Zone + thezao.com. Interpersonal, financial, and credential content from the source is deliberately excluded.

## Scope + redaction (read first)

The source for this doc is two audit exports of the Iman/Zaal chat threads (WhatsApp 2026-07-13..22, Telegram 2026-07-09..23). Those threads mix product talk with **finances, a scholarship/relationship thread, a shared credential, and third-party contact names.** NONE of that is in this doc or the repo. This doc extracts only the **build-relevant** items: features, bugs, UX flows, and surface ideas. Every item below is a thing to design or ship, not a person or a private detail.

Where a suggestion maps to an existing tracker task, it is linked (tasks 857, 858, 1200 already exist).

## Key Decisions (recommendations, most-urgent first)

1. **Fix the cowork board before adding to it.** Iman reports a hard blocker: adding a task fails, plus several broken pages (My Work, calendar, activity, task chat). A daily-logging habit cannot form on a tool that cannot accept a task. This is P0 - it blocks Iman's own daily to-do (task 858) and every downstream idea below. Ship the bug fixes first.
2. **ZaoZone MVP is a choose-your-path front door, not a new app.** The suggestion is a simple entry grid ("what are you here to do") that routes a member into the right surface. Build it as a thin front-end over the existing cowork board + persona routing, not a from-scratch product (task 857).
3. **Persona routing is the connective tissue** across ZaoZone, thezao.com, and onboarding. Musician -> WaveWarZ / SongChainn, developer -> ZAO Dev, builder -> Farcaster. This already has a natural home in the thezao.com `/ai` surface work - fold it in there rather than a fourth place.
4. **Onboarding message process is time-sensitive.** Real signups are arriving now with no defined welcome/next-step. A lightweight, templated first-touch (routed by persona) is cheap and stops the leak.
5. **Everything else (papers -> Zone, song-per-paper, devz subdomain, SongChainn tags + Audius, Farcaster Spaces) is a real idea but sequenced after the board works and the front door + onboarding exist.** Do not build the roof before the floor.

## The build backlog (ranked)

### P0 - Cowork board is broken (blocks everything)

| # | Item | What Iman reported | Shipped-criteria |
|---|------|--------------------|------------------|
| B1 | "Can't add tasks" blocker | Creating a task fails outright | A member can add a task and it persists + shows in their list |
| B2 | My Work scoping (task/1200) | My Work does not correctly scope to the person | My Work shows only the signed-in member's tasks |
| B3 | Broken pages | Calendar, activity, assistance, task-chat pages error/blank | Each page loads and renders real data |
| B4 | Daily to-do surface (task 858) | Iman wants a daily to-do he actually logs into | A per-day list exists and Iman uses it for 5 consecutive days |

### P1 - The front door + onboarding

| # | Item | Design note | Shipped-criteria |
|---|------|-------------|------------------|
| F1 | ZaoZone MVP (task 857) | Choose-your-path grid (2x2): what are you here to do -> route. Thin layer over the board. | Grid live, each tile deep-links to a working surface |
| F2 | Persona routing | musician -> WaveWarZ/SongChainn; dev -> ZAO Dev; builder -> Farcaster. Reuse the thezao.com `/ai` routing surface. | A member picks a persona once and lands on the matching surface |
| F3 | Onboarding first-touch | Templated welcome + next-step message, routed by persona/source. | New signup gets a persona-matched first message within a defined window |
| F4 | Per-person board view + view-as | A board view scoped to one person, plus a Zaal "view-as-anyone" mode. | Zaal can open any member's board view read-only |

### P2 - Content + surface expansion (after the floor is solid)

| # | Item | Design note | Shipped-criteria |
|---|------|-------------|------------------|
| C1 | ZAO papers -> Zone | Surface the research/paper corpus inside the Zone as a browsable feed. | Papers list renders in the Zone with links |
| C2 | Song-per-paper | Each paper can carry an associated track (ties papers to the music identity). | A paper can display/link one song |
| C3 | devz.thezao.com | Dedicated subdomain for ZAO DEVZ. | Subdomain resolves to the Devz surface (DNS = gated) |
| C4 | SongChainn: more song-tags + Audius | Richer song tagging + an Audius tie-in for distribution. | Tag set expanded; Audius link path defined |
| C5 | Farcaster Spaces | A Spaces-style live surface inside the ecosystem. | Scoped spec exists before any build |

## Findings

- **The tool-trust problem is the real finding.** The single most damaging pattern in the threads is not a missing feature - it is that the person meant to live in the cowork board cannot reliably add a task to it. Every "let's add X to the Zone" idea sits on top of a surface that currently fails its most basic write. That is why B1-B4 gate everything: a habit forms on a tool that works, and dies on one that does not (this matches `.claude/rules/agent-loops.md` rule 1 - ground truth over aspiration).
- **ZaoZone is a router, not a product.** Read literally, the "choose your path" idea is an onboarding grid that sends people to surfaces that already exist (board, WaveWarZ, Devz, Farcaster). Treating it as a thin routing layer (F1+F2) makes it a days-not-weeks build and avoids a fourth half-built app - consistent with the monorepo-as-lab principle and the "build the durable surface, not throwaway" feedback.
- **Persona routing already has a home.** The thezao.com `/ai` surface (the AI-tools/ICM-box page) is the natural place for "pick who you are -> get the right entry point," so persona routing should extend that, not spawn a parallel mechanism. One routing brain, three consumers (Zone, site, onboarding).
- **Onboarding is a leak, not a feature.** Signups arriving with no first-touch is an active loss every day it is unaddressed; a templated persona-matched message is the cheapest high-impact item outside the P0 bugs.
- **The P2 content ideas are coherent with ZAO's identity** (papers + music + dev + social), but each needs the floor (working board) and the door (Zone + onboarding) first. C3 (devz subdomain) and C5 (Farcaster Spaces) additionally touch DNS / a new live surface and stay gated on explicit go.

## Also See

- Tracker task 857 - ZaoZone MVP (in-flight)
- Tracker task 858 - Iman daily to-do (in-flight)
- Tracker task/1200 - My Work scoping bug (in-flight)
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - surface consolidation (no new surfaces without a doc)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Reproduce + fix "can't add tasks" (B1); PR merged, add-task works end to end | @Zaal | PR | 2026-07-28 |
| Fix My Work scoping (B2, task/1200) + broken calendar/activity/assistance/task-chat pages (B3); PR merged | @Zaal | PR | 2026-07-30 |
| Ship daily to-do surface (B4, task 858); Iman logs 5 consecutive days | @Zaal | PR + adoption | 2026-08-04 |
| Build ZaoZone choose-your-path grid (F1, task 857) as a thin router over the board; grid live | @Zaal | PR | 2026-08-06 |
| Extend thezao.com `/ai` routing into persona routing (F2); one-pick -> matching surface | @Zaal | PR | 2026-08-08 |
| Draft templated persona-matched onboarding first-touch (F3); first signup gets it | @Zaal | PR | 2026-08-06 |
| Spec (not build) C1-C5 into the ZAO Zone roadmap once F1-F3 ship; roadmap doc updated | @Zaal | Doc | 2026-08-11 |

## Sources

- Coworking audit - Iman/Zaal WhatsApp thread export, 2026-07-13..22 [FULL, PII-redacted to product items only - finances/relationship/credential/contact-names excluded per `.claude/rules/pii-hygiene.md`]
- Coworking audit - Iman/Zaal Telegram thread export, 2026-07-09..23 [FULL, PII-redacted as above]
- ZAO cowork tracker - existing tasks 857 (ZaoZone MVP), 858 (daily to-do), /1200 (My Work scoping) [FULL]
- thezao.com `/ai` surface + ICM box work (this session) [FULL, in-repo]
