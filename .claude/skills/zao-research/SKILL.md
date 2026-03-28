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
- Put recommendations/decisions at the TOP — readers get value in 30 seconds
- Include a "Reference Implementations" section when open-source code was found
- Update `research/README.md` index in the appropriate topic category

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
- **NEVER write vague recommendations** like "consider using X." Say "USE X because [reason], here's how it fits ZAO OS's stack."
- **NEVER omit sources.** Every claim from external research must have a linked source. Every code reference must include repo, file path, and license.
- **NEVER forget to update the index.** A research doc that isn't in `research/README.md` is invisible.
- **NEVER copy code without checking the license.** MIT/Apache-2.0 = safe. AGPL = viral, flag it. No license = assume proprietary.

## Research vs Reality: Known Discrepancies

Research docs contain aspirational designs that may not match what's actually built:

- **Doc 4 (Respect tokens)** describes tiers and decay — ZAO uses NO tiers and NO decay
- **Doc 50 (Complete Guide)** is the canonical reference but needs regular updates
- **Doc 58 (Respect Deep Dive)** has on-chain data but aspirational parameters
- **Sprint plans** in `docs/superpowers/plans/` may reference outdated assumptions

When in doubt, check `community.config.ts` and the actual API routes for ground truth.

## Quality Checklist (Score Every Output Against This)

Before saving any research doc, verify ALL 8 items:

- [ ] Recommendations/key decisions at the top (not buried in body)
- [ ] Specific to ZAO OS (references tech stack, community size, or codebase paths)
- [ ] Numbers, versions, and dates included (not vague "recently" or "many")
- [ ] Sources linked at the bottom with URLs
- [ ] Cross-referenced with existing research or codebase state
- [ ] Actionable (tells you what to DO, not just what exists)
- [ ] Open-source code searched (grep.app / GitHub / known reference repos)
- [ ] Reference implementations documented with repo, license, and key patterns (if applicable)

**Scoring:** Count passing items out of 8. Target: 7/8 or 8/8 on every doc. If score < 6/8, revise before saving.

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
- [Doc 43 — WebRTC Audio Rooms](../43-webrtc-audio-rooms-streaming/)
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
