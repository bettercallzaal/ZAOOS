---
topic: events
type: event-research
status: research-complete
last-validated: 2026-06-29
superseded-by:
related-docs: 364, 846, 850, 476
original-query: "research on zaofestivals specifically ZAO-PALOOZA from 2024 April and ZAO-CHELLA from 2024 December Miami - use zao-scrape-x-timeline.sh to hunt PALOOZA/CHELLA posts across @zaofestivals @bettercallzaal @WaveWarZ"
tier: STANDARD
---

# 919 - ZAO-PALOOZA + ZAO-CHELLA: Past Event Record

> **Goal:** Consolidate the verified record of the two ZAO Festivals IRL events (ZAO-PALOOZA, NYC, 2024; ZAO-CHELLA, Miami, Dec 2024) into one canonical past-events doc, and document what is and is not sourceable cookie-free.

## Sourcing reality up front (read this first)

The original ask was to hunt 2024 PALOOZA/CHELLA posts via `zao-scrape-x-timeline.sh` across @zaofestivals, @bettercallzaal, @WaveWarZ. **That path cannot reach the events.** The scraper uses nitter RSS, which only returns each account's most recent ~20 posts. As of 2026-06-29 those windows bottom out around March 2025 - the April 2024 (PALOOZA) and December 2024 (CHELLA) posts are well outside the window. The script's own header says as much ("RSS only reaches the most recent ~20 posts. For deep history use specific tweet URLs or rettiwt-api with an auth token").

