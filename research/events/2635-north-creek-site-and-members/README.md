---
topic: events
type: guide
status: research-complete
last-validated: 2026-10-07
superseded-by:
related-docs: 2629
original-query: "i deployed to vercel lets deep research how to make this website the best it can be and research as mcuh as we can about all the northcreek guys"
tier: DEEP
---

# 2635 - North Creek: making the band site its best, and what is public about the members

> **Goal:** Rank what to add to the North Creek site (northcreek.art, repo bettercallzaal/north-creek, `site/`) given almost no band content, and record everything findable in public about the band's members.

**Read this first: the members half came back empty.** No public page reachable from this Mac names any member of North Creek. Three routes that could change that are blocked, and each needs Zaal (see Next Actions). The website half is complete.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | USE a visible contact line on both pages as soon as the band gives an address | Every checklist read lists a contact or booking path as core; none exists today (`site/index.html`) |
| 2 | ADD canonical, Open Graph and Twitter tags, a 1200x630 share image and a favicon now | Link previews are the first impression in iMessage, Farcaster and Instagram bios; the pages carry none |
| 3 | ADD JSON-LD now: MusicGroup on home, MusicEvent on `/afterparty` | Google's required Event fields (name, startDate, location) are all on record already |
| 4 | USE Kit's free plan for a mailing list, linked to a Kit-hosted page first | Free up to 10,000 subscribers (kit.com/pricing, read 2026-10-07); Buttondown free stops at 100 |
| 5 | SKIP Bandsintown, Songkick and merch until the band has 5 or more dates a year | One show does not justify third-party scripts or a second place to update |
| 6 | SKIP analytics for now; USE Vercel Web Analytics when there is a goal | Hobby includes 50,000 events a month (Vercel docs, read 2026-10-07); Plausible starts at $9 a month |
| 7 | REPLACE "Music, members and links are on the way" with the Pillow Queens pattern: one honest line plus a sign-up | Two checklists warn that a "coming soon" dead end costs visitors |
| 8 | Point northcreek.art at Vercel before any of the above ships with absolute URLs | dig on 2026-10-07 shows Porkbun parking, not Vercel; OG and JSON-LD need the final domain |
| 9 | Members: write nothing about them until the band says it; ask eties | The public record is empty, and the band has not said what may be public (north-creek `README.md`, decision 3) |

## Findings

### 1. The site today (measured 2026-10-07)

| Check | Result | Surface |
|---|---|---|
| Pages | 2: home and `/afterparty`, static HTML and one CSS file | `site/` on north-creek main |
| Vercel production | north-creek.vercel.app, `/` 200, `/afterparty` 200 | curl 20:12 EDT |
| Internal notes exposed | Were public until north-creek PR #4 merged 00:05 UTC (`/docs/press-kit.md` was 200, now 404) | curl before and after |
| northcreek.art | Resolves to Porkbun parking (`pixie.porkbun.com`), TLS handshake fails, not added to the Vercel project | dig, curl, `vercel domains inspect` |
| Head tags | title and description only; no canonical, OG, Twitter, favicon or JSON-LD | read of both HTML files |
| Flyer | 1125x1500 JPEG, 356,547 bytes | `site/afterparty/flyer.jpg` |
| Contact, mailing list, music | none | read of both HTML files |

**Follow-through, 2026-10-07 20:19 EDT:** northcreek.art is live since this evening. Zaal attached it to Vercel himself; `curl` returns 200 and `dig` resolves to 216.150.1.1. The Porkbun-parking row above and decision 8 describe the state at 20:02 EDT.

### 2. Ranked recommendations

| # | Recommendation | Effort | Needs band content |
|---|---|---|---|
| 1 | Contact line on both pages | S | Yes, an address |
| 2 | Canonical, OG, Twitter, 1200x630 share image, favicon | S | No |
| 3 | JSON-LD MusicGroup and MusicEvent | S | No |
| 4 | Kit sign-up link, then embedded form | S | No |
| 5 | Domain on Vercel, absolute URLs | S | No |
| 6 | Honest stub line instead of "on the way" | S | One sentence on the sound |
| 7 | Flyer as WebP with a 750w variant and JPEG fallback | S | No |
| 8 | Bio of 50 to 75 words, 3 to 5 press photos, a `/press` web page | M | Yes |
| 9 | Bandcamp or Spotify embed on home | S | Yes, music |
| 10 | Hand-written shows list with MusicEvent JSON-LD per show | S | Yes, dates |
| 11 | Analytics | S | No |
| 12 | Merch | L | Yes |

