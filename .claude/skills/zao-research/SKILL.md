---
name: zao-research
description: Research skill for ZAO OS — search existing research library (164+ docs) + codebase + open-source code, conduct new research, and save findings in the standardized format
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

### Step 2: Search Existing Research (164+ docs)

Check [research-index.md](./research-index.md) for the full inventory, or search by topic in [topics.md](./topics.md).

Search across all research docs:
```
Grep for "keyword" in research/*/README.md
```

If existing research covers the topic, **summarize what's already known** before doing new research. Cross-reference what research says vs what the code actually does.

### Step 3: Search Open-Source Code

Search how other projects solved the same problem. Use these tools in order of preference:

**A. grep.app MCP (primary — searches 1M+ GitHub repos)**
Use the `grep` MCP tool to search across public repositories:
- Search for implementation patterns: `neynar.*webhook` in TypeScript
- Search for library usage: `@livekit/components-react` in Next.js projects
- Filter by language and repo to narrow results

**B. GitHub CLI for targeted repos**
```bash
# Search code across all of GitHub
gh search code "query" --language typescript --limit 10

# Fetch a specific file from a known repo
curl -s https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}

# Clone a reference repo for deep analysis (clean up after)
gh repo clone {owner}/{repo} /tmp/{repo}-ref
```

**C. WebFetch for specific files**
If you know the exact file URL on GitHub, fetch the raw content:
```
WebFetch: https://raw.githubusercontent.com/{owner}/{repo}/main/{path}
```

**What to look for:**
- How do other Farcaster clients (Sonata, Herocast, Nook, Opencast) handle this?
- What patterns do projects on our stack (Next.js 16, Supabase, Wagmi) use?
- Are there MIT-licensed implementations we can adapt?
- What pitfalls did other projects hit? (Check their issues/PRs)

### Step 4: Read Reference Implementations

For the best matches from Step 3, go deeper:
- Read the key files (not just snippets)
- Understand the architecture and trade-offs
- Note the license (MIT/Apache = safe to adapt, AGPL = be careful)
- Extract specific code patterns worth borrowing

Document findings in a "Reference Implementations" section (see template below).

### Step 5: Conduct Web Research (if needed)

Use WebSearch and WebFetch to gather information beyond code. Always:
- Search for the most recent information (current year is 2026)
- Fetch primary sources (official docs, specs, changelogs) not just blog posts
- Get specific numbers: versions, pricing, API limits, dates
- Check for breaking changes or deprecations in libraries we depend on

### Step 6: Save as a Numbered Research Doc

See [new-research.md](./new-research.md) for the template. Key rules:
- Next available number: check `research/` folder for highest number, use next
- Create folder: `research/{number}-{topic-name}/README.md`
- **The FIRST section after the header MUST be "## Key Decisions / Recommendations"** — this is non-negotiable. No preamble, no background, no context paragraphs before it. Readers get value in 30 seconds.
- Include a "Reference Implementations" section when open-source code was found
- Update `research/README.md` index in the appropriate topic category

### Mandatory Document Structure

Every research doc MUST follow this skeleton. Sections marked REQUIRED cannot be omitted.

```markdown
# {number} — {Title}

> **Status:** Research complete
> **Date:** {date}
> **Goal:** {one sentence}

## Key Decisions / Recommendations          ← REQUIRED, MUST be first ## section

| Decision | Recommendation |
|----------|----------------|
| ...      | USE X because [reason] |

## Comparison of Options                     ← REQUIRED, 3+ rows minimum

| Option | Col A | Col B | Col C |
|--------|-------|-------|-------|
| X      | ...   | ...   | ...   |
| Y      | ...   | ...   | ...   |
| Z      | ...   | ...   | ...   |

## ZAO OS Integration                       ← REQUIRED, must reference file paths

How this connects to the codebase. Reference specific files like
`src/app/api/...`, `src/components/...`, `community.config.ts`.

## {Additional sections as needed}

## Sources                                   ← REQUIRED, 2+ URLs minimum

- [Source 1](https://...)
- [Source 2](https://...)
```

