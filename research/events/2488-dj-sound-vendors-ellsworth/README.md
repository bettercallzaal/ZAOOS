---
topic: events
type: market-research
status: research-complete
last-validated: 2026-09-15
superseded-by:
related-docs: "1461, 2453"
original-query: "Research local AV/sound/DJ vendors near Ellsworth, Maine and produce a hit list for two open ZAOstock production gaps: (1) an in-person 'day DJ' role at the Franklin Street Parklet, Ellsworth - runs between/during sets, no virtual/programmed sets per the 15 Sep planning call, the previously lined-up person fell through - and (2) general backup/redundancy for outdoor sound, since the main PA is being brought by performing act OPEN X rather than a dedicated vendor. Motown Entertainment / Morgan Traxler is already found and staged as an outreach clip - find OTHER options so there is a real hit list, not one name."
tier: STANDARD
---

# 2488 — DJ + Sound/AV Vendor Hit List Near Ellsworth, Maine

> **Goal:** Find verifiable, genuinely local (or regularly-local-working) DJ and sound/AV vendors near Ellsworth, Maine to fill two open ZAOstock gaps - an in-person day DJ for Oct 3, and backup/redundancy PA since OPEN X brings the primary system - beyond the one name already staged (Motown Entertainment / Morgan Traxler).

## Key Decisions

Contact details (phone/email) are intentionally not reproduced in this table - `research/` is public, and per `.claude/rules/pii-hygiene.md` third-party contact data is banned from public-repo commits without an individual allowlist entry. Every candidate's own contact page is linked in Sources below; a general vendor-contact-info location is `~/.zao/private/` (not this repo) if a private working list is wanted.

| Rank | Candidate | Fits | Why |
|---|---|---|---|
| 1 | **DJ Greg Young** (djgregyoung.com) | Day DJ | Explicitly lists Ellsworth, Bar Harbor, MDI, Northeast/Southwest/Bass Harbor as service towns, with named past gigs at Bar Harbor Regency and Harborside Hotel (Bar Harbor Club). Offers DJ+MC, "color-controlled uplighting," and standalone "audio system rentals" - so the same call can also price a backup PA. Booking contact is on the linked page's own contact form/email. |
| 2 | **Grand Rental Station** (grandrentalmaine.com, Trenton ME) | Backup/redundancy PA | Trenton, ME - roughly 10 minutes from the Franklin Street Parklet, the closest verified vendor of any kind in this doc. Dedicated "Speaker Sets" rental page lists a 500-amp or 250-amp powered set with built-in amp and controls; equipment-only, which matches "redundancy" better than a full production contract. Operating in Trenton since 1998, 13 Yelp reviews under "Party Equipment Rentals." |
| 3 | **High Tech Events** (hightechmaine.com, Glenburn ME) | Day DJ, secondary PA | Based near Bangor (~50-55 min from Ellsworth), but its own service-area list names "Bar Harbor, Ellsworth, Camden, Rockland, Boothbay Harbor, Belfast, Blue Hill" under "Coastal Maine" specifically, not as a generic "we travel anywhere" line. 25+ years in business, DJ+MC+lighting, "state-of-the-art sound systems." Good second-quote option if Greg Young is booked or priced out. |
| 4 | **DJ Bill Lyons** (djbilllyons.com, Bangor ME) | Day DJ (backup option) | DJing since 1980, WeddingWire bio states "Bar Harbor to Millinocket," 166 WeddingWire reviews averaging 5.0/5.0 on quality, professionalism, value and flexibility (two named, dated 5-star reviews read verbatim, one from early Jan 2026, one from early Nov 2025). Most experienced name found and a real community-review track record, but positioned squarely in the wedding-pricing market - call for a non-wedding community-festival rate before assuming he is in budget. |

**Recommendation:** Call Greg Young first for the day-DJ role - he is the only candidate with named recurring MDI/Ellsworth-area gigs, not just a "we travel" line, and he can quote backup PA on the same call. Call Grand Rental Station in parallel, same day, purely for a backup speaker set - it needs no artist judgment, just gear, and at 10 minutes away it is the cheapest redundancy path if OPEN X's rig has a problem. Keep High Tech Events and DJ Bill Lyons as the two fallback quotes if Greg Young is unavailable for Oct 3 or prices the day DJ role like a wedding.

