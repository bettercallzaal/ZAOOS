---
topic: business
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "944, 2554"
original-query: "What other newsletter operators do about click tracking at small list sizes: is CTR meaningful at ~420 sends with 0-2 unique clickers per edition, what metrics do serious daily newsletter publishers track instead (subscriber growth, open rate caveats post-Apple MPP, reply rate, forward rate), and what has been written about the specific failure mode of a platform dashboard reporting 0.00% CTR while link clicks exist. Context: The ZAO newsletter on Paragraph, 419 subscribers, 20.8% opens over 11 editions in 30 days, 16 unique clickers total, tracker card 10068 asks whether to retire the click-tracking plan in favour of subscriber count and open rate."
tier: STANDARD
---

# 2559 - Newsletter metrics at 419 subscribers: what to retire, what to keep, and what the click number actually says

> **Goal:** Settle tracker card 10068 with evidence. Decide whether The ZAO newsletter should keep a click-tracking plan at its current size, and if not, what replaces it.

## Key Decisions

| Decision | Ruling | Why |
|---|---|---|
| Per-edition click rate | **RETIRE.** Never quote it, never plan around it. | At 419 sends, 0 to 2 clickers per edition gives a 95% Wilson interval of [0.00%, 0.91%] for a zero and [0.13%, 1.72%] for a two. One human moves the number by 0.24 points. Every source that gives a threshold puts the floor at 300 to 1,000 deliverable recipients per comparison and 30 to 100 click events before a rate is "directional." We have neither. |
| Rolling 30-day unique clickers | **KEEP, as a count, reported quarterly.** | 16 unique clickers across 4,615 sends is 0.35% with a 95% interval of [0.21%, 0.56%]. That interval excludes every published newsletter median (Beehiiv 3.23%, newsletterbenchmark.com 3.3%, Mailchimp 2.62%, media sector 2.97%). So at the 30-day level the low number is a real finding, not noise. It says the daily is read, not clicked through, which matches its format: one to three links, mostly at the foot. |
| Open rate | **KEEP as the primary trend line, with the MPP caveat written next to it every time.** | 960 of 4,615 in 30 days, 20.8%, interval [19.7%, 22.0%], a denominator big enough to read. Apple MPP inflates opens by 15 to 20 points on Apple-heavy lists, and Apple Mail drives 45 to 58% of all opens (Litmus via email-dev.com, 2026), so the absolute number is soft. The direction is not. A sustained drop is the one early deliverability warning we have. |
| Subscriber count, net of unsubscribes | **KEEP as the headline number.** | The only metric no proxy can fake. Every source that ranks metrics puts net list growth in the top five. Ours is 419 to 420 on every send in the window, flat. |
| Reply rate | **ADD.** Count replies per edition by hand from the inbox. | Unfakeable by MPP and by link scanners. Validity's 2026 read, via noticemesenpai: even 1% is real audience investment. Nobody in this estate counts it today. |
| Dashboard CTR | **IGNORE THE DASHBOARD FIGURE; read the warehouse.** | Paragraph's dashboard reported 0.00% CTR while `newsletter_link_clicks` held 351 clicks. Doc 2554 recorded the correction. `automation/analytics.sh` in zaoonparagraph (PR #86, still open) is the read. |

**Card 10068 resolution:** retire the click-tracking PLAN, keep the click COUNT. The card's own wording, "in favour of subscriber count and open rate," is right on the first half and needs the MPP caveat on the second.

## Findings

### 1. What our own numbers say when you put an interval on them

Measured 2026-09-25 17:5x EDT from Paragraph's analytics warehouse (`newsletter_metrics`, `newsletter_link_clicks`) via `automation/analytics.sh` run from the `automation/analytics` branch of bettercallzaal/zaoonparagraph. Wilson 95% intervals computed in this doc.

| Measure | Point | 95% interval | Reads as |
|---|---|---|---|
| One edition, 0 clickers of 419 | 0.00% | [0.00%, 0.91%] | Nothing. Consistent with a true rate anywhere under 1%. |
| One edition, 1 clicker of 419 | 0.24% | [0.04%, 1.34%] | Nothing. Consistent with half the published medians and with zero. |
| One edition, 2 clickers of 419 | 0.48% | [0.13%, 1.72%] | Nothing. |
| 30 days, 16 unique clickers of 4,615 | 0.35% | [0.21%, 0.56%] | **Real.** Below every published median. |
| 30 days, 960 opens of 4,615 | 20.8% | [19.7%, 22.0%] | Real, and MPP-inflated by an unknown amount. |
| Day 268, 49 opens of 417 at two hours | 11.8% | [9.0%, 15.2%] | Too early. |

