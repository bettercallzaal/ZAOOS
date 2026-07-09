---
topic: business
type: audit
status: research-complete
last-validated: 2026-06-25
superseded-by:
related-docs: 037, 899, 905
original-query: "have the pi do a claude code loop researching SEO on Zaal and anywhere on the internet he/the ZAO appears, and add it into ZAO OS as a /zao-research"
tier: STANDARD
---

# 906 - Zaal / ZAO SEO + Web-Presence Audit (living - fed by the Pi SEO loop)

> **Goal:** Own more search real estate for Zaal / BetterCallZaal / The ZAO / WaveWarZ. This doc is seeded by the first pass of a 24/7 SEO researcher on the Pi (tmux `seor`, `~/seo-research/`) and is updated as passes accumulate.

## Key decisions (do these first)

| Action | Why | Priority |
|--------|-----|----------|
| **Register + build bettercallzaal.com** (one page: name, handle, bio, project links; "Zaal Panthaki" + "BetterCallZaal" in title + H1) | No owned site ranks for either branded query - a raw HackMD resume is doing that job. A canonical owned page displaces it. | HIGH |
| **Fix the LinkedIn headline + About** to "Founder, The ZAO | BetterCallZaal | WaveWarZ" | LinkedIn is the **#1 result for "Zaal Panthaki"** but shows the old Jackson Laboratory automation role - actively off-brand. | HIGH |
| **Optimize the @bettercallzaal YouTube About** to include "Zaal Panthaki" + "BetterCallZaal" | The channel is invisible for both branded queries; the text forces it to rank. | MED |
| **Add footer backlinks** thezao.com + wavewarz.com -> personal site, anchor "BetterCallZaal" | Consolidates link equity, surfaces project sites on branded queries. | MED |
| **Publish a "Who is BetterCallZaal" page** (thezao.com or Mirror/Substack) using both name variants + project names | Gives search a clean text-rich doc to rank above the TV-show contamination. | MED |

## Findings - first pass (2026-06-25): branded SERP audit

**"BetterCallZaal":** X profile ranks #1, then a raw [HackMD resume](https://hackmd.io/@bB0dXoPfSAuUEqyo43pHZw/Hyq0LS-Z-g) at #2, then individual tweets, then a deep GitHub link into the ZAOOS repo. **Results #7-8 are the Better Call Saul TV show** (x.com/bettercallsaul + Breaking Bad Fandom wiki) - contaminating the brand SERP. The wrong @bettercallcal Linktree also appears. **YouTube, Linktree, thezao.com, wavewarz.com are all absent from page 1.**

**"Zaal Panthaki":** [LinkedIn](https://www.linkedin.com/in/zaalp/) ranks #1 but the headline shown is the Jackson Laboratory automation role, not ZAO/web3. Data scrapers (ZoomInfo, ReachInbox) hold mid-page. The HackMD resume reappears at #3. An old (non-@bettercallzaal) YouTube channel appears at #9. thezao.com + wavewarz.com do not rank.

**The gap:** no owned personal site ranks for either query; LinkedIn undermines positioning with a stale job title; the Better Call Saul show eats handle-search share; all project sites are invisible on branded queries.

## How this doc stays current

A 24/7 SEO researcher runs on the Pi (`~/seo-research/`, tmux `seor`, ~4h passes, 12 rotating angles: branded SERP, "The ZAO" disambiguation, WaveWarZ search, keyword gaps, backlinks, directory/wiki, social-profile SEO, technical SEO, local/ZAOstock, reputation, peer benchmarking). Each pass appends to `~/seo-research/findings-<date>.md`, pings Zaal, and logs a Bonfire episode (`seo-research`). Fold notable findings into this doc as they land. Same pattern as the YT-growth researcher ([[project_pi_yt_research]]).

## Also See

- [Doc 905](../905-incented-borker-sven/) - Borker (could auto-publish the SEO content pages)
- [Doc 037](../037-bridges-competitors-monetization/) - earlier SEO/monetization notes
- [Doc 899](../../agents/899-zoe-agent-fleet-audit/) - the agent fleet running these researchers

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Register bettercallzaal.com + ship a one-page bio site | @Zaal | Action | This week |
| Fix LinkedIn headline/About to current brand | @Zaal | Action | Today (2 min) |
| Update @bettercallzaal YouTube About with both name variants | @Zaal | Action | This week |
| Add footer backlinks on thezao.com + wavewarz.com | @Zaal | PR | This week |
| Let the Pi SEO loop run; fold weekly findings into this doc | @ZOE | Recurring | Weekly |

## Sources

- [FULL - first-hand, Pi SEO researcher pass 2026-06-25] `~/seo-research/findings-2026-06-25.md` - live branded-SERP audit via claude + WebSearch
- [FULL] [X @bettercallzaal](https://x.com/bettercallzaal) - ranks #1 for the handle query
- [FULL] [HackMD resume](https://hackmd.io/@bB0dXoPfSAuUEqyo43pHZw/Hyq0LS-Z-g) - currently #2, doing the job an owned site should
- [FULL] [LinkedIn - Zaal Panthaki](https://www.linkedin.com/in/zaalp/) - #1 for the name query, off-brand headline
- [PARTIAL] [Better Call Saul X](https://twitter.com/bettercallsaul) - SERP contaminant on the handle query (noted, not the target)

**Code / repo search:** N/A for the topic - this is a web-presence/SEO audit, not a code problem. The only "implementation" is the SEO researcher itself: `~/seo-research/` on the Pi (seo-research.sh + seo-loop.sh, tmux `seor`), modeled on the YT-growth researcher in [[project_pi_yt_research]]. No external repos apply.