Items 2, 3, 5 and 7 need nothing from the band. Items 1, 6, 8, 9 and 10 wait on the band.

### 3. What the checklists agree a band site needs

Eight guides (Bandmate, GigPro, Bandzoogle, Yola, MI, 12AM, Phonotonal, StageReady) converge on: home, shows, music player, bio, contact, press kit, mailing list, photos. Merch is "if you sell". GigPro: keep a shows list up even when it is empty. Pillow Queens' live home page handles the no-content state with "New music coming very soon. Sign up to our mailing list for updates", the pattern to copy.

### 4. Structured data

Google's Event doc (updated 2026-09-08): required name, startDate, location (Place with name and address); recommended eventStatus, image, endDate, performer, organizer, offers. A past event earns no rich result, but the block still records the facts. Ready-to-paste blocks, using only facts on record (north-creek `docs/shows.md`, ZAOstock `src/content/site.ts` AFTER_PARTY):

```json
{"@context":"https://schema.org","@type":"MusicGroup","name":"North Creek","url":"https://northcreek.art/"}
```

```json
{"@context":"https://schema.org","@type":"MusicEvent","name":"ZAOstock 2026 after-party",
 "url":"https://northcreek.art/afterparty","image":"https://northcreek.art/afterparty/flyer.jpg",
 "eventStatus":"https://schema.org/EventScheduled",
 "startDate":"2026-10-03T19:00:00-04:00","endDate":"2026-10-03T22:00:00-04:00","doorTime":"2026-10-03T18:00:00-04:00",
 "location":{"@type":"Place","name":"Black Moon Public House","address":{"@type":"PostalAddress","streetAddress":"<street, from north-creek docs/shows.md>","addressLocality":"Ellsworth","addressRegion":"ME","addressCountry":"US"}},
 "performer":[{"@type":"MusicGroup","name":"North Creek"},{"@type":"PerformingGroup","name":"Treelock & HiDef"},{"@type":"PerformingGroup","name":"Sam Savage"},{"@type":"PerformingGroup","name":"Oven Baked Beats DJ Aquavantes"}],
 "organizer":{"@type":"Organization","name":"Black Moon Public House"}}
```

Whether Sam Savage is a person or a group is UNKNOWN, so PerformingGroup is used for all three other acts. Add genre, sameAs and member to MusicGroup only when the band supplies them.

### 5. Share previews

Open Graph core set is og:title, og:type, og:image, og:url (ogp.me). Live examples: Janie Bay 1280x800, The Delines 2500x1330, both `summary_large_image`. 1200x630 is common practice; X's and Meta's own size specs could not be read (PARTIAL). Whether Farcaster renders a plain link from OG tags is UNKNOWN; test by pasting the live URL into a cast. Google's favicon guide: square, larger than 48x48, stable URL; SVG is not in its format list, so ship a PNG or ICO too.

### 6. Listings and players

Bandsintown has a free widget and Events API that sync published dates; Songkick has the Tourbox snippet. Both add third-party script. Spotify for Artists has no site embed beyond Spotify's player embed. Reddit opinion (r/WeAreTheMusicMakers, 30 Jun 2026, 14 comments) rates Bandcamp listeners as more engaged than Spotify's; this is anecdote. Bandcamp first, Spotify later.

### 7. Mailing list and analytics

| Tool | Free tier (read 2026-10-07) | Verdict |
|---|---|---|
| Kit | Free up to 10,000 subscribers | USE |
| Buttondown | Free up to 100 subscribers | SKIP, too small |
| Mailchimp | Free plan exists, limits not extracted | UNKNOWN |
| Vercel Web Analytics | Hobby: 50,000 events a month | USE later |
| Plausible | $9 a month for 10k pageviews, trial only | SKIP |

