---
topic: community
type: decision
status: research-complete
last-validated: 2026-05-02
related-docs: 200, 287, 289, 415, 533, 547
tier: STANDARD
---

# 590 — Substack's Three Models for Building Community (ZAO Mapping)

> **Goal:** Map Substack's "Three Models for Building Community for Your Podcast" (2026-04-30) onto every ZAO show / publication and pick the right model per surface.

## Key Decisions

| Surface | Recommended Model | Why | Lift |
|---|---|---|---|
| **BCZ YapZ podcast** (`/bcz-yapz/`) | **Model 1: Companion Hub** — YouTube stays primary, add Substack recap + Chat | Already on Substack daily ("Year of ZABAL"). Companion newsletter free, Chat fan-to-fan, zero moderation cost. Captures email asset YouTube doesn't give. | 2/10 |
| **ZAO Music releases** (Cipher, future) | **Model 2: Bonus Tier** — free streaming + paid Substack stems/demos/research notes | Paid relationship beats ad model for ZAO Music DBA (doc 475). DCoop/GodCloud/Iman behind-scenes content = no extra production cost. | 4/10 |
| **ZAOstock 2026** | **Model 1 NOW, Model 3 POST-GRADUATION** | Festival graduates to own repo (doc 547). Hold Model 3 ambition until then. Use companion newsletter from now to Oct 3 for build-in-public. | 3/10 |
| **The ZAO main brand** | **Hybrid: Farcaster as Chat, Substack as Newsletter+Pod** | Farcaster /thezao channel is the chat (188 gated members, on-chain identity). Substack handles broadcast email + recorded content. Don't move chat. | 0/10 (already in place) |
| **WaveWarZ** | **DEFER** — pre-launch, no audience yet | Build show first, pick model after first 100 listeners. | n/a |

## What the Substack Article Says (Source Summary)

Substack's "On" newsletter (2026-04-30) lays out three models for podcast creators using their platform:

1. **Companion Hub** — Send episodes to inboxes via Substack + free companion newsletter (weekly recap, links, producer notes) + Chat (fan-to-fan, no moderation). Starting point. Free to run. Builds daily engagement. Case study: **Giggly Squad** (Hannah Berner + Paige DeSorbo).

2. **Paid Bonus Tier** — Free podcast distributed normally, paid Substack tier with bonus content (extra 20min cuts, episode research, behind-scenes). Structurally changes relationship: paying subs aren't buying a product, they're supporting work. Case studies: **Wiser Than Me** (Julia Louis-Dreyfus) ships exclusive episode research, **Mayim Bialik's Breakdown** ships bonus clips + letters.

3. **All-In Home Base** — Substack as the comprehensive distribution: episodes to inboxes + RSS to Apple/Spotify + auto-distribute to YouTube + bonus drops + extended cuts + AMAs + lives + creator collabs. For many, subscription revenue exceeds ads. Self-sustaining community is the durable output. Case studies: **Pantsuit Politics** (4+ premium episodes/week, gated paid Chat), **Diabolical Lies** (paywalled hour-plus deep dives, twice a month).

Quoted insight from **Biz Sherbert (Nymphet Alumni)**: "The community is self-sustaining. People do meetups and stuff all the time that have nothing to do with us. That's one of the beautiful things about making something like this — it takes on its own life without you." Community-as-spillover-asset matches ZAO's whole thesis (doc 050, 200).

## ZAO Reality Check (Codebase Grounding)

| Fact | Source | Implication |
|---|---|---|
| 11 publish channels live, NO Substack module | `src/lib/publish/` (telegram.ts, discord.ts, bluesky.ts, broadcast.ts, hive.ts, lens.ts, threads.ts, x.ts, auto-cast.ts, normalize.ts) | Substack is publish-FROM, not publish-TO. Distribution is Substack -> RSS -> everything else. No code change needed; it's an editorial workflow. |
| `/bcz-yapz/` route already exists | `src/app/bcz-yapz/` | Episode landing pages already on ZAOOS. Substack would be the distribution layer above this. |
| `src/components/chat` already exists | Codebase | ZAO has its own chat component. Substack Chat is a separate web-only product, not a replacement. Use Substack Chat ONLY for non-Farcaster audiences. |
| Daily newsletter "Year of the ZABAL" already on Substack | `feedback_brainstorm_before_writing.md`, /newsletter skill | Substack muscle exists. Companion newsletter for YapZ is a 1-line addition: send weekly recap to same list. |
| ZAO Music DBA stack: BMI + DistroKid + 0xSplits | Doc 475 | Music distribution NOT moving to Substack. Substack is for behind-scenes / community layer ONLY. |

