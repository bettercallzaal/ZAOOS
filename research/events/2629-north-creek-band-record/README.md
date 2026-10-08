---
topic: events
type: guide
status: research-complete
last-validated: 2026-10-07
superseded-by:
related-docs: "governance/2591-downeast-zao-decile-governance, governance/2589-ellsworth-chapter-in-person-vote, governance/2590-ellsworth-zaostock-2027-assembly, events/2588-zaostock-post-festival-reach, events/2326-zaostock-sponsor-leads-tiers"
original-query: "do deep /zao-research on northcreek"
tier: DEEP
---

# 2629 - North Creek: everything on record about DownEast ZAO's first artist, and what is not

> **Goal:** Put every fact about the band North Creek in one place with its source, measure how much of a press kit and a show history exists (little), and hand Zaal the eight decisions that unblock the new `bettercallzaal/north-creek` repo and the first DownEast ZAO show.

**Read this first.** North Creek is a band, not a venue. It played the ZAOstock 2026 after-party at Black Moon Public House, Ellsworth, on Sat 3 Oct 2026. It is DownEast ZAO's first artist relationship (Zaal, 2026-10-05). Beyond that, almost nothing about the band is on record: no members, genre, hometown, bio, photo, website or social account, and no channel to reach them other than through Black Moon. **Six web searches on 2026-10-07 found no public page for a Maine band called North Creek** (methods and queries in Sources). The record is also contradictory on two basic points, the act's name and whether the set was a band or a DJ set. This doc does not resolve those; only the band can.

## Key Decisions / Recommendations

| # | Decision | Recommendation | Why |
|---|---|---|---|
| 1 | Repo name | **KEEP `bettercallzaal/north-creek`.** Rename only if the band says its name is "North Creek and Friends" | The flyer, zaostock.com and Steve Peer's email all say "North Creek". The longer form appears only in Black Moon's August draft and the Drive intake folder (Findings 3) |
| 2 | License | **NO LICENSE YET: keep the placeholder, all rights reserved, repo private.** Revisit when the band says what is public | The repo holds facts about a third party who has not agreed to anything. A permissive license on day one would license the band's name and story before they have seen it |
| 3 | What is public | **NOTHING until Zaal asks the band.** One question to eties: what may DownEast ZAO post, print and send about North Creek | Zero of the press-kit fields came from the band (Findings 4). Publishing from this record would mean publishing Zaal's and Steve's paraphrases |
| 4 | Thank-you for 3 Oct | **SEND IT THIS WEEK, through Black Moon** (Steve or Katina), in the same message as the Black Moon thank-you | Owed since 4 Oct; the vault has no direct channel for any of the four after-party acts |
| 5 | First DownEast ZAO show | **ASK North Creek and Black Moon about Sat 14 Nov 2026**, Zaal himself, after the thank-you | The draft calendar already pairs it with the 2 pm governance pilot (doc 2589). Nothing has been asked of anyone |
| 6 | Footage | **ASK Zaal for the phone content and the "maceo" content** before anything else about media is planned | The ZAOstock media set has no after-party footage at all (Findings 5). The only recordings that may exist are those two |
| 7 | Press kit | **USE the fields file in the repo as the questionnaire**; do not fill it from the web | A web search returned nothing; the band is the only source for members, genre, hometown, bio and photos |
| 8 | Name and set-shape contradictions | **ASK, do not infer**: "North Creek" or "North Creek and Friends", and band set or DJ set | Two lanes have already recorded this evening wrong in opposite directions (Findings 2). The record cannot settle it |

## Findings

### 1. The one show on record, and its timeline

