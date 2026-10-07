---
topic: business
type: guide
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2528, 2527, 2538, 944, 2348, 2189, 1301"
original-query: "What playbooks exist for Paragraph (paragraph.com) - the publishing platform we use for The ZAO newsletter. Cover: documented workflows and best practices from Paragraph itself and from other publishers, the agent/AI features and what they cost, automations and chat channels, distribution paths (X article, LinkedIn, Farcaster, email), analytics and what they actually measure, growth and deliverability playbooks, API/MCP capabilities, and anything about paid subscriptions and the revenue cut. Standard depth. Context: we publish daily, 0.00% CTR on every edition ever per Paragraph's own analytics, 268 clicks across 366 editions, and we are trying to decide where effort should go."
tier: STANDARD
---

# 2547 - Paragraph playbooks: the platform feature, and our own library of them

> **Goal:** Answer "what playbooks with Paragraph are" in both senses - Playbooks is a real, shipping Paragraph feature that none of our nine Paragraph docs describes, and separately we hold seven documents that call themselves playbooks. Map both, say which is current, and say where the daily newsletter's effort goes given a measured 0.00% CTR.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **What a Paragraph Playbook actually is** | A Playbook is Paragraph's RECURRING multi-step agent workflow: a schedule, a set of Steps, and a set of Deliverables (Paragraph article, X post, LinkedIn post, optional X Article, optional video), with per-platform auto-publishing approvals and versioned self-updates. It is distinct from an Automation, and the docs say so in one line: "Manual runs only when you start it with **Run now**. Recurring work is set up in Playbooks" (`/agent/scheduled-tasks`). NONE of our existing Paragraph docs (2527, 2528, 2538, 2348) mentions the feature. |
| **The only documented Playbook is Changelog** | Paragraph documents exactly one: the Changelog Playbook, which reads up to 25 GitHub events per repository per run, groups them into features, writes the article, drafts the social versions, and can check its own article against "the approved claims" up to twice before falling back to a full review (`/getting-started/quickstart`). There is NO `/agent/playbooks` page in the sitemap - 28 pages, none of them Playbooks - so the feature is real, shipping, and documented only inside other pages. Treat the quickstart Step as the spec until a page exists. |
| **Build our daily edition as a Playbook? NO, not yet** | The Changelog Playbook is built around a code repository as its source, and our source is a human decision plus a poidh bounty read. What IS worth copying is its SHAPE: fixed steps, deliverables toggled per run, auto-publishing approved per platform and off by default, and a focus line that applies to one run only. We already have three of those four in `automation/make-agent-paste.sh` and the clip flow. |
| **Auto-publishing: keep it off, and now we know exactly how far it goes** | Paragraph's own docs state Playbook auto-publishing "publishes to your website without sending a newsletter", covers the Paragraph article, the X post and the LinkedIn post, and "deliberately leaves Articles out". So an approved Playbook publishes three surfaces unattended. Doc 2528's standing rule (never enable the Post-on-X automation) extends to Playbook auto-publishing, and for the same reason: one tap authorizes every future run. |
| **The 0.00% CTR, reframed by Paragraph's own doctrine** | Paragraph's analytics page states the framing plainly: "Judge each channel by its own job. A thread's job is the click back to the piece. A newsletter's job is delivery and opens." Our 0.00% is a CLICK number measured on an EMAIL, which by that doctrine is the wrong scoreboard for that channel. The right one is the **Campaigns tab**, which reports "traffic by channel, clickthroughs, and signups attributed to sends" - a surface no ZAO doc has ever opened. READ CAMPAIGNS BEFORE spending another hour on email copy. |
| **Where the effort goes, given the measurement** | Distribution, not the email body, and this is now backed by two independent things rather than one. Paragraph's own distribution doc says a thread is "written to earn the click back to the full piece"; our own poidh entry data (doc 2528's sibling measurement, and the bounty rounds themselves) shows entries arriving from X and Farcaster, never from the email. The email's job is delivery and opens; the click comes from the social post. |
| **Credits: the rule that matters is free** | "Writing and publishing yourself doesn't use credits. Credits only cover work the agent does for you" (`/account/plans-and-credits`). Our markdown-first flow costs zero credits by construction. Also new since doc 2528: **connecting X or LinkedIn for the first time adds 300 one-time credits per service**, non-recurring, not granted for connections made before the bonus launched. |
| **Plans, current as of 2026-09-24** | Free $0 / 500 credits, Starter $20 / 1,500, Growth $100 / 8,500, Scale $200 / 17,500, annual billing saves 20%, Enterprise custom. @thezao is on Starter. Credit top-ups are a Scale feature, so on Starter the 1,500 is a hard monthly ceiling. |
| **Paid-subscription revenue cut** | ~5% of paid-subscription revenue, per `dev-workflows/944-newsletter-growth-deliverability-playbook`, which corrected an earlier doc that wrongly recorded 0%. Free publishing and subscriber collection are genuinely free. Not re-verified against a pricing page today; treat 5% as the standing number and re-check before any paid-tier launch. |
| **MCP is a one-line install and we have not used it** | `claude mcp add paragraph --transport http https://mcp.paragraph.com/mcp`, hosted, browser auth, no API key management (`/developers/mcp`). Paragraph also ships agent skills at `github.com/paragraph-xyz/skill` following the agentskills.io standard. The zaoonparagraph lane added this server on 2026-09-24 and it currently reads "Needs authentication". |

