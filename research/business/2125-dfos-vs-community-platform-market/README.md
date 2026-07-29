---
topic: business
type: comparison
status: research-complete
last-validated: 2026-07-29
superseded-by:
related-docs: "2122, 2124, 2123"
original-query: "lets keep researching more and more (DFOS deep research wave 2 - what market is DFOS actually competing in, and how does its pricing compare)"
tier: STANDARD
---

# 2125 - DFOS vs the community-platform market: where the pricing actually crosses over

> **Goal:** Place DFOS against the platforms it is really competing with - Circle, Skool, Mighty Networks, Patreon, Substack, Discord - and compute the exact revenue levels where each becomes cheaper. Decide what ZAO runs its community on, and what ZAO's own pricing should look like if it ever charges.

## Key Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **DFOS is the cheapest option for any community under ~$20K/yr of GMV.** No incumbent has a $0 tier that includes commerce, and DFOS Pro's $30/mo fixed cost is 3-7x below every competitor's entry plan. | USE DFOS Free for the ZAO space. It is not a close call at ZAO's current community revenue. |
| 2 | **Above ~$20K/yr GMV, the incumbents win on fee.** Skool Pro ($99/mo, ~1%) beats DFOS Pro at $20,700/yr. Circle beats it at $23,600/yr. | SET A TRIPWIRE: if a ZAO DFOS space clears $20K/yr, re-run this table. Do not assume the cheap tier stays cheap. |
| 3 | **DFOS is not competing with Discord and should not be evaluated against it.** Discord is free, has no commerce layer, and no ownership story. | KEEP Discord where Discord works (real-time noise). DFOS competes with Circle/Skool/Mighty for the *paid, owned* community layer. |
| 4 | **DFOS's real differentiator is bundling, not price.** It collapses community + newsletter + storefront + calendar + docs into one product. Every competitor is community-only and needs a Mailchimp/Shopify/Substack bolted on. | MEASURE ZAO's own tool sprawl against the $3,200/yr figure Metalabel quotes. That number is the actual pitch, not the fee. |
| 5 | **DFOS's 10% free-tier fee is at the high end of the market** - equal to Substack, above Patreon Pro (8%), far above Circle (0.5-2%) and Mighty (1-2%). It is only competitive because the fixed cost is zero. | ACCEPT for a low-GMV space. Flag it as the thing that gets renegotiated if ZAO ever runs meaningful commerce there. |

## The Market DFOS Is Actually In

Metalabel's own framing (Forest Gathering, 2026-07-23) names the competitor set as a **stack**, not a product: "Metalabel used to run on Slack, Notion, Discord, and Mailchimp, adding up to roughly $3,300/yr for a 10 person team."

Their pitch slide is literally `STATUS QUO: SLACK / NOTION / COMMUNITY TOOL / NEWSLETTER TOOL / ECOMM STORE / COORDINATION TOOLS / DOCS` versus `DFOS: JUST DFOS`.

So the comparison below is not apples-to-apples on features. Circle, Skool, and Mighty are community platforms. DFOS is a community platform **plus** a newsletter tool, a storefront, a calendar, a media library, and a docs/folder layer, on one identity.

## Price Comparison (verified 2026-07-29)

| Platform | Entry plan (annual billing) | Platform fee | Bundled commerce? | Bundled newsletter? |
|----------|---------------------------|--------------|-------------------|---------------------|
| **DFOS Free** | **$0** | **10%** | Yes (Shop, Space Keys) | Yes (broadcast) |
| **DFOS Pro** *(announced, not shipped)* | **$30/mo = $360/yr** | **5%** | Yes | Yes |
| Circle Professional | $89/mo = $1,068/yr | 0.5-2% (on top of Stripe) | Yes | Partial |
| Circle Business | $199/mo = $2,388/yr | 0.5-2% | Yes | Partial |
| Skool | $99/mo = $1,188/yr | 0% up to $899/sale, then 1% | Yes | No |
| Skool (cheap tier) | $9/mo = $108/yr | **10%** | Yes | No |
| Mighty Networks Launch | $79/mo = $948/yr | 2% | Yes | Partial |
| Mighty Networks Scale | $179/mo = $2,148/yr | 1% | Yes | Partial |
| Patreon Pro | $0 | 8% (5% Lite / 12% Premium) | Membership only | Yes |
| Substack | $0 | 10% + Stripe 2.9% + $0.30 | Subscriptions only | Yes (it is one) |
| Discord | $0 | n/a | No | No |
| OnlyFans / Fansly | $0 | 20% | Yes | No |

All fees sit **on top of** standard payment processing (Stripe ~2.9% + $0.30) unless noted.

## Crossover Math

Let `G` = annual community GMV. Total annual cost = `fixed + fee x G`.

