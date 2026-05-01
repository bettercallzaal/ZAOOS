---
topic: business
type: market-research
status: research-complete
last-validated: 2026-05-01
related-docs: 363, 364, 443, 222, 252, 547, 552
tier: DISPATCH
---

# 581 - Whop Platform + Top Whop Creators Deep Dive (DISPATCH)

> **Goal:** Ground-truth Whop in 2026 (post-Tether, post-2.7% fee cut), profile creators who are actually crushing it, extract repeatable playbook moves, document the dark side, and decide ZAO's relationship with Whop given Craig Gonzalez (Whop Partnerships) is already on the ZAOstock advisory board.

## Key Decisions (Recommendations First)

| Decision | Verdict | Why | Owner | Trigger |
|---|---|---|---|---|
| **ZAOstock 2026 sponsorship via Craig G** | USE - pursue $5-10K Whop sponsorship slot | Craig already advisor, Whop just raised $200M from Tether at $1.6B, post-Tether they need creator-economy case studies in new geos. ZAOstock = ready-made indie story. | Zaal | DM Craig this week |
| **Move ZAO bootcamp / BCZ consulting cohort onto Whop** | USE - pilot one course in May | 2.7% + $0.30 fees beat Stripe-direct stack for digital products, native Discord role-gating eliminates manual admin, course + chat + livestream apps in one place. Treat as secondary channel, not primary home. | Zaal + BCZ | After Craig confirms relationship |
| **$ZABAL token-gating via Whop** | SKIP for now | Whop has Tether wallet (WDK) for hold/send but no on-chain balance verification or ERC-20 gating. Custom Whop App build required. Use Unlock Protocol or keep gating on ZAO OS. Revisit 2027. | n/a | Re-evaluate when Whop ships native web3 gating |
| **Make ZAO OS a Whop App** | SKIP | Whop Apps are single-purpose tools (chat, courses, livestream). ZAO OS is a full social client. Architectural mismatch, brand dilution. | n/a | Hard no |
| **Recruit Whop music creators for ZAOstock lineup** | LOW PRIORITY | Whop has no music education vertical. Top creators are trading / fitness / business coaching. Already-warm artists (Stilo, Clejan, Joseph Goats) are higher EV. | n/a | If Craig surfaces specific names, evaluate one-by-one |
| **Lift Whop playbook patterns into ZAO** | USE - copy 5 plays into ZAO OS roadmap | Free-tier funnel, drip content + weekly cadence, 2-tier pricing (entry $29 / inner $199), live calls 2x/week, cohort launches every quarter. Battle-tested at $1B+ GMV scale. | Zaal | Bake into ZAO OS Phase 2 + ZAOstock annual pass |

## TL;DR (Three Sentences)

Whop is a $1.6B creator-commerce marketplace (just raised $200M from Tether Feb 2026, fees are 2.7% + $0.30 since their Stripe-replacement launch in Oct 2025) doing roughly $100M/month GMV across 18.4M users and 183K active sellers, heavily skewed toward sports betting picks, trading signals, and high-ticket coaching cohorts. The top operators (Committed Coaches at $4.9M/mo, Stock Hours at ~$62M/yr, Iman Gadzhi's Monetise at $10M+ lifetime, Hamza's Adonis School at $2M+ ARR) all run the same playbook: free-to-paid funnel, recurring subs over one-time, weekly drip cadence, 2-8 live calls per week, tiered pricing that skips the middle. ZAO's right move is to (a) pitch Craig Gonzalez for a $5-10K ZAOstock sponsorship and a creator-economy panel, (b) pilot the BCZ consulting cohort + a ZAO OS bootcamp on Whop as a secondary sales channel, and (c) lift the playbook patterns into our own roadmap regardless of how the Whop relationship goes.

## Sub-Docs (Each Self-Contained)

- [a - Platform Fundamentals](a-platform-fundamentals.md) - what Whop is in 2026, fees, infra, funding, recent news
- [b - Top Creators Case Studies](b-top-creators.md) - 10 creators printing money, comparison table + deep dives
- [c - Playbook Patterns](c-playbook-patterns.md) - acquisition funnels, pricing tiers, retention, Whop apps, cohort cycles
- [d - Anti-Patterns and Risks](d-anti-patterns.md) - scams, fund freezes, FTC/SEC exposure, Trustpilot evidence
- [e - ZAO x Whop Integration Thesis](e-zao-integration.md) - API surface, sponsorship pitch, Craig pathway, reversibility plan

## Synthesis: How the Five Streams Converge

### 1. Whop is real and growing fast - and the moat is payment infra