Two more numbers that settle the per-edition question. To distinguish a 1% click rate from a 3% one at 95% confidence and 80% power takes about 767 deliveries per arm, which is 1.8 editions per arm at our size, so any single-edition comparison is underpowered by construction. And at our observed 0.35% rate it takes 68 editions to accumulate 100 clicks, which Jagadeesh R's Beta-binomial write-up puts as the floor for "high confidence." We publish daily, so that is ten weeks of sends to get one confident read.

### 2. What the field says about small-list CTR

Every source that names a threshold agrees, and the thresholds are all above our list size.

- **500 to 1,000 deliverable recipients per variant** for most email comparisons; **1,000 to 2,000 for newsletters** because baseline conversion is low; **under 300 unique opens "rarely reach statistical significance."** Email List Validation, 2026-08-30. [FULL, exa]
- **10 responses gives plus or minus 20 to 30 points of uncertainty; 100 gives 6 to 10; 1,000 gives 2 to 3.** At a 2% click rate "you need 1,500 emails to get 30 clicks" and "5,000 emails to get 100 clicks." Under 30 interactions, "recommendations vary significantly with new data." Jagadeesh R, Substack, 2025-05-29. [FULL, exa]
- **Wilson or exact-binomial intervals, not the Wald approximation,** for small n and rates near zero, because the shortcut "can make the interval look cleaner than the data supports." Sovran, 2026-08-06, and Webeyez binomial CTR guide. [FULL, exa]
- **Mailchimp's own benchmark excludes lists under 1,000 subscribers** from its dataset entirely: "We only tracked campaigns that went to at least 1,000 subscribers." Which means the 2.62% all-users click rate we would compare against was never measured on a list our size. [FULL, exa]

### 3. What serious newsletter operators track instead

Sources converge on the same five, in roughly this order.

| Metric | Who says so | Why it survives |
|---|---|---|
| **Click rate, clicks over delivered, as a trend within one list** | beehiiv (2026-01-13), email-dev.com (2026-05-24), Growtoro (2026-06-28), senderreputation.org (2026-06-20) | MPP prefetches images, not links. Partly contaminated by security-gateway "dark clicks" (over 3 million a day in early 2025 per senderreputation.org), but constant within one audience so the trend holds. |
| **Net list growth** | Constant Contact small-business survey (top five), email-dev.com, Growtoro, beehiiv | "No proxy servers can fake this one." |
| **Reply rate** | Validity 2026 via noticemesenpai and All About Email #242, beehiiv, r/Newsletters | Requires a human to write. Also a positive trust signal to mailbox providers. Most ESPs do not surface it; count by hand. |
| **Disaffection: unsubscribes plus complaints plus bounces** | Validity via senderreputation.org and noticemesenpai | Negative signals are weighted most heavily by mailbox providers and are hardest to fake. |
| **Engaged-subscriber share** (clicked in the last 60 to 90 days, over list) | Growtoro | The slice a sponsor is actually buying. For us: 16 of 419 in 30 days, 3.8%. |

**Open rate is demoted, not deleted, by every source.** email-dev.com: "Keep tracking it. Just stop treating it as a primary performance indicator." Doxiefy: "a significant drop in opens likely reflects a real deliverability or engagement problem." beehiiv: "opens should be treated as vibes, not data." The consistent instruction is a trend line in a secondary position with an MPP label.

**Click-to-open rate is retired by every source** because its denominator is the broken one. We do not report it and should not start.

**The community source** (r/Newsletters, 2026-02-24, 14 comments via Arctic Shift, [FULL]) ranks revenue first, then replies and clicks, then deliverability, with one operator saying "I don't trust the native platform stats since they're not always accurate" and tracking through UTM parameters instead. Sample is ten operators, not a study; the ordering matches the trade sources.

### 4. The MPP numbers, so the open-rate caveat has figures behind it

- Apple Mail drives **45 to 58%** of all email opens depending on dataset; MPP adoption is about **96%** among those shown the prompt. email-dev.com, 2026-05-24, citing Litmus. [FULL, curl]
- Apple's proxy drove **73.11%** of all pixel-firing events January to August 2024. Validity via massmailer.io, 2026-06-30. [FULL, exa]
- One publisher's total open rate went from **22.6% to 40.5%** across the MPP rollout with no audience change. Omeda via noticemesenpai, 2026-07-01. [FULL, exa]
- Inflation of **15 to 20 percentage points** on Apple-heavy lists. senderreputation.org, 2026-06-20. [FULL, exa]

Our 20.8% therefore sits below the pre-MPP figure of that Omeda publisher and well below the 38 to 43% platform medians (beehiiv 37.67% for 2024, MailerLite 43.46% for 2025). Two readings are consistent with that: a low-Apple audience, or a genuinely lower read rate. We cannot tell which from the warehouse, because Paragraph's `newsletter_metrics` does not expose a client or MPP flag. That is the one thing worth asking Paragraph for.

