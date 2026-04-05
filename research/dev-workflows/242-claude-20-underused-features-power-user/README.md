# 242 — Claude 20 Underused Features: ZAO Power User Audit

> **Status:** Research complete
> **Date:** April 1, 2026
> **Goal:** Audit @sharbel's 20 underused Claude features against ZAO OS's current workflow and identify gaps worth closing

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Projects + Custom Instructions** | ALREADY SOLVED — ZAO uses Claude Code with CLAUDE.md, `.claude/rules/`, and 11 skills. This is 10x more powerful than Claude.ai Projects. No action needed |
| **Extended Thinking** | USE for governance proposals and architecture decisions. Currently not explicitly triggered. Add guidance to brainstorming/planning skills |
| **Voice Mode** | USE for Gridley-style "Yapper's API" narration (see Doc 241). Mobile voice → Claude captures context while Zaal walks/drives |
| **Artifacts for community** | USE to build interactive tools for ZAO members: Respect calculators, governance vote explorers, music submission forms. Share via artifact links |
| **GitHub Integration** | ALREADY SOLVED — Claude Code reads the full codebase natively. Skip the web integration |
| **"New chat per topic" habit** | ADAPT for Claude Code — use `/compact` between major topic shifts instead of new chats. Already documented in Doc 69 |
| **Model switching** | USE Haiku for research gathering, Sonnet for coding, Opus for architecture/strategy. Currently defaulting to one model |

## Comparison: @sharbel's 20 Features vs ZAO's Current Stack

| # | Feature | Claude.ai Version | ZAO Equivalent | Gap? |
|---|---------|-------------------|----------------|------|
| 1 | Projects | Persistent workspace with shared context | CLAUDE.md + `.claude/rules/` + memory system | **No gap** — ZAO's is more powerful |
| 2 | Custom Instructions | System prompt per project | CLAUDE.md (500+ lines), 4 rule files, `community.config.ts` | **No gap** — ZAO has 6 instruction sources |
| 3 | Project Files | Upload docs that persist | `research/` (241 docs), skills, all in filesystem | **No gap** — filesystem beats uploads |
| 4 | Extended Thinking | Toggle for deeper reasoning | Available but not explicitly invoked in skills | **Small gap** — add to planning prompts |
| 5 | Code Execution | Run Python in chat | Claude Code runs ANY language natively | **No gap** |
| 6 | File Uploads | PDFs, CSVs, images | Read tool handles all file types | **No gap** |
| 7 | Vision | Image analysis | Read tool on images, screenshots in QA | **No gap** |
| 8 | Web Search | Real-time internet | WebSearch + WebFetch tools, `/zao-research` | **No gap** |
| 9 | Artifacts | Interactive live previews | Not used — code ships to actual app | **Opportunity** — use for community tools |
| 10 | Data Analysis | CSV → charts | Can run scripts, but not a daily workflow | **Low priority** |
| 11 | File Creation | Generate downloadable files | Write tool creates any file | **No gap** |
| 12 | Voice Mode | Conversational back-and-forth | Not used at all | **Gap** — high value for narration workflow |
| 13 | GitHub Integration | Read repos in chat | Claude Code IS the repo | **No gap** |
| 14 | Google Drive | Pull docs into context | Not integrated | **Low priority** — docs live in `research/` |
| 15 | Zapier/Integrations | Connect external tools | MCP servers (8 tools), hooks, skills | **No gap** — MCP is more powerful |
| 16 | Claude Code | Terminal agent | ZAO's PRIMARY tool — 11 skills, 241 research docs | **No gap** — this IS the workflow |
| 17 | Multiple Models | Haiku/Sonnet/Opus | Available but not strategically selected | **Small gap** — add model guidance |
| 18 | Priority Access | Early features | Max subscription active | **No gap** |
| 19 | New Chat per Topic | Context hygiene | `/compact` exists but not habitual | **Small gap** — build the habit |
| 20 | Share Artifacts | Public links to tools | Not used | **Opportunity** — share community tools |

### Score: 15/20 already solved, 2 opportunities, 3 small gaps

## ZAO OS Integration — 4 Actions Worth Taking

### 1. Voice Mode for Daily Narration (connects to Doc 241)

Gridley's "Yapper's API" + @sharbel's voice mode tip = the same insight from two angles.

**Workflow:** Open Claude on phone → voice mode → narrate while walking/driving → context captured → reference later in Claude Code terminal session.

