# 475 — ZAO Music Entity: Web3 Artist Support Collective

> **Status:** Draft v1 — live spec from GodCloud + Iman conversation
> **Date:** 2026-04-22
> **Goal:** Stand up a ZAO-owned legal entity that publishes, administers, and distributes member music while paying artists to wallets. Not a record label — an "artist support collective."
> **Team:** DCoop (lead music ops), GodCloud (A&R / Drip ambassador / publishing guide), Iman (WaveWarZ Zambia regional lead)
> **Sources:** Transcript 2026-04-22 (Zaal + GodCloud + Iman) — framing, positioning, BMI path, producer-tag concept

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Entity name | USE "ZAO Music" externally, "ZAO Artist Support Collective" in writing. NEVER use "record label" or "Web3 record label" in any public copy. |
| Legal wrapper | USE BetterCallZaal Strategies LLC as the holding vehicle for the publishing arm. Register a DBA "ZAO Music Publishing" under it. Reason: avoids a new formation cost, ties the collective to the already-operating consulting entity. |
| PRO affiliation | USE BMI as publisher. $250 one-time LLC publisher fee. Reason: BMI also collects mechanicals in-house so NO Songtrust is needed ($100/writer + 15-20% saved per member). |
| Writer registration | USE BMI (free for songwriters) for every ZAO artist who joins the collective. Reject ASCAP/SESAC until we have a reason. |
| US mechanicals belt-and-suspenders | REGISTER every artist directly with The MLC (themlc.com, free, ~15 min) in addition to BMI. Reason: the MLC is the statutory collector for US streaming mechanicals; free redundancy. |
| International mechanicals | SKIP Songtrust. BMI handles them via reciprocal agreements. Revisit only if a single artist has verified international streams > 50k/mo. |
| Digital distributor | USE DistroKid Musician Plus ($44.99/yr) for the label account under BetterCallZaal Strategies. 100% royalty retention, fastest go-live (24-48hr Spotify), unlimited uploads. SKIP CD Baby — acquired by UMG in Feb 2026. |
| Distributor fallback | KEEP DistroKid "Leave a Legacy" budget ($29/single, $49/album) funded so catalog cannot be yanked if a payment lapses. |
| On-chain payout rails | USE 0xSplits on Base for every release. Split: Artist / Collaborators / ZAO Music Treasury. Reason: already researched in doc 143, already live infra. |
| "The 25% middleman" replacement | The 25% that would have gone to ASCAP/BMI if we used them as writer-only goes into a ZAO Creator Fund (on-chain, multi-sig). Reason: matches Zaal's "net benefit, not a fee" framing from the call. |
| Producer tag | RECORD "thezao.com" producer tag (GodCloud to produce, DCoop to approve). Attach to every ZAO Music release as the first audio beat. Reason: Zaal's own ask in the transcript, branding play, costs $0. |
| Artist contract model | NO exclusive deals. Per-release participation agreement (90-day termination). Artist keeps 100% master ownership. ZAO Music gets: producer tag + publishing admin rights + right to include in compilations. |
| First release | USE the cipher Zaal is already planning (10 artists) as ZAO Music release #1, summer 2026, timed to ZAOstock (Oct 3 2026) promo cycle. |
| Don't ship | NO NFT mint on first release. Ship pure DSP distribution first, prove the wallet-payout rails work, then add NFT-per-release starting release #2. |

---

## Why Now — the 2026 Distribution Consolidation

Two moves in the last 60 days fundamentally change the distro landscape:

| Date | Event | Impact |
|------|-------|--------|
| Feb 2026 | UMG closed $775M acquisition of Downtown Music Holdings | CD Baby, FUGA, Songtrust are now Universal properties |
| Mar 2026 | Warner Music acquired Revelator | Revelator (with its OWN Web3 protocol) is now Warner's |

Translation: the two most "indie-friendly" distributors that were building Web3 features BOTH got swallowed by majors in Q1 2026. If ZAO Music uses them, artist data flows to a competitor. DistroKid is the last major indie-owned digital distro at scale.

---

## Comparison: PRO / Publisher Path

| Option | Writer fee | Publisher fee | Mechanicals included | Contract lock | Overhead kept | Verdict |
|--------|-----------|---------------|---------------------|---------------|---------------|---------|
| **BMI** | $0 | $250 LLC one-time | YES (in-house) | 2yr writer / 5yr publisher | ~15% | **USE** |
| ASCAP | $50 | $50 one-time | NO (need Songtrust or MLC) | 1yr auto-renew | ~10% | Skip |
| SESAC | N/A | Invite only | NO | N/A | N/A | Not available |
| GMR | N/A | Invite only | NO | N/A | N/A | Not available |

