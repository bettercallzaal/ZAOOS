---
topic: business
type: audit
status: research-complete
last-validated: 2026-10-12
superseded-by:
related-docs: "business/2527-paragraph-features-unused-sept2026, business/2528-paragraph-beyond-the-post-sept2026, business/2547-paragraph-playbooks-map, dev-workflows/2538-paragraph-ai-agent-workflow-improvements, dev-workflows/2549-paragraph-setup-tomorrow, business/2348-newsletter-craft-paragraph-mcp, identity/1270-zao-newsletter-paragraph-canonical-jul2026, cross-platform/2244-posting-platform-decision, business/2633-armstrng-writing-index-one-idea-essays"
original-query: "here sjust more info on pararhgrap go do some /zao-research (seat brief: Paragraph as The ZAO's publishing platform as it is today; extend docs 2527, 2528, 2538, 2547, 2549, 2348, 1270 from vault notes/publishing-tools-postiz-borker-paragraph-2026-10-12.md; Next Actions = settings Zaal flips with a recommendation each, plus what the newsletter lane automates, drafts only). Widened the same evening: 'we can do alot with apragraph go keep leanring more please' - cover each of the eight Create new types: Chat, Post, X post, LinkedIn post, Email, Website, Video, Automation."
tier: STANDARD
---

# 2665 - Paragraph as The ZAO's publishing platform, as of 12 October 2026

> **Goal:** Say what Paragraph is today, what changed since the September docs (2527 to 2549), what each of the eight Create new types can do for The ZAO, and which settings Zaal should flip, each with a recommendation.

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| **Plan** | KEEP the current plan; do not switch. Paragraph changed pricing in October 2026: Free $0, Launch $159/mo, Team $399/mo, Managed from $2,500/mo. "Growth and Scale are now called Launch and Team", and "Starter is no longer offered. If you're on it, you keep it". @thezao was on Starter on 2026-09-21 (doc 2528). Moving off Starter cannot be undone: the next cheapest paid plan is now $159/mo. The current plan was NOT re-read tonight (see Gaps). |
| **Workspace limits** | KEEP the workspace. "Workspaces created before October 10, 2026 also keep the limits they started with ... That holds on any plan they move to." Subscriber caps on new workspaces are now 1,000 / 10,000 / 100,000 (Free / Launch / Team). @thezao has 585 active subscribers, so even the Free cap would not bite today. |
| **Automatic approval (new)** | KEEP OFF for every account. New in Publishing rules: when it is on for an account, "new suggested times for that account then publish without a separate approval". It is off by default. It is the same standing-authorization risk docs 2528 and 2547 ruled out for automations and Playbooks. |
| **Publishing rules, Email subscribers** | LEAVE OFF until the lane schedules its first edition through the Calendar, then turn it ON in the same sitting. While it is off, "scheduled articles publish to your site only". It does not affect a post Zaal publishes by hand through Review & publish, which is how every edition goes out today. |
| **Scheduling notes** | FILL with one line that Zaal edits: "An X or LinkedIn post about an article goes out only after the article is live." The agent follows notes when it suggests times; notes "don't approve anything on their own", so this line costs nothing and can't send anything. |
| **Before-publish automation (already on, per the vault note)** | EXTEND its instructions with the failure Day 285 nearly shipped: flag any sentence that asks the writer for information ("Before I complete this update I need..."), any "on-chain", any em dash, and any past-tense verb about a dated future event. Before-publish runs "while you prepare to publish a post", which is exactly where tonight's leftover agent question had to be caught by hand. Runs use credits. |
| **Scheduled automations Zaal already has (nightly 9 PM prep, paused; 8 AM overview, on)** | DO NOT EDIT THEM. The automations page now says "New automations can't run on a schedule" and recurring work "lives in Playbooks". So both of Zaal's timed automations predate that rule. Whether editing one keeps its schedule is not documented; treat both as legacy and leave the 9 PM one paused. UNVERIFIED: the existence and state of both come from the seat's scout note, not a read of the app tonight. |
| **Cover images** | USE a cover template, and do not use Generate or Match brand. Templates are new: "Picking and editing templates doesn't use AI credits; Match brand does". Zaal's standing rule is that public design is not AI-made (2026-10-08). A template built from the ZAO logo, fonts and colours is not AI-made, and Generate is. |
| **Video** | SKIP for anything public. Video generation is "Images and video" on Launch and Team and "Images" only on Free (pricing page). The agent makes "short videos with narration and music", which runs into two standing rules at once: no AI-made public design, and no uncleared music. |
| **Website builder for thezao.com** | SKIP. thezao.com is its own repo (zao-website), and its DNS switch is a gated decision. Paragraph says "You can use a custom domain or your own website, not both", and both are paid-plan features. USE "Your own website" only if a ZAO site ever renders the newsletter itself. |
| **Publication settings from 2527 (open for three weeks)** | FLIP them now. All are unchanged since 2026-09-20 when read from the public publication endpoint tonight: `summary` still contains an em dash, `pinnedPostIds` is `[]`, `themeColor`, `headerFont` and `bodyFont` are all `default`, and `showMostPopular` is `true`. |
| **Farcaster** | NOT on Paragraph. Zero mentions of Farcaster, Instagram or Bluesky across the 22 docs pages fetched tonight (the control term "linkedin" matched 9 times in one page). Farcaster posting stays with Postiz per [cross-platform/2244-posting-platform-decision](../../cross-platform/2244-posting-platform-decision/). |
| **MCP, CLI, SDK** | USE the MCP as it stands: `@paragraph-com/mcp` 1.7.4 (published 2026-09-29), CLI 0.4.0 and SDK 2.4.0 (both unchanged since 2026-09-01). The tool list is now 30 tools in 11 toolsets; doc 2527 counted 29, and "coins" is no longer listed. New since 2549: `update-post` takes `publishOnline: false` (email-only send) and `canonicalUrl`. The MCP has NO playbook tools; Playbooks have their own REST endpoints. |
| **Licence of the MCP server** | TREAT AS PROPRIETARY. The docs say "The server is open source on GitHub", but the repo `paragraph-xyz/paragraph-mcp` has no LICENSE file at its root (contents listing read tonight) and GitHub reports `license: null`. Public code with no licence is all-rights-reserved (`.claude/rules/credit-attribution.md`). Same finding as 2528. |

