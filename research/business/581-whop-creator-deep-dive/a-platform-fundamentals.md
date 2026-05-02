---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-01
related-docs: 581, 222
tier: STANDARD
---

# 581a - Whop Platform Fundamentals (2026)

> **Goal:** Ground-truth Whop's product, fees, infra, funding, and recent news so any other ZAO doc that cites Whop has one source to point at. All numbers verified against official Whop docs + CoinDesk + CBInsights as of 2026-05-01.

## 1. What Whop Is in 2026

Digital-commerce platform for creators selling courses, memberships, software, signal services, and gated Discord/Telegram communities. Founded March 2021 by Steven Schwartz, Cameron Zoub, Jack Sharkey (all 25 in 2026, Brooklyn HQ, 172 employees). Started in sneaker-bot/sports-betting niche, pivoted into broader creator economy.

Each seller's storefront is called a "whop." It bundles multiple revenue streams (course + community + software + downloads) into one customizable page. Buyers find them via Whop Discover (the marketplace, ~70K products, 50K+ companies) or direct links.

**Differentiation vs comp set:**
- vs **Gumroad** (10%+0.50): Whop is ~5.9% all-in for digital products, plus native Discord/Telegram gating.
- vs **Patreon** (5-12% + processing): Whop is cheaper and lets you sell one-time + recurring + courses + software in one storefront.
- vs **Skool** ($9-99/mo flat): Skool is community + gamification first; Whop is commerce + community.
- vs **Kajabi** ($89-399/mo flat): Kajabi is course-platform-with-marketing-suite; Whop is transaction-based with broader product types.

Modular app ecosystem (150+ apps - Chat, Forum, Courses, Livestreams, Calendar, Coach AI, Files, Bounties, Newsletters, Content Rewards, etc.) installs one-click into a whop.

## 2. Pricing for Creators

**Take rate: 2.7% + $0.30 per transaction** (current as of May 2026, reduced from 3.0% in October 2025 when Whop replaced Stripe Connect with proprietary multi-PSP routing).

**Stripe-equivalent processing on top:**
- US domestic card: 2.9% + $0.30
- International card: +1.5% surcharge
- Currency conversion: +1%
- ACH: 1.5% (max $5)
- BNPL (Klarna/Afterpay): 15%

**Effective fee on $100 US card sale:**
| Component | Cost |
|---|---|
| Whop platform | $2.70 |
| Card processing | $3.20 |
| **Total** | **$5.90 (5.9%)** |
| Creator keeps | $94.10 |

**Effective fee on $100 international card (with FX):**
| Component | Cost |
|---|---|
| Whop platform | $2.70 |
| Card processing + intl + FX | $5.70 |
| **Total** | **$8.40 (8.4%)** |

**Payout cadence:**
- Next-day ACH: $2.50/payout
- Instant (RTP): 4% + $1
- Crypto (BTC/USDT): 5% + $1
- Wire: $23

**Marketplace listings (Whop Discover):** 0% additional platform fee since 2025 (down from 30% historically). Standard 2.7% still applies.

**Affiliate program:** 1.25% per transaction tracked via Whop's built-in affiliate system, optional.

## 3. Stack and Infrastructure

**Payment rails:**
- Sept-Oct 2025 launched proprietary Whop Payments Network - multi-PSP routing across providers, auto-retry on decline, 6-10% approval rate lift reported by sellers.
- 100+ local payment methods auto-surfaced by geography (iDEAL, SEPA, UK bank transfers, etc.).
- Crypto via Bitcoin + stablecoins; Tether WDK integration adds USDT + USAT settlement (Feb 2026).
- BNPL across 10 providers (Klarna, Afterpay/Clearpay, Sezzle, Splitit, Tamara, Scalapay, ClarityPay, ZipPay, Climb, SeQura).

**Community hosting:**
- Native Discord integration - role assignment based on Whop purchase, no third-party bot needed.
- Native Telegram integration - paid group access automation.
- Native Whop Chat for communities not on Discord/Telegram.
- Forums, Newsletters, Leaderboards as modular apps.

**Checkout / embedding:**
- Standalone checkout links, embedded iframe checkout, no-code Whop store builder, full API/SDK for custom.

**Tax + compliance:**
- Auto tax calc + remittance via Numeral partnership (US, EU).
- KYC required at payout, not signup (low onboarding friction).
- Operates 241+ territories, 135+ currencies.

## 4. Funding + Valuation

