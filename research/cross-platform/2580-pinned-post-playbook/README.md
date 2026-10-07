---
topic: cross-platform
type: guide
status: research-complete
last-validated: 2026-10-01
superseded-by:
related-docs: "cross-platform/2468-x-analytics-authenticity, cross-platform/2244-posting-platform-decision, cross-platform/1261-linkedin-profile-copy-july2026, cross-platform/987-linkedin-personal-brand-playbook, cross-platform/183-social-connections-x-integration"
original-query: "we need to do more research on what makes a good pinned post can u deep research this please (Zaal, 2026-10-01, with the ZAOstock pinned post draft of 2026-09-30 pasted: seven platform versions, Firefly 238/280)"
tier: DEEP
---

# 2580 - What makes a good pinned post, measured against @bettercallzaal's own data and the ZAOstock pin

> **Goal:** Decide what the ZAOstock pinned post should look like, on X, Farcaster,
> LinkedIn and Facebook, from what can be measured rather than what guides assert -
> starting with 2,297 of Zaal's own originals, then 40-odd outside sources, each marked by
> how much of it was actually read.

**Read this first.** The outside literature on pinned posts is almost entirely vendor
blogs with unsourced numbers ("up to 600% more engagement" appears in three of them and
traces to nothing). The two things that ARE measurable are Zaal's own archive, which says
**a photo matters more than anything else and a body link costs little**, and the
platforms' own mechanics, which say **LinkedIn is retiring pins for a Featured section,
Facebook now caps link posts on free Pages at two a month, and Farcaster has no profile
pin at all, only a channel pin**. The ZAOstock draft of 2026-09-30 is sound copy in the
one shape his audience rewards least: text plus a link, no image.

## Key Decisions

| # | Decision | Why | Cost |
|---|---|---|---|
| 1 | **ADD AN IMAGE to the pinned Firefly post** - the ZAOstock poster or a Franklin Street photo - before it is pinned. | His own data, two datasets: a photo roughly doubles median views (204 vs 116, n=290 recent originals) and lifts mean likes from 2.98 to 6.26 (n=2,007, 12 months). "Link, no media" is the second-worst of four shapes at 3.14 mean likes; "media, no link" is the best at 6.57. 12 of his 15 most-liked posts of the year carry a photo. The one thing every guide fetched agrees on (Sprout 2016 "include an eye catching image", BeeReach 2026, Xholic 2026) matches his numbers. | One image attached in Firefly. Zero copy change. |
| 2 | **KEEP zaostock.com IN THE BODY. Do not move it to a reply.** | Three reasons. (a) X's head of product and Musk said on 2026-07-28/29 there is no link penalty, "We haven't for over a year" (posts fetched verbatim). (b) The only body-vs-reply test found (The Annex, 2025-10) had the body link at 413 impressions and 11.5 clicks vs 178 and 8 for the reply version: a reply halves the audience that ever sees the link. (c) In his own Jul-Sep posts, link posts were seen MORE, not less (153 vs 125 median views). A pinned post is read by someone who came to the profile; the one job of that slot is to hand them the URL. | None. |
| 3 | **PIN IT THROUGH SATURDAY 3 OCTOBER, THEN SWAP THE PIN ON SUNDAY 4 OCTOBER** to a recap post with media and the same URL. Do not leave the pre-event copy pinned "a week plus". | Every practitioner source that addresses it says the same thing: "If the launch is over, the pin should move" (Xholic); "never resurface a post that references a specific date, event, or price that has since changed" (Postinstantly); "An old event or webinar promotion after the date has passed" is on Bullock's never-pin list. The draft's date-naming keeps it from LYING after the 3rd, but a pinned "saturday october 3" read on October 8 still reads as a past event. His own best-performing shape per `profiles/x.md` is the recap ("The questions were sharp", 65 likes), so the swap is also the better post. | One more draft, Sunday morning. This lane prepares it; Zaal taps. |
| 4 | **LENGTH IS FINE. Do not pad the Firefly post toward 280 and do not cut it under 80.** | 80 to 159 characters is the best bucket in both of his datasets (4.64 mean likes; 155 median views); under 80 is the worst in both. 238 sits in the next bucket, which is within noise of the best. The outside data on length is confounded and contradicts itself (PlayerSells +15% for 280+ on accounts over 1.6M followers; Flypost within-creator: "There is no sweet spot"). | None. |
| 5 | **ONE LINK, ONE ASK, which the draft already has.** Keep "program, artists, live, and after: zaostock.com" as the single call to action. | The only peer-reviewed CTA data (Quesenberry and Coolsen, 1,000 brand tweets, accepted 2024) finds CTAs non-significant, and MDPI 2021 (2,416 posts) finds "multiple calls to action within one message decrease engagement." One is the right number; the measured penalty is for several. | None. |
| 6 | **LinkedIn: USE THE FEATURED SECTION on in/zaalp, which has never been set up, and FEATURE (not pin) the post on the zaofestivals Page.** Put the LinkedIn version there with the image and the link in the body. | LinkedIn help: "The ability to pin a post on your LinkedIn Page is being discontinued. You can instead feature a post." Profile Featured is unlimited (400 shown), newest first, hidden when empty, invisible to logged-out viewers and to search. The zm lane confirmed on 2026-09-29 that Zaal's Featured section is empty. Link-in-comments on LinkedIn is unproven in 2026 (the two biggest datasets "couldn't test it"), and a Featured item is read by someone already on the profile, where reach penalties matter least. | Zaal's hands, 2 minutes, logged in. The lane cannot do it (zm lane: the paste was BLOCKED by the permission classifier on 2026-09-29). |
| 7 | **Facebook: PIN TO THE zaofestivals PAGE'S FEATURED SECTION, and CHECK THE PAGE'S LINK ALLOWANCE FIRST.** If the Page is on the free Meta One tier, zaostock.com in the pinned post is one of two link posts allowed that month; put the URL in the Page's Intro and in a comment instead if the slots are needed for the recap. | Meta Help, "About links in organic Facebook Page posts and comments" (source 46): "you can include links in up to 2 organic posts or comments per month" on Free and Essential; "Limits on posts and comments with links may not apply to all Pages." Pinned items "remain in the Featured section until you remove them." Nothing about this is readable from outside Facebook; it is the Page admin's check. | One look at the Page's Meta One tier. |
| 8 | **Farcaster: there is NO profile pin. "Pin" means a CHANNEL pin.** Pin the cast in /zao (host action), and use the notify-followers option once, for the pin that goes up on show morning. | Farcaster API: `PUT /fc/pinned-casts` "Pin (and optionally announce) a cast to a channel, replacing any currently pinned cast", body `notifyChannelFollowers` defaults false. A channel owner on GM Farcaster ep229 (2025-03-26): pinning with notify "can immediately notify all of the followers of that channel". One pin per channel, so the Saturday-morning pin replaces the pre-event one. | Zaal's tap in the Farcaster client. No lane can pin. |
| 9 | **WRITE THE PIN'S EXPIRY INTO THE LEDGER ROW, not a calendar cadence.** For ZAOstock: expires 2026-10-04 00:00 ET. | The guides disagree on cadence by an order of magnitude (30 days, Twitter10k and Tweetloft; 30 to 90, Xholic; 3 to 6 months, SocialNexis; quarterly, Postory) and none of them measured it. The one rule they share is a condition, not a date: swap when the goal it served is over. An event pin's condition is the event. | One column in `handoffs/status/x-account.md`'s drafts ledger. Done in this doc's PR to the vault. |
| 10 | **DO NOT buy or connect a pin-scheduling or "evergreen resurfacing" tool.** | Doc `cross-platform/2468-x-analytics-authenticity` decision 7 already rules out Buffer, Hootsuite, Sprout and Fedica; every pinned-post guide fetched is marketing for one of them (Postinstantly, Tweetloft, Xholic, SuperX, Witty, SocialNexis). The 600%-engagement figure they share has no source. | None; it is a refusal. |

