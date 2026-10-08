---
topic: business
type: guide
status: research-complete
last-validated: 2026-10-07
related-docs: "business/1066-zaoonparagraph-buildout, business/2348-newsletter-craft-paragraph-mcp, cross-platform/2189-paragraph-brand-growth-playbook, community/1301-zao-newsletter-growth-playbook-jul2026, dev-workflows/944-newsletter-growth-deliverability-playbook, business/2303-newsletter-daily3-pipeline-audit, identity/1270-zao-newsletter-paragraph-canonical-jul2026"
original-query: "https://armstr.ng/writing - zao-research on this page, angle: Zaal is rebuilding the zaoonparagraph newsletter content pipeline on Paragraph (one idea per issue, a daily routine, turning readers into participants, measuring what works); say concretely what from this site's writing (structure, cadence, voice, writing index, essay linking, Paragraph mechanics) The ZAO newsletter can apply"
tier: STANDARD
---

# 2633 - armstr.ng/writing: a Paragraph founder's five-essay index, and what it teaches the ZAO newsletter

> **Goal:** Read every post on Colin Armstrong's writing index (he founded Paragraph, the platform The ZAO newsletter runs on) plus the site's public source, and turn the structure, voice, index design and Paragraph plumbing into concrete moves for the zaoonparagraph pipeline.

## Key Decisions

| # | Recommendation | Why (evidence) |
|---|---|---|
| 1 | USE one-idea-per-edition with a one-line subtitle that states the idea. Write the subtitle FIRST, then the body. | All 4 subtitled posts carry the whole thesis in one line ("What changes when a tool doesn't have to pay for itself", "Moving beyond just exportable data."). The same subtitle becomes the RSS description, meta description and index blurb, so one sentence does four jobs. |
| 2 | USE the "personal annoyance -> what I made -> why it clears the bar -> honest limit" shape for explainer editions. | "Worth building" (3 min read) runs exactly this arc, ends on an honest limit ("heade.rs will probably not rank"), and got 54 points on Hacker News. |
| 3 | SKIP a fixed daily clock as the only routine; USE a task-to-state-of-mind map for the 3 daily-3 slots. | "Spending time deliberately" (1 min read): match creative, insightful and extroverted states to code/design, strategy and user outreach, and make "deliberately not working" a decision. |
| 4 | USE a per-edition "what bothered me / what we made / the choice we cared about" paragraph so readers get a reason to try the thing, not a demo. | Worth building: "I'm more interested when someone explains what bothered them, what they made, and the choices they cared about." This is the reader-to-participant hook. |
| 5 | BUILD a ZAO-owned archive page and a `.md` version of every edition, fed from the Paragraph API, rebuilt when Paragraph changes. | armstr.ng does this today: posts are "pulled from the Paragraph API when the site builds", with `/llms.txt` and `/writing.md`. Same API zaoonparagraph already has keys for (doc 1066 Build 1). |
| 6 | USE the "portable, usable, interoperable" test as the standard for where The ZAO keeps its list. Export the 620 subscribers on a schedule. | The data-spectrum essay: a list you cannot use elsewhere is not owned (Mailchimp locked out crypto newsletters). |

## Findings

### What was read

All five posts on the index were fetched raw and read in full, plus the RSS feed, `/llms.txt`, `/writing.md` headers, the site's README, `getAllArticles.js`, `api/subscribe.ts` and `llms.txt.ts` from the public repo, and the Hacker News thread for the newest post.

| Post (date, read time) | Subtitle | Takeaway for The ZAO |
|---|---|---|
| Worth building (Oct 5, 2026; 3 min) | What changes when a tool doesn't have to pay for itself | Cheaper making means more people ship; "the story gives me a reason to try the thing." Audience can be one person. |
| The data spectrum (Oct 15, 2024; 4 min) | Moving beyond just exportable data. | Three-level frame (portable, usable, interoperable) with anchors `#portability`, `#usability`, `#interoperability`, `#the-future` as headings. |
| Wallets instead of emails for identity (Jan 14, 2023; 3 min) | Why open & permissionless systems can lead to better identity. | Three-section compare (Email, OAuth, Wallets) with honest downsides list; ends with a Paragraph example (Farcaster sign-in pulls avatar, name, follows). |
| Spending time deliberately (Oct 23, 2022; 1 min) | Thoughts on doing my best work. | Shortest post; one claim, one example set, one exception. Proof that a 1-minute edition is a valid unit. |
| Personal automation with Huginn using Slack, Docker and GCP (Sep 20, 2022; 6 min) | none in feed | The only how-to. Goals first, then deploy, then "How it works", then a worked agent chain (RSS -> filter -> Slack). Ships importable agent JSON via a gist. |

