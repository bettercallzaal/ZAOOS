---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-01
related-docs: 581, 363, 443, 364
tier: STANDARD
---

# 581e - ZAO x Whop Integration Thesis

> **Goal:** Decide ZAO's relationship with Whop given Craig Gonzalez (Whop Partnerships) is already on the ZAOstock advisory board. Outputs: USE / PARTNER / SKIP for each integration path + 3-hook pitch frame for Craig.

## Recommendation Table

| Integration Path | Verdict | Rationale | Effort | Risk |
|---|---|---|---|---|
| ZAO sells courses / bootcamp / consulting cohort via Whop | **USE** (pilot one) | Whop API mature, 2.7% + $0.30 fees beat assembled stack, native Discord role-gating eliminates manual admin, Course + Chat + Livestream + Calendar apps cover ZAO's needs | Medium | Low |
| Token-gated $ZABAL access via Whop | **SKIP for now** | Tether WDK is hold/send not ERC-20 verification. Custom Whop App build required. Use Unlock Protocol or keep gating in ZAO OS. Revisit 2027. | High | Medium |
| Whop sponsors ZAOstock 2026 (Oct 3 Ellsworth) | **PARTNER** | Craig already advisor + $1.6B Tether-backed Whop needs creator-economy case studies in new geos. ZAOstock = ready story. $5-10K realistic. | Low | Low |
| Make ZAO OS a Whop App | **SKIP** | Whop Apps are single-purpose. ZAO OS is full social client. Architectural mismatch + brand dilution. | n/a | High |
| Whop creators perform / sponsor ZAOstock | **LOW PRIORITY** | Whop's music vertical is thin. Stilo / Clejan / Joseph Goats are warmer. Revisit if Craig surfaces specific names. | Medium | Medium |

## 1. Whop API + Developer Surface

**Whop has production-ready APIs across checkout, payments, merchant onboarding, KYC, chat bots.**

- **REST API:** `https://api.whop.com/api/v1` with TypeScript / Python / Ruby SDKs
- **Checkout creation:** one-time or recurring with payment method control (crypto, bank transfer, card, Apple Pay)
- **Sub-merchant onboarding:** programmatic company creation + KYC links
- **Transfers / payouts:** automated creator payouts to sub-merchants
- **Chat / messaging:** native in-platform messaging, markdown
- **OAuth 2.1 + PKCE:** third-party sign-in, per-user scoped permissions
- **MCP support:** `https://mcp.whop.com/sse` (Claude) or `.../mcp` (Cursor)
- **Whop Apps SDK:** 150+ modular apps built on Next.js + Whop SDK
- Apps integrate Discord role assignment, Make.com workflows, Stripe/Zapier
- No public app marketplace yet; GitHub `whopio/developer-documentation` shows active ecosystem

**Relevance to ZAO:** API robust enough for custom payment flows + merchant management. ZAO could use Whop checkout + payout logic for ticketed events / paid courses without reimplementing rails. **Limitation:** no embedded wallet gating or smart contract integration yet.

## 2. Wallet-Gating + USDC/$ZABAL Compatibility

**Whop is moving toward blockchain payments but does NOT yet support web3 wallet-gating** ("hold $ZABAL to unlock content").

### Current Whop crypto stack
- Tether $200M Feb 2026 -> WDK embedded -> users hold/send USDT + USAT
- Crypto listed as enabled checkout payment method (lower fees than card)
- LATAM / Europe / APAC expansion explicitly stablecoin-driven

### What Whop does NOT offer (yet)
- Native ERC-20 token-gating (verify $ZABAL balance on Base before granting access)
- On-chain read ability to check wallet holdings
- Tether's WDK is custody-focused (hold/send), not verification-focused

### Path forward for $ZABAL gating
1. **Custom integration:** ZAO builds Whop App using their API + Viem/Wagmi to check $ZABAL balance pre-access.
2. **Whop feature request:** Craig pushes wallet-gating to Whop product team as post-Tether feature.
3. **Hybrid:** Whop for fiat/USDC checkout; Unlock Protocol or Guild.xyz for token-gating as separate layer.
4. **Standalone:** ZAO OS stays the auth layer (already checks Base holdings); Whop only for payment processing.

**Verdict:** Technically feasible but requires custom engineering. Not plug-and-play. **Lower priority than sponsorship or course-sales paths.**

## 3. ZAOstock 2026 Sponsorship

**Craig Gonzalez (Whop Partnerships, ZAOstock advisor board) is the warmest path.**

### Strategic fit
- **Audience alignment:** Whop serves creators / entrepreneurs who DM-fundraise + build communities. ZAO's mission resonates.
- **Valuation halo:** $1.6B post-Tether signals credibility to other sponsors.
- **Creator economy angle:** Oct 3 livestream + lineup of music creators = authentic Whop case study.
- **LATAM / global expansion angle:** Whop's expansion timing matches ZAOstock's Maine indie-festival novelty.

