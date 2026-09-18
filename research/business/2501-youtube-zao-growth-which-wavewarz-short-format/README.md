---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-18
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: Which WaveWarZ Short format (battle-result cold-opens vs. founder build-in-public clips vs. festival artist/vendor moments) actually converts Shorts viewers into nightly WaveWarZ participants, not just views/subs?"
tier: STANDARD
---

# 2501 - YouTube/ZAO growth: Which WaveWarZ Short format (battle-result cold-op

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: Which WaveWarZ Short format (battle-result cold-opens vs. founder build-in-public clips vs. festival artist/vendor moments) actually converts Shorts viewers into nightly WaveWarZ participants, not just views/subs?". Auto-committed to main for durability; review + deepen as needed.

Budget nearly exhausted. Synthesizing from internal ZAO research - no further fetches.

---

## Findings

The ZAO research library (docs 1303, 1402, 2290) contains planned WaveWarZ Shorts formats but **zero measured conversion data** linking any Short format to nightly Battle Space participation. This is the honest answer: the question cannot be answered from existing data because the experiment has not been run.

### What the Internal Docs Show

**Doc 1303 (YouTube strategy)** plans three Shorts formats from Battle Space VODs - battle highlight cold-opens, artist reaction moments, and leaderboard reveals - at 3 per week. No attribution tracking or CTA-link UTMs are specified.

**Doc 1402 (TikTok strategy)** explicitly prioritizes two formats:
- T01 "Who Won This Battle?" - 30-60s battle result drop with payout overlay, "Follow to see who wins next" CTA. This is the battle-result cold-open format.
- T02 "Loser Gets Paid" - 45-60s economics explainer series. Closest to founder build-in-public.

Festival artist/vendor moments appear as a supporting format, not a primary one.

**Doc 2290 (investor analytics)** shows 1,161 battles run, 140/month cadence, 62% artist multi-month retention - strong product engagement. But social channel attribution to Battle Space attendance is absent entirely.

### Why the Answer Requires a Structured Test

The three formats serve different viewer intents:

**Battle-result cold-opens** create curiosity loops - viewers see an outcome and want to know how it happened, or want to catch the next one live. This format points most directly at nightly participation because the CTA naturally maps to "watch it happen in real time." The weakness: it requires a production-quality clip every cycle.

**Founder build-in-public clips** attract people who are interested in the project's story, not the game itself. These viewers are likely to follow and subscribe but are lower-intent participants in the nightly event. They may convert over weeks, not days.

**Festival artist/vendor moments** are relationship content - they serve existing community members and artists considering WaveWarZ, but viewers who don't already know the product have no clear next action. Conversion to nightly participation requires multiple touchpoints.

The format most likely to convert on first exposure is the battle-result cold-open, because the product IS the battle and the CTA is a specific time ("join live at 8:30 PM EST"). Build-in-public and festival moments require the viewer to already be curious about WaveWarZ as a concept before they would show up to a live event.

External platform data on this specific question (short-form gaming/music community participation conversion by format) was not fetched this run due to budget constraints - this synthesis is directional, not measured.

### The Gap That Must Be Closed

No UTM tracking exists in the planned strategy docs. Without `utm_source=shorts_t01` style attribution on every Short's CTA link, there is no way to close the loop between a Short view and a Battle Space appearance. This is the single highest-leverage missing piece.

---

## Recommended Action

1. **Start with T01 (battle-result cold-opens) for 4 weeks.** It maps most directly to the participation CTA and is already prioritized in doc 1402. Ship 2-3 per week.

2. **Wire UTM attribution before publishing the first Short.** Every Shorts CTA link gets `?utm_source=yt_shorts&utm_content=battle_cold_open` (or equivalent). Check these in whatever analytics WaveWarZ.info uses. Without this, the conversion question remains unanswerable for the next quarter too.

3. **Defer build-in-public and festival formats until T01 has 4 weeks of data.** Launching all three simultaneously makes attribution impossible. Sequence the test.

---

## Sources

- [FULL] Doc 1303 - ZAO YouTube + Video Strategy - `/home/zaal/zao-os/research/` (liveness-verified-on-2026-09-18, read via internal grep)
- [FULL] Doc 1402 - WaveWarZ TikTok Strategy - `/home/zaal/zao-os/research/` (liveness-verified-on-2026-09-18, read via internal grep)
- [FULL] Doc 2290 - WaveWarZ Investor Analytics - `/home/zaal/zao-os/research/` (liveness-verified-on-2026-09-18, read via internal grep)
- [FAILED - budget exhausted before external fetch] YouTube Shorts format conversion benchmarks - WebSearch not executed this run

**Note:** No Reddit/HN/GitHub/X source was obtained. This research is STANDARD tier, grounded on internal ZAO docs only. For a measured external benchmark on short-form video format conversion to live event participation, redispatch as DEEP tier with dedicated budget.