## What changed since the September docs

| Area | September (doc) | 12 October 2026 | Source |
|---|---|---|---|
| Docs site | 28 pages, no Playbooks page (2547, 09-24) | 71 pages, incl. `/playbooks`, `/playbooks/changelog`, `/developers/playbooks`, `/distribute`, `/distribute/calendar`, `/agent/automations`, `/agent/chat`, `/getting-started/workspace-tour`, `/publishing/website` | sitemap.xml |
| Plans | Free / Starter $20 / Growth $100 / Scale $200, credits 500 / 1,500 / 8,500 / 17,500 (2547) | Free / Launch $159 / Team $399 / Managed $2,500+. Starter closed to new buyers. The pricing page no longer prints credit totals; it prints Changelog campaigns: first one / about 4 a month / about 12 a month | pricing page, plans-and-credits |
| Approvals page | `/agent/approvals` (2549) | 301 redirect; approval rules now live in Calendar (Automatic approval, Publishing rules) and Automations (Needs review) | docs |
| Agent settings | Goals (up to 20), Brand voice, Social voice, Visual brand (2549) | Brand voice (long-form, 10,000 chars), Brand voice (X/social), Publication voice, Account voice (auto-filled from recent X posts when an account connects), Visual brand, Notes (shared memory, agent adds its own). "Goal" does not appear on the page | voice-and-memory |
| Scheduling | `scheduledAt` via API (2528) | Calendar: dashed suggested times, approve one / a day / a run; "A scheduled piece is read-only ... Unschedule it on the Calendar to edit it" | calendar, distribute |
| Automations | Sources / Outputs / Delivery / Public actions (2528) | Same groups plus Connected tools; triggers Before publish, After an event (delay up to 30 days), Manual; "New automations can't run on a schedule" | automations |
| Chat channels | Telegram (2528) | Telegram and Slack. Free 1, Launch 5, Team unlimited, Starter 3 | connections |
| Connected tools | 900+ directory (2528) | 1,000+ remote MCP servers; caps 3 / 10 / unlimited by plan | connections, pricing |
| Covers | Generate, Choose style (2538) | Plus cover templates (no credits), Save as template, Update cover on title change | editor |
| @thezao | 381 posts, 593 subscribers, rate-limit header 100 (2528, 09-21) | 391 published posts, 585 subscribers, header still 100 | public API, 2026-10-12 |
| Newsletter repo | 2549 asked for `paragraph post create` and a test email before every publish | Neither is in `zaoonparagraph/automation/` on origin/main (grep for `post create` and `test-email`: no hits; control `/v1/content` matched once). Drafts still go through `create-draft.sh` | git grep |
| Paragraph's changelog | 2538 cited the 2026-07-07 entry | The `@changelog` publication's newest post is 2026-07-21. Nothing about the October pricing is there; read the docs instead | public API |

