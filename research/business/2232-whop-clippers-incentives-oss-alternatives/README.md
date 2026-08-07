---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2231, 2230, 2225
original-query: "use Whop for clippers + incentives alongside POIDH for incentivized clipping; and: what if people pay in crypto but we give them Whop subscriptions, like use Unlock"
tier: DEEP
---

# 2232 - Whop for clippers + incentives: the OSS/on-chain check-twice + the Unlock bridge

> **Goal:** Zaal wants Whop for the clipper + incentive layer (with POIDH), and asked
> "what if people pay in crypto but we give them Whop subscriptions, like use Unlock?"
> Per Zaal's standing rule (always weigh OSS/on-chain alternatives on GitHub before
> committing, check twice), this grounds Whop, surveys the real alternatives across both
> layers, and lands on the recommended hybrid.

## What Whop actually is (grounded)

Whop's **Content Rewards** is a view-based creator-payout marketplace. A Seller funds a
pool, sets a rate ($/1,000 views), a Max Payout, an optional Min Payout + flat-fee bonus,
allowed platforms, and content rules. Clippers/creators submit posts; an AI reviewer +
48h manual window approve (auto-approve after 48h if not rejected); approved posts pay
per **verified** views (bots/fraud excluded "in Whop's sole discretion"), settled in
**Whop Credits**, paid out every 7 days above a threshold. Two campaign types: **clipping**
(cut existing long-form into shorts) and **UGC** (original). [FULL: whop.com content-rewards-terms-of-service, docs.whop.com/.../content-rewards, whop.com/blog/whop-content-rewards]

**Fees:** Whop takes **10% of Seller payouts** (Content Reward Fee) per the ToS, and a
**7% clipper-side fee** per contentrewards.com FAQ. **Developer surface is real:** REST
`api.whop.com/api/v1`, SDKs (TS/Python/Ruby), Standard-Webhooks (`payment.succeeded`,
`membership.activated`, `ledger_account.funds_available`), programmatic **transfers/payouts**
with KYC sub-merchants, crypto accepted at checkout, and an **MCP server** (`mcp.whop.com`).
[FULL: docs.whop.com/developer/api/quickstart, /guides/webhooks, /api/getting-started]

**Honest read:** Whop is fast, proven, and low-lift, but it is a **closed platform** -
~7-10% fees, off-chain "Whop Credits," and view-verification at Whop's discretion. That
cuts against ZAO's OSS-first, on-chain, creator-first grain. So we check twice.

## Check twice: the OSS / on-chain alternatives (verified via gh api, with licenses)

Two DISTINCT layers - do not conflate them:

### Layer A - clip PRODUCTION (make the clips)
| Repo | Stars | License | Note |
|------|-------|---------|------|
| clawdbotatg/clawd-clipper | - | MIT (via parent) | Already assessed doc 2231 - 4-stage LLM pipeline, hallucination-proof word anchoring. |
| mutonby/openshorts | 2926 | **NOASSERTION** (README says MIT self-host; repo license unclear - VERIFY before reuse) | Biggest by far; self-host + MCP server + agent API; pushed 2026-08-06. |
| m-hoseyny/teek (+ SupoClip) | 6 | **AGPL-3.0** (share-alike - obligations if we ship on top) | Self-hosted OpusClip alt, local Whisper. |

### Layer B - clip INCENTIVE / payout (pay clippers per view)
| Repo | Stars | License | Note |
|------|-------|---------|------|
| **Whop Content Rewards** | - | Closed platform | Proven, low-lift, ~7-10% fee, off-chain credits, centralized verification. |
| tot/clipper | 0 | **NONE (unlicensed)** - study only, cannot legally reuse code | The closest OSS Whop-clone: Next.js+Supabase+Stripe Connect, campaign rules, Bright Data metrics scraping, payout statements. Great reference architecture. |
| bitcast-network/bitcast | 9 | **MIT** | Decentralized (Bittensor subnet): creators publish YouTube to briefs, validators verify via YouTube Analytics OAuth, on-chain token payout, anti-fraud lookback. On-chain + verified, but Bittensor-specific. |
| syntaxsurge/clip-yield | 0 | **NONE (unlicensed)** - study only | ON-CHAIN clip sponsorship on Mantle: sponsor with WMNT, mint **Invoice Receipt NFTs (terms hash)**, payouts as **ERC-4626 vault shares**, KYC-gated. Hackathon-grade, but the receipts+vaults pattern maps 1:1 onto tonight's trust chain (#2912/#2913). Reference pattern. |
| getcoherence/openpartner | 4 | **MIT** | OSS affiliate/attribution + Stripe Connect payouts (click->signup->revenue). More affiliate than clipping; relevant to the incentive/attribution rail + [[project_attributed_onboarding_discord_hats]]. |