### 1. Structure: one idea, one subtitle, headings as anchors

Every post has a title, a one-line subtitle, a date and a "N minute read" line. The index (`/writing`) lists only title and date grouped by year ("5 posts since 2022"), with the header line "Thoughts on startups, product, engineering, and whatever else is on my mind." Reading times run 1, 3, 3, 4 and 6 minutes, so length follows the idea, not a quota. Source: https://armstr.ng/writing and each post page.

### 2. Cadence: low frequency, high intent

Five posts across 2022 to 2026 (Sep 2022, Oct 2022, Jan 2023, Oct 2024, Oct 2026). The site reports "Join 900+ readers". The ZAO does the opposite (about 390 posts, daily, 620 subscribers), so the lesson is not cadence but unit design: each edition should be able to stand alone as one claim. Nothing on this site describes a daily routine for writing; the only routine evidence is the "Spending time deliberately" essay, which argues against a fixed schedule.

### 3. Voice

First person, plain, no lists in the argument posts; lists appear only for enumerated facts (OAuth benefits, automation goals). Sentences concede limits ("Though, crypto wallets are not without downsides"). Matches the ZAO rule of prose over bullets, and gives a model for the honest-limit closing paragraph.

### 4. How essays link to each other

They mostly do NOT. Internal cross-links between essays: none found in the extracted links of any post. What links exist are outward (Hacker News thread, Paragraph, Farcaster essay by Varun Srinivasan, nakamoto.com "credible neutrality") and inward-to-product (Paragraph, heade.rs, projects page). The linking glue is the index plus RSS plus `llms.txt`, not in-text "see also". For ZAO: the 400+ edition archive is the opposite problem (huge, unlinked); add a "Related editions" footer line generated from a tag, which armstr.ng does not do.

### 5. Reader to participant

The site's own mechanics: a subscribe form at the top and bottom of every page, a hidden honeypot field (`website`) to trap bots, rate limit of five attempts per visitor per minute, and a badge "Discussed on Hacker News" linking the thread. One older post (2023) offers "Collect this post as an NFT". So participation = subscribe, discuss in public, collect. Newest post earned 54 points and 6 top-level comment threads on Hacker News (https://news.ycombinator.com/item?id=49971952), and the author replied to a critic in thread ("Did you read the article?"). Apply: add a visible "Discussed here" line per edition pointing to a Farcaster cast or Discord thread, and reply in thread.

### 6. Measuring what works

The site does not publish metrics beyond "900+ readers" and a Hacker News badge. No analytics are shown, so nothing here can be copied as a measurement method. What IS usable: a per-post `updatedAt` content-version file that detects when Paragraph changed, and a modified-date field so edits are dated honestly.

### 7. Paragraph mechanics (from the public repo, verified)

- Posts are pulled from `https://public.api.paragraph.com/api/v1` at build time; the publication id is hard-coded; each post returns `staticHtml`, `markdown`, `subtitle`, `publishedAt`, `updatedAt`.
- A Cloudflare Worker cron runs every minute, compares a build-time `/content-version.txt` (each post id plus updatedAt, one per line) to Paragraph's API, and POSTs a deploy hook when they differ. Paragraph caches post lists for ten minutes; publishing clears that cache, so a new post is live in about three minutes.
- Subscribing happens through `POST /api/v1/subscribers` with a bearer key held as a Worker secret, so the email form lives on the author's own site and lands in Paragraph.
- The posts' images carry a `paragraph-figure` class (observed in the page HTML), which indicates Paragraph's rendered HTML is reused as is. That is an inference, not a documented statement.
- Every page has a Markdown twin and `/llms.txt` summarising who the author is and linking each page's `.md`, served when a client sends `Accept: text/markdown`.

### 8. Contradictions and caveats

- The page text and the GitHub bio both say Colin is the Paragraph founder; the `llms.txt` states he is "founder and CEO" and that Paragraph acquired Mirror in May 2024. These are the author's own claims on his own site, not independently verified here.
- The repo has no LICENSE file in its root listing, so it is all-rights-reserved. Use the PATTERNS only; copy no code.
- Hacker News commenters dispute that LLM output is "polished" and one called the post's prose "AI juice". Treat the thread as dissent on the claim, not on the structure.

