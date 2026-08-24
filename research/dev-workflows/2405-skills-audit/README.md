---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-24
superseded-by:
related-docs: "154, 2404, 2403"
original-query: "https://x.com/fareanfts/status/2091538403611533820 /zao-research this please and then review all our skills and auto research them"
tier: STANDARD
---

# 2405 - We have 75 skills. The problem is not that we need more.

> **Goal:** Research a widely-shared "17 skills to install" article, then audit
> ZAO's own skill estate against it. The article is honest and useful. The audit
> finds the opposite of what the article recommends: ZAO's constraint is not
> missing skills, it is 75 of them with no way to know which ones work.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Do NOT install the 17.** | We have 75 skills and functional overlap with most of the list already. Adding 17 more addresses a problem we do not have. |
| 2 | **The article is GROUNDED - verified, not assumed.** | Three star counts spot-checked against the GitHub API: 74,634 vs "~73k", 2,981 vs "~3k", 277 vs "~270". All three MIT. The author rounded honestly. That is rarer than the advice is useful. |
| 3 | **Adopt one thing from it: the install-order discipline.** | Its most useful section is *"what to skip on day one."* ZAO has never pruned; it has only added. |
| 4 | **The real finding is the estate itself: 1.24 MB of SKILL.md across 75 skills.** | One skill is **126 KB**. Nothing measures which ones fire, which ones work, or which have silently rotted. |
| 5 | **`quick-grill` is NOT lost. Correct the rule that says it is.** | `vanishing-dependencies.md` lists it among four things that vanished, "unrecoverable except from a session that happened to have it loaded." It is present AND git-tracked at `claude/skills/quick-grill/SKILL.md`. |

## The article, verified

**"17 Skills I Would Install on a Fresh Hermes Setup"** by **@FareaNFts**, an X
Article published 2026-08-23, 607 likes, 50,439 views. Recovered in full (14,878
chars of prose from a 71 KB block structure) through the FxTwitter API - the X UI
shows only a link.

Its framing is good and worth keeping:

> *"Without skills: you re-explain the same workflow every session, quality
> depends on the model's mood, multi-step work drifts. With skills: the steps are
> written down once, the agent loads them when the task matches, you can share
> the same recipe across projects."*

That is exactly why ZAO has 75 of them.

The 17, with the repos it names:

| # | skill | repo |
|---|---|---|
| 1 | Agent-Reach | `Panniantong/Agent-Reach` |
| 2 | make-interfaces-feel-better | `jakubkrehel/make-interfaces-feel-better` |
| 3 | oh-my-hermes | `witt3rd/oh-my-hermes` |
| 4 | Anthropic Cybersecurity Skills | `mukul975/Anthropic-Cybersecurity-Skills` |
| 5 | OpenMontage | - |
| 6 | Mission Control / Minions | - |
| 7 | Resemble AI Detect | - |
| 8 | addyosmani/agent-skills | `addyosmani/agent-skills` |
| 9 | Composio skills | - |
| 10 | youtube-full | - |
| 11 | **Humanizer** | - |
| 12 | Defuddle | - |
| 13 | Matt Pocock skills | - |
| 14 | SkillClaw | - |
| 15 | Browser Harness | - |
| 16 | codebase-memory-mcp | - |
| 17 | Loop Library / Loopy | - |

**Spot-check result:** the three repos checked all exist, all MIT, and all three
star counts round correctly to what the article claims. No fabrication found.
That earns the rest of it a presumption of good faith - which is not the same as
verification, and the remaining 14 were not checked.

## What ZAO already has

**75 skills**, 73 with a `SKILL.md`, **1,241,948 bytes** of skill definition.

Against the 17, we already have functional equivalents for most:

| their skill | ours |
|---|---|
| 1. Agent-Reach (X, Reddit, YouTube, GitHub) | `reddit-fetch`, `fetch`, `browse`, `ingest`, `zao-fetch-*` scripts |
| 2. make-interfaces-feel-better | `design`, `design-review`, `design-consultation`, `plan-design-review` |
| 3. oh-my-hermes (orchestration) | `orchestrate`, `spawn`, `quad`, `a2a` |
| 8. addyosmani/agent-skills | `gstack` (vendored, MIT, attributed) |
| **11. Humanizer** | **`humanizer` - we already have one by that name** |
| 15. Browser Harness | `browse` (gstack), `setup-browser-cookies` |
| 16. codebase-memory-mcp | Serena MCP, plus `graphify` |
| 17. Loop Library | `autoresearch`, `orchestrate`, the VPS loops (now stopped) |

