---
topic: community, technology, governance
type: whitepaper-draft
status: DRAFT — Chapters 5, 6, 7. Companion to doc 1613 (Chapters 2-4). Connect to existing Draft 4.5 (Chapter 1 = research/community/051-zao-whitepaper-2026/drafts/draft-4.4.md). Rebuild spec: docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md.
last-validated: 2026-07-18
related-docs: 1613-zao-protocol-whitepaper-chapters-2-4, 101-wavewarz-zao-whitepaper, 743-wavewarz-whitepaper-v2-deep-dive, 051-zao-whitepaper-2026, 1542-zao-geo-entity-brief
board-tasks: "ZAO Protocol Whitepaper rebuild — Chapter 2 onward"
action-owner: Zaal (voice pass + diagrams); ZOE (auto-cite from Bonfire when read-path opens)
---

# 1616 — ZAO Protocol Whitepaper: Chapters 5, 6, 7 (Draft)

> **What this is:** Draft for Chapters 5, 6, and 7 of the ZAO Protocol Whitepaper rebuild. Chapter 1 = existing Draft 4.5 (`research/community/051-zao-whitepaper-2026/drafts/draft-4.4.md`). Chapters 2-4 = doc 1613. Rebuild spec: `docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md`.
>
> **Voice target:** Clear, simple, spartan. Short sentences. Active voice. Technical precision. No jargon for jargon's sake. Builder audience — founders, devs, researchers.

---

## Chapter 5 — Onchain Music Rails

The ZAO is not a streaming service. It is not a label. It is an infrastructure layer that music can run on.

Three rails make this concrete.

---

### Rail 1: WaveWarZ — Live Battle Markets

**Chain:** Solana  
**Model:** Prediction market for music battles

WaveWarZ is the live proving ground. Artists compete in 15-minute song-vs-song battles. Fans stake real SOL on the artist they think will win. Predictions trade in real-time during X Spaces and YouTube sessions hosted on weeknights at 8:30pm ET.

**Mechanics:**

When a battle opens, two Battle Vault PDAs (Program Derived Addresses on Solana) go live — one per artist side. Fans deposit SOL into whichever vault they predict will win. After judging, the battle settles onchain automatically. The winning side earns a share of the losing pool. Artists on both sides receive a payout.

That last point is structural. The loser still gets paid. WaveWarZ was designed so participating artists earn regardless of outcome. The platform charges a small fee; the rest goes to artist payouts and the winner pool.

**Current stats (July 2026):**

| Metric | Value |
|--------|-------|
| Total battles | 1,245 |
| Total trading volume | 523.991 SOL |
| Artist payouts (total) | 9.0988 SOL |
| Indexed artists | 43 |
| Governance token holders | 43 ZOR holders |

ZOR Respect holders vote on WaveWarZ platform decisions — artist rosters, charity partners, battle format. 43 wallets. No token weighting. One holder, one vote.

ZAO OS (`zaoos.com/wavewarz`) surfaces WaveWarZ data onchain via Helius RPC and the WaveWarZ intelligence dashboard. Artist pages track wins, losses, and SOL volume per wallet.

---

### Rail 2: ZAO Music — Rights and Distribution Layer

**Entity:** ZAO Music, a DBA under BCZ Strategies LLC  
**Purpose:** Music rights management and onchain royalty rails for ZAO artists

ZAO Music handles the legal and financial infrastructure that onchain music requires.

**Three-component stack:**

1. **BMI registration** — ZAO Music is registered with BMI (Broadcast Music Inc.), the largest US performance rights organization. Artists who release through ZAO Music have their compositions tracked for public performance royalties (radio, streaming, venue play).

2. **DistroKid** — Digital distribution to all major streaming platforms (Spotify, Apple Music, YouTube Music, etc.). ZAO Music uses DistroKid's label account to distribute artist releases under the ZAO Music umbrella, with direct split routing.

3. **0xSplits** — Onchain revenue splitting on Ethereum. When a ZAO Music release earns streaming royalties or onchain sale proceeds, 0xSplits routes the funds automatically to each rights holder's wallet. No middleman. No net-60 payment delays. The split is programmable and public on-chain.

The stack connects the legacy music industry (BMI tracking + DSP distribution) to onchain settlement (0xSplits). Artists get the reach of traditional distribution with the transparency of onchain royalty flows.

**Cipher** is the planned first ZAO Music release. Cipher is the first artist to go through the full ZAO Music rail: BMI registration, DistroKid distribution, and 0xSplits payout. When Cipher drops, the whitepaper will be updated with the first live proof-of-rail.

---

### Rail 3: Metadata and Discovery

