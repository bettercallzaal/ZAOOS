---
topic: media
type: comparison
status: research-complete
last-validated: 2026-10-14
superseded-by:
related-docs: "media/2674-gmfarcaster-media-model (PR 3942), business/792-nicky-sap-juke-founder-worldview-farcaster-strategy, community/023-austin-griffith-eth-skills, agents/2225-austin-griffith-clawd-agent-swarm, media/2305-devcon-builder-series-distribution"
original-query: "nicky sap another person i wanna emulate their work as well as shaw makes magic and austin griffith (seat brief: study Nicky Sap, Shaw and Austin Griffith as models for Zaal's writing and building in public, same method as the gm farcaster doc; per person cadence, format, length, voice, how they mix code with writing, what they ship publicly and how often, growth signals, and the one thing each does that Zaal does not; then a ranked list of what to borrow for the Sunday roundup, BCZ YapZ and YouTube, each with the surface it touches)"
tier: STANDARD
---

# 2676 - Nicky Sap, Shaw and Austin Griffith as models for Zaal's writing and building in public

> **Goal:** Measure how three builders who also publish (Nicky Sap, Shaw, Austin Griffith) write, ship and grow, set each against Zaal, and rank what to borrow for the Sunday roundup, BCZ YapZ and YouTube.

## Key Decisions / Recommendations

| # | Borrow | From | Surface it touches | Effort |
|---|---|---|---|---|
| 1 | Descriptive, searchable YouTube titles with a series suffix: "<what the episode is about> - BCZ YapZ with <guest>". BuidlGuidl's uploads use exactly this ("Building a Prediction Market: From Theory to Implementation", "... - BuidlGuidl's Builder Bootcamp"). Their last 15 have a median of 105 views against our 17, but 14 of those 15 went up on 2025-12-04 and the 15th on 2025-11-14, so they have had ten months to collect views and ours a few days: the gap is mostly age and does not prove the titles work. The case for descriptive titles is that a search can find them; measure it on our own uploads (the 30-day comparison in Next Actions). | Austin (BuidlGuidl) | @bettercallzaal YouTube Studio | S |
| 2 | One idea per Sunday: a short personal argument (300 to 500 words) in Zaal's own words, opening with his own story, inside the roundup. Nicky's essays do this at about 1,000 words, twice a month. | Nicky Sap | Sunday roundup, a new "One idea" section; written with the `zaal-voice` skill from Zaal's rough words | M |
| 3 | Name one flagship build and report its progress every Sunday ("what I built this week": one repo, one PR, one link). Shaw's reach rests on one project others build on: elizaOS, 19,600 GitHub stars. Zaal ships more new repos than either Shaw or Austin, but nothing tells the story of one. | Shaw | Sunday roundup, a "Built this week" line; GitHub | S |
| 4 | End every BCZ YapZ episode block with one "try this" action: play the Monday Fractal, try the guest's product, open a bounty. Austin turned his teaching into products a learner can act on (SpeedrunEthereum for people, ETHSkills for agents). | Austin | the episode block from doc 2674, bczyapz.com | S |
| 5 | Stop uploading raw stream parts under one repeated title. Shaw's channel shows the cost: seven uploads titled "Moon Makes Magic Live Stream" on one day, 5 to 23 views each. Ours has the same pattern (two uploads each of the Gabriel and Danny episodes). | Shaw, as a warning | YouTube Studio | S |
| 6 | Do not copy: Austin's personal site and Medium are stale (site footer "2017-2021", last Medium post 30 Jul 2021); Shaw's YouTube went quiet after March 2026. Their long-form moved into products and X, which Zaal is not set up to replace. | - | - | - |

## The three, measured (fetched 2026-10-14)

| | Nicky Sap | Shaw | Austin Griffith | Zaal |
|---|---|---|---|---|
| Main writing surface | Substack "Forty-Eight Hours from Monday" | X | X; Medium until 2021 | Paragraph (The ZAO), X |
| Writing cadence | 21 posts since 2025-11-10, 1 to 3 a month | not measured (X timeline not fetchable) | Medium: last post 2021-07-30 | Paragraph: 30 posts in Jan 2026, 1 in May, 3 in Oct; moving to one Sunday roundup |
| Typical length | median 1,173 words (764 to 1,772) | - | - | Day 285: under 200 words |
| Format | one argument per post, personal opening, no headings, 1 image | posts and streams | teaching products: challenges, skills, bootcamps | daily notes and announcements |
| X followers | 24,567 (@nicky_sap) | 163,259 (@shawmakesmagic) | 69,672 (@austingriffith) | 5,186 (@bettercallzaal) |
| X posts (total, join year) | 30,448 since 2012 | 15,371 since 2024 | 14,259 since 2007 | 48,756 since 2023 |
| Flagship code | Juke (doc 792) | elizaOS: 19,600 stars, 5,816 forks | scaffold-eth-2: 2,055 stars, 1,359 forks | ZAO OS and 100+ repos |
| New non-fork repos since 2026-07-14 | not measured (GitHub handle not found) | 5 | 7 | 14 |
| GitHub public events, last 300 | - | 300 in 3 days (111 pushes, 87 PR events) | 247 across 20 active days since 2026-09-20 (218 pushes) | 300 in 5 days (118 PR events, 106 comments) |
| YouTube | none found | 7.17K subscribers; last upload 2026-03-23; median 16 views | BuidlGuidl channel 568 subscribers, median 105 views on uploads from 2025-11-14 and 2025-12-04 (ten months old); no channel at @austingriffith (404) | 66 subscribers, median 17 views |
| Substack engagement | 1 to 18 reactions per post | - | - | Paragraph: 585 subscribers |