The single most important fact post-research: in October 2025 Whop replaced Stripe Connect with their own multi-PSP routing layer. Fees dropped from 3% to **2.7% + $0.30**, approval rates went up 6-10%, and they now operate in 241 territories with 100+ local payment methods. Then Tether put in $200M in Feb 2026 at a $1.6B valuation, embedding the Tether Wallet Development Kit (WDK) so creators can take payouts in USDT/USAT directly. That is the moat. It's not the marketplace, not the apps - it's the payment rails.

**Implication for ZAO:** if we run any digital product (course, cohort, VIP ticket, paid Discord), Whop's effective rate of ~5.9% all-in (2.7% Whop + 2.9% + $0.30 Stripe-equivalent on a $100 sale) beats every alternative we'd assemble manually, and the auto-Discord-role-assignment removes a real ops headache.

### 2. The top creators all run the same five-move playbook

Across Committed Coaches ($4.9M/mo), Stock Hours (26K members), Iman Gadzhi's Monetise (6K+ members), and Hamza's Adonis School (~$2M ARR), the same patterns repeat:

1. **Free top of funnel** (free Discord, free X content, free TikTok clips) feeding into a paid community.
2. **Recurring subs over one-time** - monthly/annual beats one-time-course revenue by 89% per Whop's own data.
3. **Weekly drip cadence** instead of all-at-once dump - Monday theme, Wednesday content drop, Friday wins thread, drops 6-month churn from ~22% to ~7.5% in published case studies.
4. **2-8 live calls per week** - the single highest retention lever; communities with 2+ live calls/week land at 60-75% 90-day retention vs 40-55% without.
5. **Tier pricing that skips the middle** - either one tier or 6+ tiers, but avoid the 2-5 tier confusion zone. Sweet spots are entry $29-49/mo and inner-circle $199-499/mo.

ZAO already does some of this organically (Monday cobuild, Tuesday standup, weekly newsletter, Sopha curation). The gap is monetization tier design and a real free-to-paid funnel.

### 3. The dark side is mostly category-specific, not platform-wide

Whop's reputational risk concentrates in sports betting picks and unregistered trading-signal sellers, plus documented account freezes (90-180 day fund holds via Stripe risk pass-through). Trustpilot averages 3.7/5 across 2,339 reviews; the bad ones cluster on frozen funds + opaque appeals. There's no FTC or class-action against Whop itself yet, but the RagingBull $2.4M FTC settlement (2024) is a precedent for the same content categories.

**Implication for ZAO:** safe to associate Whop with a music/community/creator-tools narrative. Avoid co-branding inside trading or betting verticals. Keep a 90-day operating reserve off-platform if we ever sell anything significant on Whop.

### 4. The Craig Gonzalez pathway is unusually warm

Craig is already on the ZAOstock advisory board (per ZAO-STOCK/MASTER-PLAN.md and Doc 363) and Whop's 18-person partnerships team is incentivized post-Tether to surface creator-economy case studies in new geographies (LATAM, Europe, APAC). ZAOstock is a Maine indie-music festival run by a 188-member decentralized community - that is a *novel* story in their pitch deck. Three hooks (Zaal owns the actual message):

1. "ZAOstock is a real-world test of decentralized communities funding IRL events. Be the payment platform in that story."
2. "Post-Tether, you're expanding LATAM/APAC. Indie festivals are the kind of long-tail creator case study that's missing from the deck."
3. "I bought a house in Ellsworth. This isn't one event, it's annual. Whop's logo on Year 1 = brand equity for Years 2-5."

### 5. Lift the patterns regardless of whether Whop responds

The playbook moves (see sub-doc c) work on any platform. Even if the Whop relationship goes nowhere, the weekly cadence + free-to-paid funnel + tiered pricing + live-call-2x-week stack is directly cribbable into ZAO OS, ZAOstock annual pass, and BCZ consulting offers.

## Numbers That Matter (verify any time-sensitive claim before quoting)