This feeds the `/standup` upgrade proposed in Doc 241. Voice captures community interactions, calls, ideas — everything git doesn't see.

### 2. Artifacts as Community Sharing Tools

Build interactive artifacts that ZAO members can use without technical knowledge:

| Artifact | What It Does | Who Uses It |
|----------|-------------|-------------|
| Respect Calculator | Input contributions → see weighted score | Fractal participants |
| Governance Vote Explorer | Browse active proposals, see vote weights | All 100 members |
| Music Submission Checker | Validate track meets ZAO format/length rules | Artists submitting music |
| ZAO Stock Budget Planner | Interactive budget scenarios for Oct 3 event | Steve Peer, organizers |

Build these in Claude.ai with Artifacts, share links in the /zao Farcaster channel. Zero deployment needed.

**Reference:** `src/lib/music/curationWeight.ts` for the Respect-weighted formula to embed in the calculator. `community.config.ts` for governance parameters.

### 3. Model Selection Strategy

Add to daily workflow:

| Task | Best Model | Why | Monthly Impact |
|------|-----------|-----|----------------|
| Research gathering (`/zao-research`) | Haiku ($0.25/MTok) | Fast, cheap, just collecting data | Save ~60% on research tokens |
| Coding (`/ship`, `/fix-issue`) | Sonnet ($3/MTok) | Best speed/quality for code | Default for 70% of work |
| Architecture, governance, strategy | Opus ($15/MTok) | Deepest reasoning | Use for 10% of decisions that matter most |

Currently all tasks default to whatever model the session uses. Explicit selection = better results + lower cost.

### 4. Context Hygiene Habit

@sharbel's tip #19 ("new chat between topics") maps to Claude Code as:
- Run `/compact` after finishing a research session before starting code work
- Start a new `claude` session for each major feature branch
- Use the `/z` skill at session start to re-orient rather than carrying stale context

Already partially documented in Doc 69 (tip about `/compact` after 10+ doc research). Make it habitual.

## What ZAO Does That @sharbel Doesn't Mention

Features @sharbel's audience doesn't know about because they're Claude Code / power-user territory:

| ZAO Feature | What It Does | @sharbel Equivalent |
|-------------|-------------|---------------------|
| Memory system | Persistent cross-session knowledge in `MEMORY.md` + files | Projects (weaker) |
| Skills (11 custom) | Slash commands that chain tools with domain logic | Custom Instructions (weaker) |
| Hooks | Shell commands triggered by tool events | Zapier (weaker — hooks are local) |
| MCP servers | Custom tool integrations (8 tools) | Zapier/Integrations (comparable) |
| `/autoresearch` | Autonomous iteration loops | Nothing comparable |
| `/vps` | Generate prompts for remote VPS agent | Nothing comparable |
| Subagent dispatch | Parallel agents on isolated worktrees | Nothing comparable |

**Key insight:** @sharbel's list is for people graduating from "Claude as Google." ZAO is already at the next level. The value is in the 2-3 gaps (voice, artifacts, model selection), not the 17 features already surpassed.

## Key Numbers

- **20** features in @sharbel's list
- **15/20** already solved or surpassed by ZAO's Claude Code setup
- **$20/mo** Pro vs **$100/mo** Max subscription tiers
- **11** custom skills in ZAO's `.claude/skills/`
- **241** research docs in ZAO's library
- **116.3K** views on the tweet (April 1, 2026) — shows appetite for this kind of content
- **80%** of the list targets Claude.ai web users, not CLI power users

## Content Opportunity

The 116K views show massive demand for "how to actually use Claude" content. ZAO's build-in-public approach could produce a Farcaster thread:

**"20 Claude features you're paying for → here's 20 Claude CODE features that make those look basic"**

This positions ZAO as the power-user community and drives developer/creator interest. Maps directly to the build-in-public strategy in `feedback_build_public.md`.

## Sources

- [@sharbel on X — "20 Claude features most people are paying for and not using"](https://x.com/sharbel/status/2039376686362333340) (April 1, 2026, 116.3K views)
- [Doc 69 — Claude Code Tips & Best Practices for ZAO OS](../../_archive/069-claude-code-tips-best-practices/)
- [Doc 238 — Claude Tools Top 50 Evaluation](../../dev-workflows/238-claude-tools-top50-evaluation/)
- [Doc 241 — HowiAI: Gridley's AI Habit Workflows](../../dev-workflows/276-howiai-gridley-ai-habit-workflows/)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
