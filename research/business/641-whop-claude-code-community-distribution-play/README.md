---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-20
related-docs: [640-magnetiq-pivot]
original-query: "Should ZAO launch a paid Claude Code workshop or membership on Whop.com targeting digital creators? What are the economics, fit, and risks? (reconstructed)"
tier: STANDARD
---

# 641 - Whop for ZAO: Paid Claude Code Creator Community

> **Goal:** Evaluate Whop as a community/course platform for digital creators (Twitch streamers, YouTubers, podcasters) learning Claude Code automation. Route graduates to ZAO as $ZABAL stakeholders.

## Key Decisions (DO THIS)

| # | Decision | Why |
|----|----------|-----|
| 1 | **Launch MVP: 4-week Claude Code workshop ($49-99)** | Low risk, high ROI test. 100 slot cap = $5K-10K revenue. Proves demand before investing in membership tier infrastructure |
| 2 | **Acquisition: Magnetiq + owned channels** (not Whop Explorer) | Whop Explorer requires 30+ days seeding + organic reviews. Magnetiq bot on X/Telegram = instant. 3K+ Magnetiq followers = guaranteed warm audience |
| 3 | **Pricing: $79 one-time OR $19/month membership** | Test both cohorts (50% each). One-time captures committed learners; monthly captures tinkerers who churn but refer |
| 4 | **Onboarding gate: $ZABAL wallet verification** | After course completion, require students to buy $50 ZABAL minimum to join ZAO Discord. Creates economic alignment; filters low-commitment members |
| 5 | **Treat Whop as one channel, not foundation** | Platform risk is real (fees could rise, terms could change). If successful, build own course infrastructure on ZAOOS later. Whop = proof-of-concept only |

## Recommendation: TEST with paid course + referral + $ZABAL integration path

Launch a small paid course or workshop on Whop targeting Twitch streamers / YouTube creators learning Claude Code automation. Use it as a funnel to onboard creators into ZAO as $ZABAL stakeholders. Whop's fees (2.7% + $0.30 base, +3% for automations) are lower than Patreon (8-12%) and the API supports programmatic enrollment tracking. The Explorer discovery mechanism is weak (requires 30-day seeding + initial reviews), so own acquisition via Magnetiq + Farcaster is more reliable. Avoid vendor lock-in by treating Whop as one acquisition channel, not the foundation.

## What Whop actually is

Whop.com is a creator economy platform founded in 2023 that lets creators sell courses, memberships, SaaS tools, eBooks, and digital downloads from a unified dashboard. Community features include Discord integration, livestreaming, group chat, and course management. The platform has grown rapidly and eliminated its 30% marketplace commission in May 2025, making it more competitive. Whop is backed and actively hiring (confirmed by Greg Gonzales now working there).

## Pricing & Fee Structure (May 2026)

| Component | Rate | Notes |
|-----------|------|-------|
| **Base transaction fee** | 2.7% + $0.30 | Domestic cards (lowest base rate) |
| **International cards** | +1.5% additional | Canada, EU, etc. |
| **Currency conversion** | +1% | If customer pays in non-USD |
| **Automation fees** (Discord role, Telegram, etc.) | +3% | Trigger-based automations (gating, auto-DMs) |
| **Payout fees** | $2.50 (next-day ACH) | Crypto payouts: 5% + $1 |
| **Monthly platform fee** | $0 | No flat fee unlike Circle ($89-399/mo) |

**Reality check:** For $100 sale of Claude Code workshop:
- Whop base: 2.7% + $0.30 = $2.70 + $0.30 = $3.00
- If using automations (Discord): +3% = $3.00
- Payout to bank: -$2.50 next-day ACH
- **Net from $100 sale: ~$91.50** (8.5% total cost)

Compare: Patreon takes 8-12% flat; Circle charges $89-399/mo + 1.9%. Whop is competitive on variable rate, better if you have high transaction volume.

## Discovery & Acquisition Reality