**Finding:** there is no drop-in OSS Whop-Content-Rewards you can just run (tot/clipper is
the closest but UNLICENSED; on-chain ones are hackathon-grade or Bittensor-bound). So the
realistic choice is **Whop now for speed** vs **build the ZAO-native rail on POIDH** (already
on Base, CLAWD/USDC) using tot/clipper + clip-yield as reference patterns - a bigger lift.

## Zaal's Unlock bridge - the recommended hybrid (and ZAO already runs Unlock)

Zaal's idea - "pay in crypto, grant Whop access, like use Unlock" - is the best of both,
and it is grounded: **ZAO already integrates Unlock Protocol** for on-chain event tickets
(`src/app/api/events/create/route.ts` - "lock on events.unlock-protocol.com"; `verify-ticket`
route; `unlock_event_url`). Unlock is **MIT, on-chain memberships on Base, 878 stars, pushed
2026-08-06** ("a protocol for memberships built on a blockchain"). [FULL: gh api unlock-protocol/unlock + ZAO src grep]

**The hybrid:** Unlock = the crypto-native, OSS, ZAO-OWNED payment + access rail (an Unlock
**lock** = an on-chain, crypto-purchasable membership key ZAO controls). Whop = the community
+ clipper-campaign backend. **Bridge:** an on-chain Unlock key purchase -> grant/comp a Whop
membership. This is feasible from the grounded APIs: Whop exposes `membership.activated`
webhooks + a memberships API (`memberships.addFreeDays`, checkout, metadata) - so an Unlock
key-purchase event (or ZAO's existing Unlock webhook) can drive a Whop membership grant.
Net: crypto/on-chain front door (Unlock, already-integrated, no platform lock-in), Whop only
where it adds real value (the clipper campaign UI + payout ops), and the door ZAO owns.

## Recommendation (all money/platform/on-chain choices are GATED - Zaal's call)

1. **Clip production:** use **clawd-clipper** (MIT, assessed doc 2231) as the ZAO pipeline;
   consider **openshorts** only after verifying its license (NOASSERTION is a blocker for reuse).
2. **Clip incentive - phase 1 (speed):** run a **Whop Content Rewards** clipper campaign to
   validate demand fast (accept it costs ~7-10% + is off-chain). Pair with **POIDH** for the
   on-chain bounty half (POIDH is already ZAO's Base+CLAWD/USDC rail).
3. **Access rail - the Unlock bridge:** gate paid access with **Unlock** (crypto-in, ZAO
   already runs it for events) and bridge Unlock key -> Whop membership. This keeps the money
   door OSS + on-chain + ZAO-owned even while using Whop's backend.
4. **Phase 2 (own it):** if the clipper program works, migrate the incentive rail on-chain
   using **tot/clipper's architecture** (reference, unlicensed - reimplement, don't copy) +
   **clip-yield's receipts+vaults pattern** on POIDH - which reuses tonight's trust chain
   (agent-receipts #2913 = the per-clip receipt; erc8004 #2912 = clipper identity). Then Whop
   becomes optional, not the rail.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DECISION: run a phase-1 Whop Content Rewards clipper campaign? (money + platform = Zaal's call) | @Zaal | Decision (gated) | 2026-08-10 |
| DECISION: Unlock-key -> Whop-membership bridge as the crypto access rail (extends existing ZAO Unlock events integration) | @Zaal | Decision (gated) | 2026-08-10 |
| Verify openshorts license (NOASSERTION) before any reuse; confirm clawd-clipper as the production pipeline | @Zaal (Claude) | Research | 2026-08-08 |
| If green: spec the on-chain phase-2 incentive rail on POIDH (tot/clipper arch + clip-yield receipts/vaults, reusing #2912/#2913) | @Zaal (Claude) | Research doc | 2026-08-12 |
| Review in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **Whop** [FULL]: whop.com/content-rewards-terms-of-service, docs.whop.com/memberships-and-access/third-party-apps/content-rewards, docs.whop.com/developer/api/quickstart + /guides/webhooks + /api/getting-started, whop.com/blog/whop-content-rewards, contentrewards.com/faqs (fees).
- **OSS/on-chain alternatives (gh api verified 2026-08-06, licenses confirmed):** tot/clipper (unlicensed), bitcast-network/bitcast (MIT), syntaxsurge/clip-yield (unlicensed), getcoherence/openpartner (MIT), m-hoseyny/teek (AGPL-3.0), mutonby/openshorts (NOASSERTION). [FULL]
- **Unlock Protocol** [FULL]: gh api unlock-protocol/unlock (MIT, 878 stars) + ZAO existing use: `src/app/api/events/create/route.ts`, `verify-ticket` route.
- Doc 2231 (clawd-clipper triage), [[project_poidh_bounty_live]], [[project_attributed_onboarding_discord_hats]]. [FULL, in-repo]

## Also See

- [Doc 2231](../../agents/2231-clawd-repo-sweep-workflow-triage/) - clawd-clipper full-spec queue.