### Concrete deliverables for Whop
1. Dedicated stage mention - "Presented by Whop" / "Powered by Whop Payments" on livestream overlay + signage
2. Creator showcase panel - 15-20min talk: "How Independent Music Creators Build Sustainable Income"
3. Payment demo - QR code at Parklet linking to live Whop checkout for post-event merch / bootcamp pre-sales
4. Content partnership - mirror/video recap as Whop blog case study
5. Artist lineup cross-promo - Whop social posts introducing 2-3 performing artists + their creator economy models

### Budget expectation
$5K-$10K realistic given Whop's 18-person partnerships team + post-Tether creator-marketing focus. Could be classified internally as "creator ecosystem marketing" not pure event spend.

### Three strongest hooks for Craig (Zaal owns the actual message)

1. **Proof of concept:** ZAOstock + Whop case study = how a decentralized community funds IRL events. Unique vs typical Whop creator-cohort stories.
2. **Livestream audience:** 188 ZAO members + Farcaster network visibility + recorded content = built-in distribution for Whop's creator economy narrative.
3. **Timing:** Post-Tether LATAM/APAC expansion. Indie festivals are growth vector for global creator payouts. Maine angle is novel (not another NYC/LA/Miami event).

## 4. ZAO Products on Whop (Reverse Direction)

**Feasible and natural. Whop is optimized for exactly these product types.**

### ZAO products that could live on Whop
1. **ZAO OS Bootcamp** - 4-6 wk course on decentralized community building. Whop Course app built-in. $297-$997. Discord auto-role per tier.
2. **BCZ Consulting Cohort** - 8-wk group coaching with Zaal + team for indie artists/labels. Native Whop. $2K-$5K per artist. Course + Chat + Livestream apps.
3. **ZAOstock VIP Experience** - Oct 3 festival + lodging + artist meet-and-greet. Whop checkout $500-$1500. Auto-email logistics + POAP minting. Pre-event content drip on Course app.
4. **Sopha Curation Training** - teach other DAOs/communities how to run Sopha feeds. Whop membership tier $99-$199/mo for ongoing curation tips.

### Whop advantages over status quo
- **Payment:** ~5.9% all-in vs assembled Stripe + tax + Discord-bot stack
- **Community:** built-in chat + forums + livestream = no third-party tool chaining
- **Membership enforcement:** auto Discord roles based on purchase = less manual admin
- **Creator narrative:** "Buy now on Whop" frictionless for web3 audience already familiar
- **App ecosystem:** plug 150+ apps without custom integrations

### Tradeoff
- **Status quo:** ZAO OS is custom social client + Supabase. Full UX/data/routing control.
- **Whop path:** Whop hosts course/membership; ZAO still owns zaoos.com/stock for festival + ZAO OS social. **Whop = product channel, not primary home.**
- **Recommendation:** Whop as **secondary sales channel** for courses + consulting. Primary brand stays on zaoos.com.

### Effort + timeline
- **Low effort:** create 1-2 existing course outlines in Whop Course app (4-8 hrs). Publish + test checkout.
- **Medium effort:** tie Discord access to Whop purchases (Whop Bot OAuth setup + discord.py, 1-2 days)
- **High effort:** full bootcamp curriculum + video production (4-6 weeks if from scratch)

## 5. ZAO OS as a Whop App: SKIP

### Why not
- ZAO OS is a full operating system, not a niche creator tool.
- Whop Apps are single-purpose: Chat, Forums, Courses, Livestream, CRM.
- Architectural mismatch: Whop apps embedded inside Whop dashboard. ZAO OS is standalone client at zaoos.com.
- Market fit confusion: Whop creators buy individual tools to monetize audiences. ZAO sells entire community OS. Different mental model.

### Alternative: Whop *as an app inside ZAO OS*
Could embed Whop checkout widget inside zaoos.com. Technically yes. But:
1. OAuth setup (manageable)
2. Redirects checkout to Whop (loses brand continuity)
3. Supabase RLS already handles membership gating (why add Whop?)

**Verdict:** Not worth it. Whop = payment/community platform, not social network. Keep separate.

## 6. Whop Creators Performing / Sponsoring ZAOstock

**Possible but requires specific targeting. No single "music creator on Whop" cohort.**

### Music creator fragmentation on Whop
- Thousands of creators across trading, crypto, business, content creation.
- No public search by category or creator type; no "music" section visible.
- Successful Whop communities trend toward high-ticket coaching (Kaizen $199/mo, Skylit trading, Content Academy).
- Music-specific creator education not prominent in search.