**Audius API** — ZAO OS integrates Audius for artist metadata. Audius is a decentralized music streaming protocol on Solana. Many WaveWarZ artists have Audius profiles. ZAO OS pulls handles and follower counts to enrich artist cards on `/wavewarz`.

**Sound.xyz and Zora** — ZAO OS's music player integrates Sound.xyz and Zora for music NFT playback. Artists who have minted music NFTs on either platform can surface those releases inside the ZAO OS player. This is an embedded listener, not a separate purchase UI.

---

**What These Three Rails Accomplish**

| Before ZAO Music Rails | After |
|------------------------|-------|
| Artist streams on Spotify, earns $0.003/play, gets paid 6 months later | Artist distributes via ZAO Music, earns streaming royalties + onchain split, tracked in real time |
| Battle performance = no revenue | Battle performance = measurable SOL payout, verifiable onchain |
| Artist metadata scattered across handles | Artist card in ZAO OS consolidates Audius + battle history + payout record |

---

## Chapter 6 — Build on ZAO

The ZAO protocol is not a closed system. It was built to be forked, contributed to, and extended.

**ZAO OS** is the starting point.

---

### ZAO OS: The Lab Repo

**Repo:** `github.com/bettercallzaal/ZAOOS`  
**Stack:** Next.js 15 + Supabase + Neynar + XMTP + Tailwind  
**Live:** `zaoos.com` (also `thezao.xyz`)

ZAO OS is a public repository. Anyone can fork it, inspect the database schema, trace the API integrations, and build on the same foundation ZAO uses.

The stack is production-grade and intentionally standard:
- **Next.js 15** for the web app (App Router, server components, API routes)
- **Supabase** for the database, auth, and real-time subscriptions (Postgres under the hood)
- **Neynar** for Farcaster integration (cast publishing, channel reads, signerless casting)
- **XMTP** for wallet-to-wallet messaging

A builder who wants to launch a ZAO-adjacent product can fork ZAO OS and get authentication, a member database, Farcaster publishing, and a wallet messaging layer on day one.

---

### The Monorepo-as-Lab Pattern

ZAO uses a specific development pattern: **prototype in ZAO OS, graduate to a standalone repo when the product is ready for a public user base.**

Here is how it works:

1. A new product idea starts as a set of routes and database tables inside ZAO OS. It shares auth, the member database, and the Supabase instance with the rest of ZAO OS.
2. When the product needs its own domain, its own deployment pipeline, its own team, or when it would add too much surface area to ZAO OS — it graduates to its own repo.
3. The original ZAO OS integration becomes a read-only surface (API calls, embeds, links).

**Products that have graduated:**

| Product | From ZAO OS | To Own Repo | When |
|---------|-------------|-------------|------|
| COC Concertz | `/coc` routes in ZAO OS | `github.com/bettercallzaal/coc-concertz` | 2025 |
| ZAOstock | `/zaostock` routes in ZAO OS | `github.com/bettercallzaal/zaostock` | April 2026 |

**Products still in ZAO OS (lab phase):**

| Product | Route | Status |
|---------|-------|--------|
| ZABAL marketplace | `/marketplace` | Active |
| WaveWarZ dashboard | `/wavewarz` | Active |
| ZAO network map | `/network` | Active |
| Nexus member portal | `/nexus` | In rebuild |
| ZabalSocials hub | (planned) | Design phase |

FISHBOWLZ was prototyped in ZAO OS and paused without graduating. The ZAO OS residue is kept as a draft route rather than deleted — it remains a reference point if the concept resumes.

---

### Open Source Status

ZAO OS is publicly visible on GitHub. The repo is open-access — anyone can read the code.

The license situation is an open question the whitepaper will resolve explicitly once legal review completes. Current state:
- **ZAO OS**: Public, no formal open-source license declared as of July 2026
- **ZOL**: Private repo (`github.com/bettercallzaal/zol`)
- **ZAOstock**: Private repo
- **COC Concertz**: Private repo

The intention is to move ZAO OS toward a formal open-source license (likely MIT or Apache 2.0) once the first stable protocol version is tagged. The remaining repos are operational products, not open protocol infrastructure — they will stay private unless a specific partnership requires otherwise.

---

### How to Build on ZAO Today

Three entry points:

**1. Fork ZAO OS**  
Fork `github.com/bettercallzaal/ZAOOS`, deploy to Vercel, point at your own Supabase instance, swap in your Neynar API key. You have a functioning ZAO-adjacent coordination app.

**2. Read the ZAOOS research library**  
1,600+ research documents at `zaoos.com` (gated for ZAO members). Every architecture decision, every integration spec, every product design lives here. Partners and builders who want deep context get a read key.