### Whop Explorer (Built-in Marketplace)

| Stage | Timeline | Challenge |
|-------|----------|-----------|
| **Days 1-30** | Cold start | No organic traffic; Explorer algo ignores new products |
| **Days 30-60** | Seeding phase | Organic traffic begins IF you have initial sales/reviews |
| **Days 60+** | Compounding | Algo favors trending products; positive feedback loop |

**Verdict:** Explorer discovery is unreliable for cold starts. First 100 customers must come from owned channels (email, Farcaster, Magnetiq bot, YouTube). After 30 days of social proof, Explorer can drive secondary traffic (10-20% of new signups).

### Content Rewards Workaround

Whop offers "Content Rewards": pay creators (influencers, reviewers) to create content promoting your product. Cost: ~$100-500 per creator. Upside: guaranteed seeding + social proof. Downside: additional cost reduces margins.

**For ZAO:** Magnetiq bot is free + owned channel. Use Magnetiq first (1000s of followers). If response < 10%, then consider Content Rewards as paid acquisition channel.

## API + developer tooling

Whop has a mature REST API (v1 at api.whop.com/api/v1) with SDKs in TypeScript, Python, and Ruby. Available via MCP at https://mcp.whop.com/sse (Claude-compatible). 

Key capabilities:
- Create checkout configurations (one-time, recurring, multiple payment methods including crypto + US bank transfer)
- Onboard sub-merchants (pay creators directly)
- Programmatic KYC flows
- Chat bot message sending (markdown supported)
- OAuth 2.1 + PKCE for "Sign in with Whop"

Token-gating is NOT natively supported. To check if a user owns $ZABAL, you'd need to:
1. Add custom metadata fields to Whop purchases
2. Call an external Supabase / Coinbase API to verify wallet balance post-purchase
3. Grant access via Discord roles or course enrollment

This is doable but adds a layer of complexity over native Farcaster Frames or ZAOOS embedded tokenomics.

## Claude Code Creator Community Product Options

### Option A: 4-Week Workshop ($49-99, 100 slot cap)

**Modules:**
1. **Week 1:** Claude Code fundamentals + workflow automation (Telegram/Discord bots)
2. **Week 2:** Content creation agents (Paragraph publishing, social post generation)
3. **Week 3:** Building custom tools (API routes, serverless functions)
4. **Week 4:** Case studies + live build-alongs (3x per week Whop livestream)

**Revenue:** $79 x 100 students = $7,900 gross. After Whop fees (8.5%): $7,212 net. Target: 50% margin on materials/hosting = $3,600 profit.

**Runway:** 4 weeks. Quick iteration. Easy to sell as "limited cohort".

### Option B: Monthly Membership ($19-29/mo)

**Included:**
- Weekly live office hours (Whop livestream)
- Private Discord server (Whop auto-role)
- Course library (modules released weekly)
- Access to Zaal + agent team for Q&A

**Revenue:** $24/mo x 50 active members = $1,200/mo recurring. After Whop (8.5%): $1,098/mo = $13,176/year.

**Churn risk:** Membership model has 5-10% monthly churn. Requires constant engagement. Higher risk than workshop.

**Recommendation:** Launch with Option A (workshop). If >80% sell-out, then launch Option B (membership) as upsell.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Vendor lock-in** | Whop changes fees / shuts down = platform risk | Treat as acquisition channel only. Build own course infra on ZAOOS after PMF |
| **Explorer weak** | No organic traffic in first 90 days | Use Magnetiq bot + owned channels for acquisition; don't rely on Explorer seeding |
| **Fee stacking** | 8.5% total cost reduces margins | 4-week workshop has lower customer service cost than membership; margins still healthy |
| **Cannibalization** | Course graduates don't convert to ZAO members | Gate Discord with $ZABAL requirement post-course. Aligns incentives. Forces skin-in-the-game. |
| **Cultural mismatch** | Whop audience (crypto signals, sports betting) != ZAO audience (musicians, web3 builders) | Monetize creators (Twitch/YouTube) separately from musicians. No audience overlap = no cannibalization |
| **Churn (membership)** | 5-10% monthly churn eats recurring revenue | Launch workshop first, not membership. Prove demand before committing to recurring model |

