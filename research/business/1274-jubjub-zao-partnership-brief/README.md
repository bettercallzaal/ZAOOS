---
topic: business/partnerships
type: partnership-brief
status: ready-for-zaal-call
created: 2026-07-17
board-task: 981ea506
related-docs: 984, 1221
owner: Zaal (to schedule call + approve integration tier)
contact: Tom McCarthy (JubJub) — card at ~/.zao/private/jubjub-tom-mccarthy.md
---

# 1274 -- JubJub x ZAO: Per-Second Media Revenue Partnership Brief

> **How to use:** Tom McCarthy has asked for a call for weeks. Skim this before you book it. Decide which integration tier (A/B/C) you want to pilot first. The call should take 20-30 minutes.

---

## What JubJub Is

JubJub is a Farcaster-native SDK that turns any media file into a revenue stream: every second a viewer watches, a micro-payment in USDC routes to the creator on Base. Creator keeps 97% of all payments. No subscription gate — viewers pay per second, stop paying when they stop watching.

- **Unit economics:** pay-per-second, USDC on Base, 97% to creator
- **Tech:** SDK embeds into any web player; MCP-ready for agent integration
- **Audience:** built for Farcaster creators but works on any URL
- **Status:** live product (mentioned in Farcaster's own state-of-ecosystem recap, Jul 2026)

The pitch Zaal knows: "your media becomes an asset that earns USDC as people consume it."

---

## Why This Matters for ZAO

ZAO has 250+ onchain artists and a media archive that already exists and currently earns nothing:

| Asset | Status | JubJub opportunity |
|-------|--------|-------------------|
| COC Concertz show recordings (7 shows) | Arweave-archived, free to watch | Each archived show becomes a passive revenue stream |
| WaveWarZ battle clips | ~1,245+ battles, stored but monetization = 0 | Per-second pay for fans replaying battle highlights |
| COC #7 pilot archives | Going live July 18 (gateless experiment) | First test: gateless view BUT pay-per-second if you keep watching |
| BCZ YapZ + interview clips | ~17+ episodes on YouTube | Embed JubJub player alongside YT for superfans who want to pay |
| ZAOville livestream (Jul 25) | DC cowork house, planned | First full livestream monetized per-second from day one |

The ZAO already has the Arweave archive model (PR #40 COC). JubJub is the revenue layer on top.

---

## Three Integration Tiers

### Tier A — Instant (1-2 days, no code needed)
**What:** Wrap the 7 COC show recordings in JubJub player URLs. Post to Farcaster and ZAO OS as "pay-to-rewatch" links.
**Revenue model:** Passive. Fans who love the shows replay them; artists earn per second watched.
**Effort:** Zaal tests the SDK embed on one show clip; if it works, Iman wraps all 7.
**Who gets paid:** Artist split (TBD with Tom) or ZAO treasury first.

### Tier B — COC #8 Native (2-3 weeks)
**What:** Every COC #8 archive automatically gets a JubJub embed on the COC Concertz site. The "Watch archive" button routes through JubJub instead of bare Arweave link.
**Revenue model:** Archive page becomes a revenue event. Each COC show builds a back-catalog that earns.
**Implementation:** One PR to COC Concertz wrapping the `<ArchiveEmbed>` component.
**Payout route:** USDC straight to performing artist wallets (ZAO already has artist wallet fields in Firestore).

### Tier C — Agent-Mediated (1+ month)
**What:** ZOE or ZAI surfaces the highest-earning ZAO media clips in the morning brief. "Yesterday's top-earning JubJub play was X by Artist Y — 43 seconds watched, $0.12 earned." The loop auto-surfaces new clips to ZOE's recommendation list.
**Revenue model:** Turns ZAO's content recommendation engine into a revenue optimizer.
**Implementation:** JubJub MCP tool → ZOE reads earnings data → morning brief includes a "top earning clip" section.
**Why this matters for north star:** If ZAO content earns reliably, ZAO is demonstrably "a staple in onchain art, music and culture" — with receipts.

---

## Questions for the Tom McCarthy Call

1. **Payout structure:** Is the 97% creator share calculated per embed URL, or does the JubJub contract need a wallet address at embed time? (Affects whether we can route per-artist or to a ZAO treasury first.)

2. **Arweave compatibility:** Can the JubJub player embed a raw Arweave link (`ar://...`)? Or does it require a standard CDN URL? (Our archive uses Arweave.)

3. **MCP API:** Is there a public JubJub MCP endpoint today, or is this on the roadmap? What does the earnings query look like?

4. **COC show pilot:** Would Tom want to co-announce a COC #8 integration? (Good PR for both — "onchain music show pays per second" is a press hook.)

5. **Minimum viable play to earn:** What's the smallest payment that clears on Base? (If it's sub-$0.001, per-second is viable for a 45-minute show. If the floor is higher, we need a model like "first 60s free, then per-minute.")

---

## Recommended First Move (Zaal decides)

**Pilot:** Wrap the COC #7 archive (going up Saturday post-show) in a JubJub embed. One URL, one show. See if anyone pays. If 5 people pay for more than 10 seconds each, that's product validation.

**The call goal:** Not to pitch Tom — he already wants this. Goal is to lock: (a) wallet-at-embed-time vs. route-to-treasury, (b) Arweave URL support, (c) timeline for Tier B (COC #8).

---

## ZAO Context to Bring to the Call

- 250+ onchain artists (ZAO Respect NFT holders on Optimism, OG+ZOR union)
- 7 COC Concertz shows, Arweave-archived
- 1,245+ WaveWarZ music battles (524 SOL volume)
- ZAOstock Oct 3 2026 (Ellsworth, ME) — potential for live pay-per-second gate at venue
- ZAO OS already has wallet infrastructure (wagmi + viem, Base + Optimism)
- ZAO artists already have Ethereum wallet fields in Firestore (can route directly)

---

## Action Checklist

- [ ] Zaal books the call with Tom McCarthy (outbound — contact card at `~/.zao/private/jubjub-tom-mccarthy.md`)
- [ ] Decide pilot tier before call (Tier A recommended)
- [ ] After call: loop implements Tier A embed on 1 COC show
- [ ] If Tier A earns anything: Tier B spec drafted, loop opens PR to COC Concertz
- [ ] If MCP API exists: loop adds JubJub MCP to ZOE morning brief