## The eight Create new types

The Create new menu "starts anything from any page: a chat, post, X post, LinkedIn post, email, website, video, or automation" (workspace tour). Writing and publishing yourself uses no credits; everything the agent does uses credits.

| Type | What it makes | What the agent can do | Limits | Plan / credits | One use for The ZAO |
|---|---|---|---|---|---|
| **Chat** | A session with the agent | Write and create, distribute, research the web and connected tools, run Playbooks. Saves a draft before anything; "when you name a time ... your agent schedules that exact draft and locks it" | Remembers within a session; across sessions only voice, brand and notes | Credits per message. Telegram/Slack count as chat channels | Quick rewrites of a draft, as on Day 285. Keep the edition itself markdown-first (2549): the chat agent left its own question in the Day 285 draft |
| **Post** | An article in the editor, to the site, email or both | Outline and draft, cover options, pre-publish review | Embeds come from a link pasted on its own line; email segments; `Send test` and `Preview` before sending; `Publish online` off = email-only | No credits when you write it. Generate and Match brand use credits | The daily edition. Day 285's X embed was this behaviour |
| **X post** | A post or thread, one card per post | Draft from an article, attach up to 4 images (the article cover is attached automatically) | 280 characters per post; needs a connected account; read-only once scheduled | Posting to X is on every plan | A two-post thread per edition, drafted with `POST /v1/content` kind `tweet`, sent by Zaal's tap |
| **LinkedIn post** | A post | Draft from an article | The article link goes in the first comment, from the same account, "only once the article is published" | Every plan | A weekly recap from Zaal's account. Paragraph now automates the first-comment rule 2547 asked Zaal to do by hand |
| **Email** | A one-off email (`kind: newsletter`: subject, body, preheader) | Draft it; lifecycle emails (welcome, follow-up, unsubscribed), "always created disabled"; test send to your own address | `send-custom-email` to an address list needs Paragraph's approval (403 until approved, 2528) | Drafting uses credits | Rewrite the welcome email (2547's open action), created disabled, tested, then enabled by Zaal |
| **Website** | A custom-design site at the paragraph.com address | Builds from your real articles in themes; deploys only on your go-ahead | Custom domain is paid; own-website redirect is paid; not both at once | Free plan: "Not included" for custom domain and your own website (pricing) | SKIP for thezao.com (see Key Decisions). Sitemaps, structured data and `llms.txt` ship on every site, so the newsletter is already crawlable for the GEO goal |
| **Video** | Short video with narration and music | Offers format, length, style, narration and music choices first | No dedicated docs page; X Articles drop video | Launch and Team only (Free: images only) | SKIP publicly (AI-made design rule, uncleared music). No ZAO use recommended |
| **Automation** | A named job on a trigger | Before publish, After an event (publish, schedule, unpublish, archive, restore, subscribe), Manual; one public action, Post on X | No new scheduled automations; a subscriber trigger "can start a private draft or notify you, but never a public action"; editing a public automation clears its authorization | Credits per run | The before-publish check in Key Decisions |

## Gaps (said, not guessed)

