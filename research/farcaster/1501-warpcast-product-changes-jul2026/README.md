---
topic: farcaster
type: action-map
status: research-complete
last-validated: 2026-07-18
related-docs: 984-farcaster-ecosystem-recap-jul2026, 1094c-farcaster-protocol-updates, 1494-miniapp-analytics-distribution, 1274-jubjub-zao-partnership-brief, 308-farcaster-ecosystem-spring-2026
original-query: "What has changed in Warpcast (the app) since Neynar acquired Farcaster in October 2025? What does ZAO need to do differently now?"
tier: STANDARD
---

# 1501 — Warpcast Product Changes Jul 2026: What Changed + ZAO Action Map

> **Goal:** Synthesize the Warpcast-level product changes since the Neynar acquisition (October 2025) into an explicit ZAO action map. The protocol changes are in doc 1094c; this doc is about the app surface. Source: doc 984 (Farcaster's own state-of-ecosystem recap) + related docs.

---

## The Big Picture: Warpcast Is Now a Product Suite

Pre-acquisition Warpcast was a social feed client. Since Neynar acquired Farcaster, Warpcast has shipped five distinct primitives in 9 months: live audio (Spaces), interactive in-feed apps (Snaps), media monetization (JubJub), photo minting (fotocaster), and collaborative AI art (imago). Plus two wallet upgrades: private wallets and limit orders.

For ZAO, this means Warpcast is no longer just "where ZAO casts." It's a multi-surface environment where ZAO's products (WaveWarZ battles, ZABAL content, music archive) can be embedded, monetized, and discovered without any additional infrastructure.

---

## What Changed: Product-by-Product

### 1. Spaces (Live Audio)

**What it is:** Live audio conversations inside Warpcast. Any user can start a Space; others can join, listen, or speak. Recordable via Juke.

**What exists now:**
- Spaces are live and available to all Warpcast users
- Farcaster explicitly routes recordings through Juke ("you can record them on juke now")
- ZAO has an existing Juke partnership (doc 695/712/792)

**ZAO action:**
- Zaal should host Farcaster Spaces — the Clanker+Empire space on Jul 23 (10am ET) is the immediate example. ZOE announces the space cast before it goes live.
- Every COC Concertz prep/recap, Sparkz update, or WaveWarZ artist announcement is a Space candidate.
- Each Space recording goes to Juke → JubJub revenue layer (doc 1274 Tier A/B) on top.

**What's NOT needed:** any new code. Warpcast Spaces are built into the Warpcast client. Starting one requires no developer account.

---

### 2. Snaps (Interactive In-Feed Units)

**What it is:** Mini-apps embedded directly inside casts — buttons, sliders, polls, transaction prompts — without opening a full miniapp. Built on `@farcaster/snap` SDK + Hono framework.

**What exists now:**
- ZAO has already shipped 3 snaps: zabal-snap, nouns-snap, duodo-snap (doc 308)
- All 3 use `@farcaster/snap-hono`
- Warpcast added composer-native snap prompting ("prompt-a-snap from the composer")
- Snapathon, snapfest, and "snapchella" all happened — snaps are a live ecosystem

**ZAO action:**
- **Build WaveWarZ battle-vote snap:** A cast with [Vote A] / [Vote B] buttons inline, connecting to the existing WaveWarZ battle resolution logic. This is the highest-ROI ZAO snap because it turns every ZOE battle announcement cast into an interactive voting surface — no link-tap needed.
- The technical template already exists (zabal-snap as base + WaveWarZ contract as backend). This is a 1-2 day build for an engineer who knows the codebase.
- Prioritize over a new miniapp — snaps have lower friction (no full-page open) and higher cast-level conversion.

**What "prompt-a-snap" means:** Warpcast now lets users generate a snap by prompting from the composer. This is AI-generated interactive casts. ZAO could potentially prompt a snap for a one-off event (e.g., a ZAOville RSVP snap from the composer without writing code).

---

### 3. JubJub (Per-Second Media Revenue)

**What it is:** SDK that turns any media URL into a pay-per-second stream. Viewers pay USDC on Base per second they watch; creator keeps 97%.

**What exists now:**
- JubJub is live and mentioned in Farcaster's official ecosystem recap
- Tom McCarthy (JubJub CEO) has requested a call with Zaal for weeks (board task: 981ea506)
- Doc 1274 is a complete partnership brief with 3 integration tiers ready for the call

**ZAO action:**
- Close the Tom McCarthy call — or at minimum respond: "We're piloting Tier A (COC archive embed) after COC #7 archives go live July 18."
- Tier A = no code, 1-2 days: wrap existing COC show recordings in JubJub player. First media monetization ZAO has ever had on its archive.
- The board task says "reschedule or close the warm Juke lead" — this is the JubJub call, not Juke. Make the decision (even "delay to after ZAOville") so it doesn't stay open indefinitely.

---

### 4. Cast Translation (Multilingual Feed)

**What it is:** Automatic translation of casts into the viewer's language. Farcaster described it as "everyone reads everyone now."

**What exists now:**
- Live for all Warpcast users
- ZAO casts (COC announcements, WaveWarZ battle calls, ZABAL updates) auto-translate for non-English viewers

**ZAO action:**
- **None required for existing casts** — they auto-translate.
- **Proactive move (optional):** ZOE can start including a second language in high-reach casts (e.g., the WaveWarZ Africa Battle Week announcement might include a Portuguese line or a Swahili greeting given the Africa focus in doc 1415). Auto-translation + intentional bilingual hooks = double signal to global audiences.

---

### 5. Private Wallets + Limit Orders

**What it is:** Native in-app wallet (private key, local to device) + limit-order trading inside Warpcast.

**What exists now:**
- Private wallets are live for Warpcast users on iOS/Android
- Limit orders available in the wallet tab

**ZAO action:**
- No direct action. WaveWarZ runs on Solana (SOL pool), not ETH/Base. The Warpcast wallet is ETH/Base.
- **Indirect:** If Sparkz launches on Base (Clanker is on Base), the wallet-native limit order feature becomes relevant for Sparkz token holders. Note for Sparkz V1 planning but don't block on it now.

---

### 6. Mini App Store + Discovery Upgrades

**What it is:** Warpcast's built-in mini-app catalog now has categories, tags, and discovery surfaces. Apps that publish a valid `/.well-known/farcaster.json` with full metadata (subtitle, desc, category, tags, screenshots) get listed.

**What exists now:**
- Full manifest spec is documented in doc 1494
- WaveWarZ miniapp manifest checklist in doc 1494 includes all required fields

**ZAO action:**
- Publish the `/.well-known/farcaster.json` at `wavewarz.info` before Jul 25 (send-to-Arthur deadline per doc 1494)
- Submit to Warpcast mini-app catalog via Neynar developer portal AFTER Phase 1 goes live
- Category: `games`. Tags: `music`, `battles`, `prediction`, `wavewarz`, `web3`

---

### 7. Feed Algorithm: Spam Label Removed + Scam App Detection

**What it is:** Warpcast dropped the spam label from the home feed ("home feed dropped the spam label"). Also deployed scam mini-app detection ("don't click the airdrop things").

**What exists now:**
- Feed is now without explicit spam labeling; the Neynar quality score is the actual gate
- Scam mini-apps are actively detected and surfaced as warnings

**ZAO action:**
- **ZOL/ZOE:** Keep Neynar score high (doc 892 decision #1). Quality > quantity. No spray casting.
- **WaveWarZ miniapp:** ensure the battle voting UI never resembles airdrop flows. Avoid "connect wallet to claim" language anywhere in the miniapp. Scam detection is ML-based; legitimate apps can be false-positived by pattern-matching.

---

## ZAO Action Priority Matrix

| Action | Product | Effort | Deadline | Priority |
|--------|---------|--------|----------|----------|
| Host Clanker+Empire Farcaster Space | Spaces | Zero (just attend) | Jul 23 10am ET | IMMEDIATE |
| Publish wavewarz.info manifest | Mini App Store | 1 day (dev) | Jul 25 | HIGH |
| Send WaveWarZ app to Arthur/Neynar | Mini App Store | 30 min (email/DM) | Jul 25 | HIGH |
| Close/reschedule Tom McCarthy (JubJub) call | JubJub | 15 min (reply) | ASAP | HIGH |
| Pilot JubJub embed on COC show archives (Tier A) | JubJub | 1-2 days | Jul 31 | HIGH |
| Build WaveWarZ battle-vote snap | Snaps | 1-2 days (eng) | Aug 1 | MEDIUM |
| Host recurring ZAO Farcaster Spaces | Spaces | Ongoing | Monthly | MEDIUM |
| Add bilingual hook to Africa Battle Week casts | Translation | Per cast | Sep | LOW |
| Sparkz Base wallet integration notes | Private Wallets | Planning | Q3 | LOW |

---

## What's NOT Changed (Worth Noting)

- **Farcaster protocol itself:** channels, hub message types, FID registration — no breaking changes since Snapchain launch. See doc 1094c.
- **SIWN / zaalcaster auth:** No 2026 release of `neynarxyz/siwn`. PR #90 is still current. No action needed.
- **ZOL's Neynar score mechanics:** same weekly-refresh system as doc 892. No new score signals.

---

## Also See

- [Doc 984 - Farcaster ecosystem recap mid-2026](../984-farcaster-ecosystem-recap-jul2026/) — source for all Warpcast changes listed here
- [Doc 1094c - Protocol-level changes](../1094-empire-builder-clanker-farcaster-deep-dive-jul14/1094c-farcaster-protocol-updates/) — protocol vs. app distinction
- [Doc 1494 - Miniapp analytics + distribution](./1494-miniapp-analytics-distribution/) — manifest checklist, notification system
- [Doc 1274 - JubJub × ZAO partnership brief](../../business/1274-jubjub-zao-partnership-brief/) — Tom McCarthy call prep, 3 integration tiers
- [Doc 308 - Farcaster ecosystem spring 2026](./308-farcaster-ecosystem-spring-2026/) — ZAO's existing 3 snaps (zabal, nouns, duodo)
- [Doc 892 - Being an agent on Farcaster 2026](./892-being-an-agent-on-farcaster-2026/) — Neynar score, ZOL operating norms

## Sources

- [FULL] Doc 984 — Official Farcaster state-of-ecosystem recap (Jul 2026)
- [FULL] Doc 308 — ZAO's 3 snaps in production (zabal-snap, nouns-snap, duodo-snap)
- [FULL] Doc 1274 — JubJub × ZAO partnership brief
- [FULL] Doc 892 — Farcaster agent operating landscape (Neynar score, spam/moderation patterns)
- [PARTIAL] Doc 1094c — Protocol-level changes since Neynar acquisition (SIWN, channels, FIDs)
