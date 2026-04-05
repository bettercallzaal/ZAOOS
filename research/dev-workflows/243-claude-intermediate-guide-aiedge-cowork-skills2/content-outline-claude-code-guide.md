# Content Outline: "The Ultimate Guide to Claude CODE"

> Build-in-public content opportunity. Position: "That viral claude.ai guide is fine for beginners. Here's what the real power users are doing."

## Hook

AI Edge's guide hit 4M+ views teaching people to use Claude's chat UI. But the most powerful Claude tool isn't the chat — it's Claude Code. Here's what building a full-stack app with 243 research docs, 11 custom skills, and 3 scheduled agents looks like.

## Structure (Thread format — Farcaster + X + Bluesky)

### Part 1: The Setup That Makes Projects Impossible to Forget (3 posts)

- CLAUDE.md > Project Instructions (500+ lines of persistent context vs a text box)
- `.claude/rules/` — 4 rule files that load automatically (components, API routes, tests, skill enhancements)
- `community.config.ts` — one file to fork the entire community

**Show:** Side-by-side of claude.ai Project Instructions vs CLAUDE.md + rules

### Part 2: Skills That Actually Do Things (4 posts)

- 11 project skills, not instruction templates
- `/zao-research` — searches 243 docs + codebase + open source + web, saves numbered doc with comparison tables
- `/ship` — tests, reviews diff, bumps version, creates PR
- `/investigate` — four-phase debugging (investigate > analyze > hypothesize > implement). Iron rule: no fixes without root cause.
- Skills 2.0 evals — we test our skills like we test our code (show eval file)

**Show:** Before/after of research output with vs without skill

### Part 3: The Research Library as a Second Brain (3 posts)

- 243 research documents, each numbered and indexed
- Topics file for instant lookup
- Every doc has: comparison table, specific numbers, sources, file paths, no vague language
- Cross-referenced with actual codebase (research says X, code does Y — code wins)

**Show:** Screenshot of research folder + example doc header

### Part 4: Automation That Runs While You Sleep (3 posts)

- 3 scheduled cloud agents (daily status, weekly retro, research freshness)
- `/loop` for polling during development
- Dispatch from phone — text Claude from the subway, it runs on your desktop
- Hooks that enforce quality automatically

**Show:** Screenshot of scheduled tasks dashboard + daily brief output

### Part 5: The Autoresearch Loop (2 posts)

- Karpathy's autoresearch applied to everything: skills, code quality, bug hunting
- Modify > verify > keep/discard > repeat
- One dev improved skill success from 67% to 94% in 2 cycles
- Binary eval checklists — pass or fail, no "pretty good"

**Show:** Autoresearch iteration log

### Part 6: Why This Matters for Builders (2 posts)

- Solo founder + Claude Code = 584 commits in 16 days
- 46K LOC shipped, 86 PRs merged
- Not about prompting tricks — about building a system that compounds
- The gap between "using Claude" and "building with Claude" is the same gap as "using a computer" vs "programming"

**Show:** Git commit graph + build timeline

## Distribution Plan

1. Farcaster (primary) — thread in /zao and /dev channels
2. X — long-form thread, same content
3. Bluesky — cross-post
4. Auto-publish via ZAO OS cross-platform publishing (`src/lib/publish/`)

## Tone

- Technical but accessible
- Build-in-public authentic (show real screenshots, real numbers)
- Not dunking on AI Edge — complementing their guide for a different audience
- "Here's what's possible when you go deeper"