| Round | Date | Amount | Valuation | Lead |
|---|---|---|---|---|
| Series A | July 2023 | $17M | $100M+ | Insight Partners (also Peter Thiel, Chainsmokers, Kevin O'Leary) |
| Series B | June 2024 | $50M+ | ~$800M | Bain Capital Ventures |
| Tether strategic | Feb 25, 2026 | $200M | $1.6B | Tether Investments |
| **Total** | | **$217M** | | |

**Founders:**
- **Steven Schwartz** (CEO) - sneaker bots at 13, IT agency to $100K/mo before Whop, met Zoub on Facebook sneaker group.
- **Cameron Zoub** (CGO) - co-built bots + IT agency w/ Schwartz from age 13-15.
- **Jack Sharkey** (CTO) - joined late 2018, third co-founder March 2021.

## 5. Recent News (Nov 2025 - May 2026)

**Oct 2025 - Whop Payments v2.0:**
- Replaced Stripe Connect with proprietary multi-PSP layer.
- Fees reduced 3.0% -> 2.7% + $0.30. Enterprise as low as 2.5%.
- KYC moved to payout-time (not signup).
- New dashboard with instant withdrawal tracking.

**Sept 2025 - Whop Payments Network launch:**
- Smart routing for marketplaces.
- Auto-retry on decline reroutes to alt processor in real-time.
- Sellers report 6-10% authorization rate improvements.

**Feb 25, 2026 - Tether $200M strategic investment:**
- Whop valued $1.6B.
- Tether WDK embedded - self-custodial wallets in Whop.
- USDT + USAT settlement.
- LATAM / Europe / APAC expansion explicit goal.
- Planned DeFi integrations (lending/borrowing via stablecoins).
- Tether ecosystem reach: 530M+ users globally, $180B issued digital dollars.

**General momentum 2025-2026:**
- Monthly GMV ~$100M (Mar-Apr 2025), up from ~$80M Dec 2024.
- 25% MoM GTV growth.
- 18.4M+ users, 183,628 active sellers (Feb 2026).
- 258 sellers crossed $1M lifetime by June 2025.
- Cumulative GMV $2.67B (Feb 2026).
- ~40K txns/day; aggregate creators earning ~$200K/hr platform-wide (Oct 2025).

## 6. Audience Composition

**By revenue concentration (Whop's own categories):**
1. Sports betting picks: ~$4.7M/month (4,176 products, 30% revenue rate vs 11% platform avg). Top product Bravo Six Picks ~$551K/month.
2. Crypto/trading signals: ~$3.8M/mo (courses), $3.3M (options alerts), $2.1M (crypto signals).
3. Courses + education: business, dev skills, social media.
4. SaaS + software tools: trading bots, automation, productivity.
5. Coaching + mentorship: high-ticket $300-999/mo.
6. Communities + membership: Discord/Telegram-gated.

**Rough split of GMV (2026):**
- Trading / betting / finance: 40-50%
- Courses / education: 20-25%
- SaaS / software: 10-15%
- Coaching / consulting: 10-15%
- Other (ebooks, templates, art, niche): 5-10%

**Demographics:** Heavily skewed young (17-25) and male. North America dominant; LATAM/Europe/APAC growing fast post-Tether.

## 7. Public Take Rate vs Hidden Fees

**Advertised:** "2.7% + $0.30, free to start, no monthly fees."

**Full breakdown:**

| Fee | Amount | When |
|---|---|---|
| Whop platform | 2.7% | Always |
| Card processing | 2.9% + $0.30 | Always (US domestic) |
| Intl card surcharge | +1.5% | Intl cards |
| Currency conversion | +1% | When FX |
| ACH | 1.5% (max $5) | Bank transfers |
| BNPL | 15% | If offered |
| Affiliate (optional) | 1.25% | Whop tracking |
| Next-day payout | $2.50 | Per payout |
| Instant payout | 4% + $1 | Per payout |
| Crypto payout | 5% + $1 | Per payout |
| Wire | $23 | Per payout |
| Tax merchant-of-record (optional) | 0.5% | If Whop handles tax |
| Invoicing (optional) | 0.5% | If using Whop invoicing |

**Effective comparisons (US card, no add-ons):**
- $50 product: ~5.9% total
- $500: ~5.6%
- $5,000: ~5.55%

**vs comp set (effective rate after processing):**
- Gumroad: 10.5-13%
- Patreon: 5-12% + processing
- Skool: $9-99/mo flat (no per-txn)
- Kajabi: $89-399/mo flat (no per-txn)
- Lemon Squeezy: 5% + $0.50 (incl processing + tax handling)

Whop's all-in 5.9% is among the lowest for digital products without a monthly platform fee.

## Sources

- whop.com/network/pricing - current pricing
- docs.whop.com/payments-and-billing/fees/fees - authoritative fee table
- whop.com/blog/payments-launch (Oct 2025) - Stripe replacement
- whop.com/blog/whop-payments-network (Mar 2026) - multi-PSP details
- newsroom.whop.com/whop-payments (Sept 2025) - smart routing launch
- tether.io/news/tether-invests-in-whop (Feb 25 2026) - $200M / WDK
- coindesk.com/business/2026/02/25/tether-invests-usd200-million-in-digital-marketplace-whop - $1.6B confirmation
- insidecrypto.net/tether-backs-whop-with-200-million - WDK details
- pymnts.com/news/investment-tracker/2026/tether-investment-values-whop-at-1-6-billion - LATAM/Europe/APAC
- cbinsights.com/company/whop - 18.4M users, $3B annual payouts
- crunchbase.com/organization/whop - $217M total raised
- fastcompany.com/91017915 (Feb 2024) - Schwartz founder story
- cnbc.com/2023/08/14 - Schwartz/Zoub origin
- wikipedia.org/wiki/Whop.com - funding rounds
- fortune.com/2024/06/09 - CEO profile
- yahoo.com/autos/whop-online-marketplace-digital-goods-160016822 - Series A
- whopscan.com/blog/whop-marketplace-overview-2026 - 70K+ products
- whop.com/blog/gumroad-vs-patreon - competitor positioning
- whop.com/blog/kajabi-vs-skool - course-platform positioning
- creatoreconomytools.com/tool/whop - feature breakdown
- alphapass.app/resources/whop-fees-calculator.html - effective fee analysis
- paprika.bot/blog/best-patreon-alternatives - comp table
- whoptrends.com/blog/best-sports-betting-picks-whop-2026 - category revenue
- sacra.com/c/whop (Apr 2025) - $80-100M monthly GMV
- whop.com/blog/digital-products-in-demand (Oct 2025) - SaaS/courses demand
- whop.com/blog/popular-use-cases (Dec 2025) - 35 real whops
- whop.com/sell - business models supported
- whop.com/platforms - infrastructure overview
- whop.com/blog/consumer-guide (Nov 2024) - buyer experience
