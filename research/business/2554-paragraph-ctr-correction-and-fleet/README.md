---
topic: business
type: audit
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2547, 2549, 2528, 944"
original-query: "I just emailed myself two paragraph articles can we review them and research them"
tier: STANDARD
---

# 2554 - The 0.00% CTR was wrong, and what Paragraph's own two articles say

> **Goal:** Review the two Paragraph posts Zaal forwarded (the nine-agent fleet, and AI crawler analytics), and check their claims against our own publication. Checking the second one led to querying Paragraph's analytics database directly, which falsified the figure four ZAO docs and a week of strategy rest on.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **THE 0.00% CTR CLAIM IS FALSE. Stop citing it.** | Measured today against Paragraph's own analytics warehouse: **351 clicks across 291 link rows on 28 posts**, most recent **2026-09-24 02:29 UTC**. Last 30 days alone: **3,779 sends, 804 opened (21.3%), 55 clicks**. That is roughly **1.5% of sends and 6.8% of opens**, not zero. Docs 944, 2547 and 2549 all carry the 0.00% figure and all need correcting. |
| **Where the 0.00% came from, most likely** | The in-app Newsletter tab, read once and believed since. Whatever it displays, the warehouse behind it disagrees with it. We have never cross-checked a dashboard number against the tables until today. Treat the in-app rate as a display, not a measurement. |
| **What the real numbers say to do** | Open rate is 17-25% per edition and stable. Clicks per edition run 0 to 6 - EXCEPT Day 246, which took **33 clicks on its own**, five times any other edition in the window. One edition doing 5x the rest is the most useful fact in this doc, and nobody has ever looked at why. READ DAY 246 before writing another CTA. |
| **The most-clicked links are not the ones we push** | Lifetime top URLs: the ZAO coin page (25), the publication home (19), a poidh bounty (12), zaostock.com (11), ZABAL Gamez recordings pages (8 each). Readers click the THING, not the festival's RSVP. |
| **Article 2 is the actionable one: Search & AI** | Paragraph now records **21 AI crawlers from 12 companies** at the edge, labelled by intent (training, search, assistant), plus visits from **11 AI assistants** and **11 search engines**, and a most-crawled-posts list. "Neither needs a paid plan." Crawler tracking requires a live Paragraph-served website, which @thezao has. This is a surface nobody in the estate has opened. |
| **Article 1 is orientation, not instruction** | The nine sub-agents (Writing, Publishing, Media, Video, Website, Social, Research, Scheduling, Brand) explain behaviour we have been diagnosing blind for a week: the cover that appeared unasked was the Media agent; the draft-vs-chat split is the orchestrator routing; and the **Research agent is read-only, so it "never drafts, posts, or changes anything"** - that is the one to ask for analytics rather than the general chat. |
| **Two fleet facts that change our rules** | **Publishing** owns test emails, so the `test-email` call in doc 2549 has an agent-side equivalent. **Brand** "reads a site's real stylesheets rather than guessing from a screenshot" - so pointing it at zaostock.com is a better cover fix than describing colours to it. |

## 1. The measurement, and how to re-run it

`POST https://public.api.paragraph.com/api/v1/analytics/query` with `{"sql": "..."}`. The field is `sql`, not `query` - a `query` key returns `400 Validation error - sql: Required`. Doc 2528 listed this endpoint as untested and out of scope; it is neither now.

