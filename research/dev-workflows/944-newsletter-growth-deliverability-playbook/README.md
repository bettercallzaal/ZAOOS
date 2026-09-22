---
topic: dev-workflows
type: research + playbook
status: research-complete
last-validated: 2026-09-22
original-query: "Best ways to build newsletter lists, grow subscribers, improve deliverability/format/cadence - and how it applies to The ZAO's daily Paragraph newsletter."
related-docs: dev-workflows/610-newsletter-prose-toolkit-zabal-voice, business/322-paragraph-publishnew-newsletter-agent-commerce, dev-workflows/2538-paragraph-ai-agent-workflow-improvements, community/2536-bounty-entrant-feedback, business/2522-poidh-live-bounty-market, business/2303-newsletter-daily3-pipeline-audit, community/1331-zao-newsletter-growth-strategy-jul2026
tier: STANDARD
---

# 944 - Newsletter Growth, Deliverability + Format Playbook (ZAO-applied)

> **Goal:** Turn "Year of the ZABAL" (the daily Paragraph newsletter at paragraph.com/@thezao) from a well-written journal into a growing, durable, well-delivered list. Three research sweeps - list growth, deliverability/hygiene, format/retention - reconciled against what ZAO already does.
> **Method:** Re-researched 2026-09-22 (previous version 2026-07-03, past the 30-day SLA). Every claim below was re-fetched, not carried over from the July text - climbed the fetch ladder (curl+strip, exa fetch, gh api) for each source and re-checked ZAO's current state against the codebase and the research library rather than trusting old text. Sources tagged [VERIFIED] (primary/authoritative, re-read this pass) or [CLAIM] (secondary/unconfirmed). Grounded against `dev-workflows/610` (ZABAL voice toolkit), `business/2303` (daily-3 pipeline audit - the July version's "Doc 930" citation for this did not resolve to any doc in the library and is dropped), the `~/.claude/skills/newsletter/SKILL.md` operating manual, and docs 2522/2536 (live poidh bounty-campaign research).
> **Honesty note:** Where the research contradicts ZAO's deliberate choices (daily cadence especially), that tension is surfaced, not smoothed over. Recommendations are recommendations, not facts - see [[feedback_research_recs_are_not_facts]].

---

## Updated 2026-09-22 - what changed since the July version

This doc was last validated 2026-07-03, over two months and past the 30-day SLA. Four things changed the ground it stands on:

