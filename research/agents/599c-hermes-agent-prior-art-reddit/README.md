---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-03
related-docs: 309, 312, 483, 599, 599b
tier: STANDARD
---

# 599c - Hermes Agent (NousResearch) Prior Art - Naming Collision Watch + Lessons

> **Goal:** ZAO has `bot/src/hermes/` ("Hermes"). r/hermesagent on Reddit is NousResearch's separate project with the same name. Decide rename / scope, lift profile + workflow lessons.

## Recommendations First

| Decision | Reasoning |
|----------|-----------|
| KEEP "Hermes" name internal-only for now | ZAO Hermes is bot/src/hermes for PM queries. NousResearch Hermes is a public agent framework. Collision matters only if ZAO publishes the bot. |
| FLAG rename decision before any public release of ZAO Hermes | If publishing as standalone repo or marketing, prefix (e.g. "ZAO Hermes") or rename. Trademark risk minimal but search-engine confusion real. |
| LIFT 4 lessons from r/hermesagent into ZAO bot README | "Don't pile every skill into default profile" maps directly to QuadWork agent design. |
| INVESTIGATE NousResearch Hermes Agent feature set | If NousResearch ships profiles + skills + memory + sessions out-of-the-box and is open source, it may be a better base than rolling our own. |

## What r/hermesagent Is

NousResearch's Hermes Agent. Active subreddit. Top contributors include u/teknium-official, u/NousResearch. Features mentioned: skills, memory, session search, multiple providers, CLI + gateway support.

That's the same surface area as Claude Code + ZAO bot stack combined. Worth a deeper look before building more in-house.

## The Reddit Post (Item #8)

| Field | Value |
|-------|-------|
| Title | "One month with Hermes Agent - what I wish I knew earlier" |
| Author | u/itsdodobitch |
| Score | 160, 30 comments |
| URL | reddit.com/r/hermesagent/comments/1t29ogw/ |

### 4 Lessons from the Post

1. **Don't try to build the whole machine on day one.** Hermes is powerful enough to make you overestimate readiness. Start with one boring-reliable workflow, then add.

2. **Profiles are not just convenience - they're how you keep the agent useful.** Don't turn the default profile into a backpack of every skill, every tool, every half-baked idea. Segment.

3. **It will break - that's where the useful part starts.** Fixing a broken workflow clarifies the original intent.

4. **Default memory setup is suboptimal.** Comment from u/Almarma: "holographic memory" recommended over default.

### Anti-Pattern Reported

u/Beckland: asked Hermes to set up a profile -> it installed a second instance of Hermes. Profile management UX rough.

## Map to ZAO Bot Architecture

| r/hermesagent Lesson | ZAO Bot Equivalent |
|----------------------|--------------------|
| Profiles for segmentation | QuadWork's 4-agent split (Head/Dev/RE1/RE2). Same pattern, different name. |
| External memory | ZAO uses Supabase + agent_squad event log + project memory files. |
| Skills, not retraining | ZAO uses Claude Code skills + bot/src/hermes/commands.ts. |
| Don't pile into default | ZAO scope: PM queries only in bot/src/hermes. Other concerns (regen, zsfb) split into separate modules. |

ZAO is already aligned with these lessons. Fixing collision is the only urgent action.

## Naming Collision Severity

| Risk | Level |
|------|-------|
| Trademark | Low (NousResearch unlikely to enforce) |
| SEO confusion | Medium (if ZAO publishes) |
| Internal confusion | None (clear scope: ZAO bot is internal) |
| Documentation/onboarding | Medium (anyone googling "Hermes Agent ZAO" hits NousResearch first) |

## Also See

- [Doc 483](../483-hermes-agent-local-llm-framework/) - **Existing ZAO research on Nous Hermes + Qwen3.6-27B for per-brand bot fleet on VPS 1.** This is the same upstream project the r/hermesagent subreddit covers. Doc 599c (this) supersedes the naming-collision question; Doc 483 stays canonical for the local-LLM framework decision.
- [Doc 312](../../312-claude-skills-marketplace-ecosystem/) - Skills ecosystem
- [Doc 599](../../events/599-inbox-digest-2026-05-03/) - parent
- [Doc 599b](../../farcaster/599b-gmfc101-wordaday-mini-app-patterns/) - Adjacent agent stack lessons

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Spike: install NousResearch Hermes Agent locally, compare to current ZAO bot | @Zaal | Spike | This month |
| Add "ZAO Hermes" prefix to any bot/src/hermes user-facing string | @Zaal | Code edit | Before public ship |
| Subscribe to r/hermesagent | @Zaal | Reddit | Today |
| Add disclaimer to bot/src/hermes/README.md ("not affiliated with NousResearch Hermes") | @Zaal | Doc edit | Before public ship |

## Sources

- [r/hermesagent - "One month with Hermes Agent"](https://www.reddit.com/r/hermesagent/comments/1t29ogw/one_month_with_hermes_agent_what_i_wish_i_knew/)
