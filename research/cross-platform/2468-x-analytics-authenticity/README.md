---
topic: cross-platform
type: decision
status: research-complete
last-validated: 2026-09-06
superseded-by:
related-docs: "183, 355, 873"
original-query: "Let's keep on diving deeper into ways we can improve Zaal's x account analytics without sacrificing the authenticity /zao-research this" + "https://farcaster.xyz/gokhan/0xa8158740 also /zao-research this"
tier: DEEP
---

# 2468 — X analytics for @bettercallzaal without sacrificing authenticity

> **Goal:** Measure the account from data it already owns, ship the engagement
> pipeline that is already written and running nowhere, and close the 16 apps
> that can post as him - without adopting a single tool that games engagement.

## Key Decisions

| # | Decision | Why | Cost |
|---|---|---|---|
| 1 | **SCHEDULE `/api/cron/engagement-collect`.** It is written, tested, and absent from `vercel.json`. | The whole X analytics pipeline exists and runs nowhere. Five crons are scheduled; this is not one of them. | One line in `vercel.json` |
| 2 | **But fix its source first - it reads `publish_log`, so it only measures posts published THROUGH ZAOOS.** Zaal posts from iPhone (91.1% of 45,760 posts). | Scheduling it as-is would measure ~nothing and look like success. | Widen the query or accept it covers Firefly/ZAOOS posts only |
| 3 | **USE the X data archive as the analytics backbone, not a third-party tool.** It carries `favorite_count`, `retweet_count`, `full_text`, `created_at` and `source` for all 45,760 posts. | Free, complete, local, no API cap, no OAuth grant, nothing to game. | £0. 24-48h to generate, re-requestable every 24h |
| 4 | **BUY nothing.** Every read-only tool worth having costs $19-199/mo and adds less than the archive already gives. | `@bettercallzaal` already holds the best dataset about itself. | $0 |
| 5 | **CAP original posts at 3-10/day.** Measured on his own archive: 3-5/day averages 2.53 likes; 40+/day averages 0.77. | This is the single highest-leverage change and it *reduces* work. | Less posting |
| 6 | **REVOKE the 16 apps that can post as him and the 6 that read his DMs**, starting with `tweethunter [X]`. | An engagement-farming tool has had read+write+DM access since 2024-03-24. That is the authenticity risk, stated plainly. | Zaal's own hands - account settings |
| 7 | **DO NOT** adopt Buffer, Hootsuite, Sprout, Metricool, SocialPilot, Agorapulse or **Fedica**. | All bundle scheduling/automation. Fedica is *already connected* to his account. | Revoke, don't renew |

## Findings

### 1. The pipeline exists and is not scheduled

| Artefact | Path | State |
|---|---|---|
| Metrics fetcher | `src/lib/publish/x-insights.ts` (66 lines) | Written, tested (14 test cases) |
| Collector cron | `src/app/api/cron/engagement-collect/route.ts` | Written, tested, reads `publish_log`, writes `engagement_metrics` |
| Table schema | `scripts/archive/migrations-run/create-engagement-metrics.sql` | Defined - views, likes, replies, reposts, quotes, clicks, `fetched_at` |
| **Schedule** | `vercel.json` | **ABSENT.** 5 crons declared: `agents/vault`, `agents/banker`, `agents/dealer`, `juke-stale-rooms`, `heart-recovery` |

This is the estate's signature failure in its purest form: a tool that exists,
works, is tested, and runs nowhere.

**The brief for the `bczximprovement` lane says "Nothing currently reads it."
That is wrong** - `fetchXInsights` is imported and called at
`engagement-collect/route.ts:7` and `:117`. The problem is not that nothing
reads it. The problem is that nothing *runs* it.

**A second, subtler problem.** The cron selects from `publish_log` where
`platform='x'` and `status='published'` in the last 30 days. That is only posts
published *through ZAOOS*. Measured from the archive, **91.1% of his posts come
from Twitter for iPhone** and only 1.8% from Firefly. Scheduling the cron
without widening its source would produce a dashboard that is technically
working and substantively empty.

### 2. What his own archive already proves

45,760 tweets, 2023-04-01 to 2026-07-22, from `~/Desktop/twitterzip.zip`.

