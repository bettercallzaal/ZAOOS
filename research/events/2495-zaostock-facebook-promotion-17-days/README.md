---
topic: events
type: market-research
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: events/986-ellsworth-local-intel-zaostock, 2279, 919, 846, 2134
original-query: "Facebook for ZAOstock promotion, next 17 days (event Saturday 3 October 2026): (a) actual Ellsworth/Hancock County/Maine music-events Facebook groups by name with member counts and posting rules, (b) Facebook Events for a free festival - does a peer event already have one, (c) Meta Business Suite cross-posting from the ZAO Festivals page to Instagram, (d) whether a small boost is worth it, (e) what Ellsworth venues and the Chamber are doing on Facebook this month"
tier: STANDARD
---

# 2495 - Facebook for ZAOstock: groups, the existing event, cross-posting, and the local rhythm

> **Goal:** Ground the zao-socials lane's LinkedIn/Facebook push in what
> actually exists on Facebook - real groups, a real Meta feature, and the real
> local posting rhythm - rather than a generic "post to Facebook groups"
> instruction. **The original query was framed "17 days out" on 2026-09-16.
> Today is 2026-09-25 - the event (Saturday 3 October 2026, Franklin St
> Parklet, Ellsworth ME) is 8 days out.** The `original-query` field above is
> left verbatim per this library's rule; the "17 days" in it is a snapshot of
> the request as asked, not a current fact.

## Updated 2026-09-25 - what changed since the 2026-09-16 version

**One central claim in the original doc was found wrong: item 7 below.** The
Maine Craft Weekend "ZAOstock listing" the 09-16 doc called live in fact
shows no ZAOstock content today, corroborated by both a vault correction and
a fresh fetch. The Facebook login wall that blocked (a) and most of (e) is
still up, measured again today by the same method plus one new one (below).
The rest is real movement in the vault since 09-16, none of it visible from
outside Facebook:

1. **A dedicated ZAOstock Facebook Page is now being built, not just an
   event-share.** `handoffs/status/zaostock.md` (top-of-file, 2026-09-25
   14:46 EDT): "Facebook: a ZAOstock page under the ZAO Festivals account,
   every organiser added as admin, IMan among them for cross-posting from X.
   Zaal sets it up (call, 21 Sept)" - status **"no answer yet on our side"**
   as of today, i.e. still not done. This doc's original Recommendation 1
   ("share the existing event, don't create a new one") was written before
   this plan existed; it does not contradict sharing the event, but a Page
   build is a bigger move than this doc scoped.
2. **The ad-boost question (Recommendation/Next Action (d)) is no longer "no
   figure exists anywhere" - it is "authorized in principle, blocked on
   access, still no figure."** `handoffs/status/finance.md` line 851
   (2026-09-20 15:49 EDT): "the paid social test decided on 17 Sept has not
   run because nobody holds payment access on the ad account (card 9817, due
   Monday)." `handoffs/status/zaostock.md` line 75 (top-of-file, still open
   2026-09-25): "Facebook: who has admin and payment access on the
   zaofestivals page and ad account, and what adding a second admin takes.
   Zaal's ask, 19 Sept, tracker card 9817... no answer yet on our side." **Card
   9817 has been open nine days and is still unresolved.** No dollar figure
   for a boost exists anywhere in the vault today, same as 09-16 - the gap
   moved from "nobody asked" to "asked, blocked on ad-account access."
3. **Instagram `@zaofestivals` is now confirmed fixed** (a fact this doc did
   not touch on 09-16, surfaced by a different vault thread):
   `handoffs/status/zaostock.md` (2026-09-23 06:39 EDT, Dotfiles, measured):
   page title reads "ZAOstock Down October 3rd 2026 (@zaofestivals)," no more
   stale ZAO-CHELLA/Art Basel branding. **Facebook is explicitly NOT
   confirmed either way** by the same note: `facebook.com/zaofestivals` and a
   fake control both returned identical HTTP 400/"Error" (1,542 bytes) on
   2026-09-23, meaning the fetch path is blocked, not that the page content is
   known. This matches what this re-research measured independently today
   (below) and is the reason Recommendation 5 (Meta Business Portfolio link)
   still reads UNKNOWN.
