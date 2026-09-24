---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2466, 2536, 576"
original-query: "How we can improve websites - applied to poidhz.com, the ZAO bounty hub. What makes a small programme's public site actually work: conversion, credibility, feedback pages, returning contributors."
tier: STANDARD
---

# 2548 - poidhz.com: the site is the proof, and the proof is not in the HTML

> **Goal:** Decide what to change on poidhz.com so that linking it in a bounty post does the
> work the post used to do, measured against what the page actually serves today.

## Key Decisions (recommendations first)

| # | Decision | Why, in one line | Cost |
|---|---|---|---|
| 1 | **BAKE the round table into `index.html` at build time.** Keep the JavaScript as an enhancement that refreshes it. | The served HTML contains **zero** round data today - measured below. Everything a visitor came for arrives only after a second request. | Small. The hourly Action already runs `refresh-rounds.py` and commits; this is one more render step in the same job. |
| 2 | **Regenerate `og:description` in that same step so the share card carries live numbers.** | The card is the most-seen surface this programme has - every bounty post links it - and it currently says the same sentence it said in week one. | Trivial once decision 1 exists. |
| 3 | **FIX the line that says "Read from the chain every six hours."** It is hourly as of 2026-09-24. | The homepage states its own refresh cadence as a credibility claim, and the claim is now false. | One line. |
| 4 | **ADD JSON-LD (`Event` for ZAOstock, `ItemList` for the rounds).** The page has none. | `zaostock.com` already publishes JSON-LD and it is how this session read the festival's real start and end times. The hub publishes nothing machine-readable about itself. | Small. |
| 5 | **CUT the nav from 11 links.** | Eleven top-level links on a site whose job is "what is open, what people made, who won" spends the visitor's attention before the page has made a point. | Small, but it is a judgement call and belongs to Zaal. |
| 6 | **DO NOT adopt a framework, a prerender service, or SSR.** | The site is 32 static HTML files on Vercel with a Python build. Every problem below is solved by rendering at build time in the job that already runs. | Zero. This is a decision not to spend. |

## What the site actually serves, measured 2026-09-24

All of this is `curl` against the live site, not the repo.

| Measurement | Value |
|---|---|
| `https://poidhz.com/` | HTTP 200, **17,546 bytes** |
| Occurrences of `poidhz` in the served HTML (control) | 10 |
| Occurrences of `1412`, `1410`, `1409`, `pascaline`, `leoxcrane`, `0.005` | **0, every one of them** |
| `data/rounds-live.json`, fetched only after the page loads | 5,766 bytes |
| `application/ld+json` blocks | **0** |
| Nav links in the shared `ZN-NAV` block | 11 |
| Open Graph tags | complete: absolute `og:image`, `og:title`, `og:description`, `twitter:card` |
| `og:image` at `https://poidhz.com/assets/og/og.png` | HTTP 200, **183,686 bytes** - it works |
| HTML pages in the repo | 32 |
| Feedback pages live, across three rounds | 15 |

**The control matters.** A search for round data returning zero looks identical whether the
data is absent or the search is wrong, so `poidhz` was searched for in the same pass and
returned 10. The instrument works; the data is genuinely not there.

### The unfurl is fine. The page is the problem, and only for some readers.

This is the distinction the external sources force, and it is worth stating precisely because
it is easy to over-claim in both directions:

- **Link previews work.** poidhz.com's Open Graph tags are server-rendered in the static file,
  the image URL is absolute, and it resolves. Every source below agrees that this is the whole
  requirement for an unfurl. Nothing is broken on Farcaster, X, Telegram or Discord.
- **What those previews cannot do is say anything true about today.** The description is a
  fixed sentence. A card that read "Three rounds, 19 entries, the last pot paid 0.0061 ETH"
  would be doing work; a card that reads the same thing in week one and week four is a logo.
- **The page body is a different question.** A crawler, a reader with JavaScript unavailable,
  and anyone on a connection where the second request fails all get "Loading the live state"
  and "loading...".

GOV.UK measured that last group. **0.9% of GOV.UK visits come from people who do not have
JavaScript available and did not choose to turn it off** - script stalled, CDN route broken,
corporate proxy, extension. At this programme's scale 0.9% is not the argument. The argument
is the one their technical architect makes in the same post: *"progressive enhancement is about
resilience as much as it is about inclusiveness"* - a page whose entire content depends on one
extra request has one point of failure between a bounty post and the proof it points at.

### The staleness problem is already half-fixed, and it is the sharper one