### 5. Benchmarks, for context only, with their measurement caveats

| Source | Dataset | Open | Click | Note |
|---|---|---|---|---|
| beehiiv State of Newsletters 2025 | 15.68 billion sends, 2024 | 37.67% | 4.59% posts, 13.48% automations | Platform-wide, all sizes. [FULL, exa] |
| beehiiv click-rate guide | 2025 | | 3.23% avg; media and creator 6.17% | Defines CTR as unique clickers over delivered. [FULL, exa] |
| newsletterbenchmark.com | n = 137,548 cohort rows | 38.0% median | 3.3% median | Filterable by list size; the filter needs JS and was not read. [PARTIAL, curl: medians only] |
| Mailchimp | lists over 1,000 only, Dec 2023 | 35.63% | 2.62% | Excludes our size class. [FULL, exa] |
| mailneo media and publishing | 1.46 billion messages | 42.60% | 2.97% | Conversion 0.84%. [FULL, exa] |
| MailerLite 2025 | 3.6 million campaigns | 43.46% | 2.09% | Via heistbrain. [PARTIAL, secondary] |

Our 30-day unique click rate of 0.35% is one sixth of the lowest median here. Our open rate is about half. Both are real gaps at the 30-day level. Neither is visible at the single-edition level, which is the whole point of the card.

### 6. The dashboard failure mode

Paragraph's dashboard showed **0.00% CTR** for the publication while `newsletter_link_clicks` held **351 rows**. This lane planned around the zero for weeks. The correction is in doc 2554 (`business/2554-paragraph-ctr-correction-and-fleet`, merged in PR #3647). Nothing found in Paragraph's docs, changelog or the paragraph-mcp README describes how the dashboard computes CTR or acknowledges a discrepancy; the analytics SQL API docs list "click-through rate" as a common query but give no formula. [Paragraph API docs: FULL, exa. Paragraph changelog: searched, no hit.]

The generalisable lesson is not about Paragraph. A ratio whose numerator is small and whose denominator is defined by the platform will show 0.00% for many honest reasons: rounding at one decimal (our 0.35% rounds to 0.4%, but a per-edition 1 of 419 is 0.24% and rounds to 0.2%, and 0 of 419 is 0.00% and correct), counting unique clickers where the operator expected total clicks, or excluding clicks the platform classes as non-human. Read the table, not the tile. `automation/analytics.sh` exists so that this lane never reads the tile again.

## Contradictions and open questions

- **Is our low open rate an Apple artefact or a read-rate problem?** Unresolvable from the warehouse. Paragraph exposes no client breakdown. Ask.
- **Are "dark clicks" inflating even our 16?** Possibly. senderreputation.org and email-dev.com both flag security gateways following links. At 16 clickers the contamination could be a large share. Another reason not to treat the count as precise.
- **One source disagrees on click rate as the headline.** senderreputation.org says clicks are "now contaminated too" and leads with conversion and reply rate instead. The other six keep clicks first. For a free newsletter with no conversion event, the disagreement does not change our ruling: replies are added, clicks stay as a count.

## Also See