### Step 7: Update Skill Indexes

After saving a new doc, update these files in this skill:
- `research-index.md` — add the new doc number, folder name, and topic
- `topics.md` — add to the appropriate category
- `new-research.md` — update the "current highest" number

## NEVER Do These Things

- **NEVER write generic research** that could apply to any project. Every finding must be filtered through ZAO OS's context: a 100-member gated Farcaster music community on Next.js 16 + Supabase + Neynar.
- **NEVER trust research docs over code.** If doc 4 says "respect has tiers" but `src/lib/respect/` has no tier logic, the code wins. Mark the discrepancy.
- **NEVER skip the codebase check.** Even if you think the topic is purely external, check if any part of it is already built or referenced in the code.
- **NEVER skip the open-source code search.** Even if the topic seems novel, someone has likely built something similar. Check grep.app or GitHub first.
- **NEVER write vague recommendations** like "consider using X." Say "USE X because [reason], here's how it fits ZAO OS's stack." See the Banned Phrases table below.
- **NEVER omit the comparison table.** Every research doc MUST include a markdown table comparing at least 3 options/alternatives with multiple columns. Even if the choice is obvious, show why by comparing.
- **NEVER omit sources.** Every doc MUST end with a `## Sources` section containing at least 2 clickable URLs. Every claim from external research must have a linked source.
- **NEVER omit ZAO OS file paths.** Every doc MUST reference at least 1 specific file path from the codebase (e.g., `src/app/api/...`, `src/components/...`, `community.config.ts`).
- **NEVER omit concrete numbers.** Every doc MUST contain at least 3 specific numbers (versions, prices, dates, stats, limits). No vague "recently" or "many."
- **NEVER forget to update the index.** A research doc that isn't in `research/README.md` is invisible.
- **NEVER copy code without checking the license.** MIT/Apache-2.0 = safe. AGPL = viral, flag it. No license = assume proprietary.

## Research vs Reality: Known Discrepancies

Research docs contain aspirational designs that may not match what's actually built:

- **Doc 4 (Respect tokens)** describes tiers and decay — ZAO uses NO tiers and NO decay
- **Doc 50 (Complete Guide)** is the canonical reference but needs regular updates
- **Doc 58 (Respect Deep Dive)** has on-chain data but aspirational parameters
- **Sprint plans** in `docs/superpowers/plans/` may reference outdated assumptions

When in doubt, check `community.config.ts` and the actual API routes for ground truth.

## Hard Requirements (All 6 Must Pass — Binary, No Exceptions)

Every research doc MUST pass ALL 6 of these checks. If any fails, revise before saving.

| # | Requirement | How to Verify |
|---|-------------|---------------|
| 1 | **Recommendations FIRST** | The FIRST `##` section is "Key Decisions / Recommendations" — no background, no intro, no context before it |
| 2 | **At least 1 ZAO OS file path** | Doc references a specific file like `src/app/api/...`, `src/components/...`, `src/lib/...`, or `community.config.ts` |
| 3 | **At least 3 specific numbers** | Contains 3+ concrete numbers: versions (e.g., v2.1.0), prices ($0/mo), dates (March 2026), stats (42KB bundle), limits (100 participants) |
| 4 | **Sources section with 2+ URLs** | A `## Sources` section at the bottom with at least 2 clickable URLs (docs, repos, specs) |
| 5 | **Comparison table with 3+ options** | A markdown table comparing at least 3 alternatives/options with multiple columns |
| 6 | **No vague language** | Zero instances of banned phrases (see list below) |

### Banned Phrases — NEVER Use These

The following phrases are BANNED from research output. Use the direct alternative instead.