**3. Engage at Fractal sessions**  
Every Monday at 6pm EST in Discord. Bring a project, rank contributions, earn OG Respect. This is the fastest path to Builder Hat access and OREC proposal rights.

---

## Chapter 7 — Roadmap

The ZAO builds in public, at a fixed weekly cadence. What is shipping, what is next, and what is long-term.

---

### Now: Q2-Q3 2026 Priorities

**In progress:**

| Initiative | Status | Notes |
|------------|--------|-------|
| Nexus portal rebuild | In development | Member portal redesign — `/nexus` on ZAO OS |
| ZabalSocials rebuild | Design phase | Social-links hub for ZABAL artists |
| ZAO Protocol Whitepaper | This document | Replaces Draft 4.5 as canonical protocol reference |
| ZAOstock event | Planning | October 3, 2026, Ellsworth, Maine |
| Africa Battle Week | September 26, 2026 | WaveWarZ community battle + charity vote |
| ZABAL Season 2 | Applications open August 1 | ZOR holder eligibility, new challenges |

**Gates open:**
- ZOL DreamLoops (PR #61) — automated Farcaster posting when merged
- NEYNAR_SIGNER_UUID — enables ZOL to post channel casts at /zabal
- Helius API key — enables onchain WaveWarZ tracker (replacing HTML scrape)
- Warpee query authorization — enables onchain intelligence queries against ZAO data

---

### Near: ZAOstock, October 3, 2026

ZAOstock is the ZAO's first IRL music event.

**Location:** Ellsworth, Maine  
**Date:** October 3, 2026  
**Format:** Live music + WaveWarZ IRL battle vote + ZAO governance session + artist showcase

ZAOstock is not a conference. It is a community gathering where onchain governance happens in the room. Attendees can vote on the WaveWarZ community battle live. ZOR holders who attend earn a special attendance credential. ZABAL is the medium of exchange at the event.

The event doubles as the first major proof-of-concept for the ZAO Festivals model: a recurring annual brand of IRL events where the community governs, artists earn, and the protocol settles.

---

### Near: ZAO Italy

**Bridge:** Mat Tambussi  
**Goal:** European outpost for the ZAO community

ZAO Italy is the planned second geography. Mat Tambussi, a ZAO contributor and Italian community builder, is the bridge. The model mirrors ZAO Africa: a local Fractal session, a regional WaveWarZ battle, and a community that earns OG Respect through local participation.

---

### Long-Term: ZAO Festivals Umbrella

The long-term thesis: ZAO Festivals is the recurring IRL brand.

ZAOstock 2026 is event one. If the model works — community governance from the stage, onchain artist payouts, ZABAL marketplace at the venue — the template repeats. ZAO Italy hosts ZAO Italy Fest. ZAO Africa hosts Africa Battle Week as its anchor event. Each regional chapter has its own Fractal session cadence and its own IRL gathering.

The ZAO protocol is the shared infrastructure: Fractal sessions for reputation, OREC for governance decisions, 0xSplits for payouts, ZABAL for community currency. The events are different. The protocol underneath is the same.

---

### What Is Not Changing

**Fractal Democracy cadence.** Every Monday at 6pm EST. This has not missed a week since 2024. It will not miss a week in 2026.

**Soulbound reputation.** OG Respect and ZOR Respect will stay non-transferable. Reputation requires showing up.

**Loser earns.** WaveWarZ's core mechanic — artists on both sides of a battle earn a payout — is structural. It will not change. It is what makes WaveWarZ a viable artist platform rather than a zero-sum competition.

**Open lab.** ZAO OS remains public and forkable. The monorepo-as-lab pattern continues. Products that graduate keep their connection to the ZAO network.

---

**Sources**

- `docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md` — chapter outline
- `research/wavewarz/101-wavewarz-zao-whitepaper/README.md` — WaveWarZ platform history
- `research/wavewarz/743-wavewarz-whitepaper-v2-deep-dive/README.md` — updated WW stats
- `research/community/1613-zao-protocol-whitepaper-chapters-2-4/README.md` — Chapters 2-4
- `research/community/051-zao-whitepaper-2026/drafts/draft-4.4.md` — Draft 4.5, Chapter 1 source
- `research/identity/1542-zao-geo-entity-brief/README.md` — entity facts
- `src/lib/wavewarz/constants.ts` — 43 verified ZOR holder wallets
- `CLAUDE.md` — project map, contract addresses, canonical repo list
- Board task: "ZAO Protocol Whitepaper rebuild — Chapter 2 onward"
