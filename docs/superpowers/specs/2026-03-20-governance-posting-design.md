# Governance-Powered Publishing — Design Spec

> **Date:** March 20, 2026
> **Status:** Approved — ready for implementation
> **Feature:** Community proposes content → Respect-weighted voting → auto-publishes to @thezao

---

## What We're Building

A governance feature where ZAO community members propose content (announcements, messages, curated highlights) and if it reaches 1000+ Respect-weighted votes, it automatically publishes to the official @thezao Farcaster account.

**Note:** @thezao is a SEPARATE account from @bettercallzaal (FID 19640). The @thezao account will have its own FID + signer. Zaal provides signer access.

---

## Content Types

| Type | Example |
|------|---------|
| **Announcements** | "ZAO OS shipped the ecosystem page" |
| **Community messages** | Member-proposed casts voted on by community |
| **Curated highlights** | Music shares, member spotlights, build-in-public updates |

All three types use the same threshold mechanism.

---

## Threshold: 1000 Respect-Weighted Votes

- Each voter's vote is weighted by their cumulative Respect balance
- A proposal needs voters whose combined Respect totals 1000+
- Example: 10 members with 100 Respect each = 1000 threshold met
- No time limit — proposal stays open until threshold met or author withdraws
- Once threshold met → auto-publish to @thezao Farcaster (Phase 1), then Bluesky (Phase 2)

---

## Flow

```
1. Member creates "publish proposal" on /governance page
   - Writes the exact text to be posted
   - Selects type (announcement / message / highlight)
   - Optional: attaches image URL

2. Proposal appears on governance page with Respect-weighted voting
   - Shows current vote total vs 1000 threshold
   - Progress bar visualization

3. Members vote (weighted by their Respect balance)
   - Vote FOR = add their Respect to the total
   - Vote AGAINST = no effect on total (just recorded)

4. When threshold (1000) is reached:
   - Auto-publish to @thezao Farcaster account via Neynar managed signer
   - Mark proposal as "published"
   - Post includes attribution: "Proposed by @{author} • Approved by ZAO governance"

5. Phase 2: Also cross-post to @thezao Bluesky
```

---

## Database

New columns on `proposals` table (or new `publish_proposals` table):

```sql
-- Option: extend existing proposals table
ALTER TABLE proposals ADD COLUMN publish_text TEXT;
ALTER TABLE proposals ADD COLUMN publish_type TEXT CHECK (type IN ('announcement', 'message', 'highlight'));
ALTER TABLE proposals ADD COLUMN publish_image_url TEXT;
ALTER TABLE proposals ADD COLUMN published_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN published_cast_hash TEXT;
ALTER TABLE proposals ADD COLUMN respect_threshold INTEGER DEFAULT 1000;
```

---

## Environment Variables

```env
# @thezao official account (SEPARATE from app FID 19640)
ZAO_OFFICIAL_FID=<thezao-fid>
ZAO_OFFICIAL_SIGNER_UUID=<neynar-managed-signer>
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `POST /api/proposals` | existing | Extended to support `publish_text` field |
| `POST /api/proposals/vote` | existing | After vote, check if threshold met → trigger publish |
| `POST /api/publish/farcaster` | new | Internal: publishes to @thezao via Neynar |

---

## Phase 1: Farcaster Only
- Publish to @thezao Farcaster account
- Neynar managed signer for @thezao
- Attribution in cast text

## Phase 2: Add Bluesky
- Cross-post to @thezao Bluesky
- Same threshold, simultaneous publish

---

## Safety

- Published text is EXACTLY what was proposed — no modification
- Only Respect holders can vote (prevents sybil)
- Author can withdraw proposal before threshold
- Admins can veto (emergency stop)
- Rate limit: max 3 published proposals per day to prevent spam
