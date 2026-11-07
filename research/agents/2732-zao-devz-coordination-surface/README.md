---
topic: agents
type: DECISION
status: plan, held
last-validated: 2026-11-07
tier: STANDARD
---

# 2732 - ZAO Devz as the coordination surface, ZOE as its one agent

> **Goal:** say what "coordination" means in the ZAO Devz Telegram group, and for each of the eight steps that get it there, whether it is built, in a held PR, spec only, or Zaal's own hand. Plan note before any code (the zoe-devz lane brief of 7 Nov, step 1).

## Why this exists

Zaal, Sat 7 Nov 2026, seat pane, verbatim: "i do wanna imrpveo the overall zaodevz group to be more of coordinatoion between me and anyone else thats helping or doing zao related work". Recorded as item 5 of the seat's ruling record of 7 Nov (private vault). Two rulings the same afternoon frame it (Zaal's decisions log, private vault, items 304 and 305):

- **304** - retire the ZAO Devz bot; what it does moves to ZOE. Stopping `zao-devz-stack.service` and removing the bot from the chat stay his hand, after the ZOE PR is merged and live.
- **305** - ZOE does not post to Farcaster. She drafts, reads, reviews and suggests where he should comment. Posting is always his tap.

And two from the morning: **300** (in groups ZOE answers only when tagged or replied to) and **303** (house rules wait until Sun 8 Nov, with Iman reviewing).

## What coordination means in that group

The test every change here is judged by: **does it help the people in the group know who is doing what, what is blocked and by when, and what was decided, with less noise than today?**

The seat's read of the full chat export (2042 messages, 19 Apr to 7 Nov 2026; the seat's 7 Nov ZAO Devz chat review, private, not reproduced here because it names people and their circumstances) found the group works when a collaborator posts a plain-words daily update and when facts get checked before a send. It leaks in five ways this plan targets:

