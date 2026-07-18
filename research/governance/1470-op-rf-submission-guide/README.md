# 1470 — Optimism Retro Funding (OP RF) Submission Guide

**Type:** DECISION-BRIEF  
**Topic:** Governance  
**Status:** GATED — submit when Wikidata + DAOstar + Eventbrite are live; all gates resolve by Jul 25

---

## Overview

Optimism Retro Funding (OP RF) is the primary grant mechanism for ZAO/WaveWarZ on Optimism. ZAO has 3 live contracts on Optimism Mainnet. A successful OP RF submission can unlock $50K–$500K+ in OP tokens, which ZAO can use for:
- ZABAL S2 micro-grants (doc 1460)
- ZAOstock artist fees
- ZAOOS infrastructure maintenance

**Doc 1444** contains the paste-ready OP RF application text. This doc is the submission checklist + gate status.

---

## Gates Status

| Gate | What's Needed | Status | Where |
|---|---|---|---|
| 1 | Wikidata entity for ZAO | Create in ~30 min | doc 1417 — ASAP |
| 2 | DAOstar registration | 15 min via forms.gle | doc 1430 — do Jul 25 |
| 3 | Eventbrite URL | Launch Jul 21 | doc 1452 — ZAOstock launch |
| 4 | Q2 Progress Report URL | Doc 1453 on ZAOOS | READY (ZAOOS GitHub) |
| 5 | Mirror Article 1 URL | Publish Aug 1 | doc 1454 |
| 6 | WaveWarZ public stats URL | wavewarz.info/api/public/stats | LIVE |

**Minimum viable submission:** Gates 1, 2, 3 resolved = submit immediately after Jul 25.  
**Full submission (recommended):** Wait for Mirror Article 1 (Aug 1) — adds narrative credibility.

---

## Application Fields Reference

OP RF applications typically request:

### Project Name
**The ZAO (ZAO DAO)**

### Short Description (≤ 280 characters)
> ZAO is a music DAO on Optimism Mainnet running 64+ weekly governance sessions. WaveWarZ (1,245 battles, 524 SOL) pays losing artists — on-chain, every time. ZAOstock Oct 3 brings it IRL.

### Category
- [x] Governance / DAO tooling
- [x] Music / creator economy
- [x] Public goods / community

### Links to Include
1. ZAOOS GitHub: `github.com/bettercallzaal/ZAOOS`
2. WaveWarZ: `wavewarz.info`
3. Q2 Progress Report: ZAOOS doc 1453 (direct GitHub link)
4. Wikidata entity: [FILL after doc 1417 created]
5. DAOstar profile: [FILL after doc 1430 submitted]
6. ZAOstock Eventbrite: [FILL after Jul 21 launch]
7. Mirror Article 1: [FILL after Aug 1 publish]

### Impact Description (long form)

This is the core narrative from doc 1444. Paste-ready version:

```
ZAO (The DAO) is a music-first decentralized autonomous organization that has run 64 
consecutive weekly governance sessions on Optimism Mainnet — one of the longest unbroken 
on-chain governance streaks of any DAO in the ecosystem.

WaveWarZ, ZAO's flagship product, is a music prediction market on Solana where the losing 
artist earns a structural share of platform trading fees. As of July 2026: 1,245 battles, 
523.991 SOL in trading volume, 9.0988 SOL in direct artist payouts (including to losers), 
and 127.343 SOL returned to traders. This is documented public data from a live, functioning 
platform — not a whitepaper or prototype.

ZAO's governance architecture uses three contracts on Optimism Mainnet:
- OG ERC-20 token: 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957
- ZOR ERC-1155 governance token: 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c  
- OREC (on-chain execution contract): 0xcB05F9254765CA521F7698e61E0A6CA6456Be532

ZAOOS (ZAO Open Source) is our public documentation corpus — 1,460+ research documents 
covering every aspect of the ZAO ecosystem, published under CC-BY license on GitHub. This 
is our contribution to the public goods commons: a documented, reproducible model of how 
a music DAO can govern itself, pay artists fairly, and build toward financial sustainability.

OP RF support would fund:
1. ZABAL S2 micro-grants (10 builder spots × 0.1 ETH = 1 ETH target)
2. ZAOstock Oct 3 production costs (PA system, permits, artist fees)
3. ZAOOS documentation maintenance (Claude Code API costs, $100-200/month)
4. WaveWarZ Farcaster Mini App development (doc 1463, Hurricane build)

The ZAO is not a treasury-hoarding DAO. Every governance decision is public, every contract 
is deployed and verifiable, and every dollar flows to artists, builders, and community events.
```