## Comparison table

| Platform | Fee | Discovery | Payments | Courses | Live Stream | Discord Integration | Token-gating |
|---|---|---|---|---|---|---|---|
| **Whop** | 3% (2.7% + $0.30) | Weak algo | Built-in | Yes | Yes | Native | Via custom API |
| Patreon | 8-12% | None | Built-in | Limited | No | No | No |
| Circle | $89-399/mo | None | Stripe | Yes | No | No | Via Zapier |
| Discord + Stripe | 2.9% + $0.30 | None | DIY | DIY | Voice only | Native | Native bots |
| ZAOOS native | 0% (Coinflow cost) | Farcaster | Coinflow | DIY | Stream.io | XMTP | Native $ZABAL |

## Sources

- [Whop Pricing 2026: Plan Comparison, Transaction Fees & Alternatives - SchoolMaker](https://www.schoolmaker.com/blog/whop-pricing) [FULL - current fees, Patreon comparison]
- [Whop Fees 2026: The True Cost - Dodo Payments](https://dodopayments.com/blogs/whop-fees-explained) [FULL - fee breakdown, payout options]
- [Getting Started with Whop - Whop Docs](https://docs.whop.com/developer/api/getting-started) [FULL - API reference]
- [Whop Discover - Marketplace](https://whop.com/discover/) [FULL - live product listing]
- [How to Set Up Content Rewards on Whop](https://whop.com/blog/set-up-content-rewards/) [FULL - influencer seeding strategy]
- [How to Create a Paid Discord Server Using Whop](https://whop.com/blog/paid-discord-server/) [FULL - Discord automation]
- Internal: Tyler call transcript 2026-05-11, Greg Gonzales (Whop product insider)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create Whop account @bczaal (BetterCallZaal Claude Code) | Zaal | Setup | 2026-05-22 |
| Draft 4-week workshop syllabus (4 modules, 20 hours total content) | Zaal | Writing | 2026-05-30 |
| Sync with Magnetiq team: add Whop workshop to bot promotional flow | Zaal | Alignment | 2026-05-30 |
| Set pricing test: 50 slots at $79, target 40 sales = $3,160 profit | Zaal | Decision | 2026-05-31 |
| Launch private beta (10 free spots) to ZAO members for feedback | Zaal | Launch | 2026-06-10 |
| Go live with Magnetiq promotion (X + Telegram) | Zaal | Marketing | 2026-06-15 |
| Analyze Day-30 cohort data: completion rate, student feedback, referrals | Zaal | Analytics | 2026-07-15 |
| Decision: scale to membership tier OR close Whop + build own | Zaal | Decision | 2026-08-01 |

## Sources

- [Whop Pricing 2026: Plan Comparison, Transaction Fees & Alternatives - SchoolMaker](https://www.schoolmaker.com/blog/whop-pricing)
- [Whop Fees 2026: The True Cost (3% + Payout + FX = ~7%) - Dodo Payments](https://dodopayments.com/blogs/whop-fees-explained)
- [Getting started - Whop Docs](https://docs.whop.com/developer/api/getting-started)
- [Whop Discover - Marketplace](https://whop.com/discover/)
- [What is a whop: Complete guide - Whop Blog](https://whop.com/blog/what-is-a-whop/)
- [How to set up Whop Content Rewards](https://whop.com/blog/set-up-content-rewards/)
- [How to create a paid Discord server using Whop](https://whop.com/blog/paid-discord-server/)
- Call transcript: Zaal-Tyler 2026-05-11
- Inside info: Greg Gonzales, Whop product team (via Zaal)
- Memory: [[project_zao_master_context]], [[project_zao_canonical_pitch]], [[user_zaal]]
