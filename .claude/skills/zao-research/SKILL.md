---
name: zao-research
description: Research skill for ZAO OS — search existing research library (88 docs) + codebase, conduct new research, and save findings in the standardized format
user-invocable: true
---

# ZAO OS Research Skill

Use this skill when asked to research a topic for ZAO OS, find information in existing research, or add new research to the library.

## Mandatory Workflow

Follow these steps IN ORDER. Do not skip steps.

### Step 1: Search the Codebase First

Before looking at research docs, check what's actually built:

```
Grep for the topic keyword in src/ — check API routes, components, lib/
Glob for related files: src/app/api/{topic}/**/*.ts, src/components/{topic}/**/*.tsx
Read community.config.ts for any config related to the topic
```

This grounds the research in reality. Research docs may be aspirational.

### Step 2: Search Existing Research (88 docs)

Check [research-index.md](./research-index.md) for the full inventory, or search by topic in [topics.md](./topics.md).

Search across all research docs:
```
Grep for "keyword" in research/*/README.md
```

If existing research covers the topic, **summarize what's already known** before doing new research. Cross-reference what research says vs what the code actually does.

### Step 3: Conduct New Research (if needed)

Use WebSearch and WebFetch to gather information. Always:
- Search for the most recent information (current year is 2026)
- Fetch primary sources (official docs, GitHub repos, specs) not just blog posts
- Get specific numbers: versions, pricing, API limits, dates

### Step 4: Save as a Numbered Research Doc

See [new-research.md](./new-research.md) for the template. Key rules:
- Next available number: check `research/` folder for highest number, use next
- Create folder: `research/{number}-{topic-name}/README.md`
- Put recommendations/decisions at the TOP — readers get value in 30 seconds
- Update `research/README.md` index in the appropriate topic category

### Step 5: Update Skill Indexes

After saving a new doc, update these files in this skill:
- `research-index.md` — add the new doc number, folder name, and topic
- `topics.md` — add to the appropriate category
- `new-research.md` — update the "current highest" number

## NEVER Do These Things

- **NEVER write generic research** that could apply to any project. Every finding must be filtered through ZAO OS's context: a 100-member gated Farcaster music community on Next.js 16 + Supabase + Neynar.
- **NEVER trust research docs over code.** If doc 4 says "respect has tiers" but `src/lib/respect/` has no tier logic, the code wins. Mark the discrepancy.
- **NEVER skip the codebase check.** Even if you think the topic is purely external, check if any part of it is already built or referenced in the code.
- **NEVER write vague recommendations** like "consider using X." Say "USE X because [reason], here's how it fits ZAO OS's stack."
- **NEVER omit sources.** Every claim from external research must have a linked source.
- **NEVER forget to update the index.** A research doc that isn't in `research/README.md` is invisible.

## Research vs Reality: Known Discrepancies

Research docs contain aspirational designs that may not match what's actually built:

- **Doc 4 (Respect tokens)** describes tiers and decay — ZAO uses NO tiers and NO decay
- **Doc 50 (Complete Guide)** is the canonical reference but needs regular updates
- **Doc 58 (Respect Deep Dive)** has on-chain data but aspirational parameters
- **Sprint plans** in `docs/superpowers/plans/` may reference outdated assumptions

When in doubt, check `community.config.ts` and the actual API routes for ground truth.

## Quality Checklist (Score Every Output Against This)

Before saving any research doc, verify:

- [ ] Recommendations/key decisions at the top (not buried in body)
- [ ] Specific to ZAO OS (references tech stack, community size, or codebase paths)
- [ ] Numbers, versions, and dates included (not vague "recently" or "many")
- [ ] Sources linked at the bottom with URLs
- [ ] Cross-referenced with existing research or codebase state
- [ ] Actionable (tells you what to DO, not just what exists)

## Worked Example: Good vs Bad Research Output

### BAD (generic, vague, no cross-reference):

```markdown
# WebRTC Audio Rooms
WebRTC enables real-time audio. Consider using LiveKit or Daily.
It would be good for community engagement.
```

### GOOD (ZAO-specific, actionable, cross-referenced):

```markdown
# 63 — WebRTC Live Audio Rooms for ZAO

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Evaluate WebRTC solutions for live listening rooms in the /zao Farcaster channel

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Provider** | LiveKit Cloud — free tier covers 100 participants (matches ZAO's 100-member community) |
| **Integration** | `@livekit/components-react` works with Next.js 16 App Router |
| **Existing work** | Doc 43 researched this; `src/components/music/` has audio player but no live rooms yet |

## Why LiveKit Over Alternatives

| Provider | Free Tier | Next.js SDK | Farcaster Integration |
|----------|-----------|-------------|----------------------|
| LiveKit | 100 participants | Yes (@livekit/components-react) | None native, but castable |
| Daily | 200 participants | Yes | None |
| 100ms | 10K minutes/month | Yes | None |

LiveKit wins: MIT-licensed server, self-hostable on Vercel Edge, smallest bundle (42KB).

## Sources

- [LiveKit Docs](https://docs.livekit.io)
- [Doc 43 — WebRTC Audio Rooms](../43-webrtc-audio-rooms-streaming/)
```

## Reference Files

- [research-index.md](./research-index.md) — full inventory of all 88 docs
- [topics.md](./topics.md) — docs organized by category
- [search-patterns.md](./search-patterns.md) — grep/glob patterns for searching
- [new-research.md](./new-research.md) — template and process for new docs
- [project-context.md](./project-context.md) — ZAO OS tech stack, what's built, what's not