1. **Reviews land after publish.** No fixed review window exists, so a fix arrives after the edition is out.
2. **ZOE knows nothing about the group she is in.** Asked what she knows about ZAO Devz on 7 Nov, she said she had no detail on current projects.
3. **Bot noise.** A second bot identity (ZAO Devz Coder + Critic) unused in the chat since 3 May; ZOE answering non-Zaal voice notes with "That one is Zaal's."; old tip and "Not authorized" lines (April, sources since confirmed off by Zaal's VPS read on 7 Nov).
4. **Ideas land in chat and nowhere else.** The review counts 13 ideas from April to November with no card the group can see.
5. **Access gaps and blocked tests repeat with no date on them.**

Coordination, then, is four things the group can see without asking Zaal: **who owns what, what is blocked and since when, what was decided, and where an idea went.** ZOE's job in the room is to answer from that, quietly, only when asked.

## The eight steps, one table

Status words: **BUILT** (on origin/main), **HELD PR** (open, `hold` label, not merged), **SPEC** (this doc only, no code), **HIS HAND** (only Zaal can do it). Code claims are cited at ZAOOS origin/main `971c19b01` (fetched 2026-11-07) unless a PR is named.

| # | Step | What it is | Status | Evidence | Next, and whose |
|---|---|---|---|---|---|
| 1 | Review window before every send | A fixed window: the daily's draft link goes to the reviewers the day before; silence by the window's end means it goes | SPEC | Not code. No window is written in any skill or pinned message (the chat review's finding 1). | The rule's text lives in the newsletter skill (zaal-dotfiles, held PR, seat); posting the one-line rule in the chat is his |
| 2 | Pinned house rules | One pinned message with the rules he restates: share here not DMs, tag or reply, one screen, long text goes to a link | HIS HAND, parked | Ruling 303: not today; Sun 8 Nov at the earliest, Iman reviews first. ZOE's own group behaviour already carries part of it: `bot/src/zoe/concierge.ts:46-48` (answer only what was asked, no repeats, never claim to save anything, ask with a default; vault item 163) | Text not drafted here, on his word. Pin is his |
| 3 | ZOE's Devz brief | A group profile so ZOE can answer "what is ZAO Devz, who builds what, what is live" | HELD PR #4256 | #4256 adds the profile in `bot/src/zoe/memory.ts` with a test (`bot/src/zoe/__tests__/devz-group-profile.test.ts`). The per-group override field it can ride on is `persona_override` at `bot/src/zoe/groups.ts:20` | Waits on his merge, and on his answer to whether members may be named in a public repo (raised on #4256) |
| 4 | Bot noise off | ZOE silent in groups unless tagged or replied to; silent on media she cannot read | Partly BUILT, rest HELD PR #4258 | BUILT: mention mode at `bot/src/zoe/groups.ts:173-177` (allows an @-mention or a reply to ZOE), default `mode: "mention"` at `groups.ts:157`. Still open on main: an `engagedUntil` window at `groups.ts:184-185` lets ZOE answer a member's next line without a tag, and the voice handler at `bot/src/zoe/index.ts:2754-2755` runs `ownerOnly(ctx)` before its own chat-scope check at `index.ts:2760`, so a non-Zaal voice note in any group gets `OWNER_ONLY_LINE` ("That one is Zaal's.", `bot/src/zoe/owner-only.ts:13`). #4258 closes both (tagged-or-replied only, scope check first) | Waits on his merge. The ZAOstock bot's devops lines are another repo: a card for the seat, not this lane |
| 5 | The fold | ZOE takes `/fix`, `fix:` after a mention and `/fix_status` in the Devz chat; one voice; the Devz bot retires | HELD PR #4260 (plan); code PR not opened | Devz today: `/fix` at `bot/src/devz/index.ts:266`, mention-to-fix at `:280`, `/fix_status` at `:296`. The fold plan is `bot/src/devz/FOLD-INTO-ZOE.md` on #4260. Observability first: #4252 (BUILT, merged 2026-11-07) adds `featureRan` to every Devz entry point | This lane: code PR behind `ZOE_DEVZ_FOLD=1` after the Farcaster PR (step order in the lane brief). Setting the flag, stopping `zao-devz-stack.service`, removing the bots from the chat: his |
| 6 | Ideas carded from the group | A member replies to ZOE (or uses `/idea`) on an idea message; ZOE cards it so the group can see where it went | SPEC, and the `/idea` half is Iman's | Today group capture is Zaal-only: the `note:` path at `bot/src/zoe/index.ts:3350-3352` runs only `if (noteMatch && isFromZaal(ctx))`. The capture-quality gate exists for DM captures (`splitCapturesByQuality`, `bot/src/zoe/team-tracker.ts:249`; used at `index.ts:3923`). Iman owns `/idea` cards to the DevTopIA [Notes] topic (iman-desk #162, rulings 299 and 301); no ZAOOS PR for it was found (search below) | Spec below. Not built by this lane until #162 lands, so the reply path reuses Iman's card writer instead of a second one |
| 7 | Access checklist per collaborator | One card per person with four boxes: Drive folder, ZAODEVZ org write, ops board code, brand kit | HIS HAND (grants), seat cards | Not code. The chat review lists five repeats of the same access ask (Aug to Nov) | Seat opens one card per person; granting is his |
| 8 | Blocked tests get a date | Each stalled test becomes a card with an owner and a date | Seat cards | Not code. The chat review names three tests with no date as of 7 Nov | Seat cards them with `zao-tracker create --why --done-when` (`capture-quality.md` rule 3); nudges are his |

### Step 6 spec - a reply to ZOE cards the message

- **Trigger:** in a group where ZOE is allowed, a message that replies to another member's message and tags ZOE with `idea` (or Iman's `/idea` once #162 ships). A reply alone is not enough: under ruling 300 a reply to ZOE is an address, and a plain conversation must not create cards.
- **Effect:** one card on the board, quoting the replied-to message, with its author as "from", the replier as "carded by", a `why` taken from the message, and `done-when` left as a button question (the existing capture-quality pattern, `capq:` at `bot/src/zoe/index.ts:1242`), never left blank silently.
- **Answer in the chat:** one line with the card's link, in the thread it came from. Nothing else.
- **Guards:** the same per-day cap as other ZOE writes (`agent-loops.md` rule 5); first-handler-wins: the `idea` check runs before the concierge and the generic mention path excludes it (`first-handler-wins.md` rule 1); a `featureRan` line on the success path.
- **Owner:** Iman for `/idea` (#162). The reply-to-ZOE variant is a small follow-on on his writer, built by whichever lane he hands it to.

## Order of work for this lane (all held PRs, nothing deployed, nothing posted)

1. This plan note.
2. Ruling 305: the Farcaster write path made unreachable, fail closed, one log line, tests for the refusal. Needs a read of `bot/src/zoe/farcaster/` and `bot/src/zoe/caster/`; the previous session's read of `x402.ts` was denied by a permission prompt.
3. Ruling 304 step 2: the fold code behind `ZOE_DEVZ_FOLD=1` (step 5 above), then the CLAUDE.md and AGENTS.md rows after #4255 merges.
4. The x402 custody-key fallback removal (rulings file item 2.5; money-adjacent), only after step 2's read is allowed.

## What this plan does not do

- Draft the house rules (ruling 303).
- Build Iman's five items in iman-desk #168, including `/idea` and `/help`.
- Deploy, restart or post anything.
- Name members of the group: whether a public repo may name them is an open question to Zaal on #4256.

## Searched

- `gh pr list -R bettercallzaal/ZAOOS --state open --search coordination` on 2026-11-07: none.
- `gh pr list -R bettercallzaal/ZAOOS --state all --search "idea zoe"` on 2026-11-07: #4256, #4239, #4025, #4016, #4018; none is an `/idea` group card writer.
- Open zoe-devz PRs on 2026-11-07: #4252, #4254, #4255, #4256, #4257, #4258, #4260 (states read with `gh pr view`).
- `/usr/bin/grep` of `bot/src/zoe/index.ts`, `groups.ts`, `owner-only.ts`, `team-tracker.ts`, `concierge.ts` and `bot/src/devz/index.ts` at `971c19b01` for the lines cited above.
- Not searched: the VPS (what runs, env flags, `groups.json`), and Iman's branches outside ZAOOS.

## Sources

- Private vault records, read 2026-11-07: the zoe-devz lane's handoff status of 7 Nov; the seat's ruling record of 7 Nov (items 1 to 5); Zaal's decisions log items 299 to 305; the seat's 7 Nov ZAO Devz chat review; the lane's 7 Nov ZOE and ZAO Devz upgrade audit.
- ZAOOS #4260 (`bot/src/devz/FOLD-INTO-ZOE.md`, branch `zoe-devz/devz-fold-plan`), read 2026-11-07.
- ZAODEVZ/iman-desk #162, #168, #169 (states read 2026-11-07, all OPEN).
- Group-rule ideas in `concierge.ts:49` credit Dvl's Mojo's personal system prompt (c) 2026, as the file itself does.