## 1. What Playbooks are, from Paragraph's own pages

The feature has no page of its own. Everything below is quoted from pages that mention it in passing.

| Element | What the docs say | Where |
|---|---|---|
| Definition by contrast | "**Manual** runs only when you start it with **Run now**. Recurring work is set up in Playbooks." | `/agent/scheduled-tasks` |
| Deliverables | Paragraph article, X post, LinkedIn post, plus optional **X Article** and optional **Video** (format, length, style, narration, captions, music), each toggled under Deliverables | `/getting-started/quickstart`, `/audience/x-articles` |
| Steps, with self-checking | "Check the article automatically" reads the article "against the approved claims and the changes left out of it"; a failing check is corrected and re-checked "up to twice", then a full review runs and outputs wait as drafts "even where auto-publishing is on" | `/getting-started/quickstart` |
| Auto-publishing | Approved per platform under Advanced; "publishes to your website without sending a newsletter"; deliberately excludes X Articles because publishing one needs X Premium | `/getting-started/quickstart`, `/audience/x-articles` |
| Focus for this run | A one-run emphasis that steers only the story-choosing and writing steps, never the steps that collect facts, "so a focus can't make a run claim something your code doesn't show" | `/getting-started/quickstart` |
| Versioning | Most Playbook updates install themselves; one needing new access or changing a choice waits for a company admin; "runs already in progress keep the version they started with" | `/getting-started/quickstart` |

**The design principle worth stealing** is the focus/fact separation: the steering input touches the writing steps and cannot touch the fact-collecting steps. That is the same guard as our placeholder refusal in `automation/make-agent-paste.sh`, arrived at independently.

## 2. Our own library of "playbooks", and which are current

Seven ZAO docs carry Paragraph playbook content. Ranked by how much of it is still true.

| Doc | What it is | last-validated | Verdict |
|---|---|---|---|
| `business/2528-paragraph-beyond-the-post-sept2026` | The API/MCP/credits reference, read off docs.paragraph.com and the OpenAPI spec | 2026-09-21 | CURRENT. The one to read first. |
| `dev-workflows/2538-paragraph-ai-agent-workflow-improvements` | Agent behaviour: cover generation, draft-vs-chat, tense leakage | 2026-09-22 | CURRENT. |
| `dev-workflows/944-newsletter-growth-deliverability-playbook` | Growth, deliverability, platform comparison, the 5% cut | 2026-09-22 | CURRENT. |
| `business/2527-paragraph-features-unused-sept2026` | Inventory of unused surfaces | 2026-09 | Superseded in part by 2528, which corrects it. |
| `business/2348-newsletter-craft-paragraph-mcp` | Craft rules, Mode C MCP playbook, node catalogue, voice guide | 2026-08-20 | Craft holds; MCP details predate the hosted `mcp.paragraph.com` route. |
| `cross-platform/2189-paragraph-brand-growth-playbook` | Brand growth, collectibles, per-brand publications | 2026-08-03 | STALE by the 30-day SLA. Its four Next Actions were all due before 2026-08-25. |
| `community/1301-zao-newsletter-growth-playbook-jul2026` | July growth playbook | 2026-07 | STALE. Predates the agent fleet, the Starter upgrade and the 0.00% measurement. |
| `business/1348-zao-newsletter-paragraph-paid-tiers-jul2026` | Paid tiers activation | 2026-07 | STALE, and the number 1348 is AMBIGUOUS - it also resolves to `wavewarz/1348-wavewarz-trader-community-growth-jul2026`. Cite the path. |

## 3. Distribution, as Paragraph designs it

- **Every post can fan out** into an X thread, a LinkedIn version and a newsletter send, each an adaptation rather than a copy. Content keeps them in one row so a piece's missing formats are visible at a glance.
- **LinkedIn link placement is a documented deliverability trick**: a Playbook's LinkedIn post puts the article link "in the first comment rather than the post, since LinkedIn shows posts with links to fewer people". We have been putting the link in the post body.
- **A standing queue with best-time scheduling** spaces a week of posts rather than firing everything at publish.
- **Nothing posts without approval**, and a reader subscription event "cannot directly start a public action", which is a deliberate guard against reader-controlled data publishing on your behalf.

## 4. What Paragraph measures, and the tab we have never read

| Tab | What it reports |
|---|---|
| Web | Traffic to site and posts |
| Newsletter | Delivery rate and opens |
| Social | X followers, impressions, post engagement (needs X connected) |
| **Campaigns** | **Traffic by channel, clickthroughs, and signups attributed to sends** |
| Search & AI | Search visits, AI-assistant visits (ChatGPT, Perplexity), AI crawler hits |

