---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-09-26
related-docs: 2111, 2107, 2507
original-query: "Find and evaluate tools for automatically finding ways to improve a live website's UI/UX - design quality, accessibility, visual polish, performance - something an agent or lane could run against a site like zaostock.com or the broader ZAO ecosystem sites to surface concrete improvement ideas, not just lint/CI checks. Compare options (e.g. visual regression/design-critique tools, accessibility scanners, Lighthouse-style tools, AI-driven UI critique agents, Playwright-based visual diffing) and recommend one to adopt."
tier: STANDARD
---

# 2564 - UI/UX improvement-audit tools: what to run against a live ZAO site

> **Goal:** Find a tool or pattern an agent/lane can run against a live site (zaostock.com first) to surface concrete design/UX improvement ideas - not just Lighthouse scores or lint output - and recommend one for ZAO to adopt.

## Key Decisions

**BUILD a ZAO-owned Claude Code skill using Playwright MCP + parallel specialist critique agents + a weighted SHIP/BLOCK verdict.** Do not adopt any single third-party OSS repo as a live dependency - every one found is a near-zero-adoption side project, and two of the four have no clear open-source license at all. Use `spsk-dev/tasteful-design`'s published architecture (MIT-licensed, so legally readable and adaptable) as the blueprint, because it is the only candidate with published before/after eval numbers proving the architecture works: a single-pass generic critique scored 40% on its own eval assertions; the same eval with parallel domain specialists plus page-intent context up front scored 100%. That 60-point delta is the one number in this whole space backed by a stated methodology rather than a star count.

**Keep axe-core + Lighthouse CI as a separate, complementary gate**, not a substitute. They catch the class of problem a vision-based critique agent structurally cannot (WCAG contrast ratios, DOM semantics, load performance) and they are deterministic and fast where an LLM critique is stochastic and slow - the HN discussion below calls these "two different kinds of gates" with "very little overlap," which matches what `tasteful-design` itself does (its Code & A11y specialist wraps axe, separate from its five vision specialists).

## Why this matters to ZAO

Every ZAO web surface - zaostock.com, the zaodevz onboarding site, ZABAL Games, Sparkz UIs - is AI-built, and doc 2111 already established the "AI slop" failure mode (centered layouts, one purple gradient, three even cards) as a real, named risk. Doc 2111's fix was *prompting instructions* for the build step. This doc covers the missing other half: a way to *check a site that already exists* and get back concrete, prioritized findings, which is what a launch-week or post-launch pass on zaostock.com actually needs.

## The landscape, measured today

Five approaches exist, from "already installed" to "pay per run." None of the AI-critique OSS projects has real adoption - the strongest signal in this space is architectural (what the tools do), not popularity (nobody has starred any of them).