| Metric | Value | Source | As of |
|---|---|---|---|
| Whop valuation | $1.6B | CoinDesk + Tether announcement | Feb 25, 2026 |
| Tether investment | $200M | CoinDesk + Tether press release | Feb 25, 2026 |
| Total funding raised | $217M across 5 rounds | Crunchbase + Wikipedia | Feb 2026 |
| Platform take rate | 2.7% + $0.30/txn (down from 3%) | docs.whop.com/payments-and-billing/fees | post-Oct 2025 |
| Effective fee w/ Stripe-equivalent (US card) | ~5.9% on a $100 sale | AlphaPass calculator | May 2026 |
| Active sellers | 183,628 | CBInsights | Feb 2026 |
| Total platform users | 18.4M+ | CBInsights | Feb 2026 |
| Monthly GMV | ~$100M | Sacra | Mar-Apr 2025 |
| Cumulative lifetime GMV | $2.67B | CBInsights | Feb 2026 |
| Sellers earning $1M+ lifetime | 258 | Whop year-end | Jun 2025 |
| Top 1% revenue share | ~57% of platform GMV | WhopLens analytics | Jan 2026 |
| Top product revenue (Committed Coaches) | $4.9M/month | Whop year-in-review | 2025 |
| Stock Hours members | 26K+ at $199-225/mo | Whop discover page + Scribe writeup | 2026 |
| Whop founders | Steven Schwartz, Cameron Zoub, Jack Sharkey (all ~25, NYC) | CNBC + Fortune | 2024-2026 |
| Craig Gonzalez role | Partnerships, Whop ($1.6B) - ZAOstock advisor | src/app/stock/sponsor/page.tsx:73 + Doc 363 | confirmed in repo |

## Cross-Refs Inside ZAO Repo

- `src/app/stock/sponsor/page.tsx:73` - Craig Gonzalez listed publicly as ZAOstock advisor with "Partnerships, Whop ($1.6B)" title
- `ZAO-STOCK/MASTER-PLAN.md:63` - Craig listed in core advisor roster
- `ZAO-STOCK/standups/dashboard.md:59` - Craig role described as "deal structure at scale"
- `research/community/363-zao-stock-people-brands-2026/README.md:85-95` - existing Craig profile (status: "need bio + links from him directly")
- `research/events/443-zao-stock-sponsor-pitch-drafts/README.md:105` - "advisors from Whop ($1.6B creator platform)" used in current sponsor pitch copy
- `research/events/418-birding-man-festival-analysis/README.md:15,109` - "Broadcast Partner - Whop" role-named credit framing already drafted

## Also See

