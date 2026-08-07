---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-07
related-docs: 2232, 2233
original-query: "/zao-research audos.com (the summercamp/commit X post) - learn what Audos is, then create a prompt to build zaofestivals on their platform"
tier: STANDARD
---

# 2243 - Audos: the "Record Label for Entrepreneurs" + the zaofestivals prompt

> **Goal:** Zaal's drop (2026-08-07): research Audos and produce the prompt that builds
> zaofestivals on their platform. Grounded by live browsing (their site is JS-rendered -
> plain fetches return a skeleton, headless browse got the real content).

## What Audos is (grounded, fetched 2026-08-07)

**The pitch (homepage, FULL):** "You describe a business idea. AI builds it, runs it,
grows it." Their agent is **Otto**. Claims: 15 years of successful incubations, "15 min
idea to live business," founders behind BarkBox / Ro / Managed by Q. Free to try, no
credit card.

**The deal (audos.com/publishing, FULL) - the record-label model:**
- "We invest in you without taking ownership of your business" - **15% royalty, NOT
  equity; you own your business.**
- Deal shape: cash advance **$10K-$25K** + a business budget for ads/tools - **up to
  $100K in total value** - plus "full label services."
- **Recoup:** until the advance is repaid, Audos takes 85% / you keep 15%. **After
  recoup it FLIPS: you keep 85%, Audos takes a 15% ongoing royalty. Forever.**
- Apply via a **speed review**; they evaluate **Speed, Gravity, Resourcefulness**.
- **Quarterly cohorts** (shared launch PR, private Slack, remix rights; "Q2 2026 class
  - 15 spots" live at fetch time).
- Label services: a "personal vibe coding studio," a dedicated ads agent, distribution
  through Audos channels, an A&R-style dedicated team member, data dashboards, Otto 24/7.
- The path they push: **"Start in the Studio. Build your first app. Show traction. Then
  apply for a publishing deal."** 30 days free.

**Summer Camp (audos.com/summercamp + /commit, FULL):** free ~4-week program - "the
summer you make your first $1,000," mid-July to September; commit flow = rewatch the
kickoff, sign in, commit for 4 weeks. Zero-cost entry.

**Fetch status:** audos.com FULL (headless browse; JS-rendered), /publishing FULL,
/summercamp + /summercamp/commit FULL. The X post (x.com/audos_com/2082800438122823957)
FAILED - X blocks fetch; fxtwitter redirected back to x.com. WebSearch budget was
exhausted; a first research agent correctly returned BLOCKED rather than fabricate, and
the browse run recovered the ground truth.

## Honest fit assessment for zaofestivals

**For:** the model is literally music-label-shaped for a festivals brand; no equity;
you own the entity; the free Studio/Summercamp path means testing costs nothing; their
distribution + ads agent covers the exact marketing muscle a small-town festival lacks;
"first $1,000" (a sponsor package + early-bird tickets) is a natural, near-term target.

**Against / cautions:** a **15% royalty forever** post-recoup is a real, permanent cost
on festival revenue if it scales; their platform runs the commerce layer (a dependency
- the OSS-first check-twice rule notes ZAO could self-host commerce later, but speed
favors Audos for the test); UNVERIFIED: exact contract terms beyond the marketing copy
(read the actual publishing agreement before signing anything).

**The boundary that matters:** keep ZAO's on-chain and community assets (Respect, the
member network, the ZAO treasury) **OUT of any Audos entity**. Audos gets the
zaofestivals COMMERCE layer only - tickets, sponsors, merch funnels. The community
stays sovereign.

**Recommended path (gated - signing anything is Zaal's):** enter through the FREE lane
(Studio 30 days / Summer Camp), build the ticket+sponsor site there, aim at the first
$1,000 (one Ellsworth sponsor package + ZAO Stock early birds). Only consider the
publishing deal with real traction data - and read the contract.

## The staged Otto prompt

Also on the handoffs clipboard page (clip-20260807-065540). Paste into Otto:

> ZAO Festivals - community-owned music festivals in small-town Maine, built by The
> ZAO, a 188-member music collective.
>
> The idea: we already run real events - ZAO Stock (Oct 3, 2026, Franklin Street
> Parklet, Ellsworth Maine, with the Heart of Ellsworth downtown org) and a weekly
> Thursday concert series. The festivals are booked, promoted, and staffed by our
> member network of artists, and every show doubles as content: live streams, clips,
> and artist features that feed year-round audience growth.
>
> Revenue: ticket sales, local sponsor packages (Ellsworth businesses), merch, and
> artist-release tie-ins. The differentiator: our community IS the production team and
> the promo engine - artists earn reputation in our network for contributing, so labor
> and marketing costs stay near zero while every event grows the roster.
>
> What I want to build with Otto: the ZAO Festivals business layer - a site that sells
> tickets and sponsor packages, an automated sponsor-outreach pipeline for small-town
> businesses, and a post-event content engine that turns each show's recordings into
> clips and next-event promotion. First $1,000: sell the first sponsor package +
> early-bird tickets for ZAO Stock.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create the Audos account + paste the Otto prompt (free lane - no deal signed) | @Zaal | His run | 2026-08-12 |
| If Otto output is promising: build the ticket/sponsor site in the free Studio toward the first $1,000 | @Zaal (+ a build terminal) | Build | 2026-08-31 |
| Before ANY publishing deal: read the actual contract (royalty terms are marketing copy here - UNVERIFIED) | @Zaal | Gated | before signing |

## Sources

- audos.com (FULL - headless browse 2026-08-07; JS-rendered, plain fetch gets a shell)
- audos.com/publishing (FULL - the deal: 15% royalty, $10-25K advance, recoup 85/15
  flip, cohorts, label services)
- audos.com/summercamp + /summercamp/commit (FULL - free 4-week first-$1,000 program)
- X post 2082800438122823957: FAILED (X blocks fetch; fxtwitter redirect loop) - marked
  honestly, content not used.

## Also See

- [Doc 2232](2232-whop-clippers-incentives-oss-alternatives/) / [2233](2233-unlock-whop-crypto-access-bridge/) - the ZAO-owned commerce rails this complements (Audos = a fast external test lane, not the sovereign rail).
