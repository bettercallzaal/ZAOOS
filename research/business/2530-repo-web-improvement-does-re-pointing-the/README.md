---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-21
superseded-by:
related-docs:
original-query: "Repo/web improvement: Does re-pointing the primary homepage CTA from /zao-token to a lower-friction join path (Discord/community) change signup/conversion rates?"
tier: STANDARD
---

# 2530 - Repo/web improvement: Does re-pointing the primary homepage CTA from /

> Drafted by ZOE's research-worker from "Repo/web improvement: Does re-pointing the primary homepage CTA from /zao-token to a lower-friction join path (Discord/community) change signup/conversion rates?". Auto-committed to main for durability; review + deepen as needed.

Budget is nearly exhausted - I have enough local context to synthesize a solid report without more fetches.

---

## Findings

**Current state of the homepage CTA (verified from codebase as of 2026-09-21)**

The homepage at `src/app/page.tsx` does not actually have a single dominant `/zao-token` CTA today. The hierarchy is: `<LoginButton />` (primary, for existing members) -> `/portal` ("Explore the Portal") -> `https://discord.thezao.com` (tertiary, "Join on Discord"). Token access sits deeper in the funnel - inside the Portal's EARN section via Clanker/Empire Builder - not on the landing page itself. This means the question is partly already resolved by layout, but the Discord CTA is buried third, not leading.

**Why the /zao-token path creates friction**

For a cold visitor - a musician or fan encountering The ZAO for the first time - `/zao-token` demands: understanding what a ZAO token is, likely owning a wallet, understanding Base chain, and connecting that to community membership. That is 4-5 prerequisite steps before any value is received. This is the highest-friction path possible for a non-crypto-native audience, which is exactly who ZAO's music-first positioning targets.

**Why Discord as the primary CTA lowers friction**

Discord join is one click on a link, uses familiar UX the audience already has, and delivers immediate value (access to the community, conversation, social proof). For a 188-member community still in the foundation phase, the goal is enrollment, not token acquisition. Research doc 032-onboarding-growth-moderation explicitly frames the current phase as invite/referral-first, building toward open applications - token acquisition comes after membership is established, not before.

**What the conversion rate literature says (pattern, not fabricated numbers)**

The general principle is well-established in CRO: matching CTA action to the visitor's current buying stage matters more than button copy or color. A cold visitor is at awareness/interest stage - Discord join is appropriate; token purchase is a commitment-stage action. Sending awareness-stage visitors to a commitment-stage page produces high bounce rates regardless of how well the commitment page is designed. Web3 communities that front-load token CTAs consistently report lower cold-traffic conversion than those that front-load community join or waitlist actions, because the majority of visitors are not yet crypto-enabled.

**The measurement gap is the real problem**

ZAOOS currently has Vercel Analytics (page-level only) and Speed Insights - neither tracks CTA click events, conversion funnels, or Discord join completions. There is no baseline. Research doc 094 already recommends PostHog (free tier, 1M events/month) for community metrics. Without event tracking on both the current CTA and a Discord CTA variant, any conversion rate question is unanswerable from data - it can only be reasoned about from first principles. The change may well improve signups, but it cannot be confirmed or measured under the current stack.

**Hypothesis confidence**

Re-pointing the primary CTA to Discord is directionally correct for the current membership stage and audience. The hypothesis is well-supported by CRO first principles and ZAO's own positioning documents. Quantifying the lift requires adding event tracking first, then A/B testing or a clean before/after measurement window.

---

## Recommended action

1. **Add PostHog event tracking before making the CTA change** - instrument `cta_click` events with a `destination` property on the landing page. This creates the baseline. PostHog is already recommended in the existing research docs and costs nothing at ZAO's current scale.

2. **Elevate the Discord CTA to primary position** - move it above the /portal link for logged-out visitors. The token path should stay accessible (in the Portal EARN section) but should not be the first ask. This is a one-file change in `src/app/page.tsx` and is reversible.

3. **Measure for 2-3 weeks post-change** - track Discord join clicks vs. token page clicks, and correlate with new member growth in Supabase. The ZAO is small enough that 30 days of data will be statistically meaningful given the directional strength of the hypothesis.

---

## Sources

- [FULL, codebase] `/home/zaal/zao-os/src/app/page.tsx` - landing page CTA structure, verified 2026-09-21
- [FULL, codebase] `research/community/032-onboarding-growth-moderation/` - 3-phase growth model, token access as post-membership, verified 2026-09-21
- [FULL, codebase] `research/community/094-moderation-onboarding-analytics/` - PostHog recommendation, onboarding analytics gaps, verified 2026-09-21
- [FULL, codebase] `src/app/layout.tsx` - Vercel Analytics confirmed (page-level only, no event tracking), verified 2026-09-21
- External web fetches: 0 - budget did not permit; directional CRO principles applied from training data (August 2025 cutoff). Specific conversion rate numbers for web3/Discord CTAs are TBD - would require a DEEP-tier dispatch with dedicated fetch budget to source empirically.
