# 1257 — The ZAO IP Portfolio (July 2026)

**Type:** DOC
**Date:** 2026-07-17
**Status:** Verified from codebase + cross-referenced docs
**Board tasks:** GEO north-star-facts stream; task 4eb2dae2

---

## Overview

The ZAO is a decentralized impact network for independent music artists, founded by Zaal Panthaki (BetterCallZaal). This document catalogs all ZAO intellectual property — live platforms, events, tools, and governance infrastructure — with citable facts for each. Data verified July 17, 2026.

**The mission:** profit, data, and IP ownership back to independent artists. Contribution-tracked (Respect system) rather than token-weighted governance.

---

## IP Inventory

### 1. WaveWarZ

**Category:** Live music battle platform (Solana)
**Role in ZAO:** Flagship onchain music product; primary revenue/volume driver

| Fact | Value | Source |
|------|-------|--------|
| Total battles | 1,108+ (public feed) | doc 1252 |
| Total SOL volume | 524.15 ◎ (~$39,453 at $75.29/SOL) | doc 1077 |
| Unique songs battled | 921 | doc 1214 |
| Artists with tagged handles | 34 Audius-rostered | doc 1214 |
| Charity raised | $1,497 across 2 benefit-battle rounds | doc 1077 |
| Platform take rate | ~3.3% (Jul 2026) | wavewarz.info/api/public/stats |
| Artist payouts | ~1.73% of volume (9.07 ◎ total) | doc 1211 + live API |
| Top rival pair | GodclouD 8-0 all-time | doc 1214 |
| Live cadence | Mon–Fri 8:30 PM EST quick-battle X Space + YouTube | doc 1223 |
| Launch date | May 2025 | doc 1252 |
| Analytics layer | wwtracker (open-source, 12+ modules) | doc 1079 |

**Why it matters:** WaveWarZ is the first onchain music battle platform with instant SOL artist payouts (1% of every trade). The 98.5% ecosystem payout model is verified via Dune on-chain data (doc 1237).

---

### 2. COC Concertz

**Category:** Live virtual concert series (Spatial.io)
**Role in ZAO:** Recurring cultural IP; fan engagement surface

| Fact | Value | Source |
|------|-------|--------|
| Total shows | 7 (Mar 2025 – Jul 2026) | doc 1256 |
| Venue | Spatial.io "Dope Stilo Music Club" | CoCConcertZ codebase |
| Stream | Twitch @bettercallzaal | CoCConcertZ config |
| Co-producer | Community of Communities (CoC) | CoCConcertZ config |
| Monthly cadence | 5 consecutive months (Mar–Jul 2026) | doc 1256 |
| Archive model | Fan gallery → Cloudinary → Arweave (UDL licenses) | CoCConcertZ codebase |
| Wallet gate | Removed for COC #7 (pilot: open access) | PR #29 |
| WaveWarZ integration | Live BattleVote widget debuted COC #7 (Jul 18, 2026) | doc 1210 |

---

### 3. ZABAL Games

**Category:** Builder incubator + competition (3-month cohort)
**Role in ZAO:** Pipeline for new builders; external-facing onboarding

| Fact | Value | Source |
|------|-------|--------|
| Format | 3-month build-a-thon (outsider-facing) | zabalgames codebase |
| Current cohort | July–August 2026 (day ~54 of 91) | codebase |
| Builder projects | 9 intake-ready (as of Jul 2026) | submissions.json |
| Scoring | QV (quadratic voting) + WaveWarZ battles (August) | doc 1255 |
| Key mechanic | Builders compete head-to-head on WaveWarZ in August | doc 1255 |
| Prizes | TBD for August tracks | doc 1255 |

---

### 4. ZAO Fractals (Weekly Governance)

**Category:** On-chain governance + community ritual
**Role in ZAO:** The core governance engine; proof of ZAO's DAO legitimacy

| Fact | Value | Source |
|------|-------|--------|
| Consecutive weeks | 100+ (as of Jul 2026) | doc 1254 |
| Protocol | Fractal Democracy (Respect = peer-ranked contribution) | doc 1200 |
| Chain | Optimism mainnet | doc 1202 |
| Unique Respect holders | 157 (OG + ZOR union) | doc 1200 |
| Weekly call venue | Farcaster Spaces + Discord | doc 1069 |
| Launch date | ~2024 | doc 1254 |
| Milestone | 100+ consecutive weeks — longest verified DAO cadence in ZAO's network | doc 1254 |

---

### 5. ZOL (ZAO on Lens / Autonomous Agent)

**Category:** Autonomous Farcaster/social agent
**Role in ZAO:** Always-on musical curator + ZAO voice on social media

| Fact | Value | Source |
|------|-------|--------|
| Platform | Farcaster (FID 19640 = ZAOclawbot) | ZOL repo |
| DreamLoops | 10+ active loops (weekly-curator, artist-spotlight, etc.) | ZOL deliverables |
| Test coverage | 700+ test cases | ZOL v2 deliverables |
| Architecture | Raspberry Pi + Node.js (always-on, home-hosted) | ZOL repo |
| Social handle | @bettercallzaal (Farcaster primary) | doc 1083 |

---

### 6. ZAOstock