Source: BMI FAQ, Royalty Exchange PRO comparison 2026, Chartlex PRO guide 2026.

---

## Comparison: Digital Distribution

| Distributor | Pricing | Commission | Annual lock | Indie-owned 2026 | Verdict for ZAO |
|-------------|---------|------------|-------------|------------------|------------------|
| **DistroKid Musician Plus** | $44.99/yr | 0% | Yes (Leave a Legacy = $29-49 per item to survive lapse) | YES | **USE as label account** |
| CD Baby | $9.99/single, $14.99/album one-time | 9% forever | No (permanent) | NO — UMG-owned Feb 2026 | Skip |
| TuneCore | $14.99/single + annual | 0% | Yes | Partial (Believe-owned) | Backup only |
| Revelator | Enterprise B2B | Varies | Contract | NO — Warner-owned Mar 2026 | Skip |
| UnitedMasters | Free tier / $5-60/yr | 10% free tier / 0% paid | Yes | YES | Consider for solo artists in collective |

Sources: Ari's Take distribution comparison 2026, DistroKid pricing update 2026, Digital Music News Warner/Revelator coverage.

---

## Comparison: Mechanical Royalty Collection

| Path | Fee | Coverage | Verdict |
|------|-----|----------|---------|
| **BMI (as publisher)** | Included in $250 | US + international reciprocal | **USE — primary** |
| **The MLC** | $0 | US streaming (statutory) | **USE — redundant registration** |
| Songtrust | $100/writer + 20% | Global | SKIP (BMI covers) |
| TuneCore Publishing | 15% | Global | Skip |
| CD Baby Pro | 15% | Global | Skip (UMG-owned) |
| Harry Fox Agency | Varies | US only | Backup only |

Source: Ari's Take admin publishing comparison, Songtrust vs MLC guide.

---

## Architecture

```
                     BetterCallZaal Strategies LLC
                                |
                  DBA: "ZAO Music Publishing"
                                |
      +-------------------------+-------------------------+
      |                         |                         |
   BMI (publisher)        DistroKid account         0xSplits (Base)
   + MLC (US mechs)     (label-wide catalog)     per-release revenue
      |                         |                         |
   Royalty -> LLC          Master royalty -> LLC     Smart split -> 
      |                         |                         | Artist wallet
      +-----> LLC bank <--------+                         | Collab wallet
                    |                                     | ZAO Treasury
                    +---> monthly treasury reconcile <----+
                                  |
                             Artist payout
                        (wallet-first via 0xSplits,
                         ACH fallback via LLC)
```

---

## ZAO Ecosystem Integration

