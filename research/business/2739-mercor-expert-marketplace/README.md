---
topic: business
type: market-research
status: research-complete
last-validated: 2026-11-21
superseded-by:
related-docs: ""
original-query: "mercor.com DEEP - what Mercor is, how its expert/contractor marketplace works for applicants, pay rates and role types (AI training, data labeling, domain expert, engineering, operations, web3/music if any), how applicants get matched and paid, the profile/resume signals it weighs, interview process (AI interviewer), reputation and complaints, and how a founder with community-building and automation-engineering background should position a profile there (reconstructed for a public repo: the personal career-transition context of the original request is omitted here and kept in the owner's private notes)"
tier: DEEP
---

# 2739 - Mercor: Expert Marketplace, Pay, Matching, Interview and Reputation

> **Goal:** Establish, from fetched pages, what Mercor is, what applicants can expect (role types, listed pay, matching, the AI interview, payment), what the reputation and security record looks like, and how to position a profile there without claiming credentials that are not held.

## Key Decisions

Recommendations first. Each one cites the sources it rests on in the Findings below.

| # | Decision | Why (source in Findings) |
|---|---|---|
| 1 | USE Mercor as project-based contract income, not as a salaried replacement. Projects run "weeks to months" and "can be extended, shortened, or concluded early" | Experts FAQ (mercor.com/experts); Expert Interviewer listing (work.mercor.com) |
| 2 | APPLY first in categories where the listed rate and a real track record overlap. The strongest listed-rate categories with volume are Sales and Marketing Expert ($60-$70/hr, 296 hired recently), Creative and Media Expert ($80-$90/hr, 43) and Project Management Specialists ($70-$110/hr, 23) | Experts page role list, fetched 2026-11-21 |
| 3 | SKIP any category that needs a credential the profile does not hold. Medical, legal and finance rows pay the most ($100-$350/hr) and the FAQ says minimum qualifications "typically require undergraduate-level expertise", with many projects wanting "years of professional work experience or an advanced degree" | Experts FAQ |
| 4 | GET the rate, expected hours and project end date in writing before starting. Third-party reviewers report projects paused, hours cut and rates lowered on new work | ddiy.co guide; theworkathomewoman review; Gazetteer SF (about staff, see caveat) |
| 5 | TREAT the sign-up as a data exposure, not only an application. Mercor's own June 2026 notice says a "very limited subset" of its "nearly five million experts" had sensitive information affected in a March 2026 supply-chain attack | mercor.com/blog update-on-mercor-security-incident (fetched) |
| 6 | KEEP your own log of hours. Pay is weekly, and one reviewer's final unpaid week shows the risk when approval lags the project end | Expert Interviewer listing ("Payments are weekly on Stripe or Wise"); dev.to post (Nov 2025) |
| 7 | DO NOT treat the reputation as settled either way. Trustpilot reads as mostly positive on pay timing (figure secondhand, see PARTIAL source list); Glassdoor and press read as negative on stability, hours and staff treatment. Both are real, so check current reviews yourself before committing | Sources list: Trustpilot PARTIAL, Glassdoor FAILED |

**Confidence:** [Likely] on decisions 1, 2, 4, 5 and 6, which rest on fetched Mercor pages plus a reviewed set of third-party pages. [Guessing] on decision 3's fit threshold, because we have no data on how Mercor screens by credential.

## Findings

### 1. What Mercor is (fetched)

- Mercor describes itself as "organizing human intelligence to power the AI economy". It sells three things: expert work to AI labs (the Experts side, which is what an applicant joins), benchmarks (APEX), and an enterprise human-data and data-monetization offer. Source: mercor.com homepage (fetched 2026-11-21, curl, HTML stripped).
- Founded 2023, "backed by Benchmark, Felicis, General Catalyst, and Menlo Ventures", 700+ employees across San Francisco, New York and London. Source: mercor.com/newsroom (fetched).
- Press items on the newsroom page: a $750M Series D at a $20B valuation (dated Nov 10, 2026 on the company blog list), and a $350M Series C at $10B earlier. Source: mercor.com/newsroom (fetched).

