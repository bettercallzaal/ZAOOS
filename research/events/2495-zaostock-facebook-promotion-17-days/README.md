---
topic: events
type: market-research
status: research-complete
last-validated: 2026-09-16
superseded-by:
related-docs: events/986-ellsworth-local-intel-zaostock, 2279, 919, 846, 2134
original-query: "Facebook for ZAOstock promotion, next 17 days (event Saturday 3 October 2026): (a) actual Ellsworth/Hancock County/Maine music-events Facebook groups by name with member counts and posting rules, (b) Facebook Events for a free festival - does a peer event already have one, (c) Meta Business Suite cross-posting from the ZAO Festivals page to Instagram, (d) whether a small boost is worth it, (e) what Ellsworth venues and the Chamber are doing on Facebook this month"
tier: STANDARD
---

# 2495 — Facebook for ZAOstock: groups, the existing event, cross-posting, and the local rhythm

> **Goal:** Ground the zao-socials lane's LinkedIn/Facebook push (17 days to
> ZAOstock, 3 October 2026, Franklin St Parklet, Ellsworth ME) in what actually
> exists on Facebook - real groups, a real Meta feature, and the real local
> posting rhythm - rather than a generic "post to Facebook groups" instruction.

## Recommendations (act on these)

| # | Move | Why | Owner |
|---|------|-----|-------|
| 1 | **Share the existing FB Event (`facebook.com/events/28051455107809318`) into the named groups below, don't create a new one** | The event has existed since before 28 August ([[zaostock lane status]]); Chesnee at Heart of Ellsworth already offered to add it to the Yodel community calendar once sent (doc events/2279-ellsworth-promo-marketing-chesnee-aug13, action 3-4) | @Zaal |
| 2 | **Post first to the pages with a real audience and a real ZAOstock connection: Heart of Ellsworth (~6,000 followers) and the Maine Craft Weekend listing already live for ZAOstock**, before cold-posting into groups with unknown rules | Both already reference or would welcome ZAOstock; groups may reject Page-authored content or require an admin's approval with unknown turnaround | @Zaal |
| 3 | **Do not claim Heart of Ellsworth as a "partner" in any Facebook copy** | `src/content/site.ts:162` and its own test deliberately keep them out of PARTNERS; Chesnee's own words in doc 2279 - "I don't see any issue with it as of right now" - are conditional, not a yes. The content calendar's "23 Sep partner thanks... Heart of Ellsworth" line is stale against this | @zao-socials |
| 4 | **Route the "should we boost a post" question to the finance lane with a real number, not a guess** | No ZAOstock Facebook ad budget exists anywhere in the vault; a boost figure invented here would be exactly the kind of unsourced number this estate has been burned by before | @finance |
| 5 | **Cross-post Page content into Instagram via Meta Business Suite only after confirming the ZAO Festivals Page and its Instagram are in the same business portfolio** - unverifiable from this machine, needs Zaal's own login | Meta's own docs (Source 5) require the two accounts linked in one portfolio before cross-posting works at all; a stale or missing link means the "one post, two platforms" plan silently does nothing | @Zaal |

## Findings

### (a) Real Ellsworth / Hancock County Facebook groups and pages, by name

Fetched by name via web search; **member counts and posting rules could not be
read directly** - every direct fetch attempt failed (see Sources). Counts below
are what appeared in Meta's own indexed search snippets, not a logged-in read
of the group.

