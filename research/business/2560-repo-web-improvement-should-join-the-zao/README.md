---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-26
superseded-by:
related-docs:
original-query: "Repo/web improvement: Should \"Join the ZAO\" route to a Discord invite instead of /zao-token, and does that change signup conversion?"
tier: STANDARD
---

# 2560 - Repo/web improvement: Should "Join the ZAO" route to a Discord invite 

> Drafted by ZOE's research-worker from "Repo/web improvement: Should "Join the ZAO" route to a Discord invite instead of /zao-token, and does that change signup conversion?". Auto-committed to main for durability; review + deepen as needed.

I have enough codebase-verified context and the directly relevant existing research doc. Let me synthesize.

---

## Findings

**Current "Join the ZAO" CTA state (codebase-verified, 2026-09-26)**

There is no single button labeled "Join the ZAO" on the main homepage that routes to `/zao-token`. The homepage (`src/app/page.tsx`) has three CTAs for logged-out visitors:

1. `<LoginButton />` - Farcaster Sign-In With Farcaster (SIWF) flow (primary)
2. "Explore the Portal" -> `/portal` (secondary)
3. "Join on Discord" -> `https://discord.thezao.com` (tertiary, already present)

The `/zao-token` link appears only inside `src/app/(auth)/fractals/AboutTab.tsx` as an informational reference for already-authenticated members. It is not a primary conversion path today. The exact phrase "Join the ZAO" appears in `sopha/page.tsx` as "Join the ZAO Discord" (already Discord-pointed) and in community page `<metadata>` copy. The question may be based on a slightly outdated reading of the homepage, OR refers to a nav-level CTA in `community.config.ts` not yet checked.

**The friction gap still applies regardless of exact label**

Even with the above correction, the structural insight holds: the Discord CTA is third, not first. For a cold visitor - a musician or fan who is not already on Farcaster - the primary CTA requires Farcaster authentication, which is higher-friction than a Discord join. Research doc 2530 (validated 2026-09-21) puts it clearly: token or crypto-gated entry paths demand 4-5 prerequisite steps for a non-crypto-native audience, which is exactly who ZAO's music-first positioning targets.

**Why Discord-first converts better (first-principles, no fabricated numbers)**

Discord join is one click on a familiar tool and delivers immediate value: community access, social proof, conversation. The CRO principle is well-established - match CTA action to the visitor's stage. Cold traffic is at awareness/interest stage; committing to a crypto wallet or a new auth system (Farcaster) is a commitment-stage action. Sending awareness-stage visitors to commitment-stage CTAs produces high bounce regardless of page design quality. Web3 communities in the 100-500 member range consistently see better growth through frictionless community-join paths than token-acquisition paths, because the majority of potential members are not yet crypto-enabled.

**The measurement problem is the blocker**

ZAOOS has Vercel Analytics (page-level only) and Speed Insights. Neither tracks CTA click events, funnel steps, or Discord join completions. There is no conversion baseline. Zaal cannot confirm a lift from the change without event tracking in place first. PostHog (free tier, 1M events/month) is already recommended in doc 2530 and doc 094.

**What the change would cost in code**

Elevating the Discord CTA to primary for logged-out visitors is a one-file change in `src/app/page.tsx` - reordering the three CTAs and potentially restyling the Discord link to match the primary button weight. Reversible in minutes.

---

## Recommended action

1. **Instrument first, then change.** Add PostHog `cta_click` events with a `destination` property to `page.tsx` before moving anything. This establishes the baseline (current split between SIWF clicks, Portal clicks, and Discord clicks) so the lift is measurable. This is a 30-line addition.

2. **Elevate Discord CTA to primary for logged-out visitors.** Move it above the Farcaster LoginButton in the logged-out branch of `page.tsx`, styled as the visually dominant action. Keep LoginButton accessible as secondary. The `/zao-token` link should remain reachable inside the Portal's EARN section for members who are ready for it - it does not belong on the cold-traffic landing page at all.

3. **Measure 2-3 weeks post-change.** Track Discord join clicks and correlate with new member signups in Supabase. At ZAO's current scale (188 members) even modest weekly visitor counts will produce directionally meaningful data within a month.

---

## Sources

- [FULL, codebase, 2026-09-26] `src/app/page.tsx` - current homepage CTA structure verified today
- [FULL, codebase, 2026-09-26] `src/components/gate/LoginButton.tsx` - confirmed as Farcaster SIWF, not a "join" path
- [FULL, codebase, 2026-09-26] `src/app/(auth)/fractals/AboutTab.tsx` - `/zao-token` confirmed as info-link inside authenticated area only
- [FULL, codebase, 2026-09-26] `src/app/sopha/page.tsx` - "Join the ZAO Discord" already Discord-pointed
- [FULL, research, last-validated 2026-09-21] Doc 2530 (`research/business/2530-repo-web-improvement-does-re-pointing-the/README.md`) - directly covers this question; findings confirmed by today's codebase re-verification
- External web fetches: 0 - budget did not permit; conversion rate claims are directional/first-principles, not empirically sourced. Specific lift numbers for Discord-vs-token CTAs in music web3 communities: **TBD** - would require DEEP tier to source empirically.