### Verifiable Metrics
- 64+ weekly governance sessions (on-chain, verifiable via OREC)
- 1,245 battles on WaveWarZ (verifiable via public API)
- 523.991 SOL trading volume (verifiable on Solana Mainnet)
- 1,460+ ZAOOS documents (verifiable on GitHub)
- ZOR token: 157+ holders (verifiable on Optimism Mainnet)

### Team
- Zaal Panthaki (co-founder, @bettercallzaal)
- Hurricane (WaveWarZ dev lead)
- ZAO Community (157+ ZOR token holders)

---

## OP RF Round History

| Round | Status | ZAO Participation |
|---|---|---|
| OP RF 4 | Closed 2024 | Applied — outcome unknown (check prior ZAOOS docs) |
| OP RF 5 | Closed | [check prior docs] |
| OP RF 6 | CURRENT or next | Submit when gates open |

**Action:** Check retrofunding.optimism.io for current round status before submitting.

---

## Submission Decision Tree

```
Is there an open OP RF round?
  → NO: Set ZOE calendar alert for OP RF announcements (monthly check)
  → YES: Check gate status below

All 3 minimum gates open? (Wikidata ✅ + DAOstar ✅ + Eventbrite ✅)
  → NO: Complete missing gates (see gate table above)
  → YES: Submit now with current content

Is Mirror Article 1 live? (Aug 1 target)
  → NO: Submit now with Q2 report as primary narrative link
  → YES: Add Mirror URL to links section — this is the stronger narrative

Has doc 1444's application text been reviewed in the last 7 days?
  → NO: Pull fresh stats from wavewarz.info/api/public/stats and update numbers
  → YES: Paste and submit
```

---

## Pre-Submission Checklist

- [ ] Check retrofunding.optimism.io — is a round open?
- [ ] Wikidata entity created (doc 1417 — 30 min)
- [ ] DAOstar registration submitted (doc 1430 — 15 min)
- [ ] ZAOstock Eventbrite URL obtained (doc 1452 — launch Jul 21)
- [ ] Stats verified via wavewarz.info/api/public/stats (always pull fresh on submit day)
- [ ] Application text from doc 1444 pasted and updated with current stats
- [ ] Links section filled (ZAOOS GitHub, Wikidata, DAOstar, Eventbrite, [Mirror if live])
- [ ] OREC contract addresses verified on Optimism Mainnet
- [ ] Submit before round deadline (confirm from OP website)

---

## Post-Submission ZOE Tasks

- [ ] Note submission date and round number in ZAOOS (update this doc)
- [ ] Post submission announcement: X + Farcaster + Telegram
- [ ] If accepted: update North Star (governance +0.5, business +0.5)
- [ ] If rejected: note feedback and add to doc 1436 (grant tracker)

---

## Related Docs

- 1444 — OP RF Application Draft (full paste-ready text — primary source)
- 1453 — ZAO Q2 2026 Progress Report (supporting evidence)
- 1417 — Wikidata Entity Creation Guide (Gate 1 — ASAP)
- 1430 — DAOstar DAO Registration Guide (Gate 2 — Jul 25)
- 1452 — ZAOstock Eventbrite Listing Copy (Gate 3 — Jul 21)
- 1454 — Mirror Article 1 Draft (Gate 5 — Aug 1)
- 1460 — Nouns Prop House Proposal (parallel grant — Aug 1-7)
- 1436 — Fisher Grant Application (Aug 15 deadline)