4. **The September newsletter was read in full this time (it was not opened
   in the 09-16 version).** `heartofellsworth.org/newsletters/2026/9/1/september-2026`,
   fetched and read 2026-09-25: it independently confirms the Oct 1-4 dates
   ("From October 1 to 4, Art of Ellsworth will bring four days of craft,
   culture and community") but **contains zero mentions of ZAOstock by name**.
   Next Action "read the newsletter for a ZAOstock mention" (due 2026-09-17)
   is now answered: read, and the answer is no mention found, not a
   confirmation either way of promotion reach.
5. **Which Ellsworth Facebook groups to post into is still unnamed by
   Zaal**, unchanged since before 09-16.
   `projects/zaostock-linkedin-facebook-push-2026-09-16.md`: "Which Facebook
   groups? The zaostock lane has needed this since before 2026-09-13
   (`handoffs/status/zaostock.md:491`, `:515`) and it is the one thing this
   plan cannot draft around." Confirmed still open in the same file today.
   This is the single largest reason Recommendation 1's "first batch" below
   is still a proposal, not an executed post list.
6. **One fetch upgraded from PARTIAL/FAILED to FULL: The Grand's Facebook
   Page.** `exa web_fetch` (not tried on the last pass) returned real content
   past the login wall - name, category ("Local business"), and **9.1K
   followers** (`facebook.com/TheGrand1938/followers/` link visible in the
   fetched DOM), consistent with the prior snippet-based estimate of "~9,190
   likes." Everything else attempted through the same route (the ZAOstock
   event page, the "Local Ellsworth (Moderated)" group, Downtown Ellsworth)
   stayed PARTIAL or FAILED - see Sources for the method-by-method detail.
   This is not the wall opening; it is one page's public preview rendering
   further than the rest, and it should not be read as "Facebook is now
   fetchable."
7. **CENTRAL CLAIM CORRECTION - the Maine Craft Weekend "ZAOstock listing is
   live" finding from 2026-09-16 does not hold, and this is bigger than the
   date slip above.** The vault's own record (`BLACKBOARD.md`, corrected
   2026-09-22, three days before this pass) states Zaal screenshotted the
   live Maine Craft Weekend map and the Franklin Street Parklet pin shows
   the **City of Ellsworth's own Downtown Barn Dance** (1 October), not
   ZAOstock - no ZAOstock pin appears anywhere in the downtown Ellsworth
   view. It was reported to Simonne Feeney at mainecrafts.org the same day;
   **no reply or fix has been found anywhere in the vault as of this pass**,
   three days later. A fresh direct fetch of the listing URL today (`curl`,
   200 OK, 76,688 bytes) independently corroborates this: the page's own
   `<title>` reads "Featured City Sample Page," and its one image reference
   is literally named `MCW+Listing+Sample.png`. The stripped page text has
   **zero** occurrences of "zaostock," "Franklin," "parklet," or "Barn
   Dance." The `?listing=...` query string on the URL does not appear to
   select any per-listing content at all on this Squarespace page - it
   serves the same generic sample regardless of the parameter. **Do not cite
   "the Maine Craft Weekend listing is live for ZAOstock" until Simonne
   Feeney confirms a fix and a fresh fetch shows ZAOstock's name on the
   page.** See Finding (b) below for the full correction.

## Recommendations (act on these)

