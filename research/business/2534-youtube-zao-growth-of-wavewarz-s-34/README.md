---
topic: business
type: market-research
status: draft
last-validated: 2026-09-22
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: Of WaveWarZ's 34 Audius-rostered artists, which already have active YouTube channels and what are their subscriber counts, so outreach can be prioritized by realistic audience-borrowing value."
tier: STANDARD
---

# 2534 - YouTube/ZAO growth: Of WaveWarZ's 34 Audius-rostered artists, which al

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: Of WaveWarZ's 34 Audius-rostered artists, which already have active YouTube channels and what are their subscriber counts, so outreach can be prioritized by realistic audience-borrowing value.". Opened as a DRAFT pull request; it does not merge itself.

> **HELD AS DRAFT, not complete.** 2 source(s) marked FAILED. Sources: 3 FULL, 0 PARTIAL, 2 FAILED. Needs a person or a redispatch before it is cited.

Budget is nearly exhausted ($0.07 remaining) - I cannot execute the batch YouTube lookups this run. Compiling findings from what was verifiable within budget.

---

## Findings

**Zero artist YouTube subscriber counts are verifiable from internal sources.** Doc 2510 (`research/business/2510-youtube-zao-growth-of-the-34-audius/README.md`) was created for this exact question but made 0 external fetches and was explicitly flagged `INCOMPLETE, needs redispatch`. This run confirmed that status: the ZAO research library contains no YouTube subscriber counts for any of the 34 Audius-rostered WaveWarZ artists, and no baseline count for BetterCallZaal's own channel.

**Two artists have confirmed YouTube video presence.** The only external YouTube footprint verifiable from internal ZAO sources:

- **Kata7yst** - appeared in a WaveWarZ interview video on the WaveWarZ YouTube channel (video ID: `ZU0ga5LRdyU`). This confirms a YouTube presence exists for the WaveWarZ brand featuring him, but his *own* channel subscriber count is TBD.
- **XTinct_official (Alejandro Estrella)** - appeared in a WaveWarZ interview video (video ID: `FmrzjYtdF6A`). Same caveat: WaveWarZ channel appearance confirmed, personal channel subscriber count TBD.

**The full 34-artist roster is confirmed** from Doc 1214 (verified 2026-07-24, via `lib/artists.ts` and wwtracker): Hurric4n3Ike, GodclouD, dopestilo, Stormbourne, luiwrites, CannonJones973, RoCkY2GriMeY, Kata7yst, XTinct_official, BennyJ504WaveWarz, AporkALYPSE78, \_0xQuan, shawnsporter, PKMNCTO, geekmyth, hoodrats, srchappell, GESD1, sweetbiddi, BennyJ504, frameworkfortune, Sicariobaby, MetaVerseSlim, Retrospect, NDA\_WaveWarz, ace1yoda, bettercallzaal, NemesisLadyRyn, NFTWonderfull, ozthecryptogoat, TuckNuisance, DCoopOfficial, ItsMoneyMiller, zKeyz.

**A battle-activity proxy ranking is the only actionable tier list available.** Per doc 1214 and 1081 data, outreach order by probability of having a findable YouTube channel (battle count as persistent-identity proxy):

| Priority | Artist | Battle count / signal |
|---|---|---|
| 1 | Kata7yst | Confirmed on-camera interview, active creative output |
| 2 | XTinct_official | Confirmed on-camera interview, described "trippy visuals" production style |
| 3 | RoCkY2GriMeY | 36 battles - highest count of any tagged artist |
| 4 | Stormbourne | 29 battles |
| 5 | CannonJones973 | 28 battles |
| 6 | BennyJ504WaveWarz | 27 battles |
| 7 | GodclouD | 21 battles, 71.4% WR - highest competitive profile |
| 8 | \_0xQuan | 20 battles, 60% WR |
| 9 | luiwrites | 19 battles, documented collab tracks |
| 10 | dopestilo | 5 songs in platform top-20, most prolific song submitter |
| 11-21 | shawnsporter (14), AporkALYPSE78 (13), srchappell (8), Hurric4n3Ike (TBD), PKMNCTO (9), frameworkfortune (4), GESD1 (4), geekmyth (2), hoodrats (2), sweetbiddi (1), BennyJ504 (1) | Lower activity |
| 22-34 | Sicariobaby, MetaVerseSlim, Retrospect, NDA\_WaveWarz, ace1yoda, NemesisLadyRyn, NFTWonderfull, ozthecryptogoat, TuckNuisance, DCoopOfficial, ItsMoneyMiller, zKeyz, bettercallzaal | No battle data in doc 1214 |

**This is a proxy ranking, not a YouTube ranking.** No subscriber count exists for any artist in the ZAO library. The 50-200% subscriber fit relative to BetterCallZaal cannot be calculated without (a) BetterCallZaal's own subscriber count and (b) individual artist channel lookups.

**This question requires DEEP tier to complete.** A STANDARD tier run cannot execute 34+ YouTube channel lookups plus a baseline pull within the 5-fetch cap. A DEEP tier redispatch should target: (1) `youtube.com/@bettercallzaal` for the baseline, then (2) YouTube search for each of the top 10 artists above in priority order, recording subscriber counts and channel activity dates.

---

## Recommended action

1. **Redispatch as DEEP tier** with explicit instruction to fetch `https://www.youtube.com/@bettercallzaal` for the baseline subscriber count, then search YouTube for each of the 10 priority artists above (Kata7yst first, then in ranked order). Record: channel URL, subscriber count, last upload date, video count.

2. **Filter by the 50-200% band after the baseline is known.** If BetterCallZaal has N subscribers, the target window is 0.5N-2N. Any artist outside that band gets deprioritized for Collaboration-tagged cross-promotion - the asymmetry works against both parties.

3. **Update doc 2510 with the lookup results.** It is already committed to main and flagged INCOMPLETE - the DEEP run should replace the "tier proxy" section with real subscriber data and drop the INCOMPLETE flag.

---

## Sources

- [FULL, liveness-verified-on-2026-09-22] Doc 2510 - YouTube/ZAO growth stub - `/home/zaal/zao-os/research/business/2510-youtube-zao-growth-of-the-34-audius/README.md`
- [FULL, liveness-verified-on-2026-09-22] Doc 1214 - WaveWarZ Creative Ecosystem (34-artist roster) - `/home/zaal/zao-os/research/wavewarz/1214-wavewarz-creative-ecosystem-jul2026/README.md`
- [FULL, liveness-verified-on-2026-09-22] Doc 1081 - WaveWarZ Analytics Wave 3: Artist Intelligence - `/home/zaal/zao-os/research/wavewarz/1081-wavewarz-analytics-wave3-artist-intelligence-jul2026/`
- [FAILED - budget exhausted] YouTube channel lookups for all 34 artists - 0 external fetches executed this run
- [FAILED - budget exhausted] BetterCallZaal YouTube subscriber baseline - 0 external fetches executed this run

**Scope note:** No Reddit, HN, GitHub, or X source obtained this run - budget exhausted after reading internal docs. This is a STANDARD tier run that hit its ceiling; the subscriber-count question requires DEEP tier to resolve.