### 2. Role types and listed pay (fetched, the best primary data here)

The Experts page and the Jobs page list rates per role. These are listing ranges, not guaranteed pay.

| Role (listing title) | Listed pay | Hired recently (as listed) | Source |
|---|---|---|---|
| Cardiologist | $350/hr | 39 | mercor.com/experts |
| Dermatologist | $275/hr | 20 | mercor.com/experts |
| General Surgeon | $200/hr | 19 | mercor.com/experts |
| General Physician | $150/hr | 99 | mercor.com/experts |
| FP&A Expert | $100/hr | 22 | mercor.com/experts |
| Project Management Specialists | $70-$110/hr | 23 | mercor.com/experts |
| Creative & Media Expert | $80-$90/hr | 43 | mercor.com/experts |
| Electrical Engineering Writer | $80/hr | 17 | mercor.com/experts |
| Sales and Marketing Expert | $60-$70/hr | 296 | mercor.com/experts |
| Machine Learning Engineer Talent Network | $70-$250/hr | new | mercor.com/experts |
| Infrastructure / SRE | $200/hr | new | mercor.com/experts |
| Finance Expert | $60-$180/hr | new | mercor.com/experts |
| Expert Interviewer (part-time, about 10 hrs/week, US remote) | $50-$60/hr | "Posted 3 months ago" | work.mercor.com listing (fetched) |
| Jobs board sample: Economics Research Expert | $150-$160/hr | 20 hired this month | mercor.com/jobs (fetched) |
| Jobs board sample: Radiologist | $350/hr | 6 this month | mercor.com/jobs (fetched) |

Averages and headline figures on Mercor's own pages: "Average contracted rate $93/hr" (homepage and experts page). Newsroom press headline: "tens of thousands of skilled professionals are earning an average of more than $95 an hour on Mercor". These two Mercor figures do not match exactly; both are company-stated.

Role families named in the FAQ: business operations, creative experts, finance experts, healthcare and clinical experts, lawyers and legal experts, management consultants, software engineers.

### 3. How applicants are matched, scoped and paid (fetched)

- Application path, per the Experts FAQ: share background and expertise, complete a short AI evaluation, then "our team follows up" and connects you to aligned projects. "You don't need any prior AI experience."
- The Experts page's "Get your first offer instantly in 3 easy steps" is: create a profile, take AI assessments, find opportunities.
- Pay terms per the Expert Interviewer listing: independent contractor, "Payments are weekly on Stripe or Wise based on services rendered", and "We are unable to support H1-B or STEM OPT candidates at this time" (listing text, fetched).
- Referral: "Earn up to $960 by referring" (listing), with referral limits and a referral policy. The FAQ says a referral bonus is possible once a referred person "begins working on a project".
- Compensation per the FAQ: "depends on your expertise, the complexity of the project and demand for the role. Projects are structured and clearly scoped. Payment terms are defined upfront."

### 4. The AI interview (fetched)

- Mercor's FAQ: "The AI interview helps us evaluate expertise at scale. It adapts to your background." It also says: "Your interview responses are not sold and are not used to train customer AI models." That sentence is a company claim, not something we could audit.
- A third-party review (theworkathomewoman.com, fetched; the page carries an affiliate disclosure) says: for interview roles you share your entire screen with the AI interviewer and must have camera and audio on; questions are "general questions that relate to the skill or domain"; you may ask for a question to be repeated; interviews "are typically reused across different applications"; some roles also ask text-based questions. It also says identity verification is required before new work, with a driver's licence.
- The Expert Interviewer listing describes a different, human-run step: about 20-minute structured interviews of other experts. It requires prior recruiting, interviewing or technical-vetting experience. This is the one listed role that asks for interviewing experience directly.
- Blind (fetched, one thread, Nov 26 to Dec 7, 2025): a poster on a $130/hr "Coding Expert" contract says the interview was "AI interview. No preparation needed IMO". One commenter says they made $15k in about six weeks on a stable project. These are single anecdotes.

