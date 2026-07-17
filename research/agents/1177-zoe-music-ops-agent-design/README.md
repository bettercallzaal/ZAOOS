---
topic: agents
type: design
status: design-complete
last-validated: 2026-07-16
related-docs: 1133, 365, 472, 649
original-query: "ZOE music-ops agent: adopt Recoupable's MCP compound-task + artist-centric data models (board task 00264928)"
tier: STANDARD
---

# 1177 - ZOE Music-Ops Agent Design: Artist-Centric Data Layer

> **Trigger:** Doc 1133 (Recoupable study) identified Recoupable's data transformation layer as the key architectural difference between naive AI music ops and effective AI music ops. This doc translates those lessons into a concrete ZOE design.

## The Core Problem Recoupable Solved

**Naive approach (what ZOE currently does for music queries):**
→ Dump raw Spotify/social JSON to the agent → agent pattern-matches → noisy output

**Recoupable's approach:**
→ Ingest raw data → **transform into artist-centric context structures** → agent works on clean, opinionated data → consistent, actionable output

The transformation layer is the moat. It requires knowing which data matters for music ops (fan segmentation, engagement velocity, playlist placement weight) vs. which is noise (raw impression counts, follower counts without engagement rate).

## Proposed ZOE Music-Ops Agent Architecture

### Layer 1: Data Collectors (existing or planned)

| Collector | Source | Current ZOE state |
|-----------|--------|-------------------|
| Farcaster fan data | Neynar API | ✓ (neynar.ts) |
| Streaming metrics | Spotify API | ✗ planned |
| Social engagement | X/Instagram | ✗ planned |
| ZAO on-chain activity | Base RPC | partial (fc-identity.ts) |

### Layer 2: Artist Context Builder (the key new component)

This is what Recoupable does better. For a given artist query, build:

```typescript
interface ArtistContext {
  // Identity
  artistFid: number;
  artistHandle: string;
  walletAddress?: string;

  // Engagement quality (not raw counts)
  engagementRate: number;      // reactions / impressions (Farcaster)
  communityScore: number;      // ZAO quality score from fc-identity
  recentCastVelocity: number;  // casts per week (activity signal)

  // Content performance
  topPerformingCasts: {
    content: string;
    reactions: number;
    recasts: number;
    postTime: string;
  }[];

  // ZAO-specific
  zaoConcertHistory: number;   // how many COC shows they've participated in
  respectReceived: number;     // from memory-events retention data
  genreTags: string[];         // from Bonfire memory graph
}
```

The agent never sees raw API JSON. It gets a pre-built `ArtistContext`. This prevents the "100 JSON fields to reason about" problem.

### Layer 3: Compound Task Executor (Recoupable's pattern)

Multi-step workflows chaining: collect → enrich → generate → queue for approval

```typescript
// Example: "Generate a promo post for WaveWarZ artist"
async function musicOpsCompoundTask(artistFid: number, task: MusicOpsTask) {
  const context = await buildArtistContext(artistFid);        // Layer 2
  const draft = await generateDraft(context, task);           // Claude call
  await queueForApproval(draft, task.targetPlatforms);        // Approval queue
}
```

Key principle from Recoupable: the approval queue is not an afterthought — it IS the product. Humans edit drafts in a queue, not raw AI output.

### Layer 4: Approval Queue (new ZOE capability)

Recoupable asserts this cuts from 30h/week to 3-5h. The design:
- ZOE generates draft posts for WaveWarZ/COC artists
- Posts queue in an approval table (Supabase `music_ops_drafts`)
- Zaal or artist reviews → approves/edits → auto-schedules to Postiz
- ZOE learns from edit patterns (what gets changed vs. accepted)

## Implementation Priorities

| Component | Effort | Value | Priority |
|-----------|--------|-------|----------|
| `buildArtistContext()` using existing Neynar + fc-identity data | Medium | High | **P1** |
| Approval queue schema (`music_ops_drafts` table) | Low | High | **P1** |
| ZOE tool: `generate_artist_promo` | Medium | High | **P2** |
| ZOE tool: `get_fan_demographics` (wrapping Neynar) | Low | Medium | **P2** |
| Spotify metrics integration | High | Medium | **P3** |

## Stealable Patterns from Recoupable

1. **Never dump raw JSON** — always transform to artist-centric concepts first
2. **Compound tasks over chat** — the agent executes a workflow, not a single response
3. **Approval queue as the UX** — generated content goes into a queue, not directly posted
4. **Cost transparency** — "$50-100/mo tool budget" (Recoupable recommends transparency with artists)
5. **Artist profile as persistent context** — not rebuilt per-query; cached with TTL

## Immediate Next Action

Build `buildArtistContext(fid)` using what ZOE already has:
- `neynar.getUserByFid(fid)` → username, bio, follower count
- Recent casts via Neynar → compute `engagementRate` and `recentCastVelocity`
- `getQualityScore(walletAddress)` from fc-identity → `communityScore`

This gives ZOE a meaningful artist context builder before any new API integrations. Estimated: 1 PR, ~200 lines including tests.