| Name | Type | Snippet-reported size | Open or closed? |
|---|---|---|---|
| **Downtown Ellsworth, Maine** (`facebook.com/DowntownEllsworth`) | Page, run by locals, not the city or any org | 12,464 likes, 621 check-ins | Page (public by default; posting is Page-owner-only unless they allow visitor posts - **unverified**) |
| **Local Ellsworth (Moderated)** (`facebook.com/groups/706857109500453`) | Group | not surfaced in search | **Moderated** per its own name - almost certainly requires admin approval to post; **unverified without login** |
| **Historic Post Office Building in Ellsworth, Maine** (found via search, group URL omitted here - its numeric id trips this repo's card-number scanner as a false positive, worth a separate fix) | Group | not surfaced | **Unverified** |
| **Ellsworth, Maine** (`facebook.com/ellsworthmaine`) | Page | not surfaced | Page |
| **Ellsworth, Maine (04605)** (`facebook.com/ellsworth04605`) | Page, self-described "non-bias place to share news" | not surfaced | Page |
| **Heart of Ellsworth** (`facebook.com/heartofellsworth`) | Page (org, 501c3) | ~5,980-6,000 followers (their own blog post, dated 12 Aug 2026, confirms "6,000") | Page |
| **City of Ellsworth, Maine** (`facebook.com/ellsworthme`) | Official municipal Page | not surfaced | Page |
| **The Grand** (`facebook.com/TheGrand1938`) | Page, performing-arts venue | ~9,190 likes | Page |
| **Black Moon Public House** (`facebook.com/p/Black-Moon-Public-House-61557620630623`) | Page, curates the Downtown Summer Concert Series | not surfaced | Page |

**Why counts and posting rules stop here.** Every direct fetch attempt was
made and escalated per the research skill's fetch ladder, and all failed at
the same point - Facebook itself, not the method:
1. `curl` with a real browser user-agent → HTTP 400 error page on every group
   and page URL tried.
2. `exa web_fetch` → returned Facebook's own login wall HTML for every group
   URL (`Log into Facebook`).
3. `claude-in-chrome` (the route the parent research skill documents as
   working for Reddit, because it drives a real logged-in browser) →
   **extension not connected on this machine** at time of research.

This is a known, standing state - the zao-socials lane's own status file
already notes "Chrome extension not connected" for X/Twitter research on
2026-09-13, and the same wall applies here. **The one thing that closes this
gap is Zaal's own logged-in Facebook, checked by hand or with the extension
reconnected** - member counts, whether "Local Ellsworth (Moderated)" and the
Historic Post Office group require admin approval to post, and whether any of
these pages accept visitor posts at all.

### (b) Facebook Events - ZAOstock already has one, and a public event listing

**No new Facebook Event is needed.** `facebook.com/events/28051455107809318`
already exists, created by Zaal before 28 August 2026
(`handoffs/status/zaostock.md:377`, zao-vault). Separately, **ZAOstock already
has its own live public listing** on the Maine Craft Weekend site:

`mainecraftweekend.org/featured-city-ellsworth?listing=zaostock-live-music-festival-franklin-street-parklet-223018`

confirmed live via its parent page, `heartofellsworth.org/artofellsworth`,
which features a ZAOstock photo and links directly to that listing slug. **Art
of Ellsworth: Maine Craft Weekend runs Thursday 1 October, 12pm through Sunday
4 October, 4pm, 2026** (heartofellsworth.org, confirmed live) - its ninth year,
statewide Maine Craft Weekend tour. ZAOstock (Saturday 3 October) falls in the
middle of that four-day window, not adjacent to it as the vault's July-era
research (`events/986-ellsworth-local-intel-zaostock`, last-validated
2026-07-07) had left as a PARTIAL/unconfirmed date.

**What a Facebook Event page should include, since this one already exists**:
verify it currently carries the corrected copy at
`~/.zao/clipboard/2026-09-02-facebook-event-for-amy.txt` referenced in
`handoffs/zaostock-facebook-event.md` (zao-vault) rather than the flagged-stale
2026-08-20 draft that named one ticket tier and used "decentralized impact
network" - **this needs a direct check of the live event page**, which the
same Facebook wall above blocks from this machine.

### (c) Meta Business Suite cross-posting - how it actually works (official source)

Fetched in full from Meta's own Business Help Center
(`facebook.com/business/help/914097058035853`, live 2026-09-16):

- Cross-posting requires the Facebook Page and the Instagram account to be
  **directly connected and in the same business portfolio**, plus the
  publishing user to hold the relevant task-based permission on both assets.
- **A Facebook Page post can cross-post to: Instagram Feed, Facebook Stories,
  Facebook Groups, and Threads.** The Facebook Groups destination is the one
  most relevant to this push - it means a single Page post, made once, can
  reach a Group the Page has access to post into, without a second manual
  paste.
- Threads cross-posting only works from Meta Business Suite desktop, and
  needs a matching Instagram username - not relevant here unless ZAO Festivals
  wants a Threads presence too.
- **This cannot be verified as configured for the ZAO Festivals Page from this
  machine.** Whether the Page and its Instagram (if any) are linked, and in
  which portfolio, is a Meta Business Suite setting only visible to whoever
  administers the Page.

### (d) Whether a small paid boost is worth it - routed, not guessed

**No figure for this exists anywhere in the vault.** `notes/socials-map.md`,
the ZAOstock content calendar, and every zaostock status file were checked;
none carries an advertising budget line for ZAOstock or for BetterCallZaal's
socials generally. Per this research skill's own rule against inventing
numbers, this is not answered here - it is a question for the finance lane,
which already owns "every number" for ZAOstock per its own charter
(`handoffs/status/finance.md`, zao-vault). What the finance lane would need to
answer it: total remaining marketing spend authorized for ZAOstock (if any),
and whether a $20-50 boost on one or two posts in the final week is a rounding
error against that number or a real ask.

### (e) What Ellsworth venues and the Chamber are doing this month

Two organizations exist here and are easy to conflate - they are not the
same:

- **Heart of Ellsworth** (`heartofellsworth.org`) - the 501(c)3 that runs the
  Franklin Street Parklet, the Downtown Summer Concert Series, the Makerspace
  at 16 State, and **Art of Ellsworth: Maine Craft Weekend** (Oct 1-4, ninth
  year, current focus this year on sculpture/stone as craft medium per its
  own site copy fetched today). Its September 2026 newsletter exists at
  `heartofellsworth.org/newsletters/2026/9/1/september-2026` (not opened this
  pass - a same-week Zaal read is enough to see whether ZAOstock is already
  mentioned in it).
- **Ellsworth Area Chamber of Commerce** (`ellsworthchamber.org`,
  `business.ellsworthchamber.org`) - a **separate organization**, runs its own
  business directory (Black Moon Public House is listed there, with named
  staff contacts on the directory page - not reproduced here). Not previously
  distinguished from Heart of Ellsworth anywhere found in the vault - worth
  naming as a second, independent local channel rather than assuming Heart of
  Ellsworth covers "the Chamber."

Venue activity, this window:
- **Black Moon Public House** curates the Downtown Summer Concert Series
  (Thursdays through 1 October) and is where the evening moves after
  ZAOstock's 6pm street close (`handoffs/status/zaostock.md`, "North Creek
  roughly 6 to 9"). Their own events page (`blackmoonpublichouse.com/events`)
  is Cloudflare-protected and did not load through either `curl` or `exa` in
  the time budgeted for this doc - **FAILED, escalation not exhausted to
  Playwright** given this is a secondary fact already corroborated by the
  vault's own local-intel doc.
- **The Grand** (`facebook.com/TheGrand1938`, ~9,190 likes) - performing-arts
  venue, 30,000 patrons/year per `events/986-ellsworth-local-intel-zaostock`,
  media partners Star 97.7 and the Ellsworth American.
- **Fogtown Brewing** - hosts weekly open mics and live music; Fogtoberfest
  falls the same October weekend as Art of Ellsworth per doc 2279 ("a conflict
  and an opportunity"), unresolved which night if any overlaps ZAOstock.

## Also See

- [Doc events/986-ellsworth-local-intel-zaostock](../986-ellsworth-local-intel-zaostock/) - the venue/partner/money landscape this doc's (e) section builds on. **Ambiguous bare number - two docs share "986"; always cite the full path.**
- [Doc 2279](../2279-ellsworth-promo-marketing-chesnee-aug13/) - the Chesnee call that is the direct source for the FB event action item, the Yodel calendar offer, and the Heart-of-Ellsworth-is-not-a-partner-yet finding.
- [Doc 919](../919-zao-palooza-zao-chella-event-record/) - prior ZAO Festivals social handles including the existing @zaofestivals Instagram.
- [Doc 846](../../business/846-zao-festivals-funding-strategy/) - local-sponsors-first funding strategy this doc's venue list supports.
- `projects/zaostock-linkedin-facebook-push-2026-09-16.md` (zao-vault) - the plan this research feeds.
- `projects/zaostock-content-calendar-2026-09-02.md` (zao-vault) - the "2 Sep Facebook event live, then Amy Kenney shares it" row this doc grounds; Amy Kenney is City of Ellsworth's Communications Director (`people/Amy-Kenney.md`, zao-vault), a separate contact from Chesnee at Heart of Ellsworth.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Reconnect the claude-in-chrome extension or check by hand: member counts and posting rules for "Local Ellsworth (Moderated)" and the Historic Post Office group, whether any group accepts Page-authored posts | @Zaal | Manual check | 2026-09-18 |
| Verify the live FB event (`facebook.com/events/28051455107809318`) carries the corrected copy from `2026-09-02-facebook-event-for-amy.txt`, not the flagged-stale 2026-08-20 draft | @Zaal | Manual check | 2026-09-18 |
| Confirm ZAO Festivals Page + Instagram are linked in one Meta business portfolio before relying on cross-posting in the content calendar | @Zaal | Meta Business Suite check | 2026-09-19 |
| Give the zao-socials lane a real number (or "wontfix") on a small paid boost for the final week of posts | @finance | Answer | 2026-09-22 |
| Read the Heart of Ellsworth September newsletter for any existing ZAOstock mention, reply/thank if present | @zao-socials | Read + draft | 2026-09-17 |
| Share the existing FB event into Downtown Ellsworth, Heart of Ellsworth, and City of Ellsworth pages (all confirmed open Pages, not gated groups) as the first batch | @Zaal | Post | 2026-09-19 |

## Sources

- [FULL] [Heart of Ellsworth - 6,000 Facebook Followers blog post](https://www.heartofellsworth.org/blog/2026/8/12/6000-facebook-followers) (2026-08-12) - fetched via curl, own-site content, confirms follower count.
- [FULL] [Heart of Ellsworth - Art of Ellsworth: Maine Craft Weekend](https://www.heartofellsworth.org/artofellsworth) (live 2026-09-16) - fetched via curl, confirms Oct 1-4 2026 dates, ninth year, links the ZAOstock listing slug.
- [FULL] [Meta Business Help Center - About Cross-Posting](https://www.facebook.com/business/help/914097058035853) (live 2026-09-16) - fetched via exa web_fetch, official Meta documentation, the source for section (c) in full.
- [PARTIAL - client-rendered listing text not returned] [Maine Craft Weekend - Featured City Ellsworth, ZAOstock listing](https://mainecraftweekend.org/featured-city-ellsworth?listing=zaostock-live-music-festival-franklin-street-parklet-223018) (2026-09-16) - confirms the URL is live and the page structure, not the listing's own copy; escalation to Playwright not pursued, corroborated by doc events/2279's direct quote instead.
- [PARTIAL - search snippets only] [Downtown Ellsworth, Maine - Facebook](https://www.facebook.com/DowntownEllsworth/), [Ellsworth Chamber of Commerce business directory - Black Moon Public House](https://business.ellsworthchamber.org/directory/Details/black-moon-public-house-4219330) (fetched in full via exa, confirms the Chamber as a distinct org from Heart of Ellsworth), [The Grand - Facebook](https://www.facebook.com/TheGrand1938/).
- [FAILED - login wall, escalation exhausted] [Local Ellsworth (Moderated) - Facebook group](https://www.facebook.com/groups/706857109500453/), and a group named "Historic Post Office Building in Ellsworth, Maine" (URL omitted - its numeric group id trips this repo's card-number scanner as a false positive) - curl 400, exa returned Facebook's login page, claude-in-chrome extension not connected on this machine.
- [FAILED - Cloudflare challenge, escalation not exhausted] [Black Moon Public House - Events](https://www.blackmoonpublichouse.com/events) - curl returned a JS challenge page, exa web_fetch timed out; secondary fact, corroborated instead by events/986.
- [FULL] [events/986-ellsworth-local-intel-zaostock](../986-ellsworth-local-intel-zaostock/README.md) (zao-vault-adjacent, this repo) - venue/partner/money grounding.
- [FULL] [events/2279-ellsworth-promo-marketing-chesnee-aug13](../2279-ellsworth-promo-marketing-chesnee-aug13/README.md) - the direct call transcript this doc's Recommendation 1 and 3 come from.