| Query | Result |
|---|---|
| `SELECT COUNT(*), SUM(click_count), COUNT(DISTINCT post_id), MIN(created_at), MAX(created_at) FROM newsletter_link_clicks` | 291 rows, **351 clicks**, 28 posts, 2026-04-28 to 2026-09-24 |
| Same over `newsletter_metrics` for 30 days | **3,779 sends, 804 opened, 55 clicks, 9 posts** |
| Per-edition join to `posts`, last 21 days | Day 266: 419 sent, 76 opened (18.1%), 2 clicks. Day 265: 419/83 (19.8%)/4. Day 264: 419/89 (21.2%)/4. Day 263: 419/99 (23.6%)/**0**. Day 250: 420/104 (24.8%)/6. **Day 246: 422/99 (23.5%)/33** |
| `campaign_attribution_summary` by `utm_source` | `paragraph-email`: 276 views, **339 clicks**, 0 signups. No source (direct/organic): **29,849 views, 167 clicks, 30 signups** |

The warehouse has 14 tables. The ones worth knowing: `newsletter_metrics` (per-subscriber send, open, click), `newsletter_link_clicks` (per-URL), `campaign_attribution_summary` (utm rollup with signups), `post_views_daily`, `detailed_post_metrics`, `post_email_attribution`, `campaign_events`.

**No crawler table exists in the warehouse.** Article 2's crawler data is recorded at the edge and surfaced in the app's Search & AI tab; it is not queryable through this endpoint today. That is a gap worth knowing before someone promises a dashboard.

## 2. Article 1: the nine-agent fleet (2026-09-08)

Paragraph's agent is an orchestrator over nine specialists: Writing, Publishing, Media, Video, Website, Social, Research, Scheduling, Brand. Routing is automatic and conversational; a badge names the agent running each step. They share one memory of voice, goals and notes, which is why doc 2549's "fill Brand voice and Goals" item pays across every surface rather than one.

What it explains about our own week:
- The unasked cover was the **Media** agent, reached through a readiness request, matching doc 2538's inference.
- The chat-vs-draft split is orchestrator routing, not a bug.
- Sequential requests run in order: the Writing agent finishes the draft before the Social agent takes it.

What to use:
- Ask the **Research** agent for numbers. It is read-only by construction, so it cannot edit a draft while answering.
- Point the **Brand** agent at zaostock.com. It reads real stylesheets.
- The **Social** agent needs X or LinkedIn connected before it can post approved work, which is also the 300-credit connection bonus from doc 2547.

## 3. Article 2: AI crawlers and the Search & AI tab (2026-09-10)

- 21 AI crawlers from 12 companies (OpenAI, Anthropic, Google, Perplexity, Meta, Apple, Amazon among them), each hit named rather than bucketed as bot traffic.
- Labelled by intent: training, search, or assistant (a reader asked something and the bot fetched the page to answer).
- Visits from 11 AI assistants are separated from 11 search engines.
- A most-crawled list, which the article says "is rarely the ones you'd guess".
- Caveats stated by Paragraph: some assistants strip the referrer, so real assistant-driven readership is higher than shown; crawler visits take a few days to appear.
- Requires a live Paragraph-served website for crawler data. The search/AI visitor split works without one. No paid plan needed.

**Why it matters here:** 29,849 page views on this publication carry no utm source at all, against 276 from email. Whatever is driving the reading, it is not the send. The Search & AI tab is the first surface that can name part of that.

## 4. What this costs the existing docs

| Doc | What to change |
|---|---|
| `dev-workflows/944-newsletter-growth-deliverability-playbook` | Its comparison table states 0.00% CTR "measured on this specific list, 366 editions". Replace with the measured rates and the query that produced them. |
| `business/2547-paragraph-playbooks-map` | The Campaigns-tab recommendation stands and is strengthened, but its framing of 0.00% as a fact needs the correction. |
| `dev-workflows/2549-paragraph-setup-tomorrow` | Unaffected in its recommendations; the CTR line in its context needs the same correction. |
| `business/2528-paragraph-beyond-the-post-sept2026` | Its "analytics query is a write call and out of scope" note is now resolved: the call works, takes `sql`, and is read-only in effect. |

## Also See

- [business/2547-paragraph-playbooks-map](../2547-paragraph-playbooks-map/)
- [dev-workflows/2549-paragraph-setup-tomorrow](../../dev-workflows/2549-paragraph-setup-tomorrow/)
- [business/2528-paragraph-beyond-the-post-sept2026](../2528-paragraph-beyond-the-post-sept2026/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Read Day 246 and find what earned it 33 clicks against a 0-to-6 baseline; write the finding into the newsletter craft rules | zaoonparagraph lane | PR | 2026-09-26 |
| Correct the 0.00% CTR line in docs 944, 2547 and 2549 with the measured rates and the query | zaoonparagraph lane | PR | 2026-09-26 |
| Open Analytics, then Search & AI, and record which crawlers and assistants are reading @thezao and which posts they take | @Zaal | Measurement | 2026-09-26 |
| Add a weekly analytics query to the lane's routine so a dashboard number is never trusted alone again | zaoonparagraph lane | PR | 2026-09-30 |
| Point the Brand agent at zaostock.com so covers and social cards read the real stylesheets | @Zaal | Paragraph config | 2026-09-26 |

## Sources

- [Meet the Agent Fleet Behind Your Content Engine](https://paragraph.com/@blog/meet-the-agent-fleet-behind-your-content-engine) - [FULL, method: Gmail thread 1a0d3f4ca64fff15 as plain text, plus curl of the post's `.md` route, 2026-09-24]
- [See Which AI Crawlers Are Reading Your Posts](https://paragraph.com/@blog/see-which-ai-crawlers-are-reading-your-posts) - [FULL, method: curl of the post's `.md` route, 2,534 bytes, 2026-09-24]
- Paragraph analytics warehouse, `POST /api/v1/analytics/query` - [FULL, method: four SQL queries against the live @thezao data with the publication's own API key, 2026-09-24. Results quoted verbatim in section 1]
- Paragraph analytics schema, `GET /api/v1/analytics/schema` - [FULL, method: curl, 16.5 KB, 153 column rows across 14 tables]
