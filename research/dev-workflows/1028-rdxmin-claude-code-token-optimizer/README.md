---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-07-10
superseded-by:
related-docs: 357, 362
original-query: "Research this: reddit.com/r/claudeskills/s/4XJQTEJ7Ir - 'I built RDXmin, a Claude Code optimizer that saved more tokens than Caveman + Ponytail combined'"
tier: STANDARD
---

# 1028 - RDXmin: A Claude Code Token Optimizer, Measured Against Caveman

> **Goal:** Evaluate RDXmin (a newly-posted open-source Claude Code token-optimization tool) against the existing, already-installed `caveman` skill (docs 357, 362) and decide whether it's worth adopting in ZAO OS sessions.

## Key Decisions

1. **DO NOT install RDXmin yet - re-run its own benchmark suite against ZAO OS's real session shapes before adopting.** RDXmin's published numbers (52% of baseline output tokens vs caveman's 80%, on its own 20-task suite) are self-reported by the tool's author, on tasks the author chose. Doc 362 already found a 6-9x gap between caveman's self-reported claim (75%) and independently-measured real-world savings (4-10% of total session cost) - the same gap-between-vendor-claim-and-real-session-impact risk applies here until someone re-runs RDXmin's own methodology independently.
2. **RDXmin's input-axis compression (PostToolUse hook stripping ANSI/duplicate/oversized tool output) is the more credible, more novel claim - it targets a documented ZAO-relevant cost driver.** Doc 362 found caveman only touches *prose output* (24% of a session's output tokens, ~4-5% of total session cost) and explicitly recommended `/compact` over caveman for real savings. RDXmin's input-axis hook instead targets tool-output bloat re-billed on every subsequent turn (measured at 67.5% of context content across the author's 171 sessions) - a different, larger cost surface than what caveman or `/compact` alone address. This is worth testing on ZAO OS's own bash-heavy, log-heavy sessions (npm test output, git diffs, curl dumps - exactly the kind of noisy tool output this repo's own sessions produce).
3. **The tool is 11 days old (created 2026-06-30, this post 2026-07-10) with 23 GitHub stars and 1 fork - too new for independent verification to exist yet.** Every comparison number in this doc traces back to the author's own README and benchmark commits; no third-party reproduction was found. Treat as promising-but-unverified, same posture doc 362 took toward caveman before independent numbers existed.
4. **If tested, scope it to a single throwaway session first, not this shared, multi-terminal working directory.** RDXmin installs hooks (`PostToolUse`) and a marketplace plugin across every configured agent (Claude Code, Cursor, Windsurf, Cline, Kiro, Codex, Gemini, Copilot) via `npx rdxmin` - a global install, not project-scoped. Given this session's own branch-collision incident earlier today (multiple concurrent Claude Code terminals in this repo), a global hook install is exactly the kind of change that should be piloted in isolation, not rolled out mid-session.

## Findings

### What RDXmin is

RDXmin (`github.com/jaypokale/rdxmin`, MIT license, v1.2.0 on npm as of 2026-07-10) is an open-source token-optimization layer for Claude Code and other coding agents, installed via `npx rdxmin`. It compresses three axes rather than the one axis most similar tools target:

| Axis | What it compresses | Mechanism |
|---|---|---|
| Output: prose | Filler, hedging, manufactured structure | Injected system-prompt ruleset (same category as `caveman`) |
| Output: code | Speculative abstractions, unrequested boilerplate | "YAGNI efficiency ladder" prompt rules |
| Input: context | Oversized tool output flooding the context window | `PostToolUse` hook - scrub ANSI/blank-line runs, elide oversized output (head+tail), dedup byte-identical repeats |

The input-axis hook is Claude-Code-only (it's the only agent in RDXmin's supported list that exposes a `PostToolUse` hook); the prose/code ruleset ships to every other supported agent.

### The comparison claim, checked against the source

The Reddit post's headline claim - "saved more tokens than Caveman + Ponytail combined" - traces to a real, committed benchmark in the repo (`benchmarks/results/`), not just marketing copy:

| Tool | Total bill (20-task suite) | Average task | Worst case | Backfires (task cost > no-tool baseline) |
|---|--:|--:|--:|--:|
| caveman | 80% of baseline | 98% | 424% | 6 / 20 |
| ponytail | 68% of baseline | 91% | 227% | 8 / 20 |
| RDXmin | 52% of baseline | 69% | 173% | 1 / 20 |