| BANNED phrase | USE INSTEAD |
|---------------|-------------|
| "consider using" | "USE [X] because [reason]" |
| "it might be worth" | "[X] is worth it because [reason]" or "SKIP [X] because [reason]" |
| "you could explore" | "USE [X]" or "SKIP [X]" |
| "it may be beneficial" | "[X] saves [time/money/complexity] because [reason]" |
| "one option is" | "The best option is [X] because [reason]" |
| "worth investigating" | "INVESTIGATE [X] — [specific question to answer]" |
| "potentially useful" | "[X] solves [specific problem]" or "SKIP [X] — not needed because [reason]" |
| "could be interesting" | "[X] does [specific thing ZAO needs]" |
| "it depends" | State the decision for ZAO's specific context |

**Rule: Every recommendation must be a direct statement.** Not "you might want to use LiveKit" but "USE LiveKit — free tier covers 100 participants, MIT-licensed, 42KB bundle."

## Additional Quality Checks

Beyond the 6 hard requirements, also verify:

- [ ] Cross-referenced with existing research or codebase state
- [ ] Actionable (tells you what to DO, not just what exists)
- [ ] Open-source code searched (grep.app / GitHub / known reference repos)
- [ ] Reference implementations documented with repo, license, and key patterns (if applicable)

**Scoring:** All 6 hard requirements must pass (binary). Additional checks are best-effort — target 3/4 or 4/4.

## Worked Example: Good vs Bad Research Output

### BAD (generic, vague, no cross-reference, no code search):

```markdown
# WebRTC Audio Rooms
WebRTC enables real-time audio. Consider using LiveKit or Daily.
It would be good for community engagement.
```

### GOOD (ZAO-specific, actionable, cross-referenced, with reference implementations):

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

## Reference Implementations

| Project | Stars | License | Key File | What We Can Learn |
|---------|-------|---------|----------|-------------------|
| livekit/meet | 1.2K | Apache-2.0 | `app/rooms/[name]/page.tsx` | Next.js App Router + LiveKit room setup pattern |
| sonata-xyz/sonata | 2.1K | MIT | `src/components/ListeningRoom.tsx` | Music-specific room UI with track sync |

### Code Pattern Worth Borrowing

From `livekit/meet` — Room setup with Next.js App Router:
\```typescript
// app/rooms/[name]/page.tsx:15-32
export default async function RoomPage({ params }: { params: { name: string } }) {
  const token = await generateToken(params.name);
  return <LiveKitRoom token={token} serverUrl={process.env.LIVEKIT_URL} />;
}
\```

## Sources

- [LiveKit Docs](https://docs.livekit.io)
- [livekit/meet repo](https://github.com/livekit/meet) — Apache-2.0
- [Doc 43 — WebRTC Audio Rooms](../043-webrtc-audio-rooms-streaming/)
```

## Reference Repos for ZAO OS

These repos are known-good references for features in our domain. Search them first when relevant:

| Repo | License | Domain | Stars |
|------|---------|--------|-------|
| `sonata-xyz/sonata` | MIT | Farcaster music client, player, curation | 2.1K |
| `vrypan/herocast` | AGPL-3.0 | Farcaster power-user client | 800 |
| `nook-app/nook` | MIT | Farcaster reader/client | 600 |
| `farcasterxyz/hub-monorepo` | MIT | Farcaster protocol, hubs | 1.5K |
| `xmtp/xmtp-js` | MIT | XMTP messaging SDK | 500 |
| `opencast-xyz/opencast` | MIT | Minimal Farcaster client | 200 |
| `audius-protocol/audius-protocol` | Apache-2.0 | Decentralized music streaming | 500 |
| `navidrome/navidrome` | GPL-3.0 | Music streaming server | 12K |
| `funkwhale/funkwhale` | AGPL-3.0 | Federated music platform | 1.5K |

## Reference Files

- [research-index.md](./research-index.md) — full inventory of all 164+ docs
- [topics.md](./topics.md) — docs organized by category
- [search-patterns.md](./search-patterns.md) — grep/glob patterns for searching
- [new-research.md](./new-research.md) — template and process for new docs
- [project-context.md](./project-context.md) — ZAO OS tech stack, what's built, what's not
