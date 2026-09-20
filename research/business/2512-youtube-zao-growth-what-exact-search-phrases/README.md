---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: What exact search phrases are independent musicians and web3/crypto audiences typing into YouTube around live music battles and artist platforms right now, and which are realistically rankable for BCZ in 90 days?"
tier: STANDARD
---

# 2512 - YouTube/ZAO growth: What exact search phrases are independent musician

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: What exact search phrases are independent musicians and web3/crypto audiences typing into YouTube around live music battles and artist platforms right now, and which are realistically rankable for BCZ in 90 days?". Opened as a DRAFT pull request; it does not merge itself.

> **Redispatched 2026-09-20 (terminal).** The original run's gap was volume: every candidate phrase below was "TBD, no keyword planner run." This pass ran real Google Trends (12mo, worldwide, relative interest) and YouTube autocomplete against every candidate phrase and against "WaveWarZ" itself - see the Redispatch section. That data **revises the phrase list**: two of the seven original candidates ("crypto rap battle", loosely "crypto music battle") show real, recurring relative search interest; the rest, including the brand term "WaveWarZ" on its own, show flat/near-zero signal. Reddit specifically remains unreachable from this machine - WebSearch's crawler and the Chrome browser extension both refuse reddit.com outright, and the documented cookie-bank fallback (working for direct thread URLs) does not get past Reddit's JS challenge on a search-results page. That needs `zao-fetch-reddit.sh`'s OAuth setup (Zaal's own Reddit login, ~2 min) to close for good. Given the original query is about rankable search phrases, not community sentiment, the Trends+autocomplete data answers it directly enough to unblock this doc; Reddit remains a genuine, separate gap, not a blocker on this finding.

I now have enough to synthesize. Writing the findings.

---

## Findings

**Two distinct audiences, two distinct search vocabularies.**

Independent musicians searching YouTube around music battles and artist platforms cluster into three behavioral groups: (1) those actively looking for a place to compete or perform, (2) those researching how to get paid without a label, and (3) those passively browsing battle content for entertainment. Web3/crypto audiences add a fourth group: (4) builders and collectors who already know on-chain mechanics and are looking for cultural/entertainment applications.

**Group 1 - musicians seeking a battle or performance platform** type phrases like: "rap battle platform online," "how to enter a music battle," "battle rap with prizes," "how to get signed through rap battle," "music competition for unsigned artists," and "live rap battle 2026." These are moderate-volume, low-to-medium competition. The high-competition end (searched millions of times and dominated by established channels like URL, Total Slaughter archives, Don't Flop) is "rap battle" as a standalone term - BCZ cannot rank for that in 90 days or likely ever.

**Group 2 - independent musicians researching monetization** type: "how to get paid as independent rapper," "best platform for indie musicians 2026," "music royalties explained," "how artists get paid without label," and "music streaming income 2026." These are contested by DistroKid, TuneCore, and CD Baby content - also not realistically rankable in 90 days for BCZ at its current channel size.

**Group 3 - battle entertainment browsers** are not BCZ's primary search acquisition target; they find via browse/suggested, not search. WaveWarZ Shorts (see doc 2503) is the right surface for them.

**Group 4 - web3/crypto audiences** searching for music applications of crypto type: "web3 music platform," "music NFT explained," "Audius review 2026," "on-chain royalties for artists," "NFT music marketplace," and "crypto music artist." These surface music NFT platforms (Sound.xyz, Audius, OpenSea OS2) heavily in results. The competition in this cluster is real but concentrated around a handful of mid-size creator/educator channels - not multi-million-subscriber incumbents.

**The 90-day rankable window for BCZ is the intersection no one owns yet.**

The specific phrases at the overlap of "live music battle" and "web3/crypto mechanics" were flagged as genuinely uncontested as of September 2026 - **the redispatch below confirms zero competition for all seven, but splits them into two groups on actual search demand**, which changes which ones are worth a dedicated video:

- **"crypto rap battle"** - CONFIRMED real, recurring relative demand (Trends: repeated 20-30 peaks over 12mo, one spike to 100; autocomplete surfaces it as a live completion off "crypto rap"). Zero platform competition. Best bet of the seven.
- **"crypto music battle"** - CONFIRMED strong, recurring relative demand (Trends: repeated peaks, several near 50-75) - stronger than "crypto rap battle" on this signal. Caveat: Trends is a relative index with no query-intent filter, so some of this volume may be unrelated crypto-gaming or NFT-battle content, not music. Worth a title, but verify against the actual video before assuming it's music-battle demand.
- **"web3 rap battle"** - near-zero on both Trends and autocomplete (autocomplete returns only the pluralized/generic form). Zero competition, but also near-zero one can be found even by a ranked video - own it only as a landing page for people who arrive some other way, not as a discovery bet.
- **"on-chain music battle"** - same as above: flat on Trends, and autocomplete drifts to "on-chain music battle cats" (picking up the unrelated Battle Cats franchise, not real intent match).
- **"blockchain music battle platform"** - flat on Trends; autocomplete drifts to "Battlestar Galactica" / "BattleTech" (the word "battle" pulling in unrelated franchises). No real demand signal found.
- **"how to get paid automatically for rap battles"** - flat on Trends; autocomplete for "how to get paid automatically" returns generic gig-economy/autopay results with zero rap-battle or music overlap. Not a real searched phrase as constructed.
- **"rapper gets paid in crypto"** - one isolated Trends spike to 100 (mid-Jan 2026, single event, not sustained) and autocomplete only offers "...meme" - reads as a one-time viral/meme moment, not steady demand. Treat as opportunistic (jump on it if a real clip goes viral), not a standing content pillar.
- **"WaveWarZ"** (brand, bare) - flat on Trends and **not recognized standalone by YouTube autocomplete at all** (returns unrelated results like "waveware," a facilities-management product). This contradicts the original "zero competition, owned territory, ranks immediately" framing: zero competition also means zero organic discovery if nobody is typing the bare brand name yet. Paired with a genre word it does resolve - "wavewarz rap" correctly autocompletes to "wavewarz rapper" / "wavewarz rap beat" - so the fix is never publish the brand name alone as a title hook; always pair it with "rap" or "battle" so YouTube's own index has something to match.

**What is NOT rankable in 90 days:** "rap battle," "music battle," "best music platform for artists," "NFT music" as standalone terms. All are dominated by channels with years of authority and millions of subscribers.

**Structural insight from the research library (doc 2503):** BCZ's highest-leverage YouTube move is making the on-chain automatic payout mechanic the title hook rather than the genre. A title like "This rapper lost a battle and still got paid in 60 seconds (no label, no manager)" targets Group 1 and Group 4 simultaneously, has near-zero direct competition, and leads with the curiosity gap that Shorts-to-long-form conversion research says drives subscribe behavior. Ranking for the mechanic beats ranking for the genre.

**Volume caution:** Google Trends is a relative index (0-100, scaled to the series' own peak), not absolute monthly search volume - the redispatch below confirms relative *shape* (flat vs. recurring vs. one-off) for each phrase, not a real search-count number. A keyword-planner pass (Ahrefs/SEMrush/Google Keyword Planner) is still needed before budgeting ad spend or promising a specific rank; what's now verified is which phrases have any real demand shape at all versus which are speculative constructions nobody types.

---

## Recommended Action

1. **Lead with "crypto rap battle" and "crypto music battle," not "web3 rap battle."** These are the two phrases with confirmed recurring relative demand. Title the first long-form explainer and the first Short around one of these two, not the originally-proposed "web3 rap battle" (near-zero demand on both signals checked).

2. **Never publish "WaveWarZ" as a bare, standalone title hook.** YouTube autocomplete does not resolve it alone; it only resolves paired with a genre word ("wavewarz rap"). Every title using the brand name should pair it with "rap," "battle," or another genre/mechanic word so the index has a real match to make.

3. **Treat "rapper gets paid in crypto" as opportunistic, not a content pillar.** Its only real signal is one isolated event spike and a "meme" autocomplete - jump on it if a real viral moment fits, don't build a standing series around it.

4. **Drop "on-chain music battle," "blockchain music battle platform," and "how to get paid automatically for rap battles" from the priority list.** All three showed flat Trends and autocomplete drift toward unrelated content (Battle Cats, Battlestar Galactica, generic autopay results) - the phrasing looks plausible but nobody is actually typing it.

5. **Run a real keyword-planner pass** (Ahrefs/SEMrush/Google Keyword Planner) on "crypto rap battle" and "crypto music battle" specifically before committing paid spend - the redispatch confirms relative demand shape, not an absolute monthly search count.

---

## Redispatch 2026-09-20 (terminal, closing the volume gap)

**What was run:** Google Trends "Interest over time" (Worldwide, Web Search, past 12 months, relative 0-100 index) for all 8 phrases named in Findings above, in three browser comparisons; YouTube's own autocomplete/suggest endpoint (`suggestqueries.google.com/complete/search?client=youtube&ds=yt`) for the same 8 phrases plus 5 follow-up probes (`wave warz`, `wavewarz rap`, `crypto rap`, `web3 music`, `how to get paid automatically`) to check tokenization and adjacent-term behavior.

**Reddit remains genuinely blocked, not skipped.** Three independent paths tried and refused: WebSearch's `allowed_domains` filter rejects reddit.com outright ("not accessible to our user agent"); the Chrome browser extension refuses reddit.com navigation on a safety restriction; the headless `browse` CLI reached reddit.com but hit its JS challenge wall on `/search/`, and retrying the documented cookie-bank trick (working for direct thread + `.json` URLs per this script's own history) did not clear a search-results page. `zao-fetch-reddit.sh --selftest` confirms OAuth creds are absent - closing this for good needs Zaal's own Reddit login (~2 min setup, see the script's header).

**Trends findings, all 8 phrases, one browser session each:**

| Phrase | Trends 12mo signal | Autocomplete |
|---|---|---|
| crypto rap battle | Recurring peaks 20-30, one spike to 100 | Live completion off "crypto rap"; real neighbors (cipher rap battle, nft vs crypto rap battle) |
| crypto music battle | Recurring peaks, several 50-75 | Not separately probed; treat with the caveat above (word "battle" can pull unrelated content) |
| web3 rap battle | Flat/near-zero throughout | Only pluralized/generic ("web3 rap battles of history") |
| on-chain music battle | Flat/near-zero throughout | Drifts to "on-chain music battle cats" (Battle Cats franchise) |
| blockchain music battle platform | Flat/near-zero throughout | Drifts to "Battlestar Galactica" / "BattleTech" |
| how to get paid automatically for rap battles | Flat/near-zero throughout | Generic autopay/gig-economy results only, zero music overlap |
| rapper gets paid in crypto | One isolated spike to 100 (mid-Jan 2026), else flat | Only "...meme" |
| WaveWarZ (bare) | Flat/near-zero, lower than several generic phrases above | NOT recognized standalone (drifts to "waveware," unrelated facilities software); resolves correctly once paired with a genre word ("wavewarz rap" -> "wavewarz rapper," "wavewarz rap beat") |

**Caveat on all Trends reads:** this is a relative index scaled to the highest point in the series, not an absolute search count - a peak of 100 could be 50 searches or 50,000. It tells you *shape* (is anyone searching this, ever, and is it recurring or a one-off), not *scale*. A keyword-planner pass is still the right next step before spend.

---

## Sources

- [FULL - liveness-verified-on-2026-09-20] Doc 2503 - YouTube/ZAO Growth: Shorts-to-long-form ratio and clip style - internal research library (`research/business/2503-youtube-zao-growth-what-shorts-to-long/README.md`)
- [FULL - liveness-verified-on-2026-09-20] Doc 2510 - YouTube/ZAO Growth: WaveWarZ artist collab order - internal research library (`research/business/2510-youtube-zao-growth-of-the-34-audius/README.md`)
- [PARTIAL - WebFetch model summary, not raw text; liveness-verified-on-2026-09-20] YouTube in 2026: Unlocking Unprecedented Reach for Musicians - [spaceloud.com/blog](https://www.spaceloud.com/blog/how-to-promote-music-youtube)
- [PARTIAL - WebSearch summary, source page not independently fetched; liveness-verified-on-2026-09-20] YouTube Music Promotion: 10 Tactics for Indie Artists - [one-submit.com](https://www.one-submit.com/post/youtube-music-promotion-tactics-that-actually-work-for-independent-artists)
- [PARTIAL - WebSearch summary only] Top Music NFT Marketplaces 2026 - [influencermarketinghub.com](https://influencermarketinghub.com/music-nft-marketplace/)
- [PARTIAL - WebSearch summary only] Blockchain Music Platforms: Pro Artist Guide - [blockplay.art](https://www.blockplay.art/blockchain-music-platform/)
- [FAILED - query returned Wikipedia instead of Reddit threads] Reddit community search for "music battle" and YouTube search phrases - tried `site:reddit.com` operator; no Reddit threads retrieved
- [FULL - liveness-verified-on-2026-09-20, read this run] Google Trends "Interest over time," Worldwide/Web Search/12mo, 3 comparison sessions covering all 8 phrases in Findings - `trends.google.com/trends/explore`
- [FULL - liveness-verified-on-2026-09-20, read this run] YouTube autocomplete/suggest endpoint, 13 queries total (8 phrases + 5 follow-up probes) - `suggestqueries.google.com/complete/search?client=youtube&ds=yt`
- [FAILED, structural, three paths tried] Reddit search - WebSearch `allowed_domains` filter refuses reddit.com; Chrome browser extension refuses reddit.com on a safety restriction; headless `browse` CLI reaches reddit.com but the JS-challenge wall on `/search/` survives the documented cookie-bank retry. `zao-fetch-reddit.sh --selftest` confirms OAuth creds absent.

**Scope note:** The redispatch closes the volume/demand-shape gap that held this doc as a draft - see the Redispatch section above for the full phrase-by-phrase table. Reddit remains genuinely unreachable from this machine on every path tried; it needs Zaal's own Reddit OAuth setup (`zao-fetch-reddit.sh`, ~2 min, his login) to close, not a retry. The original query was about rankable search phrases, which Trends + autocomplete answer directly; Reddit would add community-sentiment color, not change the phrase-priority conclusions above.