## Ruled Out (verified, not a fit)

| Candidate | Verified as | Why excluded |
|---|---|---|
| Mainely Audio (mainelyaudio.com, Ellsworth - genuinely in-town) | Car-audio and remote-start install shop, run as a father/son business since 1999 | Its own Facebook page (post dated 2026-09-14, one day before this research) shows car-stereo and remote-start installs, not event AV or PA work. Hyper-local address is a false positive - this is not an event vendor. |
| Acadia Recording Company (acadiarecording.com) | Recording studio in **Portland**, ME | The "Acadia" name and a stray search snippet suggested Downeast Maine; the studio's own About and home pages give a Portland address - about 3 hours from Ellsworth - and the service list is band recording, mixing, VO/podcast, not live outdoor sound. |
| Audio Systems Maine (audiosystemsmaine.com) | Sound install/rental company in Auburn, ME | Real business (installing since 1927 per their own site), but Auburn is ~3 hours from Ellsworth - too far to serve as day-of redundancy. |
| GigSalad "Sound Technicians in Maine" | Directory | Its own Maine city list only offers Auburn, Augusta, Biddeford, Brunswick, Lewiston, Portland, Saco, Sanford, Scarborough, South Portland, Westbrook - zero Hancock County or Downeast listings. Negative signal, not a lead. |
| "Travelin Sounds" (appears on Yelp's Bar Harbor DJ list) | Unverifiable | Appears only inside aggregator listings (Yelp, The Bash); no independent website, phone, or booking page could be found to confirm real contact info. Not included per the no-invented-contact-info rule - worth a direct Yelp message only if the ranked four above fall through. |
| Wallace Events | Tents/event-rental vendor already known to the ZAOstock production lane | Doc `_archive/224-zao-stock-multi-year-vision` already frames the sound vendor search as "not Wallace Events" for a prior planning cycle; not re-surfaced here as a sound/DJ option. |

## Codebase Cross-Check

`src/content/site.ts:9-18` (this repo, ZAOstock) carries the exact status this doc researches against:

> "SUPERSEDED, 31 Aug: 'there is no changeover DJ, the MC and partner spots cover changeovers' (20:0x, 27 Aug) is NO LONGER TRUE. Zaal reopened the daytime DJ on the 31 Aug DCoop call - 'if we're gonna have one' - and is sourcing local DJs through Nextdoor. Nothing on this page asserts the absence of a DJ, so no public copy changes here; the note is corrected so the next reader does not act on it. Doc 2453."

So the public site's own source comment already documents the DJ role as open and being sourced informally (Nextdoor) - this doc adds a verified vendor list to that channel rather than relying on Nextdoor alone.

## Why This Doc Exists Now (not a re-research of 1461)

Doc `events/1461-zaostock-sound-production-brief` (unvalidated since its creation, no vendors actually named - only generic search terms like "PA rental Bangor Maine") covered sound equipment sizing and a Fisher-grant budget placeholder. It predates the current situation: as of this research (2026-09-15), the main PA is confirmed coming from performing act OPEN X, not a rented vendor, which changes the ask from "book the primary PA" to "find backup/redundancy PA" - a different, narrower question 1461 never answered with real names.

Doc `events/2453-dcoop-zaal-av-rider-aug31` (2026-08-31 call) is the most recent internal record: it reopened the daytime DJ question ("REVERSES a written decision"), confirmed Zaal was sourcing DJs via Nextdoor, and left the primary PA "still unspecified." This doc picks up from there with actual verified vendors instead of a search-term list.

## Methodology Note (adapted STANDARD tier)

This is a local-business search, not a technical/community topic, so Step 4's MCP tool order (context7, exa search) and Steps 2.5/2.55 (cross-repo GitHub search, star-count snapshots) do not apply - there is no repo or package to search. Community-source coverage (Hard Requirement 7) was attempted via `site:reddit.com` searches for r/Maine and Bar Harbor-area DJ/sound recommendations; both returned zero relevant threads, a genuine negative signal for a small-town, non-technical topic. In its place, this doc uses the closest available "outside-the-vendor's-own-marketing" verification: dated, named customer reviews (WeddingWire, 166 reviews for DJ Bill Lyons) and a third-party business directory (BBB/Facebook/Chamber of Commerce, for Mainely Audio's actual business type) rather than vendor self-description alone.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Contact DJ Greg Young (via djgregyoung.com, linked in Sources) to check Oct 3 availability and get a day-DJ + backup-PA quote | @Zaal | Outreach call | 2026-09-17 |
| Contact Grand Rental Station (via grandrentalmaine.com/contact, linked in Sources) for a backup speaker-set rental quote and confirm Oct 3 weekend availability | @Zaal | Outreach call | 2026-09-17 |
| If Greg Young is unavailable, request quotes from High Tech Events and DJ Bill Lyons (both linked in Sources) for the day-DJ role | @Zaal | Outreach call | 2026-09-22 |
| Update `src/content/site.ts` DJ-status comment and, once a DJ is booked, the public copy with the named vendor | @Zaal | PR | 2026-09-26 |
| Record the final DJ + backup-PA decision in a follow-up doc superseding this one's open questions | @Zaal | Doc | 2026-10-01 |

## Sources

- [DJ Greg Young - DJs near Bar Harbor Maine](https://djgregyoung.com/djs-near-bar-harbor-maine/) - [FULL, fetched via exa web_fetch raw markdown]
- [DJ Greg Young - Maine Sound System Rentals](https://djgregyoung.com/maine-sound-system-rentals/) - [PARTIAL - confirmed via WebSearch snippet only (2x powered PA speakers, stands, mixer, wireless mic, weatherproof option); not independently re-fetched raw since the DJ page above already gives verified contact info for the same business]
- [High Tech Events - Professional DJ Services in Maine](https://www.hightechmaine.com/dj-service) - [FULL, fetched via exa web_fetch raw markdown]
- [Grand Rental Station - homepage](https://www.grandrentalmaine.com/) - [FULL, fetched via exa web_fetch raw markdown]
- [Grand Rental Station - Speaker Sets](https://www.grandrentalmaine.com/audio-visual-1/speaker-sets) - [FULL, fetched via exa web_fetch raw markdown]
- [Grand Rental Station - Contact](https://www.grandrentalmaine.com/contact) - [FULL, fetched via exa web_fetch raw markdown]
- [DJ Bill Lyons - homepage](https://djbilllyons.com/) - [FULL, fetched via exa web_fetch raw markdown]
- [DJ Bill Lyons - Reviews (WeddingWire, 166 reviews)](https://www.weddingwire.com/reviews/dj-bill-lyons-bangor/0a6cb6f2ee51341c.html) - [FULL, fetched via exa web_fetch raw markdown; used as the community-source stand-in per the Methodology Note above]
- [Mainely Audio - Facebook page](https://www.facebook.com/mainelyaudio/) - [FULL, fetched via exa web_fetch raw markdown; dated post 2026-09-14 confirms car-audio/install business, used to rule the candidate out]
- [Acadia Recording Company - About](https://www.acadiarecording.com/about) - [FULL, fetched via exa web_fetch raw markdown]
- [Acadia Recording Company - homepage](https://www.acadiarecording.com/) - [FULL, fetched via exa web_fetch raw markdown; confirms Portland, ME address, used to rule the candidate out]
- [GigSalad - Sound Technicians for Hire in Maine](https://www.gigsalad.com/Event-Services/Sound-Technician/ME) - [FULL, fetched via exa web_fetch raw markdown; city list confirms no Hancock County coverage, used as a negative signal]
- [Audio Systems Maine](https://www.audiosystemsmaine.com/) - [PARTIAL - WebFetch triage only (Auburn, ME address, install-since-1927 claim, live-sound/emcee services); not escalated to raw fetch since distance alone rules it out for backup/redundancy]

## Also See

- [Doc 1461](../1461-zaostock-sound-production-brief/) - the original (pre-vendor-names) sound production brief; superseded in relevance, not formally, by this doc's specific backup-PA and day-DJ answers
- [Doc 2453](../2453-dcoop-zaal-av-rider-aug31/) - the 2026-08-31 call that reopened the daytime DJ question and left the primary PA "still unspecified" (since resolved to OPEN X per this doc's brief)