| Surface | File | Change |
|---------|------|--------|
| Artist card | `src/components/music/ArtistCard.tsx` | Add "ZAO Music collective" badge + wallet address field |
| Collect flow | `src/components/music/CollectButton.tsx` | Route non-NFT collect -> DistroKid link; NFT collect -> on-chain mint |
| Publish | `src/lib/publish/broadcast.ts` | On release day, auto-post to Farcaster/Bluesky/X/Threads/Hive/Lens/Discord/Telegram |
| Splits infra | Doc 143 `0xsplits-revenue-distribution` | Use as-is; fund deploy per release |
| Distribution infra | Doc 148 `master-integration-plan-onchain-distribution` | This doc 475 is the off-chain leg that pairs with 148's on-chain leg |
| NFT mint (release #2+) | Doc 155 `music-nft-end-to-end-implementation` + doc 407 `music-nft-coinflow-fiat-mint` | Add once DSP flow is proven |
| Community config | `community.config.ts` | Add `music: { label: "ZAO Music", dbaName: ..., bmiPublisherId: ..., distrokidAccount: ... }` section (values env-only until live) |
| Sync/licensing | Doc 333 `ai-music-licensing-sync-label-deep-dive` | Feed the catalog built here into sync pitching once > 20 tracks |

Connects to Zaal's master positioning: music first, community second, tech third (doc 432). This doc is the "music first" operational layer.

---

## Positioning Language (Hard Rule)

Use intentionally. From the transcript:

| Never say | Always say |
|-----------|-----------|
| "ZAO Music record label" | "ZAO Music — artist support collective" |
| "We signed this artist" | "This artist is part of the ZAO Music collective" |
| "Web3 record label" | "ZAO Music — onchain payout rails for independent artists" |
| "Our roster" | "The ZAO Music catalog" |
| "Deal" | "Participation agreement" |
| "Advance" | (don't offer advances) |

Reason (GodCloud, verbatim): "when you say record label in Web3, you're gonna ruffle some feathers."

---

## First 90 Days — Milestones

| Week | Milestone | Owner |
|------|-----------|-------|
| 1 | File DBA "ZAO Music Publishing" under BetterCallZaal Strategies LLC | Zaal |
| 1 | Record + mix "thezao.com" producer tag | GodCloud |
| 2 | BMI publisher application submitted ($250) | Zaal |
| 2 | DistroKid Musician Plus account opened ($44.99) | DCoop |
| 3 | 0xSplits template deployed on Base, reviewed vs doc 143 | DCoop + Zaal |
| 3 | Draft 1-page participation agreement (artist-friendly, 90-day term) | Zaal + legal review |
| 4 | BMI confirms publisher status; register first 3 songs | Zaal |
| 4 | Every ZAO Music artist registers with The MLC (free) | DCoop to walk each artist through |
| 5 | Cipher production begins (10 artists) | GodCloud + DCoop |
| 6 | Iman onboards first WaveWarZ Zambia artist to the collective | Iman |
| 8 | Cipher mastered + metadata finalized | GodCloud |
| 9 | DistroKid release scheduled (4-week lead) | DCoop |
| 12 | Cipher drops; 0xSplits live; first wallet payouts | Full team |
| 12 | Post-launch retro; decide on NFT add-on for release #2 | Full team |

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| GodCloud's fee memory ($325-340) is slightly off (actual BMI LLC fee is $250) | Budget $400 for fee + legal review; no impact |
| DistroKid raises prices again (they went $22.99 -> $24.99 in 2026) | "Leave a Legacy" budget reserved; CD Baby (UMG) is worse; accept this risk |
| UMG buys DistroKid next | Monitor; have UnitedMasters + Revenue as backup; 0xSplits layer is portable regardless |
| Artists misunderstand "collective" as "we own your music" | 1-page plain-English agreement; video explainer from GodCloud; master ownership clause in bold |
| BMI rejects publisher app | Fallback: apply to ASCAP ($50), accept Songtrust need, eat the 15-20% |
| Producer tag is cheesy and artists hate it | Make optional after release #3; keep mandatory only on compilation releases |
| Drip integration (Iman + WaveWarZ Zambia) ships music before the collective is ready | Run Drip as a separate parallel track — don't block on it |

---

## Open Questions for Zaal

1. BetterCallZaal Strategies LLC — is it already formed, or is a DBA the right shape? If not formed yet, we may want a fresh LLC just for ZAO Music to isolate liability.
2. Do we want any ZOUNZ / ZABAL token integration in the first release? Default answer: no, keep release #1 simple, add tokenomics at release #3.
3. Artist share: proposed default 85% artist / 10% ZAO Music Treasury / 5% ZAO Creator Fund. Confirm?
4. Does Iman want WaveWarZ Zambia artists under the same ZAO Music umbrella, or as a sister collective ("WaveWarZ Zambia Music")?
5. Do we record with Clejan on the cipher (per `project_zao_stock_details_april`) or is GodCloud producing solo?

---

## Sources

- Transcript: Zaal + GodCloud + Iman, 2026-04-22
- [BMI publisher fee FAQ](https://www.bmi.com/faq/entry/what_is_the_fee_to_form_a_publishing_company) — $250 LLC one-time
- [CD Baby 2026 pricing + UMG ownership](https://www.alera.fm/blog/cd-baby-pricing-2026-fees-commission-umg-ownership) — $775M acquisition Feb 2026
- [DistroKid vs CD Baby 2026 comparison](https://aristake.com/digital-distribution-comparison/) — Ari's Take
- [ASCAP vs BMI vs SESAC 2026](https://www.chartlex.com/blog/business/how-to-register-with-a-pro-ascap-bmi-sesac-2026)
- [Songtrust vs MLC + alternatives](https://aristake.com/admin-publishing-comparison/) — Ari's Take
- [The MLC registration](https://www.themlc.com/) — free US mechanicals
- [Warner Music acquires Revelator Mar 2026](https://www.digitalmusicnews.com/2026/04/01/warner-music-revelator-acquisition/)
- Prior ZAO research: docs 141, 143, 144, 146, 148, 151, 155, 322, 332, 333, 337, 340, 407, 432, 446

---

## Next Action

Zaal reviews this doc + answers the 5 open questions. On green-light, DCoop kicks off Week 1 milestones.