### 5. Reputation, complaints and security

- Security (company statement, fetched): in late March 2026 a malicious version of the open-source LiteLLM tool hit Mercor. Mercor's June 25, 2026 update says: "Of our nearly five million experts, only a very limited subset had sensitive information affected", notification letters went out June 25 and 26 with a TransUnion identity-protection offer, and "no employee data was affected". Source: mercor.com/blog/update-on-mercor-security-incident (fetched).
- Scope claimed by a third party (ddiy.co, fetched): contractors' Social Security numbers, interview recordings and other data were exposed in the breach-related class actions; Mercor disputes the claims. The Gazetteer article (below) says Mercor "is currently facing at least seven class-action lawsuits related to the breach". The ddiy page states that none had been decided as of its stated date (Oct 27, 2026).
- Worker classification (third party, ddiy.co, fetched): a Texas suit alleging more than 30,000 workers were misclassified was reported by Law360. Described on the page as allegations.
- Arbitration: the ddiy page says the contractor agreement requires arbitration, which "may limit how the class actions proceed". Read the contractor agreement before signing; we did not fetch it.
- Press on the company (Gazetteer SF, fetched, 15.7 KB text): former staff describe long hours, unpaid or late bonuses and "face time" expectations. These are staff accounts about the company, not about contractors, and the article is one outlet's reporting. Use it as a reputation signal, not as evidence about applicant pay.
- Applicant complaint (dev.to, Nov 24, 2025, fetched): a contractor says a two-month engagement's final week went unpaid and follow-ups got no reply. A reply from a job-board operator (AITraining.jobs, who has a commercial interest in this topic) says Mercor's stated terms are weekly payment "every Wednesday for the previous week of approved hours, tracked in the Insightful app, through Stripe Connect (or Wise where Stripe isn't available), with the first Stripe payout held 7 days". That operator's account of the terms is not verified against a Mercor page; the Expert Interviewer listing states only "weekly on Stripe or Wise".
- Trustpilot (secondhand, PARTIAL): 4.5 from 1,290 reviews, as reported by the ddiy page and a search summary. Trustpilot itself returned 403 to our fetch. A search summary also reports complaints about withheld payments, paused projects and weak support, and a G2 snippet quoting $50-$150/hr. Treat as triage only.
- Autobound aggregate (fetched): overall company rating 4.0 of 5, compensation 4.0, culture 3.7, work-life balance 3.7. The page does not name its source for these ratings. Treat as an aggregator figure.

### 6. Numbers that do not agree (flagged, not resolved)

- Pay: "Average contracted rate $93/hr" (homepage) vs "average of more than $95 an hour" (newsroom press headline).
- Payout cadence: the homepage says "$4M+ Daily payouts" and the newsroom "$5M paid out to the expert network every day"; the experts page says "Get paid weekly". Both can be true (daily payout runs, weekly pay cycle), but the page does not say so.
- Network size: "5M+ experts" (enterprise and newsroom) vs "more than 100,000 experts" (press item on the newsroom page). The company's own security update says "nearly five million experts". Read "5M+" as the company's applicant-or-member count, not an active-worker count.

### 7. Profile positioning for a founder with community-building and automation-engineering background

This section is generic. The personal career context of the original request is kept out of this public repo.

1. **Lead with listed-category fit, not a broad headline.** Pick two or three listed categories where the work history is real and documented (Sales and Marketing Expert, Creative and Media Expert, Project Management Specialists are the high-volume ones in the list above). A profile that claims six unrelated domains reads as unfocused to a matcher built on "domain" and "skills" fields.
2. **Claim only the credentials you hold.** The FAQ's bar is undergraduate-level expertise for the minimum, and many projects ask for years of professional work or an advanced degree. A community builder or automation engineer does not meet a clinical or legal row and should not apply to one.
3. **Put verifiable outcomes on the resume.** Mercor's listings describe work that is evaluated against "clear standards" and "rubrics". Specific systems built, workflows automated, and audience or member figures from public sources read better than adjectives. Keep any figure you cite public and sourced.
4. **Prepare for the AI interview as a screen-shared, camera-on, domain-question session** (third-party description). Expect it to be reused across applications. Answer in the vocabulary of the listed domain.
5. **Before uploading a resume, remove anything you would not put in a public document.** The breach history means identity and interview data sit with Mercor; share only what the platform requires.

