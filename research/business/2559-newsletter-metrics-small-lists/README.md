---
topic: business
type: decision
status: research-complete
last-validated: 2026-09-27
superseded-by:
related-docs: "944, 2554"
original-query: "What other newsletter operators do about click tracking at small list sizes: is CTR meaningful at a few hundred sends with 0 to 2 unique clickers per edition, what metrics do serious daily newsletter publishers track instead, and what has been written about a platform dashboard reporting 0.00% CTR while link clicks exist. Context: The ZAO newsletter on Paragraph; tracker card 10068 asks whether to retire the click-tracking plan in favour of subscriber count and open rate. (Counts redacted in this public copy; the original query with figures is in the vault.)"
tier: STANDARD
---

# 2559 - Newsletter metrics on a small list: what to retire, what to keep, and what the click count says

> **Goal:** Settle tracker card 10068 with evidence. Decide whether The ZAO newsletter should keep a click-tracking plan at its current size, and if not, what replaces it.

## This is a stub, on purpose

The full doc, with the newsletter's exact send, open and clicker counts and the confidence intervals computed on them, lives in the vault:

`~/zao-vault/projects/newsletter-metrics-doc-2559-2026-09-25.md`

ZAOOS is a public repository and the standing rule is never to quote a member count in one. This doc's whole argument is a Wilson interval on exactly those counts, so stripping them would leave a measurement doc with no measurements. Zaal ruled on 2026-09-27: hold the counts in the vault, leave this stub here so the number 2559 resolves and the index row exists.

## What the full doc concludes, without the denominators

| Decision | Ruling |
|---|---|
| Per-edition click rate | RETIRE. At this list size one human moves it by a quarter of a point, and every source that names a threshold puts the floor at 300 to 1,000 recipients per comparison and 30 to 100 click events. |
| Rolling 30-day unique clickers | KEEP, as a count, reported quarterly. At the 30-day level the interval excludes every published newsletter median (Beehiiv 3.23%, newsletterbenchmark.com 3.3%, Mailchimp 2.62%), so the low figure is a real finding: the daily is read, not clicked through. |
| Open rate | KEEP as the primary trend line, with the Apple MPP caveat written beside it every time. Apple Mail drives 45 to 58% of opens and MPP inflates by 15 to 20 points on Apple-heavy lists. |
| Subscriber count, net | KEEP as the headline number. No proxy can fake it. It is read from the warehouse and never published. |
| Reply rate | ADD, counted by hand. Unfakeable by MPP and by link scanners. |
| Dashboard CTR | IGNORE; read the warehouse. The dashboard showed 0.00% while hundreds of clicks existed (doc 2554). |

Sources, method per source, the MPP figures, the benchmark table and the Next Actions table are in the vault copy. Twenty-one sources, two fetched raw by curl, one Reddit thread in full via Arctic Shift, the rest read through exa with title and date confirmed.

## Also See

- [Doc 944](../../dev-workflows/944-newsletter-growth-deliverability-playbook/) - the parent playbook.
- [Doc 2554](../2554-paragraph-ctr-correction-and-fleet/) - the 0.00% correction.
- Tracker card 10068 - this doc is its evidence.
- bettercallzaal/zaoonparagraph `automation/analytics.sh` - the warehouse read, merged.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rule card 10068 done: retire the plan, keep the count. Shipped when the card reads done. | @Zaal | Decision | 2026-09-28 |
| Add a hand-counted reply number per edition to analytics.sh. Shipped when the monthly summary prints it. | zaoonparagraph lane | PR | 2026-09-30 |
| Ask Paragraph whether newsletter_metrics can expose an MPP or client flag. Shipped when the answer is in the vault copy. | @Zaal | Ask | 2026-10-10 |
| Rewrite the metrics line in doc 944 to drop click-to-open and add reply rate. Shipped when 944's last-validated moves. | zaoonparagraph lane | PR | 2026-10-10 |