## Comparison: how the three newsletter shapes stack up

| Option | What it is | Evidence | Fit for The ZAO |
|---|---|---|---|
| A. Essay index (armstr.ng) | 5 posts, subtitle + read time, grouped by year | https://armstr.ng/writing | Use for the archive page, not the daily edition |
| B. Daily-3 (current zaoonparagraph) | 3 items per day, 390 posts | `bettercallzaal/zaoonparagraph`, folder `published/` (23 records) | Keep; add one-line subtitle per edition |
| C. Deep-dive essay | 3 to 6 min, one claim, honest limit | Worth building, Wallets | Add one per week as the "idea of the week" edition |

## Next Actions

| Action (shipped-criteria) | Owner | Type | By When |
|---|---|---|---|
| Add a required one-line `subtitle:` front-matter field to every draft and make `automation/create-draft.sh` refuse a draft without it. Shipped when a draft with no subtitle fails the script. | Zaal | PR in zaoonparagraph | 2026-10-14 |
| Add a "N minute read" line computed from word count to the Paragraph post template. Shipped when the next edition shows it. | Zaal | Template change | 2026-10-14 |
| Write one "idea of the week" edition in the Worth building arc (annoyance, what we made, why it clears the bar, honest limit) for the next ZAOstock or WaveWarZ build. Shipped when it is in `published/`. | Zaal | Edition | 2026-10-21 |
| Build a static archive page from `GET /v1/publications/{id}/posts` with a year-grouped index (title, date, subtitle), per doc 1066 Build 1. Shipped when the URL lists 10+ editions. | Zaal | PR | 2026-10-31 |
| Emit `/llms.txt` and per-edition `.md` from the same build. Shipped when `curl <archive>/llms.txt` lists every edition. | Zaal | PR | 2026-10-31 |
| Add a "Discussed here" line per edition linking the Farcaster cast or Discord thread and reply in thread within 24 hours. Shipped when 5 consecutive editions carry it. | Zaal | Process | 2026-10-21 |
| Export the Paragraph subscriber list monthly to a private file and record the date. Shipped when the first export is dated in `automation/`. Do not commit the list. | Zaal | Ops | 2026-10-31 |
| INVESTIGATE one open question: does Paragraph's analytics endpoint (doc 1066 Build 2) return per-post opens and clicks, so "what works" can be measured? Shipped when a one-paragraph answer is in doc 1066. | Zaal | Research | 2026-11-07 |

## Also See

- [Doc 1066](../1066-zaoonparagraph-buildout/) - build-out from the Paragraph creator interview (Colin Armstrong was on that call)
- [Doc 2348](../2348-newsletter-craft-paragraph-mcp/) - newsletter craft and Paragraph MCP operations
- [Doc 2189](../../cross-platform/2189-paragraph-brand-growth-playbook/) - Paragraph brand-growth playbook
- [Doc 1301](../../community/1301-zao-newsletter-growth-playbook-jul2026/) - growth playbook
- [Doc 944](../../dev-workflows/944-newsletter-growth-deliverability-playbook/) - deliverability and format
- [Doc 2303](../2303-newsletter-daily3-pipeline-audit/) - daily-3 pipeline audit

## Sources

- [FULL, method: curl + HTML strip] https://armstr.ng/writing (index, fetched 2026-10-07, HTTP 200)
- [FULL, curl] https://armstr.ng/writing/worth-building
- [FULL, curl] https://armstr.ng/writing/data-spectrum
- [FULL, curl] https://armstr.ng/writing/identity-wallets-over-emails
- [FULL, curl] https://armstr.ng/writing/spending-time-deliberately
- [FULL, curl; first 7000 characters plus last 3200 read, the middle code block skipped] https://armstr.ng/writing/personal-automation-with-huginn-using-slack-docker-and-gcp
- [FULL, curl] https://armstr.ng/feed.xml and https://armstr.ng/llms.txt
- [FULL, gh api] https://github.com/seeARMS/armstr.ng (README, `getAllArticles.js`, `api/subscribe.ts`, `llms.txt.ts`)
- [FULL, HN Algolia API; 54 points] https://news.ycombinator.com/item?id=49971952
- [FAILED - Reddit: no thread found for this site; not searched via zao-fetch-reddit.sh because no thread id was known] reddit.com
- [FAILED - one gh api call for repo metadata timed out (TLS handshake); the README and file reads succeeded] https://api.github.com/repos/seeARMS/armstr.ng
