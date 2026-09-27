---
topic: events
type: market-research
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "1461, 2453, 2508"
original-query: "Research local AV/sound/DJ vendors near Ellsworth, Maine and produce a hit list for two open ZAOstock production gaps: (1) an in-person 'day DJ' role at the Franklin Street Parklet, Ellsworth - runs between/during sets, no virtual/programmed sets per the 15 Sep planning call, the previously lined-up person fell through - and (2) general backup/redundancy for outdoor sound, since the main PA is being brought by performing act OPEN X rather than a dedicated vendor. Motown Entertainment / Morgan Traxler is already found and staged as an outreach clip - find OTHER options so there is a real hit list, not one name."
tier: STANDARD
---

# 2488 - DJ + Sound/AV Vendor Hit List Near Ellsworth, Maine

> **Goal:** Find verifiable, genuinely local (or regularly-local-working) DJ and sound/AV vendors near Ellsworth, Maine to fill two open ZAOstock gaps - an in-person day DJ for Oct 3, and backup/redundancy PA since OPEN X brings the primary system - beyond the one name already staged (Motown Entertainment / Morgan Traxler).

## Updated 2026-09-25: nobody has recorded contacting anyone on this list yet, and the event is 8 days out

**No evidence found anywhere - the ZAOstock repo (`ZAODEVZ/ZAOstock`), the cowork
tracker, or this research library - that Greg Young, Grand Rental Station, High
Tech Events or DJ Bill Lyons were ever actually called.** This is stated as
UNKNOWN, not as "presumably not done": the outreach calls this doc recommended
are phone/email actions with no required digital trace, so their absence from
every searchable surface is consistent with either "nobody called" or "someone
called and never wrote it down anywhere checkable." What IS checkable and
confirmed: the tracker rows are unmoved and two of this doc's three own Next
Actions due-dates have now passed with no completion recorded -

- `research-doc:2488` (review the doc itself) - due **2026-09-18** - still `todo`
- `research-action:2488:7edc646789` (update `site.ts` once a DJ is booked) - due **2026-09-26** - still `todo`
- `research-action:2488:b9073cc8f2` (record the final decision in a follow-up doc) - due **2026-10-01** - still `todo`

**`src/content/site.ts` in `ZAODEVZ/ZAOstock` (re-read today) carries the exact
same "SUPERSEDED, 31 Aug... sourcing local DJs through Nextdoor" comment this
doc originally quoted** - untouched since before this doc was written, even
though the same file has had at least 10 other commits since (ticket tiers,
partner logos, a lineup-gap fix, a WaveWarZ-count correction) as recently as
**2026-09-25**, the day of this re-research. Whoever is actively editing this
file every few days has not touched the DJ line once. The after-party DJ at
Black Moon ("run by Steve") is a separate, already-settled role and is not what
this doc is about - the *daytime* DJ gap this doc was written to fill is still
described in source as "sourcing... through Nextdoor," the same informal channel
this doc's Key Decisions were meant to supplement with real vendors.