## Findings

### A. What @bettercallzaal's own audience rewards - measured, two datasets

**Dataset 1: the X data archive**, `data/tweets.js`, 45,760 posts to 2026-07-22. Doc
`cross-platform/2468-x-analytics-authenticity` recorded it as missing from disk on
2026-09-25; it is in Google Drive at `My Drive/Zaal Twitter/twitterzip.zip` (16.2 GB,
file date 2026-07-29), read on 2026-10-01. Filter: the archive's last 12 months
(2025-07-23 to 2026-07-22), originals only - no replies, no retweets, no quote posts.
**n = 2,007.** Engagement is `favorite_count` as of the archive export.

| Feature | n | mean likes | median | p90 | share with 5+ likes |
|---|---|---|---|---|---|
| no external link in body | 1,287 | 4.52 | 3 | 11 | 35% |
| external link in body | 720 | 3.25 | 2 | 7 | 23% |
| no media | 1,348 | 2.98 | 2 | 7 | 21% |
| photo | 581 | 6.26 | 5 | 12 | 51% |
| video | 78 | 6.51 | 5 | 14 | 58% |
| photo or video, no link | 581 | **6.57** | 5 | 13 | 54% |
| link, no media | 642 | **3.14** | 2 | 7 | 21% |
| link + media | 78 | 4.17 | 4 | 9 | 36% |
| no link, no media | 706 | 2.84 | 2 | 6 | 20% |
| under 80 chars (links stripped) | 919 | 3.55 | 2 | 9 | 26% |
| 80 to 159 chars | 526 | **4.64** | 3 | 11 | 35% |
| 160 to 279 chars | 536 | 4.34 | 3 | 9 | 34% |
| 280+ chars | 26 | 4.92 | 4 | 11 | 46% |
| opens with "ZM" | 724 | 4.34 | 3 | 10 | 32% |
| does not | 1,283 | 3.91 | 3 | 9 | 30% |

His 15 most-liked originals of the year: **14 of 15 carry no external link, 12 of 15
carry a photo**, and the top two (67 and 61 likes) are 229 to 249 character
ecosystem updates - the "ZABAL UPDATE" shape already named in
`~/.claude/skills/platform/profiles/x.md`.

**Dataset 2: the Wayback-resolved log**, `zao-vault/projects/x-account/posted-log.tsv`,
every post 2026-07-23 to 2026-09-29 with `views` as fxtwitter returned them on
2026-09-30 (method and recall control in `zao-vault/projects/x-account/README.md`).
Originals only, **n = 290.** This set has views, which the archive does not.