| Option | Type | Cost | Stars / last push | License | Verdict |
|---|---|---|---|---|---|
| **`spsk-dev/tasteful-design`** ([repo](https://github.com/spsk-dev/tasteful-design)) | Claude Code plugin, self-hosted | Free (uses your own Claude/Gemini calls) | 0 stars, 1 fork, pushed 2026-03-31 (~6 months stale) | MIT (verified from the LICENSE file itself, not the GitHub API classifier) | **REFERENCE the architecture, do not install as a dependency.** Stale and unproven, but MIT means its 7-specialist / weighted-synthesis design can be read and rebuilt in a ZAO-owned skill without a licensing question. |
| **`AnanthuNarashimman/QAI` (VibeAudit)** ([repo](https://github.com/AnanthuNarashimman/QAI)) | Hosted web app + agent, Gemini-driven | Free (self-run, needs Gemini API key) | 1 star, 0 forks, pushed 2026-09-22 (4 days old) | No LICENSE file found via `gh api` | SKIP for adoption - no license means all-rights-reserved by default (`.claude/rules/credit-attribution.md`). Worth knowing it exists: most recently active of the four, BFS site crawl + per-viewport CTA/theme scoring is a pattern worth stealing, just not the code. |
| **`grzetich/eyeson`** ([repo](https://github.com/grzetich/eyeson)) | CLI + MCP server, Gemini-driven | Free (self-run) | 0 stars, 1 fork, pushed 2026-02-13 (~7 months stale) | No LICENSE file found via `gh api` | SKIP - unlicensed and stale. Notable feature worth copying: it ships an MCP server so Claude itself can drive "analyze the UX of this URL" as a natural-language request, which is the right end-user shape even if this specific codebase isn't safe to depend on. |
| **`LinzLos/FLOWIE`** ([repo](https://github.com/LinzLos/FLOWIE)) | Portable critique script (not code), input-agnostic | Free | 0 stars, 0 forks, pushed 2026-09-19 (1 week old) | `NOASSERTION` (ambiguous - explicitly the case hard requirement 13 warns about) | SKIP for the same reason as QAI/eyeson, but the *design* is the most portable of the four: it is a single versioned prompt script, not a codebase, meant to be pasted into any LLM. Worth reading for the "coupling invariants" idea (nav order matches content order, labels match targets) as a category of check the vision specialists above don't cover. |
| **Finesse by Skippr AI** ([listing](https://bestaitoolfinder.com/finesse-by-skippr-ai/)) | Commercial Chrome extension, hosted | Not published; enterprise-positioned | Public launch December 2025 | Proprietary, closed | SKIP for ZAO - screenshots of any page you review leave your machine and go to a third party's servers, which is the wrong tradeoff for pre-launch or backstage ZAOstock pages. Real product though, and its MCP-to-coding-agent sync (feedback flows straight into Cursor/Claude Code) is the right end state to aim for. |
| **Sokosumi "Page Design Analysis"** ([listing](https://www.sokosumi.com/ai-coworkers/page-design-analysis)) | Pay-per-run hosted agent | $0.80/run (80 credits), 156 runs total to date | N/A (marketplace listing, not a repo) | N/A, hosted service | SKIP - single public page per run, no login-protected pages (rules out every ZAOstock backstage page), and $0.80 a run adds up fast for a multi-page site audited repeatedly through launch week. |
| **axe-core + Lighthouse CI** | Deterministic scanners | Free, OSS | Industry-standard, actively maintained (not re-verified here, already well known to this repo) | Apache-2.0 / Apache-2.0 | KEEP as the deterministic half of a hybrid gate - accessibility violations and performance regressions, not design opinions. This is the "lint/CI checks" the original ask explicitly wanted to go beyond, not replace. |

## What ZAO already has, that most of the field is still building

This repo already has `mcp__playwright__*` tools available (confirmed live in this session's tool list) and this exact ZAOstock repo has Playwright wired for its own e2e suite (`package.json`'s `test:e2e` script, `playwright.config.ts`). The HN thread on ProofShot confirms this is now a first-party-blessed pattern, not a hack: *"Anthropic added a plugin accessible under `/plugins` to CC to make it even easier to add MCP Playwright to your project. It automatically handles taking screenshots."* So the one piece every OSS project above has to ask a user to install (`npx playwright install chromium`, `claude mcp add playwright`) ZAO can assume is already present in a Claude Code session.

The other missing piece - parallel specialist sub-agents with a synthesizing verdict - is exactly the shape of this session's own `Workflow` tool (`pipeline`/`parallel` agent orchestration, already available). `tasteful-design`'s 5-phase pipeline (screenshot → page-intent classification → N parallel specialists → weighted synthesis → prioritized fix list) maps directly onto a `Workflow` script: one `agent()` per specialist (font, color, layout, motion, UX/intent, code/a11y), run in `parallel()`, then one synthesis `agent()` that reads all the findings and produces the SHIP/CONDITIONAL/BLOCK verdict.

## Community signal (HN, verified live)

- **[Show HN: adamsreview](https://news.ycombinator.com/item?id=48090276)** (verified 2026-09-26, live thread) - a parallel multi-specialist review pattern for *code*, not UI, but directly validates the architecture: "each loop has ~7 agents... looking through different lenses (security, UX, performance, etc.)... we regularly see 3-8 rounds yielding valid results." A commenter's caution is worth carrying into any ZAO build: "prompt based orchestration is non-idempotent... I've had better experience enforcing tool restrictions in discrete phases with deterministic code over orchestrating via LLM" - argues for `Workflow`'s deterministic `pipeline()`/`parallel()` scripting over a single agent freelancing the whole review itself.
- **[Show HN: ProofShot](https://news.ycombinator.com/item?id=47499672)** (verified 2026-09-26, live thread) - the clearest statement of why a vision-based critique and a structural scanner are not substitutes for each other: *"These are two different kinds of gates: structural, which are fast and deterministic, and stochastic, which are slow but catch things that are completely different. There is very little overlap between the issues, and you want to catch both."* Directly supports the hybrid (axe/Lighthouse + vision specialists) recommendation above rather than picking one.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build a `design-audit` Claude Code skill (Playwright MCP screenshots + `Workflow` parallel specialists + weighted SHIP/BLOCK synthesis), using `tasteful-design`'s README as the architecture reference, not its code | @Zaal | PR | 2026-10-10 |
| Pilot the new skill against zaostock.com as its first real target, post-festival so it doesn't compete with launch-week work | @Zaal | Task | 2026-10-10 |
| Wire axe-core + Lighthouse CI into ZAOstock's existing CI as the deterministic half of the gate, separate from the new skill | @Zaal | PR | 2026-10-17 |

## Also See

- [Doc 2111](../2111-anti-ai-slop-web-design/) - the build-time half of this problem (prompting instructions so a new AI-built surface doesn't need auditing in the first place)
- [Doc 2107](../2107-implementation-brief-prompt-pattern/) - the implementation-brief pattern this doc's Next Actions should feed into
- [Doc 2507](../2507-vibe-coded-site-ui-polish/) - a real, manual instance of exactly this kind of audit, done by hand against two live ZAOstock pages on 2026-09-19 (contrast-ratio math, dead-link detection, empty-state photo handling). The `design-audit` skill this doc recommends building is the automated, repeatable version of what 2507 did once by hand - its punch list is a good first eval set for testing the new skill against a known-correct answer.

## Sources

- [spsk-dev/tasteful-design](https://github.com/spsk-dev/tasteful-design) [FULL - README read via `gh search code`/exa web_search highlights and `gh api` for stars/license/LICENSE-file content, verified 2026-09-26]
- [AnanthuNarashimman/QAI](https://github.com/AnanthuNarashimman/QAI) [PARTIAL - README highlights only, not the full source; stats verified via `gh api`, 2026-09-26]
- [grzetich/eyeson](https://github.com/grzetich/eyeson) [PARTIAL - README highlights only; stats verified via `gh api`, 2026-09-26]
- [LinzLos/FLOWIE](https://github.com/LinzLos/FLOWIE) [PARTIAL - README highlights only; stats verified via `gh api`, 2026-09-26]
- [Finesse by Skippr AI - listing](https://bestaitoolfinder.com/finesse-by-skippr-ai/) [PARTIAL - third-party review site, not Skippr's own page; no official pricing/repo to cross-check against]
- [Sokosumi Page Design Analysis - listing](https://www.sokosumi.com/ai-coworkers/page-design-analysis) [FULL - marketplace listing page itself carries the price, run count and constraints quoted above]
- [Show HN: adamsreview](https://news.ycombinator.com/item?id=48090276) [FULL - live HN thread, read via web search highlights covering the submission and top comment chain]
- [Show HN: ProofShot](https://news.ycombinator.com/item?id=47499672) [FULL - live HN thread, same method]