| # | Move | Why | Owner |
|---|------|-----|-------|
| 1 | **Share the existing FB Event (`facebook.com/events/28051455107809318`) into named groups once Zaal names them; do not wait on the new ZAOstock Page build to post the event.** | The event still exists and resolves under ZAOstock's own name (page title "ZAOstock | Facebook," confirmed via exa web_fetch today; curl itself still gets Facebook's generic 400 error) and Chesnee at Heart of Ellsworth already offered the Yodel community calendar (doc events/2279). The new Page-under-ZAO-Festivals effort (item 1 above) is a separate, bigger, still-not-done build - it should not block the smaller, already-actionable move. | @Zaal |
| 2 | **Post first to Heart of Ellsworth (~6,000 followers) - not the Maine Craft Weekend listing, which does not currently show ZAOstock at all (see Finding (b) and the correction above).** Chase the Maine Craft Weekend fix with Simonne Feeney (mainecrafts.org) in parallel, since it is a free listing currently showing nothing for ZAOstock. | Heart of Ellsworth's own page (`heartofellsworth.org/artofellsworth`) still references ZAOstock by name and image, confirmed again today. The Maine Craft Weekend site itself does not - a fresh fetch today renders a generic "Featured City Sample Page" template with zero ZAOstock text, corroborating the vault's 2026-09-22 correction. Do not send traffic to that listing until it is fixed. | @Zaal |
| 3 | **Do not claim Heart of Ellsworth as a "partner" in any Facebook copy.** | Unchanged. `src/content/site.ts:162` and its own test deliberately keep them out of PARTNERS; Chesnee's words in doc 2279 ("I don't see any issue with it as of right now") are conditional, not a yes. | @zao-socials |
| 4 | **Close card 9817 (ad-account payment access) before asking finance for a boost number.** | The number cannot exist until someone can actually spend on the account. As of today the test itself ("paid social test decided 17 Sept") is still blocked on access, not on a missing decision - this is a different, smaller ask than "invent a budget." | @Zaal / @finance |
| 5 | **Cross-post Page content into Instagram via Meta Business Suite only after confirming the ZAO Festivals Page and `@zaofestivals` Instagram are in the same business portfolio.** Still unverifiable from this machine as of today - `facebook.com/zaofestivals` returns an identical block page to a fake control, both on 2026-09-23 (vault) and today (this doc). Needs Zaal's own login or the browser extension reconnected. | Meta's own docs (Source, re-fetched today, content unchanged) require the two accounts linked in one portfolio before cross-posting works at all - Facebook post to Facebook Groups is one of the four cross-post destinations, which is the one this push actually wants. | @Zaal |
| 6 | **Name the Ellsworth Facebook groups.** Still the one blocking decision, unchanged since before 2026-09-13. | Nothing in Recommendation 1 or 2 can be executed against named local groups until Zaal picks from the candidate list in Finding (a), or names others. | @Zaal |

## Findings

### (a) Real Ellsworth / Hancock County Facebook groups and pages, by name

Re-fetched today, 2026-09-25, with two methods per source (`curl` with a
browser user-agent, then `exa web_fetch` as an escalation - the fetch ladder's
next rung). **Member counts and posting rules still could not be read**,
except for The Grand (upgraded to FULL, see above). Counts below are still
mostly what appeared in Meta's own indexed search snippets, not a logged-in
read of the group, unless marked otherwise.

| Name | Type | Snippet/measured size | Open or closed? | Method today |
|---|---|---|---|---|
| **Downtown Ellsworth, Maine** (`facebook.com/DowntownEllsworth`) | Page | 12,464 likes (2026-09-16 snippet, not re-confirmed) | Unverified | `curl`: HTTP 200, empty JS shell. `exa`: "You're Temporarily Blocked" (Meta's own rate-limit page, a *different* failure than the prior 400) - **FAILED**, escalation to Playwright not attempted this pass |
| **Local Ellsworth (Moderated)** (`facebook.com/groups/706857109500453`) | Group | not surfaced | **Moderated**, almost certainly admin-approval to post; unverified | `curl`: HTTP 200 but page title only, full login wall. `exa`: pure "Log into Facebook" page, zero content - **FAILED, unchanged** |
| **Historic Post Office Building in Ellsworth, Maine** | Group | not surfaced | Unverified | Not re-attempted this pass (URL omitted per the same card-number false-positive noted last time) |
| **Ellsworth, Maine** (`facebook.com/ellsworthmaine`) | Page | not surfaced | Unverified | Not re-fetched this pass; unchanged from 09-16 |
| **Ellsworth, Maine (04605)** (`facebook.com/ellsworth04605`) | Page | not surfaced | Unverified | Not re-fetched this pass; unchanged from 09-16 |
| **Heart of Ellsworth** (`facebook.com/heartofellsworth`) | Page (501c3) | ~6,000 followers (own blog post, 2026-08-12, unchanged) | Page | Not re-fetched (own-site source already confirms the figure; own-domain page re-fetched instead, see (e)) |
| **City of Ellsworth, Maine** (`facebook.com/ellsworthme`) | Page | not surfaced | Page | Not re-fetched this pass |
| **The Grand** (`facebook.com/TheGrand1938`) | Page, performing-arts venue | **9.1K followers, 405 following - read directly today, FULL** | Page | `exa web_fetch`: real page content past the login wall - name, "Local business" category, follower/following counts, Posts/About/Reels/Photos tabs |
| **Black Moon Public House** (`facebook.com/p/Black-Moon-Public-House-61557620630623`) | Page | not surfaced | Page | Not re-fetched this pass |

**Why counts and posting rules mostly still stop here.** Same wall as
2026-09-16, re-measured with an added method:
1. `curl` with a real browser user-agent -> HTTP 200 this time (was HTTP 400
   on 09-16) but an empty app shell containing only a `<title>` tag and a
   hidden login form (`loginform` present in every page's markup) - a
   different HTTP code, the same practical result: no content.
2. `exa web_fetch` -> for three of four re-tried URLs, still a login wall or a
   rate-limit block page. For The Grand specifically, it returned the actual
   rendered page - the one exception found this pass.
3. `claude-in-chrome` -> **checked again today via `list_connected_browsers`:
   zero browsers connected.** Still not available on this machine, unchanged
   from 09-16.

**The one thing that closes this gap is still Zaal's own logged-in Facebook**,
checked by hand or with the extension connected - member counts, whether
"Local Ellsworth (Moderated)" and the Historic Post Office group require
admin approval, and whether any of these pages accept visitor posts at all.

### (b) Facebook Events - the event still exists; the Maine Craft Weekend listing claim does NOT hold

**No new Facebook Event is needed**, confirmed again today.
`facebook.com/events/28051455107809318` still resolves: `curl` with a real
browser user-agent returned **HTTP 400** (the same generic 1,542-byte error
page Facebook returns for every group/page URL tried this session - not
HTTP 200; correcting an inconsistent figure from an earlier pass at this
doc). `exa web_fetch` on the same URL returned a real render, with the
page's own `<title>` reading **"ZAOstock | Facebook"** and the body showing
Facebook's logged-out Events-dashboard navigation chrome (category tiles,
login prompt) rather than the event's own description. **Net: the event
still exists and still carries ZAOstock's name (new confirmation from the
title tag), but the event body - description, RSVP counts, whether it
carries the corrected copy from `~/.zao/clipboard/2026-09-02-facebook-event-for-amy.txt`
rather than the flagged-stale 2026-08-20 draft - is still unreadable from
this machine.** The clipboard file itself is unchanged since 2026-09-02
(mtime confirmed today), so the corrected text still exists to paste if
needed, but whether it was ever applied to the live event could not be
checked.