On 2026-09-23 at 17:0x, `poidhz.com` showed **bounty 1412 with 0 claims when it had 5**. The
feed regenerates on a schedule and was four hours old; the round had closed in the meantime.

The refresh was moved from six-hourly to hourly the same evening
(`.github/workflows/refresh-bounty-dashboard.yml`). The six-hour cadence existed because
hourly runs once deployed ~25 times a day, and that had been fixed since by the
`-I '"generated_at"'` guard on the commit step - **the fix landed and the comment explaining
the old cadence outlived it.** Verified both directions in a scratch repo: a timestamp-only
change is suppressed, a claim-count change still commits.

Hourly still means a one-day bounty can be wrong on the homepage for an hour. Decision 1 does
not fix that either. What fixes it is the page saying when it was read, which it already does -
and the homepage copy currently contradicting it, which is decision 3.

## What the site gets right, and should not lose

Worth writing down because an improvement pass is where these get thrown away:

- **It respects its own stated closes**, so no page invites anyone into a round that has shut.
  `scripts/check-site-claims.py` checks this across 20 pages and passes.
- **Every external link answers.** `check-external-links.py`: 45 of 45, with live and dead
  controls that abort the run if the controls misbehave.
- **The feedback pages are the real asset.** Fifteen pages, one per entrant per round, at
  `/feedback/<bounty_id>/<handle>`. The path carries the bounty id specifically so next round
  cannot overwrite a link already sent - Zaal, 2026-09-22: *"its not a slug we can reuse so
  lets make sure its tied to bounty"*.
- **The builder refuses to publish a ranking word, a promise, or a page naming another
  entrant.** That is a guard on the thing this programme has historically got wrong; doc
  `business/2466-poidhz-platform-honest-audit` has the record of five rounds of promises.
- **`/about` publishes what the programme has and has not delivered.** A site that documents
  its own unkept promises is doing something almost no project site does, and it is the single
  most credible thing on the domain.

## Findings from outside

| Source says | Applies here how |
|---|---|
| Platform crawlers do not execute JavaScript; they read the first HTML response and leave. Tags injected client-side do not exist as far as the bot is concerned. | poidhz's tags are static, so this is **not** a live problem - it is the reason decision 2 has to render into the file rather than be set from JS. |
| "The source is the contract." The inspector shows the DOM after JS; the crawler sees the source. | The check that matters is `curl`, not devtools. It is what produced the zero-round-data measurement above. |
| Slack, Discord and Telegram scrapers run on aggressive, sometimes sub-second timeouts. | Two requests before content exists is two chances to miss that window. One static file is one. |
| GOV.UK: 0.9% of visits have no JavaScript available and did not choose it; PE is "about resilience as much as inclusiveness". | The resilience argument, not the percentage, is what applies at this scale. |
| HN thread, 235 points, 147 comments: the dominant objection is not that PE is wrong but that it is *hard* - one commenter with nine years of HTML and CSS says layout still feels like whack-a-mole. | Real, and it is why decision 6 says no framework. Rendering a table into a file with Python is not the hard version of this. |

**Contradiction, unresolved and left that way:** the same HN thread has a strong line of
argument that progressive enhancement is dead for applications, and a separate 2013 thread
titled *"Progressive Enhancement Is Dead"* carries 334 points. Nobody in either thread argues
it is dead for a **content page that exists to be linked**, which is what poidhz.com is. The
disagreement is about applications and it is not adjudicated here.

## Cross-repo check

`gh search code "rounds-live.json" --owner=bettercallzaal` returns hits in exactly one repo -
`bettercallzaal/poidhz` (`index.html`, `scripts/refresh-rounds.py`, `docs/about.html`,
`docs/owed-credit.md`). **No other ZAO site uses this feed or this pattern**, so there is no
existing in-house prerender step to copy and nothing else breaks if it changes. The
`--owner=ZAODEVZ` half of the search failed with a TLS handshake timeout and was not retried;
that is an unsearched surface, not an empty one.

## Also See

- [poidhz: what the platform actually is, measured](../../business/2466-poidhz-platform-honest-audit/) - the record of what this programme has and has not delivered, which `/about` renders.
- [Bounty entrant feedback](../../community/2536-bounty-entrant-feedback/) - the research the feedback pages were built from, and the source of the public-vs-private decision Zaal overruled.
- [Godly Fourth Pass: ZAOstock content richness](../576-godly-fourth-pass-zaostock-richness-donate-birthday/) - the equivalent pass on the festival site.
- **Doc 741 is ambiguous and is deliberately not cited by number.** It resolves to two
  different documents - `infrastructure/741-pion-livekit-webrtc-stack` and
  `infrastructure/741-21st-dev-ui-ux-zaofractal-improvements`. The UI/UX one is the relevant
  prior art and is linked [by path](../741-21st-dev-ui-ux-zaofractal-improvements/).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Render the round table into `index.html` at build time in `refresh-bounty-dashboard.yml`; shipped when `curl https://poidhz.com/ \| grep -c 1412` returns non-zero | @Zaal | PR to bettercallzaal/poidhz | 2026-09-26 |