| Feature | n | median views | median likes | mean likes |
|---|---|---|---|---|
| no link | 193 | 125 | 3 | 5.29 |
| link | 97 | 153 | 5 | 5.10 |
| no media | 213 | 116 | 2 | 3.41 |
| photo | 70 | **204** | **8** | 10.13 |
| video | 7 | 285 | 14 | 11.57 |
| link, no media | 88 | 148 | 5 | 4.78 |
| no link + media | 68 | 206 | 8 | 10.53 |
| link + media | 9 | 239 | 7 | 8.22 |
| no link, no media | 125 | **47** | 1 | 2.44 |
| 80 to 159 chars | 87 | 155 | 5 | 5.80 |
| under 80 chars | 142 | 115 | 2 | 4.73 |

**What the two datasets agree on, and where they do not:**

- **Media is the dominant variable, in both.** A photo roughly doubles median views
  (204 vs 116) and quadruples median likes (8 vs 2) in the recent set, and doubles mean
  likes in the year-long set (6.26 vs 2.98). Nothing else moves the numbers this much.
- **The link penalty is real in likes over the year (3.25 vs 4.52) but does not show in
  views in the recent set (153 vs 125 median, the link posts were seen MORE).** The
  year-long gap is confounded: a large share of his link posts are app-generated
  ("I just distributed ... Empire Builder", "Just bought access to ... WaveZStation")
  and those draw little engagement for reasons other than the link. Read it as: a body
  link does not help, a photo does, and the decisive factor is whether the post is
  something a person wrote.
- **Length:** 80 to 159 characters is the best bucket in both sets; under 80 is the
  worst in both. The pinned Firefly draft is 238 characters, inside the next bucket,
  which is fine. The 280+ bucket is too small (26 and 4) to read.
- **"ZM" opener:** a small lift (4.34 vs 3.91), consistent with it being his signature
  rather than a lever.
- **"Neither link nor media" is the floor** in both sets (2.84 mean likes; 47 median
  views). The pinned draft as it stands is "link, no media": not the floor, but the
  second-worst shape in the year-long set.

### B. X pinned-post mechanics, and what the ranking code says

**First-party text: UNANSWERED.** `help.x.com/en/using-x/how-to-pin-a-tweet` and two
sibling URLs returned HTTP 403 (Cloudflare "Just a moment...") to curl and
SOURCE_NOT_AVAILABLE to exa; the Wayback Machine "has not archived that URL" for either
the x.com or the twitter.com form (checked 2026-10-01). Everything in this section about
the pin itself is therefore second-hand, from three 2025-2026 vendor guides that agree
with each other:

- One pinned post per profile; pinning a new one replaces the old one; it carries a
  "Pinned" label; it sits above the time-ordered profile feed. Quote posts can be pinned,
  plain reposts cannot. Premium is not required. (Postinstantly 2026, Xholic 2026-07-19,
  BeeReach 2026-06-16.)
- Whether a pinned post appears in followers' timelines: one r/Twitter commenter (score 1,
  thread score 10) says it does with "pinned" above it and that frequent re-pinning for
  reach was curtailed. No source. Treat as hearsay.
- Whether a pinned post can be edited: no fetched source addresses it. UNANSWERED.

**The ranking code.** Two reads, two vintages:

- `twitter/the-algorithm-ml`, `projects/home/recap/README.md`, weights dated "April 5,
  2023" (read via `gh api`, FULL): fav 0.5, retweet 1.0, reply 13.5, good_profile_click
  12.0, reply_engaged_by_author 75.0, negative_feedback_v2 -74.0, report -369.0. The
  README: "The exact weights in the file can be adjusted at any time." `FEATURES.md` lists
  `has_link`, `has_visible_link`, `link_count` as model INPUTS; no weight on them is
  documented anywhere in the repo.
- PPC Land, 2026-09-21, reading X's newer `param.rs` (published 2026-08-13): ShareViaCopyLink
  20.0, Reply 5.0, Quote 5.0, Follow 4.0, Repost 1.0, Like 0.5, Click 0.4, OpenLink 0.2,
  Report -234.0. Secondary reporting of a GitHub file, FULL via curl of the article. The
  largest positive weight is someone copying the post's link, which is what a good pinned
  post gets done to it.

**The link question, in the platform's own words, verbatim via `zao-fetch-x.sh`:**

| Date | Who | Post | Text |
|---|---|---|---|
| 2023-10-03 | Musk | 1709244708533264592 | "links don't get as much attention, because there is less time spent if people click away" |
| 2024-11-24 | Musk to Paul Graham | 1860812342210240995 | "Just write a description in the main post and put the link in the reply. This just stops lazy linking." |
| 2026-07-28 | Nikita Bier (head of product) | 2082217171506344297 | "@finkd Hello Mark, you do not need to put the links in replies anymore." |
| 2026-07-29 | Musk to Paul Graham | 2082273378749268440 | "We haven't for over a year" |
| 2026-07-29 | Steven Adler | 2082280105880273074 | "there were various indirect negative pressures on them? Which might still exist" |

So the official position reversed in July 2026, and the measured data has not caught up
(section E).

**Farcaster.** No profile-level pin exists in anything fetched: the Farcaster API
reference, Neynar's User schema and the Warpcast API docs. What exists is a channel pin:
`PUT /fc/pinned-casts` - "Pin (and optionally announce) a cast to a channel, replacing any
currently pinned cast" - with `notifyChannelFollowers` defaulting to false, and a
`pinnedCastHash` field on the channel object (field present in the docs repo by
2024-10-08). Neynar exposes it as `pinned_cast_hash`. Launch date UNANSWERED. So for
the ZAOstock pin on Farcaster, the unit is the /zao channel, the actor is its host, and
the notify flag is a one-shot push to every channel follower.