## Also See

- [ZIDs - ZAO decentralized identity](../../identity/005-zao-identity/README.md) - ZAO's own identity layer, for context on public-profile framing

## Unknowns and Gaps (what we did not establish)

- **Reddit: not read.** The keyless Reddit route is blocked from this Mac: `zao-fetch-reddit.sh --selftest` on 2026-11-21 reports creds ABSENT, token endpoint HTTP 401, public `.json` returning text/html, and 0 of 3 redlib instances answering. The browse route was not run. Reddit threads are therefore unread.
- **Glassdoor, Trustpilot, G2 direct pages: not read** (403 to our fetch). Glassdoor interview-review snippets surfaced in search and were used as triage only.
- **Mercor's own support and help center: not read.** help.mercor.com and support.mercor.com returned no response (curl exit 000). The Experts FAQ is the only Mercor help text we read.
- **Contractor agreement, referral policy and data-licensing terms: not read.** We cite them only as the pages describe them.
- **Matching logic: unknown.** Mercor does not publish how it ranks applicants. The "AI evaluation" and "AI interview" score, and how it feeds matching, are not documented.
- **Actual pay distribution: unknown.** Listed rates are ranges; the company's average figure is company-stated. We found no independent pay dataset.

## Sources

Method key: FULL = read this run via curl plus HTML strip (or the official JSON API). PARTIAL = read, but the content is secondhand or incomplete. FAILED = not read.

Mercor pages (curl, HTML stripped, read 2026-11-21):

