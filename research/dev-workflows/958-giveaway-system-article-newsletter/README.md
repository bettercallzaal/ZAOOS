---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-03
superseded-by:
related-docs: 957, 944, 898
original-query: "https://x.com/bloggersarvesh/status/2065092715289919616?s=46 research this for newsletter also"
tier: QUICK
---

# 958 - The give-away-the-system article: Sarvesh's 1.49M-view playbook applied to the ZAO newsletter

> **Goal:** Extract what actually transfers from "My chief of SEO, Claude Cowork Fable 5" (Sarvesh Shrivastava, X long-form article, Jun 11 2026 - 1,490,768 views, 756 favs) to the ZAO newsletter + growth stack. Verdict: the SEO prompts are mostly local-business-specific; the FORMAT and the SYSTEM ARCHITECTURE are the prize.

## Key Decisions (do these)

| # | Decision | Why |
|---|----------|-----|
| 1 | STEAL THE FORMAT: write the ZAO's own give-away-the-exact-system long-form X article - "Claude Code runs my daily newsletter - the exact system, free." | The proof is the artifact itself: 1.49M views for giving away 20 real prompts with the thinking behind them. This is precisely the X longform play doc 957 prescribes (single longform = 40-60% more impressions than threads; requires X Premium, already a Jul 7 action). The ZAO version is stronger material: a REAL running system (Day-N loop, 7-platform socials pack, voice score, canonical context file, Season Run) vs prompt templates. |
| 2 | The article's anatomy to copy: (a) confession hook ("THIS IS THE ARTICLE I WASN'T GOING TO PUBLISH"), (b) what-it-does before how, (c) the exact prompts/files verbatim - no gatekeeping, (d) a "why this matters" beat after every section, (e) "save this. you'll need it." | Each element is load-bearing: the hook manufactures scarcity, verbatim artifacts make it bookmarkable (bookmarks = 10x algo weight on X per doc 957), the why-beats make it readable by non-operators. |
| 3 | VALIDATED: nlbuilder `lib/context.ts` is the right architecture - his "Part 1: load business context, never ask again" is the same pattern. EXTEND it with his "HOW I WANT YOU TO WORK" behavioral block (impact level + time-to-results on every recommendation; spreadsheet output for comparisons; say-when-unsure). | His system's power = persistent context + prompt library + tool access. We already have all three (lib/context.ts wired into socials today; skills = the prompt library; Claude-in-Chrome = tool tabs). The behavioral contract is the one piece we haven't formalized. |
| 4 | ADOPT two of his 20 prompts for OUR SEO (point at zabalgamez.com, not GBP): #9 keyword gap and #12 GSC page-2 goldmine (positions 11-20, 100+ impressions -> title/H1/meta sprint). Prerequisite: register zabalgamez.com in Google Search Console. | These two are the non-local-specific, highest-yield audits. The 30-recording library + 60-page site is exactly the "page 2 goldmine" shape. Ties into doc 957's YouTube/search compounding thesis. |
| 5 | ADOPT prompt #13 (review sentiment analysis) as a ZAO-native "community language mining" pass: read the last 100 /zabal casts + workshop comments, extract the emotional words + money phrases the community actually uses, feed into newsletter voice + homepage copy. | His sharpest insight: "the businesses that dominate write their copy in the language their customers actually use." The ZAO equivalent corpus already exists (casts, comments via /api/comments, transcripts). |
| 6 | SKIP the local-SEO body: GBP categories/attributes/posts/photos, citations/NAP, city-service page stacks. | The ZAO is not a local business; no GBP, no map pack. Do not cargo-cult. |

## The transferable system (his architecture -> ours)

| His piece | Ours (status) |
|-----------|---------------|
| Business-context folder, loaded once, "never ask me again" | `lib/context.ts` in nlbuilder - canonical links + dated verified facts, vitest-guarded (LIVE; wired into socials generator today) |
| One file per SEO task (prompt library) | Skills + the session loop directives (LIVE) |
| Chrome-tab tool access (Ahrefs/SEMrush/GSC stay logged in) | Claude-in-Chrome extension (AVAILABLE; browser bridges flaky per handoff - verify before relying) |
| Audit -> prioritized spreadsheet with exact copy, sorted by impact | Adopt as the standard output contract for our own audits (the "write me the actual title tag, not instructions" rule) |
| "HOW I WANT YOU TO WORK" behavioral block | ADD to lib/context.ts (decision 3) |

## The ZAO giveaway article (the deliverable this doc points at)

Working title: **"Claude Code runs my daily newsletter. here is the exact system, free."**
Beats: the confession hook -> what it does (a Day-N issue + 7-platform socials pack drafted from what actually shipped, every day) -> the system verbatim (the context file pattern, the voice rules incl. the no-checkbox honesty ethos, the drafting protocol where final voice stays human, the self-improving loop that retros itself daily) -> why each piece matters -> "steal it: the newsletter builder is a public repo" (github.com/bettercallzaal/zabalnewsletterbuilder) -> the kicker: a PR that adds one small thing to it is a ZABAL Gamez submission. That last beat converts readers into the seed engine (doc 957 decision 5) - the article IS a drop.
Publish: X long-form (Premium) first; mirror the body as a newsletter issue + Paragraph/Substack; clip the system-diagram beats for shorts.

## Also See
- [Doc 957](../../business/957-100k-total-reach-h2-2026/) - the H2 100k plan this feeds (X longform + seed-engine drops).
- [Doc 944](../944-newsletter-growth-deliverability-playbook/) - newsletter growth/deliverability playbook (PR #1057).
- [Doc 898](../../community/898-zaal-brand-voice-posting/) - the voice rules the article would publish.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Draft the giveaway article (working title above) once X Premium is active | loop + @Zaal final voice | Draft | Jul 14 |
| Add the "HOW I WANT YOU TO WORK" behavioral block to nlbuilder lib/context.ts | @Zaal-approved PR | Small PR | Jul 10 |
| Register zabalgamez.com in Google Search Console; then run the page-2 goldmine audit (his prompt #12 adapted) | @Zaal (GSC) then loop | Setup + audit | Jul 20 |
| Community language mining pass (his #13 adapted): last 100 /zabal casts + comments -> emotional lexicon -> newsletter voice notes | loop | Analysis | Jul 20 |

## Sources
- Sarvesh Shrivastava, "My chief of SEO, Claude Cowork Fable 5" - X long-form article, Jun 11 2026; 1,490,768 views / 756 favs / 13 replies at fetch time; full 225-block body fetched via FxTwitter tier of zao-fetch-x.sh - https://x.com/bloggersarvesh/status/2065092715289919616 [FULL]
