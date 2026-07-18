# 1464 — Icebreaker.so: ZAO Networking Update (Jul 2026)

> **Type:** STANDALONE
> **Status:** RESEARCH COMPLETE
> **Owner:** Zaal
> **Created:** 2026-07-18

---

## What Icebreaker Is

**Icebreaker.so** is a web3-native open professional network — effectively LinkedIn for crypto/DAOs. Built by ex-Google and Coinbase engineers (funded: $5M seed led by CoinFund, Jul 2024). Core mechanic: a verifiable, user-controlled profile that aggregates identity across LinkedIn, GitHub, X, Farcaster, and Ethereum wallets, using zero-knowledge proofs so you share only what you choose.

| Field | Value |
|-------|-------|
| URL | icebreaker.xyz |
| Founded | 2024 |
| Funding | $5M seed (CoinFund) |
| Identity layer | ENS, Farcaster, Ethereum wallet, LinkedIn, GitHub, X |
| Privacy model | ZK proofs — user controls what's shared |
| API | Social Verification API (developer docs at docs.icebreaker.xyz) |
| Pricing | Freemium profile; enterprise pricing not disclosed |
| Audience | Web3 builders, DAO contributors, crypto teams, protocols |

---

## Why This Was Flagged

Board task `f25c9332` — "Feature: Icebreaker networking update." ZAO needs to:
1. Verify or create a ZAO organization profile on Icebreaker
2. Update it with current stats and social links
3. Evaluate whether Icebreaker's Social Verification API can surface ZAO contributors' credentials in ZAOOS or ZAOcowork

---

## ZAO Fit Assessment

| Use Case | Fit | Notes |
|----------|-----|-------|
| ZAO organizational profile | High | DAO-native platform; ZAO is exactly the audience |
| Community member networking | High | 157 ZOR holders + ZABAL contributors could link their Icebreaker profiles to /zao Farcaster channel |
| Artist/builder discovery | High | AI-powered talent matching aligned with ZABAL S2 builder recruitment (doc 1419) |
| Credential verification for ZAO contributors | Medium | ZK proofs work for self-claims; on-chain verification ties to Hats Protocol |
| Grant/press credibility | Medium | Icebreaker profile functions like a decentralized press kit; share with Fisher, Green Pill |
| ZAOcowork integration | Low (now) | Social Verification API could surface member Icebreaker profiles in the board, but requires dev work |

---

## Action Plan

### Immediate (Zaal, ~30 min)
- [ ] Create or claim ZAO organization profile at icebreaker.xyz
- [ ] Fill fields: ZAO name, description (from doc 1435 medium bio), website (thezao.xyz), Farcaster (/zao), X (@bettercallzaal), GitHub (ZAODEVZ)
- [ ] Add WaveWarZ stats (1,245+ battles, 524 SOL volume) as a credential/achievement
- [ ] Link Zaal's personal profile to the ZAO org

### Short-term (Jul-Aug)
- [ ] Post a ZAO Farcaster cast inviting /zao members to link their Icebreaker profiles to the ZAO org (community credential layer)
- [ ] Reference Icebreaker profile in ZABAL S2 application process (doc 1392): builders submit Icebreaker link as part of their application
- [ ] Check if Icebreaker has a DAO/Org feature for listing members (like a contributor directory)

### Evaluate Later
- [ ] Social Verification API → ZAOcowork member directory (surface Icebreaker profiles per team member in the board)
- [ ] Credential integration: ZOR holders + Hats Protocol hat = verifiable ZAO membership on Icebreaker

---

## Profile Content (Paste-Ready)

### Organization Name
The ZAO

### Description (use doc 1435 short bio)
A decentralized music DAO running 1,245+ WaveWarZ battles, 100+ weekly governance sessions, and ZAOstock — an IRL web3 music festival in Ellsworth, Maine. 157 onchain Respect holders. Open-source infrastructure on Optimism and Base.

### Social Links
- Website: thezao.xyz
- Farcaster: /zao (and /cocconcertz, /zaofestivals)
- X: @bettercallzaal
- GitHub: github.com/ZAODEVZ / github.com/bettercallzaal
- Mirror: mirror.xyz/bettercallzaal.eth

### Key Credentials to Add
- WaveWarZ: 1,245+ onchain battles (Solana program: [program ID])
- Governance: 100+ Fractal sessions with Optimism Respect Game
- Community: 157 onchain Respect token holders
- Infrastructure: ZAOOS (open-source ZAO OS, AGPL-3.0)

---

## Comparison with Other Identity Platforms ZAO Already Uses

| Platform | What it does for ZAO | Status |
|----------|---------------------|--------|
| Wikidata | GEO / AI knowledge graph entity | DECISION NEEDED (doc 1417) |
| Mirror.xyz | Long-form publishing / citability | Draft in progress (doc 1454) |
| DAOstar | DAO registry / standard metadata | Registered (doc 1430) |
| Hats Protocol | Onchain role hats / access control | Live (tree 226, Optimism) |
| **Icebreaker** | Web3 professional networking / talent discovery | **This doc — CREATE NOW** |

---

## Related Docs

- [1435 — ZAO Brand Pack Reference](../identity/1435-zao-brand-pack-reference-jul2026/)
- [1417 — ZAO Wikidata Entity Creation Guide](../identity/1417-zao-wikidata-entity-creation-guide/)
- [1419 — ZABAL S2 Cohort Kickoff + Onboarding](../zabal/1419-zabal-s2-cohort-kickoff-sep2026/)
- [1339 — ZAO Numbers Proof-Points](../community/1339-zao-numbers-proof-points/)