Two things stand out. Zaal is not short on output: he posts more on X than any of the three and created more new repos than Shaw or Austin since July. What he does not have is a single thread a reader can follow (Nicky's argument, Shaw's elizaOS, Austin's "learn to build here"). And reach on X is not the same as reach on YouTube: Shaw has 163K X followers and a YouTube median of 16.

## The one thing each does that Zaal does not

- **Nicky Sap** writes one argument at a time, in the first person, at essay length. His 13 Oct 2026 essay, "Crypto is Eating its Young" (923 words), opens with his own path ("I built made-to-order mining rigs in my teens", and later "I focused on music and writing code to make ends meet") and only then makes the case. Zaal's newsletter reports; it rarely argues.
- **Shaw** builds one open-source thing that other people build on, in public, and lets the code carry the story. His YouTube is raw and quiet; that is not the part to copy.
- **Austin Griffith** turns what he knows into something a learner can do: his X bio reads "A human should learn how to build at SpeedrunEthereum.com", and "An AI agent should use ETHSkills.com". Zaal teaches in conversation (BCZ YapZ) but leaves no next step for the listener.

## Also See

- media/2674-gmfarcaster-media-model (ZAOOS PR 3942, not yet merged) - the format doc this one extends; its episode block and Sunday shape are where items 2 to 4 land
- [business/792-nicky-sap-juke-founder-worldview-farcaster-strategy](../../business/792-nicky-sap-juke-founder-worldview-farcaster-strategy/) - Nicky's worldview and Farcaster strategy, as of 2026-05-31
- [community/023-austin-griffith-eth-skills](../../community/023-austin-griffith-eth-skills/) and [agents/2225-austin-griffith-clawd-agent-swarm](../../agents/2225-austin-griffith-clawd-agent-swarm/) - Austin's agent and skills work, not his publishing
- [media/2305-devcon-builder-series-distribution](../2305-devcon-builder-series-distribution/) - the BCZ interview series checklist

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add a "One idea" section and a "Built this week" line to the Sunday roundup structure; done when the lane's Sunday 18 Oct roundup draft carries both | paragraph lane | Draft | 2026-10-16 |
| Give the lane two or three rough sentences for the first "One idea" (anything on his mind this week); done when they are in the Sunday draft's daily log | @Zaal | Input | 2026-10-17 |
| Retitle the Gabriel and SLAVA uploads in the "<topic> - BCZ YapZ with <guest>" form; done when the YouTube RSS shows the new titles | @Zaal | YouTube Studio | 2026-10-21 |
| Compare views on the retitled uploads at 30 days against the last 15 before them, same age; done when the numbers are in the Sunday roundup notes | paragraph lane | Measurement | 2026-11-20 |
| Add a "try this" line to the episode block in the Sunday prompt template; done when the template carries it | paragraph lane | Draft | 2026-10-16 |

## Sources

- [nickysap.substack.com](https://nickysap.substack.com/) archive - [FULL, method: Substack public API `api/v1/archive`, 21 posts with dates, word counts and reactions]
- [Crypto is Eating its Young](https://nickysap.substack.com/p/crypto-is-eating-its-young) (2026-10-13) - [FULL, method: Substack API `api/v1/posts/<slug>`, body HTML stripped, 923 words read; only short quotes reproduced here]
- X profiles @nicky_sap, @shawmakesmagic, @austingriffith, @bettercallzaal - [FULL, method: FxTwitter API; it returned 404 on some first tries, including for a known-good handle, and 200 on retry, so every number here is from a 200 response]
- GitHub users lalalune (Shaw) and austintgriffith, and bettercallzaal - [FULL, method: `gh api` users, repos (paged) and public events]
- GitHub repos elizaOS/eliza, scaffold-eth/scaffold-eth-2, BuidlGuidl/SpeedRunEthereum - [FULL, method: `gh api` repo metadata]
- YouTube @shawmakesmagic and @BuidlGuidl - [FULL, method: channel page HTML for subscriber counts, channel RSS for the last 15 uploads with views]
- youtube.com/@austingriffith - [FAILED - HTTP 404; no personal channel found at that handle]
- YouTube @bettercallzaal RSS - [FULL, method: channel RSS, fetched the same day for doc 2674]
- [austingriffith.com](https://austingriffith.com) - [FULL, method: curl + HTML strip]
- [Austin's Medium feed](https://medium.com/feed/@austin_48503) - [FULL, method: RSS, newest item 2021-07-30]
- [elizaresearch.ai](https://elizaresearch.ai) - [FULL, method: curl + HTML strip]
- [speedrunethereum.com](https://speedrunethereum.com) - [PARTIAL - HTTP 200 confirms it is live; content not read, only named]
- Nicky Sap's GitHub and music pages - [FAILED - no handle found in the fetched sources, so the brief's "also their music and code" is UNVERIFIED here beyond his own essay's line about music and code]
- Hacker News, Algolia API, queries elizaos, scaffold-eth, "nicky sap", speedrunethereum - [FULL, method: API; no thread about any of the three as a writer or publisher: "elizaos" and "nicky sap" match unrelated items (Weizenbaum's ELIZA, Nicky Case), scaffold-eth has 16 hits with none above 27 points]

Credit: the practices studied are the work of Nicky Sap, Shaw (elizaOS) and Austin Griffith (BuidlGuidl, Ethereum Foundation). Quotes are short and attributed; their writing is linked, not reproduced.
