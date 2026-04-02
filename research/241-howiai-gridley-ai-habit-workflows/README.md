# 241 — HowiAI: Gridley's AI Habit Workflows for Daily Operations

> **Status:** Research complete
> **Date:** April 1, 2026
> **Goal:** Extract actionable patterns from Hilary Gridley's "How I AI" framework and apply them to ZAO OS daily workflows

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Daily narration workflow** | USE the "Yapper's API" pattern — narrate work to Claude Code instead of logging manually. ZAO already has `/standup` (`.claude/skills/standup/SKILL.md`) but it only reads git history. Upgrade it to accept verbal narration context |
| **Observation over configuration** | STOP pre-documenting preferences in CLAUDE.md that change often. USE memory system (`~/.claude/projects/.../memory/`) to let patterns emerge from repeated interactions instead |
| **Complexity earns its keep** | USE the "1-week manual test" rule before building integrations. ZAO has 11+ skills — audit which ones earn daily use vs which are aspirational |
| **10x impact test for delegation** | USE this framework to decide what to delegate to `/autoresearch` vs do manually. Delegate: research, formatting, scheduling. Keep: creative direction, community voice, strategic priorities |
| **30-day habit formation** | BUILD a 30-day onboarding for new ZAO contributors using Claude — daily 2-minute AI tasks adapted to music community context |

## Comparison: AI Workflow Approaches

| Approach | Setup Cost | Maintenance | Personalization | Best For |
|----------|-----------|-------------|-----------------|----------|
| **Gridley "Yapper's API"** (narrate to terminal) | 0 — just talk | Zero — AI calibrates automatically | High — learns from behavior | Solo founders, daily ops |
| **Structured skills** (ZAO's current `/standup`, `/z`) | Medium — write SKILL.md files | Low — git-driven | Medium — reads code not intent | Engineering updates, status |
| **Full automation** (hooks, crons, Zapier) | High — config + debug | High — breaks when APIs change | Low — rigid rules | Repetitive tasks with stable inputs |

Gridley's insight: 80% of imagined workflows don't survive 1 week of real use. ZAO should bias toward the narration approach for content/community work while keeping structured skills for engineering.

## ZAO OS Integration — 5 Concrete Actions

### 1. Upgrade `/standup` to Accept Context Beyond Git

Current `/standup` (`.claude/skills/standup/SKILL.md`) only reads `git log`. Gridley's narration approach means the skill should also accept freeform input about community activity, conversations, and decisions.

**How:** Add an optional `context` parameter: `/standup shipped broadcast OAuth, had a great call with Steve about ZAO Stock, 3 new members joined`

### 2. Add a `/reflect` Skill for End-of-Day Pattern Recognition

Gridley's strongest insight: AI learns your patterns through observation, not configuration. A `/reflect` skill would:
- Read today's git activity + any narrated context
- Compare against memory entries for recurring patterns
- Surface insights: "You've shipped music features 4 of the last 5 days — content pipeline hasn't moved"

**File:** `.claude/skills/reflect/SKILL.md`

### 3. Apply the 10x Impact Test to Skill Audit

Run each of ZAO's 11 skills through Gridley's filter:

| Skill | 10x improvement matters? | Verdict |
|-------|--------------------------|---------|
| `/standup` | No — formatting is commodity | KEEP delegated, upgrade with narration |
| `/zao-research` | No — gathering is commodity | KEEP delegated |
| `/autoresearch` | No — iteration is commodity | KEEP delegated |
| `/ship` | No — shipping is mechanical | KEEP delegated |
| `/z` | No — status checking is commodity | KEEP delegated |
| `/vps` | No — prompt generation is mechanical | KEEP delegated |
| Content voice/angle | YES — this is Zaal's brand | DO YOURSELF (per feedback memory: always brainstorm with Zaal first) |
| Community engagement | YES — relationships matter | DO YOURSELF |
| Strategic priorities | YES — founder judgment | DO YOURSELF |

### 4. Implement the "1-Week Manual Test" Before New Skills

Before creating new `.claude/skills/` files, manually do the workflow for 5+ days. Track in memory whether it sticks. Only invest in a skill after proven daily use.

### 5. Build-in-Public Content Pipeline Using Narration

Gridley's pattern maps directly to ZAO's build-in-public approach (`feedback_build_public.md`):

```
Morning: Narrate priorities to Claude → stored in memory
During day: `/standup` captures git + narrated context
Evening: `/reflect` identifies patterns + content angles
Weekly: Patterns become Farcaster threads, not just tweets
```

This replaces the current flow where `/standup` only captures code changes, missing the community/creative work that's equally important to ZAO's story.

## Gridley's 4-Step Problem-Solving Framework

Applicable to every ZAO feature decision:

1. **Define the problem** — write success criteria (not "add music feature" but "artists can share a track and get 5+ reactions within 24 hours")
2. **Brainstorm and prioritize** — use `/autoresearch:plan` or brainstorming skill to generate 10+ approaches, score against criteria
3. **Develop a plan** — use superpowers planning skills to create actionable steps
4. **Validate** — keep humans in control. Zaal reviews creative direction, community reviews governance

ZAO already has pieces of this (brainstorming skill, planning skills) but doesn't enforce the "define success criteria first" step. Add it to the brainstorming skill prompt.

## Gridley's 30-Day Habit Framework — ZAO Contributor Version

Adapt for onboarding new ZAO community members to AI-assisted participation:

| Week | Focus | ZAO Example |
|------|-------|-------------|
| 1 | Find 1 daily use case | Use Claude to draft a Farcaster cast about music you're listening to |
| 2 | Refine prompting | Add specific adjectives: "write this like a music journalist, not a press release" |
| 3 | Build evaluation criteria | "Does this sound like something I'd actually say in the Discord?" |
| 4 | Mental shift — thinking with AI | Use Claude to prep for fractal meetings, draft proposals, analyze governance votes |

## Key Numbers

- **80%** of imagined workflows don't survive 1 week (Gridley's observation)
- **30 days** to form an AI habit (aligned with habit-formation science)
- **2 minutes/day** — Gridley's minimum daily AI interaction target
- **11 skills** currently in ZAO's `.claude/skills/` directory
- **164+ research docs** in ZAO's library (commodity research — delegate)
- **$20/mo** Claude Pro or **$100/mo** Max — the tools Gridley's framework assumes

## Sources

- [How I Run My Life in Claude Code — Hilary Gridley](https://hils.substack.com/p/how-i-run-my-life-in-claude-code)
- [How I Use AI to Solve (Almost) Any Problem — Hilary Gridley](https://hils.substack.com/p/how-i-use-ai-to-solve-almost-any)
- [Making AI a Habit — Hilary Gridley](https://hils.substack.com/p/making-ai-a-habit)
- [WriterBuilder — HowiAI](https://www.writerbuilder.com/howiai)
- [Charter — How AI Power User Hilary Gridley Goes Beyond the Basics](https://www.charterworks.com/hilary-gridley-power-user/)