**The overlap is not a coincidence.** Both estates converged on the same needs -
fetch the web, orchestrate agents, polish UI, remember a codebase. That is
independent confirmation the categories are real, which is worth more than the
specific packages.

## The audit finding, which is the actual output

The article's advice is "install more skills." ZAO's measured position says the
opposite.

**Nothing knows which of the 75 work.**

- **`last30days` is 126,441 bytes.** One skill, 126 KB of definition. Whether it
  fires, and what it produces when it does, is unmeasured.
- **Six skills exceed 40 KB each.** `plan-ceo-review` 72 KB, `ship` 56 KB,
  `graphify` 48 KB, `design-review` 44 KB, `office-hours` 43 KB.
- **`skill-eval` exists** - it grades a skill invocation after the fact and logs
  to `~/dev/zao-claude-skills/evals/`. That is exactly the right mechanism. **No
  evidence was found that it has been run across the estate**, and this doc does
  not claim it has not - only that no such record was located.
- **Two skills have no `SKILL.md`** (75 directories, 73 definitions).

This is the same shape as everything else measured this week: the fleet produced
58,673 files and zero escalations; `fleet_status` carried `working` for 37 days;
the grill holds 191 questions. **Production is not the constraint. Knowing what
of it is real is the constraint.**

## The correction

`vanishing-dependencies.md` names four things that disappeared, including:

> *"`quick-grill` skill - Never in git, gone from disk. A skill he built on
> 2026-08-07, unrecoverable except from a session that happened to have it
> loaded."*

**It is present.** `~/.claude/skills/quick-grill/SKILL.md` exists AND
`git ls-files` in `zaal-dotfiles` returns `claude/skills/quick-grill/SKILL.md`,
so it is tracked.

The rule was true when written. Someone restored it and the rule was never
updated - the same stale-absence-claim failure that `thread-discipline.md` had,
corrected earlier the same week. **An absence claim in a rule file decays toward
telling people something is unrecoverable when it is sitting on disk.**

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Correct the `quick-grill` entry in `vanishing-dependencies.md` - present and git-tracked | @Zaal (Claude) | Rule PR | 2026-08-27 |
| Run `skill-eval` across the 10 largest skills to find out which fire and which produce anything | @Zaal (Claude) | Audit | 2026-09-03 |
| Identify the two skill directories with no `SKILL.md` - broken or intentional | @Zaal (Claude) | Cleanup | 2026-08-30 |
| Decide whether `last30days` at 126 KB earns its size, or is one skill doing five jobs | @Zaal | Decision | 2026-09-05 |
| Do NOT install the 17. Revisit only if the audit finds a real gap | @Zaal | Decision | standing |

## Honest limits

- **14 of the 17 repos were not checked.** Three were, and all three were
  accurate. That is a sample, not a verification.
- **The functional-equivalence table is a judgement**, made by reading skill
  names and the article's descriptions. It is not a feature comparison, and a
  named overlap may hide a real capability gap.
- **No skill was executed during this audit.** Sizes and counts are file
  measurements. Nothing here says any of the 75 works or does not.
- The article is one person's opinion with a follow-me at the end. Its value is
  the category list and the install-order discipline, not the specific packages.

## Sources

- [FULL - fetched 2026-08-24 via `api.fxtwitter.com`] X Article `2090755984251863042`, *"17 Skills I Would Install on a Fresh Hermes Setup (10x Powerful Hack)"* by **@FareaNFts**, published 2026-08-23. 607 likes, 50,439 views. Full content recovered from the article block structure; the tweet body itself is only a `t.co` link.
- [FULL - fetched 2026-08-24] `api.github.com/repos/` for `Panniantong/Agent-Reach` (74,634 stars, MIT), `jakubkrehel/make-interfaces-feel-better` (2,981, MIT), `witt3rd/oh-my-hermes` (277, MIT) - the grounding spot-check.
- [FULL - measured 2026-08-24] `~/.claude/skills/` - 75 directories, 73 `SKILL.md`, 1,241,948 bytes total, largest six listed above.
- [FULL - verified 2026-08-24] `git ls-files claude/skills/quick-grill/` in `zaal-dotfiles` - the correction.
- Doc 154 (the skills master reference), doc 2404 (the workflow that independently derived four ZAO rules).
- Credit: **@FareaNFts** for an article whose numbers survive checking.