- **Plan, credits used, automation list and Publishing rules were not read from the app tonight.** Reading the API key file in `zaoonparagraph` was refused by this session's permission check, so only unauthenticated endpoints were used: the publication by slug, subscriber count, the published posts list, response headers. `plan` is `None` on the public publication object. The plan is recorded from doc 2528 (Starter, 2026-09-21), not measured.
- **Seat's scout note** (vault `notes/publishing-tools-postiz-borker-paragraph-2026-10-12.md`) lists Zaal's automations and the dashboard items; this doc did not re-read the app, so those rows carry the note as their source.
- **The rate-limit contradiction from 2528** (40 on the old pricing page, 100 in headers) is moot as stated: the new pricing page no longer prints a rate limit. The header still reads 100.
- **Analytics contradiction (2527, 132 vs 2)** was not re-tested; it needs the authenticated `analytics-query`.

## Also See

- [business/2527-paragraph-features-unused-sept2026](../2527-paragraph-features-unused-sept2026/) - publication settings audit; its setting flips are still open
- [business/2528-paragraph-beyond-the-post-sept2026](../2528-paragraph-beyond-the-post-sept2026/) - API, automations, rendering defect
- [business/2547-paragraph-playbooks-map](../2547-paragraph-playbooks-map/) - the Playbook-vs-automation split this doc confirms
- [dev-workflows/2538-paragraph-ai-agent-workflow-improvements](../../dev-workflows/2538-paragraph-ai-agent-workflow-improvements/) - the dated-cutoff prompt pattern used on Day 285
- [dev-workflows/2549-paragraph-setup-tomorrow](../../dev-workflows/2549-paragraph-setup-tomorrow/) - CLI and test-email change list, not adopted as of tonight
- [business/2348-newsletter-craft-paragraph-mcp](../2348-newsletter-craft-paragraph-mcp/) and [identity/1270-zao-newsletter-paragraph-canonical-jul2026](../../identity/1270-zao-newsletter-paragraph-canonical-jul2026/)
- [cross-platform/2244-posting-platform-decision](../../cross-platform/2244-posting-platform-decision/) - Postiz for Farcaster
- Tracker: `handoff:list-newsletter` "Newsletter and Paragraph pipeline (umbrella)", todo, due 2026-11-01

## Next Actions

Zaal's week of 12 to 18 October is North Creek only, so nothing below is due before 19 October.

| Action | Owner | Type | By When |
|---|---|---|---|
| Confirm Calendar > Publishing rules > Automatic approval is OFF for every connected account; done when a screenshot of the rules panel is in the zaoonparagraph lane | @Zaal | Setting check (rec: keep off) | 2026-10-19 |
| Add the Scheduling note "An X or LinkedIn post about an article goes out only after the article is live"; done when it shows in Publishing rules | @Zaal | Setting (rec: add) | 2026-10-19 |
| Add four checks to the existing before-publish automation (agent questions left in the body, "on-chain", em dash, past tense about a dated future event); done when a test publish of a draft holding one of them gets flagged | @Zaal | Setting (rec: add) | 2026-10-19 |
| Remove the em dash from the publication summary, pin the newest edition, set theme colour and fonts from the ZAO brand kit; done when `GET /publications/slug/@thezao` shows the new values | @Zaal | Settings, open since doc 2527 (rec: flip all three) | 2026-10-20 |
| Build one ZAO cover template with Choose template > Customize > Save as template, no Generate and no Match brand; done when Day 286 or later uses it | @Zaal | Setting (rec: build it) | 2026-10-21 |
| Leave Plan, Video and Website builder as they are; done when no plan change appears in Billing | @Zaal | Decision (rec: keep) | wontfix |
| Newsletter lane: switch `automation/create-draft.sh` to `paragraph post create --file` and add `POST /v1/posts/{id}/test-email` before every publish; drafts only, nothing scheduled or sent; done when a PR in zaoonparagraph is merged | newsletter lane | PR | 2026-10-21 |
| Newsletter lane: draft each edition's X thread and LinkedIn post as `/v1/content` drafts grouped with the post (buckets); never Playbook "Run automatically" with approval, never Automatic approval, never the Post on X action; done when Day 286's socials appear under Content > All beside the post | newsletter lane | PR | 2026-10-21 |
| Newsletter lane: read "what shipped" from the public posts endpoint (`/publications/{id}/posts`, which listed Day 285 within minutes tonight) and add it to `check-published.sh`; done when the check names the live newest edition without the API key | newsletter lane | PR | 2026-10-21 |