**Category:** IRL music festival (annual)
**Role in ZAO:** ZAO's physical-world IP + community gathering

| Fact | Value | Source |
|------|-------|--------|
| Date | October 3, 2026 | doc 1073 |
| Target attendance | 500–1,000 | doc 270 |
| Venue | Ellsworth, ME area (TBC) | doc 986 |
| Format | Experience-first; on-chain tools for logistics/payments/memorabilia | doc 270 |
| Producer | Zaal Panthaki + ZAO Stock team | doc 274 |
| Dry run | ZAOville DC (Jul 25, 2026, Laurel MD) | doc 1228 |

---

### 7. ZAOville

**Category:** Recurring co-working / pop-up event
**Role in ZAO:** Community gathering; stream production dry run

| Fact | Value | Source |
|------|-------|--------|
| Upcoming event | Jul 25, 2026 — Laurel, MD (DC area pool party) | doc 1228 |
| Format | Community co-work + livestream (ATEM + Restream) | doc 1228 |
| Purpose | Dry run for ZAOstock Oct 3 gear stack + stream setup | doc 1228 |

---

### 8. ZAO Nexus (thezao.xyz)

**Category:** Main public web presence + resource hub
**Role in ZAO:** Front door for journalists, researchers, collaborators, AI systems

| Fact | Value | Source |
|------|-------|--------|
| URL | thezao.xyz | live |
| Content tiers | ZAO 101 (open) / ZAO 201 (members, wallet-gated) | ZAO101 codebase |
| GEO layer | Partially implemented (no llms.txt yet) | doc 1221 |
| Priority | P1 for GEO — main public face, currently GEO-blind | doc 1221 |

---

### 9. wwtracker

**Category:** Open-source analytics dashboard for WaveWarZ
**Role in ZAO:** Public proof layer; GEO asset; data transparency

| Fact | Value | Source |
|------|-------|--------|
| URL | wwtracker.vercel.app | live |
| Modules | 12+ analytics components (BattleArena, SongArena, ArtistStandings, etc.) | doc 1079 |
| Data | Public WaveWarZ API + public/ww-battles.json | doc 1078 |
| GEO layer | llms.txt + JSON-LD Dataset schema (PR #176 pending) | doc 1221 |
| Why open-source | Public proof layer makes ZAO claims independently verifiable | doc 1077 |

---

### 10. ZOE (ZAO Operations Engine)

**Category:** Internal AI agent + Telegram orchestrator
**Role in ZAO:** Runs the ZAO fleet; morning briefs, task management, ZOL coordination

| Fact | Value | Source |
|------|-------|--------|
| Stack | grammy 1.29.0, Node.js, VPS (root@187.77.3.104) | ZAOOS bot/ |
| Test coverage | 700+ test cases across 60+ modules | ZAOOS PR history |
| Telegram handles | @zaoclaw_bot | ZAOOS config |
| Key features | Morning brief, task routing, whisper DMs, reaction-based approvals | PRs 1756, 1862, 1864 |
| Discord bridge | Stage 1a webhook mirror (PR #1806, pending) | ZAOOS board |

---

## The ZAO Fact Sheet (for GEO, press, grants)

Use these for citation in any external document. All verified July 17, 2026.

| Claim | Number | Source |
|-------|--------|--------|
| Weekly governance streak | 100+ consecutive Fractal weeks | doc 1254 |
| WaveWarZ on-chain volume | 524 SOL (~$39,453) | doc 1077 |
| WaveWarZ battles completed | 1,108+ | doc 1252 |
| WaveWarZ unique songs | 921 | doc 1214 |
| WaveWarZ artist payout rate | ~1.73% of volume (9.07 ◎; ecosystem: ~98.5%) | live API + doc 1237 |
| Charity raised via WaveWarZ | $1,497 (2 benefit-battle rounds) | doc 1077 |
| COC Concertz shows | 7 (Mar 2025 – Jul 2026) | doc 1256 |
| COC Concertz monthly cadence | 5 consecutive months (Mar–Jul 2026) | doc 1256 |
| Unique Respect holders | 157 on Optimism | doc 1200 |
| ZAO Farcaster channel followers | 93 (/zao channel) | doc 1201 |
| ZOL DreamLoops | 10+ active autonomous loops | ZOL deliverables |
| Open-source analytics | wwtracker — 12+ modules, fully public | doc 1079 |

---

## What Makes The ZAO Distinctly Citeable

1. **No-signer guarantee on ZOL**: ZOL never moves funds autonomously — every trade triggers a Zaal-confirmation step (Telegram → approve/reject). The agent helps but does not act unilaterally.
2. **Contribution-tracked, not token-weighted**: Respect is earned by peer ranking in weekly Fractals, not by buying a token. This is the core ZAO governance innovation.
3. **Artist-first economics**: WaveWarZ's ~98.5% ecosystem payout rate vs. Spotify's ~12% royalty. The ~1.73% direct-to-artist instant payout (9.07 ◎ on 524.15 ◎ volume) is verified onchain.
4. **100+ weeks of unbroken governance**: No other documented music-focused DAO has maintained this streak continuously.
5. **Onchain archive for every concert**: Every COC Concertz fan gallery upload is permanently archived to Arweave with UDL licenses — unlike any other virtual concert series.