- [Doc 944](../../dev-workflows/944-newsletter-growth-deliverability-playbook/) - the parent playbook; its line 67 already said "opens are broken, track clicks, click-to-open, replies." This doc supersedes the click-to-open half of that sentence.
- [Doc 2554](../2554-paragraph-ctr-correction-and-fleet/) - the 0.00% correction, merged in PR #3647.
- Tracker card 10068 (todo, due 2026-09-26) - "Retire any newsletter-click-tracking plan in favor of subscriber-count." This doc is its evidence.
- bettercallzaal/zaoonparagraph `automation/analytics.sh` (PR #86) - the measurement.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rule card 10068: `zao-tracker ruling 10068 done "retire the plan, keep the count"`. Shipped when the card reads done. | @Zaal | Decision | 2026-09-26 |
| Merge zaoonparagraph PR #86 so `analytics.sh` is on main and the warehouse read is one command. Shipped when `git show origin/main:automation/analytics.sh` succeeds. | @Zaal | PR | 2026-09-27 |
| Add a `--replies N` flag to `analytics.sh` that stores a hand-counted reply number per edition in `automation/replies.json`, so reply rate has a home. Shipped when the flag writes and the monthly summary prints it. | zaoonparagraph lane | PR | 2026-09-30 |
| Ask Paragraph whether `newsletter_metrics` can expose an MPP or client flag, via their support chat, so the open rate can be split. Shipped when the answer is in this doc. | @Zaal | Ask | 2026-10-10 |
| Rewrite the metrics line in doc 944 (line 67) to drop click-to-open and add reply rate, citing this doc. Shipped when 944's `last-validated` moves. | zaoonparagraph lane | PR | 2026-10-10 |

## Sources

Method is stated per source, per the fetch rule. "exa" means full text read through exa web_search highlights and confirmed against the page title and date; "curl" means the raw HTML was fetched and stripped in this session.

- [Adapting to Apple Mail Privacy - Email Developer, Pavel Ivanov, 2026-05-24](https://email-dev.com/adapting-to-apple-mail-privacy/) [FULL, curl, 36,365 chars]
- [How To Measure Real Email Engagement in 2026 - beehiiv, Noelle Daoire, 2026-01-13](https://www.beehiiv.com/blog/email-engagement-metrics) [FULL, curl, 30,575 chars]
- [Newsletter Benchmarks - newsletterbenchmark.com](https://newsletterbenchmark.com/) [PARTIAL, curl: headline medians and n only; the list-size filter is client-side JS and was not driven]
- [Which Newsletter analytics matter really? - r/Newsletters, 2026-02-24](https://www.reddit.com/r/Newsletters/comments/1rd9zf8/which_newsletter_analytics_matter_really/) [FULL, Arctic Shift via zao-fetch-reddit.sh, 14 comments]
- [Why More Data Leads to Better Decisions - Jagadeesh R, 2025-05-29](https://jagadeeshrajarajan.substack.com/p/why-more-data-leads-to-better-decisions) [FULL, exa]
- [Email A/B Test Sample Size Rules - Email List Validation, 2026-08-30](https://emaillistvalidation.com/blog/email-ab-test-sample-size-calculator-rules/) [FULL, exa]
- [Confidence Interval Analysis: Ad Testing Guide - Sovran, 2026-08-06](https://sovran.ai/blog/confidence-interval-analysis) [FULL, exa]
- [Click Through Rate Binomial Distribution - Webeyez](https://webeyez.com/insights/guides/click-through-rate-binomial-distribution-guide) [FULL, exa]
- [Broken Newsletter Stats - Blue Penguin Development, Michael Katz, 2025-07-25](https://bluepenguindevelopment.com/2025/07/broken-newsletter-stats/) [FULL, exa]
- [Issue #242 - All About Email, Simon Harper, 2026-06-08](https://newsletter.allabout.email/p/issue-242-all-about-email) [FULL, exa]
- [Email Metrics After Apple MPP: What Still Works - noticemesenpai, 2026-07-01](https://noticemesenpai.com/learn/email-metrics-apple-mail-privacy-what-to-track/) [FULL, exa]
- [Why Email Open Rates Are Broken in 2026 - senderreputation.org, 2026-06-20](https://senderreputation.org/blog/why-email-open-rates-broken-2026-what-to-measure) [FULL, exa]
- [Email Marketing Analytics: 2026 Metrics and KPIs Guide - massmailer.io, 2026-06-30](https://massmailer.io/blog/email-marketing-analytics/) [FULL, exa]
- [The Newsletter Metrics That Actually Predict Revenue - Growtoro, 2026-06-28](https://growtoro.com/blog/newsletter-analytics-beyond-open-rate) [FULL, exa]
- [How Apple's Mail Privacy Protection Impacts Email Marketing - Constant Contact, 2021-09-21](https://www.constantcontact.com/blog/apple-mail-privacy-protection-for-email-marketing/) [FULL, exa; five years old, used only for the small-business top-five list]
- [2025 State of Email Newsletters - beehiiv, 2025-01-29](https://www.beehiiv.com/blog/2025-state-of-email-newsletters-by-beehiiv) [FULL, exa]
- [How to Increase Click Rate in Email Marketing - beehiiv](https://www.beehiiv.com/blog/how-to-increase-click-rate-in-email-marketing) [FULL, exa]
- [Email Marketing Benchmarks - Mailchimp, data to Dec 2023](https://mailchimp.com/resources/email-marketing-benchmarks/) [FULL, exa]
- [Media and publishing email benchmarks 2026 - mailneo](https://www.mailneo.co/benchmarks/media-publishing) [FULL, exa]
- [Run an analytics SQL query - Paragraph API docs](https://paragraph.com/docs/api-reference/analytics/run-an-analytics-sql-query) [FULL, exa]
- [paragraph-xyz/paragraph-mcp - GitHub](https://github.com/paragraph-xyz/paragraph-mcp) [FULL, exa README]
- Paragraph analytics warehouse, publication @thezao, tables `newsletter_metrics` and `newsletter_link_clicks`, read 2026-09-25 17:5x EDT via `automation/analytics.sh`. [FULL, API]