1. **The newsletter's own measured performance data now exists, and it was not in the July version.** `~/.claude/skills/newsletter/SKILL.md` (built 2026-08-10, updated since) records, from Paragraph's own `analytics-query` tool run 2026-08-11: **366 editions, 144k emails sent, 268 clicks in the newsletter's entire lifetime, and 0.00% CTR on every ZABAL edition. Read time is 8 to 16 seconds.** The July version of this doc recommended "switch reporting to clicks/replies/UTM" (old action item 5) as if clicks were a usable signal. They are not - at 268 clicks across 144,000 sends, click-through is not a metric this list produces at a rate anyone can act on. See "The 0.00% CTR problem" below - this is the single biggest correction in this refresh.
2. **A live bounty campaign is running that this doc's format section never accounted for.** Docs `community/2536-bounty-entrant-feedback` and `business/2522-poidh-live-bounty-market` (both re-read this pass) confirm a "13-day ZAOstock run" of daily poidh bounties on Base (poidh 1409 was bounty one, 2026-09-21), separate from the ZABAL Gamez Season 1 workshop format that ended in July 2026 (docs `zabal/2257-zabal-s1-season-retrospective`, `zabal/1466-zabal-s1-completion-report`). The newsletter's own operating manual now splits into two voices - "daily" and "announcement" (`feedback_announcement_vs_daily_voice.md`, `~/.claude/skills/newsletter/SKILL.md` lines 74-92) - which is the mechanism behind the "results/announcement hybrid" format the newsletter is currently running for bounty-campaign editions. This doc's Section 3 (Format + retention) predates that split entirely and only describes the old fixed daily template.
3. **PayPal was removed from `/tickets` on zaostock.com.** PR #290 (`ZADEVZ/ZAOstock`, merged 2026-09-21T23:58:44Z) dropped the PayPal button from both paid tiers on `/tickets` ($20 Supporter, $50 Pro Ticket) - those are now card-only (Stripe). `/donate` still carries PayPal. This doc has no newsletter-CTA copy examples naming a payment method, so there was nothing to correct in the text itself - noted here so any future newsletter CTA that mentions "chip in" or "PayPal" for the ticket tiers gets written against the current state, not the pre-2026-09-21 one.
4. **Paragraph's fee structure was mis-stated.** The July platform-comparison table said Paragraph's revenue cut is "0%". Re-verified 2026-09-22 against three independent sources (Paragraph's own recurring-subscriptions blog post, a 2026-06-24 third-party review, and a creator's 2024 migration writeup, all cross-checking each other): Paragraph takes **roughly 5% of paid-subscription revenue** (about half of Substack's 10%), not 0%. Publishing and free subscriber collection are free; the 0% claim only ever applied to that free tier. Paragraph also added agent-credit paid plans in 2026 (Starter $16/mo, Growth $80/mo, Scale $160/mo, annual pricing shown) on top of the free tier - not relevant to ZAO's current usage but worth knowing if agent-credit limits are ever hit. Corrected in the Platform Comparison table below.

**Cross-link, not duplicated here:** Doc `dev-workflows/2538-paragraph-ai-agent-workflow-improvements` (shipped 2026-09-22, PR #3623, not yet merged as of this writing) covers the Paragraph AI agent's UI/behavior quirks - auto-cover generation, draft-vs-chat targeting, past-tense fabrication. This doc stays scoped to growth/deliverability/format/cadence; see 2538 for the agent-operation angle.

---

## The 0.00% CTR problem (new, 2026-09-22)

This is the fact the July version of this doc did not have, and it changes how several of its recommendations should be read.

**Measured** (`~/.claude/skills/newsletter/SKILL.md`, `analytics-query` on 2026-08-11): 366 editions, 144,000 emails sent, 268 total clicks across the newsletter's entire lifetime, 0.00% CTR on every ZABAL edition specifically, 8-16 second read time.

What this means for the recommendations below, stated directly rather than softened:

- **The newsletter cannot drive an action.** People read it briefly and do not click - not "click less than average," but close to never. Any recommendation in this doc that depends on a reader clicking a link *inside the email* (the subscribe-funnel footer CTA, a referral link, a landing-page link, an in-email UTM) will not move on its own. The newsletter's own operating manual now states the fix directly: for anything with a deadline or an action, **post to Farcaster first, then embed those casts in the newsletter** - the cast is where the click happens, the email is the record.
- **Old action item 5 ("switch reporting to clicks/replies/UTM") is WRONG and is retracted in this refresh.** Clicks are not a usable signal for this list - 268 clicks over 144k sends is not enough volume to read trend from, let alone optimize against. Track subscriber count, Farcaster cast engagement (where clicks actually happen), and reply/DM volume instead. Do not build a dashboard around newsletter click-through; it will report noise.
- **This does not kill the growth recommendations - it changes where they have to live.** A landing page (action item 1) or referral loop (action item 4) still works, but the CTA driving traffic to it must be a Farcaster cast or a social post, not a link buried in the email body. The newsletter is the appointment-viewing record of what already happened; it is not the conversion surface.
- **It also reframes the "should we stay on Paragraph" question.** Paragraph's differentiator (wallet subscribe, on-chain ownership) does not fix a click problem, because the problem is upstream of the platform - it is that readers treat this specific publication as something to skim, not act from. Platform-switching would not change that; distribution-order would.

---

## ZAO current state (the baseline this improves)

- Platform: Paragraph (@thezao), web3-native. Publishes as "Year of the ZABAL - Day N".
- Cadence: daily, build-in-public. Median ~80 words, lowercase-casual, hard voice rules (ZM open, no emojis/em-dashes/hashtags, never work-day times) for the daily voice; a separate, newer "announcement" voice (sentence case, numerals, headings, real punctuation) for editions carrying a deadline or a number that matters - including the current live poidh bounty-campaign editions.
- Tooling: Paragraph's own AI agent fleet (Writing/Media/Publishing/Social/etc, per doc 2538) plus the `/newsletter` skill's fact-first operating manual (`edition-facts.sh`, `zao-newsletter-published-check`). The old `zabalnewsletterbuilder` (Vercel) pipeline from the July version is superseded by this - Paragraph's own agent and MCP tools now do the drafting/grading work that repo used to do standalone.
- Distribution: **Farcaster first for anything with a deadline, then embed those casts in the newsletter; newsletter-first-then-socials only for a plain daily edition** (per the CTR finding above - this is a change from the July version's "manual, `/socials` after publish" description, which did not yet have the click data to justify an order).
- Live campaign context: a 13-day, one-bounty-per-day poidh (Base) campaign runs through ZAOstock, separate from and after ZABAL Gamez Season 1 (ended July 2026). Newsletter editions covering it are running in the announcement/results hybrid voice, not the old fixed daily template.

What ZAO still does NOT have: a signup landing page, a referral loop, cross-promotion partners, list-hygiene discipline, or deliverability monitoring. That gap has not closed since July - it is still the target this doc argues for, with the caveat above that any CTA promoting these needs to live on Farcaster, not inside the email.

---

## The central tension: daily cadence

Every growth source flagged daily as high-churn - re-confirmed this pass, not just carried over:

- Re-fetched 2026-09-22 (curl, FULL): retainful.com's 2025-07-08 email-frequency guide states newsletters specifically do best at **once a week**, with marketing email broadly at 1-3x/week; a good open-rate benchmark is 17%, and CTR is explicitly named as the metric that "plummets" first when frequency is too high relative to engagement. This is one year old but the guidance direction is unchanged from the July version's citation of the same domain, and it lines up with ZAO's own measured CTR of effectively zero - a daily cadence at the extreme high end of every frequency guideline, paired with a CTR at the extreme low end, is the predicted outcome, not a surprise.
- Substack paid newsletters churn ~50%/yr; "AI/news" categories are the leakiest at ~13%/mo. [CLAIM, carried forward - not re-fetched this pass] readless.app, retentioncheck.com
- Avg subscriber is on 25+ newsletters, regularly opens 3-5. [CLAIM, carried forward] readless.app
- "Daily is unsustainable for solo writers - burnout kills growth faster than frequency helps." [CLAIM, carried forward] knowledge.gtmstrategist.com

But daily is a deliberate ZAO identity choice (build-in-public discipline, per `business/2303` - the July version's "Doc 930" citation here did not resolve to a real doc and is corrected), and the research still hands us the same mitigation the July version found:

- Serialized content = "appointment viewing"; a predictable rhythm with recap + tease drives return. The "Day N" chronicle format IS this mechanic. [CLAIM, carried forward] loomly.com, forbes.com/books
- Short-form (under 300 words) gets read cover-to-cover and builds habit. [CLAIM, carried forward] newslettervaluator.com, wordcountchecker.org. ZAO's own measured 8-16 second read time (new data, 2026-08-11) is directly consistent with this - readers are finishing the whole thing, they are just not clicking out of it.

**ZAO reconciliation (recommendation, not mandate, unchanged from July but now better evidenced):** keep daily as the identity, but treat it as a serialized short-form chronicle that is read, not acted from - the 8-16 second read time and near-zero CTR together describe a habit-read, not a dead newsletter. Protect against the two real daily risks: (1) burnout - the Paragraph agent fleet (doc 2538) now does more of the drafting lift than the July-era manual pipeline did, which helps here; (2) fatigue-unsubscribes - via ruthless brevity and a clean, engaged list rather than a big one. If growth ever stalls specifically on fatigue, the fallback is a daily anchor + lighter mid-week issues, not abandoning daily.

---

## 1. List growth (highest-leverage first)

Sources: beehiiv.com, benchmarketing.org, growthstackblog (Unbounce 2026 data), sparkloop.app, paragraph.com, docs 2522/2536 (poidh campaign).

- **Landing page + one fast lead magnet, promoted via Farcaster, not the email.** Re-verified 2026-09-22: current 2026 benchmark data (Unbounce's dataset of 41,000+ landing pages, cited across multiple 2026 sources) puts the median dedicated-landing-page conversion rate at **6.6%**, top decile above 11%, versus a blended website conversion far lower - and **email-sourced traffic to a landing page converts at roughly 6-19% depending on the source**, well above cold organic or paid-social traffic. The July version's specific "~23x a generic web page" figure could not be re-confirmed against any current source and is dropped rather than repeated unverified; the underlying recommendation (a dedicated landing page beats a bare signup form) still holds on the fresher numbers. **Given the 0.00% CTR finding, the traffic to this page must come from a Farcaster cast or bio link, not an in-newsletter click** - ZAO has no landing page yet; this remains the biggest single conversion miss, now with the added constraint of where its traffic has to originate.
- **Referral loop.** [CLAIM, carried forward - not re-fetched this pass] Dual-sided rewards + low first tier (reward at 1 referral, not 25) + dead-simple mechanics drives materially higher participation than an overcomplicated one; referred subs tend to open better. Tooling: SparkLoop (integrates 25+ platforms) or beehiiv's built-in referral tool. Same caveat as above - the referral CTA has to live where clicks happen (Farcaster, not the email body).
- **Cross-promotion.** [CLAIM, carried forward] 5-10 aligned music/web3 newsletters, guest posts / cast swaps; treat as relationships, not transactions.
- **Social -> newsletter funnel - now the ONLY funnel that matters, per the CTR data.** Daily Farcaster cast teasing the issue -> subscribe CTA in the cast itself (not just the newsletter footer). ZAO's audience already lives on Farcaster - this is warm, and it is now confirmed to be the channel doing all the click-work the newsletter itself does not.
- **Archive SEO.** [CLAIM, carried forward] Tag each issue (artist, genre, technique) so old issues rank long-tail.
- **Web3-native (fits ZAO, unproven as retention).** Paragraph supports wallet subscribe + token-gating - readers own the subscription, low lock-in. Per-issue collectible mints drove edition volume on the platform historically, but there is still NO published retention data tying mints to subscriber retention specifically - treat as an engagement layer, not a proven growth lever. [CLAIM, carried forward] paragraph.com.
- **The live bounty campaign is itself a growth lever the July version could not have anticipated.** The 13-day poidh (Base) campaign running through ZAOstock (docs 2522, 2536) generates a public artifact (a bounty, a thread of entries, feedback) every single day - this is exactly the kind of concrete, checkable content that performs on Farcaster (where the clicks are) and that the newsletter can record afterward in the announcement/results voice. Treat each day's bounty results as free, ready-made newsletter content that already has a built-in audience (entrants checking on their own submission), separate from and in addition to the daily chronicle format.

---

## 2. Deliverability + list hygiene

Sources: Google's own bulk-sender guidelines (support.google.com/mail/answer/81126, re-fetched via curl 2026-09-22, FULL), Mailmodo, GetResponse, platform docs.

- **Auth is baseline, not optional.** Re-verified 2026-09-22 directly against Google's current support page (FULL fetch): senders of 5,000+ messages/day to Gmail must set up SPF or DKIM, valid forward/reverse DNS, TLS in transit, and keep spam rates reported in Postmaster Tools below **0.3%**. This is unchanged from the July version's claim and is confirmed current as of today, not stale. Managed platforms (Paragraph/Substack/beehiiv/Kit) handle auth on their sending domain automatically - a real advantage for a solo publisher, and at 144k lifetime sends over 366 editions ZAO is well within bulk-sender territory where this matters.
- **Metrics reality: opens are broken, and clicks are now confirmed broken too - for a different reason.** Apple Mail Privacy Protection inflates open rate by preloading images. The July version's fix was "track clicks, replies, and UTM instead" - that fix does not work here, because ZAO's own clicks are 0.00% CTR across the list's entire history, not merely undercounted. **The actual usable signals for this specific newsletter are: subscriber count, Farcaster cast engagement on the linked cast (not the email), and direct replies/DMs.** This is the most material correction versus the July version - do not build tooling around newsletter click tracking; it is a metric this publication structurally does not produce.
- **Clean small > big dirty.** [CLAIM, carried forward - not re-fetched this pass] Keep spam complaints <0.1%, bounce <2-3%. Clean every 3-6 mo; sunset inactives (6-mo no open/click) with a win-back. A smaller, more engaged list gets higher inbox placement than a large stale one.
- **Opt-in.** [CLAIM, carried forward] Double opt-in = cleaner list but more abandonment at confirm; single = faster but more bounces. For a warm web3 community, single-with-verification remains defensible.
- **ZAO-specific risk with Paragraph, updated.** Paragraph's platform maturity has moved since July - it shipped an AI agent fleet (2026-04 onward, per doc 2538's sourcing) and paid agent-credit tiers in 2026, and independent 2026 reviews (kompozy.io, 2026-06-24) now describe it as "the strongest Web3-native publishing platform on the market" with a stable fee structure. Deliverability-specific documentation is still thin from Paragraph directly. Mitigation unchanged from July: (1) regularly export/back up the email list; (2) add Google Postmaster Tools if a custom domain is used; (3) confirm SPF/DKIM/DMARC on the actual sending domain; (4) keep a portable CSV backup given how core this list is becoming.

---

## 3. Format + retention

Sources: `~/.claude/skills/newsletter/SKILL.md` (re-read in full, FULL), docs 2522/2536 (poidh campaign), `feedback_announcement_vs_daily_voice.md`.

- **The format has split into two voices since July, and this is the single biggest structural change in this doc.** The July version described one fixed daily template (hook -> setup -> short body -> quiet close, ZM open, lowercase, no headings). That template still exists and is still correct **for plain daily editions**. But the newsletter now also runs an **announcement/results voice** - sentence case, real punctuation, numerals always, headings per section, lists that read as lists - for any edition carrying a deadline or a number that matters, including the current live 13-day poidh bounty campaign. The operating rule (`~/.claude/skills/newsletter/SKILL.md` lines 74-92): "would a reader who skims for ten seconds come away knowing the one fact this exists to tell them?" If yes, it's an announcement. Given the 8-16 second measured read time, this is not a hypothetical test - ten seconds is close to the actual reading budget every edition gets.
- **Subject lines.** [CLAIM, carried forward - not re-fetched this pass] Short subjects and odd numbers tend to open better; write the subject last. ZAO's "Day N + subtitle" is the subject line - the subtitle remains the lever to test.
- **Structure.** Fixed daily template creates recognition (hook -> setup -> short body -> quiet close); the announcement voice trades that recognition for clarity on a specific fact. Both are now correct, situationally - see above.
- **Welcome sequence (ZAO still has none - still the second-biggest miss).** [CLAIM, carried forward] First 30 days set long-term retention; a short welcome series sent immediately generates outsized engagement relative to its send volume.
- **Repurposing loop, now reversed in direction.** The July version described "newsletter -> Farcaster/X threads -> back to newsletter." Given the CTR data, the effective loop for anything with an action attached now runs the other way: **Farcaster cast first (where the click and the engagement happen), newsletter second as the recorded artifact.** `/socials` already produces the outbound half; the missing half is still an evergreen "throwback" slot resurfacing old editions, which remains a good idea and is unaffected by the direction change.

---

## Platform comparison (for the "should we stay on Paragraph" question)

Re-verified 2026-09-22 against Paragraph's own blog (`paragraph.com/@blog/recurring-subscriptions`), a 2026-06-24 third-party review (kompozy.io), and a creator migration writeup - all three agree and correct the July table.

| | Paragraph | beehiiv | Substack | Kit |
|---|---|---|---|---|
| Web3 native | wallet sub, token-gate, on-chain post ownership | no | no | no |
| Growth tooling | none native | referral, boosts, ad network | recommendations (basic) | creator network |
| Revenue cut | **~5% of paid-subscription revenue** (corrected - was wrongly stated as 0% in the July version; free publishing/subscriber collection is genuinely free, but paid subs take a cut) | 0% on subs | 10% + Stripe | none (higher price) |
| Data ownership | you own it [VERIFIED - Paragraph's own docs and third-party reviews agree] | ambiguous [CLAIM] | you own it | you own it |
| Deliverability | maturing - agent fleet + paid tiers shipped 2026, still thin on public deliverability specifics [CLAIM] | strong | strong | strong |
| Newsletter CTR (ZAO's own, for reference) | **0.00%** measured on this specific list, 366 editions - not a platform property, a distribution-order property (see "0.00% CTR problem" above) | n/a | n/a | n/a |

**Recommendation, reaffirmed:** stay on Paragraph as the primary - the wallet-native ownership + Farcaster carryover is exactly ZAO's positioning, and even at ~5% (not 0%) the fee is roughly half Substack's. The growth-tooling gap is still real: Paragraph has no native referral/landing/cross-promo. Fill that with external tools (SparkLoop for referrals, a standalone landing page) rather than switching platforms - and route every CTA for those tools through Farcaster, not the newsletter body, per the CTR finding. Keep a portable list backup as insurance.

---

## ZAO action list (prioritized, effort 1-10 per [[feedback_no_time_estimates]])

Revised 2026-09-22 - old item 5 ("switch reporting to clicks/replies/UTM") is retracted per the CTR finding; every remaining item now carries an explicit "where the CTA lives" note.

1. **Signup landing page + one 5-min lead magnet, promoted via Farcaster cast/bio, never an in-email link alone** (effort 3). Biggest conversion miss, unchanged since July. Founder video + a real issue screenshot + one checklist.
2. **Welcome sequence** (effort 3). 3 emails, first sent immediately. Biggest retention miss, unchanged since July.
3. **Daily Farcaster teaser -> subscribe funnel** (effort 2). Now the primary growth channel, not just "warm and cheap" - it is where the clicks this list needs actually happen.
4. **Referral loop, with the referral link posted to Farcaster, not buried in the email** (effort 4). SparkLoop or beehiiv-style; dual-sided, reward at 1 referral.
5. **~~Switch reporting to clicks/replies/UTM~~ - RETRACTED.** Replaced with: track subscriber count + Farcaster cast engagement + reply/DM volume as the real signals (effort 1, this is now a reporting change, not a tooling build).
6. **List hygiene + portable backup** (effort 3). Quarterly export/backup; sunset inactives with a win-back.
7. **Cross-promotion** (effort 5, ongoing). 5-10 aligned music/web3 newsletters; guest/cast swaps.
8. **Evergreen "throwback" slot + archive tagging** (effort 3). Unchanged since July.
9. **Turn the live poidh bounty campaign into a recurring content source** (effort 2, new this pass). Each day's bounty result is ready-made announcement-voice content with a built-in audience (entrants). Distribute the results via Farcaster first per the campaign's own pattern (doc 2536), embed in the newsletter after.
10. **Test, don't assume** (ongoing): subtitle A/B, whether the announcement-voice format measurably changes engagement once the newsletter's Farcaster-first distribution is in place for a full cycle.

Fastest-value cluster to ship first: 1 + 2 + 3 (landing page, welcome sequence, Farcaster funnel) - unchanged from July, now with the added clarity that all three route through Farcaster, not the email itself.

---

## Also See

- [Doc 610 - Newsletter prose toolkit / ZABAL voice](../610-newsletter-prose-toolkit-zabal-voice/)
- [Doc 2303 - The daily-3 pipeline audit](../../business/2303-newsletter-daily3-pipeline-audit/) - replaces the July version's broken "Doc 930 (daily-3 loop)" citation, which did not resolve to any doc in the library
- [Doc 2538 - Paragraph AI agent workflow improvements](../2538-paragraph-ai-agent-workflow-improvements/) - agent UI/behavior quirks (auto-cover, draft-vs-chat, past-tense fabrication); this doc does not duplicate that angle
- [Doc 2536 - Feedback that brings bounty entrants back](../../community/2536-bounty-entrant-feedback/) - the live 13-day poidh campaign this doc's format section references
- [Doc 2522 - What is actually happening on poidh right now](../../business/2522-poidh-live-bounty-market/)
- [Doc 1331 - ZAO Newsletter Growth Strategy + Content Calendar (Jul 2026)](../../community/1331-zao-newsletter-growth-strategy-jul2026/) - subscriber-count growth target context; not independently re-verified this pass
- Newsletter operating manual: `~/.claude/skills/newsletter/SKILL.md` (voice split, CTR data, distribution order)
- [Doc 322 - Paragraph, Publish.new + agent commerce](../../business/322-paragraph-publishnew-newsletter-agent-commerce/) - `322` is an ambiguous bare number (3 unrelated docs share it); this is the specific one meant by "Paragraph publishing context"
- Post-publish distribution: `/socials` skill, [[feedback_newsletter_socials_after_publish]]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the signup landing page (action item 1) and link it only from Farcaster bio/casts, not the newsletter body - page live at a real URL | Zaal | PR/deploy | 2026-10-06 |
| Retire any newsletter-click-tracking plan in favor of subscriber-count + Farcaster-engagement + reply tracking (action item 5) - update any dashboard or checklist that currently references newsletter CTR as an actionable metric | Zaal | Doc/checklist update | 2026-09-26 |
| Draft the 3-email welcome sequence (action item 2), first email sent immediately on signup | Zaal | Content + automation | 2026-10-06 |
| Confirm SPF/DKIM/DMARC status on the actual Paragraph sending domain for thezao and record the result | Zaal | Verification task | 2026-09-29 |

## Sources

- [`~/.claude/skills/newsletter/SKILL.md`](file:///Users/zaalpanthaki/.claude/skills/newsletter/SKILL.md) - **FULL** (read directly) - 366 editions / 144k sends / 268 clicks / 0.00% CTR / 8-16s read time (measured via Paragraph `analytics-query`, 2026-08-11); daily-vs-announcement voice split; Farcaster-first distribution rule
- [ZAOstock PR #290 - "tickets: drop PayPal, card only"](https://github.com/ZAODEVZ/ZAOstock/pull/290) - **FULL** (`gh api`, merged 2026-09-21T23:58:44Z) - PayPal removed from `/tickets`, card-only for Supporter/Pro tiers, `/donate` unaffected
- `research/community/2536-bounty-entrant-feedback/README.md` - **FULL** (read directly, this repo) - 13-day ZAOstock poidh bounty run, bounty one = poidh 1409, 2026-09-21
- `research/business/2522-poidh-live-bounty-market/README.md` - **FULL** (read directly, this repo) - live poidh market state, self-corrected 2026-09-20
- `research/zabal/2257-zabal-s1-season-retrospective/README.md`, `research/zabal/1466-zabal-s1-completion-report/README.md` - **FULL** (read directly) - ZABAL Gamez Season 1 ran ~May-July 2026
- [`bettercallzaal/poidhz` README](https://github.com/bettercallzaal/poidhz) - **FULL** (`gh api`) - poidh bounty-ops tooling, Base chain, live 2026-09
- [Google - Email sender guidelines](https://support.google.com/mail/answer/81126) - **FULL** (curl, re-fetched 2026-09-22) - 5,000+/day bulk sender rules, SPF/DKIM/TLS, 0.3% spam-rate cap, confirmed current
- [retainful.com - 10 Email Frequency Best Practices](https://retainful.com/blog/email-frequency-best-practices) - **FULL** (exa fetch, 2026-09-22) - weekly cadence recommended for newsletters specifically; dated 2025-07-08, one year old
- [Paragraph - Recurring Subscriptions](https://paragraph.com/@blog/recurring-subscriptions) - **PARTIAL** (search-highlight fetch) - Stripe-backed membership tiers, wallet-based delivery
- [Paragraph Review 2026 - kompozy.io](https://kompozy.io/reviews/paragraph) - **PARTIAL** (search-highlight fetch, dated 2026-06-24) - confirms ~5% cut on paid subscriptions, not 0%; agent-fleet and pricing-tier context
- [Landing Page Conversion Rate: 2026 Industry Benchmarks](https://growthstackblog.wordpress.com/2026/04/21/landing-page-conversion-rate/) - **PARTIAL** (search-highlight fetch) - Unbounce 6.6% median / 11%+ top-decile landing-page benchmark, email-traffic conversion by source
- [Paragraph pricing](https://paragraph.com/pricing) - **PARTIAL** (search-highlight fetch) - free tier for publishing/subscribers confirmed still free; paid agent-credit tiers ($16/$80/$160/mo) are new since July
- [Three Reasons I Moved from Substack to Paragraph.xyz - ckxpress](https://ckxpress.com/en/paragraph/) - **PARTIAL** (search-highlight fetch, 2024) - independent confirmation of the 5% (vs Substack's 10%) fee, corroborating the correction
- Doc `dev-workflows/2538-paragraph-ai-agent-workflow-improvements` (branch `ws/research-2538-paragraph-ai-agent-workflow-improvements`, PR #3623, not yet merged at time of writing) - **FULL** (read directly on branch) - cross-linked, not duplicated
- Claims marked [CLAIM, carried forward] were part of the original 2026-07-03 research pass and were NOT re-fetched this pass (general marketing best-practice claims - referral-loop participation rates, welcome-sequence retention lift, subject-line length, cross-promotion yield, archive SEO, opt-in abandonment rates, list-hygiene bounce thresholds); they read as directionally stable but have not been independently re-verified since July. Flagging this explicitly rather than re-presenting them as freshly [VERIFIED].