**Engagement is bimodal and the median is zero.**

| Segment | n | mean likes | median | p90 | max | zero-like |
|---|---|---|---|---|---|---|
| All posts | 45,760 | 1.12 | 0 | 3 | 222 | 59.6% |
| Original-ish | 31,171 | 1.03 | 0 | 3 | 222 | **77.2%** |
| Replies | 14,589 | 1.31 | **1** | 3 | 24 | 21.9% |

**Replies outperform original posts.** 21.9% of replies get zero likes against
77.2% of originals. Any "post more" strategy is optimising the weaker half.

**Volume is inversely related to per-post engagement.** This is a dose-response
curve on his own data, 1,127 days:

| Original posts that day | posts | mean likes | zero-like |
|---|---|---|---|
| 3-5 | 358 | **2.53** | 63.7% |
| 6-10 | 1,014 | 1.90 | 55.4% |
| 11-20 | 4,640 | 1.54 | 61.8% |
| 21-40 | 8,719 | 1.09 | 73.7% |
| 40+ | 16,355 | **0.77** | 85.0% |

Busiest day: 163 original posts. The 1-2/day bucket (n=85) is excluded from the
recommendation - too small, and likely travel days rather than deliberate
restraint.

**And he is already fixing it without measuring it.** Volume down ~75%,
engagement up ~4x:

| Quarter | posts | median | mean | zero-like |
|---|---|---|---|---|
| 2024Q2 | 5,370 | 0 | 0.55 | 90.4% |
| 2025Q2 | 1,285 | 0 | 1.84 | 52.5% |
| 2025Q4 | 2,172 | 1 | 2.44 | 48.0% |
| 2026Q2 | 1,344 | 1 | 1.99 | 41.5% |
| 2026Q3 (partial) | 239 | **2** | **3.13** | **29.3%** |

The instinct is right and nothing in the estate was recording it.

**What actually lands** (top originals by likes): a reintroduction post before
ZAO-CHELLA (222L), a 2,000-follower milestone (124L), an Art Basel recap (77L),
ZABAL updates (67L, 61L), a WatchTower Space recap (65L). All first-person,
all specific, none of them engagement bait. The authentic voice is already the
best-performing voice - that is measurable, not a hope.

### 3. The authenticity risk is not the metrics, it is the OAuth grants

28 connected applications at 2026-07-22, from `data/connected-application.js`:

| Capability | Count |
|---|---|
| read | 28 |
| **write - can post as him** | **16** |
| **directmessages - can read his DMs** | **6** |
| emailaddress | 12 |

The six with DM access: `tweethunter [X]`, `Firefly Web App`, `Firefly Web3`,
`MediaPilot`, `MediaPilotApp`, `0xppl cross posting`.

Specific concerns, in order:

- **`tweethunter [X]`**, granted 2024-03-24, holds `read, write, directmessages,
  emailaddress`. Tweet Hunter is a growth/engagement tooling product. It is the
  single clearest contradiction of an authenticity-first account, and it can
  read his DMs.
- **`Fedica`** (2024-08-30) is on the market survey's *avoid* list for bundling
  scheduling and bulk posting - and it is already connected.
- **`SongjamSpace`** (2025-11-26) still holds `read, write`. Per `CLAUDE.md`
  that partnership was retired on 2026-07-31; the OAuth grant outlived the
  relationship.
- **`MediaPilot` and `MediaPilotApp`** are two separate grants, both with DM
  access, two weeks apart.
- **`1917251619592318976bettercallz`** (2026-07-06) is an app named after a
  numeric account id. Unidentifiable from the archive.
- **323 posts** came from a client X has since scrubbed to
  `erased8036141_052BSwz4Zo` - the posts read "Live with Restream", so it is a
  retired Restream integration, not an intrusion. Worth knowing it is inert.

Revoking these is **Zaal's own hands** - account security settings are outside
what any lane may touch.

### 4. What the API actually costs now

X moved off the Free/Basic/Pro tier ladder to pay-per-usage on **2026-04-20**.