**No newer doc exists recording an outcome.** `zao-research-index` for "Greg
Young DJ", "day DJ booked Ellsworth", "Grand Rental Station" and `gh search
code` across both ZAO owner accounts for "Greg Young", "day DJ" and "backup PA"
surface only this doc itself, an old (2026-04-16, pre-dating this doc by five
months) planning template (`ZAO-STOCK/planning/run-of-show.md` in
`bettercallzaal/ZAOOS`, itself listing "Stilo World (or DJ TBD)" - stale, not
evidence of a current decision), and a May-2026 budget spreadsheet naming
"Maine Audio Visual or Greg Young" as a $500-1,100/day quote range from a much
earlier planning pass. Doc `events/2508-zaostock-last-mile-vendors`
(last-validated 2026-09-19, four days after this doc) closed out four *other*
open ZAOstock vendor gaps (porta-potties, banners, sweatshirts, wristbands)
using this doc's exact methodology, but does not touch the DJ/sound gap at all
- it is not evidence this gap was resolved, only that other gaps were worked in
parallel.

**Say this plainly: with 8 days left before Oct 3, this doc's hit list is
exactly as unconfirmed today as it was on 2026-09-15, and two of its own
due-dates have already passed unmet.** Whether that means the gap is quietly
handled through Nextdoor (per the site.ts comment) or genuinely still open is
itself unknown from any surface this doc can check.

**Correction to the "no evidence anywhere" claim above: the outreach task was found, in the vault, outside the three surfaces this doc searched.** `~/zao-vault/TODAY.md` shows tracker card `9974`, titled verbatim "DJ Greg Young, then Grand Rental Station," marked `[x]` done at 05:48 on what its own file dates as 2026-09-24 - one day before this re-research. Two clip files from the same day (`inbox/clips/clip-20260923-230804-tomorrow-0924.md`, `inbox/clips/clip-20260924-051112-six-sittings-0924.md`) carry the actual call script, and the second names this doc directly: *"Doc 2488 has both contact pages. If Greg is out, High Tech Events and DJ Bill Lyons are the alternates."* **This is evidence a call task was closed, not evidence of a booking outcome** - no file anywhere records whether Greg Young was reached, quoted, or hired, and the vault's own `handoffs/status/zaostock.md` (last touched 2026-09-25 16:59, several sections after this) still lists "Day DJ" as open with no update since 2026-09-19. Treat as: outreach was very likely attempted 2026-09-24, result UNKNOWN - a real narrowing of "no evidence anywhere," not a resolution.

**A separate, unresolved fact worth surfacing: Steve Peer, the after-party host, told Zaal by email (26 Aug, read by the vault lane 2026-09-19) that he already "has one [DJ] plus a backup."** `handoffs/status/zaostock.md` line 1235 quotes this verbatim and notes Zaal had not replied to that thread in 24 days as of 2026-09-19. This doc's scope was always the vendor hit-list, not Steve's offer, and nothing here resolves whether Steve's DJ is the daytime role this doc is about or the already-separate after-party slot at Black Moon - but a reader treating this doc as the only channel toward a booked DJ would be missing a live, unactioned lead that predates this doc's own 2026-09-15 research.

## Vendor re-verification (2026-09-25) - all four still live and unchanged

Re-fetched today rather than trusted from the original pass:

- **DJ Greg Young** (djgregyoung.com) - HTTP 200, re-fetched page text still
  reads: "hosting an event in Bar Harbor, Ellsworth, MDI, Northeast Harbor,
  Southwest Harbor, Bass Harbor, Seal Cove, Hulls Cove or any of the surrounding
  towns" - the exact service-area claim this doc ranked him #1 on, unchanged.
  [FULL, curl + strip]
- **Grand Rental Station** (grandrentalmaine.com) - HTTP 200, Speaker Sets page
  still lists the 500-amp and 250-amp powered sets this doc cited. [FULL, curl + strip]
- **High Tech Events** (hightechmaine.com/dj-service) - HTTP 200 on re-fetch,
  not re-scraped for content today (no claim in this doc depends on new text
  from it beyond "still exists"). [PARTIAL - liveness only, method: curl HEAD/GET, no re-extraction of service-area text]
- **DJ Bill Lyons** (djbilllyons.com) - HTTP 200 on re-fetch, not re-scraped for
  content today. [PARTIAL - liveness only, method: curl HEAD/GET]

No vendor dropped out, closed, or changed its service area in the ten days
since the original pass. The recommendation order (Greg Young first, Grand
Rental Station in parallel, the other two as fallback quotes) is unchanged
because nothing found today contradicts it - it is exactly as valid, and
exactly as untested by an actual phone call, as it was on 2026-09-15.

## Key Decisions

Contact details (phone/email) are intentionally not reproduced in this table - `research/` is public, and per `.claude/rules/pii-hygiene.md` third-party contact data is banned from public-repo commits without an individual allowlist entry. Every candidate's own contact page is linked in Sources below; a general vendor-contact-info location is `~/.zao/private/` (not this repo) if a private working list is wanted.

| Rank | Candidate | Fits | Why |
|---|---|---|---|
| 1 | **DJ Greg Young** (djgregyoung.com) | Day DJ | Explicitly lists Ellsworth, Bar Harbor, MDI, Northeast/Southwest/Bass Harbor as service towns, with named past gigs at Bar Harbor Regency and Harborside Hotel (Bar Harbor Club). Offers DJ+MC, "color-controlled uplighting," and standalone "audio system rentals" - so the same call can also price a backup PA. Booking contact is on the linked page's own contact form/email. |
| 2 | **Grand Rental Station** (grandrentalmaine.com, Trenton ME) | Backup/redundancy PA | Trenton, ME - roughly 10 minutes from the Franklin Street Parklet, the closest verified vendor of any kind in this doc. Dedicated "Speaker Sets" rental page lists a 500-amp or 250-amp powered set with built-in amp and controls; equipment-only, which matches "redundancy" better than a full production contract. Operating in Trenton since 1998, 13 Yelp reviews under "Party Equipment Rentals." |
| 3 | **High Tech Events** (hightechmaine.com, Glenburn ME) | Day DJ, secondary PA | Based near Bangor (~50-55 min from Ellsworth), but its own service-area list names "Bar Harbor, Ellsworth, Camden, Rockland, Boothbay Harbor, Belfast, Blue Hill" under "Coastal Maine" specifically, not as a generic "we travel anywhere" line. 25+ years in business, DJ+MC+lighting, "state-of-the-art sound systems." Good second-quote option if Greg Young is booked or priced out. |
| 4 | **DJ Bill Lyons** (djbilllyons.com, Bangor ME) | Day DJ (backup option) | DJing since 1980, WeddingWire bio states "Bar Harbor to Millinocket," 166 WeddingWire reviews averaging 5.0/5.0 on quality, professionalism, value and flexibility (two named, dated 5-star reviews read verbatim, one from early Jan 2026, one from early Nov 2025). Most experienced name found and a real community-review track record, but positioned squarely in the wedding-pricing market - call for a non-wedding community-festival rate before assuming he is in budget. |

**Recommendation (unchanged):** Call Greg Young first for the day-DJ role - he is the only candidate with named recurring MDI/Ellsworth-area gigs, not just a "we travel" line, and he can quote backup PA on the same call. Call Grand Rental Station in parallel, same day, purely for a backup speaker set - it needs no artist judgment, just gear, and at 10 minutes away it is the cheapest redundancy path if OPEN X's rig has a problem. Keep High Tech Events and DJ Bill Lyons as the two fallback quotes if Greg Young is unavailable for Oct 3 or prices the day DJ role like a wedding. **This recommendation has now gone 10 days with no recorded action on it and 8 days remain before the event - it needs a phone call this week, not another research pass.**

## Ruled Out (verified, not a fit)

| Candidate | Verified as | Why excluded |
|---|---|---|
| Mainely Audio (mainelyaudio.com, Ellsworth - genuinely in-town) | Car-audio and remote-start install shop, run as a father/son business since 1999 | Its own Facebook page (post dated 2026-09-14, one day before this research) shows car-stereo and remote-start installs, not event AV or PA work. Hyper-local address is a false positive - this is not an event vendor. |
| Acadia Recording Company (acadiarecording.com) | Recording studio in **Portland**, ME | The "Acadia" name and a stray search snippet suggested Downeast Maine; the studio's own About and home pages give a Portland address - about 3 hours from Ellsworth - and the service list is band recording, mixing, VO/podcast, not live outdoor sound. |
| Audio Systems Maine (audiosystemsmaine.com) | Sound install/rental company in Auburn, ME | Real business (installing since 1927 per their own site), but Auburn is ~3 hours from Ellsworth - too far to serve as day-of redundancy. |
| GigSalad "Sound Technicians in Maine" | Directory | Its own Maine city list only offers Auburn, Augusta, Biddeford, Brunswick, Lewiston, Portland, Saco, Sanford, Scarborough, South Portland, Westbrook - zero Hancock County or Downeast listings. Negative signal, not a lead. |
| "Travelin Sounds" (appears on Yelp's Bar Harbor DJ list) | Unverifiable | Appears only inside aggregator listings (Yelp, The Bash); no independent website, phone, or booking page could be found to confirm real contact info. Not included per the no-invented-contact-info rule - worth a direct Yelp message only if the ranked four above fall through. |
| Wallace Events | Tents/event-rental vendor already known to the ZAOstock production lane | Doc `_archive/224-zao-stock-multi-year-vision` already frames the sound vendor search as "not Wallace Events" for a prior planning cycle; not re-surfaced here as a sound/DJ option. |

Not re-verified today (no new evidence to add or subtract; ruled-out reasoning does not age the way a live recommendation does).

## Codebase Cross-Check

`src/content/site.ts` in `ZAODEVZ/ZAOstock` (re-read 2026-09-25, unchanged since original research) still carries the exact status this doc researches against:

> "SUPERSEDED, 31 Aug: 'there is no changeover DJ, the MC and partner spots cover changeovers' (20:0x, 27 Aug) is NO LONGER TRUE. Zaal reopened the daytime DJ on the 31 Aug DCoop call - 'if we're gonna have one' - and is sourcing local DJs through Nextdoor. Nothing on this page asserts the absence of a DJ, so no public copy changes here; the note is corrected so the next reader does not act on it. Doc 2453."

So the public site's own source comment still documents the DJ role as open and being sourced informally (Nextdoor) - ten days later, this doc's verified vendor list is still the only alternative channel on record.

## Why This Doc Exists (not a re-research of 1461)

Doc `events/1461-zaostock-sound-production-brief` (unvalidated since its creation, no vendors actually named - only generic search terms like "PA rental Bangor Maine") covered sound equipment sizing and a Fisher-grant budget placeholder. It predates the current situation: as of the original research (2026-09-15), the main PA is confirmed coming from performing act OPEN X, not a rented vendor, which changes the ask from "book the primary PA" to "find backup/redundancy PA" - a different, narrower question 1461 never answered with real names.

Doc `events/2453-dcoop-zaal-av-rider-aug31` (2026-08-31 call) is the most recent internal record on this specific question: it reopened the daytime DJ question ("REVERSES a written decision"), confirmed Zaal was sourcing DJs via Nextdoor, and left the primary PA "still unspecified." This doc picked up from there with actual verified vendors instead of a search-term list.

## Methodology Note (adapted STANDARD tier)

This is a local-business search, not a technical/community topic, so Step 4's MCP tool order (context7, exa search) and Steps 2.5/2.55 (cross-repo GitHub search, star-count snapshots) do not apply - there is no repo or package to search. Community-source coverage (Hard Requirement 7) was attempted via `site:reddit.com` searches for r/Maine and Bar Harbor-area DJ/sound recommendations; both returned zero relevant threads, a genuine negative signal for a small-town, non-technical topic. In its place, this doc uses the closest available "outside-the-vendor's-own-marketing" verification: dated, named customer reviews (WeddingWire, 166 reviews for DJ Bill Lyons) and a third-party business directory (BBB/Facebook/Chamber of Commerce, for Mainely Audio's actual business type) rather than vendor self-description alone.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Contact DJ Greg Young (via djgregyoung.com, linked in Sources) to check Oct 3 availability and get a day-DJ + backup-PA quote - **overdue since 2026-09-17, no record it happened; 8 days left before the event** | @Zaal | Outreach call | 2026-09-27 |
| Contact Grand Rental Station (via grandrentalmaine.com/contact, linked in Sources) for a backup speaker-set rental quote and confirm Oct 3 weekend availability - **overdue since 2026-09-17, no record it happened** | @Zaal | Outreach call | 2026-09-27 |
| If Greg Young is unavailable, request quotes from High Tech Events and DJ Bill Lyons (both linked in Sources) for the day-DJ role - **overdue since 2026-09-22, no record it happened** | @Zaal | Outreach call | 2026-09-29 |
| Update `src/content/site.ts` DJ-status comment and, once a DJ is booked, the public copy with the named vendor - **due 2026-09-26 in the tracker, still `todo`** | @Zaal | PR | 2026-09-29 |
| Record the final DJ + backup-PA decision in a follow-up doc superseding this one's open questions - **due 2026-10-01 in the tracker, still `todo`; with 8 days to the event this needs to happen before, not after, Oct 3** | @Zaal | Doc | 2026-09-30 |

## Sources

- [DJ Greg Young - DJs near Bar Harbor Maine](https://djgregyoung.com/djs-near-bar-harbor-maine/) - [FULL, re-fetched 2026-09-25 via curl + HTML strip; HTTP 200, service-area claim reconfirmed verbatim]
- [DJ Greg Young - Maine Sound System Rentals](https://djgregyoung.com/maine-sound-system-rentals/) - [PARTIAL - confirmed via WebSearch snippet only on 2026-09-15, not re-fetched today; not independently escalated since the DJ page above already gives verified contact info for the same business]
- [High Tech Events - Professional DJ Services in Maine](https://www.hightechmaine.com/dj-service) - [PARTIAL on re-check - HTTP 200 confirmed live 2026-09-25 (curl), content not re-extracted today; original 2026-09-15 fetch was FULL via exa web_fetch raw markdown]
- [Grand Rental Station - homepage](https://www.grandrentalmaine.com/) - [FULL, re-fetched 2026-09-25 via curl, HTTP 200]
- [Grand Rental Station - Speaker Sets](https://www.grandrentalmaine.com/audio-visual-1/speaker-sets) - [FULL, re-fetched 2026-09-25 via curl + strip; 500-amp/250-amp powered sets reconfirmed]
- [Grand Rental Station - Contact](https://www.grandrentalmaine.com/contact) - [FULL, fetched 2026-09-15 via exa web_fetch raw markdown; not re-fetched today, contact-page structure does not need re-verification]
- [DJ Bill Lyons - homepage](https://djbilllyons.com/) - [PARTIAL on re-check - HTTP 200 confirmed live 2026-09-25 (curl), content not re-extracted today; original 2026-09-15 fetch was FULL via exa web_fetch raw markdown]
- [DJ Bill Lyons - Reviews (WeddingWire, 166 reviews)](https://www.weddingwire.com/reviews/dj-bill-lyons-bangor/0a6cb6f2ee51341c.html) - [FULL, fetched 2026-09-15 via exa web_fetch raw markdown; used as the community-source stand-in per the Methodology Note above; not re-fetched today]
- [Mainely Audio - Facebook page](https://www.facebook.com/mainelyaudio/) - [FULL, fetched 2026-09-15 via exa web_fetch raw markdown; dated post 2026-09-14 confirms car-audio/install business, used to rule the candidate out]
- [Acadia Recording Company - About](https://www.acadiarecording.com/about) - [FULL, fetched 2026-09-15 via exa web_fetch raw markdown]
- [Acadia Recording Company - homepage](https://www.acadiarecording.com/) - [FULL, fetched 2026-09-15 via exa web_fetch raw markdown; confirms Portland, ME address, used to rule the candidate out]
- [GigSalad - Sound Technicians for Hire in Maine](https://www.gigsalad.com/Event-Services/Sound-Technician/ME) - [FULL, fetched 2026-09-15 via exa web_fetch raw markdown; city list confirms no Hancock County coverage, used as a negative signal]
- [Audio Systems Maine](https://www.audiosystemsmaine.com/) - [PARTIAL - WebFetch triage only 2026-09-15 (Auburn, ME address, install-since-1927 claim, live-sound/emcee services); not escalated to raw fetch since distance alone rules it out for backup/redundancy]
- `ZAODEVZ/ZAOstock` `src/content/site.ts`, re-read 2026-09-25 via `gh api repos/ZAODEVZ/ZAOstock/contents/...` - [FULL] - DJ-status comment unchanged since original research; file has ~10 unrelated commits since, most recent 2026-09-25.
- `~/bin/zao-tracker search "ellsworth"` / `"dj"` --status todo, run 2026-09-25 - [FULL, executed] - all three tracker rows tied to this doc still `todo`, two past their own due date.
- `zao-research-index "ellsworth dj sound"`, `"Greg Young DJ"`, `"day DJ booked ellsworth"`, `"Grand Rental Station"`, run 2026-09-25 - [FULL, executed] - no newer doc records an outcome.
- `gh search code "day DJ"` / `"Greg Young"` / `"backup PA"` across `bettercallzaal` + `ZAODEVZ`, run 2026-09-25 - [FULL, executed] - only this doc, a stale pre-dating planning template, and an old budget line found; no post-2026-09-15 evidence of outreach or booking.
- `~/zao-vault/TODAY.md` and `~/zao-vault/inbox/clips/clip-20260923-230804-tomorrow-0924.md`, `clip-20260924-051112-six-sittings-0924.md`, `tclip-2026-09-24.md`, read 2026-09-25 - [FULL, local files] - tracker card `9974` ("DJ Greg Young, then Grand Rental Station") marked done 05:48 on 2026-09-24, citing this doc by number; task closure, not a booking outcome.
- `~/zao-vault/handoffs/status/zaostock.md`, read 2026-09-25 - [FULL, local file] - line 1235 quotes Steve Peer's 26 Aug email ("has one plus a backup" DJ); the 2026-09-19 status entry still lists "Day DJ" as open; no entry after 2026-09-19 mentions the DJ role.
- `~/zao-vault/projects/zaostock-14-day-list-2026-09-19.md`, read 2026-09-25 - [FULL, local file] - "Day DJ" row marked "unfilled" as of its 2026-09-19 stamp, sourced to `handoffs/status/zaostock.md`.

## Also See

- [Doc 1461](../1461-zaostock-sound-production-brief/) - the original (pre-vendor-names) sound production brief; superseded in relevance, not formally, by this doc's specific backup-PA and day-DJ answers
- [Doc 2453](../2453-dcoop-zaal-av-rider-aug31/) - the 2026-08-31 call that reopened the daytime DJ question and left the primary PA "still unspecified" (since resolved to OPEN X per this doc's brief)
- [Doc 2508](../2508-zaostock-last-mile-vendors/) - same methodology (genuinely-local vendors, PII kept out of body text) applied to four other ZAOstock vendor gaps four days later; does not cover DJ/sound
