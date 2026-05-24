---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
related-docs: "311, 549, 715, 726"
original-query: "research the writing skills - 'this is terrible with all the info you have'. Why is the drafted Firefly post weak when the agent has access to brand.md, humanizer, socials, prior posts, and full ecosystem context? What's the missing trigger?"
tier: QUICK
---

# 731 - Writing-skills audit: the gap between "have the rules" and "follow them every time"

> **Goal:** Stop shipping generic AI-flavored copy from this agent. Audit what writing assets the ZAO ecosystem already has, name the gap that produced the weak 2026-05-23 Firefly draft, and define one trigger that closes it.

## Key Decisions

| # | Decision | Owner |
|---|----------|-------|
| 1 | **Add a hard CLAUDE.md rule: any external-facing copy (announcement, post, one-pager, newsletter, social) MUST run through the 4-step drafting protocol below before reaching the user. No more "I drafted 4 versions" without it.** | @Zaal (rule), agent (compliance) |
| 2 | **Update the `/socials` skill to enforce step 1-3 of the protocol in its system prompt.** Today it has voice rules but no hard requirement to (a) ask angle first, (b) read `bot/src/zoe/brand.md`, (c) run output through humanizer. | @Zaal |
| 3 | **Add a new `feedback_drafting_protocol` memory** so the protocol applies even when no skill is invoked - the agent reaches for it on any "draft / write / post / announce" verb. | @Zaal |

## The gap (what produced today's weak Firefly draft)

The agent had all of this and used none of it correctly:

| Asset | What it gives | Was it consulted? |
|-------|---------------|-------------------|
| `bot/src/zoe/brand.md` (112 lines, 5KB) | Voice rules + 5 worked Firefly examples + format rules (2 sentences/para, blank lines, phone-readable) | **No** |
| `~/.claude/skills/humanizer/SKILL.md` v2.5.1 | Wikipedia-derived list of AI tells + cleanup | **No** |
| `~/.claude/skills/socials/skill.md` | Platform-specific generator with BCZ voice rules | **No** |
| `feedback_brainstorm_before_writing` memory | "Always brainstorm with Zaal before writing articles/content - need his voice + angle first" | **No - drafted 4 versions without asking angle** |
| `feedback_firefly_only` memory | Default Firefly for FC+X | Yes (got this right) |

Result: a draft that named the news (`ZABAL Games + ZAOstock announce together`) but had no Zaal voice, no hook, no specific stake, no anchor to the year-of-ZABAL frame, no echo of any of the 5 brand.md examples. Technically met the brief; missed the mark.

## What "good" looks like (taken from `bot/src/zoe/brand.md` example 1)

```
Read chapter 2 of Wherever You Go, There You Are by Jon Kabat-Zinn.

An honest reckoning with why mindfulness, simple as it sounds, takes
real effort. The forces working against awareness are strong and
largely invisible to us.

Quieter work than it sounds.

https://youtu.be/Fl8soJ7xs1M
```

Patterns the agent missed:
1. **One concrete hook line first.** Not "year of ZABAL kicks off proper" - that's a brag, not a hook. Compare: "Read chapter 2 of..." is a verb on a real thing.
2. **A reckoning, not a list of bullets.** brand.md examples avoid bullet lists. Today's draft was 2 bullets - phone-readable but voice-thin.
3. **One closing line that lands.** "Quieter work than it sounds." Today's draft ended with "follow for the schedule" - a CTA, not a landing.
4. **No marketing words.** Today: "anchored," "kicks off proper" - both flagged in brand.md as banned register.

## The 4-step drafting protocol (the fix)

For ANY external-facing copy from this agent, follow in order. No skipping.

1. **Brainstorm the angle (feedback_brainstorm_before_writing).** Before drafting, ask one question: "what's the angle Zaal wants here?" Common answers: a personal reckoning, a news-as-anchor, a milestone landing, a call to a specific person. Without this the draft is generic by default.
2. **Read brand.md examples.** Open `bot/src/zoe/brand.md`. Pick the 1 of 5 examples closest to this brief. Mirror its shape (hook line, paragraph rhythm, closing line, link placement). Don't write fresh - rewrite the example with this content.
3. **Draft.** Apply format rules from brand.md (2 sentences per paragraph, blank lines, no emojis, no em-dashes, no marketing words, lead with outcome). Length per the destination table.
4. **Humanize.** Run through the `humanizer` skill's checklist before showing the user. Specifically check: inflated symbolism, promotional language, rule-of-three, AI vocabulary, negative parallelisms, filler.

Output to user: 1-2 versions max (not 4), each annotated with which example it mirrors and what angle it picks. The user picks or redirects.

## Findings (against the 2026-05-23 draft)

| Failure mode | Why it happened | Fix in protocol |
|---|---|---|
| Generic "year of ZABAL" opener | Didn't read brand.md - no example has this shape | Step 2 |
| 4 versions instead of 1-2 | Didn't ask angle - tried to cover spread | Step 1 |
| Bullet-heavy | Bullets are fine for Iman test plans, not for Firefly posts | Step 2 + brand.md examples have zero bullets |
| Marketing register ("anchored by", "kicks off proper") | No humanizer pass | Step 4 |
| Closing CTA ("follow for the schedule") | No anchor to a brand.md closing line | Step 2 |

## Recommended trigger phrases for CLAUDE.md

Add to the ZAO OS V1 `CLAUDE.md`:

> **Any external-facing copy** (Firefly post, X thread, Farcaster cast, YouTube description, newsletter, one-pager, announcement, social) follows `doc 731` 4-step drafting protocol: (1) ask angle, (2) read `bot/src/zoe/brand.md` examples, (3) draft mirroring the closest example, (4) humanize. No draft reaches Zaal without all 4. Internal copy (Iman test plans, Supabase task notes, this kind of recap doc) does not require the protocol - those are operational artifacts, not voice work.

## Also See

- [Doc 311](../../311-vibe-coded-apps-marketing-playbook/) - prior marketing patterns for vibe-coded apps
- [Doc 549](../../dev-workflows/549-21st-dev-magic-mcp/) - the `/21st` skill's draft pattern
- [Doc 715](../../events/715-session-2026-05-22-meeting-skill-diarization/) - yesterday's session recap (no writing failure)
- [Doc 726](../../events/726-session-2026-05-23-tracker-ops-pack/) - today's session recap (where this gap was exposed)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the trigger paragraph to ZAOOS `CLAUDE.md` | @Zaal | PR | Before next public draft |
| Update `/socials` skill to enforce steps 1-3 in its system prompt | @Zaal | Skill edit | This week |
| Add `feedback_drafting_protocol.md` memory referencing doc 731 | @Zaal | Memory file | Today |
| Redraft the 2026-05-23 Firefly post following the protocol + send | @Zaal | Action | Before public post |

## Sources

- [`bot/src/zoe/brand.md`](file:///Users/zaalpanthaki/Documents/ZAO%20OS%20V1/bot/src/zoe/brand.md) [FULL - voice contract + 5 worked Firefly examples]
- [`~/.claude/skills/humanizer/SKILL.md`](file:///Users/zaalpanthaki/.claude/skills/humanizer/SKILL.md) v2.5.1 [FULL - Wikipedia-derived AI-tells cleanup]
- [`~/.claude/skills/socials/skill.md`](file:///Users/zaalpanthaki/.claude/skills/socials/skill.md) [FULL - platform-specific generator]
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_brainstorm_before_writing.md` [FULL - the violated rule]
- The 4 draft versions emitted in this session 2026-05-23 22:00 ET [FULL - the failure artifact]
