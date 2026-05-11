---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-11
related-docs: [640 - Magnetiq pivot]
tier: STANDARD
source: tyler-call-transcript-2026-05-11
---

# 641 - Whop.com for ZAO: Claude Code community + distribution play

Goal: decide whether to build a paid Claude Code community on Whop, and how it routes attention back to The ZAO.

## Recommendation: TEST with paid course + referral + $ZABAL integration path

Launch a small paid course or workshop on Whop targeting Twitch streamers / YouTube creators learning Claude Code automation. Use it as a funnel to onboard creators into ZAO as $ZABAL stakeholders. Whop's 3% fee is lower than alternatives and the API supports token-gating via integrations. The Explorer discovery mechanism is weak (requires 30-day seeding + initial reviews), so own acquisition via Magnetiq + Farcaster is more reliable. Avoid vendor lock-in by treating Whop as one acquisition channel, not the only one.

## What Whop actually is

Whop.com is a creator economy platform founded in 2023 that lets creators sell courses, memberships, SaaS tools, eBooks, and digital downloads from a unified dashboard. Community features include Discord integration, livestreaming, group chat, and course management. The platform has grown rapidly and eliminated its 30% marketplace commission in May 2025, making it more competitive. Whop is backed and actively hiring (confirmed by Greg Gonzales now working there).

## Pricing (current, 2026)

Creator side: 2.7% + $0.30 per transaction (domestic cards), +1.5% for international, +1% currency conversion. No monthly subscription fee. This is lower than Circle ($89-399/mo flat), Patreon (8-12%), and similar to Stripe + manual payment processing.

No tiered "Pro" or "Enterprise" plan exists yet. All creators have access to the same features: courses, memberships, livestreaming, community chat, Discord automation, checkout embeds.

## Distribution claim: The Explorer

Whop Discover is a built-in marketplace where creators can list products. Discoverability is algorithm-driven (categories, trending, search), similar to app store browsing. However, the algorithm is weak for new creators:

- Requires 30+ days of social proof (sales, reviews) before organic traffic compounds
- First 30 days are critical: focus on getting initial customers, reviews, and engagement
- No guaranteed distribution
- Content Rewards system exists (pay creators to review your product on social media) but this adds cost and effort

Verdict: Explorer discovery is unreliable for cold starts. Real traction comes from owned channels (email, Farcaster, YouTube, TikTok). Greg Gonzales' claim "they just find you" is overstated; the algorithm favors products with existing momentum.

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

## The Claude Code community for digital creators play

Zaal's pitch: create a paid community (course or membership) teaching Claude Code workflows to digital creators (Twitch streamers, YouTubers, podcasters, digital agency owners). Platform: Whop (payments + livestream + chat + course builder). Audience: young, fast-moving creators who need AI automation.

Why Whop vs alternatives:
- Payments integrated (3% fee is lower than Patreon 8-12%)
- Live streaming built-in (vs Discord + separate Restream)
- Courses built-in (vs building on Circle or Teachable)
- Discord role assignment on purchase (can gate a Discord server)
- API allows programmatic payment flows for future integrations

Why this is viable for ZAO:
- Bridges two audiences: digital creators seeking AI tools (Whop's user base) and musicians/artists seeking distribution ($ZABAL holders, ZAO members)
- Creates an onboarding funnel: Whop students -> learn Claude Code -> join ZAO as emerging artist/producer cohort
- Magnetiq bot amplifies the pitch on X/Telegram; Whop handles payments and community
- Greg Gonzales (insider at Whop) can fast-track API access and product feedback

## Risks

- Vendor lock-in: Whop could change fees, features, or shut down. Treat as a channel, not a foundation.
- Weak Explorer discovery: don't expect organic traffic in first 90 days. Requires heavy upfront acquisition.
- Fee stacking: 3% Whop + 2.9% + $0.30 Stripe + potential future Coinflow integration = complexity and margin loss. For $100 sale, take-home is ~$94 after fees.
- Cultural mismatch: Whop skews sports betting, crypto signals, SaaS tools. ZAO's music + web3 mission is different. Audience overlap exists but isn't tight.
- Cannibalization: if Whop course succeeds, will students stay as paying ZAO members after? (They should, if the onboarding is intentional.)

## Comparison table

| Platform | Fee | Discovery | Payments | Courses | Live Stream | Discord Integration | Token-gating |
|---|---|---|---|---|---|---|---|
| **Whop** | 3% (2.7% + $0.30) | Weak algo | Built-in | Yes | Yes | Native | Via custom API |
| Patreon | 8-12% | None | Built-in | Limited | No | No | No |
| Circle | $89-399/mo | None | Stripe | Yes | No | No | Via Zapier |
| Discord + Stripe | 2.9% + $0.30 | None | DIY | DIY | Voice only | Native | Native bots |
| ZAOOS native | 0% (Coinflow cost) | Farcaster | Coinflow | DIY | Stream.io | XMTP | Native $ZABAL |

## Actions this week

| Action | Owner | Type | Deadline |
|--------|-------|------|----------|
| Spin up Whop test account, claim @zaal or @bcz handle | Zaal | Manual | Tue 2026-05-14 |
| DM Greg Gonzales: request API key, product intro, Enterprise tier questions | Zaal | Message | Tue 2026-05-14 |
| Define MVP scope: 1) paid 4-week Claude Code Workshop ($49-99, 100 slot cap) OR 2) monthly membership tier ($19-29/mo) | Zaal | Decision | After Greg call |
| If Workshop: outline 4 modules (Agents, Prompt Eng, Building Tools, Case Studies), draft syllabus | Zaal | Writing | Fri 2026-05-16 |
| Link Whop integration to Magnetiq bot (doc 640): Whop purchase -> post to @magnetiq with Claude Code achievement tag | Zaal | Engineering | After MVP scope locked |

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