Our 0.00% CTR finding came from the Newsletter surface. Campaigns is the surface that attributes traffic and signups to a send, and no ZAO doc records anyone opening it. A PDF export exists for taking the numbers out of the app.

**Deliverability advice Paragraph gives, which we already satisfy:** publish consistently at similar times (we publish daily), and ask new subscribers to reply or move the email to their primary inbox (we do not do this, and it is free).

## 5. Contradictions and open questions, carried forward

| Item | State |
|---|---|
| API rate limit | Pricing page says 40 req/min on Starter; the live `X-RateLimit-Limit` header reads 100. Unreconciled since 2026-09-21 (doc 2528). |
| Analytics 132 vs 2 | The views/opens discrepancy is unexplained by the public schema. Settling it needs `POST /v1/analytics/query`, a write call nobody has run. |
| Per-action credit costs | Still undisclosed. Only the monthly totals are public. Budget from the Usage dashboard. |
| Two-route rendering defect | `@[publicationSlug]/[slug]` renders a space before punctuation after links; `/writing/` does not. Paragraph's own spec names the buggy route as canonical. Bug report drafted in 2528, never sent. |
| No Playbooks doc page | 28 pages in the sitemap, none for Playbooks, while two other pages reference it as an existing surface. Re-check the sitemap monthly. |

## Also See

- [business/2528-paragraph-beyond-the-post-sept2026](../2528-paragraph-beyond-the-post-sept2026/)
- [business/2527-paragraph-features-unused-sept2026](../2527-paragraph-features-unused-sept2026/)
- [dev-workflows/2538-paragraph-ai-agent-workflow-improvements](../../dev-workflows/2538-paragraph-ai-agent-workflow-improvements/)
- [dev-workflows/944-newsletter-growth-deliverability-playbook](../../dev-workflows/944-newsletter-growth-deliverability-playbook/)
- [business/2348-newsletter-craft-paragraph-mcp](../2348-newsletter-craft-paragraph-mcp/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Open the Campaigns tab in Paragraph analytics and record clickthroughs and signups attributed to the last 10 sends, so the 0.00% CTR claim is measured on the surface built for it | @Zaal | Measurement, pasted to the zaoonparagraph lane | 2026-09-26 |
| Authenticate the `paragraph` MCP server already added to this Mac (`/mcp`), so drafts can be read back without the public API key | @Zaal | Config | 2026-09-25 |
| Move the article link out of the LinkedIn post body and into the first comment on the next LinkedIn distribution, per Paragraph's own documented behaviour | @Zaal | Distribution change | 2026-09-26 |
| Add one line to the subscriber welcome asking new readers to reply or move the email to their primary inbox | @Zaal | Paragraph config | 2026-09-30 |
| Re-validate `cross-platform/2189-paragraph-brand-growth-playbook` or mark it superseded; its four actions were due 2026-08-05 to 2026-08-24 and none shipped | @Zaal | Doc decision | 2026-10-06 |
| Re-check `docs.paragraph.com/sitemap.xml` for a Playbooks page and update this doc when one appears | @Zaal | Doc refresh | 2026-10-24 |

## Sources

- [Paragraph docs index](https://docs.paragraph.com/.md) - [FULL, method: curl of the raw-markdown mirror, 2026-09-24]
- [Plans and credits](https://docs.paragraph.com/account/plans-and-credits.md) - [FULL, method: curl. Source of the plan table, the credit rule and the 300-credit connection bonus]
- [Quickstart, which carries the Changelog Playbook spec](https://docs.paragraph.com/getting-started/quickstart.md) - [FULL, method: curl. The only substantial Playbooks documentation that exists]
- [Distribution](https://docs.paragraph.com/audience/distribution.md) - [FULL, method: curl. Source of the LinkedIn first-comment behaviour and the approval guard]
- [Analytics](https://docs.paragraph.com/audience/analytics.md) - [FULL, method: curl. Source of the Campaigns tab and the per-channel doctrine]
- [Scheduled tasks and automations](https://docs.paragraph.com/agent/scheduled-tasks.md) - [FULL, method: curl. Source of the Playbook-vs-automation distinction]
- [X Articles](https://docs.paragraph.com/audience/x-articles.md) - [FULL, method: curl. Source of the auto-publishing exclusion]
- [Newsletters](https://docs.paragraph.com/publishing/newsletters.md) - [FULL, method: curl. Deliverability advice, newsletter-only posts]
- [MCP server](https://docs.paragraph.com/developers/mcp.md) and [agent skills](https://docs.paragraph.com/developers/agent-skills.md) - [FULL, method: curl]
- [docs.paragraph.com sitemap](https://docs.paragraph.com/sitemap.xml) - [FULL, method: curl. 28 pages, no Playbooks page]
- Hacker News Algolia API, query "paragraph.xyz newsletter" - [FULL, method: keyless API. **0 hits.** No HN discussion of this platform exists to cite, which is itself the community signal: Paragraph is not being discussed where this library usually looks]
