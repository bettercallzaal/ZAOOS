---
topic: farcaster, business
type: prep
status: actionable
last-validated: 2026-07-18
related-docs: 1094-empire-builder-clanker-farcaster-deep-dive-jul14, 1095-farcaster-dead-revival-sparkz-timing, 1326-culture-coins-meme-engine-sparkz-synthesis, 1490-creator-coins-ecosystem-jul2026
original-query: "Prep doc for Clanker + Empire Farcaster space, 2026-07-23 10am ET"
tier: STANDARD
---

# 1491 — Clanker + Empire Farcaster Space: Prep Doc (2026-07-23, 10am ET)

> **Goal:** Arm Zaal to get maximum value from the joint Clanker + Empire Farcaster space on Thursday 2026-07-23, 10am ET. Covers what's confirmed, what's unknown, what to listen for, and what to ask or DM afterward. Source: doc 1092 (Zaal x Adrian call 2026-07-14), doc 1094 (Empire API + Clanker v5 research), doc 1325 (Chris Dolinski call 2026-07-17).

---

## Context: Why This Space Matters for Sparkz

Sparkz is built on two infrastructure layers: **Clanker** (token launch, fee routing) and **Empire Builder** (booster management, staking, leaderboard, rewards). This joint space is the first public alignment event between those two teams since Zaal's private call with Adrian (Empire) on 2026-07-14. It's the window to:

1. Get the Clanker v5 timeline from the source (critical for Sparkz's Sep 2026 window)
2. Learn if the "tokenless Empire" endpoint Adrian mentioned is coming publicly
3. Position Sparkz as the flagship creator-coin product built on their joint stack
4. Connect with other builders who will be active on the same infrastructure

---

## What We Know Going In

### Clanker v4 (current)
- Stable and production-ready. Fee-split: up to 7 recipients, admin-changeable post-launch.
- CEF: $8M deployed, buying 14% of CLANKER supply. Active grant program for builders.
- $49.8M total fees to date. ~$81.5M Clanker ecosystem market cap.
- **Decision already made (doc 1094b):** Do NOT wait for v5. Launch Sparkz on v4 now.

### Clanker v5 (in audit)
- Status as of 2026-07-14: in third-party security audit. No ship date.
- The space may surface a timeline. Listen carefully — if v5 ships before Sep, it changes the Sparkz v2 roadmap. If no ETA, confirms the doc 1094b "ship on v4 now" decision.

### Empire Builder (current)
- Write API: fully public, 15 endpoints (booster management, staking, leaderboard CRUD, reward/distribution recording). No partner gate.
- **Open question (doc 1094 decision #5):** The "attach token to tokenless Empire" endpoint Adrian mentioned on the 2026-07-14 call is NOT in the public docs. It was presented as private/whitelisted. This space is the next opportunity to ask Adrian about it publicly or DM him.
- If this endpoint exists, it enables the core Sparkz mechanic: a spark (tokenless) graduates to a token while the Empire booster stack stays intact.

### Neynar / Farcaster relationship
- Neynar acquired Farcaster (October 2025). Clanker is now under Neynar's umbrella.
- Protocol-level channel support is still undrafted as a FIP (doc 1094c). Live ground.

---

## Questions to Ask (or DM Afterward)

**On Clanker:**
1. "What's the realistic timeline for v5 shipping?" — binary: Q3 2026 (in-window) or Q4+ (out of window)
2. "For the Clanker Ecosystem Fund — how do creator-coin launchers (not meme coin launchers) qualify? Is there a product category?"
3. "Is there any plan to add native multi-recipient split support inside Clanker, or does Empire remain the canonical layer for that?"

**On Empire Builder:**
4. "Adrian — is the 'attach an existing Empire stack to a token that was tokenless' endpoint something that will be public? It was mentioned on the 2026-07-14 call." (This unlocks Sparkz's spark→token migration path)
5. "What's the recommended UX for a creator who builds an Empire booster stack before launching a Clanker token? Are there examples in the wild?"

**On the joint stack:**
6. "Are Clanker and Empire planning any joint distribution mechanics — e.g., a combined launch surface where Empire's leaderboard is part of the Clanker mint flow?"

---

## What to Listen For (Without Asking)

| Topic | What to note |
|-------|-------------|
| v5 features | Any changes to fee routing, multi-recipient, or governance mechanics that would affect Sparkz's 1/1/98 split model |
| CEF grant priorities | Which product categories get funded — is there a "creator tools" bucket, or just "meme infrastructure"? |
| Empire v2 plans | Any roadmap items for Empire's staking/booster mechanics — especially if they're planning to merge with Neynar's social graph |
| Other builders on the call | Who's also building creator-economy products on this stack? Potential peers, partners, or competitors |
| Protocol FIP mentions | Any references to channels-going-protocol-level (the FIP Zaal was considering, doc 1094c) |

---

## Positioning Opportunity

Sparkz is the only documented product building the full Clanker + Empire stack with a "tokenless first, token optional" architecture. Most builders on this infrastructure are meme coin launchers, not creator-economy products.

If there's a Q&A:
> "We're building Sparkz — a creator-coin launcher that uses the tokenless Energy phase first and Clanker+Empire only when the creator's community is ready. We'd love to know how other builders are structuring the pre-launch phase on Empire before the Clanker mint. Any examples or docs?"

This question:
- Identifies Sparkz as a genuine builder (not a question-asker)
- Surfaces whether anyone else is doing the tokenless-first pattern
- Creates a natural follow-up conversation with Adrian and any similar builders

---

## Post-Space Actions

| Action | When |
|--------|------|
| DM Adrian about the tokenless→token endpoint | During or immediately after the space |
| Note any CEF grant criteria mentioned → apply | If creator-tools category exists |
| Note who else is building creator-economy products on Clanker/Empire | Build a short list for Sparkz partnership pipeline |
| Update doc 1094b if v5 timeline is shared | Same day |
| Update Warpee query Q3 (Empire Builder reputation) if new info surfaces | Same day |

---

## Also See

- [Doc 1094 - Empire Builder API + Clanker v5 deep dive](../1094-empire-builder-clanker-farcaster-deep-dive-jul14/)
- [Doc 1092 - Zaal x Adrian Empire Builder call (2026-07-14)](../1092-zaal-adrian-empire-builder-deep-dive-jul14/)
- [Doc 1095 - Farcaster dead/revival/Sparkz timing](../1095-farcaster-dead-revival-sparkz-timing/)
- [Doc 1490 - Creator coins ecosystem snapshot Jul 2026](./1490-creator-coins-ecosystem-jul2026/)
- [Doc 1477 - Warpee query plan](./1477-warpee-query-plan/) — Q3 (Empire reputation) and Q4 (Clanker failure modes) would complement what's said at this space

## Sources

- [FULL] Doc 1094 — Empire Builder write API catalog, Clanker v5 status, Farcaster protocol updates (2026-07-14)
- [FULL] Doc 1092 — Zaal x Adrian call recap (2026-07-14)
- [FULL] Doc 1325 — Zaal x Chris Dolinski call (2026-07-17) — action: "attend the Clanker + Empire teams conversation Thursday 10am ET"
- [PARTIAL] Public Clanker stats (CEF, $49.8M fees, $81.5M market cap) per doc 1490 sourcing
