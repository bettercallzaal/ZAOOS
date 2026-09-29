---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-29
superseded-by:
related-docs: "events/2279-ellsworth-promo-marketing-chesnee-aug13"
original-query: "[QUICK] townsof.com/discover - capture what Towns Of is now, PARKED for a big review after ZAOstock on 3 Oct. Zaal: save for a big review after zaostock. Build on the existing ruling (2026-09-28: point to Luma for this event, but 'we should deff tap in i had a great convo with the founder he seems great and i wanna use it mroe')."
tier: QUICK
---

# 2575 - Towns Of, captured and PARKED until after 3 October

> **Goal:** Record what Towns Of is while it is fresh, so the real review after ZAOstock starts from facts rather than from a founder conversation nobody wrote down.

**THIS DOC IS A CAPTURE, NOT A RECOMMENDATION. It is QUICK tier on purpose.**
Zaal: *"save for a big review after zaostock"*. The festival is 3 October and
nothing here should be acted on before it.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **PARK the evaluation until after 2026-10-03.** Nothing changes for this festival. | The 2026-09-28 ruling already settled this event: *"for this even lets point to luma and not do anyhting special but we should deff tap in i had a great convo with the founder he seems great and i wanna use it mroe"*. The listing points at `ticket.zaostock.com` and is done. |
| 2 | **When the review happens, the question is DISTRIBUTION, not ticketing.** | Their pitch is 0% ticket fees, but ZAOstock is a FREE event, so a fee of zero on a price of zero is worth nothing. What they actually have is an audience: a claimed 14M people a month and 300K+ followers across NJ, the Hudson Valley and Eastern PA. |
| 3 | **The first thing to establish is whether they cover MAINE at all.** | Every footprint number found is NJ / Hudson Valley / Eastern PA, and the company describes launching "state-by-state". Ellsworth, Maine is not obviously inside that. If the answer is no, the audience argument evaporates and only the tooling is left. |
| 4 | **Do not search for "Towns".** Search for "Towns Of" or the founder. | There is a DIFFERENT, better-known company called **Towns** - Ben Rubin's (Houseparty) open-source group-chat protocol, TechCrunch 2023, its own Crunchbase and Tracxn entries. Three of ten results for a plain search were that company. Conflating them would put a crypto chat protocol's funding history into a local-events evaluation. |

## What it is, as measured 2026-09-29

- **Founder and CEO: Graham Colligan.**
- A local news and events app for **suburban** communities, aggregating local news
  and curating nearby events, launching **state-by-state**.
- Its own meta description, identical on every route:
  *"collect RSVPs, sell tickets with 0% fees, send reminders + own your audience -
  built for locals, by locals."*
- Page title: *"Towns Of | find + build IRL community"*.
- Claimed reach **14M people a month**, covering the NYC and Philadelphia suburbs.
- Origin: started as a **local magazine**, pivoted repeatedly, built **300K+
  followers** covering local news in **NJ, the Hudson Valley and Eastern PA**,
  reported as **15M organic viewers a month**.

## Two measurement traps found while capturing this, both worth more than the summary

**1. EVERY townsof.com URL RETURNS 200, INCLUDING ONES THAT DO NOT EXIST.** It is
a single-page app that serves the same 2,529-byte shell on every route.
`/discover`, `/apply`, `/en/advertise` and `/old-home` all return 200 with
identical bytes - **and so does `/zzz-not-a-real-page`**, which was run as a
control. So an HTTP status from that domain says nothing about whether a page
exists, and any future check must read rendered content, not a status code.

    townsof.com/discover            200   2529 bytes
    townsof.com/apply               200   2529 bytes
    townsof.com/en/advertise        200   2529 bytes
    townsof.com/old-home            200   2529 bytes
    townsof.com/zzz-not-a-real-page 200   <- the control

**2. THE iOS APP LINK IS DEAD.** The App Store URL that appears in search results,
`apps.apple.com/us/app/towns-of-local-news-events/id6680196160`, returns **HTTP
404**. Either the app was pulled, the id changed, or the listing is regional. That
is a real question for the review and not a fetch failure - the same command
returned 200 for four other URLs in the same run.

## What this does NOT establish

- **Whether Towns Of covers Maine.** Not found either way.
- **Any funding, headcount or revenue figure.** The Crunchbase and Tracxn results
  are the OTHER Towns.
- **What the founder and Zaal actually discussed.** That conversation is the
  reason this is on the list at all and it exists nowhere in writing. **Capturing
  it is the single highest-value thing before the review** - it is the only input
  no amount of research can reconstruct.
- **Whether the Towns Of listing for ZAOstock produced any traffic.** After 3
  October that is measurable and it is the only real evidence this partnership
  would ever generate.

## Also See

- [events/2279 - Ellsworth promotion and marketing, Chesnee Barney x ZAOstock team](../../events/2279-ellsworth-promo-marketing-chesnee-aug13/) - the local-distribution landscape this sits inside: Heart of Ellsworth covers downtown, Discover Ellsworth tells people where to go. Towns Of would be a third channel, not a first.
- `zao-vault decisions/grill-2026-09-28-zaostock-afternoon.md` item 2 - the Towns Of listing edit, done in Chrome on Zaal's word.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Write down what the founder conversation actually covered, in any form - a paragraph in the vault is enough. It is the only input research cannot reconstruct, and it is decaying now | @Zaal | Note | 2026-10-06 |
| Measure whether the ZAOstock Towns Of listing sent any traffic, using the post-festival numbers, and record the figure even if it is zero | @Zaal | Measurement | 2026-10-10 |
| Re-research at STANDARD tier with the two above in hand; the first question is whether Towns Of covers Maine | @Zaal | Research doc | 2026-10-13 |

## Sources

- [townsof.com/discover](https://townsof.com/discover) - **[PARTIAL, method: `curl` + HTML strip]** HTTP 200, 2,529 bytes, but only 37 characters of body text. The `<head>` is real and is quoted above; the body is a JS shell. Escalation was attempted and is recorded below.
- exa `web_search_exa` - **[FAILED]** `You've hit Exa's free MCP rate limit.` Reported rather than worked around.
- WebSearch, query `"Towns Of" townsof.com local events platform founder RSVPs tickets zero fees` - **[FULL, method: WebSearch]** the source of the founder name, the reach figures and the magazine-to-app history.
- [Graham Colligan, LinkedIn](https://www.linkedin.com/in/grahamcolligan/) - **[PARTIAL, method: WebSearch result listing]** establishes the founder and title; the profile itself was not fetched.
- [apps.apple.com/us/app/towns-of-local-news-events/id6680196160](https://apps.apple.com/us/app/towns-of-local-news-events/id6680196160) - **[FAILED, method: `curl`]** HTTP 404. Recorded as a finding, not a gap.
- [townsof.com/apply](https://townsof.com/apply), [townsof.com/en/advertise](https://townsof.com/en/advertise), [townsof.com/old-home](https://townsof.com/old-home) - **[PARTIAL, method: `curl`]** all 200 and all byte-identical to `/discover`; see the SPA trap above. Their existence is NOT established by that 200.