| Tier | Cost | Caps | `public_metrics` on own posts |
|---|---|---|---|
| Free | $0 | 500 posts, **100 reads/month** | Yes |
| Owned reads | **$0.001/resource** | uncapped | Yes |
| General reads | $0.005/resource | 3M posts/month | Yes |
| Enterprise | $42,000/month min | 50M+ | Yes |

**The code comment in `x-insights.ts` line 7 - "Works on the Free tier (read
access for owned tweets)" - is still accurate in September 2026.** It was worth
checking; it could easily have gone stale.

But the **100 reads/month free cap is the real constraint**, and it is small.
`engagement-collect` reads every X post from the last 30 days on every run.
At 3-10 posts/day that is 90-300 reads *per run*, so a daily cron blows the free
cap on day one. At the owned-read rate, a daily run over ~200 posts costs
**$0.20/month**. Budget a dollar and stop thinking about it.

### 5. What the archive cannot tell him

**No impressions.** `tweets.js` carries `favorite_count` and `retweet_count` but
**not** `impression_count` or view counts. Likewise `follower.js` and
`following.js` are account ids with **no dates** - already established in
`~/zao-vault/projects/x-archive-analysis-2026-09-06.md`, where the same archive
gave 7,502 following / 4,993 followers / 48.5% mutual.

So: the archive is the historical backbone; `analytics.x.com` (free basic tier,
~28 days, CSV export up to 30 days / 3,000 posts) is the impressions layer; the
API is the automated top-up. Three sources, one of them free and already owned.

### 6. The Farcaster cast Zaal sent