**Festival pinned posts as examples: could not be read.** `api.fxtwitter.com/<handle>`
returns a profile object with no pinned field (checked on coachella, sxsw, glastonbury);
vxtwitter returned a Cloudflare challenge; syndication 429; a Wayback copy of x.com/sxsw
had no "pinned" text; facebook.com returned HTTP 400 to two Page fetches. Three real
festival pins need a logged-in look, which is a one-minute tap for Zaal and is in Next
Actions. No example in this doc is invented.

### C. LinkedIn: Featured, not pinned, and the link-in-comments fight

**Mechanics, from LinkedIn's own help pages (fetched raw, 2026-10-01):**

- A personal profile has a **Featured section**, not a pin. It takes posts, articles,
  external links and uploaded media. "You can add an unlimited number of items to the
  Featured section. However, only 400 items will be displayed." Newest shows first unless
  reordered. "If you don't have any content to feature, your Featured section will be
  hidden." Viewers must be logged in, and "The content included in your Featured section
  will not be discoverable through search." (help a552452, a550399)
- A company Page: **"The ability to pin a post on your LinkedIn Page is being
  discontinued. You can instead feature a post."** Pinning, while it lasts, is one post at
  a time and discards audience targeting (a547158). Page Featured holds "up to six posts"
  per a1658061 and the help index, but "up to three" per the 2024-04-16 LinkedIn Marketing
  blog and the older pin page. **Unresolved; six is the newer figure.**
- Post limit: 3,000 characters (a528176).
- Zaal's own Featured section has never been set up: doc
  `cross-platform/1261-linkedin-profile-copy-july2026` and the zm lane's 2026-09-29 status
  record the About field empty and Featured pins "never attempted".

**Link in body vs link in comments, LinkedIn.** The practitioner literature is split and
the numbers are vendor first-party. Sorted by sample size:

| Source, date | Sample | Claim, verbatim where it carries a number |
|---|---|---|
| Goodman citing van der Blom, 2026-06 | 1.3M posts | one body link cuts median reach "18.8%"; comments with external links suppressed "by up to 80%" (the 80% is not tied to a dataset in what was fetched) |
| MagicPost, 2026-06-05 | 566,957 posts | preview card 414 vs 795 median impressions ("-48%"); a bare URL in the body with no card, 858 median, no penalty |
| LinkPost via Outfeed, 2026-09-24 | 358,000 posts | 448 vs 705 median impressions with and without a link |
| Flypost, 2026-07 | 130,000 posts | a link costs "about 12% of reactions"; 40% of creators did better WITH links; link-in-first-comment: "We couldn't test it either way" |
| Hootsuite study via TopRank, 2024-02-19 | undated | "posts without links got 6x more reach than posts with links" |
| Sprout Social, 2023-04-26 | one month, one account | link-in-comments 8,136 impressions vs 3,309 |
| r/linkedin "30 clients", 2025-12-10, score 9 | 30 clients | "around 2 percent" link penalty if the post earns 10 likes in 15 minutes |