### Potential parallel artist sources
1. **Sound.xyz creators** - on-chain music drops, some cross-post courses to Whop.
2. **BandCamp pro artists** - selling courses on side.
3. **Skillshare/Udemy music instructors** - teaching production.
4. **DeFi/NFT musicians** - already web3-literate, open to Whop sponsorships.

### Path: Craig G introduction
Craig could:
1. Query Whop creator database for "music" + "education" keywords.
2. Filter to creators with 1000+ community members (sponsor-worthy reach).
3. Introduce ZAOstock organizers to 3-5 creators for cross-promo / performance.

### Effort vs payoff
- **Effort:** Medium (Craig query + outreach + negotiation).
- **Payoff:** Low-medium (1-2 artist sponsorships or bootcamp pre-sales; not event-critical).

**Verdict:** Nice-to-have. Prioritize direct outreach to known ZAO friends (Stilo, Clejan, Joseph Goats already in orbit) before asking Craig to cold-intro Whop creators.

## 7. Craig G Partnership Pathway

### Current state
- Craig Gonzalez, Partnerships lead at Whop.
- Tether investment + WDK rollout = Whop's expansion moment.
- On ZAOstock advisory; familiar with team + vision.
- Listed publicly: src/app/stock/sponsor/page.tsx:73 + ZAO-STOCK/MASTER-PLAN.md:63 + Doc 363.

### Conversation starters (Zaal owns tone)
- "Craig, how can Whop best support ZAOstock as a test case for decentralized event funding?"
- "What would make ZAOstock interesting to Whop's marketing team as a creator-economy story?"
- "Can you intro 2-3 music creators on Whop who might want to sponsor or perform?"

### Expected outcomes
- Whop signals interest in $5K-$10K sponsorship - very likely
- Whop suggests joint case study blog post - medium likely
- Craig intros 1-2 Whop creators - possible, depends on music/festival alignment

## 8. Risk: Whop Dependency + Reversibility

### Reversibility plan
- **If Whop cuts music creator support:** ZAO courses migrate back to Teachable/Kajabi (3-5 day lift). Manual Supabase migration for existing students.
- **If Whop changes pricing/terms:** ZAO already owns zaoos.com + Supabase + community. Whop checkout is optional, not critical.
- **If sponsorship falls through:** $5-10K gap real but manageable vs $20K target. Bangor Savings Bank, local Ellsworth businesses, Giveth are alternatives.
- **If partnership sours:** Discontinue Whop app; no data loss. Community stays on ZAO OS.

### What NOT to do
- Don't move ZAO OS primary auth to Whop.
- Don't store governance data ($ZABAL, Respect tokens, votes) in Whop.
- Don't make ZAOOS repo dependent on Whop.
- Don't brand ZAOstock as "powered by Whop" until contract signed.

**Verdict:** Whop is tactically useful, not strategically required. ZAO retains full independence.

## Recommendation Summary

| Decision | Choice | Timing |
|---|---|---|
| Use Whop for course sales? | YES, pilot bootcamp + consulting cohort | May 2026 (2 wks to test) |
| Pursue Whop sponsorship for ZAOstock? | YES, via Craig G | DM this week; close by June 2026 |
| Token-gating integration? | SKIP for Year 1 | Revisit 2027 if product demand grows |
| Make ZAO an app on Whop? | NO | n/a |
| Recruit Whop creators for ZAOstock? | NICE-TO-HAVE via Craig | Post-sponsorship if bandwidth |

## Sources

- docs.whop.com/developer/api/getting-started
- docs.whop.com/llms.txt (LLM-friendly API doc)
- mcp.whop.com/sse (official MCP endpoint)
- github.com/whopio/developer-documentation
- deepwiki.com/whopio/developer-documentation/4-app-development (150+ apps)
- whop.com/blog/membership-tiers-discord (role auto-assignment)
- coindesk.com/business/2026/02/25/tether-invests-usd200-million-in-digital-marketplace-whop ($1.6B + $200M)
- ZAO repo: src/app/stock/sponsor/page.tsx:73 (Craig listed publicly)
- ZAO repo: ZAO-STOCK/MASTER-PLAN.md:63 (Craig in advisor roster)
- ZAO repo: ZAO-STOCK/standups/dashboard.md:59 (Craig role description)
- research/community/363-zao-stock-people-brands-2026/README.md:85-95 (Craig profile)
- research/events/443-zao-stock-sponsor-pitch-drafts/README.md:105 (current sponsor pitch w/ Whop framing)
- research/events/364-zao-festivals-deep-research/README.md:399 (Whop sponsor table)
- research/events/418-birding-man-festival-analysis/README.md:15,109 (Broadcast Partner framing)