- [Doc 363 - ZAOstock people + brands](../../community/363-zao-stock-people-brands-2026/) - Craig profile to extend with this doc's findings
- [Doc 364 - ZAO Festivals deep research](../../events/364-zao-festivals-deep-research/) - Whop sponsor table at line 399
- [Doc 443 - ZAOstock sponsor pitch drafts](../../events/443-zao-stock-sponsor-pitch-drafts/) - update with Tether $200M angle
- [Doc 222 - Payment infrastructure (Stripe + Coinbase)](../222-payment-infrastructure-stripe-coinbase/) - compare Whop 2.7% vs current stack
- [Doc 252 - New agent marketplace](../252-publish-new-agent-marketplace/) - Whop Apps SDK pattern reference
- [Doc 547 - ZAOstock master strategy](../../infrastructure/) - Cassie's "infrastructure is the product" frame; Whop = one node in that infra
- [Doc 552 - QuadWork / 1code comparison](../../) - similar "USE / PARTNER / SKIP" pattern

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Draft Craig G outreach DM (3 hooks above, Zaal voice, no claims he didn't approve) | Zaal | DM | This week |
| Update Doc 443 sponsor pitch w/ Tether $200M + Whop $1.6B post-Feb-2026 line | Zaal or Claude | PR | Before next sponsor pitch goes out |
| Extend Doc 363 Craig profile with Whop org context (172 employees, 18-person partnerships team, Brooklyn HQ, founders Steven/Cameron/Jack) | Claude | PR | Same PR as this doc |
| Pilot one BCZ consulting cohort or ZAO OS bootcamp on Whop in May 2026 | BCZ + Zaal | Product spike | After Craig conversation lands |
| Add weekly rhythm (Mon theme / Wed drop / Fri wins) to ZAO OS feed surface | Zaal | Roadmap | Phase 2 ZAO OS |
| Add free-tier-to-paid-tier funnel design to ZAOstock annual pass spec | Zaal | Roadmap | Q3 2026 |
| Track Whop's web3-native gating roadmap; revisit $ZABAL gating | Claude | Quarterly check | Aug 2026 |
| If Whop sponsorship lands, set 90-day off-platform reserve before any large product launch on Whop | Zaal | Ops | Before first Whop $5K+ revenue month |

## Sources

Each sub-doc has its own Sources section. Full union:

**Platform fundamentals (sub-doc a):**
- whop.com/network/pricing - current 2.7% + $0.30 fee
- docs.whop.com/payments-and-billing/fees - authoritative fee table
- whop.com/blog/payments-launch - Oct 2025 Stripe-replacement
- newsroom.whop.com/whop-payments - Sept 2025 multi-PSP routing
- tether.io/news/tether-invests-in-whop - Feb 25 2026 $200M / WDK
- coindesk.com/business/2026/02/25/tether-invests-usd200-million-in-digital-marketplace-whop - $1.6B confirmation
- pymnts.com/news/investment-tracker/2026/tether-investment-values-whop-at-1-6-billion - LATAM/Europe/APAC angle
- cbinsights.com/company/whop - 18.4M users, $2.67B GMV, 25% MoM
- crunchbase.com/organization/whop - $217M total raised across 5 rounds
- en.wikipedia.org/wiki/Whop.com - founder names, Series A/B/C
- fastcompany.com/91017915 + cnbc.com/2023/08/14 + fortune.com/2024/06/09 - Schwartz/Zoub/Sharkey backgrounds, Brooklyn HQ
- sacra.com/c/whop - $80-100M monthly GMV, audience composition
- whopscan.com/blog/whop-marketplace-overview-2026 - 70K+ products, $11B GMV est

**Top creators (sub-doc b):**
- whoptrends.com/blog/whop-2025-year-in-review - Committed Coaches $4.9M/mo
- whoptrends.com/blog/whop-creator-earnings-data-2026 - 191K products earnings analysis
- whop.com/blog/iman-gadzhi-case-study - Monetise $10M lifetime
- globenewswire.com/news-release/2025/04/02/3053917 - Iman Gadzhi co-owner April 2025
- whop.com/blog/stock-hours-review + whop.com/discover/stock-hours - Nour Atta 26K members
- ippei.com/adonis-school-community - Hamza Ahmed $2M ARR
- whop.com/blog/top-trading-whops + whop.com/blog/crypto-trading-whops - April 2026 leaderboards
- whop.com/discover/korvato/korvato-2 - Napoleon AI $20K software
- whop.com/discover/justin-welsh + mikestott.me/justin-welsh-building-his-one-person-business-to-10m-in-revenue
- sacra.com/research/whop-at-142m-revenue + sourcery.vc - $1.2B GMV run rate

**Playbook (sub-doc c):**
- whop.com/blog/community-engagement + whop.com/blog/membership-tiers-discord
- "We're Gonna Make It" podcast Oct 2025 (Cameron Zoub)
- "Max Tornow Podcast" Jan 2025 (Cameron Zoub)
- popup.fm/community-building-2026 - 1-9-90 rule
- setsmart.ai/828k-ai-dm-conversations-analyzed - DM funnel data
- filiato.com/whop-2026-practical-playbook - access-based business model
- insightraider.com/whop-analytics - churn benchmarks

**Anti-patterns (sub-doc d):**
- trustpilot.com/review/whop.com - 2,339 reviews 3.7/5
- medium.com/@jeanmariecordaro/whop-suspended-my-account - account freeze case
- sublyna.com/blog/whop-banned-content-what-now - appeal process guide
- whop.com/prohibited-products-and-services - official policy
- help.whop.com/en/articles/10971072 - Dispute Risk Score = 5 -> 90-day hold
- thecreatoreconomy.com/post/creator-burnout-epidemic-mental-health-2026 - 62% burnout
- traverselegal.com/blog/ftc-guidelines-for-influencers - 2025 FTC creator rules
- digiday.com/marketing creator-economy disclosure
- sec.gov/rules-regulations/2003/12/compliance-programs-investment-companies-and-investment-advisers
- bbb.org/us/ny/brooklyn/profile/ecommerce/whop-0121-87174000 - BBB profile

**ZAO integration (sub-doc e):**
- docs.whop.com/developer/api/getting-started - REST API + SDKs
- docs.whop.com/llms.txt - LLM-friendly API doc
- mcp.whop.com/sse - official MCP endpoint
- github.com/whopio/developer-documentation - SDK + apps
- deepwiki.com/whopio/developer-documentation/4-app-development - 150+ apps
- whop.com/blog/membership-tiers-discord - role auto-assignment
- ZAO repo: src/app/stock/sponsor/page.tsx, ZAO-STOCK/MASTER-PLAN.md, research/community/363, research/events/443

---

**Tier:** DISPATCH (5 parallel sub-agents, ~70 unique sources, 2-hour synthesis)
**Validates:** existing claims in Doc 363, 443, 364 about Whop $1.6B + Tether $200M (now confirmed Feb 25 2026 via CoinDesk + Tether press release)
**Supersedes:** nothing - extends Doc 363 Craig profile + Doc 443 pitch context