r/musicmarketing (24 Nov 2025, 12 comments by Arctic Shift's count): fans join a list for gig notices, presales and behind-the-scenes, not a "newsletter".

### 8. Vercel specifics

`cleanUrls: true` is already set (north-creek `vercel.json`). Vercel's cache doc reserves `max-age=31536000, immutable` for content-hashed files; `flyer.jpg` and `style.css` are not hashed, so rename on change or use a short max-age. web.dev: good LCP is 2.5 s or less. The site is about 4 KB of HTML and CSS; the flyer is the only weight. Contrast of the muted text colour against WCAG 2.2 AA was not measured here: UNKNOWN.

### 9. The members: what is public

| Searched | Result | Surface |
|---|---|---|
| zao-vault main, every file | No member named. Only the contact, typed by Zaal as "eties" (spelling unconfirmed) | `git grep` for north creek, eties, ettie on origin/main, 2026-10-07 |
| Doc 2629 and its 18 sources | No member named | `research/events/2629-north-creek-band-record` |
| Web search, 5 queries (Ellsworth, Black Moon, socials, Bandcamp and Spotify, the other three acts) | No Maine band called North Creek found; the other three acts also have no findable page | WebSearch, exa |
| Black Moon's website | 403 to curl; exa reads only menus and hours | curl, exa |
| Black Moon on Facebook | Page front only: about 3,500 followers, nine recent photos, no captions; photo pages, events tab and the image files all refused | exa web_fetch, curl |
| Black Moon on Instagram | 401 without login | Instagram public profile endpoint |
| Bandsintown venue page | 403 | curl |
| AllEvents, Black Moon organiser page | Lists Black Moon events from 13 Aug to 16 Sep 2026; no 3 Oct event, no North Creek | exa web_fetch |
| Ellsworth American site search | 2 hits for "North Creek", both North Creek Nurseries in Pennsylvania | curl |
| WDEA, Heart of Ellsworth, The Grand | 0 hits | curl |
| Bandcamp search | Bot challenge | curl, exa |
| Zaal's Gmail | BLOCKED: "Permission for this action was denied by the Claude Code auto mode classifier. Reason: [PII Data Handling]" | Gmail search_threads |
| Zaal's Chrome (Facebook, Instagram with his logins) | BLOCKED: browser extension not connected | Claude in Chrome |
| Headless browser | BLOCKED: Playwright MCP bridge extension timeout | Playwright MCP |

Not searched: Facebook groups for Ellsworth (login only), TikTok, YouTube, SoundCloud, the ZAOstock Twitch VODs for stage announcements.

### 10. Contradictions

- **EPK format.** Bandmate and 12AM say a web page; one Reddit reply says a Drive PDF. Web `/press` page first, PDF only if a booker asks.
- **Listing widgets.** 12AM recommends Bandsintown or Songkick on the shows page; for one show the extra script is not worth it. Judgment, not a measurement.
- **Name.** Still "North Creek" against "North Creek and Friends" (doc 2629); zaostock.com/program body text says "North Creek and friends" while its list says "North Creek".

### 11. Found in passing

The ZAOstock Luma page (luma.com/vhwv9n2h), read through exa on 2026-10-07, still lists an act Zaal ruled on 2026-10-05 must not appear in any public lineup. Flagged to the ZAOstock lane's owner, not changed here.

## Staleness

Pricing for Kit, Buttondown, Plausible and Vercel was read on 2026-10-07 and changes; re-check at signup. Bandzoogle's checklist is from 2019 and the Hacker News thread from 2023; both are supporting only. Google's Event doc was updated 2026-09-08.

## Also See

- [Doc 2629](../2629-north-creek-band-record/) - everything on record about the band, 2026-10-07
- north-creek repo `docs/press-kit.md` - the 19 press-kit fields, 13 UNKNOWN

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Ask eties for members, a one-line description, socials, a photo, a contact address and what may be public; done when the answers are in north-creek `docs/press-kit.md` | @Zaal | Message | 2026-10-14 |
| Reconnect the Claude in Chrome extension so the lane can read Black Moon's 3 Oct Facebook and Instagram posts; done when the members table above is re-run with that route | @Zaal | Setup | 2026-10-10 |
| Allow Gmail read for the lane, or search "North Creek" in Steve Peer's threads himself; done when any member name found is in the press kit with its source | @Zaal | Permission | 2026-10-10 |
| Add northcreek.art to the Vercel project and set the Porkbun DNS records; done when https://northcreek.art returns the homepage | @Zaal | Setup | 2026-10-10 |
| Ship items 2, 3, 5 and 7 (head tags, share image, favicon, JSON-LD, WebP flyer); done when the north-creek PR merges | north-creek lane | PR | 2026-10-08 |
| Create a free Kit account and landing page for North Creek once the band says yes; done when the link is on the homepage | @Zaal | Setup | 2026-10-21 |
| Remove the retired act from the ZAOstock Luma description; done when luma.com/vhwv9n2h no longer names it | @Zaal | Edit | 2026-10-09 |

## Sources

Website half: fetched by a research subagent on 2026-10-07; methods as it reported them. The lane re-read Google's Event doc, Kit, Buttondown and Vercel Analytics pricing raw with curl and confirmed the figures quoted above.

1. [Google, Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event) [FULL, curl] required and recommended Event properties
2. [schema.org MusicGroup](https://schema.org/MusicGroup) [FULL, curl]
3. [schema.org MusicEvent](https://schema.org/MusicEvent) [FULL, curl]
4. [schema.org EventStatusType](https://schema.org/EventStatusType) [PARTIAL, curl, thin page; Google's doc supplies the values]
5. [Vercel project configuration](https://vercel.com/docs/project-configuration) [FULL, curl] cleanUrls, headers
6. [Vercel cache-control headers](https://vercel.com/docs/headers/cache-control-headers) [FULL, curl]
7. [Vercel Web Analytics](https://vercel.com/docs/analytics) [FULL, curl]
8. [Vercel Analytics limits and pricing](https://vercel.com/docs/analytics/limits-and-pricing) [FULL, curl, re-read by lane] 50,000 events a month on Hobby
9. [Plausible pricing](https://plausible.io/#pricing) [FULL, curl]
10. [Buttondown pricing](https://buttondown.com/pricing) [FULL, curl, re-read by lane] free up to 100 subscribers
11. [Kit pricing](https://kit.com/pricing) [FULL, curl, re-read by lane] free up to 10,000 subscribers
12. [Mailchimp pricing](https://mailchimp.com/pricing/marketing/) [PARTIAL, curl; free-plan limits not extracted, escalation: re-read at signup]
13. [Bandcamp help, embeds](https://get.bandcamp.help/hc/en-us/articles/23020711574423-How-do-I-send-a-message-to-my-fans) [PARTIAL, curl; returned the embed article, fan messaging UNKNOWN]
14. [Open Graph protocol](https://ogp.me/) [FULL, curl]
15. [web.dev, LCP](https://web.dev/articles/lcp) [FULL, curl]
16. [Farcaster mini apps, sharing](https://miniapps.farcaster.xyz/docs/guides/sharing) [PARTIAL, curl; plain-link OG fallback not stated, escalation: test a live cast]
17. [X, summary card with large image](https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image) [PARTIAL, curl, JS shell; sizes not confirmed]
18. [Google, favicon in search](https://developers.google.com/search/docs/appearance/favicon-in-search) [FULL, curl]
19. [Google Images best practices](https://developers.google.com/search/docs/appearance/google-images) [FULL, curl]
20. [Bandsintown widget and API](https://www.artist.bandsintown.com/widget-api) [FULL, curl]
21. [Bandsintown, sync events to website](https://help.artists.bandsintown.com/en/articles/7053470-sync-your-events-to-your-website) [FULL, curl]
22. [Songkick Tourbox widget](https://support.songkick.com/hc/en-us/articles/360012785073-Add-concerts-to-your-website-with-the-Tourbox-widget) [PARTIAL, exa excerpt after curl 403]
23. [Bandmate, essential elements of a band website](https://bandmate.co/academy/articles/essential-elements-for-a-successful-band-website/) [FULL, curl] 2025-07-19
24. [GigPro, band website checklist](https://www.gigpro.live/band-website-checklist) [FULL, curl]
25. [Yola, how to make a band website](https://www.yola.com/how-to-make-website/band/) [FULL, curl]
26. [Bandzoogle, band website checklist](https://bandzoogle.com/blog/creating-a-band-website-a-complete-checklist) [PARTIAL, exa excerpt; 2019, stale]
27. [Phonotonal, guide to your band website](https://www.phonotonal.com/2022/10/the-ultimate-guide-to-your-band-or-musician-website/) [PARTIAL, exa excerpt]
28. [MI, building a band website](https://www.mi.edu/in-the-know/music-promotion-building-band-website/) [PARTIAL, exa excerpt]
29. [12AM Agency, designing a music website](https://12amagency.com/blog/how-to-design-a-music-website/) [PARTIAL, exa excerpt]
30. [StageReady, musician website pages](https://stagereadyweb.com/en/guides/musician-website) [PARTIAL, exa excerpt]
31. [r/musicmarketing, suggestions for band website](https://reddit.com/r/musicmarketing/comments/1ra3e89/suggestions_for_band_website/) [FULL, Arctic Shift API] 2026-02-20
32. [r/WeAreTheMusicMakers, best platform for an EPK](https://reddit.com/r/WeAreTheMusicMakers/comments/1i6jch0/whats_the_best_platform_for_an_electronic_press/) [FULL, Arctic Shift API]
33. [r/musicmarketing, what would you join an email list for](https://reddit.com/r/musicmarketing/comments/1p5fxes/) [FULL, Arctic Shift API, re-checked by lane]
34. [r/WeAreTheMusicMakers, more Bandcamp listeners than Spotify](https://reddit.com/r/WeAreTheMusicMakers/comments/1ujmdbs/) [FULL, Arctic Shift API]
35. [r/musicmarketing, offline record label](https://reddit.com/r/musicmarketing/comments/1wtjti6/) [PARTIAL, Arctic Shift API, comments only]
36. [Hacker News, Portugal. The Man band website](https://news.ycombinator.com/item?id=35010719) [PARTIAL, HN Algolia API, metadata only; not relied on]
37. [Janie Bay](https://www.janiebay.com/) [FULL, curl]
38. [The Delines](https://www.thedelines.com/) [FULL, curl]
39. [Pillow Queens](https://www.pillowqueens.com/) [FULL, curl]

Members half: searched by the lane on 2026-10-07.

40. [Black Moon Public House on Facebook](https://www.facebook.com/p/Black-Moon-Public-House-61557620630623/) [PARTIAL, exa web_fetch; page front only, login wall. Escalated: photo pages via exa (SOURCE_NOT_AVAILABLE), events tab (empty), image CDN via curl (403 or DNS fail). Needs Zaal's Chrome]
41. [Black Moon Public House on Instagram](https://www.instagram.com/blackmoonpublichouse/) [FAILED, public profile endpoint 401; Playwright and Chrome not connected]
42. [Black Moon Public House website](https://www.blackmoonpublichouse.com/) [PARTIAL, curl 403, exa reads menus and hours only]
43. [Bandsintown, Black Moon venue page](https://www.bandsintown.com/v/10472288-black-moon-public-house) [FAILED, curl 403]
44. [AllEvents, Black Moon organiser page](https://allevents.in/org/black-moon-public-house/24304169) [FULL, exa web_fetch] past events 13 Aug to 16 Sep 2026
45. [Ellsworth American search, "North Creek"](https://www.ellsworthamerican.com/search/?q=%22North+Creek%22) [FULL, curl] 2 hits, both unrelated
46. [WDEA search](https://wdea.am/?s=%22North+Creek%22) [FULL, curl] 0 hits
47. [ZAOstock Luma page](https://luma.com/vhwv9n2h) [FULL, exa search highlight] after-party copy and the day lineup
48. [zaostock.com/program](https://zaostock.com/program) [FULL, exa search highlight] "North Creek and friends" in body text
49. Bandcamp search for "north creek" [FAILED, bot challenge on curl and exa]

Searches run verbatim: `"North Creek" band Ellsworth Maine`; `"North Creek" band Maine Black Moon Public House`; `"North Creek" band Maine instagram OR facebook OR bandcamp OR spotify`; `"Treelock" "HiDef" Maine OR "Sam Savage" Ellsworth Maine musician`; exa: a Downeast Maine band named North Creek; exa: social posts about North Creek at Black Moon October 2026; exa: Facebook posts from Ellsworth naming North Creek.
