---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-11-01
superseded-by:
related-docs: "2111, 2564, 2639"
original-query: "resaech waht claude slop iis and claude websites and do a deep dive into upgrading our website and ui skills (Zaal in the fractal lane pane, 1 Nov 2026, with a full-page screenshot of https://fractal.thezao.com, after: 'the UI looks terrible tho research all my repos and find upgrades please')"
tier: STANDARD
---

# 2728 - "Claude slop": what it is, how Claude's own sites avoid it, and what it means for fractal.thezao.com and ZAO's UI skills

> **Goal:** Name the generic look that AI coding agents produce, measure fractal.thezao.com against it, read what Anthropic's own sites and design skill actually do, and say which ZAO UI skills to change, inside the standing rule that AI writes code and a person sets the public look.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **fractal.thezao.com is a textbook generated page and should be treated as an unapproved AI design, not a finished site.** It hits 9 of the 18 patterns in the only measured study found (a "High" score is 4 or more), and 6 of the tells Anthropic's own `frontend-design` skill names (Findings 2). | Rulings 53 and 54 (vault `decisions/grill-2026-10-07-seat-morning.md`) and the 2026-10-28 homepage ruling say a public ZAO look is set by Zaal or a human designer; AI concepts are sketches. This look was AI-made and is live. |
| 2 | **Do NOT copy Claude's look.** Anthropic's own skill lists "warm cream background, high-contrast serif, terracotta accent near #D97757" as trait 1 of AI-generated design, because it is Anthropic's accent. A ZAO site in cream and clay would trade one tell for another. | Copying a famous site is the same distributional convergence that produced the current page. |
| 3 | **What to take from Claude's sites is method, not style:** one custom type family in three cuts (sans, serif, mono), a small named palette, and restraint. | Read from the live CSS of anthropic.com and claude.com on 1 Nov 2026 (Findings 3). |
| 4 | **The look decision goes to Zaal as three options with a default** (Findings 5). The agent then builds the chosen one. | Item 53: "The spec is silent" is a question, not a choice (doc 2639, decision 2). |
| 5 | **Fix the ZAO UI skills so this cannot recur** (Findings 6): the `design` skill and the always-on ECC `frontend-design` both tell an agent to choose a look, which item 53 forbids on public surfaces. | That conflict is how an AI-made look reached a public ZAO site. Doc 2639 raised the ECC one on 2026-10-08 as a question to Zaal; it is still open. |
| 6 | **ADOPT `AdrianKrebs/design-slop-cop` (MIT) as a deterministic check in the site pass**, scored before and after any redesign. | It is a computed-style DOM check, not an LLM opinion, so it cannot praise its own work, which doc 2639 decision 4 requires of a grader. |

## Findings

### 1. What "AI slop" design is

"Slop" here means the look an AI coding agent produces when nobody made the taste decisions: the model fills them with the statistical middle of the web. Anthropic calls it "distributional convergence" (doc 2639, Sources 2 there).

The one measured study found: Adrian Krebs, "Scoring Show HN pages for AI design patterns", 20 Apr 2026. A Playwright script read computed styles and DOM on 1,590 Show HN submissions and checked each for deterministic patterns, with no screenshots or LLM judgment and an estimated 5-10% false positive rate by manual QA.

| Score | Sites | Share |
|---|---|---|
| High (4+ patterns) | 347 | 22% |
| Medium (2-3) | 508 | 32% |
| Low (0-1) | 735 | 46% |

The author calls the result "uninspired" rather than bad, and notes a single pattern proves nothing. The post refers to 16 scored patterns but lists 18 candidates; the 18 are used below and the discrepancy is the source's.

Anthropic's `frontend-design` skill (Apache-2.0, last change in `anthropics/skills` on 2026-09-03 at `41bbe19`) gives a second, independent list of five trait clusters it says AI-generated design "clusters around", and three typographic treatments it calls "the commonest tells of a generated page": accenting one word or phrase in a headline, all-caps labels, and labels above content that add nothing.

Design blogs repeat the same core (purple-blue gradients, Inter, three equal cards, centered hero) but none of them measured anything; they are context, not evidence.

### 2. fractal.thezao.com against both lists

Source: the full-page screenshot Zaal sent on 1 Nov 2026 and `site/src` on ZAOfractal main at `de8ee5f`.

**Krebs's 18 patterns:**