| Comparison | Equation | Crossover |
|------------|----------|-----------|
| DFOS Free vs DFOS Pro | `0.10G = 360 + 0.05G` | **$7,200/yr** |
| DFOS Pro vs Patreon Pro (8%) | `360 + 0.05G = 0.08G` | **$12,000/yr** |
| DFOS Pro vs Mighty Launch (2%) | `360 + 0.05G = 948 + 0.02G` | **$19,600/yr** |
| DFOS Pro vs Skool (1%) | `360 + 0.05G = 1188 + 0.01G` | **$20,700/yr** |
| DFOS Pro vs Circle Professional (2%) | `360 + 0.05G = 1068 + 0.02G` | **$23,600/yr** |
| DFOS Free vs Substack (10%) | `0.10G = 0.10G` | Never - identical fee, DFOS bundles more |
| DFOS Free vs Skool cheap tier (10% + $108) | `0.10G = 108 + 0.10G` | Never - DFOS Free always cheaper |

**Read it as three bands:**

- **$0 - $7,200/yr GMV:** DFOS Free wins outright. Nothing else has a real $0 tier with commerce.
- **$7,200 - ~$20,000/yr:** DFOS Pro wins - lowest total cost in the market.
- **Above ~$20,000/yr:** Skool, Circle, and Mighty overtake on fee. DFOS's 5% becomes the expensive part.

Metalabel's own worked example ($5K/yr creator: incumbent stack $4,000, DFOS Pro $720, DFOS Free $700) sits inside band one and is honest - at $5K, Free does beat Pro on their own numbers.

## What the Comparison Misses

**The stack cost is the real argument.** At $10K/yr GMV a creator on Circle Professional also pays for Mailchimp (~$318/yr at 1K subs), Shopify Basic ($468/yr), and Notion (~$1,440/yr at 10 seats) if they want what DFOS includes. That is **$2,226/yr of tools on top of $1,068 of Circle** - versus $860 total on DFOS Pro. The fee comparison flatters the incumbents because it prices only one layer of the stack.

**Feature maturity cuts the other way.** Circle, Skool, and Mighty are mature products with courses, gamification, mobile apps, and years of integrations. DFOS shipped public beta 2026-05-21 and is adding core features weekly. A ZAO space is adopting a product that is roughly ten weeks into public availability.

**DFOS Pro does not exist yet.** Every Pro number above is from a preview slide dated 2026-07-23 - "coming later this year." Treat the $30/5% figures as announced intent, not a shipped price.

## What This Means for ZAO's Own Pricing

If ZAO ever charges for community infrastructure, the market says:

- **$0 tiers with a 10% fee are viable and increasingly normal** (DFOS, Skool cheap tier, Substack). They are the standard on-ramp.
- **The fixed-cost floor for a serious community platform is ~$79-99/mo.** DFOS's $30 undercuts it by 3x and is a deliberate wedge.
- **Nobody in this market charges above 12% except adult platforms** (OnlyFans 20%). 10% is the practical ceiling for a creative-community platform.
- **Bundling is the only durable differentiation left.** Every one of these platforms has the same forum/post/chat core. The winners bundle the adjacent tool.

## Also See

- [Doc 2122](../../farcaster/2122-dfos-platform-deep-july-2026/) - DFOS platform deep dive and pricing source
- [Doc 2124](../2124-metalabel-post-crypto-pivot-vs-zao-onchain-thesis/) - Metalabel's post-crypto pivot
- [Doc 2123](../2123-acorp-town-hall-boulder-2026/) - A-Corp town hall

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Tally ZAO's current monthly tool spend against Metalabel's $3,200/yr benchmark - number recorded in this doc | @Zaal | Audit | 2026-09-05 |
| Set a tripwire: if a ZAO DFOS space clears $20K/yr GMV, re-run the crossover table - reminder scheduled | @Zaal | Calendar | 2026-08-31 |
| Re-check whether DFOS Pro shipped at the announced $30/mo + 5%, and correct this doc if not | @Zaal | Research | 2026-11-30 |
| Decide whether ZAO's own community offering ever charges, using the market bands above - decision recorded | @Zaal | Doc | 2026-10-31 |

## Sources

- Forest Gathering pricing slides, DFOS Home, 2026-07-23 [FULL] - read in-app; DFOS Free/Pro rates, the status-quo stack breakdown ($270+/mo, $3,200+/yr), and the $5K worked example
- [Circle.so Pricing 2026](https://www.schoolmaker.com/blog/circle-so-pricing) [FULL via search] - $89/mo Professional annual, $199 Business, 0.5-2% fees
- [Skool vs Circle (2026)](https://kourses.com/skool-vs-circle/) [FULL via search] - Skool $99/mo flat, 0% to $899/sale then 1%; cheap tier 10%
- [Mighty Networks Pricing 2026](https://kourses.com/mighty-networks-pricing-2/) [FULL via search] - $79/$179 annual, 2%/1% fees
- [Patreon Fees Explained in 2026](https://www.unilink.us/blog/patreon-fees-explained-2026) [FULL via search] - 5% Lite / 8% Pro / 12% Premium
- [Substack vs Patreon 2026](https://zanfia.com/blog/substack-vs-patreon/) [FULL via search] - Substack 10% + Stripe
- [Subscription Platforms for Creators in 2026](https://techbullion.com/subscription-platforms-for-creators-in-2026-the-complete-comparison/) [FULL via search] - cross-platform fee range, OnlyFans/Fansly 20%
- Discord pricing [PARTIAL - no 2026 creator-fee data found because Discord does not operate a creator-monetization fee model; excluded from crossover math for that reason, not for lack of trying]