**Contradiction, stated plainly:** Sprout (2023), Growth Rocks (2021) and Lenkli (2025)
say put the link in the first comment. Goodman (2026), Meiku (2026, "In 2026, it barely
helps") and the top r/linkedin thread of the year (score 89, 2026-08-06: "link in comments
embarrassing though that one won't die because every AI model recommends it") say it no
longer works. The two largest datasets that tried to test it (Flypost; the 130k-post OP)
say they could not. The only first-party LinkedIn word found is second-hand: a product
director reported in 2025-09 as saying LinkedIn does not intentionally limit link reach.
**So for LinkedIn the measured position is: a body link costs somewhere between 2 and 19
percent of reach depending on whose data, the preview card may be the real cost, and the
comment workaround is unproven in 2026.** For a pinned or Featured post, where the reader
has already chosen to look at the profile, the reach penalty matters least of anywhere.

### D. Facebook: a Featured section, a link cap, and nothing readable from outside

- Pages: "you can pin posts, upcoming events and recent videos for display in the Featured
  section at the top of your Page... Pinned items remain in the Featured section until you
  remove them." No limit stated; r/facebook (2025-10-01) reports an A/B split, "up to 6
  posts, while others can only pin up to 3", and that Pages lost the ability to pin an
  upcoming event. (Meta Help, "Pin items to the top of your Facebook Page", source 44)
- Groups: admins pin posts and rules to a Featured section; public-group pins are visible
  to anyone off Facebook. (Meta Help, "Pin a post or group rules to the Featured section of your Facebook group", source 45)
- Facebook Events: **no official help page describes pinning a post inside an event.** A
  vendor guide (Postbase, 2025-10-31) says the event Discussion tab has "Pin Post".
  UNVERIFIED first-party.
- **The link cap is the finding that matters for a Page.** Meta Help (source 46),
  "About links in organic Facebook Page posts and comments": "you can include links in up
  to 2 organic posts or comments per month" on the Free and Essential Meta One tiers;
  Advanced 8, Expert 20, Max unlimited. Links to Facebook, Instagram, WhatsApp and Threads
  do not count; "Additional links in the comments of a post where you've already included
  a link" do not count. TechCrunch, 2025-12-17, reported it as "a limited test"; Social
  Media Today, 2026-09-17, reports it expanded with Meta One for Business. **A pinned Page
  post with zaostock.com in it spends one of two monthly link slots on a free Page.** The
  help page also says the limits "may not apply to all Pages", so the zaofestivals Page
  must be checked by its admin, not assumed.
- Real festival Pages could not be read: facebook.com returned HTTP 400 to curl on two
  Pages, and exa's logged-out render of three others showed no pin state. FAILED, three
  methods, no example invented.

### E. Engagement evidence from outside, by variable

**Links on X.** The data all predates or straddles the July 2026 reversal.

| Source, window | Sample | Finding, verbatim where numbered | Read |
|---|---|---|---|
| Buffer, Aug 2024 to Aug 2025 | 18.8M posts, 71,000 accounts | "Link posts had 0% engagement rate on regular accounts; ~0.28% engagement rate on Premium accounts." Advice to use replies is Buffer's opinion; no reply arm was measured. | FULL, curl |
| arXiv 2410.17390v3, 2025-08-04 | 40M+ tweets, 9M users, two political datasets | "systematically penalizes tweets containing links to external resources, reducing their visibility by up to a factor of eight." | PARTIAL, exa |
| PlayerSells, 30 days to 2026-10-01 | 31,957 accounts, 672,293 posts, same-account | outbound link "41.3% below the engagement of the same accounts' other posts (95% interval -42.1% to -40.5%)"; its own caveat: "a lower outcome is not the same thing as algorithmic suppression." Rolling window, vendor unknown. | FULL, curl |
| The Annex, 2025-10-11 | n unstated, "my methodology was probably crap" | body link 413 impressions, 11.5 clicks; link in reply 178 impressions, 8 clicks; "little more than one third of people who saw the original post expanded the thread" | PARTIAL, exa |
| PPC Land, 2026-01-21 | one A/B pair | linked 3,670 views vs 65,400; also reads the code as having no explicit URL penalty | PARTIAL, exa |
| Buffer 2015 | 1M tweets | "approximately 25.1% more engagement" without links | PARTIAL, exa |

Read together with section A: the penalty on X is indirect and shrinking, the reply trick
cuts the audience for the link roughly in half in the one test that tried it, and for an
account his size the measured effect is small either way. Decision 2 follows.

**Media on X.**

| Source | Finding | Read |
|---|---|---|
| Buffer, State of Social Media Engagement 2026 (52M+ posts, no X n for the format cut) | "Text posts led with a median engagement rate of 3.56%. Images at 3.40%. Video at 2.96%. Link posts at 2.25%." | FULL, curl |
| PlayerSells, same-account, 1,851,122 posts | image or video "+111.4%" vs "-50.2%" without | PARTIAL, exa |
| Promptslove, 21,864 viral posts (selected sample) | a naive `http` flag counted native media as links (+9.9%); the corrected off-platform flag gave -32.7% | FULL, curl |
| His own archive (section A) | photo 6.26 vs no media 2.98 mean likes; 204 vs 116 median views | FULL, local |

The outside sources contradict each other on image vs text (Buffer near parity;
PlayerSells +111%). His own data is unambiguous, and it is the data that matters for his
account. Decision 1 follows.

**Length.** PlayerSells (accounts over 1.6M followers): 280+ characters "+15.3%", under 80
"-7.8%", and its own page changed between two reads. Flypost (LinkedIn, 83,495 posts,
within-creator, same-format): "There is no sweet spot at 1,300 characters, or anywhere
else." Buffer 2015 favored 20 to 40 characters and called it not significant. His own
data: 80 to 159 best, under 80 worst, both sets. Decision 4 follows.

**Hooks and structure.** X: UNMEASURED; nothing beyond opinion was found. LinkedIn,
within-author: Ligosocial (134,522 posts) "Posts whose first line opens a story got +31%
engagement vs the same author's bold-claim openers"; Flypost: opening in first person was
"worth about +20%" and the only hook archetype that beat a creator's baseline. Both
LinkedIn, both PARTIAL reads. Transfer to X is an assumption, stated as one.

**Call to action.** Quesenberry and Coolsen (1,000 brand tweets, accepted Aug 2024, FULL
via pdftotext): "call to action posts (β = .01, ns)" for retweets, ns in all three
models. MDPI Sustainability 13(7):3812 (2,416 posts, 2015 data): "multiple calls to action
within one message decrease engagement." X-specific 2024-2026: UNMEASURED. Decision 5.

**Refresh cadence.** No measurement exists. Twitter10k ("374 posts... across 210 unique
accounts", method unclear): stale after 60 days, swap after 30 without a conversion.
Tweetloft: "Never leave a pin untouched for more than 30 days." Xholic: "30 to 90 days."
SocialNexis: "every 3 to 6 months", and the page contradicts itself on its own numbers.
Postory: quarterly for evergreen, weekly for promotional. Witty: "Update immediately when
campaigns end." The shared rule is the condition, not the number. Decision 9.

### F. The 2026-09-30 ZAOstock draft, line by line against the above

| Element | As drafted | Verdict | Basis |
|---|---|---|---|
| Firefly text, 238 chars | "ZM. ZAOstock 2026. franklin street closes, one stage opens. 8 independent acts, noon to six. saturday october 3, ellsworth maine. free, all ages, rain or shine. black moon takes the evening. program, artists, live, and after: zaostock.com" | KEEP | one idea per clause, one link, one ask, names the date; 238 chars is within noise of his best bucket |
| Media | none | **ADD a photo** | section A: the single largest lever in his data |
| Link placement | body, last | KEEP | decisions 2; a pinned post exists to hand over the URL |
| "ZM" opener | present | KEEP | his signature; small measured lift (4.34 vs 3.91) |
| Date-naming | "saturday october 3" everywhere | KEEP, and SWAP the pin on 2026-10-04 | decision 3; date-naming stops it lying, not aging |
| Duration | "pinned for a week plus: before, during and after" | **CHANGE to: pinned through 3 October, recap pinned from 4 October** | every guide fetched; his own best post shape is the recap |
| X group chat and Farcaster /zao GC versions | long-form, insider | KEEP as is | GCs have no pin and no algorithm; length limits do not apply |
| Farcaster | treated as the same post via Firefly | ADD: the cast is pinned in /zao by the host, with notify, on show morning | section B, Farcaster has no profile pin |
| LinkedIn | one post, link on its own line | KEEP the copy; FEATURE it on the profile and the Page, do not look for a pin | section C |
| Facebook | one post with zaostock.com | KEEP the copy; check the Page's link allowance before posting | section D |
| Posting time | "08:00 to 13:00 ET" | KEEP | `profiles/x.md`, measured 2026-09-07 from the same archive |
| Repeat risk | none | CLEAR | `projects/x-account/posted-log.tsv`: nothing pinned-shaped in 1,259 posts to 2026-09-29 |

### G. Contradictions, left unresolved on purpose

1. **X link penalty.** Official: gone "for over a year" (Musk, 2026-07-29). Measured: linked
   posts still trail (PlayerSells to 2026-10-01, -41.3%; Buffer to 2025-08, 0%). Both can
   be true: "no penalty" and "linked posts do worse" are different claims, and Adler's
   "indirect negative pressures" is the bridge. Nobody has measured body vs reply after
   July 2026.
2. **Link in reply.** Musk 2024 and Buffer 2025 say do it; Bier 2026 says unnecessary; the
   only test (The Annex) says it halves who sees the link. On LinkedIn the same fight,
   with the two largest datasets unable to test it.
3. **Image vs text on X.** Buffer 2026 near parity; PlayerSells +111%; his archive +110%.
4. **Length.** Raw curves favor long; within-creator controls flatten it; his data favors
   80 to 159.
5. **LinkedIn Page Featured count.** "up to six" (help a1658061) vs "up to three" (older
   help page and the 2024-04-16 blog).
6. **Facebook Page pin count.** Help page states no limit; r/facebook reports 3 or 6 by
   A/B bucket.
7. **Pin refresh cadence.** 30 days to 6 months across six guides, none measured.

### H. What could not be established

- The official X help text on pinning (403, no Wayback copy), and whether a pinned post
  can be edited.
- Whether a pinned post reaches followers' timelines or only profile visitors (one hearsay
  comment says timelines).
- Any real festival account's pinned post, on any platform, from this machine.
- Whether a Facebook Event has a pinnable post (vendor claim only).
- A Farcaster profile pin (none found; absence of evidence).
- Any measurement of pinned-post staleness or refresh cadence, anywhere.
- Anything about engagement on a pinned post specifically, as opposed to posts in general.
  The 600% figure in three guides has no source.

## Also See

- `cross-platform/2468-x-analytics-authenticity` - the archive as the analytics backbone;
  decision 7 there rules out the tools this doc's sources are selling. **Correction to its
  2026-09-25 note:** the archive is not missing, it is in Google Drive at
  `My Drive/Zaal Twitter/twitterzip.zip` and was read for this doc.
- `cross-platform/2244-posting-platform-decision` - why posting stays manual via Firefly.
- `cross-platform/1261-linkedin-profile-copy-july2026` and
  `cross-platform/987-linkedin-personal-brand-playbook` - the Featured section this doc
  says to finally fill.
- `~/zao-vault/projects/x-account/README.md` and `posted-log.tsv` - the Wayback method and
  the 1,259 posts, with the recall control.
- `~/.claude/skills/platform/profiles/x.md` - posting window and best-performing examples,
  same archive.
- `~/zao-vault/handoffs/status/x-account.md` - the drafts ledger that records the pin and
  its fate.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Pin the Firefly post WITH a poster or street photo attached; paste the x.com URL back to the x-account lane so the ledger row closes. Shipped = URL in `handoffs/status/x-account.md` ledger | @Zaal | tap | 2026-10-02 13:00 ET (inside the posting window, the day before) |
| Draft the Sunday recap post (media + zaostock.com, same voice) and stage it as block 1 of the socials-hub. Shipped = hub rebuilt, ledger row with expiry 2026-10-04 | @x-account lane | draft | 2026-10-04 09:00 ET |
| Swap the pin to the recap on X; pin the recap cast in /zao with notify once. Shipped = URLs pasted back | @Zaal | tap | 2026-10-04 |
| Add an `expires` column to the drafts ledger and fill it for the pin (2026-10-04). Shipped = vault PR merged | @x-account lane | PR | 2026-10-02 |
| Fill the LinkedIn Featured section on in/zaalp with the LinkedIn version (image + link); feature the Page post on zaofestivals. Shipped = visible logged-in | @Zaal | tap | 2026-10-02 |
| Check the zaofestivals Facebook Page's Meta One tier and link allowance before pinning; pin to Featured. Shipped = pinned, tier noted in the ledger row | @Zaal | tap | 2026-10-02 |
| Look at three festival accounts' pinned posts on X while logged in (any three) and paste text + whether they carry media and a date; the lane folds them into section B. Shipped = three rows in this doc | @Zaal | tap, 3 minutes | 2026-10-06 or wontfix |
| Request a fresh X data archive after the festival so the pin's own numbers can be read (doc 2468's open action). Shipped = zip in Drive | @Zaal | tap | 2026-10-06 |
| Re-measure section A with the post-festival archive and record what the pinned post itself did. Shipped = "Updated" note in this doc | @x-account lane | re-research | 2026-10-20 |

