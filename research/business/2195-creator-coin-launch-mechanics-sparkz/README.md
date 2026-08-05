---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-04
superseded-by:
related-docs: 2190
original-query: "overnight research on Reddit - topic 1: creator-coin launch mechanics + anti-rug design (community signal), implications for Sparkz"
tier: STANDARD
---

# 2195 - Creator-coin launch mechanics + anti-rug: what the community actually says, and what it means for Sparkz

> **Goal:** Overnight Reddit/community research on how token launches actually work (fair launch vs presale vs bonding curve) and how rugs actually happen - so Sparkz's launcher design is grounded in real failure modes, not theory.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **Sparkz's "born-locked + single-sided walls + permanent fee streams" is the right anti-rug posture - keep it, and MARKET it against the two rug vectors that don't need malicious code.** | The community's own analysis (crypto.news, 2026-08-04) is that most rugs are NOT contract exploits - they are insider accumulation + post-graduation dumps executed through a standard, "functioning-as-designed" contract. Locked liquidity + walls directly blunt exactly those. |
| 2 | **Support fair-launch AND bonding-curve graduation as first-class options in the multi-launcher spec - do not force one.** | The three models (fair launch / presale / bonding curve) serve different creators; the fair-launch article + Pump.fun data show fair launch maximizes trust but needs self-funded liquidity, while bonding curves need zero upfront liquidity. A creator picks at graduation (the exact framing ZAO just aligned with Jim on). |
| 3 | **Publish a "contribution + concentration" transparency surface by default** - top-10-wallet concentration, creator-wallet activity, and the contribution record behind each Sparkz token. | The single most-cited rug tell is top-10 wallets (ex-LP) holding >30% of supply. Making that visible-by-default is a cheap, honest differentiator that no bonding-curve launchpad offers. |

## Community + mechanics findings (grounded in real fetches)

### The three launch models (community consensus table)

| Factor | Fair Launch | Presale | Bonding Curve |
|---|---|---|---|
| Entry price | Same for everyone | Discounted for insiders | Rises with each buy |
| Upfront capital | None (self-fund LP) | Significant | None to creator |
| Community trust | Highest | Lower | Moderate |
| Sell pressure at launch | Low | High (presale dumps) | Moderate (early-curve sellers) |
| Regulatory risk | Low | High | Low-moderate |
| Creator control | Full | Full | Platform-limited |
| Best for | Community/meme tokens | Funded utility projects | Quick experimental launches |

The community playbook: fair launches put **80-100% of supply into the LP** and revoke mint+freeze authorities; the trust comes from "there is nothing to hide." Presales carry a structural trust deficit (early investors profitable from trade one -> immediate dump) that vesting only mitigates.

### How rugs actually happen (the load-bearing insight for Sparkz)

crypto.news (2026-08-04) - most extraction on a standardized bonding curve requires **no malicious code**; the contract "is functioning exactly as designed." The three vectors:

- **Insider accumulation:** buy 20-30% of supply at the near-zero bottom of the curve across many wallets (cheap), promote, then sell into the buyers you attracted.
- **Bundled launch:** deploy + buy a large allocation in the same block, so no one gets in before you.
- **Post-graduation dump:** graduation pools are small; concentrated selling drains them in seconds. The token stays "tradable" at a fraction of price.

Tells the community watches: **top-10 wallets (ex-LP) > 30% of supply = structurally fragile**; deployer wallet already selling; new-holder velocity spiking on a single influencer post then plateauing; large buys in the first block (coordinated).

### Pump.fun as the reference implementation (real numbers)

- **800M of 1B** supply goes to the bonding curve; **200M** reserved for the graduation LP.
- Graduates at **~85 SOL** accumulated on the curve; post-March-2025 graduation goes to PumpSwap (was Raydium before).
- **Fewer than 2%** of all tokens launched ever graduate - 98% die on the curve. That is where the overwhelming majority of trading + losses happen.
- **1%** fee on every curve trade - "hundreds of millions" in first-year revenue.
- Convex-curve math structurally transfers value from late buyers to early buyers regardless of creator intent.

## ZAO / Sparkz grounding

- Sparkz is PUBLIC (`bettercallzaal/sparkz`) - the ZAO creator-coin launcher; ZAO ~25% locked; the in-house launcher is "born-locked, single-sided walls, permanent fee streams, 136/0 fork-tested" (per the Jim/coordinator tokenomics thread, 2026-08-04). This doc's anti-rug findings are the external validation for that posture.
- The multi-launcher / no-vendor-lock framing (a creator picks any factory at graduation) is the frame ZAO + Jim's coordinator aligned on this same day - the graduation plug-in interface spec is being drafted on their side. See [[project_sparkz_configurable_ai_advisor]] and doc 2190 (Sparkz endowment integration).

## Also See

- [[project_sparkz_configurable_ai_advisor]] - Sparkz creator-coin launcher, ZAO ~25% locked
- [[project_culture_coins_meme_engine]] - Brandon's Culture Coins paper Sparkz implements
- Doc 2190 - Sparkz endowment / network integration

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a top-10-wallet concentration + creator-wallet-activity panel to the Sparkz token page (the community's #1 rug tell, visible by default) - shipped when the panel renders live concentration for a launched token | @Zaal | PR | 2026-08-25 |
| Fold "fair-launch vs bonding-curve, creator picks at graduation" into the graduation plug-in interface spec ZAO is co-drafting with Jim's coordinator - shipped when the spec names both models as first-class | @Zaal | Spec | 2026-08-15 |
| Write one plain-English "how Sparkz prevents the 3 no-code rug vectors" explainer for the Sparkz site (insider accumulation / bundled launch / post-graduation dump) - shipped when the page is live | @Zaal | PR | 2026-08-22 |

## Sources

- [r/solana - "What does liquidity exactly mean in meme coins?"](https://www.reddit.com/r/solana/comments/1ef7xle/what_does_liquidity_exactly_means_in_meme_coins/) - [FULL] via exa; real thread on LP ratio mechanics + how devs set MC at launch
- [r/solana - "Can anyone explain how is this even possible?"](https://www.reddit.com/r/solana/comments/1cx4hnn/can_anyone_explain_how_is_this_even_possible/) - [FULL] via exa; community explanation of low-LP supply-shock + honeypot mechanics (43 + 18 upvote comments)
- [crypto.news - How meme coins are made: bonding curves, Pump.fun, rug pulls (2026-08-04)](https://crypto.news/how-meme-coins-are-made-bonding-curves-pump-fun-rug-pulls/) - [FULL] via exa; the Pump.fun numbers + the 3 no-code rug vectors + concentration tells
- [Fair Launch vs Presale vs Bonding Curve (soltokencreator.io, 2026-03-07)](https://www.soltokencreator.io/blog/fair-launch-vs-presale-vs-bonding-curve) - [FULL] via exa; the three-model comparison table + fair-launch 80-100%-to-LP playbook

_Fetch method: exa web_search/web_fetch (reddit.com is blocked to the default WebSearch UA and the VPS `zao-fetch-reddit.sh` helper is absent; exa returns real indexed Reddit thread content, verified against upvote counts + comment text). Community coverage on ZAO-specific creator tokens is thin - this is category signal, applied to Sparkz._
