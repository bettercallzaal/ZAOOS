---
topic: governance
type: practical-guide
status: current
last-validated: 2026-07-18
related-docs: 1200, 1201, 1202, 1254, 1423, 1531
original-query: "I earned Respect (ZOR) at the ZAO Fractal — what do I do with it? What does it unlock?"
tier: STANDARD
---

# 1532 — ZOR Respect Token: Practical Guide

> **Who this is for:** You just attended your first (or tenth) ZAO Fractal session and got ZOR Respect minted to your wallet. Now what?

---

## TL;DR

ZOR is your governance weight in The ZAO. You cannot buy it, sell it, or transfer it. You earn it by showing up and contributing. The more ZOR you hold, the more your voice weighs in ZAO governance decisions. Right now, earning ZOR is the entire point — the governance mechanisms it unlocks are actively being wired up.

---

## What ZOR Is

**ZOR** (Respect1155) is an ERC-1155 token on Optimism Mainnet:
- Contract: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- Non-transferable: cannot be sent to another wallet
- Non-purchasable: no market, no price, no trading
- Earned by: peer-ranked contribution in weekly Fractal sessions

Each Fractal session, your breakout group ranks contributions using a Fibonacci scale. Your rank translates to a ZOR minting event via the OREC contract (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`) on Optimism.

---

## What ZOR Unlocks (Current State, Jul 2026)

### 1. ORDAO voting weight

ZOR is the membership token for ORDAO — the on-chain governance layer of The ZAO. Your cumulative ZOR across all sessions = your voice in ORDAO proposals.

**Current state:** ORDAO is live on Optimism. Active governance use is early-stage — proposals are on-chain but participation is primarily through the weekly Fractal session itself. As the DAO matures, ZOR will gate formal votes, budget allocations, and partnership decisions.

### 2. Leaderboard rank and community standing

The [ZAO Fractal dashboard](https://zao.frapps.xyz) shows your cumulative Respect score, your rank among all 157 ZOR holders, and your session history. High-Respect members are visibly recognized as long-term contributors.

**Practical:** Your rank matters for reputation, for being invited to lead breakout groups, and for being recognized in public ZAO communications.

### 3. Season record

Each 12-session block is a named Season (see [doc 1481](../1481-zao-fractal-season-plan/)). Your ZOR from each season is a permanent on-chain record of which seasons you participated in and how you ranked. Season membership is verifiable on Blockscout.

**Practical:** If you're joining for WaveWarZ Africa or a future ZAO collaboration, your season record is your resume.

### 4. Hats Protocol eligibility (building)

The ZAO's org chart runs on Hats Protocol (top hat 226 on Optimism). Specific hats — roles like Facilitator, Treasury Signer, or Council Member — are designed to require a minimum ZOR balance as an eligibility check. This wires governance weight directly to role access.

**Current state:** The architecture is designed (see [doc 1307](../1307-hats-protocol-zao-org-chart/)). Eligibility modules are being deployed. As they go live, your ZOR will gate actual role access in the org.

### 5. WaveWarZ loser-earns recognition

WaveWarZ (music battle platform) has a "loser earns" mechanism that ties to ZAO governance. Artists who participate in WaveWarZ and attend Fractals are building dual proof-of-work: battle history on Solana + Respect history on Optimism. Both are being used in grant applications and partner pitches.

**Practical:** If you're a WaveWarZ artist + Fractal member, your cross-chain record is a unique credential.

---

## What ZOR Does NOT Do (Common Misconceptions)

| Misconception | Reality |
|---------------|---------|
| "I can sell my ZOR for ETH" | Non-transferable. No market exists by design. |
| "More ZOR = more money" | ZOR has no monetary value. It is governance weight only. |
| "I can delegate my ZOR to someone" | No delegation. Your weight is personal and earned. |
| "Missing one session erases my ZOR" | No. ZOR is cumulative and permanent on-chain. A missed session means no new ZOR that week, but prior sessions stay. |
| "I need to claim my ZOR" | ZOR is minted directly to your wallet after each session. No claim step. |
| "ZOR works on Base" | Optimism only. The ZAO's $ZAO identity token is on Base; Respect governance is on Optimism. |

---

## How to Check Your ZOR Balance

**Method 1: ZAO Fractal dashboard**
- Go to `zao.frapps.xyz` (requires ZAO member login)
- Leaderboard tab shows your cumulative score and rank
- Sessions tab shows your individual session history

**Method 2: Blockscout (on-chain)**
- Open: `https://optimistic.etherscan.io/token/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c#balances`
- Find your wallet address in the holder list
- Token ID varies by session — each session mints a distinct token ID

**Method 3: Cast CLI (advanced)**
```bash
cast call 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c \
  "balanceOfBatch(address[],uint256[])(uint256[])" \
  "[<your-wallet>]" "[<token-id>]" \
  --rpc-url https://mainnet.optimism.io
```

---

## How to Earn More ZOR

1. **Show up.** Every Monday at 6 pm EST, ZAO Fractal Discord voice channel.
2. **Contribute during the week.** Rankings are peer-judged on what you did for the community since last session — building, connecting, promoting, creating.
3. **Participate in breakout groups.** You must be in a group to receive a rank. Observers and late arrivals don't earn.
4. **Rank well in your group.** Fibonacci scoring: 1st = 8, 2nd = 5, 3rd = 3, 4th = 2, 5th-6th = 1. Consistent 1st–2nd place across many sessions compounds fast.

No shortcut. No purchase. Show up, contribute, get ranked.

---

## New Member Ramp (Sessions 1–12)

If you're in your first season (see [doc 1523](../1523-new-fractal-node-launch-checklist/)), here is the realistic ZOR trajectory:

| Sessions completed | Typical cumulative ZOR | What it unlocks |
|--------------------|----------------------|-----------------|
| 1–3 | 3–24 | Basic holder status; appears on leaderboard |
| 4–6 | 10–48 | Recognized as a returning member; eligible for group leadership |
| 7–12 | 20–96 | Season 1 complete; verifiable on-chain season membership |
| 13–24 (Season 2) | 40–200 | Second-season holder; eligible for Hats role gating (as deployed) |
| 25+ | 100+ | Long-term contributor; meaningful ORDAO weight |

ZOR counts vary because breakout group size, number of participants, and your relative ranking all affect the score. These are indicative, not guaranteed.

---

## ZOR vs OG Respect (Legacy)

Before Sep 2025, The ZAO distributed **OG Respect** (ERC-20, `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`). OG holders are still recognized — 122 wallets hold OG. OG and ZOR are separate tokens, both count as ZAO governance weight, but the active settlement token for new sessions is ZOR (ERC-1155) only.

If you attended sessions before Sep 2025, you may hold OG Respect in addition to ZOR. Both show up on the leaderboard under "total Respect."

---

## Questions Not Answered Here

- **ORDAO proposal mechanics:** see [doc 1312](../1312-zao-fractal-respect-governance-deepdive-jul2026/)
- **On-chain history:** see [doc 1202](../1202-fractal-onchain-settlement-history/)
- **Who holds the most ZOR:** check `zao.frapps.xyz` leaderboard (live data)
- **How the Fractal session works:** see [doc 1475](../1475-fractal-democracy-session-guide/)
- **Why non-transferable:** see [doc 1423](../1423-zao-optimism-fractal-governance-explainer/)

---

*For the canonical external reference (Wikidata, DAOstar, press): [doc 1531](../1531-zao-fractal-canonical-reference/).*