Two things stand out as credible rather than pure marketing: (a) the author's own re-verification run (2026-07-07) "retired one claim that didn't survive" re-testing - a self-correction most vendor benchmarks don't publish - and (b) all 24 answers across every arm of the July re-run graded correct, so the claimed savings aren't coming from lower-quality output. Both are still self-reported, though - no independent party has re-run this suite.

### How this squares with ZAO OS's own prior caveman research (docs 357, 362)

Doc 362 (STANDARD tier, 2026-05-21) already did the skeptical version of this exercise for caveman and found its 75%-savings marketing claim collapses to 4-10% of real total session cost once you account for prose being only ~24% of output tokens, and output being only 15-20% of total session cost. That doc's Key Decision 3 was explicit: prioritize `/compact` (40-70% savings at context breakpoints) over caveman, because caveman's ceiling is structurally small (it only ever touches prose).

RDXmin's input-axis hook is aimed at a structurally different, larger target: tool output, which doc 362 didn't touch and which RDXmin's own numbers put at 67.5% of context content in a real corpus. If that number holds up under independent testing, RDXmin's real-world ceiling could plausibly clear caveman's by a wider margin than the output-axis comparison alone suggests - but this is inference from RDXmin's own reported numbers, not an independent measurement, so it stays a hypothesis pending Key Decision 1.

### Community reception (11 comments, r/claudeskills)

Reception in the source thread splits along an expected line: one commenter (skeptical) called it "just a 1:1 copy of caveman and ponytail bundled," and the author's reply distinguished RDXmin by its added tool-output compressor, installer, and test suite, benchmarked against both. Another commenter pushed back specifically on the reply reading like "AI slop" (long em dash included) - a stylistic tell that's become a community shorthand for LLM-generated text, worth noting since it's the kind of signal that erodes trust in a tool's own benchmark writeups regardless of whether the underlying numbers are accurate.

## Also See

- [Doc 357 - Caveman Token Compression Skill](../357-caveman-token-compression-skill/) - what caveman is and how it's installed in this repo's Claude Code setup
- [Doc 362 - Caveman Token Savings Analysis](../362-caveman-token-savings-analysis/) - the independent-measurement methodology this doc leans on; caveman's real 4-10% vs claimed 75%

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pilot `npx rdxmin --dry-run` in an isolated worktree/throwaway session (not this shared checkout) to see what it actually changes before any real install | @Zaal | Spike | 2026-07-17 |
| If the dry-run looks safe, re-run RDXmin's own benchmark methodology (or a ZAO-OS-shaped equivalent: real `npm test`/`git diff`/curl-heavy sessions) independently before adopting, mirroring doc 362's approach to caveman | @Zaal | Spike | 2026-07-24 |
| Skip installing RDXmin fleet-wide (all agents) - if adopted, scope to `--only claude` per the tool's own install flag, since ZOE's own agent stack doesn't run Cursor/Windsurf/etc | @Zaal | Decision | 2026-07-24 |

## Sources

- [Reddit thread - "I built RDXmin — a Claude Code optimizer that saved more tokens than Caveman + Ponytail combined"](https://www.reddit.com/r/claudeskills/comments/1ushfni/i_built_rdxmin_a_claude_code_optimizer_that_saved/) (u/Special_Lie3814, 30 points, 11 comments) [FULL - fetched via old.reddit.com mirror after www.reddit.com, 10 Redlib mirrors, WebFetch, jina.ai, and Google Translate proxy were all blocked by network/bot-detection from this session's egress IP]
- [github.com/jaypokale/rdxmin](https://github.com/jaypokale/rdxmin) - 23 stars, 1 fork, MIT license, created 2026-06-30 [FULL]
- [RDXmin README (raw)](https://raw.githubusercontent.com/jaypokale/rdxmin/main/README.md) - benchmark tables, install instructions, axis breakdown [FULL]
- [npmjs.com/package/rdxmin](https://registry.npmjs.org/rdxmin) - v1.2.0, first published 2026-06-30 [FULL - registry metadata only, not the full package listing page]
- [Doc 357 - Caveman Token Compression Skill](../357-caveman-token-compression-skill/) [FULL - local]
- [Doc 362 - Caveman Token Savings Analysis](../362-caveman-token-savings-analysis/) [FULL - local]