## Sources

Method key: curl = raw fetch with the house UA and an HTML strip; exa = exa web_search or
web_fetch; gh = `gh api`; fx = `zao-fetch-x.sh` tier 0 (api.fxtwitter.com); AS = Arctic
Shift via `zao-fetch-reddit.sh`; local = file on this machine. FULL means the content was
read; PARTIAL names what is missing; FAILED names what was tried.

**Own data**
1. `data/tweets.js` in `My Drive/Zaal Twitter/twitterzip.zip` (16.2 GB, 2026-07-29), 45,760 posts to 2026-07-22. FULL, local.
2. `~/zao-vault/projects/x-account/posted-log.tsv`, 1,259 posts 2026-07-23 to 2026-09-29 11:51 UTC, views as fxtwitter returned them 2026-09-30. FULL, local; method and recall control in the README beside it.
3. `~/.claude/skills/platform/profiles/x.md`, posting window measured 2026-09-07. FULL, local.

**X, official and code**
4. https://help.x.com/en/using-x/how-to-pin-a-tweet - FAILED: HTTP 403 Cloudflare (curl), SOURCE_NOT_AVAILABLE (exa), "has not archived that URL" (Wayback, x.com and twitter.com forms).
5. https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md and FEATURES.md - weights "April 5, 2023". FULL, gh.
6. https://github.com/twitter/the-algorithm - README and home-mixer/README.md; created 2023-03-27, pushed 2025-09-08. FULL, gh.
7. https://ppc.land/x-gives-copy-link-shares-a-feed-weight-of-20-against-0-5-for-likes/ - 2026-09-21, reads param.rs. FULL, curl.
8. https://ppc.land/how-xs-algorithm-silently-kills-your-links-without-explicitly-penalizing-them/ - 2026-01-21. PARTIAL, exa (the underlying Colombo post not fetched).
9. https://x.com/elonmusk/status/1709244708533264592 (2023-10-03), https://x.com/elonmusk/status/1860812342210240995 (2024-11-24), https://x.com/nikitabier/status/2082217171506344297 (2026-07-28), https://x.com/paulg/status/2082271238437712279 and https://x.com/elonmusk/status/2082273378749268440 and https://x.com/sjgadler/status/2082280105880273074 (2026-07-29). FULL, fx.

