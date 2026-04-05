# 243 — Claude Intermediate Guide (AI Edge): Cowork, Skills 2.0, Dispatch & Prompting

> **Status:** Research complete
> **Date:** April 1, 2026
> **Goal:** Extract actionable insights from @aiedge_'s intermediate Claude guide (4M+ views on Part 1) and audit against ZAO OS's current Claude Code workflow
> **Source:** [@aiedge_ on X](https://x.com/aiedge_/status/...) — "The Ultimate Intermediate's Guide to Claude (April 2026)" by Miles Deutscher

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Structured XML prompting** | ALREADY SOLVED — ZAO skills use XML tags extensively (`<role>`, `<context>`, etc.) in `.claude/skills/`. No action needed |
| **Reverse prompting** | USE for content brainstorming — add to `/brainstorm` skill preamble: "Ask me 10-20 questions before drafting." Already partially in `superpowers:brainstorming` but not explicit |
| **Extended Thinking triggers** | USE — add "Think deeply before responding" to planning/architecture skills. Doc 242 flagged this same gap. Add to `superpowers:writing-plans` and `superpowers:brainstorming` |
| **Chain prompting** | ALREADY SOLVED — ZAO's skill chaining (e.g., `/brainstorm` → `/plan` → `/ship`) is a more structured version of this |
| **Feedback looping** | ALREADY SOLVED — `/simplify`, `superpowers:requesting-code-review`, and iterative autoresearch loops handle this |
| **Project Instructions** | ALREADY SOLVED — CLAUDE.md (500+ lines) + 4 rule files + `community.config.ts` + 11 skills. ZAO's setup is 10x more powerful than Claude.ai Projects |
| **Skills 2.0 (evals/A/B testing)** | USE evals on ZAO's 5 most-used skills (`zao-research`, `ship`, `investigate`, `qa`, `autoresearch`). One dev improved skill success from 67% to 94% in 2 cycles |
| **Skills 2.0 trigger optimization** | USE on low-trigger skills — auto-rewrites skill descriptions until they fire reliably. Anthropic saw 5/6 skills improve |
| **Cowork scheduled tasks** | USE for 3 ZAO automations: daily `/z` status brief, weekly `/retro`, Friday `/standup` content draft. Runs on claude.ai/code/scheduled (cloud, no desktop required) |
| **Cowork Dispatch** | USE for mobile-to-desktop task delegation — Zaal can text Claude from phone to run research, check builds, or draft content while away from laptop |
| **Cowork Projects** | SKIP — Claude Code's filesystem-based project structure is superior. Cowork Projects are for claude.ai users |
| **Cowork Plugins** | INVESTIGATE — "entire roles in one place" sounds like a superset of Skills. Check if ZAO's 11 skills would benefit from plugin packaging |
| **Claude in Chrome extension** | USE for QA dogfooding — browse zaoos.com with Claude reading the page, faster than `/qa` for spot checks |
| **Memory management** | ALREADY SOLVED — ZAO has MEMORY.md + 243 research docs + project memories. More sophisticated than claude.ai's memory UI |
| **Artifacts for community tools** | USE — Doc 242 also recommended this. Build shareable Respect calculators, governance vote explorers, music submission previews as artifacts |

## Comparison: Article's 5 Sections vs ZAO's Stack

| Section | Article's Recommendation | ZAO Equivalent | Gap? | Action |
|---------|-------------------------|----------------|------|--------|
| **I. Prompting** | XML tags, reverse prompting, extended thinking, chain prompting, feedback loops | Skills with XML, brainstorming skill, autoresearch loops | **Small gap** — reverse prompting and extended thinking not explicit | Add to 2 skills |
| **II. Projects** | Custom instructions, selective file uploads, Skills integration | CLAUDE.md, `.claude/rules/`, 243 research docs, 11 skills | **No gap** — ZAO's is 10x more powerful | None |
| **III. Skills** | Skill-Creator, evals, A/B testing, trigger optimization | 11 custom skills + 30+ gstack/superpowers | **Gap** — not using evals or trigger optimization | Run evals on top 5 skills |
| **IV. Cowork** | Scheduled tasks, Dispatch, Projects, Plugins, file access | Claude Code CLI, `/loop`, `/schedule`, hooks | **Gap** — not using Dispatch or scheduled cloud tasks | Set up 3 scheduled tasks + Dispatch |
| **V. Other Tools** | Artifacts, Chrome extension, memory management | Write tool, `/qa` + `/browse`, MEMORY.md | **Small gap** — not using Chrome extension or artifacts | Install Chrome extension |

## Skills 2.0 Deep Dive — New Features Worth Using

### Evals (Built-in Testing)

How it works: define test prompts + expected output criteria. Claude runs the skill twice (loaded vs not loaded), scores both against your criteria. A separate Claude instance reviews both outputs blind and picks a winner.

**ZAO action:** Create eval suites for these 5 skills:

| Skill | Test Prompts | Success Criteria |
|-------|-------------|-----------------|
| `zao-research` | "Research XMTP v4 for ZAO" | Has comparison table, 3+ numbers, 2+ sources, file paths |
| `ship` | "Ship the current branch" | Runs tests, creates PR, bumps version |
| `investigate` | "Debug the 500 error on /api/stream" | Root cause identified before fix attempted |
| `qa` | "QA test the governance page" | Screenshots taken, bugs found with repro steps |
| `autoresearch` | "Optimize music player load time" | Measurable metric tracked, iterations logged |

**Effort:** 15-30 min per skill. Expected improvement: 20-30% success rate increase based on community reports (67% → 94% in 2 cycles).

### A/B Testing

Compare two versions of a skill. Claude reviews both outputs without knowing which is which. USE this when iterating on skill rewrites — objective comparison instead of gut feel.

### Trigger Optimization

Automated process that rewrites your skill's description until it fires reliably. Splits tests into 60% training / 40% held-out. Anthropic saw 5/6 public skills improve. USE on skills that sometimes don't trigger when they should (e.g., `investigate` not firing on "why is this broken?").

## Cowork Features — ZAO Integration Plan

### Scheduled Tasks (Priority: HIGH)

Available at `claude.ai/code/scheduled` — runs on Anthropic's cloud, no desktop required.

| Task | Schedule | Prompt | Output |
|------|----------|--------|--------|
| Daily status brief | 9am EST daily | `/z` equivalent — branch status, uncommitted changes, recent commits | Summary to review before starting work |
| Weekly retro | Friday 5pm EST | `/retro` — analyze week's commits, patterns, quality | Build-in-public content draft |
| Research freshness check | Monday 9am | Scan `research/` for docs older than 30 days referencing fast-moving topics | List of docs needing updates |

**Limitation:** Desktop scheduled tasks only run when computer is awake + Claude Desktop open. Cloud version at claude.ai/code/scheduled has no such limitation. USE the cloud version.

### Dispatch (Priority: MEDIUM)

Text Claude from phone → agent executes on desktop. Available on Max plan ($100-$200/mo).

**ZAO use cases:**
1. "Run `/z` and tell me if anything needs attention" — mobile status check
2. "Research [topic] and save to research library" — research while walking
3. "Check if the build is passing on main" — CI status from phone
4. "Draft a standup post about today's work" — content while commuting

### Chrome Extension (Priority: LOW)

Download from [Chrome Web Store](https://chromewebstore.google.com/publisher/anthropic). USE for:
- Quick QA spot-checks on zaoos.com without full `/qa` session
- Reading competitor Farcaster clients with Claude analyzing the page
- Reviewing GitHub PRs with Claude reading the diff in-browser

## Prompting Techniques — What's New for ZAO

### Reverse Prompting (Add to Skills)

The article's strongest recommendation for intermediate users. Instead of writing the prompt, ask Claude to question you until it has full context.

**Implementation:** Add this preamble to `superpowers:brainstorming`:
```
Before generating any ideas, ask me 10-20 questions to gather context about:
- Who this is for (which ZAO members/audience)
- What success looks like
- What constraints exist (time, budget, tech)
- What we've already tried
```

This aligns with `feedback_brainstorm_before_writing.md` — Zaal wants to brainstorm before Claude writes.

### Extended Thinking (Add to Planning)

Add explicit triggers to `superpowers:writing-plans` and architecture decisions:
```
Think deeply before responding. Reason through trade-offs step by step.
```

Doc 242 flagged the same gap. Two docs now recommend this — priority bumped.

## ZAO OS Integration

These features connect to the existing skill and workflow infrastructure:

- **Skills 2.0 evals** → Run against skills in `.claude/skills/` — start with `zao-research` skill at `.claude/skills/zao-research/`
- **Scheduled tasks** → Complements existing `/loop` skill (`.claude/skills/loop/`) and `/schedule` skill (`.claude/skills/schedule/`)
- **Dispatch** → Mobile complement to `/vps` skill (`.claude/skills/vps/`) for remote task execution
- **Chrome extension** → Supplements `/qa` and `/browse` skills for lighter-weight site checks
- **Reverse prompting** → Enhances `superpowers:brainstorming` skill behavior
- **Extended thinking** → Add to `superpowers:writing-plans` and `superpowers:brainstorming`

## Article Quality Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| Accuracy | 8/10 | Features described correctly, some oversimplification (e.g., "Claude was trained on XML" is a stretch) |
| Relevance to ZAO | 6/10 | Targets claude.ai web users — ZAO uses Claude Code which already solves 70% of this |
| Actionable insights | 7/10 | Skills 2.0 evals, Dispatch, and scheduled tasks are genuinely new and useful |
| Audience | Intermediate claude.ai users, not Claude Code power users |
| Views | Part 1 had 4M+ views, Part 2 had 37.9K views at time of capture |

**Content opportunity:** "The Ultimate Guide to Claude CODE (not claude.ai)" — ZAO's setup (CLAUDE.md, 11 skills, 243 research docs, MCP servers, autoresearch loops) is significantly more advanced than anything in this article. Build-in-public content showing what's possible.

## Sources

- [@aiedge_ intermediate guide (X/Twitter, April 1, 2026)](https://x.com/aiedge_)
- [Claude Cowork Help Center](https://support.claude.com/en/articles/13345190-get-started-with-cowork)
- [Claude Dispatch explained (lowcode.agency)](https://www.lowcode.agency/blog/claude-dispatch-explained)
- [Claude Skills 2.0 complete guide (the-ai-corner.com)](https://www.the-ai-corner.com/p/claude-skills-complete-guide-2026)
- [Claude Code Skills 2.0: Evals, Benchmarks and A/B Testing (pasqualepillitteri.it)](https://pasqualepillitteri.it/en/news/341/claude-code-skills-2-0-evals-benchmarks-guide)
- [Anthropic blog: Improving skill-creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)
- [Schedule recurring tasks in Cowork (Claude Help Center)](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-cowork)
- [Claude scheduled tasks on the web (Claude Code Docs)](https://code.claude.com/docs/en/web-scheduled-tasks)
- [Storyboard18: Anthropic introduces Dispatch](https://www.storyboard18.com/digital/anthropic-introduces-dispatch-feature-turning-claude-into-a-remote-ai-assistant-ws-l-92666.htm)