## Sources

- [Paragraph docs sitemap](https://docs.paragraph.com/sitemap.xml) - [FULL, method: curl, 71 URLs parsed]
- [Plans and credits](https://docs.paragraph.com/account/plans-and-credits.md) - [FULL, method: curl of the raw-markdown mirror]
- [Pricing](https://paragraph.com/pricing) - [FULL, method: curl + script/style strip, 388 text lines read]
- [Distribution](https://docs.paragraph.com/distribute.md), [Calendar](https://docs.paragraph.com/distribute/calendar.md), [Newsletters](https://docs.paragraph.com/distribute/newsletters.md), [X Articles](https://docs.paragraph.com/distribute/x-articles.md) - [FULL, method: curl, raw markdown]
- [Automations](https://docs.paragraph.com/agent/automations.md), [Inbox](https://docs.paragraph.com/agent/inbox.md), [Chat](https://docs.paragraph.com/agent/chat.md), [Connections](https://docs.paragraph.com/agent/connections.md), [Voice and brand](https://docs.paragraph.com/agent/voice-and-memory.md) - [FULL, method: curl, raw markdown]
- [Playbooks](https://docs.paragraph.com/playbooks.md), [Changelog Playbook](https://docs.paragraph.com/playbooks/changelog.md), [Playbook runs API](https://docs.paragraph.com/developers/playbooks.md) - [FULL, method: curl, raw markdown]
- [Workspace tour](https://docs.paragraph.com/getting-started/workspace-tour.md), [Editor](https://docs.paragraph.com/publishing/editor.md), [Website](https://docs.paragraph.com/publishing/website.md), [Lifecycle emails](https://docs.paragraph.com/audience/lifecycle-emails.md), [Drafted content](https://docs.paragraph.com/developers/content.md), [MCP server](https://docs.paragraph.com/developers/mcp.md) - [FULL, method: curl, raw markdown]
- `/agent/approvals` and `/audience/distribution` - [FAILED - both now return HTTP 301; their content moved to the Calendar and Automations pages above]
- npm registry: `@paragraph-com/mcp`, `@paragraph-com/cli`, `@paragraph-com/sdk` - [FULL, method: `npm view version time.modified`]
- [paragraph-xyz/paragraph-mcp](https://github.com/paragraph-xyz/paragraph-mcp) - [FULL, method: `gh api` repo, root contents listing (no LICENSE file), `license: null`]
- GitHub community, `org:paragraph-xyz` issues and PRs since 2026-09-20 - [FULL, method: `gh api search/issues`, 5 results, all paragraph-mcp: the 2026-09-21 `canonicalUrl`/`publishOnline` exposure and four 2026-09-29 fixes for empty identifiers, incl. "fixes Gemini 400s"]
- Hacker News, keyless Algolia API, query `paragraph.com` since 2025-09-01 - [FULL, method: `hn.algolia.com/api/v1/search`, 28 hits, all posts hosted on paragraph.com or comments, none discussing Paragraph as a product; control query `newsletter` returned 3,243, so the search works]
- `public.api.paragraph.com/api/v1` for @thezao, unauthenticated - [FULL, method: curl, publication by slug, subscriber count `{"count":585}`, posts list `total: 391`, `x-ratelimit-limit: 100`]
- Paragraph's own `@changelog` publication - [FULL, method: public API posts list, newest 2026-07-21]
- zaoonparagraph repo, `automation/` on origin/main - [FULL, method: `git grep` with a matching control]
- Vault `notes/publishing-tools-postiz-borker-paragraph-2026-10-12.md` - [FULL, method: `git show origin/main`; itself a summary of seat scouts, so its dashboard and automation details are carried as UNVERIFIED here]
