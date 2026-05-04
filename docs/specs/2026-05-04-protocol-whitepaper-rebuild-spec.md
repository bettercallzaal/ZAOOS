# ZAO Protocol Whitepaper — Rebuild Spec

> **Goal:** Replace research/community/051-zao-whitepaper-2026 (Draft 4.5, March 2026, unedited since) with a PROTOCOL whitepaper. Target: builders, partners, infra people. Existing draft is community-positioning; new draft is "how to build on the ZAO protocol."

**Date:** 2026-05-04
**Owner:** Zaal Panthaki
**Existing draft:** `research/community/051-zao-whitepaper-2026/README.md` (Draft 4.5, March 2026, unedited)
**Target output:** `research/community/<NN>-zao-protocol-whitepaper-v1/` OR new repo `zao-protocol`
**Source for sections:** ZABAL Bonfire graph (~870 nodes as of 2026-05-03)
**Coordinate with:** Nexus rebuild (#14), ZabalSocials rebuild (#16), Farcaster + X ingest pipeline (next)

---

## Why a Protocol Whitepaper (not Community)

Existing Draft 4.5 reads like a TED talk for artists: streaming pays $0.003, labels take 80%, ZAO teaches you to fish. That's the COMMUNITY pitch — and it works for that audience.

The protocol whitepaper is a different document for a different reader:
- **Reader:** another founder, dev, infra partner, ecosystem fund, governance researcher, journalist with technical chops
- **Question they ask:** "what is THE ZAO PROTOCOL — not the org, the protocol — and how do I build on it / verify it / fork it?"
- **Answer they need:** architecture diagrams, contract addresses, token mechanics, governance patterns, onchain music rails, what's open-sourced

Without this doc, partners + builders + infra people can't engage at depth. They get the community story (Draft 4.5) and bounce.

---

## Voice + Reuse Plan

- Keep Draft 4.5's COMMUNITY framing as **chapter 1** ("why we exist") — don't rewrite what works.
- Add new chapters 2-7 covering protocol depth.
- Tone matches Zaal's daily Paragraph series ("Year of the ZABAL"): clear, simple, spartan, short impactful sentences, active voice. (Confirmed style guide from ChatGPT 2025-08-18 grilling Q13.)

---

## Section Outline (proposed)

### Chapter 1 — Why The ZAO (REUSE Draft 4.5)
Pull the strongest 1-2 pages from existing draft. The streaming/data/IP problem framing + "community first, technology second" positioning. Don't rewrite.

### Chapter 2 — The Protocol Architecture (NEW)
- High-level: ZAO is not one chain or one app. It's a coordination layer between artists, audience, and onchain primitives.
- 4 layers: Identity (ENS + ZID + Hats roles) / Reputation (OG + ZOR Respect, soulbound, on Optimism) / Coordination (ZABAL coin on Base + Empire Builder + SongJam) / Distribution (ZAOOS gated client + WaveWarZ + Cipher)
- Diagram: layer boxes + which contracts live where
- **Bonfire query for source material:**
  ```
  RECALL: list every contract address on the ZAO protocol with chain, type, and purpose.
  ```

### Chapter 3 — Token Mechanics (NEW)
- ZABAL: launched Jan 1 2026 on Base, front-end coin of BCZ ecosystem. Empire Builder + SongJam integrations.
- ZOUNZ: ZBAAL Nounz, holds 20% reserve of ZABAL token. ERC-721 NFT on Base.
- ZOLs: liquid contribution credits awarded for activity. Winning leaderboards earns ZOUNZ.
- OG Respect: ERC-20 soulbound on Optimism (0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957). 2% decay, curation-mining tiers.
- ZOR Respect: ERC-1155 soulbound on Optimism (0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c). Different tier system.
- The ETH→ZABAL pool quirk: route ETH→SANG→ZABAL for best swap. Don't go direct.
- **Bonfire query:** `RECALL: explain ZABAL, ZOUNZ, ZOL, OG Respect, ZOR Respect with mechanics, supply, and how they relate.`

### Chapter 4 — Governance (NEW)
- ZAO Fractals weekly meetings — 90+ weeks running, Mondays 6pm EST, Discord-bot-coordinated, OG vs ZOR Respect distribution per session.
- ORDAO / OREC: optimistic respect-based executive contract. Lets weekly proposals execute on-chain after dispute window.
- Hats Protocol: role hierarchy + permissions on Optimism (0x3bc1A0Ad72417f2d411118085256fC53CBdDd137).
- ZOUNZ DAO: Nouns Builder fork on Base for proposal voting + treasury (0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f).
- **Bonfire query:** `RECALL: explain how ZAO Fractals + OREC + Hats + ZOUNZ DAO compose into a governance system.`

### Chapter 5 — Onchain Music Rails (NEW)
- WaveWarZ: live song-vs-song battles on Solana. ~$50K trading volume. 43 artists indexed.
- ZAO Music DBA under BCZ Strategies LLC: BMI + DistroKid + 0xSplits payment rails.
- Cipher: planned first ZAO Music release.
- Sound.xyz / Zora music NFT integration in ZAO OS player.
- Audius API integration for artist metadata.
- **Bonfire query:** `RECALL: list every onchain music integration in the ZAO ecosystem with chain, contract, and current activity.`

### Chapter 6 — Build on ZAO (NEW — core protocol-whitepaper section)
- ZAO OS is the lab repo: github.com/bettercallzaal/ZAOOS — Next.js + Supabase + Neynar + XMTP. Forkable.
- Things that have graduated: COC Concertz (own repo), ZAOstock (own repo as of 2026-04-29), FISHBOWLZ paused.
- Monorepo-as-Lab pattern: prototype in ZAO OS, graduate to own repo when ready for public users.
- Open questions: which parts are open-source-licensed today? Which are internal-only? What licenses?
- **Bonfire query:** `RECALL: what's the open-source status of every ZAO repo and how does the monorepo-as-lab pattern work?`

### Chapter 7 — Roadmap + Open Source Status (NEW)
- Q2-Q3 2026 priorities: Nexus rebuild (/nexus), ZabalSocials rebuild, Whitepaper rebuild (this doc).
- Big events: ZAOstock October 3 2026, Ellsworth Maine.
- Long-term: ZAO Festivals umbrella as recurring brand, ZAO Italy bridge via Mat Tambussi, Contribution Circles late-May 2026.
- **Bonfire query:** `RECALL: list shipped vs planned vs paused/dead initiatives with status attributes.`

---

## How to Build This Iteratively (recommended workflow)

**Step 1 — Skeleton.** Copy this spec into the actual whitepaper file as section headers. Each chapter starts as a stub.

**Step 2 — Run the Bonfire queries.** For each chapter, DM the bot the `RECALL:` query in that chapter's box. Bot returns structured facts with source URLs. Paste relevant excerpts into the chapter as the FACT BASIS.

**Step 3 — Voice pass.** With facts in place, rewrite each chapter in the Year-of-the-ZABAL voice (clear, simple, spartan, short sentences, active voice).

**Step 4 — Diagrams.** Chapters 2 + 4 need diagrams. Mermaid is fine for v1. Keep simple.

**Step 5 — Cross-link Draft 4.5.** Pull the strongest community framing from research/community/051 into chapter 1.

**Step 6 — Public review.** Share with co-founders + key partners (Cassie / Steve Peer / Joshua.eth / Mat Tambussi) via Bonfire DM thread — let them flag corrections. Apply.

**Step 7 — Publish.** Mirror.xyz or Paragraph or zaoos.com/whitepaper-v1. Get a real version-controlled artifact. Update community.config.ts to link.

---

## Source Material to Query / Cite

Beyond Bonfire graph, pull from:
- `research/community/051-zao-whitepaper-2026/` (existing Draft 4.5)
- `research/community/050-the-zao-complete-guide/` (community guide, stale, but has ZAO history)
- `research/wavewarz/101-wavewarz-zao-whitepaper/` (WaveWarZ-specific WP)
- `CLAUDE.md` (project map)
- `community.config.ts` (branding + contracts list)
- BCZ YapZ episodes (now in Bonfire — guests' takes on ZAO)
- `research/identity/542-549, 569, 570, 581, 590` (Bonfire stack docs — meta but relevant)
- `research/governance/058-respect-deep-dive/` if exists

---

## Farcaster + X Posts as Voice Anchors

Once Track B (FC + X ingest) is live, the whitepaper can pull "what Zaal said publicly about X" with deeplinks. Strong for:
- Quotes that ground each chapter in Zaal's actual words
- Public commitments + dates (when did Zaal first announce ZABAL launch publicly? Find in casts.)
- Counterfactuals (what was the early thinking that got refined into this final position?)

**Recommended:** Don't BLOCK whitepaper on FC/X ingest. Start writing now. When FC/X land, replace placeholder quotes with deeplinked real ones.

---

## Open Questions Before Build

1. **Output target:** new research/ doc or new repo `zao-protocol`?
2. **Length target:** 4 pages (executive summary) or 25-page deep dive or both?
3. **Diagram style:** Mermaid (markdown-native) or proper design (Figma)?
4. **Open-source license clarity:** which ZAO repos are MIT / Apache / proprietary today? Need a definitive answer to write Chapter 6.
5. **Partner review list:** who gets pre-publish review (Cassie / Steve Peer / Joshua.eth / Mat Tambussi / Dan / Tadas)?
6. **Publication channel:** Mirror.xyz, Paragraph, zaoos.com/whitepaper, or all three?
7. **Cipher timing:** is Cipher releasing soon? If yes, hold whitepaper to include the ship; if no, write it as planned.

---

## Bonfire Ingest Trigger (for graph)

```
INGEST FACT:
Subject: ZAO Protocol Whitepaper Rebuild Spec
Type: Decision
Date: 2026-05-04
Status: planned
Description: Rebuild research/community/051 ZAO Whitepaper Draft 4.5 as a PROTOCOL whitepaper for builders/partners/devs. 7 chapters reusing Draft 4.5's community framing as Ch1, adding 6 new chapters on protocol architecture, tokens, governance, onchain music, build-on-ZAO, roadmap. Iterative build using Bonfire RECALL queries for each chapter. Spec at docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md.
Source: internal://docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md
Confidence: 1.0
```