**X, measured**
10. https://buffer.com/resources/links-on-x/ - Oct 2025, 18.8M posts. FULL, curl.
11. https://buffer.com/resources/x-premium-review/ - 2025-10-02. FULL, curl.
12. https://buffer.com/resources/state-of-social-media-engagement-2026/ - 52M+ posts, no X n for the format cut. FULL, curl.
13. https://arxiv.org/html/2410.17390v3 - 2025-08-04, 40M+ tweets. PARTIAL, exa excerpt.
14. https://playersells.com/insights/links-and-reach and https://playersells.com/insights/tweet-length - rolling 30-day windows, accounts over 1.6M followers, page changed between reads. FULL, curl.
15. https://theannex.blog/2025/10/11/stop-worrying-about-algorithmic-suppression/ - 2025-10-11, n unstated. PARTIAL, exa.
16. https://promptslove.com/blog/studied-viral-x-tweets-research/ - 21,864 selected posts. FULL, curl.
17. https://blog.hootsuite.com/linkless-tweets-experiment/ - 2021-01-25, 269 tweets. PARTIAL, exa.
18. https://buffer.com/resources/twitter-data-1-million-tweets/ - 2015. PARTIAL, exa.
19. https://www.qrbd.org/QRBD/Articles/QRBD11-2-Article3.pdf - Quesenberry and Coolsen, accepted Aug 2024, 1,000 tweets. FULL, curl + pdftotext.
20. https://www.mdpi.com/2071-1050/13/7/3812 - 2021, 2,416 posts. PARTIAL, exa excerpt.

**X, pinned-post guides (vendor; no primary numbers)**
21. https://sproutsocial.com/insights/pinned-tweet/ - 2016-03-09. FULL, curl.
22. https://beereach.io/blog/how-to-pin-a-tweet-on-x-twitter-in-2026-steps-strategy-and-examples - 2026-06-16. PARTIAL, exa.
23. https://xholic.ai/blog/twitter-pinned-tweet/ - 2026-07-19. PARTIAL, exa.
24. https://postinstantly.com/guides/how-to-pin-a-post-to-the-top-of-your-x-profile and https://postinstantly.com/guides/how-to-schedule-evergreen-tweets-to-resurface-old-wins - 2026. PARTIAL, exa.
25. https://superx.so/blog/how-to-pin-tweets - 2025-02-19. PARTIAL, exa.
26. https://lilachbullock.com/what-to-pin-top-of-business-twitter-profile/ - 2026-08-16. PARTIAL, exa.
27. https://twitter10k.com/twitter-pinned-tweet - 2026-04-04, "374 posts". FULL, curl.
28. https://socialnexis.com/guides/x-pinned-post-conversion - 2026-05-14, internally inconsistent. FULL, curl.
29. https://witty.so/playbook/content-systems/pinning-strategy (2026-01-19), https://postory.io/blog/twitter-pinned-tweet-strategy (2026-05-22), https://tweetloft.com/blog/twitter-pinned-tweet-strategy-to-get-more-followers (2026-05-12). PARTIAL, exa.
30. https://buffer.com/resources/pinned-tweet/ and https://later.com/blog/pinned-tweet/ - FAILED, 404 (guessed URLs).

