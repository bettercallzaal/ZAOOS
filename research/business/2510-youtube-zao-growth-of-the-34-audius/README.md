---
topic: business
type: market-research
status: draft
last-validated: 2026-09-20
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: Of the 34 Audius-rostered WaveWarZ artists, which have channels with real audience overlap and 50-200% subscriber fit with BetterCallZaal, and what order should they be approached in for Collaboration-tagged uploads?"
tier: STANDARD
---

# 2510 - YouTube/ZAO growth: Of the 34 Audius-rostered WaveWarZ artists, which 

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: Of the 34 Audius-rostered WaveWarZ artists, which have channels with real audience overlap and 50-200% subscriber fit with BetterCallZaal, and what order should they be approached in for Collaboration-tagged uploads?". Auto-committed to main for durability; review + deepen as needed.

> **INCOMPLETE, needs redispatch (seat review, 2026-09-19).** The question asked which of 34 artists have a YouTube channel with 50 to 200 percent subscriber fit. This run made 0 external fetches: no subscriber count exists here for anyone, including the baseline channel. The tier list below ranks by WaveWarZ battle activity, an untested stand-in for having a channel. It is NOT a YouTube ranking. Do not act on the ordering until the lookups in Recommended Action have been run.

---

## Findings

**The subscriber baseline is TBD.** No document in the ZAO research library records BetterCallZaal's YouTube subscriber count, and no document records YouTube subscriber counts for any of the 34 Audius-rostered WaveWarZ artists. The 50-200% fit calculation therefore cannot be made from internal sources alone - it requires a targeted batch of YouTube Data API calls or manual channel checks against the baseline.

**What the library does establish is the full artist roster.** Doc 1214 (`lib/artists.ts`, wwtracker, verified 2026-07-24) names all 34 artists. The named 21 are: Hurric4n3Ike, GodclouD, dopestilo, Stormbourne, luiwrites, CannonJones973, RoCkY2GriMeY, Kata7yst, XTinct_official, BennyJ504WaveWarz, AporkALYPSE78, _0xQuan, shawnsporter, PKMNCTO, geekmyth, hoodrats, srchappell, GESD1, sweetbiddi, BennyJ504, frameworkfortune. The remaining 13 named in the "+13 additional" bucket: Sicariobaby, MetaVerseSlim, Retrospect, NDA_WaveWarz, ace1yoda, bettercallzaal (Zaal himself, listed as a participant), NemesisLadyRyn, NFTWonderfull, ozthecryptogoat, TuckNuisance, DCoopOfficial, ItsMoneyMiller, zKeyz.

**A prioritized approach order CAN be derived from existing data, using battle-activity and documented creative output as a YouTube-presence proxy.** Artists with more battles have demonstrated persistent effort and public identity - both correlate with having an established channel. The doc 1214 and 1081 data yields this tier stack:

**Tier 1 - Highest probability of findable YouTube channel + audience overlap with an indie web3 music creator (approach first):**
1. **Kata7yst** - verified WaveWarZ interview subject (YouTube video ZU0ga5LRdyU confirmed), active creative output, named in collab tracks. Interview presence = existing YouTube footprint.
2. **XTinct_official (Alejandro Estrella)** - verified interview subject (video FmrzjYtdF6A), Chicago-born bilingual artist with described "trippy visuals" production style - strongest indicator of visual/YouTube work outside WaveWarZ.
3. **RoCkY2GriMeY** - 36 battles, most of any tagged artist. Prolific activity over time = higher likelihood of documented online presence.
4. **GodclouD** - 21 battles, 71.4% WR, platform's most cited competitive artist. High competitive profile often drives audience development on multiple platforms.
5. **dopestilo** - 5 songs in the platform top-20, most prolific song submitter. Breadth of catalog = independent artist building a discography = likely YouTube presence.

**Tier 2 - Strong WaveWarZ activity, less confirmed creative documentation (approach second):**
6. CannonJones973 (28 battles, #2 by battle count)
7. BennyJ504WaveWarz (27 battles)
8. Stormbourne (29 battles, active rivalry record)
9. _0xQuan (20 battles, 60% WR)
10. luiwrites (19 battles, documented collab tracks)

**Tier 3 - Lower battle counts, less confirmed presence (approach if Tiers 1-2 yield insufficient fits):**
The remaining 24 artists - especially those with fewer than 5 battles - are less likely to have channels with enough subscriber volume to fall in the 50-200% window relative to an established indie creator. They are not disqualified; the data simply does not support prioritizing them.

**On "real audience overlap":** The best proxy for actual audience overlap with BetterCallZaal (a web3-native music and indie creator audience) is whether the artist produces content that lives outside battle results - music videos, vlogs, YouTube Shorts. Kata7yst and XTinct_official are the only two with verified external video content in the ZAO library. For all others, audience overlap is unverified and would require channel inspection.

**Note:** No Reddit, HN, GitHub, or X source was obtained this run. Budget was exhausted after reading internal research docs (4 docs read, 0 external fetches executed). External subscriber data requires a redispatch as DEEP tier or a targeted YouTube Data API lookup against BetterCallZaal's channel ID first.

---

## Recommended Action

1. **Establish the subscriber baseline first.** Pull BetterCallZaal's YouTube channel subscriber count via YouTube Data API (`GET /channels?part=statistics&forHandle=bettercallzaal`). That number is the anchor for the entire 50-200% filter. Without it, no artist can be correctly sorted.

2. **Run a batch YouTube search on Tier 1 and Tier 2 artists in the order listed above.** Search YouTube for each Audius handle by name. For any channel found, compare subscriber count to the baseline. Tier 1 takes priority because two artists (Kata7yst, XTinct_official) already have confirmed YouTube video presence and are most likely to have channels worth comparing.

3. **For Collaboration-tagged upload outreach, sequence on fit score, not on battle rank.** With the baseline written as B (unknown until step 1), an artist at 1.67 x B is a better first collab than a platform-dominant artist at 80 x B. The 50-200% band exists to match audience sizes for cross-promotion - outside that band, the collab is asymmetric and the smaller channel gains nothing visible.

---

## Sources

- [FULL] Doc 1214 - WaveWarZ Creative Ecosystem: Artists, Music, and IP Assets (Jul 2026) - `research/wavewarz/1214-wavewarz-creative-ecosystem-jul2026/README.md` (liveness-verified-on-2026-09-20, read this run)
- [FULL] Doc 2501 - YouTube/ZAO Growth: WaveWarZ Short format research - `research/business/2501-youtube-zao-growth-which-wavewarz-short-format/README.md` (liveness-verified-on-2026-09-20, read this run)
- [FULL] WaveWarZ research index (134 docs) - `research/wavewarz/README.md` (liveness-verified-on-2026-09-20, read this run)
- [FAILED - budget exhausted] BetterCallZaal YouTube channel subscriber count - no external fetch executed
- [FAILED - budget exhausted] Individual WaveWarZ artist YouTube channel lookups - no external fetches executed

**Scope note:** Subscriber data for all 34 artists and BetterCallZaal is TBD. The priority ordering above is derived from battle activity and documented creative output only - it is not a subscriber-fit ranking. A DEEP tier redispatch with YouTube Data API access is required to complete the 50-200% filter.
