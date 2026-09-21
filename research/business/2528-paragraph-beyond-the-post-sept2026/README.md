---
topic: business
type: audit
status: research-complete
last-validated: 2026-09-21
superseded-by:
related-docs: "business/2527-paragraph-features-unused-sept2026, business/429-paragraph-agents-launch-apr2026, business/1348-zao-newsletter-paragraph-paid-tiers-jul2026, business/322-paragraph-publishnew-newsletter-agent-commerce, cross-platform/2189-paragraph-brand-growth-playbook, business/2348-newsletter-craft-paragraph-mcp, business/1066-zaoonparagraph-buildout, identity/1270-zao-newsletter-paragraph-canonical-jul2026"
original-query: "Overnight research (2026-09-20 23:50 EDT, Zaal asleep): research more of what Paragraph can do, building on doc 2527. Focus: the content API, cross-posting kinds, scheduling, email, analytics, and the rendering defects. Addendum at 23:50 EDT added a Starter-plan section after Zaal upgraded @thezao mid-run: credit costs per agent action, automations and outbound risk, chat channels/Telegram, the 900+ tool directory, the daily brief, and custom domains versus the rendering defect."
tier: DEEP
---

# 2528 - Paragraph beyond the post: the content API, email, scheduling, analytics, and the two-route rendering defect