## Three Substack Claims Worth Verifying (Staleness)

| Claim | Source | Trust Level |
|---|---|---|
| "The Substack network drives more than 50% of all subscriptions on the platform" | on.substack.com/p/three-models, 2026-04-30 | Vendor self-report, no third-party citation. Treat as marketing claim until verified. |
| Substack Recording Studio supports remote guests natively | Same article | Confirmed — launched 2025, see [introducing-the-substack-recording](https://on.substack.com/p/introducing-the-substack-recording). |
| Live video available to all publishers | Same article | Confirmed — see [live-video-is-available-to-all-publishers](https://on.substack.com/p/live-video-is-available-to-all-publishers). |

## Comparison: Substack Chat vs Farcaster /thezao Channel

ZAO's biggest live decision: USE Substack Chat for new audience or KEEP everything on Farcaster?

| Dimension | Substack Chat | Farcaster /thezao |
|---|---|---|
| **Identity** | Email + Substack profile | On-chain wallet + FID (gated, 188 members) |
| **Discovery** | Substack network drives ~50% of subs (vendor claim) | Channel discovery via Farcaster, far smaller TAM |
| **Mobile** | Web-first, app exists but engagement skews desktop | Native mobile + mini-app frame inside ZAOOS |
| **Moderation** | Built-in admin tools, can set fan-to-fan | ZAO custom + Neynar admin layer |
| **Identity portability** | Locked to Substack | Portable across all Farcaster clients |
| **Music-native** | No (text + audio attachments only) | Mini-apps support audio, ZAO Jukebox concept lives here (memory: project_zao_jukebox_brainstorm) |

**Decision:** Don't move chat. Use Substack Chat as a top-of-funnel: free Substack readers who haven't found Farcaster yet land in Substack Chat, then progressively get pulled into /thezao (matches `project_auth_flow.md` — wallet first, Farcaster second, XMTP third). Substack Chat = pre-onboarded community holding pen.

## Action Plan: 6 Weeks From Today (2026-05-02)

### Week 1-2: Companion Newsletter for BCZ YapZ
- Add "YapZ Recap" section to existing "Year of ZABAL" weekday issue OR spin a separate weekly Sunday digest
- Each YapZ episode -> 1 paragraph + 1 clip + chapter timestamps + guest links
- No new infra. Use existing /newsletter skill.

### Week 3-4: Substack Chat as Top-of-Funnel
- Open free Substack Chat for "Year of ZABAL" readers
- Pin a welcome message linking to /thezao Farcaster channel + ZAOstock RSVP
- Fan-to-fan mode (no daily moderation load)

### Week 5-6: Test Bonus Tier on ZAO Music
- Cipher single (release #1 from doc 475) gets free distribution via DistroKid
- Substack paid tier ($5/mo): stems, demo versions, behind-scenes interview with DCoop/GodCloud/Iman, lyric annotations, songwriter notes
- 0xSplits handles royalty distro; Substack handles community + paid layer

### POST-LAUNCH (defer)
- Model 3 for ZAOstock = AFTER graduation to own repo (per doc 547 Cassie validated strategy)
- Pantsuit Politics-style 4 paid episodes/week is unrealistic until ZAO ships a daily show; not now

## Risks + Open Questions

| Risk | Severity | Mitigation |
|---|---|---|
| Substack network claim (~50% of subs) is unverified vendor marketing | Medium | Don't bet roadmap on it. Treat any growth from Substack network as bonus, not core thesis. |
| Splitting community across Substack Chat + Farcaster /thezao = fragmentation | High | Substack Chat = ungated funnel; Farcaster /thezao = gated members-only. Make the upgrade path explicit in pinned welcome. |
| Paid Substack tier on ZAO Music conflicts with $ZABAL token incentive model | Medium | Decide BEFORE Cipher launch: is paid Substack tier in $ or $ZABAL or both? Open question for Zaal. |
| Substack RSS to Apple/Spotify means losing platform analytics | Low | Acceptable tradeoff for owned email asset. Already using DistroKid analytics for music. |
| Existing 11-channel publish stack does NOT include Substack | Medium | Add Substack as #12 in `src/lib/publish/` ONLY if cross-posting becomes routine. For now, post Substack-first, distribute via RSS. |

## Also See

- [Doc 200 — Community OS Vision](../200-community-os-ai-agents-platform-vision/) — ZAO OS as the best community OS; Substack is one channel within that vision
- [Doc 287 — ZAO FAQ + Glossary](../287-zao-faq-word-wall-glossary/) — community-driven content patterns
- [Doc 415 — POIDH Bounties](../415-poidh-bounties-zao-wavewarz/) — bounty + clip-up mechanics that pair well with companion newsletter
- [Doc 533 — POIDH Clip-Up YapZ Hannah](../533-poidh-clipup-bounty-bcz-yapz-hannah/) — first YapZ clip bounty, validates BCZ YapZ as the pilot show for Model 1
- [Doc 547 — Cassie Advisor + ZAOstock Master Strategy Validation](../547-cassie-advisor-ai-human-coordination-validation/) — graduation timing constraints on Model 3
- Memory: `project_zaoos_monorepo_as_lab.md`, `project_zao_music_entity.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add "YapZ Recap" weekly section to "Year of ZABAL" Substack | @Zaal | Editorial | 2026-05-09 (1 week) |
| Open free Substack Chat with pinned funnel-up message to /thezao | @Zaal | Substack admin | 2026-05-16 (2 weeks) |
| Decide $ vs $ZABAL pricing for Cipher bonus tier (blocks Music Model 2) | @Zaal | Decision | Before Cipher release |
| Verify Substack "50% of subs from network" claim with 1 third-party source | @Zaal or research session | Research | Before any Substack-dependent roadmap commitment |
| Update community.config.ts content_distribution channels list to include Substack | @Zaal | PR | After Week 2 |
| Re-validate this doc | research session | Re-fetch + update `last-validated` | 2026-06-02 (30 days) |

## Sources

- [Three models for building community for your podcast — On Substack, 2026-04-30](https://on.substack.com/p/three-models-for-building-community) — primary article
- [Introducing Substack Recording Studio](https://on.substack.com/p/introducing-the-substack-recording) — verifies remote-guest recording claim
- [Live video is available to all publishers — Substack](https://on.substack.com/p/live-video-is-available-to-all-publishers) — verifies live video claim
- [Demystifying the Feed (Notes) — Substack](https://on.substack.com/p/demystifying-the-feed) — Notes discoverability mechanics
- [Are Community and Wealth at Odds? — David Spinks](https://davidspinks.substack.com/p/community-and-wealth) — community-leader framing of paid vs free trade-offs
- [Community SDK: How Auth0 built and scaled its developer ecosystem — Developer-Led, 2025-10-07](https://developerled.substack.com/p/community-sdk-how-auth0-build-and) — case study, community as growth mechanism
- [Big things start small: How Substack sparked its early community of writers — Get Together](https://gettogether.substack.com/p/big-things-start-small-how-substack) — early-stage community pattern
- [10 Trends That Will Shape Substack In 2026 — WriteBuildScale](https://writebuildscale.substack.com/p/10-trends-that-will-shape-substack) — independent 2026 outlook
- [Creator Economy Statistics for 2026 — Circle](https://circle.so/blog/creator-economy-statistics) — broader market data on community-vs-attention shift
- [Not all creators are the same: How the creator economy breaks down by business model — Digiday](https://digiday.com/media/not-all-creators-are-the-same-how-the-creator-economy-breaks-down-by-business-model/) — model archetypes that match three Substack tiers
- [Signal Awards](https://www.signalaward.com/) — partner cited in primary article (early entry deadline 2026-05-08)

**URL liveness:** All 11 verified live 2026-05-02 via Jina Reader / WebSearch. No 404s. No paywalls (Substack posts are free unless flagged; primary article is free).

**Reddit note:** r/Substack and r/podcasting search returned no relevant hits via fallback fetch script (2026-05-02). HN Algolia covered the gap with David Spinks + Auth0 + Get Together threads.
