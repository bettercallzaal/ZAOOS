---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-19
superseded-by:
related-docs: "196"
original-query: "https://www.reddit.com/r/vibecoding/s/R0zvnFGrFR /zao-research this"
tier: STANDARD
---

# 2504 - The r/vibecoding "stack I use daily" thread, read against ZAO's own stack

> **Goal:** Zaal sent a Reddit share link (2026-09-19, 06:5x). Say what the thread actually is, what in it holds for ZAOOS and ZAOstock, and what to do about it.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt foundel.dev as a backend | SKIP | The post is a product ad by its author (u/russopuppo, foundel's builder, admitted in a -23 comment). Our backend is Supabase plus our own routes; nothing in the thread shows foundel fixing a problem we have. |
| Change the ZAO stack (Next 16, Supabase, Tailwind 4, Vercel, iron-session) | KEEP | The thread's own top comment (58 points, 28-year SWE) says there is no one stack and a beginner should not copy the post's. Our stack is the "simple stack" the post says to outgrow; our measured pain is not the stack, it is the glue (auth, roles, billing, limits spread across files), which the post also names. |
| Add deterministic Playwright tests around zaostock checkout | USE | The one comment worth keeping (u/CapMonster1): a small set of deterministic Playwright tests around signup, permissions and billing beats hundreds of generated unit tests. zaostock has no Playwright dependency today (`package.json` measured 2026-09-19); ZAOOS has `@playwright/test ^1.58.2`. ZAOstock's ticket checkout ships the week before 3 Oct. |
| Keep billing logic in one place | USE, already the rule | Post and two commenters agree; zaostock's checkout PRs #223 and #224 put Stripe and the Unlock lock behind one module. Hold that line when the two links land. |
| Untitled UI React as a component library | NOT NOW | LICENSE file reads MIT (read 2026-09-19, `untitleduico/react`). zaostock has its own design kit (`src/content/design-kit.ts`) 14 days out; a library swap is a post-festival question. |

## What the thread is

- **Post:** "I vibecoded for 2 years, here's the stack I use daily", u/russopuppo, r/vibecoding, 39 points, 50 comments reported (100 retrieved with replies). Fetched in full via Arctic Shift on 2026-09-19.
- **The stack it sells:** Codex plus Claude Code in the repo, TypeScript plus Tailwind, Next.js, Untitled UI React, Postgres, **foundel.dev as the backend**, Stripe, Docker, Playwright, GitHub Actions, Vercel, Vercel Analytics or GA4, S3-compatible files. "What I wouldn't add yet": Redis, Kubernetes, Kafka, microservices.
- **What it is:** an ad. The author's two replies sit at -8 and -23; "my product gives you the whole backend already set up" is his own line. Eight top-level comments say "ad". One comment claims foundel.dev does not exist; measured 2026-09-19 it returns 200 at `https://foundel.dev/en`, so that comment is stale, not the post.
- **The signal, with scores:**
  - 58: 28 years professional. "Vanilla Claude Code defaulted to Opus. That's it." No one-size stack; a beginner should ask a frontier model how to build the thing and learn from there.
  - 23: "all we use is VSCode + Claude".
  - 19: undisclosed self-promotion is the objection, not the tools.
  - 1 (u/CapMonster1, the best technical comment): keep AI inside a well-defined architecture so auth, billing, permissions and limits are not scattered across generated files; treat Playwright as a safety net with a small deterministic set around signup, permissions, billing, critical flows.
  - 1: Vercel bills can spike after a local-news traffic burst ("$300 the next morning"); a $5 VPS is the counter. Relevant to ZAOstock the week of 3 Oct.
  - 1: Next.js "the only JS framework with repeated exploitable remote execution CVEs that are active". Our CI already carries dependabot; see Next Actions.

## Read against ZAO, measured 2026-09-19

| Item | ZAOOS (`package.json`) | zaostock (`package.json`) | Thread's claim |
|---|---|---|---|
| Framework | next ^16.2.9 | next ^16.3.4 | Next.js, yes |
| Database and auth | @supabase/supabase-js ^2.99.1 | ^2.116.0 | "toy stack", outgrow it |
| Styling | tailwindcss ^4 | ^4.0.0 | Tailwind, yes |
| Sessions | iron-session ^8.0.4 | iron-session ^8.0.4 (dependabot #113 offers 9.0.1) | not mentioned |
| E2E tests | @playwright/test ^1.58.2 | NONE | Playwright for signup, permissions, payments |
| Unit tests | vitest ^3.2.6 | vitest ^5.0.0 | AI writes most tests |
| CI | GitHub Actions (7 workflows) | ci.yml, uptime.yml | GitHub Actions gates the release |
| Deploy | Vercel | Vercel | Vercel, with Docker as the exit |
| Payments | cowork tracker, no Stripe dep | Stripe Payment Links plus Unlock lock, links pending (Zaal) | Stripe, billing in one place |

The gap the table shows is one row: zaostock has no end-to-end test on the flows a paying attendee touches, with 14 days to the festival.

## Findings

1. **The thread is 90 percent noise and 10 percent one good comment.** The stack list is the default every model already emits (a commenter says exactly that: "listed off the default saas stack every model is trained on"). The post's value is the framing of WHERE the simple stack hurts: workspaces, roles, plans, limits, emails, files, testing, security, all depending on each other. That list is a checklist, not a reason to buy a backend.
2. **The top comment is the counter-thesis and it matches how this estate works.** Vanilla Claude Code in the repo, project-specific everything else. Doc `dev-workflows/196-solo-dev-ai-coding-landscape-2026` reached the same place from the other side: "next-gen terminal + Supabase + Vercel".
3. **The deterministic-test point is the one thing to act on.** zaostock's checkout, backstage claim, and artist-profile PATCH are exactly "signup, permissions, billing". They have vitest unit coverage (`src/content/checkout.test.ts` and siblings) and no browser test.
4. **Two operational warnings worth carrying into 3 Oct:** a Vercel usage spike after press (Star 97.7 spot is 19 Sept; local news possible), and the Next.js CVE cadence (dependabot #185, #186, #113 are open on ZAOstock).

## Also See

- [dev-workflows/196-solo-dev-ai-coding-landscape-2026](../196-solo-dev-ai-coding-landscape-2026/) - the solo-dev stack landscape this thread re-argues.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add `@playwright/test` to zaostock with three deterministic flows (tickets checkout to the payment link, backstage code page loads for a valid code and 404s for a bad one, artist profile PATCH rejects a bad token); PR merged with CI running them | @Zaal via the zaostock lane | PR | 2026-09-26 |
| Merge or close ZAOstock dependabot #185 (eslint), #186 (zod 4), #113 (iron-session 9) after reading each changelog; #186 and #113 are majors | @Zaal | PR review | 2026-09-23 |
| Set a Vercel spend limit alert on the zaostock project before the 19 Sept radio spot airs again and the 3 Oct weekend | @Zaal | Vercel dashboard | 2026-09-26 |
| Second look at this thread's snapshot for the score delta (first look UNMEASURED: reddit walled for the snapshot tool) | @zj seat | `zao-research-snapshot` | 2026-09-26 |

## Sources

- [I vibecoded for 2 years, here's the stack I use daily, r/vibecoding](https://www.reddit.com/r/vibecoding/comments/1wjydgz/i_vibecoded_for_2_years_heres_the_stack_i_use/) - [FULL, method: `zao-fetch-reddit.sh` via Arctic Shift, post body plus 100 comments with scores; Claude-in-Chrome refused reddit.com, exa live-crawl timed out, Playwright bridge not connected, public .json 403]
- [foundel.dev](https://foundel.dev/en) - [PARTIAL, method: curl HEAD only, 200 with redirect to /en; content not read, needed only to test the "does not exist" comment]
- [untitleduico/react LICENSE](https://github.com/untitleduico/react/blob/main/LICENSE) - [FULL, method: `gh api` contents, base64 decoded; "MIT License, Copyright (c) 2025 Untitled UI"]
- ZAOOS `package.json` and zaostock `package.json`, read 2026-09-19 - [FULL, local files]
- [dev-workflows/196-solo-dev-ai-coding-landscape-2026](../196-solo-dev-ai-coding-landscape-2026/) - [FULL, library]
