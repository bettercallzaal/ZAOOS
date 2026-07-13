---
topic: events
type: decision
status: research-complete
last-validated: 2026-07-13
related-docs: "945, 954, 700"
original-query: "Copy /zao-research all of this and lets prep for how we can get involved in devcon - context: strategy-call brief on ZAO's Artisan/ZABAL Games/fund/DWeb initiatives, initiative #7 'DevCon America': a crowdfunding/organizing plan to get US builders to DevCon, since there is lots of India-focused support but little energy outside India."
tier: STANDARD
---

# 1063 - DevCon America: a US-builder route into Devcon 8

> **CORRECTION (2026-07-13, same day, post-merge):** This doc's original Key Decision #1 claimed the Ecosystem Support Program (ESP) had no geographic restriction. That was checked against the general devcon.org/en/ecosystem-program/ overview page, not the actual application form. Fetching the real application page directly - esp.ethereum.foundation/applicants/rfp/rtd8_india - shows it explicitly requires **"Based in India or targeting Indian audiences."** Both currently-open Devcon 8 RFPs on esp.ethereum.foundation/applicants/rfp are India-specific (the Ecosystem Program and the University Program). There is no ESP community-event grant open to a pure-US event right now. The tables below are corrected in place; the original wrong reasoning is kept visible in the "What was wrong" section at the bottom instead of being deleted.

> **Goal:** Find a real mechanism for a US-based ZAO cohort - separate from Zaal's own India trip in Doc 945 - to get to Devcon 8, closing the gap between heavy India-side energy (Doc 945/954) and near-zero US-side organizing energy.

## Key Decisions (corrected)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | DO NOT apply to the ESP rtd8_india RFP for a US-hosted event | Confirmed by fetching esp.ethereum.foundation/applicants/rfp/rtd8_india directly: "Based in India or targeting Indian audiences" is a stated hard requirement. A US-only meetup does not qualify. |
| 2 | INSTEAD, pool individual ticket levers across US-based ZAO builders: Devcon Scholars, Builder Discount, Creative Crew | These three are individual-applicant programs already used successfully for Zaal's own trip (Doc 945) with no stated geographic gate - the lever is per-person credentials, not per-country. |
| 3 | RUN the Build Camp x ZABAL Games roundtable anyway, as content and recruiting, not as a grant-qualifying event | It still surfaces who in the US-based ZAO network would actually go to Devcon 8 if travel/ticket were covered - that answer is needed before any crowdfund can be sized. |
| 4 | DECIDE shared vs. individual crowdfund structure once the builder list exists | Doc 945 used an individual Seed Club campaign for Zaal. A pooled US-builder crowdfund is a different shape (multiple beneficiaries, one campaign) and needs its own structure decision, not an assumption. |
| 5 | IF a standing US-cohort presence is wanted beyond individual tickets, file a DIP on forum.devcon.org | DIPs are global and text-first (precedent: the Music Stage via Fellowship of Ethereum Musicians, Doc 700) - this route is NOT geography-gated, unlike the ESP rtd8_india RFP. |

## Findings: the four Devcon entry mechanisms, compared (corrected)

| Mechanism | Geographic framing | What it gets you | Deadline (verified) | Effort to qualify |
|---|---|---|---|---|
| ESP rtd8_india (Ecosystem Program + University Program) | Explicitly India-based or India-targeting only (verified on the actual application page) | Cash grant (up to $300 stated on that page) + up to 5 free/discounted Devcon tickets | August 14, 2026 (esp.ethereum.foundation/applicants/rfp/rtd8_india) | N/A for a US-only event - does not qualify |
| Devcon Scholars / Builder Discount / Creative Crew | Individual-applicant, no stated geographic gate | Flight + room/board (Scholars), $349 ticket (Builder Discount), or a content-creator ticket (Creative Crew) | Varies; Scholars est. Aug 2026 per Doc 945 | Low-medium, per person |
| Community Hub (RFP-13) | Global submission process, physically hosted in Mumbai | A staffed 4-day educational space inside Devcon 8 itself | Aug 12 submission, selections Aug 26 (Doc 954) | High - 2-3 co-organizers, full-conference staffing |
| DIP / forum.devcon.org | Global, text-first proposal | Community programming slot (precedent: music stage via Fellowship of Ethereum Musicians, Doc 700) | Rolling, community-discussed | Low-medium - a forum post plus follow-through |

**The corrected gap:** there is no India-style community-event grant available to a US cohort. What IS available, globally, is the same set of individual ticket levers Doc 945 already used for one person - Scholars, Builder Discount, Creative Crew - applied across multiple US-based builders, plus a pooled crowdfund. That is a simpler plan than the original ESP-grant idea, and it matches the original ask ("a crowdfunding/organizing plan to get US builders to DevCon") more literally.

## What was wrong in the original version of this doc

The original Key Decision #1 read the general devcon.org/en/ecosystem-program/ overview page and found no geographic-restriction language there, then concluded ESP itself was open. That page is a marketing overview, not the application. The actual gating language only appears on the specific RFP application page (esp.ethereum.foundation/applicants/rfp/rtd8_india), which was not fetched in the original research pass. Lesson: for any grant/eligibility claim, fetch the actual application page, not the program's marketing page - they can disagree.

