---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-07-14
related-docs: 991, 1088, 1092, 988, 1094a, 1094b, 1094c
original-query: "[DISPATCH] Deepen the research base for zaalcaster's Empire Builder + Clanker build (PRs #89-93 in bettercallzaal/zaalcaster; parent plan doc 1088, latest grounding doc 1092). Three dimensions: (1) Empire Builder's full write API surface, (2) Clanker v5 status, (3) Farcaster protocol updates (channels-to-protocol, agent FIDs, SIWN changes)."
tier: DISPATCH
---

# 1094 - Empire Builder write API + Clanker v5 + Farcaster protocol deep dive (2026-07-14)

> **Goal:** Push the research base further on the three subjects zaalcaster's Empire Builder build touches - Empire Builder's write API, Clanker's version status, and Farcaster protocol changes - so the next build slices (booster management, staking, token launch timing, any FIPs) are grounded in verified current facts, not the May-2026 snapshot docs 582/583/361/584 left off at.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Reasoning |
|---|----------|----------------|-----------|
| 1 | Build zaalcaster's booster/staking management UI now | YES, it's unblocked | Sub-doc 1094a found all 15 Empire Builder write endpoints publicly documented with full field-level specs - no partner gate, same `EMPIRE_BUILDER_API_KEY` PR #91 already uses. |
| 2 | Wait for Clanker v5 before any zaalcaster token launch | NO - v5 is not live and has no ETA | Sub-doc 1094b confirms v5 is still in third-party security audit as of 2026-07-14. Doc 988's "wait for v5" branch should be closed out; launch on current Clanker (v4) whenever Zaal is ready. |
| 3 | Write the "channels going protocol-level" FIP Zaal mentioned | YES | Sub-doc 1094c found no existing proposal - genuinely open ground. |
| 4 | Write the "FIDs for droids/agents" FIP Zaal mentioned | NO | Sub-doc 1094c found this capability already exists (Clanker droids already have their own FIDs today); redirect that energy or reframe as an agent-labeling proposal instead. |
| 5 | Chase Adrian for the attach-token-to-tokenless-empire endpoint | STILL PENDING, still worth chasing | Confirmed absent from Empire Builder's public docs (1094a) - it really is the private/whitelisted endpoint Adrian offered on the 2026-07-14 call (doc 1092), not something we missed in the docs. |

## Synthesis

Three sub-docs, one thread connecting them: **zaalcaster's Empire Builder integration is more unblocked than doc 1092 alone suggested, and its Clanker token-launch plan (doc 988) is less blocked by external timing than doc 988 itself assumed.**

- **1094a (Empire Builder write API)**: doc 1092 found one write endpoint by accident (a partner mentioned it existed, then it turned out to be in the public gitbook all along). This research read the ENTIRE authenticated API section methodically and found 14 more - booster management, staking, leaderboard CRUD, and reward/distribution recording, all fully specified. This unlocks doc 1088's Phase 2b (booster rule engine) with real endpoints to build against, not speculation.
- **1094b (Clanker v5)**: doc 988 (zaalcaster's token launch plan, written 2026-07-07) explicitly left "Monday-on-current-Clanker vs wait-for-v5" as an open decision. This research closes it: v5 is in audit, no ship date, so there's nothing to wait FOR right now. The fee-split mechanics Adrian described live on the 2026-07-14 call (doc 1092) - admin-changeable recipients, up to 7 at launch - are confirmed accurate against Clanker's own docs.
- **1094c (Farcaster protocol)**: the two FIP ideas floated on the same call split cleanly - "channels to protocol level" is real, undrafted work; "FIDs for droids" turns out to already exist, so writing that FIP would duplicate a shipped capability.

## Also See

- [1094a - Empire Builder write API catalog](1094a-empire-builder-write-api-catalog/)
- [1094b - Clanker v5 status](1094b-clanker-v5-status/)
- [1094c - Farcaster protocol updates](1094c-farcaster-protocol-updates/)
- [Doc 1092](../1092-zaal-adrian-empire-builder-deep-dive-jul14/) - the call that seeded all three research threads.
- [Doc 1088](../../business/1088-zaalcaster-empire-builder-coinz-crowdfunding/) - the phased build plan 1094a's booster-API findings unblock (Phase 2b).
- [Doc 988](../../business/988-zaalcaster-token-launch-plan/) - the token plan 1094b's v5 finding resolves an open question on.

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|-------------------|
| Build zaalcaster's booster management UI against the 1094a catalog | @Zaal | PR | 2026-07-28 | PR opened in bettercallzaal/zaalcaster |
| Update doc 988 to close the v5-timing open question using 1094b's finding | @Zaal | Doc edit | 2026-07-17 | Doc 988 references doc 1094b, "wait for v5" branch removed |
| Draft the channels-protocol-level FIP | @Zaal | Doc / FIP draft | 2026-07-28 | Draft posted to farcasterxyz/protocol discussions or captured as a ZAOOS doc |
| Re-fetch the 8 remaining leaderboard-creation type schemas (only token-holders was fully captured in 1094a) | @Zaal | Research | 2026-07-21 | Follow-up doc or PR updating 1094a |

## Sources

Aggregate of 1094a (16 URLs, all FULL except the 8 unfetched leaderboard-type variants), 1094b (15 URLs, 2 PARTIAL - X/Twitter fetch limits), 1094c (10 URLs, 2 PARTIAL - agent-produced secondary summaries). Full source lists live in each sub-doc.