> **Goal:** Go past doc 2527's inventory of unused Paragraph features into how the platform's own documentation (docs.paragraph.com, its OpenAPI spec, and its pricing page) says these surfaces actually work, tested read-only against the live `@thezao` publication on the night @thezao was upgraded to Starter. Correct 2527 where tonight's evidence differs.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Doc source for everything below** | USE `docs.paragraph.com` going forward, not memory or 2527's inference. It is a public Fumadocs site with a raw-markdown mirror at `<path>.md` (curl, no auth, no JS) and it documents the exact fields the REST API and MCP expose. 2527 had to infer from field lists; tonight's doc reads the prose. |
| **Post scheduling** | USE `scheduledAt` (Unix ms, max 30 days out, draft-only, `null` cancels) and `sendNewsletter` (bool) on `PUT /v1/posts/{postId}`, read straight from the public OpenAPI spec at `github.com/paragraph-xyz/paragraph-sdk-js/blob/main/openapi.json`. This field did not appear in any 2527 sample because @thezao has had zero scheduled posts both nights. It exists, it is documented, and the CLI shortcut is `paragraph post publish <id> --newsletter`. |
| **The "Email" item in Create new** | It is `kind: "newsletter"` in the content API (`subject`, `body`, optional `preheader`) or, at the account level, `POST /v1/emails/send` (a raw address-list blast gated on Paragraph's manual eligibility approval). Both are DIFFERENT from a post's own newsletter delivery (`sendNewsletter` at publish time). Three separate email surfaces exist; do not conflate them. |
| **Credits and API/MCP calls** | CONFIRMED from docs, not inferred: "Writing and publishing yourself doesn't use credits. Credits only cover work the agent does for you" (`/account/plans-and-credits`). A `curl -X POST /v1/content` you write by hand spends nothing. The credit meter only moves when the *agent* drafts, researches, runs an automation, or generates an image. This settles 2527's "unconfirmed" flag. |
| **The analytics contradiction (132 vs 2)** | NOT SETTLED, but 2527's leading hypothesis is now the less likely one. The public `/v1/analytics/schema` (GET, read-only, tested tonight) shows `post_analytics_summary` carries `total_views` and `newsletter_unique_opens` as **separate columns**, and `detailed_post_metrics` (per-view rows) has no path back to an email-open event. Email opens do not appear to be foldable into `views` by the schema's own structure. The gap is unexplained by anything docs-readable tonight; running the actual SQL (`POST /v1/analytics/query`) would settle it, but that is a write call and out of scope here. |
| **Subscriber count** | USE `GET /v1/publications/{id}/subscribers/count` (count only, no PII, tested tonight: **593** active subscribers). This is the endpoint 2527 was missing; `/v1/subscribers` has no `total` in its pagination, but this dedicated endpoint does. |
| **The rendering defect** | REPRODUCED tonight on Day 263, at three viewports, with a browser (not just raw HTML). It is real, it is live, and Paragraph's own OpenAPI spec documents the buggy route (`@[publicationSlug]/[slug]`) as the canonical public address for a post — the working `/writing/` route is not the one Paragraph's own spec tells integrators to use. Draft bug report is in this doc; do not send it without Zaal's say-so. |
| **Automations and outbound (Starter, new tonight)** | DO NOT enable the "Post on X" automation capability. Enabling it is a one-time tap, but every subsequent trigger fires and publishes with **no further human tap** — the opposite of this lane's no-outbound default. Keep every automation restricted to Sources/Outputs/Delivery; leave Public actions off. |
| **Per-action credit costs (Starter, new tonight)** | UNDISCLOSED. Neither `/account/plans-and-credits` nor the marketing pricing page breaks a draft, a Polish, an adaptation, or an image generation into a credit count. Only the monthly total (1,500 on Starter) is public, and there is no credits-balance field anywhere in the OpenAPI spec (checked; only a `coins` wei balance, an unrelated crypto feature). Budget by watching the in-app Usage dashboard, not by computing a per-action rate. |
| **API rate limit (Starter, new tonight)** | CONTRADICTION, unresolved: the pricing page states 40 requests/minute for Starter. The live `X-RateLimit-Limit` response header on @thezao's own key reads **100**, consistently, across `/me`, `/posts`, and `/content`, tested minutes after the upgrade. Do not build automation around either number until this is reconciled. |

---

## 1. The `/v1/content` surface, in full

2527 inferred this endpoint's shape from four sampled JSON objects. `docs.paragraph.com/developers/content` (fetched tonight via `curl`, FULL, 206 lines of raw markdown) documents it completely, and the CLI/MCP docs confirm the same shape three ways.

### Kinds and bodies

| Kind | Body shape | Notes |
|---|---|---|
| `tweet` | `text` (single post) OR `tweets` (array, one entry per post in a thread, 280 chars each) | Never both in the same call |
| `linkedin` | `text` | |
| `newsletter` | `subject`, `body`, optional `preheader` | This is the standalone one-off email, i.e. the "Email" item in the app's Create-new menu, not a post's own newsletter send |
| `x_article` | `title` (X's headline), `body` (CommonMark markdown), optional `canonicalUrl` | Requires X Premium on the connected account to actually publish, confirmed both in docs and by the live post that went out at 2026-09-20 23:32 EDT |

Uploading via the API always creates a **draft**. There is no way to make a piece send from the API; the writer sends it from the app, always. Media cannot be attached via the API at all ("there's no endpoint for uploading media yet").

### The full CRUD

| Operation | Call | Behavior |
|---|---|---|
| Create | `POST /v1/content` | Rejects unknown fields with a 400 naming them, rather than silently ignoring a typo |
| List | `GET /v1/content?kind=&status=&limit=&cursor=` | `status` is `all` (default, everything except pieces archived unsent), `draft`, `published` (sticky even after archiving), or `archived`. Listing omits bodies. |
| Read one | `GET /v1/content/{id}` | Only place to read the body |
| Edit | `PATCH /v1/content/{id}` | Replaces the whole body, not a merge patch on it. Refused with `lockedReason` set if a send is already queued; renaming is always allowed even then. |
| Archive / restore | `POST /v1/content/{id}/archive` / `/restore` | Archiving dismisses every suggestion proposing the piece; restoring does not bring those suggestions back |
| Group | `POST /v1/posts/{id}/bucket` seeds a bucket id (idempotent - a post that already has one gets the same id back); pass that id as `bucketId` on new content to group it under the post | `GET /v1/buckets`, `GET /v1/buckets/{id}`, `GET /v1/posts/{id}/bucket` all read-only and tested tonight (see below) |

**Tested live tonight (GET only):** `GET /api/v1/content` on @thezao now returns 10 items, `hasMore: false` (2527 saw 8, all `kind: tweet`, all dated 2026-08-10). Tonight's 10 include a `linkedin` piece created 2026-09-21T03:34 UTC, `status: draft`, **`scheduled: true`**, with `lockedReason: "This is scheduled to go out exactly as written, so it can't be edited. Cancel the schedule first, then edit it."` and the published `x_article` from the same session, `url: "https://x.com/i/status/2101877250132193503"`. This is the clearest possible confirmation that `scheduled: true` really does lock a piece for editing, exactly as the docs describe, and that the "no visible send time" limitation 2527 flagged is real: even reading this locked, scheduled piece returns no timestamp for when it will go out.

**Pagination gotcha (tested-read-only):** `GET /v1/content?limit=100` returns `400 {"success":false,"msg":"Validation error — limit: Number must be less than or equal to 50"}`. The ceiling is 50, undocumented on the markdown page, found only by triggering the validator. `/v1/posts` has no such ceiling problem in the range tested (used `limit=5`).

### Content groups (buckets) - not in 2527 at all

A "content group" (bucket) is how the app shows a post and everything repurposed from it as one stacked row. `GET /v1/buckets` lists every group, most recent first. Tested tonight against @thezao: not exercised further to avoid noise, but the shape is documented and the read paths (`GET /v1/buckets`, `/v1/buckets/{id}`, `/v1/posts/{id}/bucket`) are all GET and safe.

### Errors (from the docs page, not observed live)

`400` body/kind mismatch or locked piece · `401` bad key · `404` no such piece/post/group, or the publication has never opened `app.paragraph.com` (no agent workspace yet) · `409` piece already grouped with another post.

---

## 2. Email, in three distinct shapes

Doc 2527 found `/api/v1/emails` returning 404 and concluded email analytics/sending "are not on the public REST surface." **Correction: the path was wrong, not the surface.** The real path, from the OpenAPI spec, is `POST /v1/emails/send`.

| Surface | What it is | How it differs |
|---|---|---|
| **Post newsletter delivery** | `sendNewsletter: true` on `PUT /v1/posts/{id}` (or `paragraph post publish <id> --newsletter` in the CLI), set at publish or schedule time | Delivers the post-as-written to all subscribers or a segment (`communityId`). This is what `/publishing/newsletters` describes: "Email delivery is a choice you make when you publish." |
| **Standalone / custom email** | Content-library `kind: "newsletter"` draft (`subject`, `body`, `preheader`), or directly `POST /v1/emails/send` | This is the "Email" item in the app's Create-new menu and in the MCP's `send-custom-email` tool. Per the OpenAPI description: **publications must be pre-approved by Paragraph to use this**, ineligible ones get a 403 (matches the "Requires publication approval" note in 2527's MCP table); malformed and disposable addresses are silently skipped; unsubscribed addresses are skipped as `suppressed`; each recipient gets an individually-addressed send (not a BCC blast) with a mandatory unsubscribe footer; `body` is Markdown rendered server-side to HTML; hard cap of 10,000 addresses per call; sends are queued asynchronously, so a 200 means "accepted," not "delivered." |
| **Subscriber lifecycle emails** | A separate small system: New subscriber / New subscriber follow-up (delayed) / Subscriber unsubscribed, each with its own subject, body, delay, and enabled flag | Not exposed on the public REST surface at all (no path in the OpenAPI spec); only reachable through the in-app agent chat per `/agent/lifecycle-emails`. New emails are always created disabled so the writer reviews before anything can send. Membership/paid-subscriber/collectible triggers are explicitly retired. |

None of the three were exercised as writes tonight (all would be POST). The distinction itself is the finding: Zaal's "Email" button in Create-new is the second row, not the first, and it is gated on manual Paragraph approval that @thezao's status was not checked (would require a live send attempt, which is out of scope).

---

## 3. Video: not documented, likely a plan-gated agent feature, and its own internal contradiction

Video does not appear anywhere in the docs site's navigation tree (checked the full page-tree JSON embedded in `docs.paragraph.com`'s root HTML — folders are Getting started, Your agent, Writing and publishing, Grow your audience, Account and billing, Developers; no "Video" folder or page exists under any of them, confirmed by grepping for the literal string "video" in that nav JSON: zero hits, cross-checked against a known-good string ("newsletters") in the same file to rule out a broken grep).

What is documented, and contradicts itself between two of Paragraph's own pages:

- `/account/plans-and-credits` (docs.paragraph.com): Starter includes "Image and **video** generation for your posts."
- `paragraph.com/pricing` (the marketing site, fetched and stripped tonight): the feature-comparison table lists "Image and video generation" as **Fast images** (Free), **High quality images** (Starter, no video), **Images and video** (Growth and Scale only).

These two official Paragraph pages disagree about which plan unlocks video, on the same night. For a paying Starter customer, the safer working assumption is the pricing table (video from Growth up), since it is the page that gates the purchase decision. **For ZAOstock specifically, this is low-priority either way:** video generation is an agent feature for illustrating posts, not a distribution format (no "Video" content kind exists in `/v1/content`, and X Articles explicitly strip "Video and GIFs" on the way out per `/audience/x-articles`). It answers "can Paragraph make me a festival video" with "no, not as documented," not "yes, once you're on Growth."

---

## 4. Post scheduling: the field 2527 couldn't see

`PUT /v1/posts/{postId}` (read from the public OpenAPI spec, `github.com/paragraph-xyz/paragraph-sdk-js/blob/main/openapi.json`, FULL) documents:

- **`scheduledAt`** - integer or null, Unix timestamp in **milliseconds**. "Must be in the future and at most 30 days out. Only valid for draft posts that haven't been published or already scheduled. Cannot be combined with `status: 'draft'` or `'archived'`. Pass `null` to cancel a previously scheduled publish." No timezone field exists or is needed - the value is an absolute UTC instant; converting a "3pm Eastern" instruction to that instant is the caller's job, exactly as the editor UI's date/time picker does silently for a human.
- **`sendNewsletter`** - boolean (or the strings `"true"/"false"/"1"/"0"`), "only meaningful when publishing or scheduling," defaults `false`.
- The read-side `status` enum on a post is `published | draft | scheduled | archived` (from the same spec) - "scheduled" is a real, distinct status.

**Tested live tonight:** `GET /v1/posts?status=scheduled` returns `{"items":[],"pagination":{"hasMore":false}}` - a genuine zero, not a broken filter. Confirmed the filter mechanism works by running the same call with `status=draft` (returned 5 real drafts, including "Year of the ZABAL - Day 260") and `status=published` (returned posts with a `total: 381`). @thezao simply has nothing scheduled right now.

**Correction to the field-value assumption in 2527:** `publishedAt` and `updatedAt` are returned as **strings holding epoch milliseconds** ("1789960320826"), not ISO-8601 dates, on the live list endpoint tonight. 2527 listed the field name without recording its format.

---

## 5. Analytics: the schema, the subscriber-count fix, and where the contradiction stands

### What was 404 in 2527 was a wrong path, not a missing feature

2527 tested `GET /api/v1/analytics` and got 404, concluding analytics "are not on the public REST surface." The real paths, from the OpenAPI spec:

- `GET /v1/analytics/schema` - "Returns column metadata for every table and view in the analytics schema." **Tested live tonight, GET, read-only, 200, FULL.**
- `POST /v1/analytics/query` - "Execute a read-only SQL query against the analytics schema, scoped to your publication," `SELECT`/`WITH` only, no writes/DDL, 10,000-row cap, 30-second timeout. **This is a POST and was not called**, per the hard read-only constraint on this research run, even though the SQL itself is read-only by the endpoint's own design.

### What the schema says about `views`

Tested tonight (`GET /v1/analytics/schema`, 200, 16.5KB, FULL). The relevant tables:

| Table | Columns |
|---|---|
| `post_analytics_summary` | `post_id, blog_id, title, slug, published_at, total_views, unique_viewers, total_read_time, avg_read_time, newsletter_sent, newsletter_unique_opens, newsletter_unique_clicks, newsletter_errors, newsletter_unsubscribes, open_rate, ctr, top_countries` |
| `detailed_post_metrics` | `id, blog_id, post_id, user_id, view_count, first_viewed_at, last_viewed_at, country, read_time, is_email_subscriber, created_at, updated_at` |
| `post_views_daily` | `post_id, day, views, unique_visitors, updated_at` |
| `blog_custom_email_summary` | `blog_id, sent_count, opened_count, error_count, unsub_count, open_rate` |
| `post_email_attribution` | `post_id, ..., newsletter_sends, newsletter_unique_opens, newsletter_unique_clicks, open_rate, email_ctr, attributed_email_clicks, attributed_page_views_from_email, last_event_at` |

`total_views` / `view_count` (page views) and `newsletter_unique_opens` (email opens) live in **separate columns throughout the schema** — there is no table where an email open increments a view counter. `detailed_post_metrics.is_email_subscriber` flags whether a *page* viewer happens to be a subscriber; it does not turn an email open into a page view. **This weakens 2527's leading hypothesis** ("the REST `views` field probably includes email opens") — the schema's own design keeps those numbers apart. It does not prove the opposite either; only running `POST /v1/analytics/query` (blocked tonight by the read-only constraint) would show which column the REST `views` field is actually drawn from. **Status: still UNKNOWN, but the mechanism 2527 guessed at looks less likely than it did last night.**

The OpenAPI description of `views` on `GET /v1/posts` itself just says: **"Total views. Only included when fetching your own posts via GET /v1/posts."** No further definition.

**A fresh data point, not in 2527:** Day 263 (`sEEVjfXTNIFU6qKZuqsN`), published 2026-09-20 ~23:32 EDT, already shows `views: 35` a few hours later, tested tonight. Day 260 shows `views: 83`. Both numbers accrue fast relative to the in-app "2 views in 14 days" figure 2527 recorded for Day 258 - the contradiction is not limited to one post.

### Subscriber count - the fix for 2527's PII/pagination problem

2527 could not get a subscriber total because `/v1/subscribers`'s pagination carries no `total`, and reading further would mean paging through PII. The OpenAPI spec has a dedicated, count-only endpoint that avoids both problems:

```
GET /v1/publications/{publicationId}/subscribers/count
```

**Tested live tonight, GET, no PII, count only: `{"count": 593}`.** This is a clean, safe way to track subscriber growth over time (repeat the same call on a cadence and diff it); it does not by itself give a growth **curve** tonight — only today's point. Trend requires a repeated snapshot, which is a Next Action, not a research finding.

### Advanced analytics is plan-gated

`/audience/analytics` (docs): "Advanced analytics come with the Scale plan." @thezao is now on Starter, two tiers below Scale. Whatever a paid analytics dashboard shows for @thezao tonight is the Starter-tier view, not the advanced one; that gap could itself be part of why in-app numbers read low against the API's `views`.

---

## 6. Credits: what actually spends them, on the record

2527 flagged this "UNCHANGED... believed not to spend credits, but that is unconfirmed." `/account/plans-and-credits` (fetched tonight, FULL) settles it in plain language:

> "Whenever it does work for you, it uses credits. That includes: Drafting and editing posts, Research, Recurring tasks... Image generation... **Writing and publishing yourself doesn't use credits. Credits only cover work the agent does for you.**"

A hand-written `curl -X POST /v1/content` or a CLI `paragraph post create` you typed yourself is "writing yourself." An agent-drafted post, an agent-run automation, an in-chat "polish this," or an image generation are "work the agent does." The line is who authored the call, not which surface (API vs. app vs. MCP) it went through - an MCP tool call that merely relays a body you wrote yourself should not spend credits either, by the same logic, though this was not tested with a write call tonight.

No credits-balance field exists anywhere in the public OpenAPI spec (checked; the only "balance" hits in the entire spec are for `coins` - Paragraph's separate crypto writer-token feature, "Token balance held (in wei)" - unrelated to agent credits). The in-app Billing page is the only place to read remaining credits.

---

## 7. Recent features, ranked for a free festival on 2026-10-03

Paragraph's own `/pricing` feature table and `/developers` doc nav, read tonight, are the fullest inventory available (no separate "changelog" of platform releases was found - `paragraph.com/changelog` turned out to be a *product feature page* for a GitHub-commits-to-changelog Playbook, not Paragraph's own release notes; see Section 9).

| Feature | What it is | Usefulness for ZAOstock (10-3) | Why |
|---|---|---|---|
| **X Articles + Distribution auto-threads** | Long-form X posts drafted from any edition; threads/LinkedIn versions queued on a "best-time" schedule | **High** | Already in use (first Article went out tonight); directly extends daily build-in-public reach with zero new setup |
| **Automations, "After an event" trigger** | Fires on publish/schedule/unpublish/archive/subscribe, 0-30 day delay, agent drafts fresh content each run into your Inbox for approval | **High** | "One day after I publish, draft a thread" fits the daily-3 cadence exactly, and nothing ships without a tap unless Public actions are turned on (see Section 8) |
| **Daily overview automation** | Free built-in; paused on Free, active on paid plans; emails a short daily-impact report at 8am local | **Medium-high**, now live on Starter | Gives Zaal one glance each morning without opening the dashboard - useful counting down to 10/3 |
| **Subscriber segments (`communityId`)** | Send a post's newsletter to a saved segment instead of the whole list | **Medium** | Could isolate a "ZAOstock local / Ellsworth" segment from the general list, untested tonight (would require creating a segment, a write) |
| **Content groups (buckets)** | One stacked row per post + its X/LinkedIn/email spinoffs | **Medium** | Organizational only; nice for tracking which editions still need their X Article, not audience-facing |
| **Custom domain** | Point a domain you own at the publication | **Low-medium for 10/3, useful long-term** | Brand strength, no functional change before the festival; see Section 8 on whether it touches the rendering bug |
| **Writer coins (`coins` API)** | Tokenized monetization tied to a publication/post, present throughout the OpenAPI spec (`/v1/coins/*`) | **Low** | Not a fit for a free, RSVP-only, no-ticket festival; adds a financial surface with no upside here |
| **Changelog Playbook** | Turns GitHub commits into changelog posts/threads/emails | **Low** | ZAOOS has commits, but this is an engineering-audience format, not a music-festival one |
| **Farcaster / frames, gating, comments, referrals, highlights** | **Not found** in the docs nav, the pricing table, or the OpenAPI spec tonight | **N/A** | Searched: docs site-wide grep, pricing page full text, OpenAPI path list. None of these terms appear. Either retired since 2527's related doc (429, April) covered Farcaster Mini App reading, or never shipped as advertised. Treat as **absent**, not "not yet found" - the search surfaces are named here so a later session can re-check narrower. |

---

## 8. Starter plan, live tonight: credits, automations and outbound, chat channels, tools, the daily brief, custom domains

Zaal upgraded `@thezao` to Starter ($20/mo, $16/mo annual) at 23:50 EDT while this research was running. `GET /api/v1/me` reflects it live: `plan: "starter"` (was `"free"` a few hours earlier in this same session).

### 8.1 Per-action credit costs - undisclosed, budget by the dashboard, not by arithmetic

Neither `/account/plans-and-credits` nor the marketing pricing page publishes a per-action credit price (a draft costs N, a Polish costs M, an image costs P). The only public number is the monthly pool: 1,500 credits on Starter. "Usage dashboard and spend limits" is a named Starter+ feature (per the pricing table), meaning the in-app dashboard is the intended place to watch consumption - not a documented rate you can divide into "roughly N per day." **No API or MCP tool reads a credit balance** (checked the full 33-tool MCP table in `/developers/mcp` and the entire OpenAPI path list; the only "balance" concept anywhere is the unrelated `coins` wei balance). Do not attempt to budget 1,500/30 = 50/day as a hard number; it assumes uniform per-action cost that is not documented and is unlikely to be true (an image generation and a one-line rename are very unlikely to cost the same).

### 8.2 Automations: what they are, and the one that can publish without a tap

Fully documented at `/agent/scheduled-tasks` (fetched tonight, FULL, 118 lines). Three trigger types:

- **Before publish** - runs while preparing to publish, for pre-flight checks.
- **After an event** - `A post is published / scheduled / unpublished / archived-or-restored`, or `A reader subscribes`; 0-30 day delay.
- **Manual** - only via "Run now."

Capabilities are grouped as **Sources** (read posts, analytics, audience stats, the public web/RSS - on by default), **Outputs** (create/edit private drafts), **Delivery** (email the result to the account owner), and **Public actions** (publish to an audience; **require confirmation**).

**The part that matters for this lane's no-outbound rule:** "Paragraph's first public automation capability is Post on X. It can read the connected account and publish one original, text-only post per run." Enabling it is a one-time confirmation ("Allow and enable") that names the automation, its trigger/timing, the connected handle, and the fact it may publish once per run. **After that one confirmation, every future trigger fires and posts with no further human tap** - "Run now... does not bypass the automation's capabilities or public authorization." An enabled public automation only pauses again ("Needs review") if its definition or the connected account changes.

**Recommendation, unchanged from Key Decisions:** never turn on a Public-actions automation in this lane. Keep every automation to Sources + Outputs (+ Delivery to email Zaal), so every draft still lands in the Inbox for a human tap, matching how this lane already works. This was not tested by actually creating an automation (a write); it is read directly from the docs' own description of what "Allow and enable" does.

### 8.3 Chat channels, specifically Telegram - not a distribution channel

`/agent/connections` (fetched tonight, FULL) is explicit: "Telegram and Slack are chat channels: places outside Paragraph where you talk to your agent." Telegram lets Zaal message the agent from his phone, with the conversation staying linked to the same Paragraph session ("same agent, same memory"). **It is not a way to cross-post editions to a Telegram channel or group.** The only channels distribution actually reaches are X, LinkedIn, and the newsletter (email) - per `/audience/distribution`'s explicit list, chat channels are named separately and are not among them. Anything that currently reaches ZAO's own Telegram or Discord (per the newsletter repo's socials workflow) still has to go there by hand or by a different tool; Paragraph's Telegram connection is inbound-agent-chat only.

### 8.4 The 900+ tools - an MCP directory (via integrations.sh), not Zapier

`/agent/connections`: "Select Search providers to browse more than 1,000 compatible remote MCP servers cataloged by integrations.sh." (The pricing page's own count is "900+," the docs page says "more than 1,000" - a small, noted inconsistency between Paragraph's own pages, not one this doc resolves.) These are remote MCP servers, not Zapier-style trigger/action automations; the agent uses them as tools inside chat and inside automations. Slack, Linear, Notion, GitHub, Canva, HubSpot, monday.com, Sentry, Fathom, and PayPal are the named examples. Starter allows 10 connected at once (Free: 3, Growth/Scale: unlimited, per the pricing table). GitHub connections need an explicit repo-access grant per org; anything a tool can only read is available to every automation by default, anything it can write requires a per-automation opt-in, same "no surprise outbound" design as the X automation above.

### 8.5 The daily brief - email, 8am local, paused on Free, live now

Already covered in Section 7; restated here because the addendum asked specifically where it arrives. Per `/agent/scheduled-tasks`: "On paid plans, it emails you a short report of your recent impact and what to focus on each morning at 8am in your timezone... Daily overview generation and delivery pause on the free plan. The schedule remains saved and starts running automatically after you upgrade." **It should start arriving automatically now that @thezao is on Starter**, at Zaal's account email, with no setup action needed - it is not listed on the Automations page (Paragraph manages its schedule directly) and its own unsubscribe link is the only control surface.

### 8.6 Custom domain and the rendering defect - untested, likely does not fix it

`/publishing/custom-domains` (fetched tonight, FULL) describes DNS setup (CNAME + TXT records) and nothing about the app's internal routing or the `@handle` vs `/writing/` path structure. Pointing `thezao.com` (or similar) at Paragraph would serve the same underlying application under a new hostname; nothing in the docs suggests the two-route problem documented in Section 9 is hostname-specific; the defect is in the SSR markup Paragraph's own React app emits for a post body, not in which domain requests that markup. **This is inferred, not tested** - actually connecting a domain is a paid-plan write action outside this run's read-only scope, and it was not attempted.

---

## 9. The two-route rendering defect: reproduced, localized, and a draft bug report

### What was reproduced tonight, on Day 263 (`year-of-the-zabal-day-263-13-days-until-zaostock`)

**Method 1 - raw HTML (curl, cache-busted with `?t=$(date +%s)` and `Cache-Control: no-cache`):**

- `paragraph.com/@thezao/<slug>`: **8 occurrences** of `</a>` immediately followed by many literal whitespace characters and then a punctuation mark (`.` x7, `,` x1), including the exact known example: `...<a href="https://ticket.zaostock.com" ...>RSVP for free</a>                                  . It i...`
- `paragraph.com/@thezao/writing/<slug>`: **0 occurrences** of the same pattern (sanity-checked: `</a>` immediately followed by punctuation with *no* space, i.e. the correct form, also returns 0 - confirming the grep pattern itself works and the writing route is simply clean, not un-searched).

**Method 2 - rendered browser text, via the gstack `browse` CLI (headless Chromium), tested at three real viewports (1280x800 desktop, 768x1024 tablet, 390x844 mobile) after the first attempt at the tool's default viewport gave an inconsistent flush read:**

At all three named viewports, `document.body.innerText` on `@thezao/<slug>` reads **`"RSVP for free . It is"`** - one visible space before the period. The same check on `@thezao/writing/<slug>` reads **`"RSVP for free. It is"`** - flush, correct, at the same viewport. This matches the known-facts description exactly and rules out the one anomalous flush reading (tool's unspecified default viewport) as the real state of the page.

**Method 3 - the `.md` export, live and cache-busted tonight:**

```
paragraph.com/@thezao/year-of-the-zabal-day-263-13-days-until-zaostock.md?t=<epoch>
```
Line 21: `First, [RSVP for free](https://ticket.zaostock.com) . It is not a ticket...` - the space before the period is baked into the Markdown source itself, not just the rendered HTML. This confirms the known fact that the `.md` export inherits the defect and is CDN-cached; the export was re-fetched with a fresh cache-busting query param tonight and still shows it, so it is not a stale-cache artifact - it is generated with the extra whitespace.

### A correction to one premise in the known facts

Tonight's fetch of both routes' `<link rel="canonical">` tags:

- `@thezao/<slug>` → `<link rel="canonical" href="https://paragraph.com/@thezao/year-of-the-zabal-day-263-13-days-until-zaostock">` (self-referencing, **includes** `@thezao`)
- `@thezao/writing/<slug>` → `<link rel="canonical" href="https://paragraph.com/writing/year-of-the-zabal-day-263-13-days-until-zaostock">` (self-referencing, **excludes** `@thezao`)

The known-facts note going into tonight said "the canonical tag points at `paragraph.com/writing/<slug>`, without `@thezao`" - true for the writing route, but tonight's `@thezao` route canonicalizes to **itself**, not to `/writing/`. Each route is self-canonical; there is no single global canonical pulling traffic toward the clean route. **This is a correction, not a confirmation**, of the earlier framing, dated 2026-09-21.

### Why the bug is real but was hard to pin down tonight

The underlying defect is excessive literal whitespace in the server-rendered HTML between an inline link and the text node that follows it (dozens of space characters, likely indentation from a template, not a deliberate single space). Standard CSS whitespace collapsing should reduce any run of that whitespace to at most one rendered space - which is what Method 2 shows at three controlled viewports. The one flush reading from an uncontrolled viewport earlier in this session is most simply explained by where that particular layout happened to soft-wrap the line (CSS trims whitespace that falls at a wrap boundary), not by the bug being intermittent in nature. This is offered as the most likely mechanism, **inferred, not confirmed** - it was not tested by deliberately forcing a wrap at that exact character.

The publication's own OpenAPI spec calls the buggy route the documented one: the `slug` field's description on `GET /v1/posts` reads *"URL-friendly identifier for the post; **accessible at paragraph.com/@[publicationSlug]/[slug]**"* - i.e. Paragraph's own API reference tells integrators the `@handle` path is the correct public address, which is precisely the path carrying the extra whitespace tonight. The `/writing/` path that renders cleanly is not the one Paragraph's spec names.

### Known/reported elsewhere - searched, not found

- `gh api search/issues` across the `paragraph-xyz` GitHub org (`paragraph-mcp`, `paragraph-sdk-js`, `paragraph-cli`, `skill`, `docs`, `api-docs`, `homebrew-tap`) for whitespace/markdown/rendering terms: **11 total matches, none about this defect** (all are feature PRs and two unrelated API field bugs on `paragraph-sdk-js`, see Sources). Sanity-checked the search mechanism was live by confirming it returned real results at all (it did - 11, not zero, on the first try).
- Hacker News, keyless Algolia API, "paragraph.com newsletter"-style queries with a 2026 date filter: **0 hits**, consistent with 2527's separate zero-hit finding on a similar query. Confirmed the search mechanism itself works with a control query ("newsletter platform," same date filter, 52 hits).
- Reddit: walled from this machine tonight exactly as the research skill's own state-of-play box predicts (`--selftest`: creds absent, public `.json` returns `text/html`, `.json` search via a headless-browser session returned HTTP 403 "blocked by network security" - a step further blocked than the skill's most recent 2026-09-02 unblock note, so Reddit's wall has tightened again since then, or this specific search endpoint is blocked differently than a thread permalink). **Marked FAILED, method tried: `browse` headless session to `reddit.com/search.json`.**

**No public report of this exact defect was found anywhere searched tonight (GitHub issues, HN, Reddit attempted). Treat it as unreported, not as confirmed-novel** - Reddit could not be searched at all tonight, which is the gap that most likely hides a report if one exists.

### Draft bug report (not sent - for Zaal's review only)

> **Subject: Extra whitespace rendered between a link and trailing punctuation on `@handle` post pages, absent on the `/writing/` route**
>
> On `paragraph.com/@thezao/<slug>` pages, a link immediately followed by punctuation in the source text (e.g. "...RSVP for free[.]") renders with a visible space before that punctuation: "RSVP for free . It is..." The same post at `paragraph.com/@thezao/writing/<slug>` renders it correctly, flush: "RSVP for free. It is...". The `.md` export at `paragraph.com/@thezao/<slug>.md` also carries the extra space in its Markdown source, so it is not purely a browser-rendering issue - the space is present in generated Markdown, not just HTML.
>
> Reproduced on Day 263 ("Year of the ZABAL - Day 263: 13 days until ZAOstock," `year-of-the-zabal-day-263-13-days-until-zaostock`) at three viewports (1280x800, 768x1024, 390x844), 2026-09-21. Raw HTML on the `@handle` route shows 8 occurrences of `</a>` followed by dozens of literal whitespace characters before the next punctuation mark; the `/writing/` route and the `.md`-adjacent HTML do not carry this whitespace.
>
> Notably, `GET /v1/posts` in your own API documents the `@[publicationSlug]/[slug]` path (not `/writing/`) as the post's public address, which is the path carrying the defect.
>
> Happy to share the exact curl commands and HTML diffs used to find this.

---

## 10. Corrections and open contradictions, gathered in one place

| # | Claim (source, date) | Tonight's finding | Status |
|---|---|---|---|
| 1 | 2527: MCP exposes "29 tools" (from `skill` repo's SKILL.md, 2026-09-01) | `docs.paragraph.com/developers/mcp` (also 2026-09-01-pushed repo, but the live docs page): **33 tools**, adding `analytics-query`/`analytics-schema` and consolidating `emails` to just `send-custom-email` | Docs page is newer/authoritative; treat 33 as current |
| 2 | Pricing page: Starter API rate limit = 40/min | Live `X-RateLimit-Limit` header on @thezao's key, tested minutes after upgrade: **100**, on `/me`, `/posts`, `/content` | Unresolved contradiction |
| 3 | `/account/plans-and-credits`: Starter includes video generation | `paragraph.com/pricing` table: video generation starts at Growth, not Starter | Paragraph's own two pages disagree; treat pricing table as decision-grade |
| 4 | Known facts going into tonight: canonical tag on the `@thezao` route points to `/writing/<slug>` | Tonight: `@thezao/<slug>`'s canonical is self-referencing (includes `@thezao`); only the `/writing/` route's canonical excludes it | Correction, not confirmation |
| 5 | 2527: REST `views` likely includes email opens | `/v1/analytics/schema` keeps `total_views`/`view_count` and `newsletter_unique_opens` in separate columns throughout | Hypothesis weakened, not replaced; true cause still UNKNOWN |
| 6 | Docs page nav (fumadocs) vs pricing page: MCP directory size | Docs: "more than 1,000" remote MCP servers via integrations.sh. Pricing table: "900+ available" | Small, unresolved inconsistency between Paragraph's own pages |

---

## Also See

- [business/2527 - Paragraph features The ZAO is not using](../2527-paragraph-features-unused-sept2026/) - the doc this one builds on and partially corrects
- [business/429 - Paragraph Agents Launch](../429-paragraph-agents-launch-apr2026/) - the April MCP/skill launch doc; note doc-number 429 is ambiguous with `dev-workflows/429-claude-code-skills-deep-dive`
- [business/1348 - ZAO Newsletter: Paragraph Paid Tiers Activation Guide](../1348-zao-newsletter-paragraph-paid-tiers-jul2026/) - written before tonight's Starter upgrade; re-validate against Section 8 of this doc. Number 1348 is ambiguous with `wavewarz/1348-wavewarz-trader-community-growth-jul2026`
- [business/322 - Paragraph + Publish.new: Newsletter Platform, Agent Commerce & COC Concertz Integration](../322-paragraph-publishnew-newsletter-agent-commerce/) - covers the `coins` surface this doc ranks low for ZAOstock. Number 322 is ambiguous, resolving to two different `music/` docs as well
- [cross-platform/2189 - Paragraph brand-growth playbook](../../cross-platform/2189-paragraph-brand-growth-playbook/) - DEEP tier, last validated 2026-08-03, pre-dates this doc's plan-tier findings
- [business/2348 - Newsletter craft + Paragraph MCP operations](../2348-newsletter-craft-paragraph-mcp/)
- [identity/1270 - The ZAO Newsletter canonical reference](../../identity/1270-zao-newsletter-paragraph-canonical-jul2026/) - 400 editions recorded there vs. 381 posts measured live tonight via `GET /v1/posts` `pagination.total`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `PUT /v1/posts/{id}` with `scheduledAt` on one non-critical draft to confirm the field round-trips on a GET afterward (not tested tonight - read-only constraint) | @Zaal | API test | 2026-09-23 |
| Snapshot `GET /v1/publications/{id}/subscribers/count` daily through 2026-10-03 to build the growth curve this doc could only take one point of (593 on 2026-09-21) | @Zaal | Cron/manual log | 2026-09-22, daily |
| Open the in-app Usage dashboard (Starter unlocked it) and record actual credits-per-action for one draft, one Polish, one X adaptation, and one image generation, to replace Section 8.1's UNKNOWN with real numbers | @Zaal | Screenshot into the lane | 2026-09-23 |
| Confirm @thezao's `/v1/emails/send` eligibility (approved or 403) with a real send when a real one-off email is next needed - do not test with a throwaway send | @Zaal | Live send, next real use | 2026-10-03 |
| Send (or decline to send) the Section 9 draft bug report to Paragraph support | @Zaal | Decision + email | 2026-09-23 |
| Verify every automation on @thezao has Public actions left off before the festival, given Section 8.2's no-tap-after-enable finding | @Zaal | Settings check | 2026-09-22 |
| Re-run the rate-limit header check (Section Key Decisions) a day after the Starter upgrade fully propagates, to see if 100 settles to 40 or stays | @Zaal | API check | 2026-09-22 |

## Sources

- [docs.paragraph.com](https://docs.paragraph.com/) - **[FULL, method: curl to the site's own raw-markdown mirror, `<path>.md`, no auth/no JS]**: `/developers/content`, `/agent/scheduled-tasks`, `/agent/lifecycle-emails`, `/agent/connections`, `/agent/approvals`, `/audience/distribution`, `/audience/x-articles`, `/audience/analytics`, `/publishing/newsletters`, `/publishing/editor`, `/publishing/custom-domains`, `/account/plans-and-credits`, `/developers/mcp`, `/developers/cli`, `/developers/sdk`, `/getting-started/import-your-publication`, `/index`. All fetched 2026-09-21, HTTP 200.
- Docs site root HTML, `docs.paragraph.com` - **[FULL, method: curl, parsed the embedded page-tree JSON for the full nav]** - used to confirm no "Video" page/folder exists anywhere in the nav (checked with a working-grep sanity control on "newsletters", which did match).
- [OpenAPI spec, `paragraph-xyz/paragraph-sdk-js`](https://github.com/paragraph-xyz/paragraph-sdk-js/blob/main/openapi.json) - **[FULL, method: `curl` raw.githubusercontent.com, 473KB, parsed with python's json module]** - source of the full path list, the `scheduledAt`/`sendNewsletter` fields, the `views` field description, and the `/v1/emails/send` and `/v1/analytics/*` path descriptions. No `components/schemas` section exists (0 entries); every schema is inlined per-path.
- Live `public.api.paragraph.com/api/v1/*` against `@thezao` - **[FULL, method: authenticated curl, GET only, all calls tested against a working-filter control (e.g. `status=draft` before trusting `status=scheduled`'s zero result)]** - `/me` (plan now `starter`, id, slug), `/posts` (multiple filters, `pagination.total: 381`), `/content` (10 items, one newly `scheduled: true` linkedin draft), `/analytics/schema` (200, 16.5KB), `/publications/{id}/subscribers/count` (`{"count":593}`, no PII), rate-limit response headers on `/me`, `/posts`, `/content`.
- `paragraph.com/pricing` - **[FULL, method: curl + script/style-stripped HTML-to-text]** - full plan comparison table, quoted directly in Sections 6-8.
- `paragraph.com/changelog` - **[FULL, method: curl + stripped HTML]** - turned out to be the Changelog Playbook feature page, not Paragraph's own release notes; documented as a negative/redirection finding in Section 7.
- `paragraph.com/@thezao/year-of-the-zabal-day-263-13-days-until-zaostock` and its `/writing/` and `.md` variants - **[FULL, method: curl with cache-busting `?t=<epoch>` + `Cache-Control: no-cache`, plus headless-Chromium render via the `gstack` `browse` CLI at three explicit viewports]** - Section 9.
- GitHub org `paragraph-xyz` - **[FULL, method: `gh api search/issues` across the org, `gh repo list`, `zao-research-snapshot` on four repos]**. Licensing, read from each LICENSE file per Hard Requirement 13, not the API classifier: `paragraph-mcp` and `paragraph-sdk-js` are **NONE - all rights reserved** (public but proprietary); `paragraph-cli` and `skill` are **MIT**. `paragraph-mcp`: 1 star, 4 contributors, pushed 2026-09-01. `paragraph-sdk-js`: 11 stars, 6 contributors, pushed 2026-09-01. 11 total issue/PR search hits org-wide for whitespace/markdown/rendering terms, none matching the Section 9 defect (two unrelated field-completeness bugs on `paragraph-sdk-js` issues #1 and #2, both closed).
- Hacker News, keyless Algolia API (`hn.algolia.com/api/v1/search`) - **[FULL, method: direct API call]** - 0 hits for Paragraph-specific queries with a 2026 date filter (consistent with doc 2527's separate zero-hit finding); sanity-checked the query mechanism against a broad control term (52 hits).
- Reddit - **[FAILED, method tried: `zao-fetch-reddit.sh --selftest` (creds absent, public `.json` returns `text/html`), then a `gstack browse` headless session to `reddit.com/search.json` (HTTP 403, "blocked by network security")]** - could not be searched tonight; the wall is at least as tight as the research skill's 2026-08-14 state and tighter than its 2026-09-02 note for this particular endpoint.
