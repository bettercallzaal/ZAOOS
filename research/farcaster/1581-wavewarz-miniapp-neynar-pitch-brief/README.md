---
topic: farcaster, wavewarz, business
type: pitch-brief
status: READY — send to Arthur via Farcaster DM @arthurtruchet on Jul 25
last-validated: 2026-07-20
related-docs: 1503-jul25-partner-dm-pack, 1518-wavewarz-miniapp-phase1-spec, 1480-zao-mini-app-spec, 1548-farcaster-miniapp-ecosystem-summer2026
board-tasks: None (supports Jul 25 partner DM execution)
action-owner: Zaal (sends Farcaster DM to @arthurtruchet on Jul 25, attaches this brief)
---

# 1581 — WaveWarZ Farcaster Mini App: Neynar Submission Brief

> **What this is:** A 1-page product brief for Zaal to attach (or paste as a follow-up) when DMing Arthur (@arthurtruchet) at Neynar on Jul 25. The DM text is in doc 1503 (DM #3). This doc is what Arthur reads to decide if WaveWarZ deserves a partnership reply, promotion in the Neynar ecosystem, or technical support. Optimized for a developer relations audience.

---

## The 30-Second Version (for DM follow-up text)

> WaveWarZ is a live music battle platform on Solana where artists earn USDC even when they lose. 64 consecutive weeks of DAO governance, 100% of battle payouts going to artists. We're building a Farcaster Mini App so WaveWarZ battles can happen live inside Warpcast. Phase 1 is a read-only battle viewer (Aug 15). Phase 2 adds on-chain voting via ZOR token. Neynar's hub and API are central to the cast-layer. We'd love 5 min to share the spec and ask about the right Neynar integration path.

---

## Full Product Brief

### What WaveWarZ Is

**WaveWarZ** is an onchain music battle platform built by the ZAO community. Artists compete in live battles judged by ZOR token holders. The losing artist earns USDC too — WaveWarZ enforces that artists always get paid.

| Stat | Value |
|------|-------|
| Consecutive governance sessions | 64+ |
| On-chain record | Optimism Mainnet (OREC) |
| Battle currency | USDC on Solana |
| Token | ZOR (ERC-1155, Optimism) — earned by attendance, not purchased |
| Community | 43 verified ZOR holders |
| Farcaster | @bettercallzaal (Zaal, founder), @zolbot (ZOL agent) |
| Channel | /wavewarz on Farcaster |

### Why a Farcaster Mini App

WaveWarZ battles currently happen on `wavewarz.info` — off-Farcaster. Bringing battle state into Farcaster means:
- ZOR holders can see and vote from their Warpcast feed without leaving the app
- Battle results cast as Mini App embeds → shareable, recastable, visible
- ZAOstock (Oct 3) live battle happens on Farcaster in front of a live audience

**The vision:** WaveWarZ becomes the first live music governance battle that plays out natively in a Farcaster channel (/wavewarz), with on-chain voting and USDC payouts settling in real time.

### Phase 1: Battle Viewer (Ship Aug 15)

Read-only Mini App embedded in Farcaster casts. Shows:
- Current live battle: artists, vote counts, SOL pool, time remaining
- Last completed battle: winner, loser, payout amounts
- Platform summary: total battles, total SOL paid to artists

**Stack:** frames.js on Next.js, deployed on Vercel. No wallet connection in Phase 1.

**Neynar integration points (Phase 1):**
- Cast publication via Neynar hub (when publishing battle result casts)
- Neynar API for channel feed queries (ZOL reads /wavewarz to surface battle results)

### Phase 2: Battle Voter (Sep 2026)

Adds on-chain voting inside the Mini App:
- Connect Phantom/Solana wallet
- Cast vote for active battle via WaveWarZ smart contract
- Vote history + earnings display

**Why this matters for Neynar:** Phase 2 is a real-money governance interaction inside Farcaster. We're looking for Neynar's guidance on the right approach for signer management inside a Mini App (Managed Signers vs. self-custodied) and whether Neynar has a partner path for Mini Apps that do on-chain voting.

### Phase 3: Full Governance (Oct 2026, ZAOstock)

- ZOR holder governance interface
- Community battle proposals
- Live voting on stage at ZAOstock (first time in-person + on-chain Farcaster governance)

---

## Why This Matters for Neynar

**ZAO is one of Farcaster's most consistent governance communities.** 64+ consecutive Thursday sessions, every session recorded on Optimism Mainnet. The governance isn't hypothetical — it's been running weekly for over a year.

WaveWarZ is the first application of that governance to live music. If it works, it's a compelling Farcaster use case story: "artists earn USDC even when they lose, judged by token holders who earned their tokens by showing up."

**What we're asking for:**
1. 5 min to share the Phase 1 spec
2. Neynar's guidance on the right signer management approach for a Phase 2 voting Mini App
3. Whether Neynar has a featured Mini App program we should apply to

---

## The Ask in One Sentence

We're building a live music governance Mini App on Farcaster — we'd love Neynar's input on the right integration path as we go from Phase 1 (viewer) to Phase 2 (on-chain voter).

---

## Relevant Links

| Resource | URL |
|----------|-----|
| WaveWarZ platform | wavewarz.info |
| ZAO | thezao.xyz |
| ZAOOS (public research corpus) | github.com/bettercallzaal/ZAOOS |
| ZOL agent | @zolbot on Farcaster |
| /wavewarz channel | warpcast.com/~/channel/wavewarz |
| Phase 1 spec (doc 1518) | ZAOOS research/technology/1518-wavewarz-miniapp-phase1-spec |

---

## Sources

- Doc 1503 (Jul 25 partner DM pack — DM #3 = Arthur/Neynar; contains DM draft text)
- Doc 1518 (WaveWarZ Mini App Phase 1 spec — the spec to share with Arthur)
- Doc 1480 (Full WaveWarZ Mini App spec)
- Doc 1548 (Farcaster miniapp ecosystem summer 2026 — competitive context)
- Board: "Submit WaveWarZ mini-app to Arthur (Neynar), Jul 25 deadline"