**Separately, and this is the central correction for this re-research pass:
the old doc's claim that "ZAOstock already has its own live public listing"
on the Maine Craft Weekend site does NOT hold.** Two independent checks
agree:
1. **The vault's own record** (`BLACKBOARD.md`, corrected 2026-09-22): Zaal
   screenshotted the live Maine Craft Weekend map; the Franklin Street
   Parklet pin shows the **City of Ellsworth's own Downtown Barn Dance**
   (1 October), not ZAOstock, and no ZAOstock pin appears anywhere in the
   downtown Ellsworth view. Reported to Simonne Feeney (mainecrafts.org)
   the same day; **no reply or fix found anywhere in the vault as of this
   pass**, three days later.
2. **A fresh direct fetch today** (`curl`, 200 OK, 76,688 bytes) of
   `mainecraftweekend.org/featured-city-ellsworth?listing=zaostock-live-music-festival-franklin-street-parklet-223018`
   shows a **generic Squarespace template**: the page's own `<title>` reads
   "Featured City Sample Page," and its one image reference is literally
   named `MCW+Listing+Sample.png`. The stripped page text has **zero**
   occurrences of "zaostock," "Franklin," "parklet," or "Barn Dance." The
   `?listing=...` query parameter does not appear to select any
   per-listing content on this page at all - it is a static sample
   regardless of the parameter, not a JS-populated per-listing view as an
   earlier pass at this doc assumed.

The *linking* page, `heartofellsworth.org/artofellsworth`, re-fetched in
full today, still contains the `zaostock.jpg` image asset and a working
`href="...listing=zaostock-live-music-festival..."` link pointing at that
listing - so Heart of Ellsworth's own site still correctly references
ZAOstock and links toward the listing. **The break is on Maine Craft
Weekend's side of that link, not Heart of Ellsworth's.** Do not repeat
"ZAOstock already has its own live public listing on the Maine Craft
Weekend site" as fact until Simonne Feeney confirms a fix and a fresh fetch
shows ZAOstock's name on the destination page.