## What the roundtable event still looks like (still real, reframed as content not a grant application)

- A single virtual roundtable pairing Ethereum Build Camp graduates (Doc 945, demo day July 11, 228 registered camp-wide) with ZABAL Games Builder-track submitters (build-a-thon runs through end of August) - "shipping onchain, weeks out from Devcon."
- Recorded and distributed the way ZAO already distributes: a BCZ YapZ episode, a Farcaster/X recap, a newsletter mention (400+ editions per Doc 945's proof numbers).
- Its purpose now is recruiting + content, not qualifying for a grant - the CROPS framing is no longer load-bearing since no ESP application depends on it.

## Also See

- [Doc 945](../945-devcon8-mumbai-buildcamp-sponsorship/) - Zaal's own India trip funding stack (Builder Discount, Scholars, crowdfund, Build Camp)
- [Doc 954](../954-devcon-history-community-mumbai-guide/) - Devcon lineage, community entry points, first flagged the Ecosystem Program R2 + Community Hub levers
- [Doc 700](../700-devcon-mumbai-music-stage-coprogramming/) - DIP/forum precedent via the Devcon Music Stage
- Codebase grounding: `/Users/zaalpanthaki/Documents/zdevcon/README.md`, `/Users/zaalpanthaki/Documents/zdevcon/CONTEXT.md`, `/Users/zaalpanthaki/Documents/zdevcon/partners-tracker.md` - the India trip is already fully staffed as a campaign; this doc is the missing US-side counterpart

## Open question 1 - named US-based builder roster (checked 2026-07-13, negative result)

Searched the ZAOOS research library (`research/community/`, `research/events/`) for an existing roster of US-based ZAO/WaveWarZ/ZABAL Games builders with location data, and grepped `/Users/zaalpanthaki/Documents/zdevcon/partners-tracker.md`. Result: **no such roster exists.** What does exist:

- `zdevcon/CONTEXT.md`'s "Event-circuit people" section lists US-based names (Telamon Ardavanis, Aaron Rafferty, Bayo, Tom Fellenz) - but these are event/business/festival contacts, not developers who'd be applying for a Builder Discount or Scholars ticket.
- ZABAL Games has an active Builder track (build-a-thon through end of August) with real submitters, but no research doc or tracker file in this library records submitters' locations.
- No doc combines "is a builder" AND "is US-based" AND "would want to go to Devcon 8."

This is a genuine gap, not a research failure to push past - the actual names have to come from Zaal or from the ZABAL Games submission data directly (Empire Builder / Clanker / POIDH tracker), which this research pass does not have access to. Fabricating names here would violate the no-invented-names constraint on this work.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Supply (or point to the live tracker for) actual named US-based builders who'd attend Devcon 8 if travel were covered - no roster exists yet in this library | @Zaal | Todo | 2026-07-20 |
| Check Scholars / Builder Discount / Creative Crew individual eligibility per named person, once the list exists | @Zaal | Todo | 2026-07-27 |
| Decide shared vs. individual crowdfund structure | @Zaal | Decision | 2026-08-01 |
| Run the Build Camp x ZABAL Games roundtable as content, independent of any grant | @Zaal + Claude | Deliverable | 2026-08-10 |
| If a standing US-cohort presence is wanted, draft a DIP post for forum.devcon.org | @Zaal + Claude | Doc | 2026-08-01 |

## Sources

- [Devcon 8 India - Road to Devcon](https://devcon.org/en/road-to-devcon/) [FULL] - confirms India-only framing, monthly waves through Nov 2026
- [Devcon 8 India Ecosystem Program](https://devcon.org/en/ecosystem-program/) [FULL] - overview page; grant/ticket figures, Aug 14 2026 deadline (see correction: this page omits the geographic-gate language)
- [ESP rtd8_india application page](https://esp.ethereum.foundation/applicants/rfp/rtd8_india) [FULL] - the actual gating page, fetched 2026-07-13, confirms "Based in India or targeting Indian audiences"
- [ESP open RFPs list](https://esp.ethereum.foundation/applicants/rfp) [FULL] - confirms both currently-open Devcon 8 RFPs are India-specific
- [ESP applicants overview](https://esp.ethereum.foundation/applicants) [FULL] - general project-grant process, no stated geographic gate, distinct from the rtd8_india RFP
- [Devcon Forum](https://forum.devcon.org/) [FULL] - DIP submission venue, confirmed live via web search 2026-07-13
- [Doc 945](../945-devcon8-mumbai-buildcamp-sponsorship/README.md) [FULL] - internal, funding stack + proof numbers reused here
- [Doc 954](../954-devcon-history-community-mumbai-guide/README.md) [FULL] - internal, first identified the Ecosystem Program + Community Hub levers
- [Doc 700](../700-devcon-mumbai-music-stage-coprogramming/README.md) [FULL] - internal, DIP/Fellowship of Ethereum Musicians precedent
- Web search: "esp.ethereum.foundation RFP Devcon 8 global community event grant non-India" [FULL] - surfaced the BuidlGuidl global University Tour as a separate global lever, not yet verified FULL
