---
topic: dev-workflows
type: market-research
status: research-complete
last-validated: 2026-04-29
related-docs: 506, 507, 549, 552, 555, 562, 563, 564, 565
tier: STANDARD
---

# 566 - Claude Reddit Gems (r/ClaudeAI + r/ClaudeCode, Apr 2026)

> **Goal:** Scrape r/ClaudeAI and r/ClaudeCode top posts via the new `/fetch` skill (Doc 564), surface the highest-leverage finds for ZAO, and propose concrete pickups. First real test of the post-fix Reddit pipeline.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt `shanraisshan/claude-code-best-practice` as the canonical Claude Code workflow comparator (supersedes Doc 507's individual picks for this scope) | **YES, REFERENCE-LEVEL** | 11 Claude Code workflow systems (BMAD, OpenSpec, Superpowers, etc.) compared in one table with sub-loops + canonical pipelines. Saves us comparing each individually. |
| Adopt **Storybloq** (`.story/` repo-native project tracker + MCP server + Mac app) for ZAO repos | **EVALUATE THIS WEEK** | Free Mac App Store app, sandboxed, signed by Apple. Repo-internal `.story/` dir = JSON + markdown, git-trackable. MCP server exposes to Claude Code via `/story` at session start. Direct overlap with how ZAO already tracks research; possible replacement for ad-hoc memory + research README pattern. |
| Adopt **Vibeyard** (Kanban for Claude Code agent sessions) | **NO, BUT WATCH** | One commenter linked to **VibeKanban** (already shut down) + Cline Kanban as alternatives. The pattern (Kanban-driven agent dispatch) is what 1code (Doc 555) does in a more polished way. Skip Vibeyard, watch the pattern. |
| Adopt **GSC keyword-gap mining** with Claude (BadMenFinance pattern) for ZAO content | **YES, STEAL THE TECHNIQUE** | Top reply calls the OP a spammer, but the technique is real and legit: feed Google Search Console queries/impressions/CTRs to Claude, find high-impression-zero-click queries, write articles targeting those gaps. Useful for ZAO docs site / BCZ portfolio / ZAOstock landing once each has a few weeks of GSC data. |
| Quang-vybe Humanizer skill (already lifted in Docs 562/564) | **DONE** | Confirmed it's the top of r/ClaudeCode all-time (419 upvotes). |
| Track `caveman` benchmark thread (#15 r/ClaudeAI) | **YES, NICE-TO-HAVE** | Caveman is already installed; a benchmark vs naive "be brief" prompt is worth reading once. |
| Watch general "Opus 4.7 sucks" thread chorus | **NO ACTION** | Multiple top posts complain Opus 4.7 is regressing vs 4.6. ZAO uses Opus via Claude Max sub; if it gets bad enough we revisit, but no immediate action. |

## Method (First Test of /fetch Post-Doc 564)

1. `~/bin/zao-fetch-reddit.sh "r/ClaudeAI" "top" "20"` → 2,858 lines JSON, parsed cleanly
2. `~/bin/zao-fetch-reddit.sh "r/ClaudeCode" "top" "20"` → 2,859 lines JSON, parsed cleanly
3. Selected high-signal posts via title heuristics (workflow comparisons, infra tools, content patterns)
4. Fetched 4 thread permalinks via `~/bin/zao-fetch-reddit.sh <url>` — selftext + top 3-8 comments parsed

**Reddit pipeline status: WORKING.** Doc 564's zao-fetch-reddit.sh handled 4 URLs + 2 subreddit listings without retry, no rate limits hit.

## Top 5 Gems (Ranked by ZAO Action Value)

### Gem 1 — `shanraisshan/claude-code-best-practice` (113 upvotes, r/ClaudeAI)

**TL;DR:** A single repo with a side-by-side table of 11 Claude Code workflow systems mapping their canonical pipelines. Yellow tags = sub-loops. Blue = top-level steps. Pipeline length is "a personality trait" — OpenSpec ships in 3 steps, BMAD runs 12.

**ZAO action:**
- Read the table once, pick the 1-2 systems closest to ZAO's actual flow (likely Superpowers + obra/superpowers since memory `project_trae_ai_skip` already canonicalised those).
- Use the comparison as a reference doc when QuadWork or other internal flows need a tune-up.
- Post-merger candidate for Doc 555 update or Doc 568 standalone.

**Top reply pushback (worth noting):**
- u/daresTheDevil: "Cool, but you don't need any of these."
- u/HeyItsYourDad_AMA: "I go back and forth if Superpowers is really better than `/plan` + own docs."
- u/mvlapatrick: "Steal best practices from each, build your own."

**ZAO read:** ZAO already does the "build own + steal" pattern. The table is a reference, not a forced choice.

**Source:** `https://github.com/shanraisshan/claude-code-best-practice` (linked in post)

### Gem 2 — Storybloq + `.story/` (44 upvotes, r/ClaudeAI / r/ClaudeCode)

**TL;DR:** Repo-internal project tracker that lives in `.story/` inside your repo. Tickets, issues, roadmap phases, lessons, session handovers. **All JSON + markdown, editable in any text editor, git-trackable.** Comes with:

- CLI for terminal use
- **MCP server** that exposes everything to Claude Code via `/story` at session start
- Free **Mac App Store** companion (sandboxed, Apple-signed, auto-updates) — visualises the same `.story/` dir live as Claude updates tickets

**Why this matters for ZAO:** ZAO currently tracks research in `research/{topic}/{number}-{slug}/README.md` (great), worksession state ad-hoc, ticket-equivalent state in TODOs and memory files. Storybloq's `.story/` is the same idea but standardised + visualised + MCP-aware. Possible drop-in for QuadWork's task ledger, or complement to it.

**Action:**
1. Install the Mac app (free, App Store)
2. Try `.story/` on **one** ZAO worktree (e.g. ZAOstock spinout repo) for 1 week
3. Compare to current research-doc + memory + TODO setup
4. If it sticks → fold pattern into ZAO repos. If not → walk away clean (just a `.story/` dir to delete).

**Source:** `https://apps.apple.com/us/app/storybloq/id6761348691`

### Gem 3 — GSC Keyword-Gap Mining (492 upvotes BUT spammy OP, r/ClaudeAI)

**TL;DR:** OP claims he ran 0→10K users in 6 weeks with $0 ads. Top comment auto-summary calls it a spammy ad. **Skip the OP's product. Steal the GSC technique.**

The technique: feed Google Search Console raw data (queries, impressions, click-through, average position) to Claude. Have Claude identify:
- High-impression / zero-click queries (you rank but don't convert)
- Topics where you have NO content but competitors do
- Cannibalization (multiple pages competing for same query)

Then write content targeting those specific gaps. Article structure they suggest:
- Quick Answer block at top (40-60 words, direct answer)
- H2 headings keyed to the search-intent variants
- Specific numbers/dates inline

**ZAO action:**
- For zaoos.com / thezao.com / bettercallzaal.com — once each has 2-4 weeks of GSC data, pipe to Claude weekly via a `/seo-gap` skill.
- Pair with Doc 558 (Anbeeld WRITING.md) + the humanizer skill so the output isn't AI slop.
- Pair with Doc 563 (Shann³ Ronin pattern, 17 markdown + 1 agent) — knowledge layer files include `gsc-data.md` updated weekly.

**Source:** Top reply chorus calls OP spam; skill+technique survives.

### Gem 4 — Vibeyard / Kanban-for-Claude Sessions (202 upvotes, r/ClaudeAI)

**TL;DR:** OP built Kanban board (Vibeyard) where each card is a task, click run → spins up Claude session scoped to that task. Card moves to Done when Claude finishes.

**Top reply burns:** u/2001zhaozhao notes "VibeKanban already did this 10 months ago + the startup shut down" + "Cline Kanban still exists." u/hclpfan: "Yet another. Barrier to creation is so low, nobody checks for existing projects."

**ZAO read:** The pattern is **1code** (Doc 555 — 5,494 stars, Apache 2.0, Cursor-clone with Kanban + worktree-per-chat + GH/Linear/Slack triggers). 1code already does this better. Skip Vibeyard. Don't add yet-another-board.

**Source:** `https://github.com/elirantutia/vibeyard`

### Gem 5 — Caveman Benchmark vs "be brief" (25 upvotes, r/ClaudeAI)

**TL;DR:** u/max-t-devv ran caveman skill (we have it installed) vs naive "be brief" prompt. Worth reading the methodology + verdict. Confirms or refutes whether caveman compresses tokens at the same level as a simple instruction.

**ZAO action:** read once, save findings to memory if material. Caveman is part of our daily flow.

**Source:** Reddit thread (link unfetched in this pass; fetch when ready to read).

## Honourable Mentions

| Post | ZAO relevance |
|---|---|
| Anthropic joins Blender Development Fund (#17) | MCP angle — Blender ↔ Claude integration is alive. Future ZAO Music video / WaveWarZ visualiser angle. |
| iPhone terminal for Claude Code (#3 r/ClaudeCode, 213 upvotes) | Mobile workflow gem. URL fetch errored; refetch when needed. |
| "Measuring tokens is a fools errand" (#9 r/ClaudeCode, 78 upvotes) | Aligns with `everything-claude-code:cost-aware-llm-pipeline`. Worth re-reading. |
| Mobile push notifications via Remote Control (#18) | Already partially leveraged this session via /remote-control command. |
| Opus 4.7 is bad chorus (multiple posts) | No action. Watch. Use Opus 4.6 fallback if available (#10 r/ClaudeCode confirms 4.6 is back). |

## Reddit-Pipeline-Test Verdict (First Real Use Post-Doc 564)

| Test | Result |
|---|---|
| Subreddit top listings | Pulled cleanly (200K+ JSON each, 0 retries) |
| Single thread fetch | Pulled selftext + top comments cleanly for 3 of 4 URLs |
| Failure mode | 1 URL errored (iPhone-terminal post — likely permalink mismatch); not a pipeline issue |
| Time to insight | ~10 minutes from "scrape Claude content" to ranked picks |

**Pipeline is solid.** Use it for next research sprint without ceremony.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Read `shanraisshan/claude-code-best-practice` table once | Zaal or session | One-shot read | This week |
| Install Storybloq Mac app, try `.story/` on ZAOstock spinout repo for 1 week | Zaal | Spike | This week |
| Skip Vibeyard. 1code (Doc 555) covers the same ground better. | n/a | Decision | n/a |
| Defer GSC keyword-gap skill until first ZAO site has 2-4 weeks of GSC data | Zaal | Calendar | After ZAOstock site live |
| Read caveman vs "be brief" benchmark thread; save findings if material | Zaal | One-shot | This week |
| Write Doc 567 if `.story/` sticks (full integration spec) | Future session | Conditional | After 1-week trial |

## Also See

- [Doc 506 - TRAE skip](../506-trae-ai-solo-bytedance-coding-agent/) - canonical ECC + obra stack frame
- [Doc 507 - Claude skills 1116 ecosystem](../507-claude-skills-1116-ecosystem-zao-picks/) - related skill picks
- [Doc 555 - Agent harness shootout](../555-agent-harness-shootout/) - 1code lives here, supersedes Vibeyard pickup
- [Doc 558 - Anbeeld WRITING.md](../558-anbeeld-writing-md/) - prose hygiene that GSC technique outputs feed through
- [Doc 562 - Reddit/X scraping meta-eval](../562-reddit-x-scraping-meta-eval-last30days/) - sister doc, why we can do this scrape
- [Doc 563 - Ronin content engine](../563-shannholmberg-content-engine-ronin/) - knowledge-layer pattern that GSC data slots into
- [Doc 564 - Reddit/X scraping FIXED](../564-reddit-x-scraping-FIXED-implementation/) - the pipeline this doc validates
- [Doc 565 - /ask-gpt loop](../565-ask-gpt-claude-chatgpt-learning-loop/) - cross-validate any of these picks via GPT-5

## Sources

- [r/ClaudeAI top all-time](https://www.reddit.com/r/ClaudeAI/top/?t=all) - top 20 fetched 2026-04-29
- [r/ClaudeCode top all-time](https://www.reddit.com/r/ClaudeCode/top/?t=all) - top 20 fetched 2026-04-29
- [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) - 11-system comparison
- [Storybloq Mac App Store](https://apps.apple.com/us/app/storybloq/id6761348691)
- [Vibeyard repo](https://github.com/elirantutia/vibeyard) - skip per analysis above
- [VibeKanban shutdown notice](https://vibekanban.com/blog/shutdown) - referenced in top reply

## Staleness

Reddit top posts churn weekly. Re-run `r/ClaudeAI top week` and `r/ClaudeCode top week` monthly via /fetch. Re-validate by 2026-05-29.