**Art of Ellsworth: Maine Craft Weekend, Oct 1-4 2026, ninth year** - the date
range is now confirmed by a second, independent, freshly-read source not used
in the 09-16 version: the Heart of Ellsworth September newsletter states
outright, "From October 1 to 4, Art of Ellsworth will bring four days of craft,
culture and community to locations throughout downtown and beyond." The
event's own page lists dated sub-events from Sep 30 through Oct 23 (a
multi-week exhibition tail), with named events landing on Oct 1, Oct 3 and
Oct 3-4 specifically - this corroborates the Oct 1-4 core window rather than
contradicting it. The specific hour-level claim from the 09-16 doc ("Thursday
1 October, 12pm through Sunday 4 October, 4pm") could not be re-confirmed
verbatim in either the newsletter or the event-listing page fetched today;
mark that specific timestamp **UNKNOWN as of this pass**, not wrong - it may
simply live on a page section this fetch did not reach.

### (c) Meta Business Suite cross-posting - re-fetched, unchanged

Re-fetched today via `exa web_fetch` (the same escalation the 09-16 doc used;
plain `curl` returns only the page `<title>`, no body, for this URL too -
Meta's help center is JS-rendered behind its own soft login prompt). Content
is **identical in substance** to the 09-16 version:

- Cross-posting requires the Facebook Page and Instagram account **directly
  connected and in the same business portfolio**, plus task-based permissions
  on both assets.
- **A Facebook Page post can cross-post to: Facebook Stories, Instagram Feed,
  Facebook Groups, and Threads.** The Facebook Groups destination is still the
  one most relevant to this push.
- Threads cross-posting is desktop-only and needs a matching Instagram
  username - not relevant here.
- **Still cannot be verified as configured for the ZAO Festivals Page from
  this machine.** No change: whether the Page and `@zaofestivals` Instagram
  are linked, and in which portfolio, remains a Meta Business Suite setting
  visible only to whoever administers the Page.

### (d) Whether a small paid boost is worth it - re-routed, still not guessed

**Updated, see summary above.** As of 2026-09-16 no ad-boost figure existed
anywhere in the vault. As of today, the picture is more specific but not more
answered: a "paid social test" **was decided in principle on 2026-09-17**
(`handoffs/status/finance.md` line 851) but has not run, because **nobody
currently holds payment access on the ZAO Festivals ad account** - tracker
card 9817, opened 2026-09-19, still listed as open with "no answer yet on our
side" in the 2026-09-25 status file. No dollar figure for a boost exists in
the vault today, same as before. The blocking question changed from "what
would we spend" to "who can spend at all" - a narrower, more answerable ask
for whoever owns card 9817 next.

### (e) What Ellsworth venues and the Chamber are doing this month

Two organizations, still not the same:

- **Heart of Ellsworth** (`heartofellsworth.org`) - re-fetched in full today.
  Runs the Franklin Street Parklet, the Downtown Summer Concert Series, the
  Makerspace at 16 State, and Art of Ellsworth: Maine Craft Weekend (Oct 1-4,
  ninth year, sculpture/stone focus this year, confirmed unchanged). **The
  September 2026 newsletter was read in full for the first time this pass**
  (`heartofellsworth.org/newsletters/2026/9/1/september-2026`, 2026-09-01):
  it covers Art of Ellsworth, an annual Downtown Ellsworth Experience Survey
  (open through November 15), a Fogtown Brewing cider-sales partnership, and
  a move to Zeffy for zero-fee donations - **no mention of ZAOstock by name
  anywhere in it.** This directly answers the 09-16 doc's open Next Action
  ("read the newsletter for a ZAOstock mention") - answer: read, and it is
  not mentioned.
- **Ellsworth Area Chamber of Commerce** (`ellsworthchamber.org`) - a separate
  organization from Heart of Ellsworth, runs its own business directory. Not
  re-fetched this pass; unchanged from 09-16.

Venue activity, unchanged from 09-16 except as noted:
- **Black Moon Public House** - not re-fetched this pass (Cloudflare-blocked
  last time); still corroborated only by doc events/986, unchanged.
- **The Grand** (`facebook.com/TheGrand1938`) - **upgraded to FULL this pass**:
  9.1K followers, "Local business" category, confirmed directly rather than
  via search snippet (previous figure: ~9,190 likes, consistent).
- **Fogtown Brewing** - open mics and Fogtoberfest overlap unchanged from
  doc 2279; not re-checked this pass.

## Also See

- [Doc events/986-ellsworth-local-intel-zaostock](../986-ellsworth-local-intel-zaostock/) - the venue/partner/money landscape section (e) builds on. **Ambiguous bare number - two docs share "986"; always cite the full path.**
- [Doc 2279](../2279-ellsworth-promo-marketing-chesnee-aug13/) - the Chesnee call that is the direct source for the FB event action item, the Yodel calendar offer, and the Heart-of-Ellsworth-is-not-a-partner-yet finding.
- [Doc 919](../919-zao-palooza-zao-chella-event-record/) - prior ZAO Festivals social handles including the existing @zaofestivals Instagram.
- [Doc 846](../../business/846-zao-festivals-funding-strategy/) - local-sponsors-first funding strategy this doc's venue list supports.
- `projects/zaostock-linkedin-facebook-push-2026-09-16.md` (zao-vault) - the plan this research feeds; still lists "which Facebook groups?" as open today.
- `projects/zaostock-content-calendar-2026-09-02.md` (zao-vault) - the "2 Sep Facebook event live, then Amy Kenney shares it" row this doc grounds; Amy Kenney is City of Ellsworth's Communications Director (`people/Amy-Kenney.md`, zao-vault), separate from Chesnee at Heart of Ellsworth.
- `handoffs/status/zaostock.md`, `handoffs/status/finance.md` (zao-vault) - the two live status files this update drew from; both read fresh 2026-09-25.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Follow up with Simonne Feeney (mainecrafts.org) on the Maine Craft Weekend listing - reported 2026-09-22, no reply found in the vault; the listing currently shows a generic sample page with no ZAOstock reference at all | @Zaal | Email/call + re-fetch to confirm | 2026-09-27 |
| Name the Ellsworth Facebook groups to post into (candidate list in Finding (a)) - the one item blocking Recommendation 1 and 2, open since before 2026-09-13 | @Zaal | Decision (quick-grill) | 2026-09-26 |
| Reconnect the claude-in-chrome extension or check by hand: member counts and posting rules for "Local Ellsworth (Moderated)" and the Historic Post Office group | @Zaal | Manual check | 2026-09-27 |
| Verify the live FB event (`facebook.com/events/28051455107809318`) carries the corrected copy from `2026-09-02-facebook-event-for-amy.txt` - still unconfirmed two next-action cycles running | @Zaal | Manual check | 2026-09-27 |
| Close tracker card 9817 (who has ad-account payment access, add a second admin) - open since 2026-09-19, this is what blocks both the boost test and the Meta Business Portfolio check | @Zaal | Decision | 2026-09-27 |
| Confirm ZAO Festivals Page + `@zaofestivals` Instagram are linked in one Meta business portfolio - depends on card 9817 above | @Zaal | Meta Business Suite check | 2026-09-29 |
| Once card 9817 closes: give the zao-socials lane a real number (or "wontfix") on a small paid boost for the final week | @finance | Answer | 2026-09-30 |
| Share the existing FB event into whichever groups/Pages get named above, plus Downtown Ellsworth, Heart of Ellsworth and City of Ellsworth (all confirmed open Pages) | @Zaal | Post | 2026-09-27 |
| Decide whether the new "ZAOstock Page under ZAO Festivals" build (in progress since 2026-09-21 call, still not done) proceeds before or after the event, given only 8 days remain | @Zaal | Decision | 2026-09-26 |

## Sources

- [FULL] [Heart of Ellsworth - 6,000 Facebook Followers blog post](https://www.heartofellsworth.org/blog/2026/8/12/6000-facebook-followers) (2026-08-12) - not re-fetched this pass (own-site, dated, unlikely to change; figure re-used).
- [FULL] [Heart of Ellsworth - Art of Ellsworth: Maine Craft Weekend](https://www.heartofellsworth.org/artofellsworth) - re-fetched via `curl` 2026-09-25, HTTP 200, 434,544 bytes. Confirms Oct 1-4 dates via the event listing, ninth year, sculpture/stone focus, and the `zaostock.jpg` image + listing-slug href both still present.
- [FULL, NEW SOURCE] [Heart of Ellsworth - September 2026 newsletter](https://www.heartofellsworth.org/newsletters/2026/9/1/september-2026) - fetched via `curl` 2026-09-25, HTTP 200, 471,301 bytes, read in full (not opened in the 09-16 version). Confirms "From October 1 to 4... four days" verbatim; zero ZAOstock mentions.
- [FULL - fetched and read; the finding is that no ZAOstock content is there, not that the fetch failed] [Maine Craft Weekend - Featured City Ellsworth, ZAOstock listing](https://mainecraftweekend.org/featured-city-ellsworth?listing=zaostock-live-music-festival-franklin-street-parklet-223018) - re-fetched via `curl` 2026-09-25, HTTP 200, 76,688 bytes (stripped text), page `<title>` reads "Featured City Sample Page," sole image asset named `MCW+Listing+Sample.png`, zero occurrences of "zaostock"/"Franklin"/"parklet"/"Barn Dance." This is a corrected read, not a partial one - an earlier pass at this doc assumed unread JS content explained the absence; this pass confirms the served page itself carries no ZAOstock reference regardless of the `?listing=` parameter.
- [FULL] [`BLACKBOARD.md`, zao-vault, corrected 2026-09-22] - the map-screenshot finding that the Franklin Street Parklet pin on Maine Craft Weekend's site shows the City of Ellsworth's Downtown Barn Dance, not ZAOstock; reported to Simonne Feeney (mainecrafts.org) same day, no reply found as of 2026-09-25.
- [FULL] [Meta Business Help Center - About Cross-Posting](https://www.facebook.com/business/help/914097058035853) - re-fetched via `exa web_fetch` 2026-09-25 (plain `curl` returns only the page `<title>`, JS-gated body). Content unchanged in substance from the 09-16 fetch.
- [PARTIAL, upgraded from PARTIAL to a real render for one page] [The Grand - Facebook](https://www.facebook.com/TheGrand1938/) - `exa web_fetch` 2026-09-25 returned actual page content past the login gate: 9.1K followers, 405 following, "Local business" category. **This is the one source that moved further than 09-16's search-snippet-only read.**
- [PARTIAL - title confirmed, body not retrievable, escalation to Playwright/claude-in-chrome not possible] [ZAOstock event](https://www.facebook.com/events/28051455107809318) - `curl` returned HTTP 400 (same generic error page as every other Facebook URL tried); `exa web_fetch` returned a real render with `<title>` "ZAOstock | Facebook" but body content limited to Facebook's generic Events-dashboard nav, not the event's own description. Both attempted 2026-09-25; page confirmed to exist and resolve under ZAOstock's name, body content not retrievable.
- [FAILED - login wall / rate-limit block, both methods] [Local Ellsworth (Moderated) - Facebook group](https://www.facebook.com/groups/706857109500453/) - `curl` HTTP 200 empty shell; `exa web_fetch` returned Facebook's bare login page. [Downtown Ellsworth, Maine - Facebook](https://www.facebook.com/DowntownEllsworth/) - `curl` HTTP 200 empty shell; `exa web_fetch` returned Meta's "You're Temporarily Blocked" rate-limit page (a different failure mode than the 09-16 HTTP 400, still no content). Historic Post Office group - not re-attempted (URL omitted, same card-number false-positive as before).
- [FAILED - claude-in-chrome unavailable] `mcp__claude-in-chrome__list_connected_browsers` called 2026-09-25: returned an empty list. No browser connected on this machine, same as 09-16 (the tool description implies this route can work when a browser is connected; it was not available for this pass).
- [FULL, zao-vault, local read 2026-09-25] `handoffs/status/zaostock.md` (top-of-file entries through 2026-09-25 14:46 EDT) - the ZAOstock Page build, the ad-account admin/payment card 9817, the Instagram fix confirmation, the Facebook-fetch-block confirmation on 2026-09-23.
- [FULL, zao-vault, local read 2026-09-25] `handoffs/status/finance.md` (entries through 2026-09-25 17:24 EDT) - the paid-social-test/card-9817 finding.
- [FULL, zao-vault, local read 2026-09-25] `projects/zaostock-linkedin-facebook-push-2026-09-16.md`, `notes/socials-map.md`, `handoffs/status/zao-socials.md`, `handoffs/zaostock-facebook-event.md` - the unresolved "which groups" question and the unchanged corrected-copy clipboard file (`~/.zao/clipboard/2026-09-02-facebook-event-for-amy.txt`, mtime confirmed unchanged 2026-09-02).
- [FULL] [events/986-ellsworth-local-intel-zaostock](../986-ellsworth-local-intel-zaostock/README.md) (zao-vault-adjacent, this repo) - venue/partner/money grounding, not re-fetched this pass.
- [FULL] [events/2279-ellsworth-promo-marketing-chesnee-aug13](../2279-ellsworth-promo-marketing-chesnee-aug13/README.md) - the direct call transcript this doc's Recommendation 1 and 3 come from, not re-fetched this pass.