- [FULL] [Mercor homepage](https://www.mercor.com/) - curl. Homepage text (average rate, payouts, latest roles, enterprise).
- [FULL] [Mercor Experts page](https://mercor.com/experts) - curl. Role list, FAQ, application steps.
- [FULL] [Mercor Jobs page](https://mercor.com/jobs) - curl. Listed roles and pay ranges (sample).
- [FULL] [Mercor Careers page](https://www.mercor.com/careers/) - curl. Company culture and benefits (US full-time staff); not used for applicant claims.
- [FULL] [Mercor Newsroom](https://mercor.com/newsroom) - curl. Funding, employee count, press headlines.
- [FULL] [Mercor security update, June 25, 2026](https://www.mercor.com/blog/update-on-mercor-security-incident/) - curl. Breach scope as stated by the company.
- [FULL] [Expert Interviewer listing](https://work.mercor.com/jobs/list_AAABoDrYQdAJqq6xRalOo4e9/expert-interviewer) - curl. Pay, contract terms, referral, weekly payment.
- [PARTIAL - work.mercor.com root returns a JavaScript shell with no content] [Mercor work portal](https://work.mercor.com) - curl. Only the listing page above carried text.
- [FAILED - 404 on mercor.com/find-work, /apply, /about, /privacy, /legal/terms, /faq] - curl, all returned a 16 KB not-found page. Those URLs do not exist on mercor.com.
- [FAILED - no response] [Mercor help center](https://help.mercor.com) and [support](https://support.mercor.com) - curl exit 000.

Third-party and community pages:

- [FULL] [Gazetteer SF, "New troubles at Mercor"](https://sf.gazetteer.co/new-troubles-at-mercor-infighting-face-time-slavery-and-inhumane-working-conditions) - curl plus strip, 15.7 KB text. About staff, not contractors.
- [FULL] [dev.to, "Mercor unpaid for my work"](https://dev.to/david_wenske_0b5dfdc82e27/mercor-unpaid-for-my-work-28j6) - curl. Applicant complaint and comments (one comment from a job-board operator).
- [FULL] [Blind, Mercor Coding Expert $130/hr](https://www.teamblind.com/post/mercor-coding-expert-130hr-unhph8zc) - curl. Post and replies, Nov-Dec 2025.
- [FULL] [The Work at Home Woman, Mercor review](https://www.theworkathomewoman.com/mercor-review/) - curl. Applicant walkthrough; affiliate disclosure on page.
- [FULL] [Don't Do It Yourself, Is Mercor legit](https://ddiy.co/is-mercor-legit/) - curl. Third-party guide citing Mercor pages; lawsuit descriptions are allegations as the page states.
- [FULL] [Autobound, Mercor signals](https://www.autobound.ai/companies/mercor/signals/contract-workers-cite-lack-of-benefits-despite-timely-6d0c30c4) - curl. Aggregator ratings; source of ratings not named.
- [PARTIAL - secondhand, figure taken from ddiy.co and a search summary] Trustpilot Mercor reviews ([trustpilot.com/review/mercor.com](https://www.trustpilot.com/review/mercor.com)) - curl returned 403. The 4.5 / 1,290 figure is not verified against the page.
- [PARTIAL - triage only] Hacker News threads on Mercor, read through the Algolia items API (hn.algolia.com/api/v1/items): [4TB voice samples report](https://news.ycombinator.com/item?id=47919630) (title and comments read; the linked article at app.oravys.com was not fetched); [LiteLLM cyberattack, TechCrunch-linked thread](https://news.ycombinator.com/item?id=47596739) (comments read; the TechCrunch article itself was not fetched); [New troubles at Mercor thread](https://news.ycombinator.com/item?id=48111559) (title only).
- [FAILED - 403] [Glassdoor Mercor reviews](https://www.glassdoor.com/Reviews/Mercor-Reviews-E0.htm) - curl. Interview snippets seen in search were not read in full.
- [FAILED - 403] [G2 Mercor review](https://www.g2.com/survey_responses/mercor-review-13252588) - curl.
- [FAILED - not reachable from this Mac] Reddit, all threads: `zao-fetch-reddit.sh --selftest` on 2026-11-21: creds ABSENT, token endpoint HTTP 401, public `.json` returns text/html, 0 of 3 redlib instances answered. Browse route not run.
- [FAILED - no response] [Ghostnet VCU, "Is Mercor legit"](https://ghostnet.vcu.edu/is-mercor-legit-reviews-safety-and-red-flags) - curl exit 000.

Search engine results (WebSearch) were used to find pages to fetch. No claim in this doc rests on a search snippet alone.

Codebase check: `grep -ril mercor` across `src/` and `research/` in the ZAOOS checkout on 2026-11-21 returned zero files. Control: the same command for "poidh" returned 244 files, so the instrument works. No repo file describes Mercor.

Library check: `zao-research-index "mercor"` on origin/main 8c5a0f1eb4e4 (2,534 docs) returned no matches. No prior Mercor doc exists.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide whether to apply to Mercor at all, and in which one or two listed categories (shipped when the decision is written in the vault status file) | Zaal | Decision | 2026-11-23 |
| Build a public-safe resume for the chosen category; no private career details; shipped when the Mercor profile shows the chosen category and resume is uploaded | Zaal | Profile | 2026-11-24 |
| Before accepting any project, get rate, expected hours and end date in writing; shipped when the project terms show all three | Zaal | Check | 2026-11-30 |
| Read the Mercor contractor agreement, including the arbitration clause and the interview-recording terms, before signing; shipped when a note with the clause text is saved in the owner's private notes | Zaal | Read | 2026-11-23 |
| Re-validate this doc: re-fetch the Mercor pages and try the Reddit browse route; shipped when a PR updates last-validated and the Reddit and Trustpilot rows change from FAILED or PARTIAL | Zaal | Research | 2026-12-21 |
