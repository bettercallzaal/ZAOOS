---
topic: media
type: comparison
status: research-complete
last-validated: 2026-10-14
superseded-by:
related-docs: "media/2674-gmfarcaster-media-model (PR 3942), media/2676-builder-writer-models-sap-shaw-griffith (PR 3944), media/2305-devcon-builder-series-distribution"
original-query: "https://x.com/davidondrej1 Research this guy too he will teach us a lot (seat brief: David Ondrej, X, YouTube, his AI agents courses and community; same method as doc 2676: cadence, format, titles, voice, how he turns builds into content and content into a paid community, growth signals, the one thing he does that Zaal does not, what to borrow for the Sunday roundup, BCZ YapZ and YouTube; watch for the AI-course-seller pattern and say which parts are substance and which are funnel)"
tier: STANDARD
---

# 2678 - David Ondrej as a model: what is substance, what is funnel, and what Zaal borrows

> **Goal:** Measure how David Ondrej turns builds into YouTube videos and videos into revenue, separate the substance from the course-seller funnel, and rank what Zaal borrows for the Sunday roundup, BCZ YapZ and YouTube.

## Key Decisions / Recommendations

| # | Borrow or skip | Surface it touches | Effort |
|---|---|---|---|
| 1 | BORROW the guest-workflow episode. His best video in the last 15 by far is an interview: "Vercel CEO reveals his Agentic Engineering Workflow", 147,592 views; the second-best guest format, "Ex-Apple dev reveals his Agentic Engineering Workflow", has 62,385. The median of the 15 is 19,897. BCZ YapZ already interviews builders; the change is framing each episode around the guest's concrete workflow, and saying so in the title. | BCZ YapZ episode prep and YouTube titles | S |
| 2 | BORROW "ship the code, then make the video about it." His newest video launches his own open-source product (Cloudroom, `cloudroom-core` 473 GitHub stars) and links the two GitHub repos first in the description. His `skills` repo has 4,134 stars. Zaal ships more repos than he narrates; one Sunday "Built this week" line per doc 2676, and an occasional video walking through one build, closes that gap. | Sunday roundup "Built this week", YouTube | M |
| 3 | BORROW the description order: the thing to try first, then the code, then the follows. His description opens "Try Cloudroom yourself", then the core and GUI GitHub links, then Instagram and X. Ours should open with the one action (join the Fractal, try the guest's product), then bczyapz.com, then follows. | YouTube descriptions, the episode block | S |
| 4 | DO NOT copy the paid-community funnel. His Skool community, "New Society", is $77/month with 323 members, sold with an income claim ("I built my AI company to $155,000 ARR using nothing but AI coding tools"), "No coding experience needed", and "Nobody on YouTube gives you the details". Its single public review is 1 star. The ZAO's model is contribution and Respect, not a paid course; an income-claim course would cut against it. | - | - |
| 5 | DO NOT copy reaction volume. 15 uploads in 24 days (21 Sep to 14 Oct 2026), many reacting to model releases ("Opus 5.5 is Here", "Grok 4.7 is out"), backed by a paid team (his hiring page offers a video editor $4,000/month plus a share of AdSense). Zaal does not have the team, and The ZAO's topic is not model news. | - | - |
| 6 | NOTE the one thing he does that Zaal does not: he owns a single topic (AI coding and agents) on every surface, in every title. Zaal's surfaces carry several topics (music, the Fractal, festivals, builds). The Sunday roundup's fixed sections are how Zaal gets one recognizable shape without dropping topics. | Sunday roundup | - |

## Measured (fetched 2026-10-14)

| Signal | David Ondrej | Zaal | Source |
|---|---|---|---|
| X followers | 70,741 (@DavidOndrej1, joined April 2023) | 5,186 (@bettercallzaal, joined February 2023) | FxTwitter API |
| X posts | 12,174 | 48,756 | same |
| YouTube subscribers | 420K | 66 | channel page HTML |
| Uploads, last 15 | 21 Sep to 14 Oct 2026: 15 in 24 days | 11 Sep to 14 Oct 2026 | channel RSS |
| Median views, last 15 | 19,897 (min 2,933, max 147,592) | 17 | channel RSS |
| Title shape | a claim or a reveal ("Stop coding, build Software Factories instead", "The only moat in the age of AI is this") | "BCZ YAPZ w/<guest>", "Listening to some <artist>" | channel RSS |
| Description links, last 15 | cloudroom.dev 6, x.com 6, github.com 4, Instagram 4, Spotify 3, tracking links for PostHog, Supabase and CodeRabbit (likely sponsors, not confirmed) | - | channel RSS descriptions |
| Course or community link in the last 15 descriptions | none (the words "course", "community", "skool" do not appear) | - | same |
| Product | Cloudroom: Free $0, Pro $50/month, Ultra $500/month, open-source core | none sold | cloudroom.dev, /pricing |
| Paid community | New Society on Skool: $77/month, 323 members, 1 review at 1.0 | none | skool.com/new-society |
| GitHub | 28 public repos, 1,145 followers; skills 4,134 stars, jailbreak-autoresearch 527, cloudroom-core 473 | 112 public repos | `gh api` |

The numbers on his own hiring page are older than the live ones (it says 385,000+ YouTube subscribers and 55,000+ X followers; the channel and X read 420K and 70,741 today). The Vectal figures on that page and on the Skool page (70,000+ users, $155K ARR "at peak") are his claims and are UNVERIFIED here.

## Substance and funnel, said plainly

**Substance (worth learning from):**
- Open-source code people use: `skills` (4,134 stars, pushed 2026-10-14) and `cloudroom-core` (473 stars).
- Interviews where a known builder shows a real workflow; these are his best-performing videos.
- A product with a free tier and public pricing, launched in a video that links the code first.
- Volume and consistency: about four uploads a week for the period measured.

**Funnel (do not copy):**
- The $77/month Skool community, sold on an income claim and "no coding experience needed".
- "Subscribe if you're serious about AI." as a stock line in descriptions.
- Clickbait claim titles ("Cloudroom just destroyed all AI coding apps") that the video itself has to justify.
- Self-reported numbers that do not match the live counts.

The funnel has moved: none of his last 15 descriptions links the course. Today the videos sell Cloudroom, his own product, and the course sits behind his name rather than his videos.

## Also See

- media/2674-gmfarcaster-media-model (ZAOOS PR 3942) - the Sunday roundup shape and episode block
- media/2676-builder-writer-models-sap-shaw-griffith (ZAOOS PR 3944) - the "Built this week" line and the searchable-title test this doc builds on
- [media/2305-devcon-builder-series-distribution](../2305-devcon-builder-series-distribution/) - the BCZ interview checklist

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Frame the next BCZ YapZ guest around one workflow ("how <guest> builds <thing>") and title it that way; done when the episode is up with that title | @Zaal | Episode prep + YouTube | 2026-10-21 |
| Reorder BCZ YapZ YouTube descriptions: one action first, then bczyapz.com, then follows; done when the next upload's description opens with the action | @Zaal | YouTube Studio | 2026-10-21 |
| Add the "try this first" line to the episode block in the Sunday roundup structure; done when the lane's Sunday 18 Oct draft carries it | paragraph lane | Draft | 2026-10-16 |

## Sources

- X profile @DavidOndrej1 and @bettercallzaal - [FULL, method: FxTwitter API, 200 responses; FxTwitter gave 404 on some first tries earlier the same day and 200 on retry]
- [YouTube @DavidOndrej](https://www.youtube.com/@DavidOndrej) - [FULL, method: channel page HTML for the subscriber count; channel RSS for the last 15 uploads with views and full descriptions]
- YouTube @bettercallzaal RSS - [FULL, method: channel RSS, same day, as in doc 2674]
- [cloudroom.dev](https://cloudroom.dev/) and [cloudroom.dev/pricing](https://cloudroom.dev/pricing) - [FULL, method: curl + HTML strip]
- [skool.com/new-society](https://www.skool.com/new-society) - [FULL, method: curl + HTML strip; price, member count, sales copy and the one review read; quotes short and attributed]
- [davidondrej.com](https://davidondrej.com) - [FULL, method: curl + HTML strip; a hiring page with self-reported numbers]
- GitHub user davidondrej and repos skills, cloudroom-core, cloudroom-gui - [FULL, method: `gh api`]
- Hacker News, Algolia API, queries "david ondrej", vectal, cloudroom - [FULL, method: API; no hit about him or his products: every top hit is an unrelated match (Humanloop, Vecta.io, AWS CloudFormation)]
- Reddit - [NOT ATTEMPTED - reddit.com returned 403 to this lane's search earlier the same day (doc 2674), so no Reddit claim is made]

Credit: the practices studied are David Ondrej's. Quotes are short and attributed; his pages are linked, not reproduced.