So this doc is built from the **verified internal record** (the festivals-history memory + Doc 364, both written when the events were fresh), plus the one cookie-free public datapoint still reachable (the @zaofestivals Instagram profile meta). Nothing here is invented. Per-fact confidence is marked.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Sourcing 2024 X posts** | Do NOT rely on `zao-scrape-x-timeline.sh` for 2024 events - RSS window is too shallow. To pull the actual posts, either feed specific tweet URLs to `zao-fetch-x.sh`, or run `rettiwt-api` with an auth token (the same method that produced the team-roster table in the festivals-history memory). |
| **Primary visual proof** | ZAO-CHELLA lives on Instagram, not X. The @zaofestivals IG (bio still "ZAO-CHELLA | ART BASEL '24") + reel `DDa-oPBJ7G7` are the canonical assets. Engagement numbers are behind IG's login wall - pull them from Zaal's logged-in account, do not estimate. |
| **Canonical spelling** | Always `ZAO-PALOOZA` and `ZAO-CHELLA` (hyphenated, all-caps). See `feedback_zao_festival_spelling` (PR #604). |
| **Use as proof-of-track-record** | Both events are the "we have done IRL before" proof for ZAOstock 2026 sponsor pitches and the Artizen ZAO Festivals fund. Doc 364 already wires ZAO-CHELLA into the pitch; this doc is the standalone record. |

## ZAO-PALOOZA (Event #1)

| Detail | Info | Confidence |
|--------|------|------------|
| **Name** | ZAO-PALOOZA | high |
| **City** | New York City | high |
| **Tie-in** | NFT NYC 2024 (the conference week) | high |
| **Month** | April 2024 (NFT NYC 2024 ran early April) | medium - memory says "NFT NYC 2024"; exact day not recorded, confirm with Zaal |
| **Artists** | 12 | high (per festivals-history memory) |
| **Financials** | Broke even | high |
| **Significance** | First ZAO IRL meetup | high |
| **Collectible** | Manifold "ZAO-Palooza" collectible (Jango UU) referenced in the ZAO NEXUS hub record | medium - referenced in `project_nexus_hub_live`, not independently re-verified |

What is NOT recorded anywhere internal: a schedule, a venue name, a sponsor, photo/video links, or attendance beyond "12 artists." If those exist they are on Zaal's devices / the team's X+IG, not in the research library. Flagged as a gap below.

## ZAO-CHELLA (Event #2)

| Detail | Info | Confidence |
|--------|------|------------|
| **Name** | ZAO-CHELLA \| ART BASEL '24 | high |
| **Date** | December 6, 2024 | high (Doc 364) |
| **Location** | Wynwood, Miami (during Art Basel Miami) | high |
| **Format** | 10 Web3 musicians, AR art, trading cards | high |
| **Schedule** | 4pm networking, 6pm WaveWarZ LIVE rematch, 7pm performances, 11pm close | high (Doc 364) |
| **Organized by** | AttaBotty + DaNici | high |
| **Sponsor** | Student $LOANZ Token (Gold Sponsor) | high |
| **Cross-community** | WaveWarZ ran a LIVE rematch on stage | high |
| **Instagram** | [@zaofestivals](https://www.instagram.com/zaofestivals/) - profile bio still set to "ZAO-CHELLA \| ART BASEL '24" | high |
| **Instagram reel** | [ZAO-CHELLA 2024 Miami](https://www.instagram.com/reel/DDa-oPBJ7G7/) | high (link), engagement FAILED (login wall) |
| **@zaofestivals IG profile** | 246 followers, 46 following, 65 posts (as of 2026-06-29) | high (og meta) |

ZAO-CHELLA is the better-documented of the two - it has a fixed date, a run-of-show, named organizers, a named sponsor, and a public IG reel. It is the stronger proof asset for pitches.

## The rest of the ZAO Festivals timeline (context)

From the festivals-history memory, the full arc the two 2024 events sit inside:

1. **ZAO-PALOOZA** - NYC, NFT NYC 2024 - 12 artists, broke even, first IRL meetup
2. **ZAO-CHELLA** - Miami, Art Basel 2024 (Dec 6) - 10 artists, WaveWarZ LIVE, AR art, cross-community
3. **ZAO-PROS** - ETH Denver 2025 - conference activation
4. **COC Concertz** (#1-4, ongoing) - metaverse concerts in Stilo World / Spatial.io, Twitch streaming
5. **ZAOstock** - Oct 3 2026, Ellsworth ME - flagship IRL festival, Franklin St Parklet

## Gaps (what to capture before the next pitch)

| Gap | Owner | How to close |
|-----|-------|--------------|
| ZAO-PALOOZA exact date, venue, sponsor, photos | @Zaal | Pull from personal archive / team X+IG; confirm April day |
| ZAO-CHELLA reel + post engagement numbers | @Zaal | Screenshot from logged-in IG (DDa-oPBJ7G7 + the 65 posts) |
| Actual 2024 X posts from the three handles | Agent | `rettiwt-api` with auth token, OR feed specific tweet URLs to `zao-fetch-x.sh` |
| ZAO-PROS (ETH Denver 2025) detail | @Zaal | Same as above; currently one line |

## Also See

- [Doc 364](../364-zao-festivals-deep-research/) - ZAOstock sponsor-pitch mega-doc; wires ZAO-CHELLA in as proof
- [Doc 846](../../business/846-zao-festivals-funding-strategy/) - ZAO Festivals funding strategy
- [Doc 850](../../business/850-zao-festivals-fund-creation-manager-playbook/) - Artizen ZAO Festivals fund playbook
- [Doc 476](../476-zaostock-apr22-team-recap/) - ZAOstock team recap
- Memory: `project_zao_festivals_history` (canonical event arc + team roster), `feedback_zao_festival_spelling` (naming)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm ZAO-PALOOZA exact April 2024 date + venue | @Zaal | Reply | Next session |
| Screenshot ZAO-CHELLA IG reel + post engagement for the pitch deck | @Zaal | Asset collect | Before next sponsor pitch |
| If deep 2024 X history is needed, run rettiwt-api with token (not the RSS scraper) | Agent | Tooling | On request |
| Link this doc from the ZAOstock pitch + Artizen ZAO Festivals fund copy | @Zaal | Edit | After review |

## Sources

- **[FULL]** Memory `project_zao_festivals_history.md` - ZAO event arc (PALOOZA/CHELLA/PROS/COC/ZAOstock) + team X roster (rettiwt-api scrape, 2026-04-11)
- **[FULL]** Doc 364 `research/events/364-zao-festivals-deep-research/README.md` - ZAO-CHELLA Art Basel '24 detail table (date, schedule, organizers, sponsor, IG links)
- **[PARTIAL - profile meta only, reel engagement behind login]** [@zaofestivals Instagram](https://www.instagram.com/zaofestivals/) - og:description: "246 Followers, 46 Following, 65 Posts ... ZAO-CHELLA | ART BASEL '24". Reel `DDa-oPBJ7G7` page returns no logged-out content.
- **[FAILED - RSS window too shallow for 2024]** `zao-scrape-x-timeline.sh` on @zaofestivals, @bettercallzaal, @WaveWarZ - all three timelines bottom out around March 2025; no April/December 2024 posts reachable cookie-free. Escalation path documented (rettiwt-api / per-URL fetch).
- **[FULL]** Memory `feedback_zao_festival_spelling.md` - canonical hyphenated all-caps naming (PR #604)