| # | Pattern | Here? | Evidence |
|---|---|---|---|
| 1 | Inter for everything | no | Syne, Outfit, Spectral, JetBrains Mono |
| 2 | Stock LLM font combos | no | |
| 3 | Serif italic accent word | no, but see Anthropic tell below | |
| 4 | "VibeCode purple" | no | |
| 5 | Permanent dark mode, grey body, caps labels | **yes** | dark only; `text-transform: uppercase` 16 times in `site/src` |
| 6 | Barely passing contrast | **yes** | card meta text `#877E73` on card `#221F2D` = **4.04:1**, under WCAG AA's 4.5:1 ("16 FILES - SHALLOW LINEAGE SURVEY") |
| 7 | Gradients on everything | **yes** | `linear-gradient` 6 times, gradient-clipped headline text, three blurred radial blobs |
| 8 | Large colored glows and shadows | **yes** | orange glow under "Read the whitepaper"; `box-shadow` 11 times |
| 9 | Centered hero in a generic display face | **yes** | |
| 10 | Badge above the H1 | **yes** | "Week 117+ - live, Mondays 6pm EST" pill with a pulsing dot |
| 11 | Colored card borders | check | `border-left` 7 and `border-top` 6 in `site/src`, not each traced to a card |
| 12 | Identical feature cards | **yes** | four docs cards and two exploration cards, same shape |
| 13 | Numbered steps | no | |
| 14 | Stat banner row | **yes** | 100+ / 242+ / ~40 / 2 |
| 15 | Emoji nav | no | |
| 16 | All-caps headings and labels | **yes** | stat labels, card meta |
| 17 | shadcn/ui | no | plain Astro and CSS |
| 18 | Glassmorphism | partial | `backdrop-filter` 4 times |

**9 clear hits of 18.** Krebs's "High" band starts at 4.

**Anthropic's tells:** accented phrase in the headline ("100+ weeks unbroken." in a gradient), tracked all-caps labels, monospace for small data labels (stat labels and eyebrow in JetBrains Mono), arrows appended to links ("Read the whitepaper ->"), the "big number, small label, gradient accent" hero the skill names as a default, and the SaaS card kit.

