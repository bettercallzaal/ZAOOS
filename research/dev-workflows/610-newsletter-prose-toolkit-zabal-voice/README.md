---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-05
related-docs: 432, 549, 558, 562, 563, 607
tier: STANDARD
---

# 610 - Newsletter prose toolkit + ZABAL voice tightening

> **Goal:** Lock the rules that turn ZOE's `@newsletter` output from "competent" to "feels like Zaal wrote it after a real day." Built on doc 558 (Anbeeld 14-rule toolkit), doc 562 (humanizer post-gen pass), doc 563 (content engine patterns), and direct read of the May 5 newsletter draft Zaal flagged as "needs better writing."

## Key Decisions

| Decision | Action |
|----------|--------|
| Adopt Anbeeld principle subset for `@newsletter` | YES - "concrete specificity over polished generality", "watch suspicious regularity", "fit medium not detector" baked into NEWSLETTER_SYSTEM. |
| Treat post-gen humanizer pass as a separate optional step | YES - default `@newsletter` ships clean. `@newsletter+ <addition>` re-rolls + de-formula on a follow-up. |
| Add 8 ZABAL-voice anti-patterns to the system prompt | YES - sharper than generic "no marketing language." Examples below. |
| Add edit/iterate mode to the agent | YES - last draft persisted to `~/.zao/zoe/newsletters/<date>.md`, follow-up `@newsletter edit <text>` re-rolls including the addition. |
| Force one specific number/name/quote/place per paragraph | YES - "concrete specificity" gate from Anbeeld. Catches generic "the room", "the project", "the conversation." |
| Drop aphoristic closes by default | YES - new rule: closing line is a sentence, not a koan. |

## What was wrong with today's draft

Zaal's input had: Farcaster hackathon track, birthday weekend, hair cut, Fractal yesterday, ZAOstock cobuilds (specifically Mondays 11:30am EST in Discord), BCZ YapZ with Kenny from POIDH, first POIDH bounty wrapped, second bounty after recording.

Output kept most of those facts. What it added that hurt:

- `"Some things announce themselves quietly and you listen."` - aphoristic. Mid-paragraph koan.
- `"There is a thing that happens when you stop waiting to feel ready."` - "There is a thing that happens" is a tell.
- `"You do not become ready. You decide you are. Then the rest starts moving."` - parallel-structure closing. Anbeeld flags this exact pattern as suspicious regularity.
- `"small pieces clicking into place"` - formula phrase. Strip.
- `"Now it's Tuesday and the machine is already moving"` - "the machine" is a brand cliche, not Zaal's voice.

Output also missed Zaal's mid-stream addition (Rome conference, second main-stage ZABAL mention) - agent acknowledged in chat but did not re-roll the draft. Edit/iterate mode fixes that.

## The 8 ZABAL-voice anti-patterns to bake into the prompt

1. No aphoristic closes. The closing line is a sentence about Zaal's actual day or next step, not a universal truth.
2. No "There is a thing that happens when..." constructions. Watch for "There is" + abstract noun.
3. No "the machine," "the work," "the system" as brand-coded singulars. Name the actual thing.
4. No parallel-structure 3-beat closes ("X. Y. Then Z."). One per entry max.
5. No "small pieces clicking into place," "puzzle pieces," "the rhythm is set" as transitions.
6. No "you" as universal-second-person preachy ("You do not become ready"). Reserve "you" for direct reader address (rare and intentional).
7. No "decide you are" / "show up" / "in motion" as the philosophical turn unless Zaal supplies it. Default to a concrete observation.
8. No "loop is clean" / "rooms worth being in" abstractions. Name the rooms.

## The 6 ZABAL-voice DO rules

1. Lead each paragraph with a specific named thing. "Kenny from POIDH at 2pm" beats "today's recording."
2. One number per paragraph minimum if available (day-of-year already in header counts only there).
3. Conferences, places, dates: spell them. "Rome" is concrete. "two main stages" is concrete. Don't drift to "European recognition."
4. Mindful Moment: ground it in a sense or scene. Whatever the calendar quote is, anchor it to a thing Zaal actually saw or did today, not a universal claim.
5. Closing line is a sentence about now: "Recording at 2. Bounty live by 5." beats "Keep getting in the rooms."
6. Sentence-length variety check: if 3+ consecutive sentences are within 2 words of each other, rewrite one shorter and one longer.

## How this lands in code

- `bot/src/zoe/agents/newsletter.ts` system prompt extended with the 8 anti-patterns + 6 do-rules above (verbatim, since they map cleanly to Anbeeld principles).
- New trigger: `/^@newsletter\s+(edit|add|update|more|also)\s+(.+)/is` reads `~/.zao/zoe/newsletters/<today>.md`, includes the latest draft as context, instructs Claude to re-roll incorporating the addition while keeping voice + structure.
- New persistence: every successful `@newsletter` writes draft to `~/.zao/zoe/newsletters/<date>.md`. Next-day's call starts fresh. Same-day call uses the most recent file.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Update NEWSLETTER_SYSTEM with 8 anti-patterns + 6 do-rules | Claude | PR | This session |
| Add `@newsletter edit/add/also` trigger | Claude | PR | This session |
| Persist drafts to ~/.zao/zoe/newsletters/<date>.md | Claude | PR | This session |
| Test on Zaal's May 5 entry (Rome addition) | @Zaal | Bot test | After deploy |
| Re-validate this doc after 5 published entries | Claude | Doc update | 2026-05-12 |

## Sources

- [Doc 558 - Anbeeld WRITING.md AI-Prose Diagnostic Toolkit](../558-anbeeld-writing-md/)
- [Doc 562 - humanizer skill via blader/humanizer + last30days](../562-reddit-x-scraping-meta-eval-last30days/)
- [Doc 563 - Shann Holmberg content engine Ronin](../563-shannholmberg-content-engine-ronin/)
- [Doc 549 - Bonfire as personal second brain](../../identity/549-bonfire-personal-second-brain/)
- [Doc 432 - ZAO master positioning Tricky Buddha space](../../community/432-zao-tricky-buddha-master-positioning/)
- [Doc 607 - Three bots one substrate](../../agents/607-three-bots-one-substrate/)
- Direct read of May 5 2026 `@newsletter` output (this session, in-conversation)