| Regenerate `og:description` with live counts in the same step; shipped when the served `og:description` names a number that changes between two runs | @Zaal | PR to bettercallzaal/poidhz | 2026-09-26 |
| Fix the "every six hours" line on the homepage to say hourly; shipped when the string "every six hours" returns 0 from the live page | @Zaal | PR to bettercallzaal/poidhz | 2026-09-25 |
| Add `Event` + `ItemList` JSON-LD to `index.html`; shipped when `curl \| grep -c application/ld+json` returns 1 or more | @Zaal | PR to bettercallzaal/poidhz | 2026-09-30 |
| Decide whether the 11-link nav gets cut and to what; shipped when `sync-site-nav.py` reports a smaller link count, or wontfix | @Zaal | Decision | 2026-09-30 |
| Re-run the `--owner=ZAODEVZ` half of the cross-repo search that timed out; shipped when it returns a result or a clean zero | @Zaal | Research follow-up | 2026-10-01 |

## Sources

- [Why we use progressive enhancement to build GOV.UK](https://gdstechnology.blog.gov.uk/2016/09/19/why-we-use-progressive-enhancement-to-build-gov-uk/) - **[FULL, method: curl + HTML strip, 65,934 bytes fetched, 12,376 chars of text]** Robin Whittleton, 19 September 2016. Source of the 0.9% figure and the resilience quote, both read verbatim. **Ten years old** - the 0.9% number is a 2016 measurement of a UK government audience and is cited as an order of magnitude, not as today's rate anywhere else.
- [Why Link Previews Break: Debugging Social Crawlers](https://richdevtools.com/articles/web/link-preview-crawler-debugging) - **[PARTIAL - exa highlights only, full body not fetched]** Published 2026-08-23. Source of "the source is the contract" and the status-code diagnostic table.
- [How link previews work](https://www.tryunfurl.com/how-link-previews-work.html) - **[PARTIAL - exa highlights only]** Source of the crawler-does-not-execute-JS statement and the view-source check.
- [How to Fix Broken Social Media Link Previews](https://prerender.io/blog/how-to-fix-link-previews/) - **[PARTIAL - exa highlights only]** Vendor content for a prerendering service, so its framing favours buying one; used only for the sub-second timeout claim about Slack, Discord and Telegram. **Decision 6 rejects its product recommendation.**
- [HN 12538144 - Why we use progressive enhancement to build Gov.uk](https://news.ycombinator.com/item?id=12538144) - **[FULL, method: hn.algolia.com items API, keyless, 83,386 bytes, 147 comments walked]** 235 points. The community source. Read for the objection rather than the agreement.
- [HN 6316516 - Progressive Enhancement Is Dead](https://news.ycombinator.com/item?id=6316516) - **[PARTIAL - title, points and comment count from the Algolia search index; thread body not fetched]** 334 points, 259 comments. Cited only as evidence that the disagreement exists.
- **poidhz.com itself** - **[FULL, method: curl -sL, HTTP 200, 17,546 bytes, verified 2026-09-24]** Every number in the measurement table.
- **`bettercallzaal/poidhz` working tree** - **[FULL, local]** `index.html`, `scripts/refresh-rounds.py`, `scripts/check-site-claims.py`, `scripts/check-external-links.py`, `scripts/build-feedback-pages.py`, `scripts/sync-site-nav.py`, `.github/workflows/refresh-bounty-dashboard.yml`, `vercel.json`.
- **`gh search code`, owner bettercallzaal** - **[PARTIAL - the ZAODEVZ half failed with a TLS handshake timeout and was not retried]**

## Research Metadata

Tier STANDARD. Nine sources, two of them community (HN). Written 2026-09-24 against a live
site whose state had changed twice in the preceding eighteen hours - a bounty closed and the
refresh cadence changed - so every measurement carries the time it was taken.

**One instrument failure hit while writing this, and it is the reason the control is in the
measurement table.** A Hacker News query of 13 words returned `nbHits: 0`. The query was too
long, not the topic absent: a three-word control returned 980. An empty result from a new
instrument is a statement about the instrument until a control says otherwise.