**Two content problems no style fix touches:**
- "~40" renders as a glyph that reads "-40" in Syne, so the stat looks negative.
- The numbers are typed by hand and stale (doc's companion plan, ZAOfractal #36): "242+ as of May 21, 2026", "~40 active members" against the whitepaper's own median of 7 receiving Respect per session, "100+ weeks" while the eyebrow says Week 117+ and the next session is Fractal 122, "Chapters 4-11 still to come" though ch00-ch11 are drafted, and the archived `fractalbotmarch2026` named as the bot.

Doc 2639's finding holds: a one-shot site is generic twice, in an invented look and in invented or stale content. This page has both.

### 3. What Claude's own sites do

Read from the stylesheets of https://www.anthropic.com and https://claude.com on 1 Nov 2026 (curl, CSS linked from the HTML; claude.ai's login page returned 403 and was not read).

| | anthropic.com | claude.com |
|---|---|---|
| Type | `anthropicSans`, `anthropicSerif`, `anthropicMono` (custom); sans 70 rules, serif 57, mono 11 in one sheet | `--font-anthropic-sans`, `--font-anthropic-serif`, `--font-anthropic-mono`; older `styrene-b`, `copernicus`, `tiempos-text` still referenced |
| Base | `#141413` ink, `#faf9f5` ivory | `--color-gray-950 #141413`, `--color-gray-050 #faf9f5`, `--color-gray-100 #f5f4ed` |
| Accent | named secondary set: `sky #6a9bcc`, `olive #788c5d`, `oat #e3dacc`, `fig #c46686`, `heather #cbcadb` | `--color-clay #d97757`, `clay-hover #c6613f`, `clay-dark #c46849`, used through semantic tokens such as `--theme-accent-clay-primary` |
| Hero | not read (H1 hidden until script runs) | serif display headline, "Question what's next" |

Type.today's April 2024 piece records the earlier system: Styrene (Berton Hasebe) for headlines, Tiempos (Klim) for body. The live CSS shows it replaced by a custom family; when that happened was not found.

**What transfers:** one family, three cuts, so serif and sans feel related; colors named for what they are and used through semantic tokens (`accent`, `ink`, `button-bg`), not raw hex in components; one accent doing one job.

**What does not:** the cream, serif and clay palette itself (Decision 2).

### 4. What Anthropic says about getting past it

The official `frontend-design` skill (local copy: `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md`, 71 lines) works in two passes:
1. A plan: 4-6 named hex colors, type roles, a layout concept with ASCII wireframes, and principles. Then review the plan against the brief and replace anything "you would produce for any similar page".
2. Build, then critique: "Spend your boldness in one place", cut decoration, meet a floor of responsive, visible focus, reduced motion and contrast.

It also says the hero should open with "the most characteristic thing in the subject's world". For ZAO Fractal that is not a gradient headline. Candidates from the subject itself: the live Respect leaderboard the bot dashboard already reads from ornode (`bettercallzaal/zao-fractal-bot` PR #37), the six-person breakout room and its ranking, or the unbroken run of weekly sessions as a real calendar.

Under item 53 the first pass is the part that goes to Zaal: the agent drafts the plan as options, he picks.

### 5. Options for Zaal (sketches, he or a designer sets the look)

| Option | Idea | Draws on | Risk |
|---|---|---|---|
| **A (default) - ZAO house** | thezao.com navy `#03182f`, gold `#f5c518`, text `#eaf0f8` (from `bettercallzaal/zao-website` `app/globals.css`); system UI for chrome, Spectral kept for long reading; hero is the live leaderboard | the parent site; doc 2111 fix 2, "use the ZAO system, don't let AI invent a rainbow" | safe; relies on the leaderboard to carry personality |
| B - The room | the hero shows one breakout room: six names, the vote, the Respect each earned; light paper ground for reading, ink text, gold only on actions | the Respect Game itself | needs real session data per week; more build |
| C - The archive | an editorial reading site for a research library and whitepaper: serif body, left-aligned, no cards, a single index | the content: 16 reference, 42 research, 14 whitepaper files | close to trait 3 in Anthropic's list (broadsheet) if done by default rather than on purpose |

Whichever he picks, the same content fixes apply: computed numbers, one stat definition, a working bot name, real chapter status.

**In flight on 1 Nov 2026, under option A as the logged default:** the work is split into four ZAOfractal PRs that touch disjoint files, so several lanes can build at once:
- P1, tokens and contrast: `global.css`
- P2, font hookup: 14 components and pages
- P3, plain hero: `Hero.astro`, opened as #37
- P4, join-first home: `index.astro`

All four apply The ZAO's existing tokens in code and add no new visual, per the messenger's reading of item 53, which it is confirming with Zaal. A repo scout (vault #401) found MIT join-flow code to reuse in ZAO101 and theZAOZone, and GPL-3.0 ORDAO frontends (`sim31/ordao`, `zao.frapps.xyz`) to link to but not copy into MIT ZAOfractal.

### 6. ZAO UI skills: what to change

Measured on this Mac, 1 Nov 2026.

| Skill | Where | Problem against item 53 | Change |
|---|---|---|---|
| `design` | `~/zaal-dotfiles/claude/skills/design/SKILL.md`, 79 lines | Produces three directions and "a recommendation"; names no rule that a person chooses on a public site; suggests 21st.dev and shadcn, which Krebs's list counts as a tell (#17) | Add: on a public ZAO surface output is options for Zaal or the named designer, never a pick; drop the library pointers; add the Anthropic and Krebs tell lists as a self-check before output |
| ECC `frontend-design` | everything-claude-code 1.10.0 plugin, 145 lines, enabled | Tells the agent to choose an aesthetic whenever "visual direction matters"; doc 2639 found it is the one that loads unasked | Zaal's call, open since 2026-10-08 (doc 2639 Next Actions): turn it off for ZAO public sites. Default: off |
| official `frontend-design` | Anthropic, Apache-2.0, in the marketplace folder, not enabled | Best tell list found, but its job is also choosing a look | Keep off (doc 2639); quote its tell list inside the site pass as QA |
| `critique` | `~/zaal-dotfiles/claude/skills/critique/SKILL.md`, 206 lines | Self-critique by the builder; doc 2639 decision 4 says the grader is never the builder | Use only before handing to a grader, not as the grade |
| `gstack/design-review` | 956 lines | Not read in full this pass | INVESTIGATE: does it check contrast numerically, or by eye? |
| missing: a deterministic slop check | none | Nothing on this Mac scores a page against the tell list | Add `design-slop-cop` (MIT, 18 stars, last push 2026-07-07) to the site pass from doc 2639; run on fractal.thezao.com before and after |

Doc 2564 already decided axe-core and Lighthouse CI as the deterministic accessibility gate. The 4.04:1 contrast miss above is exactly what that gate would catch.

## Also See

- [Doc 2111](../2111-anti-ai-slop-web-design/) - the five anti-slop fixes, and "use the ZAO palette"
- [Doc 2564](../2564-ui-improvement-audit-tools/) - audit tooling; axe-core and Lighthouse CI as the deterministic gate
- [Doc 2639](../2639-agent-built-sites-authentic/) - the human-designer split under item 53, `site-pass.md`, and the open ECC `frontend-design` question
- Tracker card 10661 - the fractal.thezao.com UI upgrade
- ZAOfractal #36 - `site/UPGRADE-PLAN.md`, the stale-copy list

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Pick option A, B or C (or name a designer) for fractal.thezao.com; done when the choice is recorded in a vault decision | @Zaal | Decision | 2026-11-08 |
| Pick the gold: thezao.com `#f5c518` against ZAOOS and ZAO101 `#f5a623` (vault #401 scout); done when recorded | @Zaal | Decision | 2026-11-08 |
| Merge the hero PR, ZAOfractal #37 (P3: decoration and hand-typed stats removed); done when merged and read live | fractal lane (6), merge by @Zaal | PR | 2026-11-04 |
| P1 tokens, fonts and card-meta contrast to at least 4.5:1 in `global.css`; done when merged and re-measured | lane (2) | PR | 2026-11-04 |
| P2 font names to tokens in the 14 other components and pages; done when merged | cards lane (1) | PR | 2026-11-04 |
| P4 join-first home page plus stale chapter and transaction lines in `index.astro`; done when merged | first free helper, via messenger | PR | 2026-11-06 |
| Run `design-slop-cop` on fractal.thezao.com and record the score in card 10661; done when the score is on the card | fractal lane (6) | Check | 2026-11-04, once Mac load allows a headless browser |
| Edit the `design` skill to give options not picks on public ZAO surfaces and add the tell lists; done when the zaal-dotfiles PR is merged | skills lane (0p) | PR | 2026-11-08 |
| Rule on turning off ECC `frontend-design` for ZAO public sites; done when recorded | @Zaal | Decision | 2026-11-08 |

## Sources

1. Adrian Krebs, "Scoring Show HN pages for AI design patterns", 20 Apr 2026 - https://adriankrebs.ch/blog/design-slop/ - [FULL, WebFetch; HTTP 200 on 1 Nov 2026]. Community source: a study of Show HN submissions.
2. `AdrianKrebs/design-slop-cop` - https://github.com/AdrianKrebs/design-slop-cop - [PARTIAL - repo metadata and LICENSE read (MIT, 18 stars, pushed 2026-07-07); code not read]
3. Anthropic, `frontend-design` SKILL.md - https://github.com/anthropics/skills/tree/main/skills/frontend-design - [FULL, local copy on disk, 71 lines; licence Apache-2.0 from the plugin's LICENSE file; last upstream change 2026-09-03 `41bbe19`]
4. https://www.anthropic.com - [PARTIAL - HTML and linked CSS read by curl for font and color tokens; layout not rendered]
5. https://claude.com - [PARTIAL - same method; H1 text read]
6. claude.ai - [FAILED - login page returned HTTP 403 to curl; not read]
7. type.today, "Styrene in use: ANTHROP\C", Apr 2024 - https://type.today/en/journal/anthropic - [PARTIAL - search summary only; HTTP 200; superseded by the live CSS in Findings 3]
8. "The Purple Gradient Problem: Why AI UI All Looks Alike" - https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65 - [PARTIAL - search summary only; HTTP 200; context, not evidence]
9. "Why Your AI Keeps Building the Same Purple Gradient Website" - https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website - [PARTIAL - search summary only; HTTP 200]
10. 21st.dev, "website not look AI generated" - https://21st.dev/blog/website-not-look-ai-generated - [PARTIAL - search summary only; HTTP 200; vendor source]
11. 925 Studios, "AI Slop Fonts and Gradients" - https://www.925studios.co/blog/ai-slop-design-tells - [PARTIAL - search summary only; HTTP 200; vendor source]
12. superdesign.dev, "fix generic AI landing page" - https://superdesign.dev/blog/fix-generic-ai-landing-page - [PARTIAL - search summary only; HTTP 200; vendor source]
13. vibecodekit.dev, "AI slop design" - [FAILED - curl returned no connection on 1 Nov 2026; not cited for any claim]
14. `bettercallzaal/zao-website` `app/globals.css` - [FULL for the token lines, via gh api]
15. ZAOfractal `site/src` at `de8ee5f` and Zaal's full-page screenshot of fractal.thezao.com, 1 Nov 2026 - [FULL]

Not escalated: sources 7-12 are only search summaries. None carries a claim alone; every claim above rests on 1, 3, 4, 5, 14 or 15. An unverified attribution in the search results (an apology by Tailwind's creator, and who coined "AI slop") was left out.

Tier is STANDARD, not the DEEP asked for: the measured core is two primary sources and the live sites. A DEEP pass would add a Reddit or HN thread read in full, the `design-slop-cop` code, and a rendered comparison, which needs a headless browser the load limit does not allow today.