**Farcaster**
31. https://docs.farcaster.xyz/reference/farcaster/api - `PUT /fc/pinned-casts`, `pinnedCastHash`. PARTIAL, exa (direct curl 404).
32. https://github.com/farcasterxyz/docs/commit/16b4cd8e - 2024-10-08, field present. PARTIAL, exa diff snippet.
33. https://neynar.readme.io/reference/lookup-cast-by-hash-or-warpcast-url - `pinned_cast_hash` on Channel; User schema truncated. PARTIAL, exa.
34. https://gmfarcaster.com/episodes/ep229/transcript - 2025-03-26, auto-transcript. PARTIAL, exa.

**LinkedIn**
35. https://www.linkedin.com/help/linkedin/answer/a552452 - Featured FAQs. FULL, curl.
36. https://www.linkedin.com/help/linkedin/answer/a550399 - manage Featured. FULL, exa.
37. https://www.linkedin.com/help/linkedin/answer/a547158 - "Pin posts on your LinkedIn Page", discontinuation notice. FULL, exa.
38. https://www.linkedin.com/help/linkedin/answer/a1658061 - feature a post on a Page, "up to six". PARTIAL, exa snippet.
39. https://www.linkedin.com/help/linkedin/answer/a528176 - 3,000 characters. PARTIAL, exa snippet.
40. https://www.linkedin.com/business/marketing/blog/linkedin-pages/new-features - 2024-04-16, "three". PARTIAL, exa.
41. https://sproutsocial.com/insights/linkedin-link-in-comments/ (2023-04-26), https://growthrocks.com/blog/linkedin-abtest-link-in-comment/ (2021-08-25), https://blog.hootsuite.com/linkedin-algorithm/ (2026-07-14), https://outfeed.ai/blog/linkedin-algorithm/ (2026-09-24), https://magicpost.in/blog/linkedin-algorithm-2026 (2026-06-05), https://www.flypost.io/learn/linkedin-algorithm-study-data (2026-07), https://lenkli.com/blog/marketing/linkedin-link-strategy-2026 (2025-11-28), https://meikuio.com/linkedin-algorithm-2026/ (2026-06-06), Goodman 2026-06-01 on LinkedIn Pulse and Substack. All PARTIAL, exa snippets.
42. https://www.flypost.io/learn/linkedin-post-length - 83,495 posts, within-creator. FULL, curl.
43. https://ligosocial.com/research/linkedin-post-length - 134,522 posts. PARTIAL, curl returned 19 bytes, exa excerpt.

**Facebook**
44. https://www.facebook.com/help/www/235598533193464 - pin to a Page's Featured section. FULL, exa.
45. https://www.facebook.com/help/www/1395974820512040 - pin in Groups. FULL, exa.
46. https://www.facebook.com/help/1929252614431792 - "About links in organic Facebook Page posts and comments", link cap. FULL, exa; no date on page.
47. https://techcrunch.com/2025/12/17/facebook-is-testing-a-link-posting-limit-for-professional-accounts-and-pages/ - 2025-12-17. PARTIAL, exa.
48. https://trypostbase.com/resources/how-to-make-a-featured-post-on-facebook-page and https://trypostbase.com/resources/how-to-message-everyone-in-a-facebook-event - 2025-10-31. PARTIAL, exa.
49. https://www.facebook.com/lollapalooza and https://www.facebook.com/BonnarooMusicFestival - FAILED, HTTP 400 (curl); three other festival Pages PARTIAL via exa with no pin state shown.

**Community**
50. https://www.reddit.com/r/linkedin/comments/1vgwgxq/ - "I analyzed 130,000 LinkedIn posts", score 89, 2026-08-06. FULL (27 comments), AS.
51. https://www.reddit.com/r/linkedin/comments/1pj8lxy/ - "studied across 30 clients", score 9, 2025-12-10. PARTIAL, AS.
52. https://www.reddit.com/r/linkedin/comments/1sf2fj5/ (score 1, 2026-05-01), https://www.reddit.com/r/copywriting/comments/1q5ji9v/ (score 2, 2026-01-06), https://www.reddit.com/r/SocialMediaMarketing/comments/nljdum/ (score 2, 2021), https://www.reddit.com/r/facebook/comments/1lwo9o9/ (score 1, 2025-10-01). FULL or PARTIAL as noted in section C and D, AS.
53. https://www.reddit.com/r/Twitter/comments/1ku4ddp/ (score 10), https://www.reddit.com/r/Twitter/comments/ow7tli/ (2021), https://www.reddit.com/r/Twitter/comments/fdhg7q/ (2020), https://www.reddit.com/r/podcasting/comments/i6lqvg/ (2020), https://www.reddit.com/r/GrowthHacking/comments/1o4pbrr/ (score 1, 36 comments). FULL, AS.
54. Hacker News via https://hn.algolia.com/api/v1 : items 45807775 (647 points, 2025-11-04), 45183039 (249, 2025-09-09), 48165828 (52, 2026-05-17), 42277963 (112, 2024-11-29), 42281445 (13), and comments 42680769, 46503199, 45039397, 47784269. FULL, API. No HN thread on the July 2026 reversal was found.