Gökhan Turhan, 2026-09-06, 5 likes / 1 recast / 0 replies
([cast](https://farcaster.xyz/gokhan/0xa8158740)):

> deployed a plaintext "decentralized" bulletin platform and only one guy
> showed up ... monetizing every logic gate is the biggest stupidity the
> blockchain rails offered

Two things make this worth citing rather than decorative.

**One:** it is a public, unembarrassed report of a build that nobody showed up
for - posted by someone who kept the receipt instead of deleting it. That is the
behaviour this doc is arguing for. An account that can say "one guy showed up"
is an account whose good numbers mean something.

**Two:** the cast itself has 5 likes. Against this archive's median of 0 for
original posts, 5 is a good post. **The unit of comparison has to be your own
distribution, not an imagined one.** Every recommendation here is calibrated
against Zaal's own median, which is why "3.13 mean likes in 2026Q3" reads as
real progress rather than a small number.

The warning against "monetizing every logic gate" is the same argument applied
to measurement: instrumenting every interaction changes what you post. Measure
the account, not each post.

## Also See

- [Doc 183](../183-social-connections-x-integration/) - X integration surface
- [Doc 355](../355-autonomous-social-distribution-2026/) - distribution automation
- [Doc 873](../873-best-free-way-read-x-article/) - X fetch ladder
- `~/zao-vault/projects/x-archive-analysis-2026-09-06.md` - the graph side of the same archive
- `~/zao-vault/handoffs/bczximprovement.md` - the lane; correct its "nothing reads it" line

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Revoke `tweethunter [X]`, `Fedica`, `SongjamSpace`, the duplicate `MediaPilot`/`MediaPilotApp`, and `1917251619592318976bettercallz` at x.com/settings/connected_apps - shipped when the connected-apps list shows 23 or fewer | @Zaal | Account security (his hands only) | 2026-09-08 |
| Widen `engagement-collect` beyond `publish_log` so it measures iPhone posts, then add `{"path":"/api/cron/engagement-collect","schedule":"0 5 * * *"}` to `vercel.json` - shipped when `engagement_metrics` has rows with `platform='x'` | @Zaal | PR to ZAOOS | 2026-09-13 |
| Set an X API spend cap of $5/month and confirm owned-read billing is active - shipped when the developer portal shows a non-zero cap | @Zaal | Config | 2026-09-13 |
| Fill `Current goals` and `Best-performing examples` in `~/.claude/skills/platform/profiles/x.md`, using the top-10 posts in Finding 2 as the examples - shipped when neither field reads "TO FILL" | @Zaal | Doc edit | 2026-09-08 |
| Correct `handoffs/bczximprovement.md` job 4: `x-insights.ts` IS read by the cron; the defect is that the cron is unscheduled - shipped when the brief says so | @Zaal (Claude) | Vault edit | 2026-09-06 |
| Hold original posts to 3-10/day for 30 days, then re-run the quarterly table against a fresh archive - shipped when 2026Q4 has a row in Finding 2 | @Zaal | Behaviour + measurement | 2026-10-06 |

## Sources

**Primary data (this account's own, highest confidence):**

- `~/Desktop/twitterzip.zip` `data/tweets.js` - 45,760 tweets, 2023-04-01 to 2026-07-22 — **[FULL]** — method: `unzip` + `json.loads`, all statistics computed locally
- `~/Desktop/twitterzip.zip` `data/connected-application.js` - 28 apps with permission arrays — **[FULL]** — method: same
- `~/Desktop/twitterzip.zip` `data/following.js` + `follower.js` — **[FULL]** — method: same

**Codebase (ZAO OS V1):**

- `src/lib/publish/x-insights.ts`, `src/app/api/cron/engagement-collect/route.ts`, `vercel.json`, `scripts/archive/migrations-run/create-engagement-metrics.sql` — **[FULL]** — method: direct read

**Official docs:**

- [X API pricing](https://docs.x.com/x-api/getting-started/pricing) — **[FULL]** — method: subagent fetch
- [X API data dictionary](https://docs.x.com/x-api/fundamentals/data-dictionary) — **[FULL]** — confirms all 6 `public_metrics` fields
- [X API owned-reads pricing change, 2026-04-20](https://devcommunity.x.com/t/x-api-pricing-update-owned-reads-now-0-001-other-changes-effective-april-20-2026/263025) — **[FAILED - HTTP 403]** — the $0.001 figure is corroborated by the docs.x.com pricing page above, not taken from this URL
- [X post activity dashboard help](https://business.x.com/en/help/campaign-measurement-and-analytics/tweet-activity-dashboard) — **[PARTIAL - 403 on direct fetch, content via search result]**
- [How to download your X archive](https://help.x.com/en/managing-your-account/how-to-download-your-x-archive) — **[FAILED - HTTP 403]** — archive contents verified against the actual file instead, which is stronger

**Community:**

- [Gökhan Turhan, Farcaster, 2026-09-06](https://farcaster.xyz/gokhan/0xa8158740) — **[FULL]** — method: `api.farcaster.xyz/v2/user-cast?username=gokhan&hashPrefix=0xa8158740`, raw JSON
- [HN: New Twitter API pricing starts at $42,000/month](https://news.ycombinator.com/item?id=35094729) - 47pts, 23 comments, 2023-03-10 — **[FULL]** — method: HN Algolia API. Dated; cited only for the Enterprise floor
- [HN: Filter out engagement bait on your X feed](https://news.ycombinator.com/item?id=42609151) - 71pts, 128 comments, 2025-01-06 — **[FULL]** — method: HN Algolia API
- [HN: Vanity metrics](https://news.ycombinator.com/item?id=14167843) - 79pts, 2017 — **[FULL]** — method: HN Algolia API

**Third-party tool survey** — **[FULL]** — [Brand24](https://brand24.com/blog/twitter-analytics-tools/), [Sprout Social](https://sproutsocial.com/insights/twitter-analytics-tools/), [iTechGuides 2026](https://www.itechguides.com/13-best-free-twitter-x-analytics-tools-in-2026-whats-actually-free/)

### Flags

- **Contradiction resolved:** early-2024 sources say X Premium is required for
  any analytics; a 2024-11 announcement made basic analytics free and 2026 docs
  confirm the correction. The doc uses the current position.
- **Unverified:** no official source publishes the retention window for
  `analytics.x.com`. "~28 days" is consistent across guides but not documented.
- **Staleness risk:** X changed its pricing model on 2026-04-20, five months
  ago. Re-validate pricing before committing spend.
- **Not verified:** that `engagement_metrics` and `publish_log` exist in the
  live ZAOOS Supabase project. The `supabase-cowork` MCP points at the cowork
  project (tasks, meetings, contacts), not ZAOOS, and returned zero rows for
  both names - that is the wrong database, **not** evidence the tables are
  missing. The schema file is the evidence they were created.