| Date (2026) | What happened | Source (surface read) |
|---|---|---|
| 17 Aug | A planning call had Black Moon's indoor block as "6 to 7 party, 7 to 8 hip-hop crew, 8 onwards North Creek" | ZAOstock `docs/plans/gdoc-update-2026-08-27.md` line 101 (git clone) |
| 26 Aug | Steve Peer's supply list ("Hanging around") offered to underwrite "North Creek and Friends" for one 6 to 9 PM block indoors | zao-vault `daily/2026-08-26.md` 21:10 entry; ZAOstock `docs/plans/gdoc-update-2026-08-27.md` line 89 |
| 27 Aug 22:3x | Zaal's round 9 verdict: "Somes Sound, North Creek, Aquavantes out" | zao-vault `daily/2026-08-27.md` night close |
| 2 Sep | Steve put "DJ Aquaventus and North Creek" back on the evening | ZAOstock `.handoffs/session-2026-09-03-zaostock-to-zj/README.md` line 72 |
| 7 Sep | Settled: North Creek at Black Moon, 6 to 9, framed as Black Moon's own evening. PR #126 merged 22:34 UTC | [ZAOstock PR #126](https://github.com/ZAODEVZ/ZAOstock/pull/126); `src/content/site.test.ts` line 17 |
| 14 Sep | A standup note recorded "a DJ, run by Steve, from six" instead. Later marked wrong | zao-vault `handoffs/status/antigravity.md` line 287; `people/Steve-Peer.md` |
| 19 Sep | Zaal: "Yes, North Creek 6 to 9 is on" | zao-vault `decisions/grill-2026-09-19-seat-afternoon.md` item 7 |
| 26 Sep | Steve's invoice email restated: "underwrite 'North Creek' for the after party. 6-9pm (approx.) on the indoor stage." PR #324 corrected every live surface | zao-vault `people/Steve-Peer.md`; [ZAOstock PR #324](https://github.com/ZAODEVZ/ZAOstock/pull/324) |
| 27 Sep | Zaal: close is 10 PM ("Yes, 10 PM is right"); the poster's "DJ" line and North Creek are the same act (relayed via the grill lane) | ZAOstock `src/content/program.ts` lines 100 to 115; zao-vault `inbox/agents/antigravity/20260927-211348-*.md` |
| 30 Sep | Black Moon's flyer arrived via the marketing Telegram group. Zaal ruled "Doors 6, music 7". PR #408 put the flyer on zaostock.com/afterparty | zao-vault `handoffs/status/zaostock.md` 30 Sep 10:54 and 11:00 EDT; [ZAOstock PR #408](https://github.com/ZAODEVZ/ZAOstock/pull/408) |
| 3 Oct | The show. Billed doors 6 PM, music 7 to 10 PM, all ages, at Black Moon | [zaostock.com/afterparty](https://zaostock.com/afterparty) (curl, raw text); [the flyer](https://zaostock.com/afterparty/flyer.jpg) (downloaded, read) |
| 4 Oct 09:36 EDT | Zaal: "A and it was awesome I'll get all my phone content and everything from maceo soon" (A = all four acts played) | zao-vault `decisions/grill-2026-10-04-orchestration-0150.md` item 4 |
| 5 Oct 20:47 EDT | Zaal: "i had a great talk with eties from north creek and he is exited to work more togetehr and do more shows and more" | zao-vault `decisions/grill-2026-10-05-zao-ellsworth-idea.md` item 4 |
| 7 Oct | Repo `bettercallzaal/north-creek` created on Zaal's word; PR #1 README, then the basic repo | [north-creek PR #1](https://github.com/bettercallzaal/north-creek/pull/1) |

Counts that matter: the booking went in, out, in, out and in (5 state changes) between 26 Aug and 26 Sep. ZAOstock PRs that touched the after-party copy: 9 (#67, #118, #126, #130, #324, #347, #365, #408, #421, per `gh api search/issues`). Public zaostock.com surfaces that name North Creek today: 5 (/afterparty, /program, /press, /ellsworth, llms.txt).

### 2. Two contradictions the record cannot settle

**Band set or DJ set.** ZAOstock's August `/program` copy described the block as "a live band for the evening, underwritten by the bar" (ZAOstock `docs/plans/surface-audit-2026-08-27.md` line 19). Black Moon's poster carried a "DJ" line for the same hours, and Zaal's 27 Sep ruling, as relayed, was that the DJ line and North Creek are one act (`src/content/program.ts` lines 106 to 109, marked "RELAYED, not witnessed"). The vault notes that two lanes got this evening wrong in opposite directions on 27 Sep (`inbox/agents/antigravity/20260927-211348-*.md`). Nobody has written down what North Creek actually performed.

**Which name.** "North Creek" on the flyer, zaostock.com and Steve's 26 Sep email. "North Creek and Friends" in Black Moon's 26 Aug draft (ZAOstock `docs/plans/gdoc-update-2026-08-27.md` lines 74, 99, 105) and as the act's folder in the ZAOstock artist intake tree on Drive, which held 0 files on 2026-09-06 (zao-vault `projects/zaostock-intake-tree-mismatch-2026-09-06.md`).

### 3. What the public record says, and does not

| Surface | What it says about North Creek | Method |
|---|---|---|
| zaostock.com/afterparty | Played; venue, address, times, all ages, the other three acts | curl plus HTML strip, FULL |
| Black Moon's flyer (1125 by 1500 px JPEG) | "BLACK MOON PUB PRESENTS AFTER PARTY / 7 PM ALL AGES / OVEN BAKED BEATS DJ AQUAVANTES AND MORE... / OCT 3RD / NORTH CREEK / TREELOCK & HiDEF / SAM SAVAGE / 142 MAIN ST / ELLSWORTH, ME". No genre, no set times per act | downloaded and read, FULL |
| ZAOstock press kit | Names them as billed, in Black Moon's own evening | repo clone, FULL |
| downeast-zao `docs/artist-and-venue-map.md` | "No public web page found in one search"; "Downeast? Not stated" | repo clone, FULL |
| General web (6 searches, 7 Oct) | No page for a Maine band called North Creek. Hits were North Creek, NY (a town) and unrelated "creek" bands | WebSearch extended and standard; DuckDuckGo and Bing HTML returned 0 parsed links |
| Black Moon Instagram | Page loads as a JS shell with no post text | curl, FAILED |
| Black Moon Facebook events | HTTP 400 | curl, FAILED |
| Black Moon website | HTTP 403 (Cloudflare challenge) | curl, FAILED |
| Ellsworth American "Autumn Gold schedule" | Mentions Black Moon 3 times, North Creek 0 | curl, FULL |

Negative result, stated as one: **no page naming the band was found in the places listed; the places not searched are Facebook and Instagram from a logged-in browser, Bandcamp and Spotify directly, and Black Moon's own event posts.** Those are Zaal's to read (Next Actions).

### 4. Press-kit coverage

Fields in the repo's `docs/press-kit.md`: 19. Filled from a source: 6 (act name, name variant, shows played, where named publicly, quotes, contact name as typed). UNKNOWN: 13, including members, hometown, genre, bio, photos, website, socials, streaming, fee. **Fields filled by the band: 0 of 19.**

The contact is recorded only as Zaal typed it, "eties", spelling unconfirmed, with no channel on file (`archive/desktop-2026-10-07/overnight-review-people.md` section 9: "The vault has no channel for any of them").

### 5. Footage: none of the after-party

From zao-vault `archive/desktop-2026-10-07/ZAOstock-2026-10-03-media-REPORT.txt` (final summary Sun 4 Oct 02:51 EDT):

| Source | Covers | After-party? |
|---|---|---|
| card-1-small-cam-timelapse, 4 time-lapses 11:25 to 21:07 | The parklet, from the small camera's own clock | The 17:40 to 19:34 and 20:25 to 21:07 lapses overlap the hours, but point at the parklet. Not checked frame by frame |
| camera-card-2, C2588.MP4, 24 min | Likely Tom Fellenz | No |
| card-3-drone-festival-day, 32 clips 10:02 to 17:37 | Outdoor day | No |
| card-4-sony-mobile-cam, C2584, C2586, C2587, C2585 (damaged) | Crown Vics, DCoop, LyonsDen, probably Grass Rug | No. "No Sony footage of ... the after-party" |
| Twitch replays, 6 parts | The 7 outdoor sets; sign-off at 17:50 per `docs/av/stream-run-sheet-2026-10-03.md` | No |
| Drive `ZAO Files > ZAO-Festivals > ZAOstock > 2026-10-03-raw` | 4 time-lapses, 1 drone clip, CATALOGUE.md before the upload paused | No |

What may exist: Zaal's phone content and "everything from maceo" (his words, 4 Oct). Who "maceo" is and what they shot is not on record. The ZAOstock artist intake folder for the act held 0 files.

### 6. Where North Creek sits in DownEast ZAO's plan

- DownEast ZAO's purpose, ruled 2026-10-05: "bringing artists together and promoting them". First relationship: North Creek (`decisions/grill-2026-10-05-zao-ellsworth-idea.md` item 4; downeast-zao `README.md` artist table).
- Draft Show 1: Sat 14 Nov 2026, evening, Black Moon, North Creek headlining, one Downeast opener (OPEN X or Michael Anderson suggested), paired with the 2 pm governance pilot from doc 2589. Fallback Fri 13 Nov. Phase 0 money rule: DownEast ZAO holds no money; pay-what-you-can goes to the artists (downeast-zao `docs/research/04-first-shows.md`).
- Grill item 45 (cadence) was pending when the downeast-zao lane closed 2026-10-06 (`handoffs/downeast-zao-2026-10-06.md`).
- Black Moon is already a HOT ZAOstock partner (doc 2326), so any ask to Black Moon about 14 Nov should be coordinated with ZAOstock's sponsors table.

### 7. What the new repo now holds

`bettercallzaal/north-creek`, private, branch `init/readme`, PR #1: README from the record (DownEast ZAO lane), then this lane's commit `20a6848` adding `.gitignore`, `LICENSE` (placeholder, "UNKNOWN, Zaal picks"), `CONTRIBUTING.md` (PRs only), `docs/shows.md`, `docs/press-kit.md`, `docs/media.md` and a repo map. Every row cites its file. No contact details. Scanned for em dashes, emojis, emails, phone numbers and retired names: 0 hits in 7 files.

## Staleness

- Everything here is as of 2026-10-07. The booking facts are closed (the show happened). The open items (thank-you, 14 Nov ask, footage) go stale within a week; re-check `zao-vault` decisions files before relying on them after 2026-10-14.
- Web absence is a 7 Oct measurement from a headless machine. A logged-in look at Facebook and Instagram could change Findings 3 the same day.

## Also See

- [governance/2591-downeast-zao-decile-governance](../../governance/2591-downeast-zao-decile-governance/) - the chapter North Creek is the first artist of
- [governance/2589-ellsworth-chapter-in-person-vote](../../governance/2589-ellsworth-chapter-in-person-vote/) - the 14 Nov governance pilot the draft show pairs with
- [governance/2590-ellsworth-zaostock-2027-assembly](../../governance/2590-ellsworth-zaostock-2027-assembly/) - ZAOstock 2027, Sat 18 Sep 2027
- [events/2588-zaostock-post-festival-reach](../2588-zaostock-post-festival-reach/) - post-festival reach, where act content gets seen
- [events/2326-zaostock-sponsor-leads-tiers](../2326-zaostock-sponsor-leads-tiers/) - Black Moon as a HOT partner
- Repos: [bettercallzaal/north-creek](https://github.com/bettercallzaal/north-creek), [bettercallzaal/downeast-zao](https://github.com/bettercallzaal/downeast-zao), [ZAODEVZ/ZAOstock](https://github.com/ZAODEVZ/ZAOstock)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Send the thank-you to the four after-party acts through Black Moon (Steve or Katina). Shipped when the message is sent and the date is written in `zao-vault/people/Steve-Peer.md` | @Zaal | Message | 2026-10-10 |
| Ask eties, in Zaal's own thread: name spelling, "North Creek" or "North Creek and Friends", band or DJ set, and what may be public. Shipped when the answers land in `north-creek/docs/press-kit.md` by PR | @Zaal | Conversation, then PR | 2026-10-14 |
| Pick the license for `bettercallzaal/north-creek` (A/B/C put to the Grill 2026-10-07). Shipped when `LICENSE` is replaced by PR | @Zaal | Grill ruling | 2026-10-10 |
| Collect the phone content and the "maceo" content from 3 Oct into the Drive raw folder, and list any North Creek clips in `north-creek/docs/media.md`. Shipped when the file lists them with the folder path | @Zaal | Files, then PR | 2026-10-17 |
| Look at Black Moon's Instagram and Facebook from a logged-in browser for the after-party post and any North Creek photo; add the URLs to `docs/press-kit.md`. Shipped when the row reads a URL or "checked, none" with the date | @Zaal | 10-minute check, then PR | 2026-10-14 |
| Ask North Creek and Black Moon about Sat 14 Nov 2026 (fallback Fri 13 Nov). Shipped when `docs/shows.md` moves the row from Drafted to a dated status | @Zaal | Ask, then PR | 2026-10-21 |
| Merge `north-creek` PR #1 once the Grill lines are answered | @Zaal | Merge | 2026-10-10 |

## Sources

Every item marks what was read and how. No source here was read through WebFetch.

**Primary record (git, read in full)**
1. [zaostock.com/afterparty](https://zaostock.com/afterparty) - [FULL, method: curl plus HTML strip, 43,796 bytes]
2. [Black Moon's after-party flyer](https://zaostock.com/afterparty/flyer.jpg) - [FULL, method: curl download, 356,547 bytes, image read]
3. [ZAOstock PR #126, Settle the evening: North Creek at Black Moon, 6 to 9](https://github.com/ZAODEVZ/ZAOstock/pull/126) - [FULL, method: gh api; merged 2026-09-07T22:34:19Z]
4. [ZAOstock PR #324, after-party act is North Creek, not Steve DJing](https://github.com/ZAODEVZ/ZAOstock/pull/324) - [FULL, method: gh api; merged 2026-09-26T17:16:42Z]
5. [ZAOstock PR #408, /afterparty page with Black Moon's flyer](https://github.com/ZAODEVZ/ZAOstock/pull/408) - [FULL, method: gh api; merged 2026-09-30T14:58:43Z]
6. [ZAOstock PR #443, past tense](https://github.com/ZAODEVZ/ZAOstock/pull/443) - [FULL, method: gh api; merged 2026-10-05T15:33:06Z]
7. [ZAODEVZ/ZAOstock](https://github.com/ZAODEVZ/ZAOstock) at `8bed0a9`: `src/content/site.ts`, `src/content/program.ts`, `src/content/site.test.ts`, `src/app/llms.txt/route.ts`, `docs/marketing/press-kit.md`, `docs/plans/gdoc-update-2026-08-27.md`, `docs/plans/surface-audit-2026-08-27.md`, `docs/av/stream-run-sheet-2026-10-03.md`, `.handoffs/DONE.md`, `.handoffs/session-2026-09-03-zaostock-to-zj/README.md` - [FULL, method: shallow clone and grep, 70 matching lines]
8. [bettercallzaal/downeast-zao](https://github.com/bettercallzaal/downeast-zao): `README.md`, `docs/artist-and-venue-map.md`, `docs/research/04-first-shows.md` - [FULL, method: shallow clone]
9. [bettercallzaal/north-creek PR #1](https://github.com/bettercallzaal/north-creek/pull/1) - [FULL, method: gh pr view and the checked-out branch]
10. zao-vault `origin/main` (fetched 2026-10-07): `people/Steve-Peer.md`, `archive/desktop-2026-10-07/ZAOstock-2026-10-03-media-REPORT.txt`, `archive/desktop-2026-10-07/overnight-review-people.md`, `archive/needs-zaal-snapshot-2026-09-07.md`, `daily/2026-08-26.md`, `daily/2026-08-27.md`, `decisions/grill-2026-09-19-seat-afternoon.md`, `decisions/grill-2026-10-04-orchestration-0150.md`, `decisions/grill-2026-10-05-zao-ellsworth-idea.md`, `handoffs/status/zaostock.md`, `handoffs/status/antigravity.md`, `handoffs/downeast-zao-2026-10-06.md`, `inbox/agents/antigravity/20260927-211348-*.md`, `projects/zaostock-intake-tree-mismatch-2026-09-06.md`, `zaostock-production-plan-20260826/DONE.md` - [FULL, method: `git show origin/main:<path>`; 60 files matched "north creek", 15 read in full or at the matching lines]

**Public web, for the negative result**
11. [Bangor Daily News, New pub opening in a prominent Ellsworth space (2024-04-11)](https://www.bangordailynews.com/2024/04/11/hancock/hancock-business/black-moon-public-house-opening-ellsworth-joam40zk0w/) - [PARTIAL, method: WebSearch result title and snippet only; establishes Black Moon on Main St, Ellsworth, nothing on the band]
12. [Ellsworth American, Hancock County boasts vibrant music scene](https://ellsworthamerican.com/living/living-entertainment/hancock-county-boasts-vibrant-music-scene) - [PARTIAL, method: WebSearch snippet; no North Creek in the snippet, body not read]
13. [Ellsworth American, Autumn Gold schedule](https://www.ellsworthamerican.com/features/autumn-gold-schedule/article_e4a430df-d38c-4641-a953-9389e7ce4873.html) - [FULL, method: curl plus HTML strip, 559,412 bytes; Black Moon 3 mentions, North Creek 0]
14. [Black Moon Public House on Instagram](https://www.instagram.com/blackmoonpublichouse/) - [FAILED, method: curl, HTTP 200 JS shell, 0 post text]
15. [Black Moon Public House, Main Street Maine listing](https://mainstreetmaine.org/listing/black-moon-public-house-ellsworth-me/) - [PARTIAL, method: WebSearch snippet; venue only]
16. [Black Moon Public House, Ellsworth Chamber directory](https://business.ellsworthchamber.org/directory/Details/black-moon-public-house-4219330) - [PARTIAL, method: WebSearch snippet; venue only]
17. [City of Ellsworth 2026 Summer Concert Series lineup PDF](https://www.ellsworthmaine.gov/wp-content/uploads/2026/07/2026-Summer-Concert-Series-_-list-of-bands.pdf) - [FULL via downeast-zao `docs/artist-and-venue-map.md`, which fetched it 2026-10-05; North Creek is not on it]
18. [Visit North Creek, Music by the River](https://visitnorthcreek.org/music-by-the-river/) - [PARTIAL, method: WebSearch snippet; this is North Creek, New York, a town, and the false positive every search returned]

**Searches run 2026-10-07 (queries verbatim)**: WebSearch extended `"North Creek" band Maine Ellsworth OR "Black Moon" OR Hancock County`; WebSearch standard `"North Creek and Friends" band`; WebSearch extended `"North Creek" band Maine facebook live music 2026`; WebSearch extended `"Black Moon Public House" Ellsworth after party October 3 2026 "North Creek" Treelock "Sam Savage" Aquavantes` (only hit naming the band: ZAOstock PR #408); WebSearch standard `"North Creek" band Bangor OR "Bar Harbor" OR "Blue Hill" OR Ellsworth Maine music`; DuckDuckGo HTML and Bing HTML `"North Creek" band Maine` (0 parsed result links). exa web_search: rate-limited, not run. Facebook events: HTTP 400. blackmoonpublichouse.com: HTTP 403.

**Escalation note (Hard Requirement 11).** Sources 11, 12, 15, 16 and 18 stay PARTIAL on purpose: each was read only far enough to confirm it is about the venue or a different North Creek, and none is load-bearing. Source 14 stays FAILED after curl; the next rung (a logged-in browser) is Zaal's and is in Next Actions. No community source (Reddit, HN, X) was found that mentions the band; that absence is itself the finding, not a skipped step.
